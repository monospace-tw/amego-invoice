import { z } from 'zod';

/**
 * 商品課稅別 Schema
 */
export const productTaxTypeSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);

/**
 * 發票課稅別 Schema
 */
export const taxTypeSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(9),
]);

/**
 * 載具類別 Schema
 */
export const carrierTypeSchema = z.union([
  z.literal('3J0002'),
  z.literal('CQ0001'),
  z.literal('amego'),
  z.literal(''),
]);

/**
 * 商品項目 Schema
 */
export const productItemSchema = z.object({
  Description: z.string().min(1).max(256),
  Quantity: z.union([z.number(), z.string()]),
  Unit: z.string().max(6).optional(),
  UnitPrice: z.union([z.number(), z.string()]),
  Amount: z.union([z.number(), z.string()]),
  Remark: z.string().max(40).optional(),
  TaxType: productTaxTypeSchema,
});

/**
 * 開立發票請求 Schema
 */
export const createInvoiceRequestSchema = z.object({
  OrderId: z.string().min(1).max(40),
  TrackApiCode: z.string().optional(),
  BuyerIdentifier: z.string().min(8).max(10),
  BuyerName: z.string().min(1),
  BuyerAddress: z.string().optional(),
  BuyerTelephoneNumber: z.string().optional(),
  BuyerEmailAddress: z.string().email().optional().or(z.literal('')),
  MainRemark: z.string().max(200).optional(),
  CarrierType: carrierTypeSchema.optional(),
  CarrierId1: z.string().optional(),
  CarrierId2: z.string().optional(),
  NPOBAN: z.string().optional(),
  ProductItem: z.array(productItemSchema).min(1).max(9999),
  SalesAmount: z.union([z.number(), z.string()]),
  FreeTaxSalesAmount: z.union([z.number(), z.string()]),
  ZeroTaxSalesAmount: z.union([z.number(), z.string()]),
  TaxType: taxTypeSchema,
  TaxRate: z.string(),
  TaxAmount: z.union([z.number(), z.string()]),
  TotalAmount: z.union([z.number(), z.string()]),
  CustomsClearanceMark: z.union([z.literal(1), z.literal(2)]).optional(),
  ZeroTaxRateReason: z.number().min(71).max(79).optional(),
  BrandName: z.string().optional(),
  DetailVat: z.union([z.literal(0), z.literal(1)]).optional(),
  DetailAmountRound: z.union([z.literal(0), z.literal(1)]).optional(),
  PrinterType: z.number().optional(),
  PrinterLang: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
  PrintDetail: z.union([z.literal(0), z.literal(1)]).optional(),
});

/**
 * 統一編號 Schema（8位數字）
 */
export const taxIdSchema = z.string().regex(/^\d{8}$/, 'Tax ID must be 8 digits');

/**
 * B2C 買方統一編號 Schema（10個0）
 */
export const b2cBuyerIdentifierSchema = z.literal('0000000000');

/**
 * 手機條碼 Schema
 */
export const mobileBarcodeSchema = z
  .string()
  .length(8)
  .regex(/^\/[0-9A-Z+\-.]{7}$/, 'Invalid mobile barcode format');

/**
 * 自然人憑證 Schema
 */
export const naturalPersonCertSchema = z
  .string()
  .length(16)
  .regex(/^[A-Z]{2}\d{14}$/, 'Invalid certificate format');

/**
 * 捐贈碼 Schema（3-7位數字）
 */
export const donationCodeSchema = z
  .string()
  .regex(/^\d{3,7}$/, 'Donation code must be 3-7 digits');

// 型別匯出
export type ProductItem = z.infer<typeof productItemSchema>;
export type CreateInvoiceRequest = z.infer<typeof createInvoiceRequestSchema>;
