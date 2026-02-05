import { describe, it, expect, beforeAll } from 'vitest';
import { AmegoClient } from '../src/client.js';
import { AmegoValidationError } from '../src/errors.js';

// 測試環境設定
const TEST_TAX_ID = '12345678';
const TEST_APP_KEY = 'sHeq7t8G1wiQvhAuIM27';

describe('AmegoClient Integration', () => {
  let client: AmegoClient;

  beforeAll(() => {
    client = new AmegoClient({
      taxId: TEST_TAX_ID,
      appKey: TEST_APP_KEY,
      skipTimeSync: true, // 跳過時間同步以加速測試
    });
  });

  describe('Client Initialization', () => {
    it('should create client with valid config', () => {
      const c = new AmegoClient({
        taxId: TEST_TAX_ID,
        appKey: TEST_APP_KEY,
      });
      expect(c).toBeInstanceOf(AmegoClient);
    });

    it('should throw error without taxId', () => {
      expect(() => {
        new AmegoClient({ taxId: '', appKey: TEST_APP_KEY });
      }).toThrow(AmegoValidationError);
    });

    it('should throw error without appKey', () => {
      expect(() => {
        new AmegoClient({ taxId: TEST_TAX_ID, appKey: '' });
      }).toThrow(AmegoValidationError);
    });

    it('should use default baseUrl', () => {
      const config = client.getConfig();
      expect(config.baseUrl).toBe('https://invoice-api.amego.tw');
    });

    it('should use custom baseUrl', () => {
      const c = new AmegoClient({
        taxId: TEST_TAX_ID,
        appKey: TEST_APP_KEY,
        baseUrl: 'https://custom.api.tw',
      });
      expect(c.getConfig().baseUrl).toBe('https://custom.api.tw');
    });
  });

  describe('Operation Namespaces', () => {
    it('should have invoice operations', () => {
      expect(client.invoice).toBeDefined();
      expect(typeof client.invoice.create).toBe('function');
      expect(typeof client.invoice.cancel).toBe('function');
      expect(typeof client.invoice.getStatus).toBe('function');
    });

    it('should have allowance operations', () => {
      expect(client.allowance).toBeDefined();
      expect(typeof client.allowance.create).toBe('function');
      expect(typeof client.allowance.cancel).toBe('function');
    });

    it('should have utility operations', () => {
      expect(client.utility).toBeDefined();
      expect(typeof client.utility.validateBarcode).toBe('function');
      expect(typeof client.utility.queryCompany).toBe('function');
    });
  });
});

// 以下測試需要實際連接 API，可選擇性執行
describe.skip('Live API Tests (requires network)', () => {
  let client: AmegoClient;

  beforeAll(() => {
    client = new AmegoClient({
      taxId: TEST_TAX_ID,
      appKey: TEST_APP_KEY,
    });
  });

  it('should get server time', async () => {
    const result = await client.utility.getServerTime();
    expect(result.timestamp).toBeGreaterThan(0);
    expect(result.datetime).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it('should query company info', async () => {
    const result = await client.utility.queryCompany('28080623');
    expect(result.taxId).toBe('28080623');
  });
});
