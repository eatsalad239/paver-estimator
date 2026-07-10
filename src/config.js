// =============================================================================
// PAVER INSTANT ESTIMATE — CONFIGURATION (single source of truth)
// =============================================================================
// Everything a client would want to change lives here. Every value below can
// ALSO be overridden at runtime per-site via `window.PAVER_ESTIMATOR_CONFIG`,
// so ONE built bundle can serve many clients. See resolveConfig() at the bottom.
//
//   <script>
//     window.PAVER_ESTIMATOR_CONFIG = {
//       businessName: "Mike's Paver Sealing",
//       phone: "(239) 555-0142",
//       colors: { primary: "#0b5d3b", accent: "#f4a300" },
//       webhookUrl: "https://services.leadconnectorhq.com/hooks/XXXX/webhook-trigger/YYYY",
//       // ...override only what you need; anything omitted falls back to defaults below
//     };
//   </script>
//   <div id="paver-estimator"></div>
//   <script src="https://eatsalad239.github.io/paver-estimator/paver-estimator.js"></script>
// =============================================================================

export const defaultConfig = {
  // --- Brand / contact -------------------------------------------------------
  businessName: 'SWFL Paver Pros',
  phone: '(239) 555-0142', // shown on the result screen; use the client's real number
  logoUrl: '', // optional; e.g. 'https://.../logo.png'. Empty string hides the logo.

  // Brand colors (applied via CSS custom properties, so they theme the whole widget)
  colors: {
    primary: '#0b5d3b', // buttons, progress, accents (a paver-green by default)
    accent: '#f4a300', // the big estimate numbers / highlights
    text: '#1a2b22', // body text
    muted: '#5b6b63', // secondary text
    bg: '#ffffff', // widget background
    card: '#f5f7f5', // option-card background
    border: '#dfe6e1', // hairline borders
  },

  // --- Lead capture ----------------------------------------------------------
  // Paste a GoHighLevel INBOUND webhook URL here (see README "Getting the GHL
  // webhook URL"). Leave as '' to log the lead payload to the console instead.
  webhookUrl: '',
  // Browser -> GHL POSTs use no-cors + text/plain by default. This avoids a
  // CORS preflight that GHL inbound webhooks don't answer, so the lead reliably
  // reaches GHL (which parses the JSON body fine). Advanced users can switch to
  // { mode: 'cors', contentType: 'application/json' } if their endpoint supports it.
  webhook: { mode: 'no-cors', contentType: 'text/plain' },

  // Optional links appended to the SMS-consent disclosure. Recommended for
  // A2P/10DLC campaign registration (carriers often require linked SMS Terms +
  // Privacy Policy). Leave empty to omit the links.
  termsUrl: '', // e.g. 'https://yoursite.com/sms-terms'
  privacyUrl: '', // e.g. 'https://yoursite.com/privacy'

  // ---------------------------------------------------------------------------
  //  ██  PRICING — REPLACE WITH MIKE'S REAL NUMBERS  ██
  //  These are PLACEHOLDERS only. Rates are $ per square foot (min/max spread),
  //  plus a minimum job price floor per service.
  // ---------------------------------------------------------------------------
  pricing: {
    // Paver sealing: $1.50–$2.50 / sqft, never less than $500 for a job.
    sealing: { min: 1.5, max: 2.5, minPrice: 500 }, // « REPLACE
    // Pressure washing: $0.35–$0.75 / sqft, $150 minimum.
    pressureWashing: { min: 0.35, max: 0.75, minPrice: 150 }, // « REPLACE
    // Paver installation: $8–$12 / sqft, $2,500 minimum (design consult required).
    install: { min: 8, max: 12, minPrice: 2500 }, // « REPLACE
  },

  // Condition multipliers — worse condition = more prep/material = higher price.
  conditionMultipliers: {
    good: 1.0,
    faded: 1.15,
    heavy: 1.35,
  },

  // Bounds for the "custom square footage" input.
  customSqft: { min: 100, max: 20000, default: 600 },

  // --- Options shown in the wizard ------------------------------------------
  // `id` values here are the keys used in `pricing` above.
  services: [
    { id: 'sealing', label: 'Paver Sealing', desc: 'Protect & enrich the color of your pavers', icon: '🛡️' },
    { id: 'pressureWashing', label: 'Pressure Washing', desc: 'Deep-clean and lift mold, dirt & stains', icon: '💦' },
    { id: 'install', label: 'Paver Installation', desc: 'New paver design & installation', icon: '🧱', requiresConsult: true },
  ],

  // Area presets (sqft). The `custom` entry (sqft: null) reveals the number input.
  areas: [
    { id: 'driveway2', label: '2-Car Driveway', hint: '~600 sq ft', sqft: 600 },
    { id: 'drivewayLarge', label: 'Large Driveway', hint: '~1,000 sq ft', sqft: 1000 },
    { id: 'poolDeck', label: 'Pool Deck', hint: '~800 sq ft', sqft: 800 },
    { id: 'lanai', label: 'Lanai', hint: '~400 sq ft', sqft: 400 },
    { id: 'custom', label: 'Custom size', hint: 'Enter your square footage', sqft: null },
  ],

  // Condition options. `multiplierKey` maps into conditionMultipliers above.
  conditions: [
    { id: 'good', label: 'Good', desc: 'Clean, just needs a refresh', multiplierKey: 'good' },
    { id: 'faded', label: 'Faded / dull', desc: 'Color has washed out', multiplierKey: 'faded' },
    { id: 'heavy', label: 'Heavy mold & stains', desc: 'Lots of buildup or discoloration', multiplierKey: 'heavy' },
  ],

  // --- Copy on the result screen --------------------------------------------
  closingLine: 'Text us photos of your pavers to confirm your exact price — no site visit needed.',
  consultLine: 'For a new installation, a quick on-site design consult is required to finalize your exact price.',

  // Headline / subhead on step 1
  headline: 'Get your instant paver estimate',
  subhead: 'Answer 3 quick questions — takes about 20 seconds.',
};

// -----------------------------------------------------------------------------
// Merge helpers
// -----------------------------------------------------------------------------
function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Deep-merge overrides onto a base. Nested plain objects merge recursively;
// arrays and primitives replace wholesale (so a client can supply their own
// full `services`/`areas` lists, or tweak just `colors.primary`).
function deepMerge(base, override) {
  if (!isPlainObject(override)) return override === undefined ? base : override;
  const out = Array.isArray(base) ? [...base] : { ...base };
  for (const key of Object.keys(override)) {
    const b = out[key];
    const o = override[key];
    out[key] = isPlainObject(b) && isPlainObject(o) ? deepMerge(b, o) : o;
  }
  return out;
}

// Produce the effective config: defaults deep-merged with per-site overrides.
export function resolveConfig(overrides) {
  return deepMerge(defaultConfig, overrides || {});
}
