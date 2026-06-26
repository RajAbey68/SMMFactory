// tests/seo-schema.test.mjs — Canonical seo_intel schema + cross-provider normalizers
// Run: npx vitest run tests/seo-schema.test.mjs

import { describe, it, expect } from 'vitest';
import {
  SEO_INTEL_VERSION,
  CANONICAL_KEYWORD_FIELDS,
  normalizeRow,
  normalizeRows,
  buildSeoIntel,
} from '../scripts/seo-schema.mjs';

describe('canonical keyword contract', () => {
  it('declares the canonical keyword field set', () => {
    expect(CANONICAL_KEYWORD_FIELDS).toContain('keyword');
    expect(CANONICAL_KEYWORD_FIELDS).toContain('volume');
    expect(CANONICAL_KEYWORD_FIELDS).toContain('cpc');
    expect(CANONICAL_KEYWORD_FIELDS).toContain('difficulty');
  });
});

describe('normalizeRow / normalizeRows', () => {
  const MAP = { search_volume: 'volume', kw: 'keyword', cpc: 'cpc' };

  it('maps native field names to canonical and drops unmapped fields', () => {
    const out = normalizeRow({ kw: 'surf stay', search_volume: 880, cpc: 1.2, junk: 'x' }, MAP);
    expect(out).toEqual({ keyword: 'surf stay', volume: 880, cpc: 1.2 });
    expect(out.junk).toBeUndefined();
  });

  it('normalizeRows maps an array and returns [] for non-arrays', () => {
    const rows = normalizeRows([{ kw: 'a', search_volume: 1 }, { kw: 'b', search_volume: 2 }], MAP);
    expect(rows).toEqual([{ keyword: 'a', volume: 1 }, { keyword: 'b', volume: 2 }]);
    expect(normalizeRows(null, MAP)).toEqual([]);
    expect(normalizeRows(undefined, MAP)).toEqual([]);
  });
});

describe('buildSeoIntel', () => {
  it('assembles a versioned, provider-tagged canonical artifact', () => {
    const intel = buildSeoIntel({
      provider: 'seranking',
      target: 'kolakevilla.com',
      region: 'uk',
      organicKeywords: [{ keyword: 'villa', volume: 1900 }],
      keywordIntel: [{ keyword: 'surf', volume: 880 }],
      meta: { generated_at: '2026-06-26T00:00:00Z', elapsed_seconds: 1.2 },
    });
    expect(intel.schema).toBe('seo_intel');
    expect(intel.version).toBe(SEO_INTEL_VERSION);
    expect(intel.provider).toBe('seranking');
    expect(intel.target_domain).toBe('kolakevilla.com');
    expect(intel.region).toBe('uk');
    expect(intel.organic_keywords).toHaveLength(1);
    expect(intel.paid_keywords).toEqual([]); // defaulted
    expect(intel.organic_competitors).toEqual([]);
    expect(intel._metadata.generated_at).toBe('2026-06-26T00:00:00Z');
    expect(intel._metadata.elapsed_seconds).toBe(1.2);
  });

  it('is deterministic (no internal clock) — same input, same output', () => {
    const args = { provider: 'semrush', target: 'x.com', region: 'us', meta: { generated_at: 'T' } };
    expect(buildSeoIntel(args)).toEqual(buildSeoIntel(args));
  });
});
