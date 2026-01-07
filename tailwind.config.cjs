/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', 'sans-serif'],
        display: ['"Cormorant Garamond"', 'serif']
      },
      colors: {
        ink: '#0b1928',
        mist: '#ffffff',
        accent: '#b08c5a',
        gold: '#d4af37'
      }
    }
  },
  plugins: []
};
