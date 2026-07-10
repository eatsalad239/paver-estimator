// Slim progress indicator: filled track + "Step X of N — <label>".
export default function ProgressBar({ step, total, label }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="pest-progress" aria-hidden="false">
      <div
        className="pest-progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={step}
        aria-label={`Step ${step} of ${total}`}
      >
        <div className="pest-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="pest-progress-label">
        Step {step} of {total}
        {label ? ` — ${label}` : ''}
      </div>
    </div>
  );
}
