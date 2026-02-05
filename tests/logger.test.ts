import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  maskSensitiveData,
  RequestLogger,
  resolveLogConfig,
  consoleLogger,
} from '../src/core/logger.js';
import { DEFAULT_LOG_CONFIG } from '../src/types/logger.js';
import type { Logger } from '../src/types/logger.js';

describe('maskSensitiveData', () => {
  it('should mask appKey', () => {
    const data = { appKey: 'secretkey123456' };
    const masked = maskSensitiveData(data);
    expect(masked).toEqual({ appKey: 'sec***456' });
  });

  it('should mask buyer information', () => {
    const data = {
      BuyerIdentifier: '12345678',
      BuyerName: 'John Doe',
      BuyerAddress: '123 Main Street',
      BuyerPhone: '0912345678',
      BuyerEmail: 'john@example.com',
    };
    const masked = maskSensitiveData(data) as Record<string, string>;

    expect(masked.BuyerIdentifier).toBe('123***678');
    expect(masked.BuyerName).toBe('Joh***Doe');
    expect(masked.BuyerAddress).toBe('123***eet');
    expect(masked.BuyerPhone).toBe('091***678');
    expect(masked.BuyerEmail).toBe('joh***com');
  });

  it('should mask short strings completely', () => {
    const data = { BuyerName: 'AB' };
    const masked = maskSensitiveData(data);
    expect(masked).toEqual({ BuyerName: '***' });
  });

  it('should handle nested objects', () => {
    const data = {
      request: {
        appKey: 'secretkey123456',
        data: {
          BuyerName: 'John Doe',
        },
      },
    };
    const masked = maskSensitiveData(data) as {
      request: { appKey: string; data: { BuyerName: string } };
    };

    expect(masked.request.appKey).toBe('sec***456');
    expect(masked.request.data.BuyerName).toBe('Joh***Doe');
  });

  it('should handle arrays', () => {
    const data = {
      items: [{ BuyerName: 'John Doe' }, { BuyerName: 'Jane Doe' }],
    };
    const masked = maskSensitiveData(data) as {
      items: Array<{ BuyerName: string }>;
    };

    expect(masked.items[0].BuyerName).toBe('Joh***Doe');
    expect(masked.items[1].BuyerName).toBe('Jan***Doe');
  });

  it('should not modify non-sensitive fields', () => {
    const data = { OrderId: 'A001', Amount: 1000 };
    const masked = maskSensitiveData(data);
    expect(masked).toEqual(data);
  });

  it('should handle null and undefined', () => {
    expect(maskSensitiveData(null)).toBeNull();
    expect(maskSensitiveData(undefined)).toBeUndefined();
  });
});

describe('RequestLogger', () => {
  let mockLogger: Logger;

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
  });

  it('should not log when level is none', () => {
    const logger = new RequestLogger({
      logger: mockLogger,
      level: 'none',
      maskSensitiveData: true,
    });

    logger.debug('test');
    logger.info('test');
    logger.warn('test');
    logger.error('test');

    expect(mockLogger.debug).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockLogger.warn).not.toHaveBeenCalled();
    expect(mockLogger.error).not.toHaveBeenCalled();
  });

  it('should log all levels when level is debug', () => {
    const logger = new RequestLogger({
      logger: mockLogger,
      level: 'debug',
      maskSensitiveData: true,
    });

    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');
    logger.error('error msg');

    expect(mockLogger.debug).toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should filter debug when level is info', () => {
    const logger = new RequestLogger({
      logger: mockLogger,
      level: 'info',
      maskSensitiveData: true,
    });

    logger.debug('debug msg');
    logger.info('info msg');

    expect(mockLogger.debug).not.toHaveBeenCalled();
    expect(mockLogger.info).toHaveBeenCalled();
  });

  it('should filter debug and info when level is warn', () => {
    const logger = new RequestLogger({
      logger: mockLogger,
      level: 'warn',
      maskSensitiveData: true,
    });

    logger.debug('debug msg');
    logger.info('info msg');
    logger.warn('warn msg');

    expect(mockLogger.debug).not.toHaveBeenCalled();
    expect(mockLogger.info).not.toHaveBeenCalled();
    expect(mockLogger.warn).toHaveBeenCalled();
  });

  it('should mask sensitive data when logging request', () => {
    const logger = new RequestLogger({
      logger: mockLogger,
      level: 'debug',
      maskSensitiveData: true,
    });

    logger.logRequest('POST', '/json/f0401', {
      BuyerName: 'John Doe',
      appKey: 'secretkey123',
    });

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Request: POST /json/f0401',
      expect.objectContaining({
        BuyerName: 'Joh***Doe',
        appKey: 'sec***123',
      })
    );
  });

  it('should not mask data when maskSensitiveData is false', () => {
    const logger = new RequestLogger({
      logger: mockLogger,
      level: 'debug',
      maskSensitiveData: false,
    });

    logger.logRequest('POST', '/json/f0401', {
      BuyerName: 'John Doe',
    });

    expect(mockLogger.debug).toHaveBeenCalledWith(
      'Request: POST /json/f0401',
      expect.objectContaining({
        BuyerName: 'John Doe',
      })
    );
  });

  it('should log response', () => {
    const logger = new RequestLogger({
      logger: mockLogger,
      level: 'debug',
      maskSensitiveData: true,
    });

    logger.logResponse('/json/f0401', 200, { code: 0 });

    expect(mockLogger.debug).toHaveBeenCalledWith('Response: /json/f0401 (200)', { code: 0 });
  });

  it('should log error', () => {
    const logger = new RequestLogger({
      logger: mockLogger,
      level: 'error',
      maskSensitiveData: true,
    });

    const error = new Error('Something went wrong');
    logger.logError('/json/f0401', error);

    expect(mockLogger.error).toHaveBeenCalledWith('Error: /json/f0401', {
      name: 'Error',
      message: 'Something went wrong',
    });
  });

  it('should use console logger when no logger provided', () => {
    const logger = new RequestLogger({
      logger: null,
      level: 'debug',
      maskSensitiveData: true,
    });

    // Should not throw when using default console logger
    expect(() => logger.debug('test')).not.toThrow();
  });
});

describe('resolveLogConfig', () => {
  it('should return default config when undefined', () => {
    const result = resolveLogConfig(undefined);
    expect(result).toEqual(DEFAULT_LOG_CONFIG);
  });

  it('should return default config when null', () => {
    const result = resolveLogConfig(null);
    expect(result).toEqual(DEFAULT_LOG_CONFIG);
  });

  it('should merge partial config with defaults', () => {
    const result = resolveLogConfig({ level: 'debug' });
    expect(result).toEqual({
      ...DEFAULT_LOG_CONFIG,
      level: 'debug',
    });
  });

  it('should preserve custom logger', () => {
    const customLogger: Logger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const result = resolveLogConfig({ logger: customLogger });
    expect(result.logger).toBe(customLogger);
  });
});

describe('consoleLogger', () => {
  it('should have all required methods', () => {
    expect(typeof consoleLogger.debug).toBe('function');
    expect(typeof consoleLogger.info).toBe('function');
    expect(typeof consoleLogger.warn).toBe('function');
    expect(typeof consoleLogger.error).toBe('function');
  });
});
