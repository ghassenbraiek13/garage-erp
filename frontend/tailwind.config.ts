import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

const config: Config = {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'sans-serif',
        ],
      },
      fontSize: {
        'fluid-h1': 'clamp(1.25rem, 2.5vw, 2rem)',
        'fluid-body': 'clamp(0.8125rem, 1.5vw, 1rem)',
      },
      colors: {
        page: 'var(--bg-page)',
        surface: 'var(--bg-surface)',
        sidebar: 'var(--bg-sidebar)',
        border: 'var(--border)',
        clay: {
          primary: 'var(--accent-primary)',
          hover: 'var(--accent-hover)',
          green: 'var(--accent-green)',
          orange: 'var(--accent-orange)',
          red: 'var(--accent-red)',
          purple: 'var(--accent-purple)',
        },
        ink: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
      },
      boxShadow: {
        clay: 'var(--shadow-clay)',
        'clay-lg':
          '0 12px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.55)',
        'clay-hover':
          '0 11px 45px rgba(37,99,235,0.11), 0 3px 11px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.65)',
        'clay-dark-hover':
          '0 11px 45px rgba(0,0,0,0.55), 0 3px 11px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backdropBlur: {
        clay: '20px',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', opacity: '0.7' },
          '70%': { transform: 'scale(1.35)', opacity: '0' },
          '100%': { opacity: '0' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
}

export default config
