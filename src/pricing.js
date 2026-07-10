// Pure estimate calculator — no React, no DOM, fully unit-testable.
//
// estimate = rate ($/sqft) × sqft × conditionMultiplier, floored at the
// service's minimum job price. Returns a LOW/HIGH range (never one number).

/**
 * @param {{service:string, sqft:number, condition:string}} input
 *   - service   : a key of config.pricing (e.g. 'sealing')
 *   - sqft      : square footage (> 0)
 *   - condition : a key of config.conditionMultipliers (e.g. 'faded')
 * @param {object} config  resolved config (see config.js)
 * @returns {{low:number, high:number, atMinimum:boolean}}
 *   low/high are whole-dollar amounts; atMinimum is true when the whole job
 *   prices out at (or below) the minimum floor.
 */
export function calculateEstimate(input, config) {
  const { service, sqft, condition } = input || {};

  const svc = config?.pricing?.[service];
  if (!svc) throw new Error(`calculateEstimate: unknown service "${service}"`);

  const area = Number(sqft);
  if (!Number.isFinite(area) || area <= 0) {
    throw new Error(`calculateEstimate: invalid sqft "${sqft}"`);
  }

  const multiplier = config?.conditionMultipliers?.[condition] ?? 1;
  const minPrice = svc.minPrice ?? 0;

  const rawLow = svc.min * area * multiplier;
  const rawHigh = svc.max * area * multiplier;

  const low = Math.max(Math.round(rawLow), minPrice);
  // high is floored at both the minimum price AND `low` (range never inverts).
  const high = Math.max(Math.round(rawHigh), minPrice, low);

  // The entire job is at the floor when even the top-of-range lands at/under it.
  const atMinimum = Math.round(rawHigh) <= minPrice;

  return { low, high, atMinimum };
}

/** Format a whole-dollar number as US currency with no cents: 1035 -> "$1,035". */
export function formatUSD(n) {
  return '$' + Math.round(n).toLocaleString('en-US');
}
