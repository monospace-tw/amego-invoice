import type { AxiosInstance } from 'axios';
import { createHttpClient } from './core/http.js';
import { InvoiceOperations } from './operations/invoice.js';
import { AllowanceOperations } from './operations/allowance.js';
import { UtilityOperations } from './operations/utility.js';
import { BatchOperations } from './operations/batch.js';
import type { AmegoClientConfig, AmegoClientConfigInternal } from './types/config.js';
import { DEFAULT_CONFIG } from './types/config.js';
import { DEFAULT_RETRY_CONFIG } from './types/retry.js';
import { DEFAULT_RATE_LIMIT_CONFIG } from './types/rate-limit.js';
import { DEFAULT_LOG_CONFIG } from './types/logger.js';
import { AmegoValidationError } from './errors.js';
import { resolveRetryConfig } from './core/retry.js';
import { resolveRateLimitConfig } from './core/rate-limiter.js';
import { resolveLogConfig } from './core/logger.js';

/**
 * Amego 電子發票 SDK 客戶端
 *
 * @example
 * ```typescript
 * import { AmegoClient } from '@monospace-tw/amego-invoice';
 *
 * const client = new AmegoClient({
 *   taxId: '12345678',
 *   appKey: 'your-app-key',
 * });
 *
 * // 開立發票
 * const result = await client.invoice.create({
 *   OrderId: 'A001',
 *   BuyerIdentifier: '0000000000',
 *   BuyerName: '客人',
 *   ProductItem: [...],
 *   // ...
 * });
 *
 * // 查詢發票
 * const status = await client.invoice.getStatus('AB12345678');
 *
 * // 折讓操作
 * await client.allowance.create({...});
 *
 * // 工具功能
 * const company = await client.utility.queryCompany('28080623');
 *
 * // 進階設定範例
 * const advancedClient = new AmegoClient({
 *   taxId: '12345678',
 *   appKey: 'your-app-key',
 *   retry: { maxRetries: 5, baseDelay: 2000 },
 *   rateLimit: { requestsPerSecond: 5 },
 *   logger: { level: 'debug' },
 * });
 *
 * // 批次開立發票
 * const batchResult = await advancedClient.invoice.createMany(invoices, {
 *   concurrency: 3,
 *   onProgress: (p) => console.log(`${p.completed}/${p.total}`),
 * });
 * ```
 */
export class AmegoClient {
  private readonly httpClient: AxiosInstance;
  private readonly config: AmegoClientConfigInternal;

  /** 發票操作 */
  readonly invoice: InvoiceOperations;

  /** 折讓操作 */
  readonly allowance: AllowanceOperations;

  /** 工具操作 */
  readonly utility: UtilityOperations;

  /** 批次操作 */
  readonly batch: BatchOperations;

  /**
   * 建立 Amego 客戶端
   *
   * @param config - 客戶端設定
   * @throws {AmegoValidationError} 設定驗證失敗
   */
  constructor(config: AmegoClientConfig) {
    // 驗證必要設定
    this.validateConfig(config);

    // 解析進階設定
    const retryConfig = resolveRetryConfig(
      config.retry === false ? false : config.retry
    );
    const rateLimitConfig = resolveRateLimitConfig(
      config.rateLimit === false ? false : config.rateLimit
    );
    const logConfig = resolveLogConfig(config.logger);

    // 合併預設設定
    this.config = {
      taxId: config.taxId,
      appKey: config.appKey,
      baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
      timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
      skipTimeSync: config.skipTimeSync ?? DEFAULT_CONFIG.skipTimeSync,
      retry: retryConfig,
      rateLimit: rateLimitConfig,
      logger: logConfig,
    };

    // 建立 HTTP 客戶端
    this.httpClient = createHttpClient(this.config);

    // 初始化操作類別
    this.invoice = new InvoiceOperations(this.httpClient, this.config);
    this.allowance = new AllowanceOperations(this.httpClient, this.config);
    this.utility = new UtilityOperations(this.httpClient, this.config);
    this.batch = new BatchOperations();
  }

  /**
   * 驗證客戶端設定
   */
  private validateConfig(config: AmegoClientConfig): void {
    const errors: string[] = [];

    if (!config.taxId) {
      errors.push('taxId is required');
    } else if (!/^\d{8}$/.test(config.taxId)) {
      errors.push('taxId must be 8 digits');
    }

    if (!config.appKey) {
      errors.push('appKey is required');
    }

    if (config.baseUrl && typeof config.baseUrl !== 'string') {
      errors.push('baseUrl must be a string');
    }

    if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
      errors.push('timeout must be a positive number');
    }

    // 驗證重試設定
    if (config.retry !== undefined && config.retry !== false) {
      const retry = config.retry;
      if (retry.maxRetries !== undefined && retry.maxRetries < 0) {
        errors.push('retry.maxRetries must be non-negative');
      }
      if (retry.baseDelay !== undefined && retry.baseDelay <= 0) {
        errors.push('retry.baseDelay must be positive');
      }
      if (retry.maxDelay !== undefined && retry.maxDelay <= 0) {
        errors.push('retry.maxDelay must be positive');
      }
    }

    // 驗證頻率限制設定
    if (config.rateLimit !== undefined && config.rateLimit !== false) {
      const rateLimit = config.rateLimit;
      if (rateLimit.requestsPerSecond !== undefined && rateLimit.requestsPerSecond <= 0) {
        errors.push('rateLimit.requestsPerSecond must be positive');
      }
      if (rateLimit.burstSize !== undefined && rateLimit.burstSize <= 0) {
        errors.push('rateLimit.burstSize must be positive');
      }
      if (rateLimit.maxQueueSize !== undefined && rateLimit.maxQueueSize < 0) {
        errors.push('rateLimit.maxQueueSize must be non-negative');
      }
    }

    // 驗證日誌設定
    if (config.logger) {
      const validLevels = ['debug', 'info', 'warn', 'error', 'none'];
      if (config.logger.level && !validLevels.includes(config.logger.level)) {
        errors.push(`logger.level must be one of: ${validLevels.join(', ')}`);
      }
    }

    if (errors.length > 0) {
      throw new AmegoValidationError('Invalid client configuration', errors);
    }
  }

  /**
   * 取得目前設定
   */
  getConfig(): Readonly<AmegoClientConfigInternal> {
    return { ...this.config };
  }
}
