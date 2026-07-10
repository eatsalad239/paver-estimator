import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

// Two behaviors from one config:
//   command === 'serve'  -> npm run dev / npm run preview : serve the demo host page (index.html -> src/demo.jsx)
//   command === 'build'  -> npm run build : emit ONE self-contained IIFE (dist/paver-estimator.js) with CSS inlined.
//
// react + react-dom are bundled IN (not externalized) so the file is a true drop-in <script>.
// vite-plugin-css-injected-by-js takes the CSS Vite would normally emit as a sibling .css file
// and injects it into the JS at runtime — so there is exactly one artifact to host.
export default defineConfig(({ command }) => {
  const plugins = [react(), cssInjectedByJsPlugin()];

  if (command === 'build') {
    return {
      plugins,
      // Ensure React runs in production mode inside arbitrary host pages.
      define: { 'process.env.NODE_ENV': JSON.stringify('production') },
      build: {
        target: 'es2018', // broad support for older mobile browsers (lots of FB-ad traffic)
        cssCodeSplit: false,
        emptyOutDir: true,
        lib: {
          entry: 'src/mount.jsx',
          name: 'PaverEstimator',
          formats: ['iife'],
          fileName: () => 'paver-estimator.js',
        },
      },
    };
  }

  // dev / preview
  return { plugins };
});
