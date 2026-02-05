import type { AxiosInstance } from 'axios';
import type { AmegoClientConfigInternal } from '../types/config.js';
import type { RetryConfigInternal } from '../types/retry.js';
import type { RateLimitConfigInternal } from '../types/rate-limit.js';
import type { LogConfigInternal } from '../types/logger.js';
import { TokenBucket } from './rate-limiter.js';
import { withRetry, calculateBackoffDelay } from './retry.js';
import { RequestLogger } from './logger.js';
import { sendRequest as baseSendRequest, sendGetRequest as baseSendGetRequest } from './http.js';

/**
 * 中介層上下文
 */
export interface MiddlewareContext {
  httpClient: AxiosInstance;
  config: AmegoClientConfigInternal;
  retryConfig: RetryConfigInternal | null;
  rateLimiter: TokenBucket | null;
  logger: RequestLogger;
}

/**
 * 建立中介層上下文
 */
export function createMiddlewareContext(
  httpClient: AxiosInstance,
  config: AmegoClientConfigInternal,
  retryConfig: RetryConfigInternal | null,
  rateLimitConfig: RateLimitConfigInternal | null,
  logConfig: LogConfigInternal
): MiddlewareContext {
  return {
    httpClient,
    config,
    retryConfig,
    rateLimiter: rateLimitConfig ? new TokenBucket(rateLimitConfig) : null,
    logger: new RequestLogger(logConfig),
  };
}

/**
 * 透過中介層發送請求
 *
 * 執行順序：Logger → RateLimiter → Retry → sendRequest
 */
export async function sendRequestWithMiddleware<T>(
  ctx: MiddlewareContext,
  endpoint: string,
  data: unknown
): Promise<T> {
  // 1. 記錄請求
  ctx.logger.logRequest('POST', endpoint, data);

  // 2. 頻率限制
  if (ctx.rateLimiter) {
    const status = ctx.rateLimiter.getStatus();
    if (status.queueLength > 0) {
      ctx.logger.logRateLimit(endpoint, status.queueLength);
    }
    await ctx.rateLimiter.acquire();
  }

  // 3. 重試包裝
  const executeRequest = async (): Promise<T> => {
    try {
      const result = await baseSendRequest<T>(
        ctx.httpClient,
        ctx.config,
        endpoint,
        data,
        false
      );
      ctx.logger.logResponse(endpoint, 200, result);
      return result;
    } catch (error) {
      ctx.logger.logError(endpoint, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  if (ctx.retryConfig) {
    let attempt = 0;
    return withRetry(async () => {
      const result = await executeRequest();
      return result;
    }, ctx.retryConfig);
  }

  return executeRequest();
}

/**
 * 透過中介層發送 GET 請求
 */
export async function sendGetRequestWithMiddleware<T>(
  ctx: MiddlewareContext,
  endpoint: string
): Promise<T> {
  ctx.logger.logRequest('GET', endpoint);

  if (ctx.rateLimiter) {
    await ctx.rateLimiter.acquire();
  }

  const executeRequest = async (): Promise<T> => {
    try {
      const result = await baseSendGetRequest<T>(ctx.httpClient, endpoint);
      ctx.logger.logResponse(endpoint, 200, result);
      return result;
    } catch (error) {
      ctx.logger.logError(endpoint, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  };

  if (ctx.retryConfig) {
    return withRetry(executeRequest, ctx.retryConfig);
  }

  return executeRequest();
}
