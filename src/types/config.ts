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
}

/**
 * 預設設定值
 */
export const DEFAULT_CONFIG = {
  baseUrl: 'https://invoice-api.amego.tw',
  timeout: 30000,
  skipTimeSync: false,
} as const;
