/**
 * 課稅別 Tax Type
 * 1: 應稅 (Taxable)
 * 2: 零稅率 (Zero-rate)
 * 3: 免稅 (Tax-exempt)
 * 4: 應稅(特種稅率) (Special rate)
 * 9: 混合 (Mixed)
 */
export type TaxType = 1 | 2 | 3 | 4 | 9;

/**
 * 商品課稅別 Product Tax Type
 * 1: 應稅 (Taxable)
 * 2: 零稅率 (Zero-rate)
 * 3: 免稅 (Tax-exempt)
 */
export type ProductTaxType = 1 | 2 | 3;

/**
 * 載具類別 Carrier Type
 * 3J0002: 手機條碼 (Mobile barcode)
 * CQ0001: 自然人憑證 (Natural person certificate)
 * amego: 光貿會員載具 (Amego member carrier)
 */
export type CarrierType = '3J0002' | 'CQ0001' | 'amego' | '';

/**
 * 發票狀態碼 Invoice Status Code
 * 1: 待處理 (Pending)
 * 2: 上傳中 (Uploading)
 * 3: 已上傳 (Uploaded)
 * 31: 處理中 (Processing)
 * 32: 處理完成/待確認 (Complete/Pending confirmation)
 * 91: 錯誤 (Error)
 * 99: 完成 (Complete)
 */
export type StatusCode = 1 | 2 | 3 | 31 | 32 | 91 | 99;

/**
 * 發票類型 Invoice Type
 */
export type InvoiceType =
  | 'NOT_FOUND'
  | 'C0401'
  | 'C0501'
  | 'C0701'
  | 'F0401'
  | 'F0501'
  | 'TYPE_ERROR';

/**
 * 印表機編碼 Printer Encoding
 * 1: BIG5
 * 2: GBK
 * 3: UTF-8
 */
export type PrinterEncoding = 1 | 2 | 3;

/**
 * 明細單價含稅/未稅 Detail VAT
 * 0: 未稅價 (Exclusive)
 * 1: 含稅價 (Inclusive, default)
 */
export type DetailVat = 0 | 1;

/**
 * 零稅率原因 Zero Tax Rate Reason
 */
export type ZeroTaxRateReason = 71 | 72 | 73 | 74 | 75 | 76 | 77 | 78 | 79;

/**
 * 通關方式註記 Customs Clearance Mark
 * 1: 非經海關出口 (Non-customs export)
 * 2: 經海關出口 (Customs export)
 */
export type CustomsClearanceMark = 1 | 2;

/**
 * API 基本回應
 */
export interface ApiResponse {
  code: number;
  msg: string;
}

/**
 * 狀態描述對照
 */
export const STATUS_DESCRIPTIONS: Record<StatusCode, string> = {
  1: '待處理',
  2: '上傳中',
  3: '已上傳',
  31: '處理中',
  32: '處理完成/待確認',
  91: '錯誤',
  99: '完成',
};
