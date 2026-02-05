import type { AxiosInstance } from 'axios';
import { sendRequest } from '../core/http.js';
import type { AmegoClientConfigInternal } from '../types/config.js';
import type {
  CreateAllowanceRequest,
  CreateAllowanceResponse,
  CancelAllowanceItem,
  AllowanceStatusItem,
  AllowanceStatusResponse,
  AllowanceDetailResponse,
  AllowanceListOptions,
  AllowanceListResponse,
  AllowanceFileOptions,
  AllowancePrintOptions,
  AllowancePrintResponse,
} from '../types/allowance.js';
import type { ApiResponse } from '../types/common.js';

/**
 * 折讓操作類別
 */
export class AllowanceOperations {
  constructor(
    private client: AxiosInstance,
    private config: AmegoClientConfigInternal
  ) {}

  /**
   * 開立折讓
   * POST /json/g0401
   *
   * @param data - 折讓資料
   * @returns 折讓回應
   */
  async create(data: CreateAllowanceRequest): Promise<CreateAllowanceResponse> {
    return sendRequest<CreateAllowanceResponse>(
      this.client,
      this.config,
      '/json/g0401',
      data
    );
  }

  /**
   * 作廢折讓
   * POST /json/g0501
   *
   * @param allowanceNumber - 折讓單號
   * @returns API 回應
   */
  async cancel(allowanceNumber: string): Promise<ApiResponse> {
    return this.cancelMany([allowanceNumber]);
  }

  /**
   * 批次作廢折讓
   * POST /json/g0501
   *
   * @param allowanceNumbers - 折讓單號陣列
   * @returns API 回應
   */
  async cancelMany(allowanceNumbers: string[]): Promise<ApiResponse> {
    const items: CancelAllowanceItem[] = allowanceNumbers.map((num) => ({
      CancelAllowanceNumber: num,
    }));

    return sendRequest<ApiResponse>(
      this.client,
      this.config,
      '/json/g0501',
      items
    );
  }

  /**
   * 查詢折讓狀態
   * POST /json/allowance_status
   *
   * @param allowanceNumber - 折讓單號
   * @returns 折讓狀態
   */
  async getStatus(allowanceNumber: string): Promise<AllowanceStatusResponse> {
    return this.getStatusMany([allowanceNumber]);
  }

  /**
   * 批次查詢折讓狀態
   * POST /json/allowance_status
   *
   * @param allowanceNumbers - 折讓單號陣列
   * @returns 折讓狀態列表
   */
  async getStatusMany(allowanceNumbers: string[]): Promise<AllowanceStatusResponse> {
    const items: AllowanceStatusItem[] = allowanceNumbers.map((num) => ({
      AllowanceNumber: num,
    }));

    return sendRequest<AllowanceStatusResponse>(
      this.client,
      this.config,
      '/json/allowance_status',
      items
    );
  }

  /**
   * 查詢折讓明細
   * POST /json/allowance_query
   *
   * @param allowanceNumber - 折讓單號
   * @returns 折讓明細
   */
  async getDetail(allowanceNumber: string): Promise<AllowanceDetailResponse> {
    return sendRequest<AllowanceDetailResponse>(
      this.client,
      this.config,
      '/json/allowance_query',
      { AllowanceNumber: allowanceNumber }
    );
  }

  /**
   * 折讓列表
   * POST /json/allowance_list
   *
   * @param options - 查詢選項
   * @returns 折讓列表
   */
  async list(options: AllowanceListOptions = {}): Promise<AllowanceListResponse> {
    const data: Record<string, unknown> = {};

    if (options.startDate) data.start_date = options.startDate;
    if (options.endDate) data.end_date = options.endDate;
    if (options.page) data.page = options.page;
    if (options.pageSize) data.page_size = options.pageSize;

    return sendRequest<AllowanceListResponse>(
      this.client,
      this.config,
      '/json/allowance_list',
      data
    );
  }

  /**
   * 下載折讓 PDF
   * POST /json/allowance_file
   *
   * @param allowanceNumber - 折讓單號
   * @param options - 下載選項
   * @returns PDF 內容（Buffer 或 base64 字串）
   */
  async downloadPdf(
    allowanceNumber: string,
    options: AllowanceFileOptions = {}
  ): Promise<Buffer | string> {
    const response = await sendRequest<{ code: number; msg: string; base64_data?: string }>(
      this.client,
      this.config,
      '/json/allowance_file',
      { AllowanceNumber: allowanceNumber }
    );

    if (!response.base64_data) {
      throw new Error('No PDF data returned');
    }

    if (options.format === 'base64') {
      return response.base64_data;
    }

    return Buffer.from(response.base64_data, 'base64');
  }

  /**
   * 取得折讓列印資料
   * POST /json/allowance_print
   *
   * @param allowanceNumber - 折讓單號
   * @param options - 列印選項
   * @returns 列印資料
   */
  async getPrintData(
    allowanceNumber: string,
    options: AllowancePrintOptions
  ): Promise<AllowancePrintResponse> {
    const encodingMap: Record<string, number> = {
      BIG5: 1,
      GBK: 2,
      'UTF-8': 3,
    };

    const data: Record<string, unknown> = {
      AllowanceNumber: allowanceNumber,
      PrinterType: options.printerType,
    };

    if (options.encoding) {
      data.PrinterLang = encodingMap[options.encoding] || 3;
    }

    return sendRequest<AllowancePrintResponse>(
      this.client,
      this.config,
      '/json/allowance_print',
      data
    );
  }
}
