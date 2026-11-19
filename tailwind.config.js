/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: '#202138',
        muted: '#85869a',
        canvas: '#f6f7fb',
        violet: '#6558e8',
      },
      boxShadow: {
        card: '0 8px 30px rgba(32, 33, 56, 0.045)',
      },
    },
  },
  plugins: [],
}
