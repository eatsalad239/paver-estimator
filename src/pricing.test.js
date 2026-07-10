import { describe, it, expect } from 'vitest';
import { calculateEstimate, formatUSD } from './pricing.js';
import { defaultConfig } from './config.js';

const cfg = defaultConfig;

describe('calculateEstimate — base rates', () => {
  it('applies min/max $/sqft with a good (1.0) condition', () => {
    // sealing $1.50–$2.50 × 600 sqft × 1.0
    const r = calculateEstimate({ service: 'sealing', sqft: 600, condition: 'good' }, cfg);
    expect(r).toEqual({ low: 900, high: 1500, atMinimum: false });
  });

  it('handles install rates', () => {
    // install $8–$12 × 800 × 1.0
    const r = calculateEstimate({ service: 'install', sqft: 800, condition: 'good' }, cfg);
    expect(r).toEqual({ low: 6400, high: 9600, atMinimum: false });
  });
});

describe('calculateEstimate — condition multipliers', () => {
  it('faded applies a 1.15× multiplier', () => {
    const r = calculateEstimate({ service: 'sealing', sqft: 600, condition: 'faded' }, cfg);
    // 900×1.15 = 1035, 1500×1.15 = 1725
    expect(r.low).toBe(1035);
    expect(r.high).toBe(1725);
  });

  it('heavy applies a 1.35× multiplier', () => {
    const r = calculateEstimate({ service: 'sealing', sqft: 600, condition: 'heavy' }, cfg);
    // 900×1.35 = 1215, 1500×1.35 = 2025
    expect(r.low).toBe(1215);
    expect(r.high).toBe(2025);
  });

  it('worse condition never lowers the estimate', () => {
    const good = calculateEstimate({ service: 'sealing', sqft: 600, condition: 'good' }, cfg);
    const faded = calculateEstimate({ service: 'sealing', sqft: 600, condition: 'faded' }, cfg);
    const heavy = calculateEstimate({ service: 'sealing', sqft: 600, condition: 'heavy' }, cfg);
    expect(faded.low).toBeGreaterThan(good.low);
    expect(heavy.low).toBeGreaterThan(faded.low);
  });
});

describe('calculateEstimate — minimum job price floor', () => {
  it('floors a tiny job at the service minimum', () => {
    // pressure washing $0.35–$0.75 × 100 = $35–$75, floored to the $150 minimum
    const r = calculateEstimate({ service: 'pressureWashing', sqft: 100, condition: 'good' }, cfg);
    expect(r.low).toBe(150);
    expect(r.high).toBe(150);
    expect(r.atMinimum).toBe(true);
  });

  it('does not floor a job that already clears the minimum', () => {
    const r = calculateEstimate({ service: 'sealing', sqft: 600, condition: 'good' }, cfg);
    expect(r.low).toBeGreaterThan(cfg.pricing.sealing.minPrice);
    expect(r.atMinimum).toBe(false);
  });

  it('keeps low ≤ high even when the floor bites the low end only', () => {
    // sealing 400 sqft good: low 1.5×400=600 (>500), high 2.5×400=1000 — both clear.
    // Now force a partial floor: pressure washing 300 sqft good = $105–$225 -> low floored to 150.
    const r = calculateEstimate({ service: 'pressureWashing', sqft: 300, condition: 'good' }, cfg);
    expect(r.low).toBe(150); // 105 floored up to 150
    expect(r.high).toBe(225); // clears the floor
    expect(r.low).toBeLessThanOrEqual(r.high);
    expect(r.atMinimum).toBe(false);
  });
});

describe('calculateEstimate — custom square footage', () => {
  it('computes on an arbitrary custom sqft value', () => {
    const r = calculateEstimate({ service: 'sealing', sqft: 1234, condition: 'good' }, cfg);
    expect(r.low).toBe(1851); // 1.5×1234
    expect(r.high).toBe(3085); // 2.5×1234
  });

  it('rounds to whole dollars', () => {
    const r = calculateEstimate({ service: 'pressureWashing', sqft: 777, condition: 'faded' }, cfg);
    expect(Number.isInteger(r.low)).toBe(true);
    expect(Number.isInteger(r.high)).toBe(true);
  });
});

describe('calculateEstimate — guards', () => {
  it('throws on an unknown service', () => {
    expect(() => calculateEstimate({ service: 'nope', sqft: 600, condition: 'good' }, cfg)).toThrow();
  });

  it('throws on non-positive or non-numeric sqft', () => {
    expect(() => calculateEstimate({ service: 'sealing', sqft: 0, condition: 'good' }, cfg)).toThrow();
    expect(() => calculateEstimate({ service: 'sealing', sqft: -5, condition: 'good' }, cfg)).toThrow();
    expect(() => calculateEstimate({ service: 'sealing', sqft: NaN, condition: 'good' }, cfg)).toThrow();
  });

  it('defaults to a 1.0 multiplier for an unknown condition', () => {
    const r = calculateEstimate({ service: 'sealing', sqft: 600, condition: 'bogus' }, cfg);
    expect(r.low).toBe(900);
    expect(r.high).toBe(1500);
  });
});

describe('formatUSD', () => {
  it('formats whole dollars with thousands separators and no cents', () => {
    expect(formatUSD(1035)).toBe('$1,035');
    expect(formatUSD(900)).toBe('$900');
    expect(formatUSD(9600)).toBe('$9,600');
  });
});
