import type { StatusCode, ProductTaxType } from './common.js';

/**
 * 折讓商品項目
 */
export interface AllowanceProductItem {
  /** 原發票號碼 */
  OriginalInvoiceNumber: string;
  /** 原發票日期 YYYYMMDD */
  OriginalInvoiceDate: string | number;
  /** 原品名，不可超過256字 */
  OriginalDescription: string;
  /** 數量 */
  Quantity: number | string;
  /** 單位 */
  Unit?: string;
  /** 單價(不含稅) */
  UnitPrice: number | string;
  /** 小計(不含稅) */
  Amount: number | string;
  /** 稅金 */
  Tax: number | string;
  /** 課稅別 1=應稅 2=零稅率 3=免稅 */
  TaxType: ProductTaxType;
}

/**
 * 開立折讓請求資料
 */
export interface CreateAllowanceRequest {
  /** 折讓單號，不可重複，不可超過16字 */
  AllowanceNumber: string;
  /** 折讓日期 YYYYMMDD */
  AllowanceDate: string | number;
  /**
   * 折讓類別
   * 1=買方開立折讓證明單, 2=賣方折讓證明通知單
   */
  AllowanceType: '1' | '2' | 1 | 2;
  /** 買方統一編號，沒有則填入 0000000000 */
  BuyerIdentifier: string;
  /** 買方名稱 */
  BuyerName: string;
  /** 買方地址 */
  BuyerAddress?: string;
  /** 買方電話 */
  BuyerTelephoneNumber?: string;
  /** 買方電子信箱 */
  BuyerEmailAddress?: string;
  /** 折讓商品明細，最多 9999 筆 */
  ProductItem: AllowanceProductItem[];
  /** 營業稅額 */
  TaxAmount: number | string;
  /** 金額合計(不含稅) */
  TotalAmount: number | string;
}

/**
 * 開立折讓回應資料
 */
export interface CreateAllowanceResponse {
  code: number;
  msg: string;
  /** 折讓單號 */
  allowance_number?: string;
  /** 折讓時間 Unix timestamp */
  allowance_time?: number;
}

/**
 * 作廢折讓請求項目
 */
export interface CancelAllowanceItem {
  CancelAllowanceNumber: string;
}

/**
 * 折讓狀態請求項目
 */
export interface AllowanceStatusItem {
  AllowanceNumber: string;
}

/**
 * 折讓狀態回應資料
 */
export interface AllowanceStatusResponse {
  code: number;
  msg: string;
  data?: Array<{
    allowance_number: string;
    status: StatusCode;
    total_amount: number;
  }>;
}

/**
 * 折讓查詢回應資料
 */
export interface AllowanceDetailResponse {
  code: number;
  msg: string;
  data?: {
    allowance_number: string;
    allowance_time: number;
    buyer_identifier: string;
    buyer_name: string;
    seller_identifier: string;
    seller_name: string;
    tax_amount: number;
    total_amount: number;
    items: Array<{
      original_invoice_number: string;
      original_description: string;
      quantity: number;
      unit: string;
      unit_price: number;
      amount: number;
      tax: ProductTaxType;
    }>;
  };
}

/**
 * 折讓列表請求選項
 */
export interface AllowanceListOptions {
  /** 開始日期 YYYY-MM-DD */
  startDate?: string;
  /** 結束日期 YYYY-MM-DD */
  endDate?: string;
  /** 頁碼 */
  page?: number;
  /** 每頁筆數 */
  pageSize?: number;
}

/**
 * 折讓列表回應資料
 */
export interface AllowanceListResponse {
  code: number;
  msg: string;
  data?: Array<{
    allowance_number: string;
    allowance_time: number;
    total_amount: number;
    status: StatusCode;
  }>;
  total?: number;
  page?: number;
  page_size?: number;
}

/**
 * 折讓檔案下載選項
 */
export interface AllowanceFileOptions {
  /** 輸出格式: 'buffer' (預設), 'base64', 'url' (直接回傳下載連結) */
  format?: 'buffer' | 'base64' | 'url';
  /**
   * 下載樣式 (預設: 0)
   * 0=A4整張, 1=A4(地址+A5), 3=A5
   */
  downloadStyle?: 0 | 1 | 3;
}

/**
 * 折讓列印資料選項
 */
export interface AllowancePrintOptions {
  /** 熱感應機型號代碼 */
  printerType: number;
  /** 編碼格式 */
  encoding?: 'BIG5' | 'GBK' | 'UTF-8';
}

/**
 * 折讓列印回應資料
 */
export interface AllowancePrintResponse {
  code: number;
  msg: string;
  base64_data?: string;
}
