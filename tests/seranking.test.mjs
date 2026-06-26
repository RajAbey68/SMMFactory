// tests/seranking.test.mjs — SE Ranking Data API client (offline, injected fetch)
// Run: npx vitest run tests/seranking.test.mjs

import { describe, it, expect } from 'vitest';
import { parseSeRanking, SeRankingClient } from '../scripts/seranking-client.mjs';

describe('parseSeRanking', () => {
  it('parses a JSON string body', () => {
    expect(parseSeRanking('[{"keyword":"x","volume":10}]')).toEqual([{ keyword: 'x', volume: 10 }]);
  });
  it('passes through an already-parsed object', () => {
    expect(parseSeRanking({ keywords: [] })).toEqual({ keywords: [] });
  });
  it('throws on an API error body (both `error` and live `error_description` keys)', () => {
    expect(() => parseSeRanking('{"error":"Invalid token"}')).toThrow(/SE Ranking/i);
    expect(() => parseSeRanking({ error: 'rate limit' })).toThrow(/rate limit/);
    // SE Ranking's real auth failure uses error_description (verified via live smoke)
    expect(() => parseSeRanking({ error_description: 'Authentication failed.' })).toThrow(/Authentication failed/);
  });
});

describe('SeRankingClient', () => {
  function capture(responseJson) {
    const calls = [];
    const fetchImpl = async (method, url, headers, body) => {
      calls.push({ method, url, headers, body });
      return typeof responseJson === 'string' ? responseJson : JSON.stringify(responseJson);
    };
    const client = new SeRankingClient('tok-123', { source: 'uk', fetchImpl });
    return { client, calls };
  }

  it('throws if constructed without a key', () => {
    expect(() => new SeRankingClient('')).toThrow(/key/i);
  });

  it('keywordOverview POSTs to /v1/keywords/export with Token auth + JSON body', async () => {
    const { client, calls } = capture([{ keyword: 'luxury villa', volume: 1900, cpc: 2.5, difficulty: 41, competition: 0.7 }]);
    const row = await client.keywordOverview('luxury villa');

    expect(calls).toHaveLength(1);
    const c = calls[0];
    expect(c.method).toBe('POST');
    expect(c.url).toContain('https://api.seranking.com/v1/keywords/export');
    expect(c.url).toContain('source=uk');
    expect(c.headers.Authorization).toBe('Token tok-123');
    expect(c.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(c.body).keywords).toEqual(['luxury villa']);

    expect(row.keyword).toBe('luxury villa');
    expect(row.volume).toBe(1900);
    expect(row.difficulty).toBe(41);
  });

  it('keywordMetrics returns an array for a batch of keywords', async () => {
    const { client } = capture([{ keyword: 'a', volume: 1 }, { keyword: 'b', volume: 2 }]);
    const rows = await client.keywordMetrics(['a', 'b']);
    expect(rows).toHaveLength(2);
    expect(rows[1].keyword).toBe('b');
  });

  it('relatedKeywords GETs /v1/keywords/related and unwraps the keywords array', async () => {
    const { client, calls } = capture({ total: 1, keywords: [{ keyword: 'surf stay', volume: 880, relevance: 92 }] });
    const rows = await client.relatedKeywords('surf');
    expect(calls[0].method).toBe('GET');
    expect(calls[0].url).toContain('/v1/keywords/related');
    expect(calls[0].url).toContain('keyword=surf');
    expect(rows[0].relevance).toBe(92);
  });

  it('exposes the full provider method surface (incl. organic-only paid stub)', async () => {
    const { client } = capture({ keywords: [] });
    expect(typeof client.domainOverview).toBe('function');
    expect(typeof client.organicKeywords).toBe('function');
    expect(typeof client.organicCompetitors).toBe('function');
    // SE Ranking Data API is organic-focused: paidKeywords is a documented empty stub
    expect(await client.paidKeywords('kolakevilla.com')).toEqual([]);
  });

  it('propagates SE Ranking API errors from the response body', async () => {
    const { client } = capture('{"error":"Invalid token"}');
    await expect(client.keywordOverview('x')).rejects.toThrow(/Invalid token/);
  });
});
