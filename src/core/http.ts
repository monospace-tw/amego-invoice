import axios, { AxiosInstance, AxiosError } from 'axios';
import { stringify } from 'querystring';
import { calculateSignature } from './signature.js';
import { getCurrentTimestamp, forceResync } from './time-sync.js';
import type { AmegoClientConfigInternal } from '../types/config.js';
import {
  AmegoApiError,
  AmegoNetworkError,
  AmegoTimeoutError,
} from '../errors.js';

/**
 * 建立 HTTP 客戶端
 */
export function createHttpClient(config: AmegoClientConfigInternal): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseUrl,
    timeout: config.timeout,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  return client;
}

/**
 * 發送 API 請求
 *
 * @param client - axios 實例
 * @param config - 客戶端設定
 * @param endpoint - API 端點路徑
 * @param data - 請求資料
 * @param isRetry - 是否為重試請求
 * @returns API 回應資料
 */
export async function sendRequest<T>(
  client: AxiosInstance,
  config: AmegoClientConfigInternal,
  endpoint: string,
  data: unknown,
  isRetry: boolean = false
): Promise<T> {
  const jsonData = JSON.stringify(data);
  const timestamp = await getCurrentTimestamp(config.baseUrl, config.skipTimeSync);
  const sign = calculateSignature(jsonData, timestamp, config.appKey);

  const postData = stringify({
    invoice: config.taxId,
    data: jsonData,
    time: timestamp,
    sign: sign,
  });

  try {
    const response = await client.post<T>(endpoint, postData);
    const responseData = response.data as T & { code?: number; msg?: string };

    // 檢查 API 錯誤碼
    if (responseData.code !== undefined && responseData.code !== 0) {
      // 如果是簽名錯誤且非重試，嘗試重新同步時間後重試
      if (!isRetry && isSignatureError(responseData.code)) {
        await forceResync(config.baseUrl);
        return sendRequest<T>(client, config, endpoint, data, true);
      }

      throw new AmegoApiError(
        responseData.code,
        responseData.msg || 'Unknown API error',
        responseData
      );
    }

    return responseData;
  } catch (error) {
    if (error instanceof AmegoApiError) {
      throw error;
    }

    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // 逾時錯誤
      if (axiosError.code === 'ECONNABORTED') {
        throw new AmegoTimeoutError(config.timeout);
      }

      // 網路錯誤
      throw new AmegoNetworkError(
        axiosError.message || 'Network error',
        axiosError
      );
    }

    throw error;
  }
}

/**
 * 發送 GET 請求（用於 /json/time 等）
 */
export async function sendGetRequest<T>(
  client: AxiosInstance,
  endpoint: string
): Promise<T> {
  try {
    const response = await client.get<T>(endpoint);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AmegoNetworkError(error.message || 'Network error', error);
    }
    throw error;
  }
}

/**
 * 判斷是否為簽名或時間戳記相關錯誤
 */
function isSignatureError(code: number): boolean {
  // 根據 API 文件，簽名和時間戳記錯誤的代碼
  // 2: 簽名錯誤
  // 3: 時間錯誤
  // 15: time(時間戳記)錯誤
  const signatureErrorCodes = [2, 3, 15];
  return signatureErrorCodes.includes(code);
}
