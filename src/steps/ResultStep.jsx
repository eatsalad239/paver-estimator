import EstimateRange from '../components/EstimateRange.jsx';
import BeforeAfter from '../components/BeforeAfter.jsx';
import { normalizePhone } from '../validation.js';

// Final screen — the estimate reveal (only reached after a valid submit).
export default function ResultStep({
  config,
  service,
  areaLabel,
  sqft,
  conditionLabel,
  estimate,
  requiresConsult,
  photoUrl,
  onRestart,
}) {
  const svc = config.services.find((s) => s.id === service);
  const serviceLabel = svc?.label ?? service;
  const previewType = svc?.preview || 'none';
  const filter = config.previewFilters?.[previewType]; // undefined for 'consult'/'none'
  const telHref = `tel:+1${normalizePhone(config.phone)}`;

  return (
    <div className="pest-step">
      {/* Photo preview reward: show the before/after (or the consult photo). */}
      {photoUrl && filter && (
        <BeforeAfter src={photoUrl} filter={filter.css} sheen={filter.sheen} afterLabel={filter.afterLabel} />
      )}
      {photoUrl && !filter && (
        <img className="pest-ba-img pest-result-photo" src={photoUrl} alt="Your pavers" draggable="false" />
      )}

      <p className="pest-result-lead">Your estimated price for {serviceLabel.toLowerCase()}:</p>

      <EstimateRange low={estimate.low} high={estimate.high} atMinimum={estimate.atMinimum} />

      <div className="pest-summary">
        <div className="pest-summary-row">
          <span className="pest-summary-key">Service</span>
          <span className="pest-summary-val">{serviceLabel}</span>
        </div>
        <div className="pest-summary-row">
          <span className="pest-summary-key">Area</span>
          <span className="pest-summary-val">
            {areaLabel} ({sqft.toLocaleString()} sq ft)
          </span>
        </div>
        <div className="pest-summary-row">
          <span className="pest-summary-key">Condition</span>
          <span className="pest-summary-val">{conditionLabel}</span>
        </div>
      </div>

      {/* Install requires an on-site design consult; everything else can confirm by photo. */}
      <div className={`pest-closing${requiresConsult ? ' pest-consult' : ''}`}>
        {requiresConsult ? config.consultLine : config.closingLine}
      </div>

      <a className="pest-cta-call" href={telHref}>
        📞 Call {config.phone}
      </a>
      <button type="button" className="pest-restart" onClick={onRestart}>
        Start over
      </button>
    </div>
  );
}
