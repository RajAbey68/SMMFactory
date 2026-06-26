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

/**
 * Map a provider-native row to a canonical row via a {nativeKey: canonicalKey} map.
 * Unmapped native fields are dropped (keeps the artifact clean + stable).
 */
export function normalizeRow(raw, fieldMap) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [nativeKey, canonicalKey] of Object.entries(fieldMap)) {
    if (raw[nativeKey] !== undefined) out[canonicalKey] = raw[nativeKey];
  }
  return out;
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
    _metadata: { generated_at: null, ...meta },
  };
}
