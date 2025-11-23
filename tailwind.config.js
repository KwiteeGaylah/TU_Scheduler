/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f5ee',
          100: '#d1eadd',
          200: '#a3d5bb',
          300: '#75c099',
          400: '#47ab77',
          500: '#195630',
          600: '#164d2a',
          700: '#124324',
          800: '#0f3a1e',
          900: '#0c3118',
        },
        'tu-green': {
          DEFAULT: '#195630',
          light: '#3F5B33',
          dark: '#124324',
        },
        'tu-gold': {
          DEFAULT: '#E1A722',
          light: '#f0c04e',
          dark: '#c89419',
        },
        'tu-carbon': '#1E1E1A',
      },
    },
  },
  plugins: [],
}
