/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background:         '#F0EBE3',
        surface:            'rgba(0,0,0,0.03)',
        border:             'rgba(0,0,0,0.08)',
        accent:             '#C6A84B',
        'accent-dim':       '#A08030',
        'accent-secondary': '#A08030',
        'text-primary':     '#1C1917',
        'text-muted':       '#78706A',
        'gold-glow':        'rgba(198,168,75,0.15)',
        // Admin dark theme stays explicit in admin components
        'admin-bg':         '#08090D',
      },
      fontFamily: {
        sans:    ['Satoshi', 'sans-serif'],
        display: ['Satoshi', 'sans-serif'],
        body:    ['Satoshi', 'sans-serif'],
      },
      fontSize: {
        'display': ['clamp(56px,8vw,96px)',  { lineHeight: '1.05', fontWeight: '900' }],
        'h1':      ['clamp(40px,5vw,64px)',  { lineHeight: '1.1',  fontWeight: '700' }],
        'h2':      ['clamp(28px,3.5vw,44px)',{ lineHeight: '1.2',  fontWeight: '700' }],
        'h3':      ['clamp(18px,2vw,24px)',  { lineHeight: '1.3',  fontWeight: '500' }],
      },
      backdropBlur: {
        xl: '24px',
      },
      keyframes: {
        'shimmer-slide': {
          to: { transform: 'translate(calc(100cqw - 100%), 0)' },
        },
        'spin-around': {
          '0%':       { transform: 'translateZ(0) rotate(0)' },
          '15%, 35%': { transform: 'translateZ(0) rotate(90deg)' },
          '65%, 85%': { transform: 'translateZ(0) rotate(270deg)' },
          '100%':     { transform: 'translateZ(0) rotate(360deg)' },
        },
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around':   'spin-around calc(var(--speed) * 2) infinite linear',
        'fade-up':       'fade-up 0.6s ease forwards',
      },
    },
  },
  plugins: [],
}
