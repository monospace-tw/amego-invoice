# @monospace-tw/amego-invoice

Taiwan E-Invoice SDK for Amego (光貿電子發票加值中心)

[![npm version](https://badge.fury.io/js/%40monospace-tw%2Famego-invoice.svg)](https://badge.fury.io/js/%40monospace-tw%2Famego-invoice)

## Installation

```bash
npm install @monospace-tw/amego-invoice
```

## Quick Start

```typescript
import { AmegoClient } from '@monospace-tw/amego-invoice';

// 初始化客戶端
const client = new AmegoClient({
  taxId: '12345678',      // 統一編號
  appKey: 'your-app-key', // APP KEY
});

// 開立發票
const invoice = await client.invoice.create({
  OrderId: 'ORDER-001',
  BuyerIdentifier: '0000000000', // B2C
  BuyerName: '客人',
  ProductItem: [
    {
      Description: '商品名稱',
      Quantity: 1,
      UnitPrice: 100,
      Amount: 100,
      TaxType: 1, // 應稅
    },
  ],
  SalesAmount: 100,
  FreeTaxSalesAmount: 0,
  ZeroTaxSalesAmount: 0,
  TaxType: 1,
  TaxRate: '0.05',
  TaxAmount: 0,
  TotalAmount: 100,
});

console.log('發票號碼:', invoice.invoice_number);
```

## Features

- 完整支援光貿電子發票 API (MIG 4.0)
- TypeScript 型別安全
- 支援 ESM 與 CommonJS
- 內建稅額計算工具
- 資料驗證 (Zod schemas)
- 自動時間同步與簽名
- 指數退避重試機制
- 客戶端請求頻率限制
- 批次操作支援
- 可配置的請求日誌

## API Reference

### AmegoClient

```typescript
const client = new AmegoClient({
  taxId: string;           // 統一編號
  appKey: string;          // APP KEY
  baseUrl?: string;        // API 網址 (預設: https://invoice-api.amego.tw)
  timeout?: number;        // 逾時時間 ms (預設: 30000)
  skipTimeSync?: boolean;  // 跳過時間同步 (預設: false)
  retry?: RetryConfig | false;     // 重試設定
  rateLimit?: RateLimitConfig | false; // 頻率限制設定
  logger?: LogConfig;      // 日誌設定
});
```

### 進階設定範例

```typescript
const client = new AmegoClient({
  taxId: '12345678',
  appKey: 'your-app-key',
  // 重試設定
  retry: {
    maxRetries: 5,         // 最大重試次數 (預設: 3)
    baseDelay: 2000,       // 基礎延遲 ms (預設: 1000)
    maxDelay: 60000,       // 最大延遲 ms (預設: 30000)
    retryableErrors: [500, 502, 503], // 可重試的 API 錯誤碼
    retryNetworkErrors: true, // 重試網路錯誤 (預設: true)
  },
  // 頻率限制設定
  rateLimit: {
    requestsPerSecond: 5,  // 每秒請求數 (預設: 10)
    burstSize: 10,         // 突發容量 (預設: requestsPerSecond * 2)
    queueRequests: true,   // 佇列等待 (預設: true)
    maxQueueSize: 50,      // 最大佇列長度 (預設: 100)
  },
  // 日誌設定
  logger: {
    level: 'debug',        // 日誌等級: debug | info | warn | error | none
    maskSensitiveData: true, // 遮蔽敏感資料 (預設: true)
  },
});

// 停用重試
const noRetryClient = new AmegoClient({
  taxId: '12345678',
  appKey: 'your-app-key',
  retry: false,
});
```

### 發票操作 (client.invoice)

| Method | Description |
|--------|-------------|
| `create(data)` | 開立發票 (自動配號) |
| `createWithNumber(number, data)` | 開立發票 (自訂號碼) |
| `cancel(invoiceNumber)` | 作廢發票 |
| `cancelMany(invoiceNumbers)` | 批次作廢發票 |
| `getStatus(invoiceNumber)` | 查詢發票狀態 |
| `getStatusMany(invoiceNumbers)` | 批次查詢發票狀態 |
| `getDetail(invoiceNumber)` | 查詢發票明細 |
| `list(options)` | 發票列表 |
| `downloadPdf(invoiceNumber)` | 下載發票 PDF |
| `getPrintData(invoiceNumber, options)` | 取得列印資料 |
| `createMany(invoices, config?)` | 批次開立發票 |

### 折讓操作 (client.allowance)

| Method | Description |
|--------|-------------|
| `create(data)` | 開立折讓 |
| `cancel(allowanceNumber)` | 作廢折讓 |
| `cancelMany(allowanceNumbers)` | 批次作廢折讓 |
| `getStatus(allowanceNumber)` | 查詢折讓狀態 |
| `getDetail(allowanceNumber)` | 查詢折讓明細 |
| `list(options)` | 折讓列表 |
| `downloadPdf(allowanceNumber)` | 下載折讓 PDF |
| `getPrintData(allowanceNumber, options)` | 取得列印資料 |
| `createMany(allowances, config?)` | 批次開立折讓 |

### 工具操作 (client.utility)

| Method | Description |
|--------|-------------|
| `validateBarcode(barcode)` | 驗證手機條碼 |
| `queryCompany(taxId)` | 查詢公司名稱 |
| `checkLottery(invoiceNumber)` | 查詢發票中獎 |
| `getLotteryPrizes(period?)` | 取得獎項定義 |
| `getTrackInfo(options?)` | 取得字軌資訊 |
| `getServerTime()` | 取得伺服器時間 |
| `getInvoiceNumbers(count, trackCode?)` | 字軌取號 |
| `checkNumberStatus(invoiceNumber)` | 檢查號碼狀態 |

## Batch Operations

批次操作支援並發控制和進度回報：

```typescript
// 批次開立發票
const invoices = [
  { OrderId: 'A001', /* ... */ },
  { OrderId: 'A002', /* ... */ },
  { OrderId: 'A003', /* ... */ },
];

const result = await client.invoice.createMany(invoices, {
  concurrency: 3,      // 並發數 (預設: 5)
  stopOnError: false,  // 錯誤時停止 (預設: false)
  onProgress: (progress) => {
    console.log(`${progress.completed}/${progress.total} 完成`);
    if (progress.current) {
      console.log(`處理中: ${progress.current}`);
    }
  },
});

console.log('成功:', result.successful.length);
console.log('失敗:', result.failed.length);

// 處理失敗的項目
for (const fail of result.failed) {
  console.error('失敗的訂單:', fail.input);
  console.error('錯誤:', fail.error.message);
}
```

## Tax Calculator

SDK 內建稅額計算工具：

```typescript
import {
  calculateInvoiceAmounts,
  prepareInvoiceData,
  toExclusive,
  toInclusive,
} from '@monospace-tw/amego-invoice';

// 自動計算發票金額
const amounts = calculateInvoiceAmounts(items, { buyerHasTaxId: true });

// 準備完整發票資料
const invoiceData = prepareInvoiceData(items, buyerIdentifier);

// 含稅轉未稅
const exclusive = toExclusive(105, 0.05); // 100

// 未稅轉含稅
const inclusive = toInclusive(100, 0.05); // 105
```

## Validation

使用 Zod schemas 進行資料驗證：

```typescript
import {
  validateTaxId,
  validateMobileBarcode,
  validateInvoiceData,
  createInvoiceRequestSchema,
} from '@monospace-tw/amego-invoice';

// 驗證統編
const taxIdResult = validateTaxId('28080623');

// 驗證手機條碼
const barcodeResult = validateMobileBarcode('/ABC+123');

// 驗證完整發票資料
const invoiceResult = validateInvoiceData(data);

// 使用 Zod schema
const parsed = createInvoiceRequestSchema.parse(data);
```

## Error Handling

```typescript
import {
  AmegoApiError,
  AmegoNetworkError,
  AmegoValidationError,
  AmegoTimeoutError,
  RateLimitExceededError,
} from '@monospace-tw/amego-invoice';

try {
  await client.invoice.create(data);
} catch (error) {
  if (error instanceof AmegoApiError) {
    console.error('API 錯誤:', error.code, error.message);
  } else if (error instanceof AmegoNetworkError) {
    console.error('網路錯誤:', error.message);
  } else if (error instanceof AmegoValidationError) {
    console.error('驗證錯誤:', error.errors);
  } else if (error instanceof AmegoTimeoutError) {
    console.error('逾時:', error.timeout);
  } else if (error instanceof RateLimitExceededError) {
    console.error('頻率限制:', error.retryAfter, 'ms 後重試');
  }
}
```

## Test Environment

使用測試環境進行開發：

```typescript
const client = new AmegoClient({
  taxId: '12345678',              // 測試統編
  appKey: 'sHeq7t8G1wiQvhAuIM27', // 測試 APP KEY
});
```

測試環境後台: https://invoice.amego.tw/
- 帳號: test@amego.tw
- 密碼: 12345678

## License

MIT
