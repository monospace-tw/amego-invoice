import { describe, it, expect } from 'vitest';
import {
  validateTaxId,
  validateMobileBarcode,
  validateNaturalPersonCert,
  validateDonationCode,
  validateProductItem,
  validateInvoiceData,
} from '../src/validators/index.js';

describe('validateTaxId', () => {
  it('should accept valid 8-digit tax ID', () => {
    const result = validateTaxId('28080623');
    expect(result.valid).toBe(true);
  });

  it('should accept B2C identifier (10 zeros)', () => {
    const result = validateTaxId('0000000000');
    expect(result.valid).toBe(true);
    expect(result.isB2C).toBe(true);
  });

  it('should reject invalid length', () => {
    const result = validateTaxId('1234567');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('8 digits');
  });

  it('should reject non-numeric characters', () => {
    const result = validateTaxId('1234567A');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('only digits');
  });
});

describe('validateMobileBarcode', () => {
  it('should accept valid mobile barcode', () => {
    const result = validateMobileBarcode('/ABC+123');
    expect(result.valid).toBe(true);
  });

  it('should reject barcode without / prefix', () => {
    const result = validateMobileBarcode('ABC+1234');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('start with /');
  });

  it('should reject incorrect length', () => {
    const result = validateMobileBarcode('/ABC');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('8 characters');
  });

  it('should reject invalid characters', () => {
    const result = validateMobileBarcode('/abc+123');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('invalid characters');
  });
});

describe('validateNaturalPersonCert', () => {
  it('should accept valid certificate', () => {
    const result = validateNaturalPersonCert('AB12345678901234');
    expect(result.valid).toBe(true);
  });

  it('should reject incorrect length', () => {
    const result = validateNaturalPersonCert('AB123456');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('16 characters');
  });
});

describe('validateDonationCode', () => {
  it('should accept 3-digit code', () => {
    const result = validateDonationCode('168');
    expect(result.valid).toBe(true);
  });

  it('should accept 7-digit code', () => {
    const result = validateDonationCode('5765732');
    expect(result.valid).toBe(true);
  });

  it('should reject codes outside 3-7 digits', () => {
    const result = validateDonationCode('12');
    expect(result.valid).toBe(false);
    expect(result.error).toContain('3-7 digits');
  });
});

describe('validateProductItem', () => {
  it('should accept valid product item', () => {
    const result = validateProductItem({
      Description: '商品',
      Quantity: 1,
      UnitPrice: 100,
      Amount: 100,
      TaxType: 1,
    });
    expect(result.valid).toBe(true);
  });

  it('should reject missing Description', () => {
    const result = validateProductItem({
      Quantity: 1,
      UnitPrice: 100,
      Amount: 100,
      TaxType: 1,
    });
    expect(result.valid).toBe(false);
  });

  it('should reject amount mismatch', () => {
    const result = validateProductItem({
      Description: '商品',
      Quantity: 2,
      UnitPrice: 100,
      Amount: 100, // Should be 200
      TaxType: 1,
    });
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Amount does not match');
  });

  it('should reject invalid TaxType', () => {
    const result = validateProductItem({
      Description: '商品',
      Quantity: 1,
      UnitPrice: 100,
      Amount: 100,
      TaxType: 5,
    });
    expect(result.valid).toBe(false);
  });
});

describe('validateInvoiceData', () => {
  const validInvoice = {
    OrderId: 'A001',
    BuyerIdentifier: '0000000000',
    BuyerName: '客人',
    ProductItem: [
      { Description: '商品', Quantity: 1, UnitPrice: 100, Amount: 100, TaxType: 1 },
    ],
    SalesAmount: 100,
    FreeTaxSalesAmount: 0,
    ZeroTaxSalesAmount: 0,
    TaxType: 1,
    TaxRate: '0.05',
    TaxAmount: 0,
    TotalAmount: 100,
  };

  it('should accept valid invoice data', () => {
    const result = validateInvoiceData(validInvoice);
    expect(result.valid).toBe(true);
  });

  it('should reject missing OrderId', () => {
    const { OrderId, ...invalid } = validInvoice;
    const result = validateInvoiceData(invalid);
    expect(result.valid).toBe(false);
  });

  it('should reject empty ProductItem array', () => {
    const result = validateInvoiceData({
      ...validInvoice,
      ProductItem: [],
    });
    expect(result.valid).toBe(false);
    // Zod returns "ProductItem: Array must contain at least 1 element(s)"
    expect(result.errors?.some(e => e.includes('ProductItem'))).toBe(true);
  });

  it('should aggregate multiple errors', () => {
    const result = validateInvoiceData({});
    expect(result.valid).toBe(false);
    expect(result.errors?.length).toBeGreaterThan(1);
  });
});
