// tests/semrush.test.mjs — Unit tests for the SEMrush Analytics API client
// Run: npx vitest run tests/semrush.test.mjs
//
// These tests exercise the PURE logic (CSV parsing, column normalization,
// URL construction) with an injected fetch — so they pass GREEN offline,
// with NO SEMrush API key and NO API units consumed.

import { describe, it, expect } from 'vitest';
import {
  parseSemrushCsv,
  mapColumns,
  SEMRUSH_COLUMNS,
  SemrushClient,
} from '../scripts/semrush-client.mjs';

describe('parseSemrushCsv', () => {
  it('parses a semicolon-separated CSV with a header row into objects', () => {
    const raw =
      'Keyword;Position;Search Volume;CPC;Url\n' +
      'luxury villa sri lanka;3;1900;2.50;https://kolakevilla.com/\n' +
      'group villa ahangama;7;320;1.10;https://kolakevilla.com/rooms';
    const rows = parseSemrushCsv(raw);
    expect(rows).toHaveLength(2);
    expect(rows[0].Keyword).toBe('luxury villa sri lanka');
    expect(rows[0].Position).toBe('3');
    expect(rows[1].Url).toBe('https://kolakevilla.com/rooms');
  });

  it('returns an empty array for an empty or whitespace body', () => {
    expect(parseSemrushCsv('')).toEqual([]);
    expect(parseSemrushCsv('   \n  ')).toEqual([]);
  });

  it('throws a descriptive error when SEMrush returns an ERROR line', () => {
    // SEMrush surfaces failures as plain text like "ERROR 50 :: NOTHING FOUND"
    expect(() => parseSemrushCsv('ERROR 50 :: NOTHING FOUND')).toThrow(/SEMrush/i);
    expect(() => parseSemrushCsv('ERROR 120 :: WRONG KEY')).toThrow(/WRONG KEY/);
  });

  it('returns an empty array when only a header row is present (no data)', () => {
    expect(parseSemrushCsv('Keyword;Position;Search Volume')).toEqual([]);
  });
});

describe('mapColumns', () => {
  it('normalizes human header names to snake_case keys', () => {
    const rows = [{ Keyword: 'surf stay', 'Search Volume': '880', 'Traffic (%)': '12.5' }];
    const mapped = mapColumns(rows);
    expect(mapped[0].keyword).toBe('surf stay');
    expect(mapped[0].search_volume).toBe(880); // coerced to number
    expect(mapped[0].traffic).toBe(12.5);
  });

  it('coerces numeric-looking values to numbers and leaves text alone', () => {
    const mapped = mapColumns([{ CPC: '2.50', Url: 'https://x.com', Position: '4' }]);
    expect(mapped[0].cpc).toBe(2.5);
    expect(mapped[0].position).toBe(4);
    expect(mapped[0].url).toBe('https://x.com');
  });

  it('is a no-op-safe on an empty array', () => {
    expect(mapColumns([])).toEqual([]);
  });
});

describe('SEMRUSH_COLUMNS', () => {
  it('declares export_columns for each report type the studio uses', () => {
    expect(SEMRUSH_COLUMNS.domainOverview).toBeTruthy();
    expect(SEMRUSH_COLUMNS.organicKeywords).toContain('Ph'); // phrase/keyword code
    expect(SEMRUSH_COLUMNS.paidKeywords).toContain('Ph');
    expect(SEMRUSH_COLUMNS.organicCompetitors).toContain('Dn'); // domain code
  });
});

describe('SemrushClient', () => {
  const FAKE_KEY = 'test-key-123';

  function clientWithCapture(responseCsv) {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(url);
      return responseCsv;
    };
    const client = new SemrushClient(FAKE_KEY, { database: 'uk', fetchImpl, displayLimit: 25 });
    return { client, calls };
  }

  it('throws if constructed without an API key', () => {
    expect(() => new SemrushClient('')).toThrow(/key/i);
  });

  it('builds an organic-keywords request against api.semrush.com with key, type, database', async () => {
    const csv = 'Keyword;Position;Search Volume;CPC\nluxury villa;2;1900;2.5';
    const { client, calls } = clientWithCapture(csv);
    const rows = await client.organicKeywords('kolakevilla.com');

    expect(calls).toHaveLength(1);
    const url = calls[0];
    expect(url).toContain('https://api.semrush.com/');
    expect(url).toContain('type=domain_organic');
    expect(url).toContain('key=test-key-123');
    expect(url).toContain('database=uk');
    expect(url).toContain('display_limit=25');
    expect(url).toMatch(/domain=kolakevilla\.com/);

    // parsed + normalized
    expect(rows[0].keyword).toBe('luxury villa');
    expect(rows[0].search_volume).toBe(1900);
  });

  it('maps each public method to the correct SEMrush report type', async () => {
    const csv = 'Domain;Competitor Relevance\nairbnb.com;0.8';
    const expectations = [
      ['domainOverview', 'domain_ranks'],
      ['organicKeywords', 'domain_organic'],
      ['paidKeywords', 'domain_adwords'],
      ['organicCompetitors', 'domain_organic_organic'],
    ];
    for (const [method, type] of expectations) {
      const { client, calls } = clientWithCapture(csv);
      await client[method]('kolakevilla.com');
      expect(calls[0]).toContain(`type=${type}`);
    }
  });

  it('keywordOverview sends the phrase param, not domain', async () => {
    const csv = 'Keyword;Search Volume;CPC\nsurf stay ahangama;880;1.2';
    const { client, calls } = clientWithCapture(csv);
    await client.keywordOverview('surf stay ahangama');
    expect(calls[0]).toContain('type=phrase_this');
    expect(calls[0]).toMatch(/phrase=surf(\+|%20)stay(\+|%20)ahangama/);
  });

  it('propagates SEMrush API errors from the response body', async () => {
    const { client } = clientWithCapture('ERROR 120 :: WRONG KEY');
    await expect(client.organicKeywords('kolakevilla.com')).rejects.toThrow(/WRONG KEY/);
  });
});
