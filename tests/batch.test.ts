import { describe, it, expect, vi } from 'vitest';
import { processBatch, resolveBatchConfig } from '../src/operations/batch.js';
import { DEFAULT_BATCH_CONFIG } from '../src/types/batch.js';
import type { BatchProgress } from '../src/types/batch.js';

describe('processBatch', () => {
  it('should process all items successfully', async () => {
    const items = [1, 2, 3, 4, 5];
    const processor = vi.fn().mockImplementation(async (n: number) => n * 2);

    const result = await processBatch(items, processor, {
      ...DEFAULT_BATCH_CONFIG,
      concurrency: 2,
    });

    expect(result.successful).toEqual([2, 4, 6, 8, 10]);
    expect(result.failed).toEqual([]);
    expect(processor).toHaveBeenCalledTimes(5);
  });

  it('should limit concurrency', async () => {
    const items = [1, 2, 3, 4];
    let concurrent = 0;
    let maxConcurrent = 0;

    const processor = vi.fn().mockImplementation(async (n: number) => {
      concurrent++;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((resolve) => setTimeout(resolve, 50));
      concurrent--;
      return n * 2;
    });

    await processBatch(items, processor, {
      ...DEFAULT_BATCH_CONFIG,
      concurrency: 2,
    });

    expect(maxConcurrent).toBeLessThanOrEqual(2);
  });

  it('should collect failed items when not stopping on error', async () => {
    const items = [1, 2, 3, 4, 5];
    const processor = vi.fn().mockImplementation(async (n: number) => {
      if (n === 3) {
        throw new Error('Failed on 3');
      }
      return n * 2;
    });

    const result = await processBatch(items, processor, {
      ...DEFAULT_BATCH_CONFIG,
      stopOnError: false,
    });

    expect(result.successful).toEqual([2, 4, 8, 10]);
    expect(result.failed).toHaveLength(1);
    expect(result.failed[0].input).toBe(3);
    expect(result.failed[0].error.message).toBe('Failed on 3');
  });

  it('should stop on first error when stopOnError is true', async () => {
    const items = [1, 2, 3, 4, 5];
    const processor = vi.fn().mockImplementation(async (n: number) => {
      if (n === 2) {
        throw new Error('Failed on 2');
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
      return n * 2;
    });

    const result = await processBatch(items, processor, {
      concurrency: 1,
      stopOnError: true,
      onProgress: null,
    });

    // Should have processed only items 1 and 2 (2 failed)
    expect(result.successful.length).toBeLessThanOrEqual(1);
    expect(result.failed).toHaveLength(1);
  });

  it('should call onProgress callback', async () => {
    const items = [1, 2, 3];
    const onProgress = vi.fn();
    const processor = vi.fn().mockImplementation(async (n: number) => n * 2);

    await processBatch(
      items,
      processor,
      {
        ...DEFAULT_BATCH_CONFIG,
        concurrency: 1,
        onProgress,
      },
      (n) => `item-${n}`
    );

    expect(onProgress).toHaveBeenCalled();

    // Check that progress reports contain expected fields
    const calls = onProgress.mock.calls;
    for (const [progress] of calls) {
      expect(progress).toHaveProperty('total', 3);
      expect(progress).toHaveProperty('completed');
      expect(progress).toHaveProperty('failed');
    }
  });

  it('should include item id in progress', async () => {
    const items = ['a', 'b', 'c'];
    const progressReports: BatchProgress[] = [];
    const onProgress = vi.fn((p: BatchProgress) => progressReports.push(p));

    const processor = vi.fn().mockImplementation(async (s: string) => s.toUpperCase());

    await processBatch(
      items,
      processor,
      {
        ...DEFAULT_BATCH_CONFIG,
        concurrency: 1,
        onProgress,
      },
      (s) => s
    );

    // At least one progress report should have a current item
    const reportsWithCurrent = progressReports.filter((p) => p.current !== undefined);
    expect(reportsWithCurrent.length).toBeGreaterThan(0);
  });

  it('should handle empty input array', async () => {
    const processor = vi.fn();

    const result = await processBatch([], processor, DEFAULT_BATCH_CONFIG);

    expect(result.successful).toEqual([]);
    expect(result.failed).toEqual([]);
    expect(processor).not.toHaveBeenCalled();
  });
});

describe('resolveBatchConfig', () => {
  it('should return defaults when no config provided', () => {
    const result = resolveBatchConfig(undefined);
    expect(result).toEqual(DEFAULT_BATCH_CONFIG);
  });

  it('should merge partial config with defaults', () => {
    const result = resolveBatchConfig({ concurrency: 10 });
    expect(result).toEqual({
      ...DEFAULT_BATCH_CONFIG,
      concurrency: 10,
    });
  });

  it('should preserve onProgress callback', () => {
    const onProgress = vi.fn();
    const result = resolveBatchConfig({ onProgress });
    expect(result.onProgress).toBe(onProgress);
  });

  it('should override stopOnError', () => {
    const result = resolveBatchConfig({ stopOnError: true });
    expect(result.stopOnError).toBe(true);
  });
});
