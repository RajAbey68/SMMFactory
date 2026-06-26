/**
 * SMMFactory — Canonical seo_intel schema + cross-provider normalizers
 * ═══════════════════════════════════════════════════════════
 * The provider abstraction's contract. Every SEO/PPC provider
 * (SEMrush, SE Ranking, ...) maps its native rows to THESE
 * canonical field names, so research/seo_intel.json has one
 * stable shape regardless of which provider produced it.
 *
 * This addresses the cross-provider normalization gap flagged in
 * the independent design review: without a canonical schema, the
 * adapter is "swappable" in name only.
 * ═══════════════════════════════════════════════════════════ */

export const SEO_INTEL_VERSION = '2.0.0';

/** Canonical keyword row fields every provider normalizes to. */
export const CANONICAL_KEYWORD_FIELDS = [
  'keyword', 'position', 'volume', 'cpc', 'competition', 'difficulty', 'url', 'traffic_pct', 'intents',
];

/** Canonical competitor row fields. */
export const CANONICAL_COMPETITOR_FIELDS = [
  'domain', 'relevance', 'common_keywords', 'organic_keywords', 'organic_traffic',
];

/** Canonical fields that MUST be numbers, regardless of how a provider formats them. */
export const NUMERIC_CANONICAL_FIELDS = new Set([
  'position', 'volume', 'cpc', 'competition', 'difficulty', 'traffic_pct', 'relevance',
  'common_keywords', 'organic_keywords', 'organic_traffic', 'organic_cost', 'paid_keywords',
  'rank', 'authority_rank',
]);

const MAX_KEYWORD_LEN = 200;

/**
 * Coerce a provider value to a number. Handles plain numbers and strings with
 * commas, %, and K/M/B magnitude suffixes ("1,900", "12.5%", "100K", "1.2M").
 * Returns null for empty / non-numeric / sentinel values rather than NaN.
 */
export function parseSeoNumber(v) {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  let s = String(v).trim();
  if (s === '' || s === '-' || /^n\/?a$/i.test(s)) return null;
  s = s.replace(/%/g, '').replace(/,/g, '').replace(/\s/g, '');
  const m = s.match(/^(-?\d*\.?\d+)([kmb])?$/i);
  if (!m) return null;
  let n = parseFloat(m[1]);
  const suffix = (m[2] || '').toLowerCase();
  if (suffix === 'k') n *= 1e3;
  else if (suffix === 'm') n *= 1e6;
  else if (suffix === 'b') n *= 1e9;
  return Number.isFinite(n) ? n : null;
}

/** Trim + strip control chars from strings; pass arrays/objects/numbers through. */
function cleanValue(v) {
  if (typeof v === 'string') return v.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
  return v;
}

/**
 * Map a provider-native row to a canonical row via a {nativeKey: canonicalKey} map.
 * Numeric canonical fields are coerced to numbers; string fields are cleaned.
 * Unmapped native fields are dropped (keeps the artifact clean + stable).
 */
export function normalizeRow(raw, fieldMap) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [nativeKey, canonicalKey] of Object.entries(fieldMap)) {
    const v = raw[nativeKey];
    if (v === undefined || v === null) continue;
    out[canonicalKey] = NUMERIC_CANONICAL_FIELDS.has(canonicalKey) ? parseSeoNumber(v) : cleanValue(v);
  }
  return out;
}

/**
 * Validate + canonicalize a target domain. Strips protocol/path/query, lowercases,
 * and throws on anything that is not a plausible hostname (defends the URL builders
 * against path-traversal / injection and fails fast on bad config).
 */
export function sanitizeDomain(input) {
  const raw = String(input ?? '').trim().toLowerCase()
    .replace(/^[a-z]+:\/\//, '')   // strip scheme
    .replace(/\/.*$/, '')          // strip path/query
    .replace(/:\d+$/, '');         // strip port
  const isIpv4 = /^\d{1,3}(\.\d{1,3}){3}$/.test(raw);
  const validHost = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(raw);
  if (raw.length > 253 || isIpv4 || !validHost) {
    throw new Error(`Invalid domain: "${input}"`);
  }
  return raw;
}

/**
 * Derive an honest run status from the raw section results, so a scan where
 * every call failed is reported as 'failed' (and the runner can exit non-zero)
 * rather than silently writing an empty artifact that looks successful.
 * Sections may be arrays (success) or {_error} sentinels (failure).
 */
export function deriveScanStatus({ domainOverview, organicKeywords = [], paidKeywords = [], organicCompetitors = [], keywordIntel = [] } = {}) {
  const listErrored = (s) => s && typeof s === 'object' && s._error;
  const len = (s) => (Array.isArray(s) ? s.length : 0);
  // A keyword that erred is a failure; a keyword that simply returned no data is not.
  const kwFailed = keywordIntel.filter((k) => k && k.error).length;
  const kwOk = keywordIntel.filter((k) => k && k.data != null).length;

  const errored =
    [domainOverview, organicKeywords, paidKeywords, organicCompetitors].some(listErrored) || kwFailed > 0;
  const dataCount =
    (domainOverview && !domainOverview._error ? Object.keys(domainOverview).length : 0) +
    len(organicKeywords) + len(paidKeywords) + len(organicCompetitors) + kwOk;

  if (dataCount === 0 && errored) return 'failed';
  if (errored) return 'partial';
  return 'ok';
}

/** Clean a freeform keyword: strip control chars, collapse whitespace, cap length. */
export function sanitizeKeyword(input) {
  const k = cleanValue(String(input ?? '')).slice(0, MAX_KEYWORD_LEN);
  if (!k) throw new Error(`Empty keyword after sanitizing: "${input}"`);
  return k;
}

/** Apply normalizeRow across an array; non-arrays normalize to []. */
export function normalizeRows(rows, fieldMap) {
  if (!Array.isArray(rows)) return [];
  return rows.map((r) => normalizeRow(r, fieldMap));
}

/**
 * Assemble the canonical seo_intel artifact. Deterministic — it does NOT
 * read a clock; the caller passes meta.generated_at (so tests are stable
 * and the workflow can be replayed).
 */
export function buildSeoIntel({
  provider,
  target,
  region,
  domainOverview = null,
  organicKeywords = [],
  paidKeywords = [],
  organicCompetitors = [],
  keywordIntel = [],
  paidDataAvailable = null,
  unverifiedSections = [],
  meta = {},
}) {
  return {
    schema: 'seo_intel',
    version: SEO_INTEL_VERSION,
    provider,
    target_domain: target,
    region,
    domain_overview: domainOverview,
    organic_keywords: organicKeywords,
    paid_keywords: paidKeywords,
    organic_competitors: organicCompetitors,
    keyword_intel: keywordIntel,
    // paid_data_available distinguishes "[] because the provider has no paid API"
    // from "[] because there is genuinely no paid competition".
    // unverified_sections lists sections whose provider endpoints are best-guess
    // (not yet confirmed against a live response) — consumers should discount them.
    _metadata: { generated_at: null, paid_data_available: paidDataAvailable, unverified_sections: unverifiedSections, ...meta },
  };
}
