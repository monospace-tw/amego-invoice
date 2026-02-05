import type { Logger, LogLevel, LogConfigInternal } from '../types/logger.js';
import { DEFAULT_LOG_CONFIG } from '../types/logger.js';

/**
 * 日誌等級優先序（數字越小越詳細）
 */
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  none: 4,
};

/**
 * 預設 Console Logger 實作
 */
export const consoleLogger: Logger = {
  debug: (message: string, data?: unknown) => console.debug(`[DEBUG] ${message}`, data ?? ''),
  info: (message: string, data?: unknown) => console.info(`[INFO] ${message}`, data ?? ''),
  warn: (message: string, data?: unknown) => console.warn(`[WARN] ${message}`, data ?? ''),
  error: (message: string, data?: unknown) => console.error(`[ERROR] ${message}`, data ?? ''),
};

/**
 * 需要遮蔽的敏感欄位
 */
const SENSITIVE_FIELDS = [
  'appKey',
  'BuyerIdentifier',
  'BuyerName',
  'BuyerAddress',
  'BuyerPhone',
  'BuyerEmail',
  'CarrierId1',
  'CarrierId2',
  'NPOBAN',
];

/**
 * 遮蔽字串（保留前後各 3 字元）
 */
function maskString(value: string): string {
  if (value.length <= 6) {
    return '***';
  }
  return `${value.slice(0, 3)}***${value.slice(-3)}`;
}

/**
 * 遞迴遮蔽物件中的敏感欄位
 */
export function maskSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data === 'string') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => maskSensitiveData(item));
  }

  if (typeof data === 'object') {
    const masked: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_FIELDS.includes(key) && typeof value === 'string') {
        masked[key] = maskString(value);
      } else if (typeof value === 'object') {
        masked[key] = maskSensitiveData(value);
      } else {
        masked[key] = value;
      }
    }

    return masked;
  }

  return data;
}

/**
 * 請求日誌管理器
 */
export class RequestLogger {
  private readonly config: LogConfigInternal;
  private readonly logger: Logger;

  constructor(config: LogConfigInternal) {
    this.config = config;
    this.logger = config.logger || consoleLogger;
  }

  /**
   * 檢查是否應該記錄指定等級的日誌
   */
  private shouldLog(level: LogLevel): boolean {
    if (this.config.level === 'none') {
      return false;
    }
    return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[this.config.level];
  }

  /**
   * 處理資料（遮蔽敏感資訊）
   */
  private processData(data: unknown): unknown {
    if (this.config.maskSensitiveData) {
      return maskSensitiveData(data);
    }
    return data;
  }

  /**
   * 記錄請求
   */
  logRequest(method: string, endpoint: string, data?: unknown): void {
    if (!this.shouldLog('debug')) {
      return;
    }

    this.logger.debug(`Request: ${method} ${endpoint}`, this.processData(data));
  }

  /**
   * 記錄回應
   */
  logResponse(endpoint: string, statusCode: number, data?: unknown): void {
    if (!this.shouldLog('debug')) {
      return;
    }

    this.logger.debug(`Response: ${endpoint} (${statusCode})`, this.processData(data));
  }

  /**
   * 記錄錯誤
   */
  logError(endpoint: string, error: Error): void {
    if (!this.shouldLog('error')) {
      return;
    }

    this.logger.error(`Error: ${endpoint}`, {
      name: error.name,
      message: error.message,
    });
  }

  /**
   * 記錄重試
   */
  logRetry(endpoint: string, attempt: number, delay: number): void {
    if (!this.shouldLog('warn')) {
      return;
    }

    this.logger.warn(`Retry: ${endpoint}`, {
      attempt,
      delay,
    });
  }

  /**
   * 記錄頻率限制
   */
  logRateLimit(endpoint: string, queueLength: number): void {
    if (!this.shouldLog('warn')) {
      return;
    }

    this.logger.warn(`Rate limited: ${endpoint}`, {
      queueLength,
    });
  }

  /**
   * 通用日誌方法
   */
  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      this.logger.debug(message, this.processData(data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      this.logger.info(message, this.processData(data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      this.logger.warn(message, this.processData(data));
    }
  }

  error(message: string, data?: unknown): void {
    if (this.shouldLog('error')) {
      this.logger.error(message, this.processData(data));
    }
  }
}

/**
 * 合併日誌設定與預設值
 *
 * @param config - 使用者提供的設定
 * @returns 完整的日誌設定
 */
export function resolveLogConfig(
  config?: Partial<LogConfigInternal> | null
): LogConfigInternal {
  if (!config) {
    return { ...DEFAULT_LOG_CONFIG };
  }

  return {
    ...DEFAULT_LOG_CONFIG,
    ...config,
    logger: config.logger ?? null,
  };
}
