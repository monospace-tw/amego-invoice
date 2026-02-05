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

## API Reference

### AmegoClient

```typescript
const client = new AmegoClient({
  taxId: string;           // 統一編號
  appKey: string;          // APP KEY
  baseUrl?: string;        // API 網址 (預設: https://invoice-api.amego.tw)
  timeout?: number;        // 逾時時間 ms (預設: 30000)
  skipTimeSync?: boolean;  // 跳過時間同步 (預設: false)
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
