import { createHash } from 'crypto';

/**
 * 計算 API 簽名
 * 簽名規則: md5(jsonData + timestamp + appKey)
 *
 * @param jsonData - JSON 格式字串
 * @param timestamp - Unix 時間戳記（10位數）
 * @param appKey - APP KEY
 * @returns MD5 簽名（32位小寫十六進位字串）
 */
export function calculateSignature(
  jsonData: string,
  timestamp: number,
  appKey: string
): string {
  const hashText = jsonData + timestamp.toString() + appKey;
  return createHash('md5').update(hashText, 'utf8').digest('hex');
}
