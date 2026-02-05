import { describe, it, expect } from 'vitest';
import {
  calculateInvoiceAmounts,
  toExclusive,
  toInclusive,
  calculateItemAmount,
  prepareInvoiceData,
} from '../src/calculators/tax.js';
import type { ProductItem } from '../src/types/invoice.js';

describe('calculateInvoiceAmounts', () => {
  it('should calculate B2C invoice without tax split', () => {
    const items: ProductItem[] = [
      { Description: '商品1', Quantity: 1, UnitPrice: 100, Amount: 100, TaxType: 1 },
      { Description: '商品2', Quantity: 1, UnitPrice: 68, Amount: 68, TaxType: 1 },
    ];

    const result = calculateInvoiceAmounts(items, { buyerHasTaxId: false });

    expect(result.salesAmount).toBe(168);
    expect(result.taxAmount).toBe(0);
    expect(result.totalAmount).toBe(168);
    expect(result.taxType).toBe(1);
  });

  it('should calculate B2B invoice with tax split', () => {
    const items: ProductItem[] = [
      { Description: '商品', Quantity: 1, UnitPrice: 168, Amount: 168, TaxType: 1 },
    ];

    const result = calculateInvoiceAmounts(items, { buyerHasTaxId: true });

    // 168 - Round(168 / 1.05) = 168 - 160 = 8
    expect(result.taxAmount).toBe(8);
    expect(result.salesAmount).toBe(160);
    expect(result.totalAmount).toBe(168);
  });

  it('should handle mixed tax types', () => {
    const items: ProductItem[] = [
      { Description: '應稅', Quantity: 1, UnitPrice: 100, Amount: 100, TaxType: 1 },
      { Description: '免稅', Quantity: 1, UnitPrice: 50, Amount: 50, TaxType: 3 },
      { Description: '零稅率', Quantity: 1, UnitPrice: 30, Amount: 30, TaxType: 2 },
    ];

    const result = calculateInvoiceAmounts(items, { buyerHasTaxId: false });

    expect(result.salesAmount).toBe(100);
    expect(result.freeTaxSalesAmount).toBe(50);
    expect(result.zeroTaxSalesAmount).toBe(30);
    expect(result.taxType).toBe(9); // Mixed
  });
});

describe('toExclusive', () => {
  it('should convert inclusive to exclusive price', () => {
    expect(toExclusive(105, 0.05)).toBeCloseTo(100, 5);
  });

  it('should handle different tax rates', () => {
    expect(toExclusive(110, 0.1)).toBeCloseTo(100, 5);
  });
});

describe('toInclusive', () => {
  it('should convert exclusive to inclusive price', () => {
    expect(toInclusive(100, 0.05)).toBeCloseTo(105, 5);
  });

  it('should handle different tax rates', () => {
    expect(toInclusive(100, 0.1)).toBeCloseTo(110, 5);
  });
});

describe('calculateItemAmount', () => {
  it('should multiply quantity by unit price', () => {
    expect(calculateItemAmount(2, 100)).toBe(200);
  });

  it('should handle decimal quantities with 7-decimal precision', () => {
    const result = calculateItemAmount(1.5, 33.33);
    expect(result).toBeCloseTo(49.995, 7);
  });

  it('should handle negative amounts for discounts', () => {
    expect(calculateItemAmount(1, -10)).toBe(-10);
  });
});

describe('prepareInvoiceData', () => {
  it('should auto-fill invoice data for B2C', () => {
    const items: ProductItem[] = [
      { Description: '商品', Quantity: 1, UnitPrice: 168, Amount: 168, TaxType: 1 },
    ];

    const result = prepareInvoiceData(items, '0000000000');

    expect(result.salesAmount).toBe(168);
    expect(result.taxAmount).toBe(0);
    expect(result.TaxRate).toBe('0.05');
  });

  it('should auto-fill invoice data for B2B', () => {
    const items: ProductItem[] = [
      { Description: '商品', Quantity: 1, UnitPrice: 168, Amount: 168, TaxType: 1 },
    ];

    const result = prepareInvoiceData(items, '28080623');

    expect(result.taxAmount).toBe(8);
    expect(result.salesAmount).toBe(160);
  });
});
