// Runs after `vite build`. The lib build produces dist/paver-estimator.js only.
// GitHub Pages also needs a landing page (dist/index.html) that loads that bundle,
// plus a .nojekyll marker so Pages serves the files verbatim.
import { copyFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

if (!existsSync(dist)) mkdirSync(dist, { recursive: true });

// demo/pages.html is a realistic host page that embeds the REAL built bundle via
// <script src="./paver-estimator.js"></script> — the exact snippet clients paste.
copyFileSync(resolve(root, 'demo', 'pages.html'), resolve(dist, 'index.html'));

// Disable Jekyll processing on GitHub Pages.
writeFileSync(resolve(dist, '.nojekyll'), '');

console.log('[copy-demo] wrote dist/index.html and dist/.nojekyll');
