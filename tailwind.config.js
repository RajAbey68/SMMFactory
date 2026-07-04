/**
 * SMMFactory — Tailwind theme wired to the Notion-Warm design tokens.
 * Canonical values live in src/styles/design-tokens.css (CSS custom
 * properties); this config maps them into Tailwind's theme so utility
 * classes and the token file always agree.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './dashboard/**/*.{html,js}',
    './landing-page/**/*.{html,js}',
    './creative/hook-studio/public/**/*.{html,js}',
    './src/**/*.{html,js,ts}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          page: 'var(--surface-page)',
          card: 'var(--surface-card)',
          alt: 'var(--surface-alt)',
          hover: 'var(--surface-hover)',
          sidebar: 'var(--surface-sidebar)',
          inverse: 'var(--surface-inverse)',
        },
        content: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          inverse: 'var(--text-inverse)',
          link: 'var(--text-link)',
        },
        accent: {
          blue: 'var(--accent-blue)',
          'blue-hover': 'var(--accent-blue-hover)',
          'blue-subtle': 'var(--accent-blue-subtle)',
          green: 'var(--accent-green)',
          'green-subtle': 'var(--accent-green-subtle)',
          amber: 'var(--accent-amber)',
          'amber-subtle': 'var(--accent-amber-subtle)',
          red: 'var(--accent-red)',
          'red-subtle': 'var(--accent-red-subtle)',
          purple: 'var(--accent-purple)',
          'purple-subtle': 'var(--accent-purple-subtle)',
          teal: 'var(--accent-teal)',
          'teal-subtle': 'var(--accent-teal-subtle)',
        },
        line: {
          light: 'var(--border-light)',
          DEFAULT: 'var(--border-default)',
          hover: 'var(--border-hover)',
          focus: 'var(--border-focus)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'],
        mono: ['SF Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        xs: 'var(--font-size-xs)',
        sm: 'var(--font-size-sm)',
        base: 'var(--font-size-base)',
        md: 'var(--font-size-md)',
        lg: 'var(--font-size-lg)',
        xl: 'var(--font-size-xl)',
        '2xl': 'var(--font-size-2xl)',
        '3xl': 'var(--font-size-3xl)',
      },
      spacing: {
        'safe-top': 'var(--safe-top)',
        'safe-bottom': 'var(--safe-bottom)',
        'safe-left': 'var(--safe-left)',
        'safe-right': 'var(--safe-right)',
      },
      minWidth: {
        tap: 'var(--tap-target-min)',
      },
      minHeight: {
        tap: 'var(--tap-target-min)',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      transitionDuration: {
        fast: '120ms',
        base: '200ms',
        slow: '300ms',
      },
    },
  },
  plugins: [],
};
