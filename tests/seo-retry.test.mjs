// tests/seo-retry.test.mjs — error taxonomy + retry/backoff (offline, injected sleep)
// Run: npx vitest run tests/seo-retry.test.mjs

import { describe, it, expect } from 'vitest';
import { ERROR_CODES, classifyError, withRetry } from '../scripts/seo-retry.mjs';

describe('classifyError', () => {
  const cases = [
    ['ERROR 429 :: TOO MANY REQUESTS', ERROR_CODES.RATE_LIMITED],
    ['rate limit exceeded', ERROR_CODES.RATE_LIMITED],
    ['SE Ranking API error: WRONG KEY', ERROR_CODES.INVALID_KEY],
    ['Authentication failed. Please ensure you have a valid, enabled API key.', ERROR_CODES.INVALID_KEY],
    ['SEMrush request timed out (60s)', ERROR_CODES.NETWORK_ERROR],
    ['read ECONNRESET', ERROR_CODES.NETWORK_ERROR],
    ['SE Ranking API error: NOTHING FOUND', ERROR_CODES.PROVIDER_ERROR],
    ['Unexpected token < in JSON at position 0', ERROR_CODES.PARSE_ERROR],
  ];
  it.each(cases)('classifies "%s"', (msg, code) => {
    expect(classifyError(new Error(msg))).toBe(code);
  });

  it('uses err.status when present (429 -> RATE_LIMITED, 503 -> NETWORK_ERROR)', () => {
    const e429 = Object.assign(new Error('x'), { status: 429 });
    const e503 = Object.assign(new Error('x'), { status: 503 });
    expect(classifyError(e429)).toBe(ERROR_CODES.RATE_LIMITED);
    expect(classifyError(e503)).toBe(ERROR_CODES.NETWORK_ERROR);
  });
});

describe('withRetry', () => {
  const noSleep = () => Promise.resolve();

  it('returns immediately on success (no retries)', async () => {
    let calls = 0;
    const r = await withRetry(async () => { calls++; return 'ok'; }, { sleep: noSleep });
    expect(r).toBe('ok');
    expect(calls).toBe(1);
  });

  it('retries a retryable error then succeeds', async () => {
    let calls = 0;
    const r = await withRetry(async () => {
      calls++;
      if (calls < 3) throw new Error('rate limit');
      return 'recovered';
    }, { retries: 3, sleep: noSleep });
    expect(r).toBe('recovered');
    expect(calls).toBe(3);
  });

  it('does NOT retry a non-retryable error (invalid key) — fails fast', async () => {
    let calls = 0;
    await expect(withRetry(async () => { calls++; throw new Error('WRONG KEY'); }, { retries: 3, sleep: noSleep }))
      .rejects.toThrow(/WRONG KEY/);
    expect(calls).toBe(1);
  });

  it('gives up after exhausting retries on a persistent retryable error', async () => {
    let calls = 0;
    await expect(withRetry(async () => { calls++; throw new Error('ECONNRESET'); }, { retries: 2, sleep: noSleep }))
      .rejects.toThrow(/ECONNRESET/);
    expect(calls).toBe(3); // initial + 2 retries
  });
});
