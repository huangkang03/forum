/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#FAF8F5',
        ink: '#2C2416',
        cinnabar: '#C8463A',
        'cinnabar-dark': '#A8382E',
        sage: '#7A9E7E',
        'sage-dark': '#5E7F62',
        warm: '#E8E4DF',
        'warm-dark': '#D4CEC7',
      },
      fontFamily: {
        display: ['"PingFang SC"', '"Noto Serif SC"', 'Georgia', 'serif'],
        body: ['"PingFang SC"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
