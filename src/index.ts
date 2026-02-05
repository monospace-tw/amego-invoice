// Main client
export { AmegoClient } from './client.js';

// Error classes
export {
  AmegoError,
  AmegoApiError,
  AmegoNetworkError,
  AmegoValidationError,
  AmegoTimeoutError,
  RateLimitExceededError,
} from './errors.js';

// Types - Common
export type {
  TaxType,
  ProductTaxType,
  CarrierType,
  StatusCode,
  InvoiceType,
  PrinterEncoding,
  DetailVat,
  ZeroTaxRateReason,
  CustomsClearanceMark,
  ApiResponse,
} from './types/common.js';

export { STATUS_DESCRIPTIONS } from './types/common.js';

// Types - Config
export type {
  AmegoClientConfig,
  AmegoClientConfigInternal,
} from './types/config.js';

export { DEFAULT_CONFIG } from './types/config.js';

// Types - Invoice
export type {
  ProductItem,
  CreateInvoiceRequest,
  CreateInvoiceResponse,
  CancelInvoiceItem,
  InvoiceStatusItem,
  InvoiceStatusResponse,
  InvoiceDetailResponse,
  InvoiceListOptions,
  InvoiceListResponse,
  InvoiceFileOptions,
  InvoicePrintOptions,
  InvoicePrintResponse,
  CreateInvoiceWithNumberRequest,
} from './types/invoice.js';

// Types - Allowance
export type {
  AllowanceProductItem,
  CreateAllowanceRequest,
  CreateAllowanceResponse,
  CancelAllowanceItem,
  AllowanceStatusItem,
  AllowanceStatusResponse,
  AllowanceDetailResponse,
  AllowanceListOptions,
  AllowanceListResponse,
  AllowanceFileOptions,
  AllowancePrintOptions,
  AllowancePrintResponse,
} from './types/allowance.js';

// Validators
export {
  validateTaxId,
  validateMobileBarcode,
  validateNaturalPersonCert,
  validateDonationCode,
  validateProductItem,
  validateInvoiceData,
  // Zod schemas
  productTaxTypeSchema,
  taxTypeSchema,
  carrierTypeSchema,
  productItemSchema,
  createInvoiceRequestSchema,
  taxIdSchema,
  b2cBuyerIdentifierSchema,
  mobileBarcodeSchema,
  naturalPersonCertSchema,
  donationCodeSchema,
} from './validators/index.js';

export type { ValidationResult } from './validators/index.js';

// Tax Calculator
export {
  calculateInvoiceAmounts,
  toExclusive,
  toInclusive,
  calculateItemAmount,
  prepareInvoiceData,
} from './calculators/tax.js';

export type {
  CalculateAmountsOptions,
  InvoiceAmounts,
} from './calculators/tax.js';
