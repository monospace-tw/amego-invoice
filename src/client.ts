import type { AxiosInstance } from 'axios';
import { createHttpClient } from './core/http.js';
import { InvoiceOperations } from './operations/invoice.js';
import { AllowanceOperations } from './operations/allowance.js';
import { UtilityOperations } from './operations/utility.js';
import type { AmegoClientConfig, AmegoClientConfigInternal } from './types/config.js';
import { DEFAULT_CONFIG } from './types/config.js';
import { AmegoValidationError } from './errors.js';

/**
 * Amego 電子發票 SDK 客戶端
 *
 * @example
 * ```typescript
 * import { AmegoClient } from '@trunkstudio/amego-invoice';
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

  /**
   * 建立 Amego 客戶端
   *
   * @param config - 客戶端設定
   * @throws {AmegoValidationError} 設定驗證失敗
   */
  constructor(config: AmegoClientConfig) {
    // 驗證必要設定
    this.validateConfig(config);

    // 合併預設設定
    this.config = {
      taxId: config.taxId,
      appKey: config.appKey,
      baseUrl: config.baseUrl ?? DEFAULT_CONFIG.baseUrl,
      timeout: config.timeout ?? DEFAULT_CONFIG.timeout,
      skipTimeSync: config.skipTimeSync ?? DEFAULT_CONFIG.skipTimeSync,
    };

    // 建立 HTTP 客戶端
    this.httpClient = createHttpClient(this.config);

    // 初始化操作類別
    this.invoice = new InvoiceOperations(this.httpClient, this.config);
    this.allowance = new AllowanceOperations(this.httpClient, this.config);
    this.utility = new UtilityOperations(this.httpClient, this.config);
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
