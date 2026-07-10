// IIFE entry point (the built dist/paver-estimator.js).
//
// On load it finds <div id="paver-estimator">, reads optional per-site overrides
// from window.PAVER_ESTIMATOR_CONFIG, and mounts the widget. Also exposes
// window.PaverEstimator.mount(el?, overrides?) for manual/SPAs.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { PaverEstimator } from './widget.jsx';
import { resolveConfig } from './config.js';

const DEFAULT_TARGET_ID = 'paver-estimator';

export function mount(target, overrides) {
  const el =
    typeof target === 'string'
      ? document.getElementById(target)
      : target || document.getElementById(DEFAULT_TARGET_ID);

  if (!el) {
    console.error(
      `[paver-estimator] Mount target not found. Add <div id="${DEFAULT_TARGET_ID}"></div> to the page.`
    );
    return null;
  }

  // Idempotent: don't double-mount if the script is included twice.
  if (el.getAttribute('data-pest-mounted') === 'true') return null;
  el.setAttribute('data-pest-mounted', 'true');

  const config = resolveConfig(overrides || window.PAVER_ESTIMATOR_CONFIG);
  const root = createRoot(el);
  root.render(
    <StrictMode>
      <PaverEstimator config={config} />
    </StrictMode>
  );
  return root;
}

// Auto-mount onto #paver-estimator when the DOM is ready.
function autoMount() {
  mount();
}
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoMount);
  } else {
    autoMount();
  }
  // Expose for manual control (e.g. SPA route changes).
  window.PaverEstimator = { mount };
}
