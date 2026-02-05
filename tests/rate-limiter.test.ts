import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenBucket, resolveRateLimitConfig } from '../src/core/rate-limiter.js';
import { DEFAULT_RATE_LIMIT_CONFIG } from '../src/types/rate-limit.js';
import { RateLimitExceededError } from '../src/errors.js';

describe('TokenBucket', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should allow requests within rate limit', async () => {
    const bucket = new TokenBucket({ ...DEFAULT_RATE_LIMIT_CONFIG, burstSize: 5 });

    // Should allow 5 immediate requests (burst size)
    for (let i = 0; i < 5; i++) {
      await bucket.acquire();
    }

    const status = bucket.getStatus();
    expect(status.tokens).toBe(0);
  });

  it('should queue requests when tokens exhausted and queueRequests is true', async () => {
    const bucket = new TokenBucket({
      requestsPerSecond: 10,
      burstSize: 1,
      queueRequests: true,
      maxQueueSize: 10,
    });

    // Use the one available token
    await bucket.acquire();

    // Start a second acquire that should queue
    const acquirePromise = bucket.acquire();

    const status = bucket.getStatus();
    expect(status.queueLength).toBe(1);

    // Advance time to allow token refill
    vi.advanceTimersByTime(100); // 100ms = 1 token at 10/sec

    // Now the queued request should resolve
    await acquirePromise;
  });

  it('should throw RateLimitExceededError when queueRequests is false and no tokens', async () => {
    const bucket = new TokenBucket({
      requestsPerSecond: 10,
      burstSize: 1,
      queueRequests: false,
      maxQueueSize: 10,
    });

    // Use the one available token
    await bucket.acquire();

    // Second acquire should throw
    await expect(bucket.acquire()).rejects.toThrow(RateLimitExceededError);
  });

  it('should throw RateLimitExceededError when queue is full', async () => {
    const bucket = new TokenBucket({
      requestsPerSecond: 1,
      burstSize: 1,
      queueRequests: true,
      maxQueueSize: 2,
    });

    // Use the one available token
    await bucket.acquire();

    // Queue 2 requests (maxQueueSize)
    bucket.acquire(); // Queued
    bucket.acquire(); // Queued

    // Third queued request should throw
    await expect(bucket.acquire()).rejects.toThrow(RateLimitExceededError);
  });

  it('should replenish tokens over time', async () => {
    const bucket = new TokenBucket({
      requestsPerSecond: 10,
      burstSize: 10,
      queueRequests: false,
      maxQueueSize: 10,
    });

    // Use all tokens
    for (let i = 0; i < 10; i++) {
      await bucket.acquire();
    }

    expect(bucket.getStatus().tokens).toBe(0);

    // Advance time by 500ms = 5 tokens at 10/sec
    vi.advanceTimersByTime(500);

    expect(bucket.getStatus().tokens).toBeCloseTo(5, 0);
  });

  it('should not exceed burst size when replenishing', async () => {
    const bucket = new TokenBucket({
      requestsPerSecond: 10,
      burstSize: 5,
      queueRequests: false,
      maxQueueSize: 10,
    });

    // Advance time significantly
    vi.advanceTimersByTime(10000);

    // Tokens should be capped at burst size
    expect(bucket.getStatus().tokens).toBe(5);
  });

  it('should include retryAfter in RateLimitExceededError', async () => {
    const bucket = new TokenBucket({
      requestsPerSecond: 10,
      burstSize: 1,
      queueRequests: false,
      maxQueueSize: 10,
    });

    await bucket.acquire();

    try {
      await bucket.acquire();
      expect.fail('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(RateLimitExceededError);
      expect((error as RateLimitExceededError).retryAfter).toBeGreaterThan(0);
    }
  });
});

describe('resolveRateLimitConfig', () => {
  it('should return null when undefined (disabled by default)', () => {
    const result = resolveRateLimitConfig(undefined);
    expect(result).toBeNull();
  });

  it('should return null when false', () => {
    const result = resolveRateLimitConfig(false);
    expect(result).toBeNull();
  });

  it('should return null when null', () => {
    const result = resolveRateLimitConfig(null);
    expect(result).toBeNull();
  });

  it('should merge partial config with defaults', () => {
    const result = resolveRateLimitConfig({ requestsPerSecond: 5 });
    expect(result).toEqual({
      ...DEFAULT_RATE_LIMIT_CONFIG,
      requestsPerSecond: 5,
      burstSize: 10, // 5 * 2
    });
  });

  it('should respect explicit burstSize', () => {
    const result = resolveRateLimitConfig({ requestsPerSecond: 5, burstSize: 3 });
    expect(result).toEqual({
      ...DEFAULT_RATE_LIMIT_CONFIG,
      requestsPerSecond: 5,
      burstSize: 3,
    });
  });
});
