import type { RetryConfigInternal } from '../types/retry.js';
import { DEFAULT_RETRY_CONFIG } from '../types/retry.js';
import { AmegoNetworkError, AmegoTimeoutError, AmegoApiError } from '../errors.js';

/**
 * 計算指數退避延遲時間（含 jitter）
 *
 * @param attempt - 目前重試次數（從 0 開始）
 * @param config - 重試設定
 * @returns 延遲時間（毫秒）
 */
export function calculateBackoffDelay(attempt: number, config: RetryConfigInternal): number {
  const exponentialDelay = config.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * (config.baseDelay / 2);
  const delay = exponentialDelay + jitter;
  return Math.min(delay, config.maxDelay);
}

/**
 * 判斷錯誤是否可重試
 *
 * @param error - 錯誤物件
 * @param config - 重試設定
 * @returns 是否可重試
 */
export function isRetryableError(error: unknown, config: RetryConfigInternal): boolean {
  // 網路錯誤
  if (error instanceof AmegoNetworkError && config.retryNetworkErrors) {
    return true;
  }

  // 逾時錯誤
  if (error instanceof AmegoTimeoutError && config.retryNetworkErrors) {
    return true;
  }

  // API 錯誤（檢查可重試的錯誤碼）
  if (error instanceof AmegoApiError) {
    return config.retryableErrors.includes(error.code);
  }

  return false;
}

/**
 * 延遲等待
 *
 * @param ms - 等待時間（毫秒）
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 包裝函數以支援自動重試
 *
 * @param fn - 要執行的非同步函數
 * @param config - 重試設定（可選）
 * @returns 函數執行結果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfigInternal | null
): Promise<T> {
  // 如果沒有設定或 maxRetries 為 0，直接執行
  if (!config || config.maxRetries === 0) {
    return fn();
  }

  const retryConfig: RetryConfigInternal = {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };

  let lastError: unknown;
  let attempt = 0;

  while (attempt <= retryConfig.maxRetries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 檢查是否可重試
      if (!isRetryableError(error, retryConfig)) {
        throw error;
      }

      // 檢查是否還有重試次數
      if (attempt >= retryConfig.maxRetries) {
        throw error;
      }

      // 計算延遲並等待
      const delay = calculateBackoffDelay(attempt, retryConfig);
      await sleep(delay);

      attempt++;
    }
  }

  // 不應該到達這裡，但為了型別安全
  throw lastError;
}

/**
 * 合併重試設定與預設值
 *
 * @param config - 使用者提供的設定
 * @returns 完整的重試設定，或 null（如果停用）
 */
export function resolveRetryConfig(
  config?: RetryConfigInternal | Partial<RetryConfigInternal> | false | null
): RetryConfigInternal | null {
  if (config === false || config === null) {
    return null;
  }

  if (config === undefined) {
    return { ...DEFAULT_RETRY_CONFIG };
  }

  return {
    ...DEFAULT_RETRY_CONFIG,
    ...config,
  };
}
