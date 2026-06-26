#!/usr/bin/env node
/* ═══════════════════════════════════════════════════════════
   SEMrush Scan — SEO + PPC competitive intelligence
   ═══════════════════════════════════════════════════════════
   Feeds the Research phase of a campaign. Pulls domain overview,
   organic + paid keywords, organic competitors, and keyword-gap
   data from the SEMrush Analytics API and writes a structured
   research/seo_intel.json (the SEO twin of AdSpyder's scan).

   Usage:
     SEMRUSH_API_KEY=xxx node scripts/semrush-scan.mjs --campaign ko-lake-retreats
     SEMRUSH_API_KEY=xxx node scripts/semrush-scan.mjs --domain kolakevilla.com --database uk

   Config (optional, per campaign):
     campaigns/<slug>/research/semrush_config.json
       { target_domain, database, competitor_domains[], tracked_keywords[] }

   Output:
     campaigns/<slug>/research/seo_intel.json   (with --campaign)
     research/seo_intel.json                    (otherwise)

   Requires: a SEMrush subscription WITH the API-units add-on. See SECURITY.md.
   ═══════════════════════════════════════════════════════════ */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { SemrushClient } from './semrush-client.mjs';

const C = {
  reset: '\x1b[0m', green: '\x1b[32m', yellow: '\x1b[33m',
  red: '\x1b[31m', cyan: '\x1b[36m', dim: '\x1b[2m', bold: '\x1b[1m',
};
function log(icon, msg) { console.log(`  ${icon}  ${msg}`); }
function logSection(title) { console.log(`\n${C.cyan}  ── ${title} ──${C.reset}`); }

// ── Parse CLI args ──────────────────────────────────────────
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else { args[key] = true; }
    }
  }
  return args;
}

// ── Resolve targets from CLI args + campaign config + market DNA ──
function resolveConfig(args) {
  let researchDir = 'research';
  let cfg = {};

  if (args.campaign) {
    const campaignDir = join('campaigns', args.campaign);
    if (!existsSync(campaignDir)) {
      throw new Error(`Campaign folder not found: ${campaignDir}`);
    }
    researchDir = join(campaignDir, 'research');
    const cfgPath = join(researchDir, 'semrush_config.json');
    if (existsSync(cfgPath)) cfg = JSON.parse(readFileSync(cfgPath, 'utf-8'));

    // Fall back to market_dna.json url + hooks if config is sparse
    const dnaPath = join(researchDir, 'market_dna.json');
    if (existsSync(dnaPath)) {
      const dna = JSON.parse(readFileSync(dnaPath, 'utf-8'));
      if (!cfg.target_domain && dna.url) {
        cfg.target_domain = dna.url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      }
      if ((!cfg.tracked_keywords || cfg.tracked_keywords.length === 0) && Array.isArray(dna.hooks)) {
        cfg.tracked_keywords = dna.hooks;
      }
    }
  }

  // CLI overrides win
  if (args.domain) cfg.target_domain = args.domain;
  if (args.database) cfg.database = args.database;
  if (args.limit) cfg.display_limit = Number(args.limit);

  cfg.database = cfg.database || process.env.SEMRUSH_DATABASE || 'us';
  cfg.competitor_domains = cfg.competitor_domains || [];
  cfg.tracked_keywords = cfg.tracked_keywords || [];

  return { researchDir, cfg };
}

async function safe(label, promise) {
  try { return await promise; }
  catch (err) { log('⚠️', `${C.yellow}${label} failed: ${err.message}${C.reset}`); return { _error: err.message }; }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log('');
  console.log('  ┌──────────────────────────────────────────┐');
  console.log('  │  🔎  SEMrush Scan — SEO + PPC Intel       │');
  console.log('  └──────────────────────────────────────────┘');

  const key = process.env.SEMRUSH_API_KEY;
  if (!key) {
    log('❌', `${C.red}SEMRUSH_API_KEY not set. Export it or pass inline:${C.reset}`);
    log('  ', `${C.dim}SEMRUSH_API_KEY=xxx node scripts/semrush-scan.mjs --campaign ko-lake-retreats${C.reset}`);
    log('  ', `${C.dim}Requires a SEMrush subscription with the API-units add-on. See SECURITY.md.${C.reset}`);
    process.exit(1);
  }
  log('🔑', 'SEMRUSH_API_KEY loaded'); // never log key material (CodeQL js/clear-text-logging)

  let researchDir, cfg;
  try { ({ researchDir, cfg } = resolveConfig(args)); }
  catch (err) { log('❌', `${C.red}${err.message}${C.reset}`); process.exit(1); }

  if (!cfg.target_domain) {
    log('❌', `${C.red}No target domain. Pass --domain <d> or add target_domain to semrush_config.json.${C.reset}`);
    process.exit(1);
  }

  logSection('Configuration');
  log('🎯', `Target domain: ${cfg.target_domain}`);
  log('🌍', `Database: ${cfg.database}`);
  log('🏷️', `Tracked keywords: ${cfg.tracked_keywords.length}`);
  log('🥊', `Competitor domains: ${cfg.competitor_domains.length}`);

  const client = new SemrushClient(key, { database: cfg.database, displayLimit: cfg.display_limit || 50 });

  logSection('Pulling SEMrush Reports');
  log('⏳', 'Querying Analytics API (consumes API units)...');
  const start = Date.now();

  const domain_overview = await safe('Domain overview', client.domainOverview(cfg.target_domain));
  const top_organic_keywords = await safe('Organic keywords', client.organicKeywords(cfg.target_domain));
  const top_paid_keywords = await safe('Paid keywords', client.paidKeywords(cfg.target_domain));
  const organic_competitors = await safe('Organic competitors', client.organicCompetitors(cfg.target_domain));

  // Keyword-gap discovery: overview for each tracked keyword (capped to protect units)
  const keyword_intel = [];
  for (const kw of cfg.tracked_keywords.slice(0, 10)) {
    const res = await safe(`Keyword overview "${kw}"`, client.keywordOverview(kw));
    keyword_intel.push({ keyword: kw, data: Array.isArray(res) ? res[0] || null : res });
  }

  const elapsed = ((Date.now() - start) / 1000).toFixed(1);

  const seoIntel = {
    tool: 'semrush',
    version: '1.0.0',
    target_domain: cfg.target_domain,
    database: cfg.database,
    domain_overview: Array.isArray(domain_overview) ? domain_overview[0] || null : domain_overview,
    top_organic_keywords,
    top_paid_keywords,
    organic_competitors,
    keyword_intel,
    _metadata: {
      generated_at: new Date().toISOString(),
      elapsed_seconds: parseFloat(elapsed),
      source: 'SEMrush Analytics API v3',
      reports: ['domain_ranks', 'domain_organic', 'domain_adwords', 'domain_organic_organic', 'phrase_this'],
    },
  };

  const outPath = join(researchDir, 'seo_intel.json');
  writeFileSync(outPath, JSON.stringify(seoIntel, null, 2), 'utf-8');

  logSection('Results');
  log('✅', `${C.green}Scan complete in ${elapsed}s${C.reset}`);
  log('📄', `Output: ${outPath}`);
  log('📈', `Organic keywords: ${Array.isArray(top_organic_keywords) ? top_organic_keywords.length : 0}`);
  log('💰', `Paid keywords: ${Array.isArray(top_paid_keywords) ? top_paid_keywords.length : 0}`);
  log('🥊', `Organic competitors: ${Array.isArray(organic_competitors) ? organic_competitors.length : 0}`);
  log('🏷️', `Keyword intel rows: ${keyword_intel.length}`);
  console.log('');
  log('💡', `${C.dim}Next: feed seo_intel.json into scripts/ai-intelligence-analyst.mjs for gap analysis + ad copy.${C.reset}`);
}

main();
