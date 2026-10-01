/**
 * ingest-ad-metrics.mjs — Windsor.ai -> Supabase (SMMFactory Outbound)
 *
 * Pulls daily campaign / ad-set metrics for every connector listed in
 * AD_CONNECTORS (default: facebook,google_ads,reddit) via the Windsor.ai REST
 * API and upserts them into public.ad_metrics_daily. Every run is logged in
 * public.ad_ingest_runs. Nothing is ever invented: if Windsor returns no rows
 * for a connector, we record that fact and move on.
 *
 * Usage:
 *   node scripts/ingest-ad-metrics.mjs                 # last 7 days
 *   node scripts/ingest-ad-metrics.mjs --days 30       # backfill 30 days
 *   node scripts/ingest-ad-metrics.mjs --connectors facebook,reddit
 *   node scripts/ingest-ad-metrics.mjs --dry-run       # print, don't write
 *
 * Env (.env):
 *   WINDSOR_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   AD_CONNECTORS (optional), AD_BRAND (optional, default kolake)
 */

import { createRequire } from 'node:module';
import fs from 'node:fs';

// --- tiny .env loader (no dependency) ---------------------------------------
if (fs.existsSync('.env')) {
  for (const line of fs.readFileSync('.env', 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const DRY = args.includes('--dry-run');
const DAYS = parseInt(flag('days', '7'), 10);
const BRAND = process.env.AD_BRAND || 'kolake';
const CONNECTORS = (flag('connectors', process.env.AD_CONNECTORS || 'facebook,google_ads,reddit')).split(',').map(s => s.trim()).filter(Boolean);

const { WINDSOR_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!WINDSOR_API_KEY) die('WINDSOR_API_KEY missing');
if (!DRY && (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY)) die('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing');

const today = new Date();
const dateTo = iso(today);
const dateFrom = iso(new Date(today.getTime() - DAYS * 86400000));

// Fields differ slightly per connector; Windsor ignores unknown ones.
const FIELDS = ['date','account_id','account_name','campaign_id','campaign','adset_id','adset_name','ad_group_id','ad_group','currency','spend','impressions','clicks','reach','conversions','leads'];

// --- Supabase REST helpers -------------------------------------------------
const sb = async (path, method, body, prefer) => {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: prefer || 'return=representation',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Supabase ${method} ${path}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
};

// --- Windsor fetch ---------------------------------------------------------
async function fetchConnector(connector) {
  const url = `https://connectors.windsor.ai/${connector}?api_key=${WINDSOR_API_KEY}&fields=${FIELDS.join(',')}&date_from=${dateFrom}&date_to=${dateTo}`;
  const res = await fetch(url);
  const text = await res.text();
  if (!res.ok) throw new Error(`Windsor ${connector}: HTTP ${res.status} ${text.slice(0, 200)}`);
  let json; try { json = JSON.parse(text); } catch { throw new Error(`Windsor ${connector}: non-JSON response ${text.slice(0, 200)}`); }
  const rows = Array.isArray(json) ? json : (json.data || []);
  // Windsor puts notices in the data array on some plans — drop them.
  return rows.filter(r => r && r.date && !String(r.campaign || '').startsWith('Uh-oh') && !String(r.campaign || '').includes('manage-subscription'));
}

function normalise(connector, r) {
  return {
    source: connector,
    brand: BRAND,
    account_id: str(r.account_id),
    campaign_id: str(r.campaign_id),
    campaign_name: r.campaign ?? null,
    adset_id: str(r.adset_id ?? r.ad_group_id),
    adset_name: r.adset_name ?? r.ad_group ?? null,
    date: r.date,
    currency: r.currency ?? null,
    spend: num(r.spend),
    impressions: int(r.impressions),
    clicks: int(r.clicks),
    reach: r.reach == null ? null : int(r.reach),
    conversions: r.conversions == null ? null : num(r.conversions),
    leads: r.leads == null ? null : num(r.leads),
    raw: r,
  };
}

// --- main -------------------------------------------------------------------
(async () => {
  console.log(`▶ ingest-ad-metrics  brand=${BRAND}  ${dateFrom}..${dateTo}  connectors=${CONNECTORS.join(',')}${DRY ? '  [DRY RUN]' : ''}`);

  let run = null;
  if (!DRY) {
    [run] = await sb('ad_ingest_runs', 'POST', [{ trigger: flag('trigger', 'manual'), connectors: CONNECTORS, date_from: dateFrom, date_to: dateTo }]);
  }

  const notes = {}; let total = 0; let failures = 0;
  for (const c of CONNECTORS) {
    try {
      const rows = await fetchConnector(c);
      const recs = rows.map(r => ({ ...normalise(c, r), ingest_run_id: run?.id ?? null }));
      const spend = recs.reduce((s, r) => s + r.spend, 0);
      notes[c] = { rows: recs.length, spend: +spend.toFixed(2) };
      console.log(`  ${c.padEnd(12)} ${String(recs.length).padStart(4)} rows   spend ${spend.toFixed(2)}`);
      if (recs.length && !DRY) {
        // batch upsert on the natural key
        for (let i = 0; i < recs.length; i += 500) {
          await sb('ad_metrics_daily?on_conflict=source,brand,account_id,campaign_id,adset_id,date', 'POST', recs.slice(i, i + 500), 'resolution=merge-duplicates,return=minimal');
        }
      }
      total += recs.length;
    } catch (e) {
      failures++; notes[c] = { error: e.message };
      console.error(`  ${c.padEnd(12)} FAILED: ${e.message}`);
    }
  }

  if (!DRY) {
    const status = failures === 0 ? 'ok' : failures === CONNECTORS.length ? 'failed' : 'partial';
    await sb(`ad_ingest_runs?id=eq.${run.id}`, 'PATCH', { finished_at: new Date().toISOString(), rows_upserted: total, status, notes }, 'return=minimal');
    console.log(`✔ run #${run.id} ${status}: ${total} rows upserted`);
  } else {
    console.log(`(dry run) would upsert ${total} rows`);
  }
  process.exit(failures === CONNECTORS.length ? 1 : 0);
})().catch(e => die(e.message));

function iso(d) { return d.toISOString().slice(0, 10); }
function str(v) { return v == null ? null : String(v); }
function num(v) { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; }
function int(v) { const n = parseInt(v, 10); return Number.isFinite(n) ? n : 0; }
function die(m) { console.error('✖', m); process.exit(2); }
