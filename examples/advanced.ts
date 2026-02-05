/**
 * @monospace-tw/amego-invoice SDK 進階範例
 *
 * 安裝: npm install @monospace-tw/amego-invoice
 * 執行: npx tsx examples/advanced.ts
 */

import { AmegoClient, calculateInvoiceAmounts } from '@monospace-tw/amego-invoice';

// 建立客戶端（使用測試環境）
const client = new AmegoClient({
  taxId: '12345678',
  appKey: 'sHeq7t8G1wiQvhAuIM27',
});

// ============================================
// 範例 1: 使用手機條碼載具
// ============================================
async function createInvoiceWithCarrier() {
  console.log('=== 開立發票（手機條碼載具）===');

  // 先驗證手機條碼
  const validation = await client.utility.validateBarcode('/ABC+123');
  if (!validation.valid) {
    console.log('手機條碼驗證失敗:', validation.msg);
    return;
  }

  const result = await client.invoice.create({
    OrderId: `CARRIER-${Date.now()}`,
    BuyerIdentifier: '0000000000',
    BuyerName: '消費者',
    CarrierId1: validation.carrierId1!, // 載具類別號碼
    CarrierId2: validation.carrierId2!, // 載具顯碼
    ProductItem: [
      {
        Description: '商品A',
        Quantity: 1,
        UnitPrice: 100,
        Amount: 100,
        TaxType: 1,
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

  if (result.code === 0) {
    console.log('發票號碼:', result.invoice_number);
    console.log('已存入手機條碼載具');
  } else {
    console.log('開立失敗:', result.msg);
  }
}

// ============================================
// 範例 2: 捐贈發票
// ============================================
async function createDonationInvoice() {
  console.log('\n=== 開立捐贈發票 ===');

  const result = await client.invoice.create({
    OrderId: `DONATE-${Date.now()}`,
    BuyerIdentifier: '0000000000',
    BuyerName: '消費者',
    DonateMark: 1, // 1=捐贈
    NPOBAN: '25885', // 受贈單位愛心碼（創世基金會）
    ProductItem: [
      {
        Description: '飲料',
        Quantity: 2,
        UnitPrice: 50,
        Amount: 100,
        TaxType: 1,
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

  if (result.code === 0) {
    console.log('發票號碼:', result.invoice_number);
    console.log('已捐贈至愛心碼:', '25885');
  } else {
    console.log('開立失敗:', result.msg);
  }
}

// ============================================
// 範例 3: B2B 發票（未稅價）
// ============================================
async function createB2BInvoiceExclusive() {
  console.log('\n=== 開立 B2B 發票（未稅價）===');

  // 商品項目（未稅價）
  const items = [
    {
      Description: '軟體開發顧問服務費',
      Quantity: 1,
      Unit: '式',
      UnitPrice: 180000,
      Amount: 180000,
      TaxType: 1 as const,
      Remark: 'EW-TK-202512-001',
    },
  ];

  // 使用 calculateInvoiceAmounts 自動計算金額
  const amounts = calculateInvoiceAmounts(items, {
    buyerHasTaxId: true,
    taxRate: 0.05,
    priceExclusive: true, // 重要：標示為未稅價
  });

  console.log('未稅金額:', amounts.salesAmount);
  console.log('稅額:', amounts.taxAmount);
  console.log('含稅總額:', amounts.totalAmount);

  const result = await client.invoice.create({
    OrderId: `B2B-EX-${Date.now()}`,
    BuyerIdentifier: '28505071',
    BuyerName: '鎰威科技有限公司',
    BuyerAddress: '台北市信義區',
    DetailVat: 0, // 0=未稅, 1=含稅
    ProductItem: items,
    SalesAmount: amounts.salesAmount,
    FreeTaxSalesAmount: amounts.freeTaxSalesAmount,
    ZeroTaxSalesAmount: amounts.zeroTaxSalesAmount,
    TaxType: amounts.taxType,
    TaxRate: '0.05',
    TaxAmount: amounts.taxAmount,
    TotalAmount: amounts.totalAmount,
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
// 範例 4: 多商品混合稅別
// ============================================
async function createMixedTaxInvoice() {
  console.log('\n=== 開立混合稅別發票 ===');

  // 混合稅別商品（實務上較少見，需特別注意）
  const items = [
    {
      Description: '應稅商品',
      Quantity: 1,
      UnitPrice: 100,
      Amount: 100,
      TaxType: 1 as const, // 應稅
    },
    {
      Description: '免稅商品（如農產品）',
      Quantity: 1,
      UnitPrice: 50,
      Amount: 50,
      TaxType: 3 as const, // 免稅
    },
  ];

  const amounts = calculateInvoiceAmounts(items, {
    buyerHasTaxId: true,
    taxRate: 0.05,
  });

  console.log('應稅銷售額:', amounts.salesAmount);
  console.log('免稅銷售額:', amounts.freeTaxSalesAmount);
  console.log('稅額:', amounts.taxAmount);
  console.log('課稅別:', amounts.taxType); // 應為 9（混合稅別）

  const result = await client.invoice.create({
    OrderId: `MIXED-${Date.now()}`,
    BuyerIdentifier: '28080623',
    BuyerName: '光貿科技股份有限公司',
    ProductItem: items,
    SalesAmount: amounts.salesAmount,
    FreeTaxSalesAmount: amounts.freeTaxSalesAmount,
    ZeroTaxSalesAmount: amounts.zeroTaxSalesAmount,
    TaxType: amounts.taxType,
    TaxRate: '0.05',
    TaxAmount: amounts.taxAmount,
    TotalAmount: amounts.totalAmount,
  });

  if (result.code === 0) {
    console.log('發票號碼:', result.invoice_number);
  } else {
    console.log('開立失敗:', result.msg);
  }
}

// ============================================
// 範例 5: 作廢發票
// ============================================
async function voidInvoice(invoiceNumber: string) {
  console.log('\n=== 作廢發票 ===');

  const result = await client.invoice.void(invoiceNumber);

  if (result.code === 0) {
    console.log('作廢成功:', invoiceNumber);
  } else {
    console.log('作廢失敗:', result.msg);
  }
}

// ============================================
// 範例 6: 折讓作業
// ============================================
async function createAllowance(invoiceNumber: string) {
  console.log('\n=== 開立折讓單 ===');

  const result = await client.allowance.create({
    AllowanceNumber: `ALW-${Date.now()}`,
    AllowanceDate: new Date().toISOString().split('T')[0].replace(/-/g, ''),
    BuyerIdentifier: '28080623',
    SellerIdentifier: '12345678',
    AllowanceType: '1',
    OriginalInvoiceNumber: invoiceNumber,
    ProductItem: [
      {
        OriginalSequenceNumber: 1,
        OriginalDescription: '軟體授權',
        Quantity: 1,
        UnitPrice: 100,
        Amount: 100,
        Tax: 5,
        TaxType: 1,
      },
    ],
    TaxAmount: 5,
    TotalAmount: 105,
  });

  if (result.code === 0) {
    console.log('折讓單號:', result.allowance_number);
  } else {
    console.log('折讓失敗:', result.msg);
  }
}

// ============================================
// 範例 7: 批次查詢公司
// ============================================
async function batchQueryCompanies() {
  console.log('\n=== 批次查詢公司 ===');

  const taxIds = ['28080623', '28505071', '54891351'];
  const result = await client.utility.queryCompanyMany(taxIds);

  if (result.code === 0 && result.data) {
    for (const company of result.data) {
      if (company.found) {
        console.log(`${company.taxId}: ${company.name}`);
      } else {
        console.log(`${company.taxId}: 查無資料`);
      }
    }
  }
}

// ============================================
// 範例 8: 查詢字軌資訊
// ============================================
async function queryTrackInfo() {
  console.log('\n=== 查詢字軌資訊 ===');

  const result = await client.utility.getTrackInfo();

  if (result.code === 0 && result.data) {
    for (const track of result.data) {
      console.log(`期別: ${track.period}`);
      console.log(`字軌: ${track.track}`);
      console.log(`範圍: ${track.start} - ${track.end}`);
      console.log(`剩餘: ${track.remaining}`);
      console.log('---');
    }
  }
}

// ============================================
// 範例 9: 查詢中獎號碼
// ============================================
async function queryLotteryPrizes() {
  console.log('\n=== 查詢中獎號碼 ===');

  const result = await client.utility.getLotteryPrizes();

  if (result.code === 0 && result.data) {
    for (const period of result.data) {
      console.log(`=== ${period.period} 期 ===`);
      for (const prize of period.prizes) {
        console.log(`${prize.name} (${prize.amount}元): ${prize.numbers.join(', ')}`);
      }
    }
  }
}

// ============================================
// 範例 10: 檢查發票是否中獎
// ============================================
async function checkInvoiceLottery(invoiceNumber: string) {
  console.log('\n=== 檢查發票中獎 ===');

  const result = await client.utility.checkLottery(invoiceNumber);

  if (result.code === 0 && result.data) {
    if (result.data.won === true) {
      console.log('恭喜中獎！');
      console.log('獎項:', result.data.prizeType);
      console.log('金額:', result.data.prizeAmount);
    } else if (result.data.won === false) {
      console.log('未中獎');
    } else {
      console.log('尚未開獎或無法判斷:', result.data.message);
    }
  }
}

// ============================================
// 執行範例
// ============================================
async function main() {
  try {
    // 工具類範例
    await batchQueryCompanies();
    await queryTrackInfo();
    // await queryLotteryPrizes(); // 視需要啟用

    // 發票開立範例
    // await createInvoiceWithCarrier(); // 需有效手機條碼
    // await createDonationInvoice();
    // await createB2BInvoiceExclusive();
    // await createMixedTaxInvoice();

    // 發票後續操作
    // const invoiceNumber = 'AB12345678'; // 替換為實際發票號碼
    // await voidInvoice(invoiceNumber);
    // await createAllowance(invoiceNumber);
    // await checkInvoiceLottery(invoiceNumber);
  } catch (error) {
    console.error('錯誤:', error);
  }
}

main();
