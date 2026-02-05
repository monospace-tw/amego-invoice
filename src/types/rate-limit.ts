/**
 * 頻率限制設定
 */
export interface RateLimitConfig {
  /** 每秒請求數，預設 10 */
  requestsPerSecond?: number;
  /** 突發容量，預設 requestsPerSecond * 2 */
  burstSize?: number;
  /** 是否將請求排隊等待，預設 true */
  queueRequests?: boolean;
  /** 最大佇列長度，預設 100 */
  maxQueueSize?: number;
}

/**
 * 內部使用的完整頻率限制設定（含預設值）
 */
export interface RateLimitConfigInternal {
  requestsPerSecond: number;
  burstSize: number;
  queueRequests: boolean;
  maxQueueSize: number;
}

/**
 * 預設頻率限制設定
 */
export const DEFAULT_RATE_LIMIT_CONFIG: RateLimitConfigInternal = {
  requestsPerSecond: 10,
  burstSize: 20,
  queueRequests: true,
  maxQueueSize: 100,
};
