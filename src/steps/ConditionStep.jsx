import OptionCard from '../components/OptionCard.jsx';

// Step 3 — current condition of the pavers. Selecting advances immediately.
export default function ConditionStep({ config, value, onSelect, onBack }) {
  return (
    <div className="pest-step">
      <h2 className="pest-title">What condition are they in?</h2>
      <p className="pest-subtitle">This helps us gauge prep work and materials.</p>

      <div className="pest-options">
        {config.conditions.map((c) => (
          <OptionCard
            key={c.id}
            label={c.label}
            desc={c.desc}
            selected={value === c.id}
            onClick={() => onSelect(c.id)}
          />
        ))}
      </div>

      <div className="pest-actions">
        <button type="button" className="pest-btn pest-btn-ghost" onClick={onBack}>
          ← Back
        </button>
      </div>
    </div>
  );
}
