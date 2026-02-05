#!/usr/bin/env node

import { config } from 'dotenv';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { AmegoClient } from './client.js';

// Load .env file
config({ debug: false });
import { validateTaxId, validateMobileBarcode } from './validators/index.js';
import { calculateInvoiceAmounts } from './calculators/tax.js';
import type { CreateInvoiceRequest, ProductItem } from './types/invoice.js';
import type { TaxType } from './types/common.js';

// Create MCP server
const server = new McpServer({
  name: 'amego-invoice',
  version: '1.4.0',
});

// Get config from environment variables
function getConfig() {
  const taxId = process.env.AMEGO_TAX_ID;
  const appKey = process.env.AMEGO_APP_KEY;
  const baseUrl = process.env.AMEGO_BASE_URL;

  if (!taxId || !appKey) {
    throw new Error('請設定環境變數 AMEGO_TAX_ID 和 AMEGO_APP_KEY');
  }

  return { taxId, appKey, baseUrl };
}

// Create client
function createClient() {
  const config = getConfig();
  return new AmegoClient({
    taxId: config.taxId,
    appKey: config.appKey,
    ...(config.baseUrl && { baseUrl: config.baseUrl }),
  });
}

// Tool: Query company name by tax ID
server.tool(
  'query_company',
  'Query company name by Taiwan tax ID (統一編號)',
  { taxId: z.string().describe('統一編號（8位數字）') },
  async ({ taxId }) => {
    const validation = validateTaxId(taxId);
    if (!validation.valid) {
      return {
        content: [{ type: 'text' as const, text: `統一編號格式錯誤: ${validation.error}` }],
        isError: true,
      };
    }

    try {
      const client = createClient();
      const result = await client.utility.queryCompany(taxId);

      if (result.found) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              success: true,
              taxId: result.taxId,
              companyName: result.name,
            }, null, 2),
          }],
        };
      } else {
        return {
          content: [{ type: 'text' as const, text: `查無此統一編號: ${taxId}` }],
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `查詢失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Tool: Validate tax ID (local validation)
server.tool(
  'validate_tax_id',
  'Validate Taiwan tax ID format locally (統一編號格式驗證)',
  { taxId: z.string().describe('統一編號') },
  async ({ taxId }) => {
    const result = validateTaxId(taxId);
    return {
      content: [{
        type: 'text' as const,
        text: JSON.stringify({
          valid: result.valid,
          taxId,
          error: result.error,
        }, null, 2),
      }],
    };
  }
);

// Tool: Validate mobile barcode
server.tool(
  'validate_barcode',
  'Validate Taiwan mobile barcode (手機條碼驗證)',
  {
    barcode: z.string().describe('手機條碼（格式: /開頭，共8碼）'),
    localOnly: z.boolean().optional().describe('僅本地驗證格式，不呼叫 API'),
  },
  async ({ barcode, localOnly }) => {
    const validation = validateMobileBarcode(barcode);
    if (!validation.valid) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            valid: false,
            barcode,
            error: validation.error,
          }, null, 2),
        }],
      };
    }

    if (localOnly) {
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            valid: true,
            barcode,
            message: '手機條碼格式正確（僅本地驗證）',
          }, null, 2),
        }],
      };
    }

    try {
      const client = createClient();
      const result = await client.utility.validateBarcode(barcode);

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            valid: result.valid,
            barcode,
            carrierId1: result.carrierId1,
            carrierId2: result.carrierId2,
            message: result.msg,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `驗證失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Tool: Create invoice
server.tool(
  'create_invoice',
  'Create Taiwan e-invoice (開立電子發票)',
  {
    buyerId: z.string().optional().describe('買方統一編號（B2C 可省略或設為 0000000000）'),
    buyerName: z.string().describe('買方名稱'),
    buyerAddress: z.string().optional().describe('買方地址'),
    buyerEmail: z.string().optional().describe('買方電子郵件'),
    items: z.string().describe('商品項目 JSON 字串，格式: [{"description":"品名","quantity":1,"unitPrice":100}]'),
    taxExclusive: z.boolean().optional().describe('商品單價為未稅價（預設含稅）'),
    carrierType: z.string().optional().describe('載具類別: none, mobile, certificate'),
    carrierId: z.string().optional().describe('載具號碼'),
    donationCode: z.string().optional().describe('捐贈碼'),
    remark: z.string().optional().describe('備註'),
  },
  async ({ buyerId, buyerName, buyerAddress, buyerEmail, items: itemsJson, taxExclusive, carrierType, carrierId, donationCode, remark }) => {
    try {
      const client = createClient();
      const orderId = `MCP-${Date.now()}`;

      // Parse items JSON
      let items: Array<{ description: string; quantity: number; unitPrice: number; unit?: string }>;
      try {
        items = JSON.parse(itemsJson);
      } catch {
        return {
          content: [{ type: 'text' as const, text: '商品項目 JSON 格式錯誤' }],
          isError: true,
        };
      }

      // Convert items to ProductItem format
      const productItems: ProductItem[] = items.map(item => ({
        Description: item.description,
        Quantity: item.quantity,
        UnitPrice: item.unitPrice,
        Amount: item.quantity * item.unitPrice,
        TaxType: 1 as const,
        ...(item.unit && { Unit: item.unit }),
      }));

      // Build invoice data
      const invoiceData: Partial<CreateInvoiceRequest> = {
        OrderId: orderId,
        BuyerIdentifier: buyerId || '0000000000',
        BuyerName: buyerName,
        ProductItem: productItems,
      };

      if (buyerAddress) invoiceData.BuyerAddress = buyerAddress;
      if (buyerEmail) invoiceData.BuyerEmailAddress = buyerEmail;
      if (taxExclusive) invoiceData.DetailVat = 0;
      if (remark) invoiceData.MainRemark = remark;
      if (donationCode) invoiceData.NPOBAN = donationCode;

      // Carrier settings
      if (carrierType === 'mobile' && carrierId) {
        invoiceData.CarrierType = '3J0002';
        invoiceData.CarrierId1 = carrierId;
        invoiceData.CarrierId2 = carrierId;
      } else if (carrierType === 'certificate' && carrierId) {
        invoiceData.CarrierType = 'CQ0001';
        invoiceData.CarrierId1 = carrierId;
        invoiceData.CarrierId2 = carrierId;
      }

      // Calculate amounts
      const effectiveBuyerId = buyerId || '0000000000';
      const buyerHasTaxId = effectiveBuyerId !== '0000000000' && effectiveBuyerId.length === 8;
      const amounts = calculateInvoiceAmounts(productItems, {
        buyerHasTaxId,
        priceExclusive: taxExclusive,
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
        return {
          content: [{ type: 'text' as const, text: `開立失敗: ${result.msg}` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            invoiceNumber: result.invoice_number,
            orderId,
            invoiceTime: result.invoice_time ? new Date(result.invoice_time * 1000).toISOString() : null,
            randomNumber: result.random_number,
            barcode: result.barcode,
            totalAmount: amounts.totalAmount,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `開立失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get invoice status
server.tool(
  'get_invoice_status',
  'Get invoice status (查詢發票狀態)',
  { invoiceNumber: z.string().describe('發票號碼（10碼，如 AB12345678）') },
  async ({ invoiceNumber }) => {
    try {
      const client = createClient();
      const result = await client.invoice.getStatus(invoiceNumber);

      if (result.code !== 0) {
        return {
          content: [{ type: 'text' as const, text: `查詢失敗: ${result.msg}` }],
          isError: true,
        };
      }

      if (!result.data || result.data.length === 0) {
        return {
          content: [{ type: 'text' as const, text: `查無發票: ${invoiceNumber}` }],
        };
      }

      const inv = result.data[0];
      const statusText: Record<number, string> = {
        0: '待上傳',
        1: '已上傳',
        2: '已作廢',
        3: '上傳失敗',
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            invoiceNumber: inv.invoice_number,
            status: inv.status,
            statusText: statusText[inv.status] || String(inv.status),
            type: inv.type,
            totalAmount: inv.total_amount,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `查詢失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get invoice detail
server.tool(
  'get_invoice_detail',
  'Get invoice detail (查詢發票明細)',
  { invoiceNumber: z.string().describe('發票號碼（10碼，如 AB12345678）') },
  async ({ invoiceNumber }) => {
    try {
      const client = createClient();
      const result = await client.invoice.getDetail(invoiceNumber);

      if (result.code !== 0) {
        return {
          content: [{ type: 'text' as const, text: `查詢失敗: ${result.msg}` }],
          isError: true,
        };
      }

      if (!result.data) {
        return {
          content: [{ type: 'text' as const, text: `查無發票: ${invoiceNumber}` }],
        };
      }

      const inv = result.data;
      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            invoiceNumber: inv.invoice_number,
            invoiceTime: new Date(inv.invoice_time * 1000).toISOString(),
            buyerIdentifier: inv.buyer_identifier,
            buyerName: inv.buyer_name,
            sellerIdentifier: inv.seller_identifier,
            sellerName: inv.seller_name,
            salesAmount: inv.sales_amount,
            taxAmount: inv.tax_amount,
            totalAmount: inv.total_amount,
            items: inv.items.map(item => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              amount: item.amount,
            })),
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `查詢失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Tool: Cancel invoice
server.tool(
  'cancel_invoice',
  'Cancel invoice (作廢發票)',
  { invoiceNumber: z.string().describe('發票號碼（10碼，如 AB12345678）') },
  async ({ invoiceNumber }) => {
    try {
      const client = createClient();
      const result = await client.invoice.cancel(invoiceNumber);

      if (result.code !== 0) {
        return {
          content: [{ type: 'text' as const, text: `作廢失敗: ${result.msg}` }],
          isError: true,
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            success: true,
            invoiceNumber,
            message: '發票作廢成功',
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `作廢失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Tool: List invoices
server.tool(
  'list_invoices',
  'List invoices (發票列表)',
  {
    startDate: z.string().optional().describe('開始日期 YYYY-MM-DD'),
    endDate: z.string().optional().describe('結束日期 YYYY-MM-DD'),
    page: z.number().optional().describe('頁碼（預設 1）'),
    pageSize: z.number().optional().describe('每頁筆數（預設 20）'),
  },
  async ({ startDate, endDate, page, pageSize }) => {
    try {
      const client = createClient();
      const result = await client.invoice.list({
        startDate,
        endDate,
        page: page || 1,
        pageSize: pageSize || 20,
      });

      if (result.code !== 0) {
        return {
          content: [{ type: 'text' as const, text: `查詢失敗: ${result.msg}` }],
          isError: true,
        };
      }

      if (!result.data || result.data.length === 0) {
        return {
          content: [{ type: 'text' as const, text: '查無發票' }],
        };
      }

      const statusText: Record<number, string> = {
        0: '待上傳',
        1: '已上傳',
        2: '已作廢',
        3: '上傳失敗',
      };

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            total: result.total || result.data.length,
            invoices: result.data.map(inv => ({
              invoiceNumber: inv.invoice_number,
              invoiceTime: new Date(inv.invoice_time * 1000).toISOString(),
              totalAmount: inv.total_amount,
              status: inv.status,
              statusText: statusText[inv.status] || String(inv.status),
            })),
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `查詢失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get server time
server.tool(
  'get_server_time',
  'Get Amego server time (取得伺服器時間)',
  {},
  async () => {
    try {
      const client = createClient();
      const result = await client.utility.getServerTime();

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            text: result.text,
            timestamp: result.timestamp,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `取得時間失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Tool: Get track info
server.tool(
  'get_track_info',
  'Get invoice track info (查詢字軌資訊)',
  { period: z.string().optional().describe('期別（如 11312）') },
  async ({ period }) => {
    try {
      const client = createClient();
      const result = await client.utility.getTrackInfo({ period });

      if (result.code !== 0) {
        return {
          content: [{ type: 'text' as const, text: `查詢失敗: ${result.msg}` }],
          isError: true,
        };
      }

      if (!result.data || result.data.length === 0) {
        return {
          content: [{ type: 'text' as const, text: '查無字軌資訊' }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            tracks: result.data.map(track => ({
              period: track.period,
              track: track.track,
              start: track.start,
              end: track.end,
              remaining: track.remaining,
            })),
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `查詢失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Tool: Check lottery
server.tool(
  'check_lottery',
  'Check invoice lottery result (查詢發票中獎)',
  { invoiceNumber: z.string().describe('發票號碼（10碼，如 AB12345678）') },
  async ({ invoiceNumber }) => {
    try {
      const client = createClient();
      const result = await client.utility.checkLottery(invoiceNumber);

      if (result.code !== 0) {
        return {
          content: [{ type: 'text' as const, text: `查詢失敗: ${result.msg}` }],
          isError: true,
        };
      }

      if (result.data?.won === null) {
        return {
          content: [{
            type: 'text' as const,
            text: JSON.stringify({
              invoiceNumber,
              status: 'pending',
              message: '尚未開獎',
            }, null, 2),
          }],
        };
      }

      return {
        content: [{
          type: 'text' as const,
          text: JSON.stringify({
            invoiceNumber,
            won: result.data?.won,
            prizeType: result.data?.prizeType,
            prizeAmount: result.data?.prizeAmount,
          }, null, 2),
        }],
      };
    } catch (error) {
      return {
        content: [{ type: 'text' as const, text: `查詢失敗: ${error instanceof Error ? error.message : String(error)}` }],
        isError: true,
      };
    }
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Amego Invoice MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
