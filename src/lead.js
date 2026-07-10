// Fire-and-forget lead delivery. Never blocks or breaks the UI: if the webhook
// fails (or isn't configured) the user still sees their estimate.

/**
 * Build the exact JSON payload posted to the CRM / logged to console.
 * Shape is stable — GHL inbound-webhook field mappings depend on these keys.
 */
export function buildLeadPayload({ contact, service, areaLabel, sqft, condition, estimate }, timestamp) {
  return {
    name: contact.name.trim(),
    phone: contact.phone.trim(),
    email: contact.email.trim(),
    smsConsent: contact.smsConsent === true,
    service,
    areaLabel,
    sqft,
    condition,
    estimateLow: estimate.low,
    estimateHigh: estimate.high,
    source: 'paver-estimator',
    timestamp: timestamp || new Date().toISOString(),
  };
}

/**
 * POST the lead to config.webhookUrl. Resolves to a small status object and
 * NEVER throws — callers can ignore the result entirely.
 *
 * If webhookUrl is empty, logs the payload to the console instead (dev mode).
 */
export async function submitLead(payload, config) {
  const url = config?.webhookUrl;

  if (!url) {
    // No endpoint configured — surface the payload so it's not silently lost.
    console.log('[paver-estimator] No webhookUrl configured. Lead payload:', payload);
    return { ok: true, delivered: false, logged: true };
  }

  const mode = config?.webhook?.mode || 'no-cors';
  const contentType = config?.webhook?.contentType || 'text/plain';

  try {
    await fetch(url, {
      method: 'POST',
      mode,
      // text/plain is CORS-safelisted -> no preflight; GHL parses the JSON body fine.
      headers: { 'Content-Type': contentType },
      body: JSON.stringify(payload),
      // Let the request complete even if the page navigates right after submit.
      keepalive: true,
    });
    // NOTE: with mode 'no-cors' the response is opaque; a resolved fetch means
    // the request was dispatched. We treat that as success for lead capture.
    return { ok: true, delivered: true };
  } catch (err) {
    // Graceful failure — log and move on; the estimate still shows.
    console.error('[paver-estimator] Webhook POST failed (estimate still shown):', err);
    return { ok: false, delivered: false, error: err };
  }
}
