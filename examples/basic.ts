/**
 * @monospace-tw/amego-invoice SDK 基礎範例
 *
 * 安裝: npm install @monospace-tw/amego-invoice
 * 執行: npx tsx examples/basic.ts
 */

import { AmegoClient } from '@monospace-tw/amego-invoice';

// 建立客戶端（使用測試環境）
const client = new AmegoClient({
  taxId: '12345678',
  appKey: 'sHeq7t8G1wiQvhAuIM27',
});

// ============================================
// 範例 1: 測試 API 連線
// ============================================
async function testConnection() {
  console.log('=== 測試 API 連線 ===');
  const time = await client.utility.getServerTime();
  console.log('伺服器時間:', time.text);
  console.log('時間戳記:', time.timestamp);
}

// ============================================
// 範例 2: 查詢公司名稱
// ============================================
async function queryCompany() {
  console.log('\n=== 查詢公司名稱 ===');
  const result = await client.utility.queryCompany('28080623');
  if (result.found) {
    console.log('統一編號:', result.taxId);
    console.log('公司名稱:', result.name);
  } else {
    console.log('查無此統一編號');
  }
}

// ============================================
// 範例 3: B2C 發票（不打統編）
// ============================================
async function createB2CInvoice() {
  console.log('\n=== 開立 B2C 發票 ===');

  const result = await client.invoice.create({
    OrderId: `B2C-${Date.now()}`,
    BuyerIdentifier: '0000000000', // B2C 固定填 10 個 0
    BuyerName: '消費者',
    ProductItem: [
      {
        Description: '咖啡',
        Quantity: 2,
        UnitPrice: 65,
        Amount: 130,
        TaxType: 1,
      },
      {
        Description: '蛋糕',
        Quantity: 1,
        UnitPrice: 85,
        Amount: 85,
        TaxType: 1,
      },
    ],
    SalesAmount: 215,
    FreeTaxSalesAmount: 0,
    ZeroTaxSalesAmount: 0,
    TaxType: 1,
    TaxRate: '0.05',
    TaxAmount: 0, // B2C 不分拆稅額
    TotalAmount: 215,
  });

  if (result.code === 0) {
    console.log('發票號碼:', result.invoice_number);
    console.log('隨機碼:', result.random_number);
  } else {
    console.log('開立失敗:', result.msg);
  }

  return result;
}

// ============================================
// 範例 4: B2B 發票（打統編）
// ============================================
async function createB2BInvoice() {
  console.log('\n=== 開立 B2B 發票 ===');

  // B2B 發票需分拆稅額
  // 假設商品含稅總額 1050 元
  // 銷售額 = 1050 - (1050 - round(1050/1.05)) = 1000
  // 稅額 = 1050 - 1000 = 50
  const result = await client.invoice.create({
    OrderId: `B2B-${Date.now()}`,
    BuyerIdentifier: '28080623',
    BuyerName: '光貿科技股份有限公司',
    BuyerAddress: '台北市信義區',
    ProductItem: [
      {
        Description: '軟體授權',
        Quantity: 1,
        UnitPrice: 1050,
        Amount: 1050,
        TaxType: 1,
      },
    ],
    SalesAmount: 1000, // 未稅金額
    FreeTaxSalesAmount: 0,
    ZeroTaxSalesAmount: 0,
    TaxType: 1,
    TaxRate: '0.05',
    TaxAmount: 50, // 稅額
    TotalAmount: 1050,
  });

  if (result.code === 0) {
    console.log('發票號碼:', result.invoice_number);
    console.log('隨機碼:', result.random_number);
  } else {
    console.log('開立失敗:', result.msg);
  }

  return result;
}

// ============================================
// 範例 5: 查詢發票狀態
// ============================================
async function queryInvoiceStatus(invoiceNumber: string) {
  console.log('\n=== 查詢發票狀態 ===');

  const result = await client.invoice.getStatus(invoiceNumber);

  if (result.code === 0 && result.data?.length) {
    const inv = result.data[0];
    console.log('發票號碼:', inv.invoice_number);
    console.log('狀態:', inv.status);
    console.log('金額:', inv.total_amount);
  } else {
    console.log('查詢失敗:', result.msg);
  }
}

// ============================================
// 執行範例
// ============================================
async function main() {
  try {
    await testConnection();
    await queryCompany();

    const b2cResult = await createB2CInvoice();
    if (b2cResult.invoice_number) {
      await queryInvoiceStatus(b2cResult.invoice_number);
    }

    await createB2BInvoice();
  } catch (error) {
    console.error('錯誤:', error);
  }
}

main();
