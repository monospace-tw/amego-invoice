import type { RateLimitConfigInternal } from '../types/rate-limit.js';
import { DEFAULT_RATE_LIMIT_CONFIG } from '../types/rate-limit.js';
import { RateLimitExceededError } from '../errors.js';

interface QueuedRequest {
  resolve: () => void;
  reject: (error: Error) => void;
}

/**
 * Token Bucket 頻率限制器
 */
export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private queue: QueuedRequest[] = [];
  private readonly config: RateLimitConfigInternal;

  constructor(config: RateLimitConfigInternal) {
    this.config = config;
    this.tokens = config.burstSize;
    this.lastRefill = Date.now();
  }

  /**
   * 補充令牌
   */
  private refill(): void {
    const now = Date.now();
    const elapsed = now - this.lastRefill;
    const tokensToAdd = (elapsed / 1000) * this.config.requestsPerSecond;

    this.tokens = Math.min(this.tokens + tokensToAdd, this.config.burstSize);
    this.lastRefill = now;
  }

  /**
   * 計算下一個令牌可用的等待時間
   */
  private getTimeUntilNextToken(): number {
    if (this.tokens >= 1) {
      return 0;
    }

    const tokensNeeded = 1 - this.tokens;
    const msPerToken = 1000 / this.config.requestsPerSecond;
    return Math.ceil(tokensNeeded * msPerToken);
  }

  /**
   * 處理佇列中的請求
   */
  private processQueue(): void {
    while (this.queue.length > 0 && this.tokens >= 1) {
      const request = this.queue.shift();
      if (request) {
        this.tokens -= 1;
        request.resolve();
      }
    }
  }

  /**
   * 取得令牌（如果可用則立即返回，否則根據設定排隊或拋出錯誤）
   */
  async acquire(): Promise<void> {
    this.refill();

    // 如果有令牌，直接使用
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return;
    }

    // 如果不排隊，拋出錯誤
    if (!this.config.queueRequests) {
      throw new RateLimitExceededError(this.getTimeUntilNextToken());
    }

    // 檢查佇列是否已滿
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new RateLimitExceededError(this.getTimeUntilNextToken());
    }

    // 加入佇列等待
    return new Promise<void>((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.scheduleRefill();
    });
  }

  /**
   * 排程令牌補充和佇列處理
   */
  private scheduleRefill(): void {
    const timeUntilToken = this.getTimeUntilNextToken();

    if (timeUntilToken > 0) {
      setTimeout(() => {
        this.refill();
        this.processQueue();

        // 如果佇列還有請求，繼續排程
        if (this.queue.length > 0) {
          this.scheduleRefill();
        }
      }, timeUntilToken);
    }
  }

  /**
   * 取得目前狀態（用於除錯）
   */
  getStatus(): { tokens: number; queueLength: number } {
    this.refill();
    return {
      tokens: this.tokens,
      queueLength: this.queue.length,
    };
  }
}

/**
 * 合併頻率限制設定與預設值
 *
 * @param config - 使用者提供的設定
 * @returns 完整的頻率限制設定，或 null（如果停用）
 */
export function resolveRateLimitConfig(
  config?: Partial<RateLimitConfigInternal> | false | null
): RateLimitConfigInternal | null {
  if (config === false || config === null) {
    return null;
  }

  if (config === undefined) {
    return null; // 預設不啟用頻率限制
  }

  const resolved = {
    ...DEFAULT_RATE_LIMIT_CONFIG,
    ...config,
  };

  // 如果沒有指定 burstSize，預設為 requestsPerSecond * 2
  if (config.burstSize === undefined) {
    resolved.burstSize = resolved.requestsPerSecond * 2;
  }

  return resolved;
}
