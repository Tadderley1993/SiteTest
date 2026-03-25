/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:                '#f9f9f9',
        'surface':                 '#ffffff',
        'surface-low':             '#f3f3f4',
        'surface-high':            '#e2e2e2',
        primary:                   '#000000',
        'primary-hover':           '#222222',
        'on-primary':              '#ffffff',
        'text-primary':            '#000000',
        'text-muted':              '#474747',
        'text-subtle':             '#777777',
        border:                    '#c6c6c6',
        'border-light':            '#e5e5e5',
        // Admin dark theme (unchanged)
        accent:                    '#C6A84B',
        'accent-dim':              '#A08030',
        'admin-bg':                '#08090D',
      },
      fontFamily: {
        sans:    ['Inter', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(48px,7vw,96px)',  { lineHeight: '1.0', fontWeight: '800', letterSpacing: '-0.04em' }],
        'h1':      ['clamp(36px,5vw,72px)',  { lineHeight: '1.05', fontWeight: '700', letterSpacing: '-0.03em' }],
        'h2':      ['clamp(28px,3.5vw,48px)',{ lineHeight: '1.1',  fontWeight: '700', letterSpacing: '-0.02em' }],
        'h3':      ['clamp(20px,2.2vw,28px)',{ lineHeight: '1.2',  fontWeight: '600', letterSpacing: '-0.01em' }],
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.6s ease forwards',
        'fade-in': 'fade-in 0.4s ease forwards',
      },
    },
  },
  plugins: [],
}
