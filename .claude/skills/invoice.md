---
name: invoice
description: 台灣電子發票操作 (光貿 Amego)
---

# 電子發票 Skill

使用 `@monospace-tw/amego-invoice` CLI 操作台灣電子發票。

## 環境設定

確保專案目錄有 `.env` 檔案：

```
AMEGO_TAX_ID=你的統編
AMEGO_APP_KEY=你的AppKey
```

## 常用指令

### 查詢公司名稱

```bash
npx @monospace-tw/amego-invoice company <統編>
```

### 測試 API 連線

```bash
npx @monospace-tw/amego-invoice test
```

### 開立發票

**B2C 發票（不打統編）：**

```bash
npx @monospace-tw/amego-invoice invoice create \
  --buyer-name "消費者" \
  --item "商品名稱:數量:單價"
```

**B2B 發票（打統編，含稅價）：**

```bash
npx @monospace-tw/amego-invoice invoice create \
  --buyer-id <統編> \
  --buyer-name "公司名稱" \
  --buyer-address "公司地址" \
  --item "品名:數量:單價" \
  --remark "備註"
```

**B2B 發票（打統編，未稅價）：**

```bash
npx @monospace-tw/amego-invoice invoice create \
  --buyer-id <統編> \
  --buyer-name "公司名稱" \
  --tax-exclusive \
  --item "品名:數量:單價"
```

**多商品：**

```bash
npx @monospace-tw/amego-invoice invoice create \
  --buyer-id 28505071 \
  --buyer-name "鎰威科技有限公司" \
  --item "軟體開發服務:1:50000" \
  --item "系統維護費:1:10000"
```

### 查詢發票

```bash
# 查詢狀態
npx @monospace-tw/amego-invoice invoice status <發票號碼>

# 查詢明細
npx @monospace-tw/amego-invoice invoice detail <發票號碼>

# 發票列表
npx @monospace-tw/amego-invoice invoice list --size 10
```

### 作廢發票

```bash
npx @monospace-tw/amego-invoice invoice cancel <發票號碼>
```

### 驗證手機條碼

```bash
npx @monospace-tw/amego-invoice barcode /ABC+123
```

### 查詢字軌資訊

```bash
npx @monospace-tw/amego-invoice track
```

## 金額計算規則

- **B2C（不打統編）**：TaxAmount = 0，金額不分拆稅額
- **B2B（打統編，含稅價）**：自動從含稅金額分拆出稅額
  - SalesAmount = TotalAmount - TaxAmount
  - TaxAmount = TotalAmount - Round(TotalAmount / 1.05)
- **B2B（打統編，未稅價）**：使用 `--tax-exclusive`
  - SalesAmount = 商品金額
  - TaxAmount = Round(SalesAmount * 0.05)
  - TotalAmount = SalesAmount + TaxAmount

## 輸出 JSON 格式

所有指令都支援 `--json` 參數輸出原始 JSON：

```bash
npx @monospace-tw/amego-invoice invoice status AB12345678 --json
```
