/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{astro,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif']
      },
      colors: {
        ink: '#0b1928',
        mist: '#f7f9fb',
        accent: '#7b9abf',
        gold: '#d4af37'
      }
    }
  },
  plugins: []
};
