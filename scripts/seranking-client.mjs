/**
 * SMMFactory — SE Ranking Data API Client
 * ═══════════════════════════════════════════════════════════
 * Second SEO/PPC provider behind the seo-providers adapter.
 * Independent review ranked SE Ranking AHEAD of SpyFu as the
 * general SEMrush replacement (broader global organic coverage,
 * one API spanning keyword + domain + competitor data).
 *
 *   Base:   https://api.seranking.com/v1/
 *   Auth:   Authorization: Token <SERANKING_API_KEY>   (one key, all endpoints)
 *   Format: JSON
 *   Docs:   https://seranking.com/api/data/
 *
 * VERIFIED endpoints (developer.seranking.com, 2026-06):
 *   POST /v1/keywords/export?source=<db>   body {keywords:[...]}  -> [{keyword,volume,cpc,competition,difficulty,intents}]
 *   GET  /v1/keywords/related?source=&keyword=&limit=            -> {total, keywords:[{...,relevance}]}
 *   GET  /v1/keywords/similar?source=&keyword=&limit=            -> {total, keywords:[...]}
 *
 * DOMAIN endpoints below use the documented domain-analysis surface; confirm the
 * exact paths against https://seranking.com/api/data/reference/ before live use.
 * The scan layer wraps every call in safe() so an unexpected 404 degrades
 * gracefully rather than failing the run.
 * ═══════════════════════════════════════════════════════════ */

import https from 'https';
import { getLimiter } from './rate-limiter.mjs';

const API_HOST = 'api.seranking.com';

const ENDPOINTS = {
  keywordsExport: '/v1/keywords/export',     // VERIFIED
  keywordsRelated: '/v1/keywords/related',   // VERIFIED
  keywordsSimilar: '/v1/keywords/similar',   // VERIFIED
  domainOverview: '/v1/domain/overview',     // confirm vs docs before live use
  domainKeywords: '/v1/domain/keywords',     // confirm vs docs before live use
  domainCompetitors: '/v1/domain/competitors', // confirm vs docs before live use
};

/** Parse a SE Ranking JSON body (string or object); throw on an API error envelope.
 *  SE Ranking signals failures with `error` OR `error_description` (verified live, 2026-06). */
export function parseSeRanking(raw) {
  if (raw == null) return null;
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (data && typeof data === 'object') {
    const err = data.error ?? data.error_description;
    if (err) throw new Error(`SE Ranking API error: ${typeof err === 'string' ? err : JSON.stringify(err)}`);
  }
  return data;
}

/** Default network fetch: (method, url, headers, body) -> Promise<string>. */
function httpRequest(method, url, headers, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = { method, hostname: u.hostname, path: u.pathname + u.search, headers: { ...headers } };
    if (body) opts.headers['Content-Length'] = Buffer.byteLength(body);
    const req = https.request(opts, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    });
    req.on('error', reject);
    req.setTimeout(60_000, () => { req.destroy(); reject(new Error('SE Ranking request timed out (60s)')); });
    if (body) req.write(body);
    req.end();
  });
}

export class SeRankingClient {
  /**
   * @param {string} key  SE Ranking API key
   * @param {object} [opts]
   * @param {string} [opts.source='us']     Regional database (ISO-3166-1 alpha-2: us, uk, de, ...)
   * @param {number} [opts.displayLimit=100]
   * @param {number} [opts.rateLimit=10]
   * @param {object} [opts.limiter]
   * @param {function} [opts.fetchImpl]      (method,url,headers,body)->Promise<string> (for tests)
   */
  constructor(key, opts = {}) {
    if (!key) throw new Error('SERANKING_API_KEY required to construct SeRankingClient');
    this.key = key;
    this.source = opts.source || 'us';
    this.displayLimit = opts.displayLimit || 100;
    this.limiter = opts.limiter || getLimiter('seranking', opts.rateLimit || 10, 60_000);
    this._fetch = opts.fetchImpl || httpRequest;
  }

  _headers(json = false) {
    const h = { Authorization: `Token ${this.key}` };
    if (json) h['Content-Type'] = 'application/json';
    return h;
  }

  async _get(path, params = {}) {
    await this.limiter.acquire();
    const qs = new URLSearchParams({ source: this.source, ...params });
    const raw = await this._fetch('GET', `https://${API_HOST}${path}?${qs.toString()}`, this._headers(), null);
    return parseSeRanking(raw);
  }

  async _post(path, body, params = {}) {
    await this.limiter.acquire();
    const qs = new URLSearchParams({ source: this.source, ...params });
    const raw = await this._fetch('POST', `https://${API_HOST}${path}?${qs.toString()}`, this._headers(true), JSON.stringify(body));
    return parseSeRanking(raw);
  }

  /** Batch keyword metrics (volume, CPC, competition, difficulty). */
  async keywordMetrics(keywords) {
    const data = await this._post(ENDPOINTS.keywordsExport, { keywords });
    return Array.isArray(data) ? data : (data?.keywords || []);
  }

  /** Single keyword overview -> one canonical-ish row (or null). */
  async keywordOverview(keyword) {
    const rows = await this.keywordMetrics([keyword]);
    return rows[0] || null;
  }

  /** Related keywords (keyword-gap discovery); rows carry a `relevance` score. */
  async relatedKeywords(keyword, limit = this.displayLimit) {
    const data = await this._get(ENDPOINTS.keywordsRelated, { keyword, limit: String(limit) });
    return data?.keywords || [];
  }

  /** Similar keywords (expansion). */
  async similarKeywords(keyword, limit = this.displayLimit) {
    const data = await this._get(ENDPOINTS.keywordsSimilar, { keyword, limit: String(limit) });
    return data?.keywords || [];
  }

  /** Domain overview (organic keyword count, traffic, ...). */
  async domainOverview(domain) {
    return (await this._get(ENDPOINTS.domainOverview, { domain })) || null;
  }

  /** A domain's organic keywords. */
  async organicKeywords(domain) {
    const data = await this._get(ENDPOINTS.domainKeywords, { domain });
    return data?.keywords || (Array.isArray(data) ? data : []);
  }

  /** A domain's organic competitors. */
  async organicCompetitors(domain) {
    const data = await this._get(ENDPOINTS.domainCompetitors, { domain });
    return data?.competitors || (Array.isArray(data) ? data : []);
  }

  /** SE Ranking's Data API is organic-focused — paid keywords are a documented empty stub. */
  async paidKeywords(/* domain */) {
    return [];
  }
}
