import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#1a1a2e', accent: '#e94560' },
      },
    },
  },
  plugins: [],
} satisfies Config
