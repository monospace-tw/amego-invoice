import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AmegoClient } from '../src/client.js';
import { AmegoNetworkError, RateLimitExceededError } from '../src/errors.js';
import type { Logger } from '../src/types/logger.js';

describe('SDK Enhancements Integration', () => {
  describe('Retry Configuration', () => {
    it('should accept retry configuration', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
        retry: {
          maxRetries: 5,
          baseDelay: 2000,
          maxDelay: 60000,
          retryableErrors: [500, 502, 503],
          retryNetworkErrors: true,
        },
      });

      const config = client.getConfig();
      expect(config.retry).not.toBeNull();
      expect(config.retry?.maxRetries).toBe(5);
      expect(config.retry?.baseDelay).toBe(2000);
    });

    it('should disable retry when set to false', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
        retry: false,
      });

      const config = client.getConfig();
      expect(config.retry).toBeNull();
    });

    it('should use default retry config when not specified', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
      });

      const config = client.getConfig();
      expect(config.retry).not.toBeNull();
      expect(config.retry?.maxRetries).toBe(3);
    });
  });

  describe('Rate Limit Configuration', () => {
    it('should accept rate limit configuration', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
        rateLimit: {
          requestsPerSecond: 5,
          burstSize: 10,
          queueRequests: true,
          maxQueueSize: 50,
        },
      });

      const config = client.getConfig();
      expect(config.rateLimit).not.toBeNull();
      expect(config.rateLimit?.requestsPerSecond).toBe(5);
      expect(config.rateLimit?.burstSize).toBe(10);
    });

    it('should disable rate limit when set to false', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
        rateLimit: false,
      });

      const config = client.getConfig();
      expect(config.rateLimit).toBeNull();
    });

    it('should not enable rate limit by default', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
      });

      const config = client.getConfig();
      expect(config.rateLimit).toBeNull();
    });
  });

  describe('Logger Configuration', () => {
    it('should accept logger configuration', () => {
      const mockLogger: Logger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      };

      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
        logger: {
          logger: mockLogger,
          level: 'debug',
          maskSensitiveData: true,
        },
      });

      const config = client.getConfig();
      expect(config.logger.level).toBe('debug');
      expect(config.logger.maskSensitiveData).toBe(true);
    });

    it('should default to none log level', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
      });

      const config = client.getConfig();
      expect(config.logger.level).toBe('none');
    });
  });

  describe('Batch Operations', () => {
    it('should expose batch operations namespace', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
      });

      expect(client.batch).toBeDefined();
      expect(typeof client.batch.execute).toBe('function');
    });

    it('should expose createMany on invoice operations', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
      });

      expect(typeof client.invoice.createMany).toBe('function');
    });

    it('should expose createMany on allowance operations', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
      });

      expect(typeof client.allowance.createMany).toBe('function');
    });
  });

  describe('Config Validation', () => {
    it('should reject invalid retry config', () => {
      expect(() => {
        new AmegoClient({
          taxId: '12345678',
          appKey: 'test-key',
          retry: {
            maxRetries: -1,
          },
        });
      }).toThrow('Invalid client configuration');
    });

    it('should reject invalid rate limit config', () => {
      expect(() => {
        new AmegoClient({
          taxId: '12345678',
          appKey: 'test-key',
          rateLimit: {
            requestsPerSecond: -1,
          },
        });
      }).toThrow('Invalid client configuration');
    });

    it('should reject invalid logger level', () => {
      expect(() => {
        new AmegoClient({
          taxId: '12345678',
          appKey: 'test-key',
          logger: {
            level: 'invalid' as any,
          },
        });
      }).toThrow('Invalid client configuration');
    });
  });

  describe('Backward Compatibility', () => {
    it('should work with minimal config (no new options)', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
      });

      expect(client.invoice).toBeDefined();
      expect(client.allowance).toBeDefined();
      expect(client.utility).toBeDefined();
      expect(typeof client.invoice.create).toBe('function');
    });

    it('should preserve existing config options', () => {
      const client = new AmegoClient({
        taxId: '12345678',
        appKey: 'test-key',
        baseUrl: 'https://custom.api.com',
        timeout: 60000,
        skipTimeSync: true,
      });

      const config = client.getConfig();
      expect(config.baseUrl).toBe('https://custom.api.com');
      expect(config.timeout).toBe(60000);
      expect(config.skipTimeSync).toBe(true);
    });
  });
});
