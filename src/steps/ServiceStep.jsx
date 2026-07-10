import OptionCard from '../components/OptionCard.jsx';

// Step 1 — pick a service. Selecting a card advances immediately.
export default function ServiceStep({ config, value, onSelect }) {
  return (
    <div className="pest-step">
      <h2 className="pest-title">{config.headline}</h2>
      <p className="pest-subtitle">{config.subhead}</p>
      <div className="pest-options">
        {config.services.map((s) => (
          <OptionCard
            key={s.id}
            icon={s.icon}
            label={s.label}
            desc={s.desc}
            selected={value === s.id}
            onClick={() => onSelect(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
