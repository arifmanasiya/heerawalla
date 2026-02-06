import { describe, it, expect, vi } from 'vitest';

vi.mock('cloudflare:email', () => ({
  EmailMessage: class {},
}));

import {
  computeOptionPriceFromCosts,
  computeProductionCost,
  computeSizeAdjustments,
  computeTariffCost,
} from '../src/legacy';

describe('pricing calculations', () => {
  it('computes size-based metal adjustments', () => {
    const record = {
      size: '7',
      size_label: 'Ring',
      size_ring: '7',
    };
    const costValues = {
      ring_size_base: '6',
      ring_size_weight_step_g: '0.1',
    };
    const result = computeSizeAdjustments(record, costValues);
    expect(result.ringAdjustment).toBeCloseTo(0.1, 6);
    expect(result.sizeAdjustment).toBeCloseTo(0.1, 6);
  });

  it('applies tariff to production cost plus shipping', () => {
    const costValues = { tariff_percent: '0.1', profit_margin_production_pct: '0.2' };
    const production = computeProductionCost(1000, 200, costValues);
    expect(production.productionCost).toBeCloseTo(1440, 6);
    const tariff = computeTariffCost(production.productionCost, 50, costValues);
    expect(tariff.tariffBase).toBeCloseTo(1490, 6);
    expect(tariff.tariffCost).toBeCloseTo(149, 6);
  });

  it('computes a full price estimate with expected rounding', () => {
    const record = {
      metal: '18K Yellow Gold',
      metal_weight: '10',
      stone: 'Lab Grown Diamond',
      stone_weight: '1.5',
      size: '6',
    };
    const costValues = {
      price_gram_18k: '50',
      labor_flat: '100',
      labor_per_gram: '2',
      labor_per_ct: '10',
      labor_margin_percent: '0.1',
      tariff_percent: '0.1',
      dollar_risk_pct: '0.02',
      shipping_cost_usd: '20',
      price_premium_pct: '0.1',
      profit_margin_production_pct: '0.2',
      profit_margin_sales_pct: '0.1',
      lab_diamonds_relative_cost_pct: '0.2',
    };
    const diamondPrices = [
      { clarity: 'VS1', color: 'F', weightMin: 0, weightMax: 2, pricePerCt: 3000 },
    ];

    const result = computeOptionPriceFromCosts(
      record,
      'VS1',
      'F',
      costValues,
      diamondPrices,
      null,
      {},
      { appliedPercent: 0, rawPercent: 0, summary: 'none', label: 'none', source: 'none' }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.price).toBe(2516);
    }
  });

  it('prices multiple stone pieces with lab multiplier applied', () => {
    const record = {
      metal: '18K Yellow Gold',
      metal_weight: '1',
      stone: 'Lab Grown Diamond',
      diamond_breakdown: '0.2 x 10, 1.5 x 2',
    };
    const costValues = {
      price_gram_18k: '1',
      lab_diamonds_relative_cost_pct: '0.2',
    };
    const diamondPrices = [
      { clarity: 'VS1', color: 'F', weightMin: 0, weightMax: 0.99, pricePerCt: 1000 },
      { clarity: 'VS1', color: 'F', weightMin: 1, weightMax: 5, pricePerCt: 2000 },
    ];

    const result = computeOptionPriceFromCosts(
      record,
      'VS1',
      'F',
      costValues,
      diamondPrices,
      null,
      {},
      { appliedPercent: 0, rawPercent: 0, summary: 'none', label: 'none', source: 'none' }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // diamond cost: (0.2*10)=2ct * 1000 + (1.5*2)=3ct * 2000 = 8000
      // lab multiplier: 8000 * 0.2 = 1600
      // metal cost: 1g * 1 = 1
      expect(result.price).toBe(1601);
    }
  });

  it('prices multiple stone pieces without lab multiplier', () => {
    const record = {
      metal: '18K Yellow Gold',
      metal_weight: '1',
      stone: 'Natural Diamond',
      diamond_breakdown: '0.2 x 10, 1.5 x 2',
    };
    const costValues = {
      price_gram_18k: '1',
      lab_diamonds_relative_cost_pct: '0.2',
    };
    const diamondPrices = [
      { clarity: 'VS1', color: 'F', weightMin: 0, weightMax: 0.99, pricePerCt: 1000 },
      { clarity: 'VS1', color: 'F', weightMin: 1, weightMax: 5, pricePerCt: 2000 },
    ];

    const result = computeOptionPriceFromCosts(
      record,
      'VS1',
      'F',
      costValues,
      diamondPrices,
      null,
      {},
      { appliedPercent: 0, rawPercent: 0, summary: 'none', label: 'none', source: 'none' }
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      // diamond cost: (0.2*10)=2ct * 1000 + (1.5*2)=3ct * 2000 = 8000
      // metal cost: 1
      expect(result.price).toBe(8001);
    }
  });
});
