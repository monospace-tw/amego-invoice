import { describe, it, expect, vi } from 'vitest';
import {
  calculateBackoffDelay,
  isRetryableError,
  withRetry,
  resolveRetryConfig,
} from '../src/core/retry.js';
import { DEFAULT_RETRY_CONFIG } from '../src/types/retry.js';
import {
  AmegoNetworkError,
  AmegoTimeoutError,
  AmegoApiError,
  AmegoValidationError,
} from '../src/errors.js';

describe('calculateBackoffDelay', () => {
  it('should return base delay for first attempt', () => {
    const delay = calculateBackoffDelay(0, DEFAULT_RETRY_CONFIG);
    // baseDelay (1000) + jitter (0-500)
    expect(delay).toBeGreaterThanOrEqual(1000);
    expect(delay).toBeLessThanOrEqual(1500);
  });

  it('should increase delay exponentially', () => {
    const config = { ...DEFAULT_RETRY_CONFIG, baseDelay: 1000 };
    // Mock random to return 0 for predictable testing
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const delay0 = calculateBackoffDelay(0, config); // 1000 * 2^0 = 1000
    const delay1 = calculateBackoffDelay(1, config); // 1000 * 2^1 = 2000
    const delay2 = calculateBackoffDelay(2, config); // 1000 * 2^2 = 4000

    expect(delay0).toBe(1000);
    expect(delay1).toBe(2000);
    expect(delay2).toBe(4000);

    vi.restoreAllMocks();
  });

  it('should cap delay at maxDelay', () => {
    const config = { ...DEFAULT_RETRY_CONFIG, baseDelay: 1000, maxDelay: 5000 };
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const delay = calculateBackoffDelay(10, config); // Would be 1024000 without cap
    expect(delay).toBe(5000);

    vi.restoreAllMocks();
  });
});

describe('isRetryableError', () => {
  it('should return true for network errors when retryNetworkErrors is true', () => {
    const error = new AmegoNetworkError('Network failed', new Error('ECONNRESET'));
    const result = isRetryableError(error, DEFAULT_RETRY_CONFIG);
    expect(result).toBe(true);
  });

  it('should return false for network errors when retryNetworkErrors is false', () => {
    const error = new AmegoNetworkError('Network failed', new Error('ECONNRESET'));
    const config = { ...DEFAULT_RETRY_CONFIG, retryNetworkErrors: false };
    const result = isRetryableError(error, config);
    expect(result).toBe(false);
  });

  it('should return true for timeout errors when retryNetworkErrors is true', () => {
    const error = new AmegoTimeoutError(30000);
    const result = isRetryableError(error, DEFAULT_RETRY_CONFIG);
    expect(result).toBe(true);
  });

  it('should return true for API errors with retryable codes', () => {
    const error = new AmegoApiError(500, 'Server error');
    const config = { ...DEFAULT_RETRY_CONFIG, retryableErrors: [500, 502, 503] };
    const result = isRetryableError(error, config);
    expect(result).toBe(true);
  });

  it('should return false for API errors with non-retryable codes', () => {
    const error = new AmegoApiError(400, 'Bad request');
    const config = { ...DEFAULT_RETRY_CONFIG, retryableErrors: [500, 502, 503] };
    const result = isRetryableError(error, config);
    expect(result).toBe(false);
  });

  it('should return false for validation errors', () => {
    const error = new AmegoValidationError('Invalid data', ['field required']);
    const result = isRetryableError(error, DEFAULT_RETRY_CONFIG);
    expect(result).toBe(false);
  });
});

describe('withRetry', () => {
  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn, DEFAULT_RETRY_CONFIG);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on retryable error and succeed', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new AmegoNetworkError('Failed', new Error('ECONNRESET')))
      .mockResolvedValue('success');

    const config = { ...DEFAULT_RETRY_CONFIG, baseDelay: 10, maxRetries: 3 };
    const result = await withRetry(fn, config);

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should throw after exhausting retries', async () => {
    const error = new AmegoNetworkError('Failed', new Error('ECONNRESET'));
    const fn = vi.fn().mockRejectedValue(error);

    const config = { ...DEFAULT_RETRY_CONFIG, baseDelay: 10, maxRetries: 2 };

    await expect(withRetry(fn, config)).rejects.toThrow(AmegoNetworkError);
    expect(fn).toHaveBeenCalledTimes(3); // initial + 2 retries
  });

  it('should not retry non-retryable errors', async () => {
    const error = new AmegoValidationError('Invalid', ['error']);
    const fn = vi.fn().mockRejectedValue(error);

    const config = { ...DEFAULT_RETRY_CONFIG, baseDelay: 10 };

    await expect(withRetry(fn, config)).rejects.toThrow(AmegoValidationError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute without retry when config is null', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const result = await withRetry(fn, null);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should execute without retry when maxRetries is 0', async () => {
    const error = new AmegoNetworkError('Failed', new Error('ECONNRESET'));
    const fn = vi.fn().mockRejectedValue(error);

    const config = { ...DEFAULT_RETRY_CONFIG, maxRetries: 0 };

    await expect(withRetry(fn, config)).rejects.toThrow(AmegoNetworkError);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('resolveRetryConfig', () => {
  it('should return default config when undefined', () => {
    const result = resolveRetryConfig(undefined);
    expect(result).toEqual(DEFAULT_RETRY_CONFIG);
  });

  it('should return null when false', () => {
    const result = resolveRetryConfig(false);
    expect(result).toBeNull();
  });

  it('should return null when null', () => {
    const result = resolveRetryConfig(null);
    expect(result).toBeNull();
  });

  it('should merge partial config with defaults', () => {
    const result = resolveRetryConfig({ maxRetries: 5 });
    expect(result).toEqual({
      ...DEFAULT_RETRY_CONFIG,
      maxRetries: 5,
    });
  });
});
