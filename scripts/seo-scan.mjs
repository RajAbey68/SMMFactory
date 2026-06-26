#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   SEO Scan — provider-neutral Research-phase intelligence
   ═══════════════════════════════════════════════════════════
   Same job as semrush-scan.mjs, but provider-agnostic. Pick the
   provider with --provider (or SEO_PROVIDER env); the canonical
   seo_intel.json output is identical regardless of provider.

   Usage:
     SEMRUSH_API_KEY=xxx   node scripts/seo-scan.mjs --provider semrush   --campaign ko-lake-retreats
     SERANKING_API_KEY=xxx node scripts/seo-scan.mjs --provider seranking --campaign ko-lake-retreats
     node scripts/seo-scan.mjs --provider seranking --domain kolakevilla.com --region uk

   Output: campaigns/<slug>/research/seo_intel.json  (or research/seo_intel.json)
   ═══════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { getProvider, SUPPORTED_PROVIDERS } from './seo-providers.mjs';
import { buildSeoIntel, sanitizeDomain, sanitizeKeyword, deriveScanStatus } from './seo-schema.mjs';
import { withRetry, classifyError } from './seo-retry.mjs';

// SE Ranking's Data API is organic-only (paidKeywords is a stub) — be honest about it.
const PAID_DATA_PROVIDERS = new Set(['semrush']);

const C = { reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m', red: '\x1b[31m', cyan: '\x1b[36m', dim: '\x1b[2m' };
const log = (icon, msg) => console.log(`  ${icon}  ${msg}`);
const logSection = (t) => console.log(`\n${C.cyan}  ── ${t} ──${C.reset}`);

// Per-provider key env var.
const KEY_ENV = { semrush: 'SEMRUSH_API_KEY', seranking: 'SERANKING_API_KEY' };

function parseArgs(argv) {
  const a = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { a[k] = next; i++; } else { a[k] = true; }
    }
  }
  return a;
}

function resolveConfig(args) {
  let researchDir = 'research';
  let cfg = {};
  if (args.campaign) {
    const dir = join('campaigns', args.campaign);
    if (!existsSync(dir)) throw new Error(`Campaign folder not found: ${dir}`);
    researchDir = join(dir, 'research');
    // Provider-agnostic seed: reuse semrush_config.json (target/competitors/keywords).
    for (const f of ['seo_config.json', 'semrush_config.json']) {
      const p = join(researchDir, f);
      if (existsSync(p)) { cfg = { ...JSON.parse(readFileSync(p, 'utf-8')), ...cfg }; break; }
    }
    const dna = join(researchDir, 'market_dna.json');
    if (existsSync(dna)) {
      const d = JSON.parse(readFileSync(dna, 'utf-8'));
      if (!cfg.target_domain && d.url) cfg.target_domain = d.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if ((!cfg.tracked_keywords || !cfg.tracked_keywords.length) && Array.isArray(d.hooks)) cfg.tracked_keywords = d.hooks;
    }
  }
  if (args.domain) cfg.target_domain = args.domain;
  if (args.region || args.database) cfg.region = args.region || args.database;
  cfg.region = cfg.region || cfg.database || process.env.SEMRUSH_DATABASE || process.env.SERANKING_SOURCE || 'us';
  // Sanitize untrusted inputs before they reach URL builders (fail fast on bad domain).
  if (cfg.target_domain) cfg.target_domain = sanitizeDomain(cfg.target_domain);
  cfg.tracked_keywords = (cfg.tracked_keywords || [])
    .map((k) => { try { return sanitizeKeyword(k); } catch { return null; } })
    .filter(Boolean);
  return { researchDir, cfg };
}

// Run a provider call with transient-failure retry; on terminal failure, tag the
// error with its taxonomy code so the artifact records WHY data is missing.
async function safe(label, thunk) {
  try { return await withRetry(thunk); }
  catch (e) {
    const code = classifyError(e);
    log('⚠️', `${C.yellow}${label} failed [${code}]: ${e.message}${C.reset}`);
    return { _error: e.message, _code: code };
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const provider = String(args.provider || process.env.SEO_PROVIDER || 'semrush').toLowerCase();

  console.log('\n  ┌──────────────────────────────────────────┐');
  console.log(`  │  🔎  SEO Scan — provider: ${provider.padEnd(16)}│`);
  console.log('  └──────────────────────────────────────────┘');

  if (!SUPPORTED_PROVIDERS.includes(provider)) {
    log('❌', `${C.red}Unknown provider "${provider}". Supported: ${SUPPORTED_PROVIDERS.join(', ')}${C.reset}`);
    process.exit(1);
  }

  const keyEnv = KEY_ENV[provider];
  const key = process.env[keyEnv];
  if (!key) {
    log('❌', `${C.red}${keyEnv} not set.${C.reset}`);
    log('  ', `${C.dim}${keyEnv}=xxx node scripts/seo-scan.mjs --provider ${provider} --campaign <slug>${C.reset}`);
    process.exit(1);
  }
  log('🔑', `${keyEnv} loaded`); // never log key material (CodeQL js/clear-text-logging)

  let researchDir, cfg;
  try { ({ researchDir, cfg } = resolveConfig(args)); }
  catch (e) { log('❌', `${C.red}${e.message}${C.reset}`); process.exit(1); }

  if (!cfg.target_domain) {
    log('❌', `${C.red}No target domain. Pass --domain or set target_domain in config.${C.reset}`);
    process.exit(1);
  }

  logSection('Configuration');
  log('🎯', `Target: ${cfg.target_domain}`);
  log('🌍', `Region/source: ${cfg.region}`);
  log('🏷️', `Tracked keywords: ${cfg.tracked_keywords.length}`);

  const prov = getProvider(provider, { key, region: cfg.region, displayLimit: cfg.display_limit || 50 });

  logSection('Pulling Reports');
  log('⏳', `Querying ${provider} (consumes API credits/units)...`);
  const start = Date.now();

  const domainOverview = await safe('Domain overview', () => prov.domainOverview(cfg.target_domain));
  const organicKeywords = await safe('Organic keywords', () => prov.organicKeywords(cfg.target_domain));
  const paidKeywords = await safe('Paid keywords', () => prov.paidKeywords(cfg.target_domain));
  const organicCompetitors = await safe('Organic competitors', () => prov.organicCompetitors(cfg.target_domain));

  const keywordIntel = [];
  for (const kw of cfg.tracked_keywords.slice(0, 10)) {
    const r = await safe(`Keyword overview "${kw}"`, () => prov.keywordOverview(kw));
    keywordIntel.push({ keyword: kw, data: r && !r._error ? r : null, error: r && r._error ? r._code : null });
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);
  const status = deriveScanStatus({ domainOverview, organicKeywords, paidKeywords, organicCompetitors, keywordIntel });
  const intel = buildSeoIntel({
    provider,
    target: cfg.target_domain,
    region: cfg.region,
    domainOverview: domainOverview && !domainOverview._error ? domainOverview : null,
    organicKeywords: Array.isArray(organicKeywords) ? organicKeywords : [],
    paidKeywords: Array.isArray(paidKeywords) ? paidKeywords : [],
    organicCompetitors: Array.isArray(organicCompetitors) ? organicCompetitors : [],
    keywordIntel,
    paidDataAvailable: PAID_DATA_PROVIDERS.has(provider),
    meta: { generated_at: new Date().toISOString(), elapsed_seconds: parseFloat(elapsed), status },
  });

  const outPath = join(researchDir, 'seo_intel.json');
  writeFileSync(outPath, JSON.stringify(intel, null, 2), 'utf-8');

  logSection('Results');
  const statusIcon = status === 'ok' ? '✅' : status === 'partial' ? '🟡' : '❌';
  const statusColor = status === 'failed' ? C.red : status === 'partial' ? C.yellow : C.green;
  log(statusIcon, `${statusColor}Scan ${status} in ${elapsed}s via ${provider}${C.reset}`);
  log('📄', `Output: ${outPath}`);
  log('📈', `Organic keywords: ${intel.organic_keywords.length}`);
  log('💰', `Paid keywords: ${intel.paid_keywords.length}${PAID_DATA_PROVIDERS.has(provider) ? '' : ' (provider has no paid API)'}`);
  log('🥊', `Organic competitors: ${intel.organic_competitors.length}`);
  log('🏷️', `Keyword intel rows: ${intel.keyword_intel.length}`);
  console.log('');
  log('💡', `${C.dim}Canonical schema — swap --provider without changing downstream consumers.${C.reset}`);

  // Optional machine-parseable summary line (zero-dep observability hook for CI/jobs).
  if (process.env.SEO_LOG_JSON) {
    console.log(JSON.stringify({
      event: 'seo_scan', provider, status, domain: cfg.target_domain, region: cfg.region,
      organic_keywords: intel.organic_keywords.length, paid_keywords: intel.paid_keywords.length,
      organic_competitors: intel.organic_competitors.length, keyword_intel: intel.keyword_intel.length,
      paid_data_available: intel._metadata.paid_data_available,
      elapsed_seconds: parseFloat(elapsed), generated_at: intel._metadata.generated_at,
    }));
  }

  // Honest exit: a scan where every call failed must not look successful to CI/callers.
  if (status === 'failed') process.exit(1);
}

main();
