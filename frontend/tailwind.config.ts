import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: 'var(--inova-base)',
        panel: 'var(--inova-panel)',
        void: 'var(--inova-void)',
        line: 'var(--inova-line)',
        flame: {
          DEFAULT: 'var(--inova-flame)',
          ember: 'var(--inova-ember)',
          rust: 'var(--inova-rust)',
        },
        bone: 'var(--inova-bone)',
        smoke: 'var(--inova-smoke)',
        faint: 'var(--inova-faint)',
        mist: 'var(--inova-mist)',
        ok: 'var(--inova-ok)',
        warn: 'var(--inova-warn)',
        bad: 'var(--inova-bad)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        elevated: 'var(--shadow-elevated)',
      },
    },
  },
  plugins: [],
};

export default config;
