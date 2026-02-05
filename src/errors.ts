/**
 * Amego SDK 錯誤基礎類別
 */
export class AmegoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AmegoError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * API 回應錯誤 (code !== 0)
 */
export class AmegoApiError extends AmegoError {
  /** API 錯誤代碼 */
  readonly code: number;
  /** 原始回應資料 */
  readonly response: unknown;

  constructor(code: number, message: string, response?: unknown) {
    super(message);
    this.name = 'AmegoApiError';
    this.code = code;
    this.response = response;
  }
}

/**
 * 網路連線錯誤
 */
export class AmegoNetworkError extends AmegoError {
  /** 原始錯誤 */
  readonly cause: Error;

  constructor(message: string, cause: Error) {
    super(message);
    this.name = 'AmegoNetworkError';
    this.cause = cause;
  }
}

/**
 * 本地驗證錯誤
 */
export class AmegoValidationError extends AmegoError {
  /** 驗證錯誤清單 */
  readonly errors: string[];

  constructor(message: string, errors: string[] = []) {
    super(message);
    this.name = 'AmegoValidationError';
    this.errors = errors;
  }
}

/**
 * 請求逾時錯誤
 */
export class AmegoTimeoutError extends AmegoError {
  /** 逾時時間（毫秒） */
  readonly timeout: number;

  constructor(timeout: number) {
    super(`Request timed out after ${timeout}ms`);
    this.name = 'AmegoTimeoutError';
    this.timeout = timeout;
  }
}

/**
 * 頻率限制超過錯誤
 */
export class RateLimitExceededError extends AmegoError {
  /** 可重試的等待時間（毫秒） */
  readonly retryAfter: number;

  constructor(retryAfter: number) {
    super(`Rate limit exceeded. Retry after ${retryAfter}ms`);
    this.name = 'RateLimitExceededError';
    this.retryAfter = retryAfter;
  }
}
