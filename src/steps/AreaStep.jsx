import { useState } from 'react';
import OptionCard from '../components/OptionCard.jsx';

// Step 2 — pick an area preset, or enter custom square footage.
// Presets advance immediately; "custom" reveals a validated number input + Continue.
export default function AreaStep({ config, value, customSqft, onSelect, onCustomContinue, onBack }) {
  const isCustom = value === 'custom';
  const [sqft, setSqft] = useState(customSqft ?? '');
  const [touched, setTouched] = useState(false);

  const { min, max } = config.customSqft;
  const n = Number(sqft);
  const valid = Number.isFinite(n) && n >= min && n <= max;

  return (
    <div className="pest-step">
      <h2 className="pest-title">How big is the area?</h2>
      <p className="pest-subtitle">Pick the closest match — you can fine-tune later.</p>

      <div className="pest-options">
        {config.areas.map((a) => (
          <OptionCard
            key={a.id}
            label={a.label}
            hint={a.hint}
            selected={value === a.id}
            onClick={() => onSelect(a.id)}
          />
        ))}
      </div>

      {isCustom && (
        <div className="pest-field">
          <label className="pest-label" htmlFor="pest-sqft">
            Approximate square footage
          </label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input
              id="pest-sqft"
              className={`pest-input${touched && !valid ? ' is-invalid' : ''}`}
              type="number"
              inputMode="numeric"
              min={min}
              max={max}
              placeholder={`e.g. ${config.customSqft.default}`}
              value={sqft}
              onChange={(e) => setSqft(e.target.value)}
              onBlur={() => setTouched(true)}
            />
            <span className="pest-suffix">sq ft</span>
          </div>
          {touched && !valid && (
            <div className="pest-input-error">
              Enter a value between {min.toLocaleString()} and {max.toLocaleString()} sq ft.
            </div>
          )}
        </div>
      )}

      <div className="pest-actions">
        <button type="button" className="pest-btn pest-btn-ghost" onClick={onBack}>
          ← Back
        </button>
        {isCustom && (
          <button
            type="button"
            className="pest-btn pest-btn-primary"
            disabled={!valid}
            onClick={() => onCustomContinue(n)}
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}
