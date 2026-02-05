import { z } from 'zod';
import {
  taxIdSchema,
  b2cBuyerIdentifierSchema,
  mobileBarcodeSchema,
  naturalPersonCertSchema,
  donationCodeSchema,
  productItemSchema,
  createInvoiceRequestSchema,
} from './schemas.js';

export * from './schemas.js';

/**
 * 驗證結果
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
  errors?: string[];
  isB2C?: boolean;
}

/**
 * 驗證統一編號
 *
 * @param taxId - 統一編號
 * @returns 驗證結果
 */
export function validateTaxId(taxId: string): ValidationResult {
  // 檢查是否為 B2C 識別碼
  if (taxId === '0000000000') {
    return { valid: true, isB2C: true };
  }

  // 檢查長度
  if (taxId.length !== 8) {
    return { valid: false, error: 'Tax ID must be 8 digits' };
  }

  // 檢查是否只包含數字
  if (!/^\d+$/.test(taxId)) {
    return { valid: false, error: 'Tax ID must contain only digits' };
  }

  return { valid: true };
}

/**
 * 驗證手機條碼
 *
 * @param barcode - 手機條碼
 * @returns 驗證結果
 */
export function validateMobileBarcode(barcode: string): ValidationResult {
  // 檢查前綴
  if (!barcode.startsWith('/')) {
    return { valid: false, error: 'Mobile barcode must start with /' };
  }

  // 檢查長度
  if (barcode.length !== 8) {
    return { valid: false, error: 'Mobile barcode must be 8 characters' };
  }

  // 檢查字元（允許 0-9, A-Z, +, -, .）
  const validChars = /^\/[0-9A-Z+\-.]{7}$/;
  if (!validChars.test(barcode)) {
    return { valid: false, error: 'Mobile barcode contains invalid characters' };
  }

  return { valid: true };
}

/**
 * 驗證自然人憑證
 *
 * @param certId - 自然人憑證代碼
 * @returns 驗證結果
 */
export function validateNaturalPersonCert(certId: string): ValidationResult {
  // 檢查長度
  if (certId.length !== 16) {
    return { valid: false, error: 'Certificate must be 16 characters' };
  }

  // 檢查格式（前2碼英文，後14碼數字）
  if (!/^[A-Z]{2}\d{14}$/.test(certId)) {
    return { valid: false, error: 'Invalid certificate format' };
  }

  return { valid: true };
}

/**
 * 驗證捐贈碼
 *
 * @param code - 捐贈碼
 * @returns 驗證結果
 */
export function validateDonationCode(code: string): ValidationResult {
  // 檢查是否為數字
  if (!/^\d+$/.test(code)) {
    return { valid: false, error: 'Donation code must contain only digits' };
  }

  // 檢查長度（3-7位數）
  if (code.length < 3 || code.length > 7) {
    return { valid: false, error: 'Donation code must be 3-7 digits' };
  }

  return { valid: true };
}

/**
 * 驗證商品項目
 *
 * @param item - 商品項目
 * @returns 驗證結果
 */
export function validateProductItem(item: unknown): ValidationResult {
  const result = productItemSchema.safeParse(item);

  if (!result.success) {
    const errors = result.error.errors.map((e) => e.message);
    return { valid: false, error: errors[0], errors };
  }

  // 額外檢查：Amount 是否等於 Quantity * UnitPrice
  const data = result.data;
  const quantity = typeof data.Quantity === 'string' ? parseFloat(data.Quantity) : data.Quantity;
  const unitPrice = typeof data.UnitPrice === 'string' ? parseFloat(data.UnitPrice) : data.UnitPrice;
  const amount = typeof data.Amount === 'string' ? parseFloat(data.Amount) : data.Amount;

  const expectedAmount = quantity * unitPrice;
  // 允許小數精準度到 7 位數的誤差
  if (Math.abs(expectedAmount - amount) > 0.0000001) {
    return { valid: false, error: 'Amount does not match Quantity * UnitPrice' };
  }

  return { valid: true };
}

/**
 * 驗證完整發票資料
 *
 * @param data - 發票資料
 * @returns 驗證結果
 */
export function validateInvoiceData(data: unknown): ValidationResult {
  const result = createInvoiceRequestSchema.safeParse(data);

  if (!result.success) {
    const errors = result.error.errors.map((e) => {
      const path = e.path.join('.');
      return path ? `${path}: ${e.message}` : e.message;
    });
    return { valid: false, error: errors[0], errors };
  }

  const invoice = result.data;
  const validationErrors: string[] = [];

  // 驗證 OrderId
  if (!invoice.OrderId) {
    validationErrors.push('OrderId is required');
  } else if (invoice.OrderId.length > 40) {
    validationErrors.push('OrderId must not exceed 40 characters');
  }

  // 驗證 ProductItem
  if (!invoice.ProductItem || invoice.ProductItem.length === 0) {
    validationErrors.push('At least one ProductItem is required');
  } else if (invoice.ProductItem.length > 9999) {
    validationErrors.push('ProductItem cannot exceed 9999 items');
  }

  // 驗證每個 ProductItem
  invoice.ProductItem.forEach((item, index) => {
    const itemResult = validateProductItem(item);
    if (!itemResult.valid && itemResult.error) {
      validationErrors.push(`ProductItem[${index}]: ${itemResult.error}`);
    }
  });

  if (validationErrors.length > 0) {
    return { valid: false, error: validationErrors[0], errors: validationErrors };
  }

  return { valid: true };
}
