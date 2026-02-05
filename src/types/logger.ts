/**
 * 日誌等級
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'none';

/**
 * Logger 介面
 */
export interface Logger {
  debug(message: string, data?: unknown): void;
  info(message: string, data?: unknown): void;
  warn(message: string, data?: unknown): void;
  error(message: string, data?: unknown): void;
}

/**
 * 日誌設定
 */
export interface LogConfig {
  /** 自訂 logger 實作 */
  logger?: Logger;
  /** 日誌等級，預設 'none' (停用) */
  level?: LogLevel;
  /** 是否遮蔽敏感資料，預設 true */
  maskSensitiveData?: boolean;
}

/**
 * 內部使用的完整日誌設定（含預設值）
 */
export interface LogConfigInternal {
  logger: Logger | null;
  level: LogLevel;
  maskSensitiveData: boolean;
}

/**
 * 預設日誌設定
 */
export const DEFAULT_LOG_CONFIG: LogConfigInternal = {
  logger: null,
  level: 'none',
  maskSensitiveData: true,
};
