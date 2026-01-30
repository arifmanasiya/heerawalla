import { describe, it, expect, vi } from 'vitest';
import { handlePricingRoute } from '../src/routes/pricing';

vi.mock('../src/services/pricing-service', () => ({
  estimatePricing: vi.fn(async () => ({
    result: { ok: true, price: 1234, debug: { foo: 'bar' } },
    discountDetails: { summary: 'none', appliedPercent: 0 },
  })),
}));

const mockEnv = {} as any;
const mockCtx = {
  allowedOrigin: 'https://example.com',
} as any;

describe('pricing route', () => {
  it('omits debug when not requested', async () => {
    const req = new Request('https://example.com/pricing/estimate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ metal: '14K', metal_weight: '1.0' }),
    });
    const res = await handlePricingRoute(req, mockEnv, mockCtx);
    const body = await res.json();
    expect(body.debug).toBeUndefined();
    expect(body.price).toBe(1234);
  });

  it('includes debug when explicitly requested', async () => {
    const req = new Request('https://example.com/pricing/estimate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ metal: '14K', metal_weight: '1.0', debug: true }),
    });
    const res = await handlePricingRoute(req, mockEnv, mockCtx);
    const body = await res.json();
    expect(body.debug).toEqual({ foo: 'bar' });
  });
});
