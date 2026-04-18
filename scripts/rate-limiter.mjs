/**
 * SMMFactory — Rate Limiter
 * Prevents AI API cost overruns from burst calling.
 *
 * Usage:
 *   import { RateLimiter } from './rate-limiter.mjs';
 *   const limiter = new RateLimiter('openai', 10, 60_000); // 10 calls per 60s
 *   await limiter.acquire(); // waits if at limit
 *   const result = await callOpenAI(...);
 *   limiter.release();
 *
 * Test 2.1 from spec:
 *   - 10 calls → all succeed immediately
 *   - 11th call → waits for oldest call to exit window
 *   - After wait, 11th call succeeds
 */

export class RateLimiter {
  /**
   * @param {string} provider  - Provider name for logging (e.g. 'openai')
   * @param {number} limit     - Max concurrent calls within the window
   * @param {number} windowMs  - Time window in milliseconds (default: 60_000)
   */
  constructor(provider, limit = 10, windowMs = 60_000) {
    this.provider = provider;
    this.limit = limit;
    this.windowMs = windowMs;
    this.callTimestamps = []; // timestamps of in-flight calls
    this.waiting = [];        // queue of pending resolve functions
  }

  /**
   * Acquire a slot. Waits if at limit until a slot opens.
   * @returns {Promise<void>}
   */
  async acquire() {
    return new Promise((resolve) => {
      this._tryAcquire(resolve);
    });
  }

  _tryAcquire(resolve) {
    const now = Date.now();

    // Evict timestamps outside the window
    this.callTimestamps = this.callTimestamps.filter(
      (ts) => now - ts < this.windowMs
    );

    if (this.callTimestamps.length < this.limit) {
      // Slot available — acquire immediately
      this.callTimestamps.push(now);
      resolve();
    } else {
      // At limit — calculate how long until oldest call expires
      const oldest = this.callTimestamps[0];
      const waitMs = this.windowMs - (now - oldest) + 1;

      console.log(
        `[RateLimiter:${this.provider}] At limit (${this.limit}/${this.windowMs}ms). Waiting ${waitMs}ms...`
      );

      setTimeout(() => {
        this._tryAcquire(resolve);
      }, waitMs);
    }
  }

  /**
   * Release a slot after the API call completes.
   * (Optional — the window-based sliding approach handles this automatically,
   *  but calling release() marks completion explicitly in logs.)
   */
  release() {
    // No-op with sliding window — timestamps expire naturally.
    // Reserved for future semaphore-style implementations.
  }

  /**
   * Returns current usage stats.
   */
  stats() {
    const now = Date.now();
    const active = this.callTimestamps.filter(
      (ts) => now - ts < this.windowMs
    ).length;
    return {
      provider: this.provider,
      active,
      limit: this.limit,
      windowMs: this.windowMs,
      available: this.limit - active,
    };
  }
}

/**
 * Singleton registry of rate limiters per provider.
 * Use this to share a single limiter across modules.
 *
 * const limiter = getLimiter('openai');
 */
const _limiters = {};

export function getLimiter(provider, limit = 10, windowMs = 60_000) {
  if (!_limiters[provider]) {
    _limiters[provider] = new RateLimiter(provider, limit, windowMs);
  }
  return _limiters[provider];
}
