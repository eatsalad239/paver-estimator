import { formatUSD } from '../pricing.js';

// Always renders a RANGE with big bold numbers — never a single price.
// When the whole job prices out at the minimum floor, we show a clearly-labeled
// "minimum job" figure instead of a misleading "$500 – $500".
export default function EstimateRange({ low, high, atMinimum }) {
  if (atMinimum || low === high) {
    return (
      <div>
        <div className="pest-range-min">{formatUSD(low)}</div>
        <div className="pest-range-caption">minimum job price</div>
      </div>
    );
  }
  return (
    <div>
      <div className="pest-range" role="text" aria-label={`Estimated range ${formatUSD(low)} to ${formatUSD(high)}`}>
        <span className="pest-range-num">{formatUSD(low)}</span>
        <span className="pest-range-dash">–</span>
        <span className="pest-range-num">{formatUSD(high)}</span>
      </div>
      <div className="pest-range-caption">estimated range</div>
    </div>
  );
}
