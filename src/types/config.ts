import type { RetryConfig, RetryConfigInternal } from './retry.js';
import type { RateLimitConfig, RateLimitConfigInternal } from './rate-limit.js';
import type { LogConfig, LogConfigInternal } from './logger.js';

/**
 * Amego Client 設定選項
 */
export interface AmegoClientConfig {
  /** 統一編號 */
  taxId: string;
  /** APP KEY */
  appKey: string;
  /** API 基礎網址，預設為 https://invoice-api.amego.tw */
  baseUrl?: string;
  /** 請求逾時時間（毫秒），預設 30000 */
  timeout?: number;
  /** 是否跳過時間同步，預設 false */
  skipTimeSync?: boolean;
  /** 重試策略設定，設為 false 停用重試 */
  retry?: RetryConfig | false;
  /** 頻率限制設定，設為 false 停用限制 */
  rateLimit?: RateLimitConfig | false;
  /** 日誌設定 */
  logger?: LogConfig;
}

/**
 * 內部使用的完整設定（含預設值）
 */
export interface AmegoClientConfigInternal {
  taxId: string;
  appKey: string;
  baseUrl: string;
  timeout: number;
  skipTimeSync: boolean;
  retry: RetryConfigInternal | null;
  rateLimit: RateLimitConfigInternal | null;
  logger: LogConfigInternal;
}

/**
 * 預設設定值
 */
export const DEFAULT_CONFIG = {
  baseUrl: 'https://invoice-api.amego.tw',
  timeout: 30000,
  skipTimeSync: false,
} as const;

// Re-export types for convenience
export type { RetryConfig, RateLimitConfig, LogConfig };
