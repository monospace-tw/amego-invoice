import type { AxiosInstance } from 'axios';
import { sendRequest, sendGetRequest } from '../core/http.js';
import type { AmegoClientConfigInternal } from '../types/config.js';

/**
 * 手機條碼驗證回應
 */
export interface BarcodeValidationResponse {
  code: number;
  msg: string;
  valid?: boolean;
  carrierId1?: string;
  carrierId2?: string;
}

/**
 * 公司查詢 API 原始回應
 */
interface CompanyQueryRawResponse {
  code: number;
  msg: string;
  data?: Array<{
    ban: string;
    name?: string;
  }>;
}

/**
 * 公司查詢回應
 */
export interface CompanyQueryResponse {
  code: number;
  msg: string;
  data?: Array<{
    found: boolean;
    name?: string;
    taxId: string;
  }>;
}

/**
 * 中獎查詢回應
 */
export interface LotteryStatusResponse {
  code: number;
  msg: string;
  data?: {
    won: boolean | null;
    prizeType?: number;
    prizeAmount?: number;
    message?: string;
  };
}

/**
 * 獎項定義回應
 */
export interface LotteryPrizesResponse {
  code: number;
  msg: string;
  data?: Array<{
    period: string;
    prizes: Array<{
      type: number;
      name: string;
      amount: number;
      numbers: string[];
    }>;
  }>;
}

/**
 * 字軌資訊回應
 */
export interface TrackInfoResponse {
  code: number;
  msg: string;
  data?: Array<{
    period: string;
    track: string;
    start: string;
    end: string;
    remaining: number;
  }>;
}

/**
 * 伺服器時間回應
 */
export interface ServerTimeResponse {
  timestamp: number;
  text: string;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/**
 * 字軌取號回應
 */
export interface GetInvoiceNumbersResponse {
  code: number;
  msg: string;
  data?: string[];
}

/**
 * 字軌狀態回應
 */
export interface NumberStatusResponse {
  code: number;
  msg: string;
  data?: {
    available: boolean;
    invoiceTime?: number;
  };
}

/**
 * 工具操作類別
 */
export class UtilityOperations {
  constructor(
    private client: AxiosInstance,
    private config: AmegoClientConfigInternal
  ) {}

  /**
   * 驗證手機條碼（API 驗證）
   * POST /json/barcode
   *
   * @param barcode - 手機條碼
   * @returns 驗證結果
   */
  async validateBarcode(barcode: string): Promise<BarcodeValidationResponse> {
    const response = await sendRequest<BarcodeValidationResponse>(
      this.client,
      this.config,
      '/json/barcode',
      { Barcode: barcode }
    );

    return {
      ...response,
      valid: response.code === 0,
    };
  }

  /**
   * 查詢公司名稱
   * POST /json/ban_query
   *
   * @param taxId - 統一編號
   * @returns 公司資訊
   */
  async queryCompany(taxId: string): Promise<{ found: boolean; name?: string; taxId: string }> {
    const response = await this.queryCompanyMany([taxId]);
    return response.data?.[0] || { found: false, taxId };
  }

  /**
   * 批次查詢公司名稱
   * POST /json/ban_query
   *
   * @param taxIds - 統一編號陣列
   * @returns 公司資訊列表
   */
  async queryCompanyMany(taxIds: string[]): Promise<CompanyQueryResponse> {
    const rawResponse = await sendRequest<CompanyQueryRawResponse>(
      this.client,
      this.config,
      '/json/ban_query',
      taxIds.map((id) => ({ ban: id }))
    );

    // 轉換 API 回應格式
    return {
      code: rawResponse.code,
      msg: rawResponse.msg,
      data: rawResponse.data?.map((item) => ({
        found: !!item.name,
        name: item.name,
        taxId: item.ban,
      })),
    };
  }

  /**
   * 查詢發票中獎
   * POST /json/lottery_status
   *
   * @param invoiceNumber - 發票號碼
   * @returns 中獎資訊
   */
  async checkLottery(invoiceNumber: string): Promise<LotteryStatusResponse> {
    return sendRequest<LotteryStatusResponse>(
      this.client,
      this.config,
      '/json/lottery_status',
      { InvoiceNumber: invoiceNumber }
    );
  }

  /**
   * 取得獎項定義
   * POST /json/lottery_type
   *
   * @param period - 期別（選填，如 '11312' 表示 113 年 11-12 月）
   * @returns 獎項定義
   */
  async getLotteryPrizes(period?: string): Promise<LotteryPrizesResponse> {
    const data: Record<string, unknown> = {};
    if (period) data.Period = period;

    return sendRequest<LotteryPrizesResponse>(
      this.client,
      this.config,
      '/json/lottery_type',
      data
    );
  }

  /**
   * 取得字軌資訊
   * POST /json/track_all
   *
   * @param options - 查詢選項
   * @returns 字軌資訊
   */
  async getTrackInfo(options: { period?: string } = {}): Promise<TrackInfoResponse> {
    const data: Record<string, unknown> = {};
    if (options.period) data.Period = options.period;

    return sendRequest<TrackInfoResponse>(
      this.client,
      this.config,
      '/json/track_all',
      data
    );
  }

  /**
   * 取得伺服器時間
   * GET /json/time
   *
   * @returns 伺服器時間
   */
  async getServerTime(): Promise<ServerTimeResponse> {
    const response = await sendGetRequest<ServerTimeResponse>(
      this.client,
      '/json/time'
    );

    return response;
  }

  /**
   * 取得時間偏移量
   *
   * @returns 時間偏移量（秒）
   */
  async getTimeOffset(): Promise<number> {
    const localBefore = Math.floor(Date.now() / 1000);
    const response = await sendGetRequest<ServerTimeResponse>(
      this.client,
      '/json/time'
    );
    const localAfter = Math.floor(Date.now() / 1000);

    const localTime = Math.floor((localBefore + localAfter) / 2);
    return response.timestamp - localTime;
  }

  /**
   * 字軌取號
   * POST /json/track_get
   *
   * @param count - 取號數量
   * @param trackCode - 字軌代碼（選填）
   * @returns 發票號碼陣列
   */
  async getInvoiceNumbers(count: number, trackCode?: string): Promise<string[]> {
    const data: Record<string, unknown> = { Count: count };
    if (trackCode) data.TrackApiCode = trackCode;

    const response = await sendRequest<GetInvoiceNumbersResponse>(
      this.client,
      this.config,
      '/json/track_get',
      data
    );

    return response.data || [];
  }

  /**
   * 檢查號碼狀態
   * POST /json/track_status
   *
   * @param invoiceNumber - 發票號碼
   * @returns 號碼狀態
   */
  async checkNumberStatus(invoiceNumber: string): Promise<{ available: boolean; invoiceTime?: number }> {
    const response = await sendRequest<NumberStatusResponse>(
      this.client,
      this.config,
      '/json/track_status',
      { InvoiceNumber: invoiceNumber }
    );

    return response.data || { available: true };
  }
}
