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
- CLI 命令列工具
- MCP Server（支援 Claude Desktop 等 AI 助手）

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

## CLI

支援 npx 方式直接執行：

```bash
# 測試連線
npx @monospace-tw/amego-invoice time

# 查詢公司
npx @monospace-tw/amego-invoice ban 28080623

# 開立發票
npx @monospace-tw/amego-invoice invoice create \
  --buyer-id 0000000000 \
  --buyer-name "消費者" \
  --item "商品A:2:100" \
  --item "商品B:1:50"

# 查詢發票狀態
npx @monospace-tw/amego-invoice invoice status AB12345678

# 發票列表
npx @monospace-tw/amego-invoice invoice list --limit 10
```

環境變數設定：

```bash
export AMEGO_TAX_ID=12345678
export AMEGO_APP_KEY=sHeq7t8G1wiQvhAuIM27
```

## MCP Server

支援 [Model Context Protocol (MCP)](https://modelcontextprotocol.io/)，讓 AI 助手（如 Claude）直接操作電子發票。

### 方式一：一鍵安裝 (.mcpb)

下載 [amego-invoice-1.4.0.mcpb](https://github.com/monospace-tw/amego-invoice/releases/latest) 後雙擊安裝，Claude Desktop 會提示輸入：
- 統一編號 (Tax ID)
- APP Key

測試環境可使用：
- Tax ID: `12345678`
- APP Key: `sHeq7t8G1wiQvhAuIM27`

### 方式二：手動設定 Claude Desktop

編輯 `~/.config/Claude/claude_desktop_config.json`（macOS）或 `%APPDATA%\Claude\claude_desktop_config.json`（Windows）：

```json
{
  "mcpServers": {
    "amego-invoice": {
      "command": "npx",
      "args": ["-y", "@monospace-tw/amego-invoice", "mcp"],
      "env": {
        "AMEGO_TAX_ID": "你的統編",
        "AMEGO_APP_KEY": "你的AppKey"
      }
    }
  }
}
```

或使用本地安裝：

```json
{
  "mcpServers": {
    "amego-invoice": {
      "command": "node",
      "args": ["/path/to/node_modules/@monospace-tw/amego-invoice/dist/esm/mcp.js"],
      "env": {
        "AMEGO_TAX_ID": "你的統編",
        "AMEGO_APP_KEY": "你的AppKey"
      }
    }
  }
}
```

### MCP 工具列表

| Tool | Description |
|------|-------------|
| `query_company` | 查詢公司名稱（輸入統一編號） |
| `validate_tax_id` | 驗證統一編號格式（本地驗證） |
| `validate_barcode` | 驗證手機條碼 |
| `create_invoice` | 開立電子發票 |
| `get_invoice_status` | 查詢發票狀態 |
| `get_invoice_detail` | 查詢發票明細 |
| `cancel_invoice` | 作廢發票 |
| `list_invoices` | 發票列表 |
| `get_server_time` | 取得伺服器時間 |
| `get_track_info` | 查詢字軌資訊 |
| `check_lottery` | 查詢發票中獎 |

### 使用範例

設定完成後，可以直接對 Claude 說：

- 「查詢統編 22099131 的公司名稱」
- 「幫我開一張發票給消費者，商品是咖啡 2 杯 120 元」
- 「查詢發票 AB12345678 的狀態」
- 「列出最近的發票」

## Examples

完整範例請參考 `examples/` 目錄：

- **[basic.ts](examples/basic.ts)** - 基礎範例：連線測試、查詢公司、開立 B2C/B2B 發票
- **[advanced.ts](examples/advanced.ts)** - 進階範例：手機條碼載具、捐贈發票、未稅價計算、混合稅別、折讓作業

執行範例：

```bash
npx tsx examples/basic.ts
npx tsx examples/advanced.ts
```

其他語言的原始 API 呼叫範例（供參考）：
- `examples/amego_invoice.php` - PHP
- `examples/amego_invoice.py` - Python
- `examples/AmegoInvoice.java` - Java
- `examples/AmegoInvoice.cs` - C#

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
