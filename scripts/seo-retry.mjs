/**
 * SMMFactory — SEO error taxonomy + retry/backoff
 * ═══════════════════════════════════════════════════════════
 * Turns opaque provider errors into a small, stable set of codes so
 * callers can distinguish "rate limited" from "bad key" from "provider
 * down", and retries only the transient ones with exponential backoff.
 *
 * Zero-dependency by design (house style). `sleep` is injectable so the
 * retry logic is unit-tested with no real delay.
 * ═══════════════════════════════════════════════════════════ */

export const ERROR_CODES = {
  RATE_LIMITED: 'RATE_LIMITED',
  INVALID_KEY: 'INVALID_KEY',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  PARSE_ERROR: 'PARSE_ERROR',
  UNKNOWN: 'UNKNOWN',
};

/** Classify a thrown error into one ERROR_CODES value (by HTTP status, then message). */
export function classifyError(err) {
  const status = err && typeof err.status === 'number' ? err.status : null;
  if (status === 429) return ERROR_CODES.RATE_LIMITED;
  if (status === 401 || status === 403) return ERROR_CODES.INVALID_KEY;
  if (status && status >= 500) return ERROR_CODES.NETWORK_ERROR;

  const m = String((err && err.message) || err || '').toLowerCase();
  if (/\b429\b|rate.?limit|too many requests/.test(m)) return ERROR_CODES.RATE_LIMITED;
  if (/wrong key|invalid.*key|authentication failed|unauthorized|forbidden/.test(m)) return ERROR_CODES.INVALID_KEY;
  if (/timed out|timeout|econnreset|enotfound|econnrefused|socket hang up|network/.test(m)) return ERROR_CODES.NETWORK_ERROR;
  if (/unexpected token|json|parse error/.test(m)) return ERROR_CODES.PARSE_ERROR;
  if (/api error|nothing found|provider/.test(m)) return ERROR_CODES.PROVIDER_ERROR;
  return ERROR_CODES.UNKNOWN;
}

const RETRYABLE = new Set([ERROR_CODES.RATE_LIMITED, ERROR_CODES.NETWORK_ERROR]);

/**
 * Run `fn`, retrying transient failures (rate-limit / network) with exponential
 * backoff + jitter. Non-retryable errors (bad key, parse, provider 4xx) fail fast.
 * @param {() => Promise<any>} fn
 * @param {object} [opts] { retries=3, baseDelay=200, isRetryable?, sleep? }
 */
export async function withRetry(fn, opts = {}) {
  const retries = opts.retries ?? 3;
  const baseDelay = opts.baseDelay ?? 200;
  const sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const isRetryable = opts.isRetryable ?? ((e) => RETRYABLE.has(classifyError(e)));

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isRetryable(err)) throw err;
      await sleep(baseDelay * 2 ** attempt + Math.floor(Math.random() * baseDelay));
    }
  }
  throw lastErr;
}
