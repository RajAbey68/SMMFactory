/**
 * SMMFactory — SEMrush Analytics API Client
 * ═══════════════════════════════════════════════════════════
 * Zero-dependency client for the SEMrush Analytics API (v3).
 *
 *   Base:   https://api.semrush.com/
 *   Auth:   ?key=<API_KEY>      (requires a subscription WITH the
 *                                API-units add-on — see SECURITY.md)
 *   Format: CSV, ';'-separated, first line = headers
 *   Docs:   https://developer.semrush.com/api/v3/analytics/
 *
 * This is the SEO / PPC intelligence twin of the AdSpyder integration:
 * it feeds the Research phase of a campaign (research/seo_intel.json).
 *
 * Design notes:
 *  - Pure helpers (parseSemrushCsv, mapColumns) are network-free and
 *    fully unit-tested offline — no key, no API units consumed.
 *  - SemrushClient takes an injectable `fetchImpl` so the request-shaping
 *    logic is testable without hitting the live API.
 *  - Rate limiting reuses scripts/rate-limiter.mjs to protect API units.
 * ═══════════════════════════════════════════════════════════ */

import https from 'https';
import { getLimiter } from './rate-limiter.mjs';

const API_HOST = 'api.semrush.com';

/**
 * export_columns sent per report type. These codes are the SEMrush
 * column identifiers (we control these). See domain-reports docs.
 *   Ph keyword · Po position · Nq volume · Cp CPC · Co competition
 *   Kd difficulty · Tr traffic% · Ur url · Nr #results
 *   Dn domain · Cr relevance · Np common kw · Or organic kw · Ot organic traffic
 */
export const SEMRUSH_COLUMNS = {
  domainOverview: 'Db,Dn,Rk,Or,Ot,Oc,Ad,At,Ac',
  organicKeywords: 'Ph,Po,Nq,Cp,Co,Kd,Tr,Ur,Nr',
  paidKeywords: 'Ph,Po,Nq,Cp,Ur,Tr',
  organicCompetitors: 'Dn,Cr,Np,Or,Ot,Oc,Ad',
  keywordOverview: 'Ph,Nq,Cp,Co,Nr,Kd',
};

/**
 * Friendly aliases for SEMrush's human-readable CSV headers.
 * Anything not listed falls through to a generic snake_case slug.
 */
const HEADER_ALIASES = {
  keyword: 'keyword',
  position: 'position',
  previous_position: 'previous_position',
  search_volume: 'search_volume',
  cpc: 'cpc',
  competition: 'competition',
  number_of_results: 'number_of_results',
  keyword_difficulty: 'difficulty',
  difficulty: 'difficulty',
  url: 'url',
  traffic: 'traffic',
  traffic_cost: 'traffic_cost',
  domain: 'domain',
  competitor_relevance: 'relevance',
  common_keywords: 'common_keywords',
  organic_keywords: 'organic_keywords',
  organic_traffic: 'organic_traffic',
  organic_cost: 'organic_cost',
  adwords_keywords: 'paid_keywords',
  rank: 'rank',
};

/** Slugify a CSV header into a safe snake_case key (e.g. "Traffic (%)" -> "traffic"). */
function normalizeKey(header) {
  const slug = String(header)
    .trim()
    .toLowerCase()
    .replace(/%/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return HEADER_ALIASES[slug] || slug;
}

/** Coerce numeric-looking strings to numbers; leave URLs/text untouched. */
function coerce(value) {
  if (typeof value !== 'string') return value;
  const v = value.trim();
  if (v === '') return v;
  // Pure number (int or decimal), but NOT something like a URL or "1,2,3" trend
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
}

/**
 * Parse a SEMrush CSV response body into an array of row objects keyed
 * by the verbatim header names.
 * @param {string} raw
 * @param {string} [delimiter=';']
 * @returns {Array<Record<string,string>>}
 */
export function parseSemrushCsv(raw, delimiter = ';') {
  if (raw == null) return [];
  const text = String(raw).trim();
  if (text === '') return [];

  // SEMrush reports failures as a plain-text line, e.g.
  //   "ERROR 50 :: NOTHING FOUND" / "ERROR 120 :: WRONG KEY"
  if (/^ERROR\b/i.test(text)) {
    throw new Error(`SEMrush API error: ${text}`);
  }

  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) return []; // header only (or nothing) => no data rows

  const headers = lines[0].split(delimiter);
  return lines.slice(1).map((line) => {
    const cells = line.split(delimiter);
    const row = {};
    headers.forEach((h, i) => {
      row[h] = cells[i] !== undefined ? cells[i] : '';
    });
    return row;
  });
}

/**
 * Normalize raw rows: snake_case keys + numeric coercion.
 * @param {Array<Record<string,string>>} rows
 * @returns {Array<Record<string, string|number>>}
 */
export function mapColumns(rows) {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const out = {};
    for (const [k, v] of Object.entries(row)) {
      out[normalizeKey(k)] = coerce(v);
    }
    return out;
  });
}

/** Default network fetch — GET a URL and resolve its body as text. */
function httpGetText(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
    req.on('error', reject);
    req.setTimeout(60_000, () => {
      req.destroy();
      reject(new Error('SEMrush request timed out (60s)'));
    });
  });
}

export class SemrushClient {
  /**
   * @param {string} key  SEMrush API key (requires API-units add-on)
   * @param {object} [opts]
   * @param {string} [opts.database='us']   Regional database (us, uk, ...)
   * @param {number} [opts.displayLimit=50] Max rows per report
   * @param {number} [opts.rateLimit=10]    Calls per 60s window
   * @param {object} [opts.limiter]         Override RateLimiter instance
   * @param {function} [opts.fetchImpl]     Override fetch (for tests)
   */
  constructor(key, opts = {}) {
    if (!key) throw new Error('SEMRUSH_API_KEY required to construct SemrushClient');
    this.key = key;
    this.database = opts.database || 'us';
    this.displayLimit = opts.displayLimit || 50;
    this.limiter = opts.limiter || getLimiter('semrush', opts.rateLimit || 10, 60_000);
    this._fetch = opts.fetchImpl || httpGetText;
  }

  /** Build the request URL, fetch, parse, and normalize. */
  async _report(type, params) {
    await this.limiter.acquire();
    const qs = new URLSearchParams({
      type,
      key: this.key,
      database: this.database,
      display_limit: String(this.displayLimit),
      ...params,
    });
    const raw = await this._fetch(`https://${API_HOST}/?${qs.toString()}`);
    return mapColumns(parseSemrushCsv(raw));
  }

  /** Domain Overview — rank, organic/paid traffic, keyword counts. */
  domainOverview(domain) {
    return this._report('domain_ranks', { domain, export_columns: SEMRUSH_COLUMNS.domainOverview });
  }

  /** Domain's organic search keywords (positions, volume, difficulty). */
  organicKeywords(domain) {
    return this._report('domain_organic', { domain, export_columns: SEMRUSH_COLUMNS.organicKeywords });
  }

  /** Domain's paid (Google Ads) keywords — the competitor PPC audit. */
  paidKeywords(domain) {
    return this._report('domain_adwords', { domain, export_columns: SEMRUSH_COLUMNS.paidKeywords });
  }

  /** Organic competitors — domains ranking for the same keywords. */
  organicCompetitors(domain) {
    return this._report('domain_organic_organic', { domain, export_columns: SEMRUSH_COLUMNS.organicCompetitors });
  }

  /** Keyword Overview — volume, CPC, competition for one phrase. */
  keywordOverview(phrase) {
    return this._report('phrase_this', { phrase, export_columns: SEMRUSH_COLUMNS.keywordOverview });
  }

  /** Related keywords — keyword-gap / expansion discovery for one phrase. */
  relatedKeywords(phrase) {
    return this._report('phrase_related', { phrase, export_columns: SEMRUSH_COLUMNS.keywordOverview });
  }
}
