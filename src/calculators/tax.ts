import type { ProductItem } from '../types/invoice.js';
import type { TaxType, ProductTaxType } from '../types/common.js';

/**
 * 發票金額計算選項
 */
export interface CalculateAmountsOptions {
  /** 買方是否有統編 */
  buyerHasTaxId?: boolean;
  /** 稅率，預設 0.05 (5%) */
  taxRate?: number;
  /** 商品價格是否為未稅價，預設 false（含稅） */
  priceExclusive?: boolean;
}

/**
 * 發票金額計算結果
 */
export interface InvoiceAmounts {
  /** 應稅銷售額合計 */
  salesAmount: number;
  /** 免稅銷售額合計 */
  freeTaxSalesAmount: number;
  /** 零稅率銷售額合計 */
  zeroTaxSalesAmount: number;
  /** 營業稅額 */
  taxAmount: number;
  /** 總計 */
  totalAmount: number;
  /** 課稅別 */
  taxType: TaxType;
}

/**
 * 計算發票金額
 *
 * 含稅商品金額計算邏輯：
 * - SalesAmount = 所有 TaxType=1 的 Amount 加總（四捨五入）
 * - FreeTaxSalesAmount = 所有 TaxType=3 的 Amount 加總
 * - ZeroTaxSalesAmount = 所有 TaxType=2 的 Amount 加總
 *
 * 打統編（需分拆稅額）：
 * - TaxAmount = SalesAmount - Round(SalesAmount / 1.05)
 * - SalesAmount = SalesAmount - TaxAmount
 *
 * 不打統編：
 * - TaxAmount = 0
 *
 * @param items - 商品項目陣列
 * @param options - 計算選項
 * @returns 計算結果
 */
export function calculateInvoiceAmounts(
  items: ProductItem[],
  options: CalculateAmountsOptions = {}
): InvoiceAmounts {
  const { buyerHasTaxId = false, taxRate = 0.05, priceExclusive = false } = options;

  // 分類加總
  let taxableSum = 0; // TaxType = 1 (應稅)
  let zeroRateSum = 0; // TaxType = 2 (零稅率)
  let exemptSum = 0; // TaxType = 3 (免稅)

  for (const item of items) {
    const amount = typeof item.Amount === 'string' ? parseFloat(item.Amount) : item.Amount;

    switch (item.TaxType) {
      case 1:
        taxableSum += amount;
        break;
      case 2:
        zeroRateSum += amount;
        break;
      case 3:
        exemptSum += amount;
        break;
    }
  }

  // 四捨五入到整數
  let salesAmount = Math.round(taxableSum);
  const freeTaxSalesAmount = Math.round(exemptSum);
  const zeroTaxSalesAmount = Math.round(zeroRateSum);

  let taxAmount = 0;

  if (priceExclusive) {
    // 未稅價模式：金額已是未稅，直接計算稅額
    if (buyerHasTaxId && salesAmount > 0) {
      taxAmount = Math.round(salesAmount * taxRate);
    }
    // 不打統編時，taxAmount = 0，但 TotalAmount 仍為未稅金額
  } else {
    // 含稅價模式（預設）：需從含稅金額分拆出稅額
    if (buyerHasTaxId && salesAmount > 0) {
      const divisor = 1 + taxRate;
      taxAmount = salesAmount - Math.round(salesAmount / divisor);
      salesAmount = salesAmount - taxAmount;
    }
  }

  const totalAmount = salesAmount + freeTaxSalesAmount + zeroTaxSalesAmount + taxAmount;

  // 判斷課稅別
  const taxType = determineTaxType(items);

  return {
    salesAmount,
    freeTaxSalesAmount,
    zeroTaxSalesAmount,
    taxAmount,
    totalAmount,
    taxType,
  };
}

/**
 * 含稅價轉未稅價
 *
 * @param inclusiveAmount - 含稅金額
 * @param taxRate - 稅率，預設 0.05 (5%)
 * @returns 未稅金額
 */
export function toExclusive(inclusiveAmount: number, taxRate: number = 0.05): number {
  return inclusiveAmount / (1 + taxRate);
}

/**
 * 未稅價轉含稅價
 *
 * @param exclusiveAmount - 未稅金額
 * @param taxRate - 稅率，預設 0.05 (5%)
 * @returns 含稅金額
 */
export function toInclusive(exclusiveAmount: number, taxRate: number = 0.05): number {
  return exclusiveAmount * (1 + taxRate);
}

/**
 * 計算商品小計金額
 *
 * @param quantity - 數量
 * @param unitPrice - 單價
 * @returns 小計金額（保留 7 位小數精準度）
 */
export function calculateItemAmount(quantity: number, unitPrice: number): number {
  const result = quantity * unitPrice;
  // 保留 7 位小數精準度
  return Math.round(result * 10000000) / 10000000;
}

/**
 * 根據商品項目判斷發票課稅別
 */
function determineTaxType(items: ProductItem[]): TaxType {
  const taxTypes = new Set<ProductTaxType>();

  for (const item of items) {
    taxTypes.add(item.TaxType);
  }

  // 只有一種稅別
  if (taxTypes.size === 1) {
    const singleType = Array.from(taxTypes)[0];
    return singleType as TaxType;
  }

  // 混合稅別
  return 9;
}

/**
 * 準備完整發票資料（自動填入金額欄位）
 *
 * @param items - 商品項目陣列
 * @param buyerIdentifier - 買方統一編號
 * @param taxRate - 稅率，預設 0.05
 * @returns 完整的金額相關欄位
 */
export function prepareInvoiceData(
  items: ProductItem[],
  buyerIdentifier: string,
  taxRate: number = 0.05
): InvoiceAmounts & { TaxRate: string } {
  const buyerHasTaxId = buyerIdentifier !== '0000000000' && buyerIdentifier.length === 8;

  const amounts = calculateInvoiceAmounts(items, {
    buyerHasTaxId,
    taxRate,
  });

  return {
    ...amounts,
    TaxRate: taxRate.toString(),
  };
}
