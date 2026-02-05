#!/usr/bin/env node

import { Command } from 'commander';
import { AmegoClient } from './client.js';
import { validateTaxId, validateMobileBarcode } from './validators/index.js';
import { calculateInvoiceAmounts } from './calculators/tax.js';
import type { CreateInvoiceRequest, ProductItem } from './types/invoice.js';
import type { TaxType } from './types/common.js';

const program = new Command();

// 從環境變數取得設定
function getConfig() {
  const taxId = process.env.AMEGO_TAX_ID;
  const appKey = process.env.AMEGO_APP_KEY;
  const baseUrl = process.env.AMEGO_BASE_URL;

  if (!taxId || !appKey) {
    console.error('錯誤: 請設定環境變數 AMEGO_TAX_ID 和 AMEGO_APP_KEY');
    console.error('');
    console.error('範例:');
    console.error('  export AMEGO_TAX_ID=12345678');
    console.error('  export AMEGO_APP_KEY=your-app-key');
    process.exit(1);
  }

  return { taxId, appKey, baseUrl };
}

// 建立客戶端
function createClient() {
  const config = getConfig();
  return new AmegoClient({
    taxId: config.taxId,
    appKey: config.appKey,
    ...(config.baseUrl && { baseUrl: config.baseUrl }),
  });
}

// 格式化 JSON 輸出
function output(data: unknown) {
  console.log(JSON.stringify(data, null, 2));
}

program
  .name('amego-invoice')
  .description('Amego 電子發票 CLI 工具')
  .version('1.2.1');

// 測試連線
program
  .command('test')
  .description('測試 API 連線')
  .action(async () => {
    try {
      const client = createClient();
      const time = await client.utility.getServerTime();
      console.log('✓ API 連線成功');
      console.log(`  伺服器時間: ${time.text}`);
      console.log(`  時間戳記: ${time.timestamp}`);
    } catch (error) {
      console.error('✗ API 連線失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 查詢公司
program
  .command('company <taxId>')
  .description('查詢公司名稱')
  .action(async (taxId: string) => {
    // 本地驗證
    const validation = validateTaxId(taxId);
    if (!validation.valid) {
      console.error(`✗ 統一編號格式錯誤: ${validation.error}`);
      process.exit(1);
    }

    try {
      const client = createClient();
      const result = await client.utility.queryCompany(taxId);

      if (result.found) {
        console.log(`✓ 查詢成功`);
        console.log(`  統一編號: ${result.taxId}`);
        console.log(`  公司名稱: ${result.name}`);
      } else {
        console.log(`✗ 查無此統一編號: ${taxId}`);
      }
    } catch (error) {
      console.error('✗ 查詢失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 驗證手機條碼
program
  .command('barcode <barcode>')
  .description('驗證手機條碼')
  .option('--local', '僅本地驗證格式，不呼叫 API')
  .action(async (barcode: string, options: { local?: boolean }) => {
    // 本地驗證
    const validation = validateMobileBarcode(barcode);
    if (!validation.valid) {
      console.error(`✗ 手機條碼格式錯誤: ${validation.error}`);
      process.exit(1);
    }

    if (options.local) {
      console.log(`✓ 手機條碼格式正確: ${barcode}`);
      return;
    }

    try {
      const client = createClient();
      const result = await client.utility.validateBarcode(barcode);

      if (result.valid) {
        console.log(`✓ 手機條碼驗證成功`);
        console.log(`  條碼: ${barcode}`);
        if (result.carrierId1) console.log(`  載具 ID1: ${result.carrierId1}`);
        if (result.carrierId2) console.log(`  載具 ID2: ${result.carrierId2}`);
      } else {
        console.log(`✗ 手機條碼驗證失敗: ${result.msg}`);
        process.exit(1);
      }
    } catch (error) {
      console.error('✗ 驗證失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 查詢中獎
program
  .command('lottery <invoiceNumber>')
  .description('查詢發票中獎狀態')
  .action(async (invoiceNumber: string) => {
    try {
      const client = createClient();
      const result = await client.utility.checkLottery(invoiceNumber);

      if (result.code !== 0) {
        console.error(`✗ 查詢失敗: ${result.msg}`);
        process.exit(1);
      }

      if (result.data?.won === null) {
        console.log(`⏳ 尚未開獎`);
        console.log(`  發票號碼: ${invoiceNumber}`);
      } else if (result.data?.won) {
        console.log(`🎉 恭喜中獎！`);
        console.log(`  發票號碼: ${invoiceNumber}`);
        console.log(`  獎項: ${result.data.prizeType}`);
        console.log(`  獎金: NT$ ${result.data.prizeAmount?.toLocaleString()}`);
      } else {
        console.log(`✗ 未中獎`);
        console.log(`  發票號碼: ${invoiceNumber}`);
      }
    } catch (error) {
      console.error('✗ 查詢失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 查詢字軌
program
  .command('track')
  .description('查詢字軌資訊')
  .option('-p, --period <period>', '期別（如 11312）')
  .option('--json', '輸出 JSON 格式')
  .action(async (options: { period?: string; json?: boolean }) => {
    try {
      const client = createClient();
      const result = await client.utility.getTrackInfo({ period: options.period });

      if (result.code !== 0) {
        console.error(`✗ 查詢失敗: ${result.msg}`);
        process.exit(1);
      }

      if (options.json) {
        output(result.data);
        return;
      }

      if (!result.data || result.data.length === 0) {
        console.log('查無字軌資訊');
        return;
      }

      console.log('字軌資訊:');
      for (const track of result.data) {
        console.log(`  期別: ${track.period}`);
        console.log(`    字軌: ${track.track}`);
        console.log(`    範圍: ${track.start} - ${track.end}`);
        console.log(`    剩餘: ${track.remaining.toLocaleString()} 張`);
        console.log('');
      }
    } catch (error) {
      console.error('✗ 查詢失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 取得伺服器時間
program
  .command('time')
  .description('取得伺服器時間')
  .option('--json', '輸出 JSON 格式')
  .action(async (options: { json?: boolean }) => {
    try {
      const client = createClient();
      const result = await client.utility.getServerTime();

      if (options.json) {
        output(result);
        return;
      }

      console.log(`伺服器時間: ${result.text}`);
      console.log(`時間戳記: ${result.timestamp}`);
    } catch (error) {
      console.error('✗ 取得時間失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 驗證統一編號（本地驗證）
program
  .command('validate-taxid <taxId>')
  .description('驗證統一編號格式（本地驗證）')
  .action((taxId: string) => {
    const result = validateTaxId(taxId);
    if (result.valid) {
      console.log(`✓ 統一編號格式正確: ${taxId}`);
    } else {
      console.error(`✗ 統一編號格式錯誤: ${result.error}`);
      process.exit(1);
    }
  });

// 發票子命令
const invoice = program
  .command('invoice')
  .description('發票操作');

// 開立發票
invoice
  .command('create')
  .description('開立發票')
  .option('--order-id <orderId>', '訂單編號（預設自動產生）')
  .option('--buyer-id <buyerId>', '買方統一編號（預設 0000000000）', '0000000000')
  .option('--buyer-name <buyerName>', '買方名稱（預設「測試客戶」）', '測試客戶')
  .option('--buyer-address <address>', '買方地址')
  .option('--buyer-tel <tel>', '買方電話')
  .option('--buyer-email <email>', '買方電子信箱')
  .option('--item <items...>', '商品項目，格式: "品名:數量:單價" 或 "品名:數量:單價:單位"（可多個）')
  .option('--tax-exclusive', '商品單價為未稅價（預設含稅）')
  .option('--carrier <carrier>', '載具類別 (0=無, 1=手機條碼, 2=自然人憑證)')
  .option('--carrier-id <carrierId>', '載具號碼')
  .option('--donate <code>', '捐贈碼')
  .option('--remark <remark>', '總備註')
  .option('--json', '輸出 JSON 格式')
  .action(async (options: {
    orderId?: string;
    buyerId: string;
    buyerName: string;
    buyerAddress?: string;
    buyerTel?: string;
    buyerEmail?: string;
    item?: string[];
    taxExclusive?: boolean;
    carrier?: string;
    carrierId?: string;
    donate?: string;
    remark?: string;
    json?: boolean;
  }) => {
    try {
      const client = createClient();

      // 產生訂單編號
      const orderId = options.orderId || `CLI-${Date.now()}`;

      // 解析商品項目
      let items: ProductItem[];
      if (options.item && options.item.length > 0) {
        items = options.item.map((itemStr, index) => {
          const parts = itemStr.split(':');
          if (parts.length < 3) {
            console.error(`✗ 商品格式錯誤: ${itemStr}`);
            console.error('  正確格式: "品名:數量:單價" 或 "品名:數量:單價:單位"');
            process.exit(1);
          }
          const [desc, qty, price, unit] = parts;
          const quantity = parseFloat(qty);
          const unitPrice = parseFloat(price);
          const item: ProductItem = {
            Description: desc,
            Quantity: quantity,
            UnitPrice: unitPrice,
            Amount: quantity * unitPrice,
            TaxType: 1 as const,
          };
          if (unit) {
            item.Unit = unit;
          }
          return item;
        });
      } else {
        // 預設測試商品
        items = [{
          Description: '測試商品',
          Quantity: 1,
          UnitPrice: 100,
          Amount: 100,
          TaxType: 1 as const,
        }];
      }

      // 建立發票資料
      const invoiceData: Partial<CreateInvoiceRequest> = {
        OrderId: orderId,
        BuyerIdentifier: options.buyerId,
        BuyerName: options.buyerName,
        ProductItem: items,
      };

      if (options.buyerAddress) {
        invoiceData.BuyerAddress = options.buyerAddress;
      }

      if (options.buyerTel) {
        invoiceData.BuyerTelephoneNumber = options.buyerTel;
      }

      if (options.buyerEmail) {
        invoiceData.BuyerEmailAddress = options.buyerEmail;
      }

      // 設定明細含稅/未稅
      if (options.taxExclusive) {
        invoiceData.DetailVat = 0; // 未稅價
      }

      // 載具設定
      if (options.carrier) {
        const carrierType = parseInt(options.carrier, 10);
        if (carrierType === 1 && options.carrierId) {
          invoiceData.CarrierType = '3J0002';
          invoiceData.CarrierId1 = options.carrierId;
          invoiceData.CarrierId2 = options.carrierId;
        } else if (carrierType === 2 && options.carrierId) {
          invoiceData.CarrierType = 'CQ0001';
          invoiceData.CarrierId1 = options.carrierId;
          invoiceData.CarrierId2 = options.carrierId;
        }
      }

      // 捐贈設定
      if (options.donate) {
        invoiceData.NPOBAN = options.donate;
      }

      // 備註設定
      if (options.remark) {
        invoiceData.MainRemark = options.remark;
      }

      // 自動計算金額
      const buyerHasTaxId = options.buyerId !== '0000000000' && options.buyerId.length === 8;
      const amounts = calculateInvoiceAmounts(items, {
        buyerHasTaxId,
        priceExclusive: options.taxExclusive,
      });

      const fullInvoiceData: CreateInvoiceRequest = {
        ...invoiceData as CreateInvoiceRequest,
        SalesAmount: amounts.salesAmount,
        FreeTaxSalesAmount: amounts.freeTaxSalesAmount,
        ZeroTaxSalesAmount: amounts.zeroTaxSalesAmount,
        TaxType: amounts.taxType as TaxType,
        TaxRate: '0.05',
        TaxAmount: amounts.taxAmount,
        TotalAmount: amounts.totalAmount,
      };

      const result = await client.invoice.create(fullInvoiceData);

      if (result.code !== 0) {
        console.error(`✗ 開立失敗: ${result.msg}`);
        process.exit(1);
      }

      if (options.json) {
        output(result);
        return;
      }

      console.log('✓ 發票開立成功');
      console.log(`  發票號碼: ${result.invoice_number}`);
      console.log(`  訂單編號: ${orderId}`);
      console.log(`  開立時間: ${result.invoice_time ? new Date(result.invoice_time * 1000).toLocaleString('zh-TW') : 'N/A'}`);
      console.log(`  隨機碼: ${result.random_number}`);
      if (result.barcode) {
        console.log(`  條碼: ${result.barcode}`);
      }
    } catch (error) {
      console.error('✗ 開立失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 查詢發票狀態
invoice
  .command('status <invoiceNumber>')
  .description('查詢發票狀態')
  .option('--json', '輸出 JSON 格式')
  .action(async (invoiceNumber: string, options: { json?: boolean }) => {
    try {
      const client = createClient();
      const result = await client.invoice.getStatus(invoiceNumber);

      if (result.code !== 0) {
        console.error(`✗ 查詢失敗: ${result.msg}`);
        process.exit(1);
      }

      if (options.json) {
        output(result);
        return;
      }

      if (!result.data || result.data.length === 0) {
        console.log(`✗ 查無發票: ${invoiceNumber}`);
        return;
      }

      const inv = result.data[0];
      const statusText: Record<number, string> = {
        0: '待上傳',
        1: '已上傳',
        2: '已作廢',
        3: '上傳失敗',
      };

      console.log('✓ 查詢成功');
      console.log(`  發票號碼: ${inv.invoice_number}`);
      console.log(`  狀態: ${statusText[inv.status] || inv.status}`);
      console.log(`  類型: ${inv.type.startsWith('F') ? '發票' : '折讓'}`);
      console.log(`  金額: NT$ ${inv.total_amount.toLocaleString()}`);
    } catch (error) {
      console.error('✗ 查詢失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 查詢發票明細
invoice
  .command('detail <invoiceNumber>')
  .description('查詢發票明細')
  .option('--json', '輸出 JSON 格式')
  .action(async (invoiceNumber: string, options: { json?: boolean }) => {
    try {
      const client = createClient();
      const result = await client.invoice.getDetail(invoiceNumber);

      if (result.code !== 0) {
        console.error(`✗ 查詢失敗: ${result.msg}`);
        process.exit(1);
      }

      if (options.json) {
        output(result);
        return;
      }

      if (!result.data) {
        console.log(`✗ 查無發票: ${invoiceNumber}`);
        return;
      }

      const inv = result.data;
      console.log('✓ 發票明細');
      console.log(`  發票號碼: ${inv.invoice_number}`);
      console.log(`  開立時間: ${new Date(inv.invoice_time * 1000).toLocaleString('zh-TW')}`);
      console.log(`  買方統編: ${inv.buyer_identifier}`);
      console.log(`  買方名稱: ${inv.buyer_name}`);
      console.log(`  賣方統編: ${inv.seller_identifier}`);
      console.log(`  賣方名稱: ${inv.seller_name}`);
      console.log(`  銷售額: NT$ ${inv.sales_amount.toLocaleString()}`);
      console.log(`  稅額: NT$ ${inv.tax_amount.toLocaleString()}`);
      console.log(`  總計: NT$ ${inv.total_amount.toLocaleString()}`);
      console.log('');
      console.log('  商品明細:');
      for (const item of inv.items) {
        console.log(`    - ${item.description} x ${item.quantity} @ ${item.unit_price} = ${item.amount}`);
      }
    } catch (error) {
      console.error('✗ 查詢失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 作廢發票
invoice
  .command('cancel <invoiceNumber>')
  .description('作廢發票')
  .action(async (invoiceNumber: string) => {
    try {
      const client = createClient();
      const result = await client.invoice.cancel(invoiceNumber);

      if (result.code !== 0) {
        console.error(`✗ 作廢失敗: ${result.msg}`);
        process.exit(1);
      }

      console.log('✓ 發票作廢成功');
      console.log(`  發票號碼: ${invoiceNumber}`);
    } catch (error) {
      console.error('✗ 作廢失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

// 發票列表
invoice
  .command('list')
  .description('發票列表')
  .option('--start <date>', '開始日期 YYYY-MM-DD')
  .option('--end <date>', '結束日期 YYYY-MM-DD')
  .option('--page <page>', '頁碼', '1')
  .option('--size <size>', '每頁筆數', '20')
  .option('--json', '輸出 JSON 格式')
  .action(async (options: {
    start?: string;
    end?: string;
    page: string;
    size: string;
    json?: boolean;
  }) => {
    try {
      const client = createClient();
      const result = await client.invoice.list({
        startDate: options.start,
        endDate: options.end,
        page: parseInt(options.page, 10),
        pageSize: parseInt(options.size, 10),
      });

      if (result.code !== 0) {
        console.error(`✗ 查詢失敗: ${result.msg}`);
        process.exit(1);
      }

      if (options.json) {
        output(result);
        return;
      }

      if (!result.data || result.data.length === 0) {
        console.log('查無發票');
        return;
      }

      const statusText: Record<number, string> = {
        0: '待上傳',
        1: '已上傳',
        2: '已作廢',
        3: '失敗',
      };

      console.log(`發票列表 (共 ${result.total || result.data.length} 筆):`);
      console.log('');
      for (const inv of result.data) {
        const time = new Date(inv.invoice_time * 1000).toLocaleDateString('zh-TW');
        console.log(`  ${inv.invoice_number}  ${time}  NT$ ${inv.total_amount.toLocaleString().padStart(10)}  [${statusText[inv.status] || inv.status}]`);
      }
    } catch (error) {
      console.error('✗ 查詢失敗');
      console.error(`  ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    }
  });

program.parse();
