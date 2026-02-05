import type { AxiosInstance } from 'axios';
import { sendRequest } from '../core/http.js';
import type { AmegoClientConfigInternal } from '../types/config.js';
import type {
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  CancelInvoiceItem,
  InvoiceStatusItem,
  InvoiceStatusResponse,
  InvoiceDetailResponse,
  InvoiceListOptions,
  InvoiceListResponse,
  InvoiceFileOptions,
  InvoicePrintOptions,
  InvoicePrintResponse,
  CreateInvoiceWithNumberRequest,
} from '../types/invoice.js';
import type { ApiResponse } from '../types/common.js';

/**
 * 發票操作類別
 */
export class InvoiceOperations {
  constructor(
    private client: AxiosInstance,
    private config: AmegoClientConfigInternal
  ) {}

  /**
   * 開立發票（自動配號）
   * POST /json/f0401
   *
   * @param data - 發票資料
   * @returns 發票回應
   */
  async create(data: CreateInvoiceRequest): Promise<CreateInvoiceResponse> {
    return sendRequest<CreateInvoiceResponse>(
      this.client,
      this.config,
      '/json/f0401',
      data
    );
  }

  /**
   * 作廢發票
   * POST /json/f0501
   *
   * @param invoiceNumber - 發票號碼
   * @returns API 回應
   */
  async cancel(invoiceNumber: string): Promise<ApiResponse> {
    return this.cancelMany([invoiceNumber]);
  }

  /**
   * 批次作廢發票
   * POST /json/f0501
   *
   * @param invoiceNumbers - 發票號碼陣列
   * @returns API 回應
   */
  async cancelMany(invoiceNumbers: string[]): Promise<ApiResponse> {
    const items: CancelInvoiceItem[] = invoiceNumbers.map((num) => ({
      CancelInvoiceNumber: num,
    }));

    return sendRequest<ApiResponse>(
      this.client,
      this.config,
      '/json/f0501',
      items
    );
  }

  /**
   * 查詢發票狀態
   * POST /json/invoice_status
   *
   * @param invoiceNumber - 發票號碼
   * @returns 發票狀態
   */
  async getStatus(invoiceNumber: string): Promise<InvoiceStatusResponse> {
    return this.getStatusMany([invoiceNumber]);
  }

  /**
   * 批次查詢發票狀態
   * POST /json/invoice_status
   *
   * @param invoiceNumbers - 發票號碼陣列
   * @returns 發票狀態列表
   */
  async getStatusMany(invoiceNumbers: string[]): Promise<InvoiceStatusResponse> {
    const items: InvoiceStatusItem[] = invoiceNumbers.map((num) => ({
      InvoiceNumber: num,
    }));

    return sendRequest<InvoiceStatusResponse>(
      this.client,
      this.config,
      '/json/invoice_status',
      items
    );
  }

  /**
   * 查詢發票明細
   * POST /json/invoice_query
   *
   * @param invoiceNumber - 發票號碼
   * @returns 發票明細
   */
  async getDetail(invoiceNumber: string): Promise<InvoiceDetailResponse> {
    return sendRequest<InvoiceDetailResponse>(
      this.client,
      this.config,
      '/json/invoice_query',
      { InvoiceNumber: invoiceNumber }
    );
  }

  /**
   * 發票列表
   * POST /json/invoice_list
   *
   * @param options - 查詢選項
   * @returns 發票列表
   */
  async list(options: InvoiceListOptions = {}): Promise<InvoiceListResponse> {
    const data: Record<string, unknown> = {};

    if (options.startDate) data.start_date = options.startDate;
    if (options.endDate) data.end_date = options.endDate;
    if (options.page) data.page = options.page;
    if (options.pageSize) data.page_size = options.pageSize;

    return sendRequest<InvoiceListResponse>(
      this.client,
      this.config,
      '/json/invoice_list',
      data
    );
  }

  /**
   * 下載發票 PDF
   * POST /json/invoice_file
   *
   * @param invoiceNumber - 發票號碼
   * @param options - 下載選項
   * @returns PDF 內容（Buffer 或 base64 字串）
   */
  async downloadPdf(
    invoiceNumber: string,
    options: InvoiceFileOptions = {}
  ): Promise<Buffer | string> {
    const response = await sendRequest<{ code: number; msg: string; base64_data?: string }>(
      this.client,
      this.config,
      '/json/invoice_file',
      { InvoiceNumber: invoiceNumber }
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
   * 取得發票列印資料
   * POST /json/invoice_print
   *
   * @param invoiceNumber - 發票號碼
   * @param options - 列印選項
   * @returns 列印資料
   */
  async getPrintData(
    invoiceNumber: string,
    options: InvoicePrintOptions
  ): Promise<InvoicePrintResponse> {
    const encodingMap: Record<string, number> = {
      BIG5: 1,
      GBK: 2,
      'UTF-8': 3,
    };

    const data: Record<string, unknown> = {
      InvoiceNumber: invoiceNumber,
      PrinterType: options.printerType,
    };

    if (options.encoding) {
      data.PrinterLang = encodingMap[options.encoding] || 3;
    }

    return sendRequest<InvoicePrintResponse>(
      this.client,
      this.config,
      '/json/invoice_print',
      data
    );
  }

  /**
   * 開立發票（自訂號碼）
   * POST /json/f0401_custom
   *
   * @param invoiceNumber - 自訂發票號碼
   * @param data - 發票資料
   * @returns 發票回應
   */
  async createWithNumber(
    invoiceNumber: string,
    data: CreateInvoiceRequest
  ): Promise<CreateInvoiceResponse> {
    const requestData: CreateInvoiceWithNumberRequest = {
      ...data,
      InvoiceNumber: invoiceNumber,
    };

    return sendRequest<CreateInvoiceResponse>(
      this.client,
      this.config,
      '/json/f0401_custom',
      requestData
    );
  }
}
