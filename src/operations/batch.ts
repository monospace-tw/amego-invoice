import type { BatchConfig, BatchProgress, BatchResult, BatchConfigInternal } from '../types/batch.js';
import { DEFAULT_BATCH_CONFIG } from '../types/batch.js';

/**
 * 信號量實作（用於並發控制）
 */
class Semaphore {
  private permits: number;
  private queue: Array<() => void> = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  release(): void {
    const next = this.queue.shift();
    if (next) {
      next();
    } else {
      this.permits++;
    }
  }
}

/**
 * 合併批次設定與預設值
 */
export function resolveBatchConfig(config?: BatchConfig): BatchConfigInternal {
  return {
    concurrency: config?.concurrency ?? DEFAULT_BATCH_CONFIG.concurrency,
    stopOnError: config?.stopOnError ?? DEFAULT_BATCH_CONFIG.stopOnError,
    onProgress: config?.onProgress ?? DEFAULT_BATCH_CONFIG.onProgress,
  };
}

/**
 * 批次處理器
 *
 * @param items - 要處理的項目
 * @param processor - 處理單一項目的函數
 * @param config - 批次設定
 * @param getItemId - 取得項目識別碼的函數（用於進度回報）
 * @returns 批次處理結果
 */
export async function processBatch<TInput, TOutput>(
  items: TInput[],
  processor: (item: TInput) => Promise<TOutput>,
  config: BatchConfigInternal,
  getItemId?: (item: TInput) => string
): Promise<BatchResult<TOutput>> {
  const semaphore = new Semaphore(config.concurrency);
  const successful: TOutput[] = [];
  const failed: Array<{ input: unknown; error: Error }> = [];
  let completed = 0;
  let stopped = false;

  const reportProgress = (current?: string): void => {
    if (config.onProgress) {
      const progress: BatchProgress = {
        total: items.length,
        completed,
        successful: successful.length,
        failed: failed.length,
        current,
      };
      config.onProgress(progress);
    }
  };

  const processItem = async (item: TInput): Promise<void> => {
    if (stopped) {
      return;
    }

    await semaphore.acquire();

    try {
      if (stopped) {
        return;
      }

      const itemId = getItemId ? getItemId(item) : undefined;
      reportProgress(itemId);

      const result = await processor(item);
      successful.push(result);
    } catch (error) {
      failed.push({
        input: item,
        error: error instanceof Error ? error : new Error(String(error)),
      });

      if (config.stopOnError) {
        stopped = true;
      }
    } finally {
      completed++;
      semaphore.release();
      reportProgress();
    }
  };

  // 並行處理所有項目
  await Promise.all(items.map(processItem));

  return { successful, failed };
}

/**
 * 批次操作類別
 */
export class BatchOperations {
  /**
   * 批次執行操作
   *
   * @param items - 要處理的項目
   * @param processor - 處理單一項目的函數
   * @param config - 批次設定
   * @param getItemId - 取得項目識別碼的函數
   * @returns 批次處理結果
   */
  async execute<TInput, TOutput>(
    items: TInput[],
    processor: (item: TInput) => Promise<TOutput>,
    config?: BatchConfig,
    getItemId?: (item: TInput) => string
  ): Promise<BatchResult<TOutput>> {
    const resolvedConfig = resolveBatchConfig(config);
    return processBatch(items, processor, resolvedConfig, getItemId);
  }
}
