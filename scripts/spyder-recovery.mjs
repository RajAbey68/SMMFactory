/**
 * SMMFactory — Spyder Error Recovery
 * Implements Test 3.2 from the spec: graceful fallback when Spyder crawl fails.
 *
 * Strategy:
 *   1. Attempt live Spyder crawl
 *   2. On failure → use cached market_dna.json if it exists
 *   3. If no cache → generate manual research checklist + halt with clear error
 *   4. All failures logged for post-mortem
 *
 * Usage:
 *   import { spyderWithRecovery } from './spyder-recovery.mjs';
 *   const dna = await spyderWithRecovery({ domain: 'kolakevilla.com', campaignSlug: 'ko-lake-retreats' });
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ── Failure log ────────────────────────────────────────────────────
const LOG_PATH = 'research/spyder-failure-log.json';

function logFailure(domain, reason, recoveryAction) {
  let log = [];
  if (existsSync(LOG_PATH)) {
    try { log = JSON.parse(readFileSync(LOG_PATH, 'utf8')); } catch {}
  }

  log.push({
    timestamp: new Date().toISOString(),
    domain,
    reason,
    recovery_action: recoveryAction,
  });

  writeFileSync(LOG_PATH, JSON.stringify(log, null, 2));
  console.warn(`[SpyderRecovery] Logged failure for ${domain}: ${reason}`);
}

// ── Manual research checklist generator ───────────────────────────
function generateManualChecklist(domain, campaignSlug) {
  const checklistPath = `research/${campaignSlug}-manual-checklist.md`;
  const content = `# Manual Research Checklist — ${domain}
Generated: ${new Date().toISOString()}
Campaign: ${campaignSlug}

> Spyder automated crawl failed. Complete this checklist manually, then create
> research/market_dna.json with the findings.

## 1. Brand Colors
- [ ] Visit ${domain} and inspect the hero section
- [ ] Note primary color (the dominant brand color)
- [ ] Note accent color (CTAs, highlights)
- [ ] Note background color
- Record as hex codes (e.g., #1B5E20)

## 2. Pricing
- [ ] Find the pricing page or booking widget
- [ ] Note the lowest price point (entry-level room/service)
- [ ] Note the highest price point (premium offering)
- [ ] Note any seasonal pricing or promotions

## 3. Unique Selling Points (USPs)
- [ ] Read the homepage hero copy
- [ ] List 3-5 claims they make about their property/service
- [ ] For each USP, identify the supporting proof point (if any)
  - ✅ Good: "Lake-facing rooms — direct water access, 50m waterfront"
  - ❌ Bad: "Amazing views" (no proof)

## 4. Target Audience
- [ ] Who is their copy written for? (couples, families, business, etc.)
- [ ] What platform do they seem to advertise on? (Instagram photos? LinkedIn posts?)
- [ ] What emotions do they try to evoke?

## 5. Competitors (3-5)
For each competitor visit their site and note:
- [ ] Competitor 1: _____________ (domain: _________)
  - Hook: _______________
  - Estimated spend level: low/medium/high
- [ ] Competitor 2: _____________
- [ ] Competitor 3: _____________

## 6. Opportunity Gaps
- [ ] What are competitors NOT doing that ${domain} could own?
- [ ] Any unaddressed audience segment?
- [ ] Any proof point your client has that competitors lack?

---
Once complete, create \`research/market_dna.json\` following the schema in
\`research/strategy_foundations.md\`, then continue the campaign pipeline.
`;

  mkdirSync('research', { recursive: true });
  writeFileSync(checklistPath, content);
  return checklistPath;
}

// ── Main recovery function ─────────────────────────────────────────
/**
 * @param {object} opts
 * @param {string} opts.domain         - Domain to crawl (e.g. 'kolakevilla.com')
 * @param {string} opts.campaignSlug   - Campaign slug for file paths
 * @param {string} [opts.dnaCachePath] - Custom path to cached market_dna.json
 * @param {Function} [opts.crawlFn]    - The actual Spyder crawl function to call
 * @returns {Promise<object>}          - market_dna.json contents
 */
export async function spyderWithRecovery({
  domain,
  campaignSlug,
  dnaCachePath,
  crawlFn,
}) {
  const cacheFile =
    dnaCachePath ||
    join('campaigns', campaignSlug, 'research', 'market_dna.json');

  // ── Attempt 1: Live crawl ────────────────────────────────────────
  if (typeof crawlFn === 'function') {
    try {
      console.log(`[SpyderRecovery] Attempting live crawl of ${domain}...`);
      const dna = await Promise.race([
        crawlFn(domain),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Crawl timeout after 30s')), 30_000)
        ),
      ]);

      // Validate the result has required fields
      validateDNA(dna, domain);

      // Cache the successful result
      mkdirSync('research', { recursive: true });
      writeFileSync(cacheFile, JSON.stringify(dna, null, 2));
      console.log(`[SpyderRecovery] ✅ Live crawl succeeded. Cached to ${cacheFile}`);
      return dna;

    } catch (crawlErr) {
      console.warn(`[SpyderRecovery] ⚠️ Live crawl failed: ${crawlErr.message}`);

      // ── Attempt 2: Cached market_dna.json ─────────────────────────
      if (existsSync(cacheFile)) {
        try {
          const cached = JSON.parse(readFileSync(cacheFile, 'utf8'));
          validateDNA(cached, domain);

          logFailure(domain, crawlErr.message, `Using cached market_dna.json from ${cacheFile}`);
          console.log(`[SpyderRecovery] ✅ Using cached market_dna.json (${cacheFile})`);
          return { ...cached, _from_cache: true, _cache_path: cacheFile };

        } catch (cacheErr) {
          logFailure(domain, `${crawlErr.message} + cache corrupt: ${cacheErr.message}`, 'Manual checklist generated');
        }
      } else {
        logFailure(domain, crawlErr.message, 'No cache available — manual checklist generated');
      }

      // ── Attempt 3: Generate manual checklist + halt ────────────────
      const checklistPath = generateManualChecklist(domain, campaignSlug);
      const err = new SpyderRecoveryError(
        `Spyder crawl failed and no valid cache exists for "${domain}".\n` +
        `A manual research checklist has been generated:\n  → ${checklistPath}\n` +
        `Complete it and create research/market_dna.json to continue.`,
        { domain, campaignSlug, checklistPath, originalError: crawlErr.message }
      );
      throw err;
    }
  }

  // ── No crawlFn provided: load from cache only ────────────────────
  if (existsSync(cacheFile)) {
    const cached = JSON.parse(readFileSync(cacheFile, 'utf8'));
    validateDNA(cached, domain);
    console.log(`[SpyderRecovery] ✅ Loaded market_dna.json from cache (${cacheFile})`);
    return cached;
  }

  // No crawlFn + no cache = generate checklist
  const checklistPath = generateManualChecklist(domain, campaignSlug);
  throw new SpyderRecoveryError(
    `No crawl function provided and no cached market_dna.json for "${domain}".\n` +
    `Manual research checklist: ${checklistPath}`,
    { domain, campaignSlug, checklistPath }
  );
}

// ── DNA Validator ──────────────────────────────────────────────────
function validateDNA(dna, domain) {
  const required = ['property', 'brand', 'pricing', 'hooks'];
  const missing = required.filter((k) => !dna[k]);
  if (missing.length > 0) {
    throw new Error(
      `market_dna.json for "${domain}" missing required fields: ${missing.join(', ')}`
    );
  }
  if (!Array.isArray(dna.hooks) || dna.hooks.length < 1) {
    throw new Error(`market_dna.json for "${domain}" must have at least 1 hook`);
  }
}

// ── Custom error class ─────────────────────────────────────────────
export class SpyderRecoveryError extends Error {
  constructor(message, context = {}) {
    super(message);
    this.name = 'SpyderRecoveryError';
    this.context = context;
  }
}
