# Paver Instant Estimate Widget

A mobile-first, multi-step **instant-estimate lead-capture widget** for paver
companies (sealing, pressure washing, installation). A visitor picks a service →
area → condition → enters contact info, and the estimate range is revealed only
**after** they submit — capturing the lead in the process.

Built with **React + Vite**. Ships as a **single self-contained `<script>`** you
can drop onto any site (GoHighLevel, WordPress, plain HTML, …). Hosts itself free
on **GitHub Pages**.

- 🔗 **Live demo:** `https://eatsalad239.github.io/paver-estimator/`
- 📦 **Embed bundle:** `https://eatsalad239.github.io/paver-estimator/paver-estimator.js`

---

## Embed snippet (what you paste on a client site)

```html
<div id="paver-estimator"></div>
<script src="https://eatsalad239.github.io/paver-estimator/paver-estimator.js"></script>
```

That's the whole thing. The script finds the `<div>`, mounts the widget, inlines
its own CSS (no stylesheet to add), and scopes every style so it won't collide
with the host page. Works inside iframes and GoHighLevel custom-code elements.

### Per-site overrides (optional)

One bundle can serve many clients. Set `window.PAVER_ESTIMATOR_CONFIG` **before**
the script tag to override any config value (business name, phone, colors,
webhook, pricing, copy — see [`src/config.js`](src/config.js)):

```html
<script>
  window.PAVER_ESTIMATOR_CONFIG = {
    businessName: "Mike's Paver Sealing",
    phone: "(239) 555-0142",
    logoUrl: "https://yoursite.com/logo.png",
    colors: { primary: "#0b5d3b", accent: "#f4a300" },
    webhookUrl: "https://services.leadconnectorhq.com/hooks/XXXX/webhook-trigger/YYYY",
    termsUrl: "https://yoursite.com/sms-terms",   // optional — linked in the consent copy
    privacyUrl: "https://yoursite.com/privacy"     // optional — linked in the consent copy
  };
</script>
<div id="paver-estimator"></div>
<script src="https://eatsalad239.github.io/paver-estimator/paver-estimator.js"></script>
```

Anything you omit falls back to the defaults in `src/config.js`.

---

## Local development

Requires Node 18+ (developed on Node 24).

```bash
npm install      # install dependencies
npm run dev      # local dev server with a demo host page  → http://localhost:5173
npm test         # run the unit + integration tests (vitest)
npm run build    # produce dist/paver-estimator.js (+ demo index.html)
npm run preview  # serve the built dist/ exactly as GitHub Pages will → http://localhost:4173
```

- **`npm run dev`** renders the widget on a demo page (`src/demo.jsx`). Leads are
  logged to the browser console (no webhook needed in dev).
- **`npm run preview`** serves the *real* built bundle via
  [`demo/pages.html`](demo/pages.html) — the exact embed a client would use.

### Project structure

```
src/
  config.js        ★ single source of truth: pricing, brand, webhook, copy, options
  pricing.js         pure estimate calculator (unit-tested)
  validation.js      US phone + email + consent validators
  lead.js            fire-and-forget webhook POST (graceful failure)
  widget.jsx         <PaverEstimator/> — the multi-step state machine
  mount.jsx        ★ IIFE entry: auto-mounts onto #paver-estimator, reads overrides
  demo.jsx           dev-only entry
  styles.css         namespaced (.pest-*) styles, brand via CSS variables
  components/        ProgressBar, OptionCard, EstimateRange
  steps/             ServiceStep, AreaStep, ConditionStep, ContactStep, ResultStep
  *.test.js(x)       vitest tests
.github/workflows/deploy.yml   builds + deploys to GitHub Pages on push to main
demo/pages.html                built → dist/index.html (loads the real bundle)
scripts/copy-demo.mjs          copies the demo page + .nojekyll into dist/
```

---

## Changing the pricing (Mike's real numbers)

All pricing lives in **[`src/config.js`](src/config.js)** under `pricing` and
`conditionMultipliers`. The current values are **placeholders** — replace them:

```js
pricing: {
  //          $/sqft min   $/sqft max   minimum job price
  sealing:         { min: 1.5,  max: 2.5,  minPrice: 500 },   // « replace
  pressureWashing: { min: 0.35, max: 0.75, minPrice: 150 },   // « replace
  install:         { min: 8,    max: 12,   minPrice: 2500 },  // « replace
},

conditionMultipliers: {
  good:  1.0,    // clean, just needs a refresh
  faded: 1.15,   // washed-out color
  heavy: 1.35,   // heavy mold / stains → more prep
},
```

**How the estimate is computed:**

```
low  = round(minRate × sqft × conditionMultiplier), floored at minPrice
high = round(maxRate × sqft × conditionMultiplier), floored at minPrice (and ≥ low)
```

The area presets (sqft) and the custom-input bounds are also in `config.js`
(`areas`, `customSqft`). After editing, run `npm test` — the pricing tests assert
the floor, the multipliers, and custom sqft.

> You can change pricing **without editing code** on a per-site basis by putting
> a `pricing` object in `window.PAVER_ESTIMATOR_CONFIG`. Editing `config.js` +
> rebuilding changes the default for *every* site.

---

## Lead capture — getting your GoHighLevel webhook URL

On submit, the widget POSTs this JSON to `webhookUrl`:

```json
{
  "name": "Jane Doe",
  "phone": "2395550142",
  "email": "jane@example.com",
  "smsConsent": true,
  "service": "sealing",
  "areaLabel": "2-Car Driveway",
  "sqft": 600,
  "condition": "faded",
  "estimateLow": 1035,
  "estimateHigh": 1725,
  "source": "paver-estimator",
  "timestamp": "2026-07-09T18:20:00.000Z"
}
```

Delivery is **fire-and-forget**: if the webhook fails the visitor still sees their
estimate (the error is logged). If `webhookUrl` is empty, the payload is logged to
the browser console instead.

### Get the GHL inbound webhook URL

1. In GoHighLevel, open **Automation → Workflows → Create Workflow**.
2. Add the trigger **"Inbound Webhook"**. GHL shows a **webhook URL** — copy it.
   It looks like `https://services.leadconnectorhq.com/hooks/<id>/webhook-trigger/<id>`.
3. Paste it into either:
   - `window.PAVER_ESTIMATOR_CONFIG.webhookUrl` on the client page (recommended —
     no rebuild), **or**
   - `webhookUrl` in `src/config.js` (changes the default for all sites), then rebuild.
4. Back in the workflow, add actions: **Create/Update Contact** (map `name`,
   `phone`, `email`), then Notifications / SMS / pipeline steps as you like. Use
   **Run Test** in GHL, submit the widget once, and map the captured fields.

> **Why the POST uses `text/plain` + `no-cors`:** GHL inbound webhooks don't
> answer CORS preflight requests, so a normal `application/json` POST from a
> browser would be blocked. Sending a `text/plain` body (still valid JSON, which
> GHL parses fine) avoids the preflight and reliably delivers the lead. Change
> `webhook: { mode, contentType }` in `config.js` if your endpoint supports CORS.

### SMS consent (TCPA)

The visitor can't submit — and the estimate stays hidden — until name, phone,
and email validate **and** the SMS-consent box is checked. Attempting to submit
early surfaces inline field errors and a consent prompt (the button stays
clickable so the errors are reachable). The label is TCPA-style, including a
message-frequency disclosure, "not a condition of purchase," "Msg & data rates
may apply," and STOP/HELP.

For A2P/10DLC campaign registration, set `termsUrl` and `privacyUrl` in the
config (or `window.PAVER_ESTIMATOR_CONFIG`) to append linked **SMS Terms** and
**Privacy Policy** to the disclosure. Keep consent language compliant for your
jurisdiction and carrier requirements.

---

## Deployment — GitHub Pages (zero extra hosting)

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) builds and deploys
`dist/` to GitHub Pages on every push to `main`:

1. Push to `main` (or run the workflow manually from the **Actions** tab).
2. The workflow runs `npm ci` → `npm test` → `npm run build`, then publishes `dist/`.
3. Your bundle is live at:

   ```
   https://<user>.github.io/<repo>/paver-estimator.js
   https://<user>.github.io/<repo>/            ← demo page
   ```

   For this repo: `https://eatsalad239.github.io/paver-estimator/paver-estimator.js`

The workflow enables Pages automatically (`configure-pages` with
`enablement: true`) — no manual repo setting needed on first run. If your org
restricts that, set **Settings → Pages → Source: GitHub Actions** once.

---

## Deployment modes at a glance

| Mode | Command | Output |
|------|---------|--------|
| Local dev | `npm run dev` | Demo page with live-reloading widget |
| Embeddable bundle | `npm run build` | `dist/paver-estimator.js` (single IIFE, CSS inlined) |
| GitHub Pages | push to `main` | Bundle + demo auto-deployed via Actions |

---

## Tests

```bash
npm test
```

- `src/pricing.test.js` — min-price floor, condition multipliers, custom sqft, rounding, guards.
- `src/validation.test.js` — US phone formats, email, name, the submit/consent gate.
- `src/widget.test.jsx` — full wizard flow, estimate reveal, install consult line,
  webhook payload, graceful webhook failure, minimum-job display.

---

## License

MIT — see [LICENSE](LICENSE).
