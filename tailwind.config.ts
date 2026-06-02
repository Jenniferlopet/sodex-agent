import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: { extend: { boxShadow: { glow: '0 0 40px rgba(255, 106, 0, .18)' } } },
  plugins: []
};
export default config;
