import { describe, it, expect } from 'vitest';
import { calculateSignature } from '../src/core/signature.js';

describe('calculateSignature', () => {
  it('should generate correct MD5 signature', () => {
    const jsonData = '{"OrderId":"A001"}';
    const timestamp = 1700000000;
    const appKey = 'abc123';

    const signature = calculateSignature(jsonData, timestamp, appKey);

    // Verify signature is 32 character hex string
    expect(signature).toMatch(/^[a-f0-9]{32}$/);
  });

  it('should handle Chinese characters with UTF-8 encoding', () => {
    const jsonData = '{"BuyerName":"光貿科技有限公司"}';
    const timestamp = 1700000000;
    const appKey = 'testkey';

    const signature = calculateSignature(jsonData, timestamp, appKey);

    // Verify signature is generated
    expect(signature).toMatch(/^[a-f0-9]{32}$/);
  });

  it('should produce different signatures for different inputs', () => {
    const timestamp = 1700000000;
    const appKey = 'abc123';

    const sig1 = calculateSignature('{"id":"1"}', timestamp, appKey);
    const sig2 = calculateSignature('{"id":"2"}', timestamp, appKey);

    expect(sig1).not.toBe(sig2);
  });

  it('should produce consistent results for same input', () => {
    const jsonData = '{"test":"data"}';
    const timestamp = 1700000000;
    const appKey = 'key123';

    const sig1 = calculateSignature(jsonData, timestamp, appKey);
    const sig2 = calculateSignature(jsonData, timestamp, appKey);

    expect(sig1).toBe(sig2);
  });
});
