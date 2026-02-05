import type {
  TaxType,
  ProductTaxType,
  CarrierType,
  StatusCode,
  InvoiceType,
  PrinterEncoding,
  DetailVat,
  ZeroTaxRateReason,
  CustomsClearanceMark,
} from './common.js';

/**
 * 商品項目 Product Item
 */
export interface ProductItem {
  /** 品名，不可超過256字 */
  Description: string;
  /** 數量，小數精準度到7位數 */
  Quantity: number | string;
  /** 單位，不可超過6字 */
  Unit?: string;
  /** 單價，小數精準度到7位數 */
  UnitPrice: number | string;
  /** 小計，小數精準度到7位數 */
  Amount: number | string;
  /** 備註，不可超過40字 */
  Remark?: string;
  /** 課稅別 */
  TaxType: ProductTaxType;
}

/**
 * 開立發票請求資料
 */
export interface CreateInvoiceRequest {
  /** 訂單編號，不可重複，不可超過40字 */
  OrderId: string;
  /** 指定字軌開立 */
  TrackApiCode?: string;
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
  /** 總備註，不可超過200字 */
  MainRemark?: string;
  /** 載具類別 */
  CarrierType?: CarrierType;
  /** 載具顯碼 */
  CarrierId1?: string;
  /** 載具隱碼 */
  CarrierId2?: string;
  /** 捐贈碼 */
  NPOBAN?: string;
  /** 商品陣列，最多 9999 筆 */
  ProductItem: ProductItem[];
  /** 應稅銷售額合計 */
  SalesAmount: number | string;
  /** 免稅銷售額合計 */
  FreeTaxSalesAmount: number | string;
  /** 零稅率銷售額合計 */
  ZeroTaxSalesAmount: number | string;
  /** 課稅別 */
  TaxType: TaxType;
  /** 稅率，為5%時填 0.05 */
  TaxRate: string;
  /** 營業稅額 */
  TaxAmount: number | string;
  /** 總計 */
  TotalAmount: number | string;
  /** 通關方式註記 */
  CustomsClearanceMark?: CustomsClearanceMark;
  /** 零稅率原因 */
  ZeroTaxRateReason?: ZeroTaxRateReason;
  /** 品牌名稱 */
  BrandName?: string;
  /** 明細單價為含稅或未稅 */
  DetailVat?: DetailVat;
  /** 明細小計處理方式 0:小數精準度到7位數 1:一律四捨五入到整數 */
  DetailAmountRound?: 0 | 1;
  /** 熱感應機型號代碼 */
  PrinterType?: number;
  /** 熱感應機編碼 */
  PrinterLang?: PrinterEncoding;
  /** 是否列印明細 1:列印 0:不列印 */
  PrintDetail?: 0 | 1;
}

/**
 * 開立發票回應資料
 */
export interface CreateInvoiceResponse {
  code: number;
  msg: string;
  /** 發票號碼 */
  invoice_number?: string;
  /** 發票開立時間 Unix timestamp */
  invoice_time?: number;
  /** 隨機碼 */
  random_number?: string;
  /** 電子發票的條碼內容 */
  barcode?: string;
  /** 電子發票的左側 QRCODE 內容 */
  qrcode_left?: string;
  /** 電子發票的右側 QRCODE 內容 */
  qrcode_right?: string;
  /** base64編碼的列印格式字串 */
  base64_data?: string;
}

/**
 * 作廢發票請求項目
 */
export interface CancelInvoiceItem {
  CancelInvoiceNumber: string;
}

/**
 * 發票狀態請求項目
 */
export interface InvoiceStatusItem {
  InvoiceNumber: string;
}

/**
 * 發票狀態回應資料
 */
export interface InvoiceStatusResponse {
  code: number;
  msg: string;
  data?: Array<{
    invoice_number: string;
    type: InvoiceType;
    status: StatusCode;
    total_amount: number;
  }>;
}

/**
 * 發票查詢回應資料
 */
export interface InvoiceDetailResponse {
  code: number;
  msg: string;
  data?: {
    invoice_number: string;
    invoice_time: number;
    random_number: string;
    buyer_identifier: string;
    buyer_name: string;
    seller_identifier: string;
    seller_name: string;
    tax_type: TaxType;
    tax_rate: string;
    tax_amount: number;
    sales_amount: number;
    free_tax_sales_amount: number;
    zero_tax_sales_amount: number;
    total_amount: number;
    items: Array<{
      description: string;
      quantity: number;
      unit: string;
      unit_price: number;
      amount: number;
      tax_type: ProductTaxType;
    }>;
  };
}

/**
 * 發票列表請求選項
 */
export interface InvoiceListOptions {
  /** 開始日期 YYYY-MM-DD */
  startDate?: string;
  /** 結束日期 YYYY-MM-DD */
  endDate?: string;
  /** 頁碼 */
  page?: number;
  /** 每頁筆數 */
  pageSize?: number;
  /**
   * 日期篩選類型
   * 1=發票開立日期, 2=發票上傳日期
   */
  dateSelect?: 1 | 2;
}

/**
 * 發票列表回應資料
 */
export interface InvoiceListResponse {
  code: number;
  msg: string;
  data?: Array<{
    invoice_number: string;
    invoice_time: number;
    total_amount: number;
    status: StatusCode;
  }>;
  total?: number;
  page?: number;
  page_size?: number;
}

/**
 * 發票檔案下載選項
 */
export interface InvoiceFileOptions {
  /** 輸出格式: 'buffer' (預設), 'base64', 'url' (直接回傳下載連結) */
  format?: 'buffer' | 'base64' | 'url';
  /**
   * 下載樣式 (預設: 0)
   * 有打統編: 0=A4整張, 1=A4(地址+A5), 2=A4(A5x2), 3=A5
   * 沒有打統編: 0=A4整張(背面兌獎聯，需雙面列印)
   */
  downloadStyle?: 0 | 1 | 2 | 3;
}

/**
 * 發票列印資料選項
 */
export interface InvoicePrintOptions {
  /** 熱感應機型號代碼 */
  printerType: number;
  /** 編碼格式 */
  encoding?: 'BIG5' | 'GBK' | 'UTF-8';
}

/**
 * 發票列印回應資料
 */
export interface InvoicePrintResponse {
  code: number;
  msg: string;
  base64_data?: string;
}

/**
 * 使用自訂號碼開立發票請求
 */
export interface CreateInvoiceWithNumberRequest extends CreateInvoiceRequest {
  /** 自訂發票號碼 */
  InvoiceNumber: string;
}
