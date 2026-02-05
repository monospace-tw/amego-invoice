/**
 * 重試策略設定
 */
export interface RetryConfig {
  /** 最大重試次數，預設 3 */
  maxRetries?: number;
  /** 基礎延遲時間（毫秒），預設 1000 */
  baseDelay?: number;
  /** 最大延遲時間（毫秒），預設 30000 */
  maxDelay?: number;
  /** 可重試的 API 錯誤碼 */
  retryableErrors?: number[];
  /** 是否重試網路錯誤，預設 true */
  retryNetworkErrors?: boolean;
}

/**
 * 內部使用的完整重試設定（含預設值）
 */
export interface RetryConfigInternal {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableErrors: number[];
  retryNetworkErrors: boolean;
}

/**
 * 預設重試設定
 */
export const DEFAULT_RETRY_CONFIG: RetryConfigInternal = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  retryableErrors: [],
  retryNetworkErrors: true,
};
