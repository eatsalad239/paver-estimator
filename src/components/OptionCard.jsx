// A single selectable card (used for service / area / condition choices).
export default function OptionCard({ icon, label, desc, hint, selected, onClick }) {
  return (
    <button
      type="button"
      className={`pest-option${selected ? ' is-selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {icon ? (
        <span className="pest-option-icon" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="pest-option-body">
        <span className="pest-option-label">{label}</span>
        {desc ? <span className="pest-option-desc" style={{ display: 'block' }}>{desc}</span> : null}
      </span>
      {hint ? <span className="pest-option-hint">{hint}</span> : null}
    </button>
  );
}
