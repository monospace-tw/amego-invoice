import type { StatusCode, ProductTaxType } from './common.js';

/**
 * 折讓商品項目
 */
export interface AllowanceProductItem {
  /** 原發票號碼 */
  OriginalInvoiceNumber: string;
  /** 原發票日期 */
  OriginalInvoiceDate: string;
  /** 品名 */
  OriginalDescription: string;
  /** 數量 */
  Quantity: number | string;
  /** 單位 */
  Unit?: string;
  /** 單價 */
  UnitPrice: number | string;
  /** 小計 */
  Amount: number | string;
  /** 課稅別 */
  Tax: ProductTaxType;
}

/**
 * 開立折讓請求資料
 */
export interface CreateAllowanceRequest {
  /** 折讓單號 */
  AllowanceNumber: string;
  /** 折讓日期 YYYY-MM-DD */
  AllowanceDate: string;
  /** 買方統一編號 */
  BuyerIdentifier: string;
  /** 買方名稱 */
  BuyerName: string;
  /** 買方地址 */
  BuyerAddress?: string;
  /** 買方電話 */
  BuyerTelephoneNumber?: string;
  /** 買方電子信箱 */
  BuyerEmailAddress?: string;
  /** 折讓商品明細 */
  ProductItem: AllowanceProductItem[];
  /** 應稅銷售額合計 */
  TaxAmount: number | string;
  /** 總計 */
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
  /** 輸出格式 */
  format?: 'buffer' | 'base64';
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
