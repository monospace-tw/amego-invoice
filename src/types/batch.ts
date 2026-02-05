/**
 * 批次操作設定
 */
export interface BatchConfig {
  /** 並發數，預設 5 */
  concurrency?: number;
  /** 遇到錯誤時是否停止，預設 false */
  stopOnError?: boolean;
  /** 進度回報回呼函數 */
  onProgress?: (progress: BatchProgress) => void;
}

/**
 * 批次操作進度
 */
export interface BatchProgress {
  /** 總數 */
  total: number;
  /** 已完成數 */
  completed: number;
  /** 成功數 */
  successful: number;
  /** 失敗數 */
  failed: number;
  /** 目前處理中的項目識別碼 */
  current?: string;
}

/**
 * 批次操作結果
 */
export interface BatchResult<T> {
  /** 成功的結果 */
  successful: T[];
  /** 失敗的項目 */
  failed: Array<{
    /** 原始輸入 */
    input: unknown;
    /** 錯誤 */
    error: Error;
  }>;
}

/**
 * 內部使用的完整批次設定（含預設值）
 */
export interface BatchConfigInternal {
  concurrency: number;
  stopOnError: boolean;
  onProgress: ((progress: BatchProgress) => void) | null;
}

/**
 * 預設批次設定
 */
export const DEFAULT_BATCH_CONFIG: BatchConfigInternal = {
  concurrency: 5,
  stopOnError: false,
  onProgress: null,
};
