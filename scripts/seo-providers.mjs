/**
 * SMMFactory — SEO provider factory (the adapter)
 * ═══════════════════════════════════════════════════════════
 * Provider-neutral interface over heterogeneous SEO/PPC providers.
 * getProvider(name) returns a uniform object whose methods ALWAYS
 * return canonical rows (see seo-schema.mjs), so seo-scan.mjs and the
 * AI analyst never care which provider produced the data.
 *
 *   getProvider('semrush'|'seranking', { key, region, client?, ...opts })
 *     -> { name, domainOverview, organicKeywords, paidKeywords,
 *          organicCompetitors, keywordOverview }
 *
 * The per-provider field maps below ARE the "normalizers" the design
 * review said were missing. Add a new provider by adding a client +
 * its two field maps + a branch here — nothing downstream changes.
 * ═══════════════════════════════════════════════════════════ */

import { SemrushClient } from './semrush-client.mjs';
import { SeRankingClient } from './seranking-client.mjs';
import { normalizeRows, normalizeRow } from './seo-schema.mjs';

// native field name -> canonical field name
const MAPS = {
  semrush: {
    keyword: { keyword: 'keyword', position: 'position', search_volume: 'volume', cpc: 'cpc', competition: 'competition', difficulty: 'difficulty', url: 'url', traffic: 'traffic_pct' },
    competitor: { domain: 'domain', relevance: 'relevance', common_keywords: 'common_keywords', organic_keywords: 'organic_keywords', organic_traffic: 'organic_traffic' },
    overview: { domain: 'domain', rank: 'rank', organic_keywords: 'organic_keywords', organic_traffic: 'organic_traffic', organic_cost: 'organic_cost', paid_keywords: 'paid_keywords' },
  },
  seranking: {
    keyword: { keyword: 'keyword', position: 'position', volume: 'volume', cpc: 'cpc', competition: 'competition', difficulty: 'difficulty', url: 'url', intents: 'intents', relevance: 'relevance' },
    competitor: { domain: 'domain', relevance: 'relevance', common_keywords: 'common_keywords', organic_keywords: 'organic_keywords', organic_traffic: 'organic_traffic' },
    overview: { domain: 'domain', rank: 'rank', organic_keywords: 'organic_keywords', organic_traffic: 'organic_traffic', organic_cost: 'organic_cost', paid_keywords: 'paid_keywords' },
  },
};

function makeProvider(name, client, map) {
  return {
    name,
    async domainOverview(domain) {
      const r = await client.domainOverview(domain);
      const row = Array.isArray(r) ? r[0] : r;
      if (!row || typeof row !== 'object') return null;
      const norm = normalizeRow(row, map.overview);
      return Object.keys(norm).length ? norm : null;
    },
    async organicKeywords(domain) {
      return normalizeRows(await client.organicKeywords(domain), map.keyword);
    },
    async paidKeywords(domain) {
      return normalizeRows(await client.paidKeywords(domain), map.keyword);
    },
    async organicCompetitors(domain) {
      return normalizeRows(await client.organicCompetitors(domain), map.competitor);
    },
    async keywordOverview(phrase) {
      const r = await client.keywordOverview(phrase);
      const row = Array.isArray(r) ? r[0] : r;
      return row ? normalizeRow(row, map.keyword) : null;
    },
  };
}

/**
 * @param {string} name 'semrush' | 'seranking'
 * @param {object} [opts] { key, region, client?, displayLimit?, rateLimit?, fetchImpl? }
 *   opts.client lets tests inject a fake native client (bypasses network/key).
 */
export function getProvider(name, opts = {}) {
  const n = String(name || 'semrush').toLowerCase().replace(/[^a-z]/g, '');
  if (n === 'semrush') {
    const client = opts.client || new SemrushClient(opts.key, { database: opts.region, displayLimit: opts.displayLimit, rateLimit: opts.rateLimit, fetchImpl: opts.fetchImpl });
    return makeProvider('semrush', client, MAPS.semrush);
  }
  if (n === 'seranking') {
    const client = opts.client || new SeRankingClient(opts.key, { source: opts.region, displayLimit: opts.displayLimit, rateLimit: opts.rateLimit, fetchImpl: opts.fetchImpl });
    return makeProvider('seranking', client, MAPS.seranking);
  }
  throw new Error(`Unknown SEO provider: "${name}". Supported: semrush, seranking.`);
}

/** Providers registered behind the adapter (for docs / validation). */
export const SUPPORTED_PROVIDERS = ['semrush', 'seranking'];
