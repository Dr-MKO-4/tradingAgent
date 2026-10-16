// src/lib/mode.js : demo mode (no backend). Enabled at build time with VITE_DEMO=true
// or `vite build --mode demo`. In demo mode the app never calls /api.
export const IS_DEMO = import.meta.env.VITE_DEMO === 'true' || import.meta.env.MODE === 'demo';
