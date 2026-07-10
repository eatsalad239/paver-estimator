// Dev entry (npm run dev). Renders the widget directly with a demo config so
// you can iterate quickly. The PRODUCTION embed path is exercised by the built
// bundle in demo/pages.html (served by `npm run preview`).
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PaverEstimator } from './widget.jsx';
import { resolveConfig } from './config.js';

const demoOverrides = {
  businessName: 'SWFL Paver Pros (Demo)',
  phone: '(239) 555-0142',
  // webhookUrl left empty on purpose -> leads log to the browser console in dev.
};

const config = resolveConfig(demoOverrides);

createRoot(document.getElementById('paver-estimator')).render(
  <StrictMode>
    <PaverEstimator config={config} />
  </StrictMode>
);
