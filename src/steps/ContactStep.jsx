import { useState } from 'react';
import { isValidName, isValidUSPhone, isValidEmail, isContactValid } from '../validation.js';

// Step 4 — the contact GATE. The estimate is only revealed after a valid submit.
// The submit button stays clickable (so an incomplete attempt SURFACES the errors),
// but submit() only advances when everything validates AND SMS consent is checked.
export default function ContactStep({ config, value, onChange, onSubmit, onBack, submitting }) {
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  const c = value;

  const errors = {
    name: !isValidName(c.name) ? 'Please enter your name.' : '',
    phone: !isValidUSPhone(c.phone) ? 'Enter a valid US phone number.' : '',
    email: !isValidEmail(c.email) ? 'Enter a valid email address.' : '',
  };
  const consentMissing = !c.smsConsent;
  const canSubmit = isContactValid(c) && !submitting;
  const hasLegalLinks = Boolean(config.termsUrl || config.privacyUrl);

  const markTouched = (name) => setTouched((t) => ({ ...t, [name]: true }));

  const field = (name, props) => {
    const showErr = (touched[name] || attempted) && Boolean(errors[name]);
    const errId = `pest-${name}-error`;
    return (
      <div className="pest-field">
        <label className="pest-label" htmlFor={`pest-${name}`}>
          {props.label}
        </label>
        <input
          id={`pest-${name}`}
          className={`pest-input${showErr ? ' is-invalid' : ''}`}
          value={c[name]}
          onChange={(e) => onChange(name, e.target.value)}
          onBlur={() => markTouched(name)}
          aria-invalid={showErr || undefined}
          aria-describedby={showErr ? errId : undefined}
          {...props.input}
        />
        {showErr && (
          <div id={errId} className="pest-input-error" role="alert">
            {errors[name]}
          </div>
        )}
      </div>
    );
  };

  const submit = (e) => {
    e.preventDefault();
    setAttempted(true);
    setTouched({ name: true, phone: true, email: true });
    if (canSubmit) onSubmit(); // guard: only advance when fully valid + consented
  };

  return (
    <div className="pest-step">
      <h2 className="pest-title">Where should we send your estimate?</h2>
      <p className="pest-subtitle">See your price range on the next screen.</p>

      <form onSubmit={submit} noValidate>
        {field('name', { label: 'Full name', input: { type: 'text', autoComplete: 'name', placeholder: 'Jane Doe' } })}
        {field('phone', {
          label: 'Mobile phone',
          input: { type: 'tel', inputMode: 'tel', autoComplete: 'tel', placeholder: '(239) 555-0142' },
        })}
        {field('email', {
          label: 'Email',
          input: { type: 'email', inputMode: 'email', autoComplete: 'email', placeholder: 'you@email.com' },
        })}

        <label className="pest-consent">
          <input
            type="checkbox"
            checked={c.smsConsent}
            onChange={(e) => onChange('smsConsent', e.target.checked)}
            aria-invalid={(attempted && consentMissing) || undefined}
            aria-describedby={attempted && consentMissing ? 'pest-consent-error' : undefined}
          />
          <span className="pest-consent-text">
            I agree to receive text messages from {config.businessName} about my estimate and related
            offers at the number provided. Message frequency varies. Consent is not a condition of
            purchase. Message &amp; data rates may apply. Reply STOP to opt out, HELP for help.
            {hasLegalLinks && (
              <span>
                {' '}
                See our{' '}
                {config.termsUrl && (
                  <a href={config.termsUrl} target="_blank" rel="noopener noreferrer">
                    Terms
                  </a>
                )}
                {config.termsUrl && config.privacyUrl ? ' and ' : ''}
                {config.privacyUrl && (
                  <a href={config.privacyUrl} target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
                )}
                .
              </span>
            )}
          </span>
        </label>
        {attempted && consentMissing && (
          <div id="pest-consent-error" className="pest-input-error" role="alert">
            Please check the box to agree to receive text messages.
          </div>
        )}

        <div className="pest-actions">
          <button type="button" className="pest-btn pest-btn-ghost" onClick={onBack} disabled={submitting}>
            ← Back
          </button>
          <button type="submit" className="pest-btn pest-btn-primary" disabled={submitting}>
            {submitting ? 'Getting your estimate…' : 'See my estimate'}
          </button>
        </div>
      </form>
    </div>
  );
}
