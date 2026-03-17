/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        surface: 'rgba(255,255,255,0.03)',
        border: 'rgba(255,255,255,0.08)',
        accent: '#ffffff',
        'accent-secondary': '#8a8f98',
        'text-primary': '#ffffff',
        'text-muted': '#8a8f98',
        'slate-grey': '#1a1c23',
        'cool-grey': '#8a8f98',
      },
      fontFamily: {
        display: ['General Sans', 'sans-serif'],
        body: ['General Sans', 'sans-serif'],
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
      },
      animation: {
        'shimmer-slide': 'shimmer-slide var(--speed) ease-in-out infinite alternate',
        'spin-around':   'spin-around calc(var(--speed) * 2) infinite linear',
      },
    },
  },
  plugins: [],
}
