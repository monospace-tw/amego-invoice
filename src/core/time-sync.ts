import axios from 'axios';

/** 快取有效期（毫秒），預設 5 分鐘 */
const CACHE_TTL_MS = 5 * 60 * 1000;

interface TimeSyncCache {
  offset: number;
  cachedAt: number;
}

const cacheMap = new Map<string, TimeSyncCache>();

/**
 * 從伺服器取得時間並計算 offset
 *
 * @param baseUrl - API 基礎網址
 * @returns 時間偏移量（秒）
 */
export async function syncServerTime(baseUrl: string): Promise<number> {
  const localBefore = Math.floor(Date.now() / 1000);

  const response = await axios.get<{ time: number }>(`${baseUrl}/json/time`);
  const serverTime = response.data.time;

  const localAfter = Math.floor(Date.now() / 1000);
  const localTime = Math.floor((localBefore + localAfter) / 2);

  const offset = serverTime - localTime;

  // 快取 offset
  cacheMap.set(baseUrl, {
    offset,
    cachedAt: Date.now(),
  });

  return offset;
}

/**
 * 取得快取的時間偏移量，若過期或不存在則回傳 null
 *
 * @param baseUrl - API 基礎網址
 * @returns 時間偏移量（秒）或 null
 */
export function getCachedOffset(baseUrl: string): number | null {
  const cached = cacheMap.get(baseUrl);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.cachedAt > CACHE_TTL_MS) {
    cacheMap.delete(baseUrl);
    return null;
  }

  return cached.offset;
}

/**
 * 取得目前的時間戳記（已套用 offset）
 *
 * @param baseUrl - API 基礎網址
 * @param skipSync - 是否跳過同步
 * @returns Unix 時間戳記（10位數）
 */
export async function getCurrentTimestamp(
  baseUrl: string,
  skipSync: boolean = false
): Promise<number> {
  let offset = getCachedOffset(baseUrl);

  if (offset === null && !skipSync) {
    offset = await syncServerTime(baseUrl);
  }

  const localTime = Math.floor(Date.now() / 1000);
  return localTime + (offset ?? 0);
}

/**
 * 清除快取（用於測試或強制重新同步）
 *
 * @param baseUrl - API 基礎網址，若未提供則清除所有快取
 */
export function clearTimeSyncCache(baseUrl?: string): void {
  if (baseUrl) {
    cacheMap.delete(baseUrl);
  } else {
    cacheMap.clear();
  }
}

/**
 * 強制重新同步時間
 *
 * @param baseUrl - API 基礎網址
 * @returns 時間偏移量（秒）
 */
export async function forceResync(baseUrl: string): Promise<number> {
  cacheMap.delete(baseUrl);
  return syncServerTime(baseUrl);
}
