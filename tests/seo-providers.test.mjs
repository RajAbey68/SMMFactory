// tests/seo-providers.test.mjs — provider factory + cross-provider normalization
// Run: npx vitest run tests/seo-providers.test.mjs
//
// Proves the abstraction: a SEMrush-native row (search_volume) and a
// SE Ranking-native row (volume) both come out as the SAME canonical
// `volume` field through the provider interface.

import { describe, it, expect } from 'vitest';
import { getProvider } from '../scripts/seo-providers.mjs';

// Minimal fake clients matching each native client's method surface.
const fakeSemrush = {
  domainOverview: async () => [{ organic_keywords: 120, organic_traffic: 3400 }],
  organicKeywords: async () => [{ keyword: 'luxury villa', position: 3, search_volume: 1900, cpc: 2.5, difficulty: 41 }],
  paidKeywords: async () => [{ keyword: 'villa deal', position: 1, search_volume: 320, cpc: 1.1 }],
  organicCompetitors: async () => [{ domain: 'airbnb.com', relevance: 0.8, common_keywords: 40 }],
  keywordOverview: async () => [{ keyword: 'surf stay', search_volume: 880, cpc: 1.2 }],
};
const fakeSeRanking = {
  domainOverview: async () => ({ organic_keywords: 90, organic_traffic: 2100 }),
  organicKeywords: async () => [{ keyword: 'luxury villa', position: 4, volume: 1850, cpc: 2.4, difficulty: 39 }],
  paidKeywords: async () => [],
  organicCompetitors: async () => [{ domain: 'booking.com', relevance: 0.7, common_keywords: 33 }],
  keywordOverview: async () => ({ keyword: 'surf stay', volume: 860, cpc: 1.15 }),
};

describe('getProvider', () => {
  it('throws on an unknown provider name', () => {
    expect(() => getProvider('ahrefs')).toThrow(/unknown.*provider/i);
  });

  it('both providers expose the identical method surface', () => {
    const semrush = getProvider('semrush', { client: fakeSemrush });
    const seranking = getProvider('seranking', { client: fakeSeRanking });
    const surface = ['domainOverview', 'organicKeywords', 'paidKeywords', 'organicCompetitors', 'keywordOverview'];
    for (const m of surface) {
      expect(typeof semrush[m]).toBe('function');
      expect(typeof seranking[m]).toBe('function');
    }
    expect(semrush.name).toBe('semrush');
    expect(seranking.name).toBe('seranking');
  });

  it('normalizes SEMrush search_volume -> canonical volume', async () => {
    const p = getProvider('semrush', { client: fakeSemrush });
    const rows = await p.organicKeywords('kolakevilla.com');
    expect(rows[0].volume).toBe(1900);
    expect(rows[0].search_volume).toBeUndefined(); // native field gone
    expect(rows[0].keyword).toBe('luxury villa');
  });

  it('SE Ranking volume already canonical, passes through unchanged', async () => {
    const p = getProvider('seranking', { client: fakeSeRanking });
    const rows = await p.organicKeywords('kolakevilla.com');
    expect(rows[0].volume).toBe(1850);
    expect(rows[0].keyword).toBe('luxury villa');
  });

  it('keywordOverview returns a single canonical row for both providers', async () => {
    const sem = await getProvider('semrush', { client: fakeSemrush }).keywordOverview('surf stay');
    const ser = await getProvider('seranking', { client: fakeSeRanking }).keywordOverview('surf stay');
    expect(sem.volume).toBe(880);
    expect(ser.volume).toBe(860);
  });

  it('organicCompetitors come out with a canonical `domain` field for both', async () => {
    const sem = await getProvider('semrush', { client: fakeSemrush }).organicCompetitors('x');
    const ser = await getProvider('seranking', { client: fakeSeRanking }).organicCompetitors('x');
    expect(sem[0].domain).toBe('airbnb.com');
    expect(ser[0].domain).toBe('booking.com');
  });

  it('domainOverview is normalized + numerically coerced (not raw native)', async () => {
    const client = {
      domainOverview: async () => [{ organic_keywords: '120', organic_traffic: '3,400', junk: 'drop-me' }],
      organicKeywords: async () => [], paidKeywords: async () => [],
      organicCompetitors: async () => [], keywordOverview: async () => null,
    };
    const ov = await getProvider('semrush', { client }).domainOverview('kolakevilla.com');
    expect(ov.organic_keywords).toBe(120);      // coerced string -> number
    expect(ov.organic_traffic).toBe(3400);      // comma string -> number
    expect(ov.junk).toBeUndefined();            // unmapped native field dropped
  });
});
