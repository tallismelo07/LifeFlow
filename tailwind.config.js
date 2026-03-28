/** @type {import('tailwindcss').Config} */
export default {
  content:  ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans:    ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        // ── Dark palette (Slate-based professional dark) ──────────────────
        slate: {
          950: '#0B1120',
          900: '#0f172a',
          850: '#131f35',
          800: '#1e293b',
          750: '#243044',
          700: '#334155',
          600: '#475569',
          500: '#64748b',
          400: '#94a3b8',
          300: '#cbd5e1',
          200: '#e2e8f0',
          100: '#f1f5f9',
          50:  '#f8fafc',
        },
        // ── Brand colors ──────────────────────────────────────────────────
        brand: {
          blue:       '#3b82f6',  // main action
          'blue-d':   '#2563eb',  // hover
          'blue-l':   '#60a5fa',  // light variant
          amber:      '#f59e0b',  // warning / highlight
          'amber-d':  '#d97706',
          green:      '#22c55e',  // success / done
          'green-d':  '#16a34a',
          red:        '#ef4444',  // danger
          'red-d':    '#dc2626',
          violet:     '#8b5cf6',  // secondary accent
          teal:       '#14b8a6',  // info
        },
      },
      boxShadow: {
        'card':    '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'card-md': '0 4px 6px -1px rgba(0,0,0,0.15), 0 2px 4px -1px rgba(0,0,0,0.08)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.2), 0 4px 6px -2px rgba(0,0,0,0.08)',
        'glow-blue':  '0 0 20px rgba(59,130,246,0.25)',
        'glow-amber': '0 0 20px rgba(245,158,11,0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
