import { useMemo, useState } from 'react';
import './styles.css';

import { calculateEstimate } from './pricing.js';
import { buildLeadPayload, submitLead } from './lead.js';

import ProgressBar from './components/ProgressBar.jsx';
import ServiceStep from './steps/ServiceStep.jsx';
import AreaStep from './steps/AreaStep.jsx';
import ConditionStep from './steps/ConditionStep.jsx';
import PhotoStep from './steps/PhotoStep.jsx';
import ContactStep from './steps/ContactStep.jsx';
import ResultStep from './steps/ResultStep.jsx';

const STEP_LABELS = {
  service: 'Service',
  area: 'Area',
  condition: 'Condition',
  photo: 'Photo',
  contact: 'Contact',
};

const emptyContact = { name: '', phone: '', email: '', smsConsent: false };

export function PaverEstimator({ config }) {
  const photoEnabled = config.photo?.enabled !== false;

  // Ordered wizard steps (photo step is optional/config-gated). Result excluded.
  const stepOrder = useMemo(
    () => (photoEnabled ? ['service', 'area', 'condition', 'photo', 'contact'] : ['service', 'area', 'condition', 'contact']),
    [photoEnabled]
  );

  const [step, setStep] = useState('service');

  const [service, setService] = useState(null);
  const [areaId, setAreaId] = useState(null);
  const [sqft, setSqft] = useState(null);
  const [areaLabel, setAreaLabel] = useState('');
  const [condition, setCondition] = useState(null);
  const [photoUrl, setPhotoUrl] = useState(null);
  const [contact, setContact] = useState(emptyContact);

  const [submitting, setSubmitting] = useState(false);
  const [estimate, setEstimate] = useState(null);

  // Brand colors -> CSS custom properties on the root element.
  const rootStyle = useMemo(
    () => ({
      '--pest-primary': config.colors.primary,
      '--pest-accent': config.colors.accent,
      '--pest-text': config.colors.text,
      '--pest-muted': config.colors.muted,
      '--pest-bg': config.colors.bg,
      '--pest-card': config.colors.card,
      '--pest-border': config.colors.border,
    }),
    [config.colors]
  );

  // ---- navigation handlers ------------------------------------------------
  const handleService = (id) => {
    setService(id);
    setStep('area');
  };

  const handleAreaSelect = (id) => {
    if (id === 'custom') {
      setAreaId('custom'); // reveal the custom input; wait for "Continue"
      return;
    }
    const a = config.areas.find((x) => x.id === id);
    setAreaId(id);
    setSqft(a.sqft);
    setAreaLabel(a.label);
    setStep('condition');
  };

  const handleCustomContinue = (value) => {
    setAreaId('custom');
    setSqft(value);
    // Plain label — ResultStep appends "(N sq ft)" itself, matching the preset convention.
    setAreaLabel('Custom size');
    setStep('condition');
  };

  const handleCondition = (id) => {
    setCondition(id);
    setStep(photoEnabled ? 'photo' : 'contact');
  };

  // Store the new photo object URL and revoke the previous one (avoids leaks
  // without an unmount effect, which StrictMode would double-fire).
  const handlePhoto = (url) => {
    setPhotoUrl((prev) => {
      if (prev && prev !== url) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const handleContactChange = (field, val) => setContact((c) => ({ ...c, [field]: val }));

  const handleSubmit = () => {
    setSubmitting(true);
    try {
      const cond = config.conditions.find((c) => c.id === condition);
      const est = calculateEstimate({ service, sqft, condition: cond.multiplierKey }, config);
      setEstimate(est);

      // Fire-and-forget lead delivery — never blocks the reveal, never throws.
      const payload = buildLeadPayload({
        contact,
        service,
        areaLabel,
        sqft,
        condition,
        estimate: est,
        photoProvided: Boolean(photoUrl),
      });
      submitLead(payload, config);

      setStep('result');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestart = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setService(null);
    setAreaId(null);
    setSqft(null);
    setAreaLabel('');
    setCondition(null);
    setPhotoUrl(null);
    setContact(emptyContact);
    setEstimate(null);
    setStep('service');
  };

  // ---- derived ------------------------------------------------------------
  const requiresConsult = !!config.services.find((s) => s.id === service)?.requiresConsult;
  const conditionLabel = config.conditions.find((c) => c.id === condition)?.label ?? '';
  const stepIndex = stepOrder.indexOf(step);

  return (
    <div className="pest-root" style={rootStyle}>
      <header className="pest-header">
        {config.logoUrl ? (
          <img className="pest-logo" src={config.logoUrl} alt={config.businessName} />
        ) : (
          <span className="pest-brandname">{config.businessName}</span>
        )}
      </header>

      {step !== 'result' && (
        <ProgressBar step={stepIndex + 1} total={stepOrder.length} label={STEP_LABELS[step]} />
      )}

      {step === 'service' && <ServiceStep config={config} value={service} onSelect={handleService} />}

      {step === 'area' && (
        <AreaStep
          config={config}
          value={areaId}
          customSqft={sqft}
          onSelect={handleAreaSelect}
          onCustomContinue={handleCustomContinue}
          onBack={() => setStep('service')}
        />
      )}

      {step === 'condition' && (
        <ConditionStep
          config={config}
          value={condition}
          onSelect={handleCondition}
          onBack={() => setStep('area')}
        />
      )}

      {step === 'photo' && (
        <PhotoStep
          config={config}
          service={service}
          photoUrl={photoUrl}
          onPhoto={handlePhoto}
          onContinue={() => setStep('contact')}
          onBack={() => setStep('condition')}
        />
      )}

      {step === 'contact' && (
        <ContactStep
          config={config}
          value={contact}
          onChange={handleContactChange}
          onSubmit={handleSubmit}
          onBack={() => setStep(photoEnabled ? 'photo' : 'condition')}
          submitting={submitting}
        />
      )}

      {step === 'result' && estimate && (
        <ResultStep
          config={config}
          service={service}
          areaLabel={areaLabel}
          sqft={sqft}
          conditionLabel={conditionLabel}
          estimate={estimate}
          requiresConsult={requiresConsult}
          photoUrl={photoUrl}
          onRestart={handleRestart}
        />
      )}

      <div className="pest-footer">
        This is a preliminary estimate, not a final quote. {config.businessName}
      </div>
    </div>
  );
}

export default PaverEstimator;
