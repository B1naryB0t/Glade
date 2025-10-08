/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Your existing glade colors
        glade: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        // New color palette
        coral: {
          DEFAULT: '#FF9886',
          light: '#FFB5A7',
          dark: '#E87765',
        },
        cream: {
          DEFAULT: '#FFE3AB',
          light: '#FFF0CC',
          dark: '#F5D68A',
        },
        lime: {
          DEFAULT: '#BBCC42',
          light: '#D4E066',
          dark: '#A3B635',
        },
        olive: {
          DEFAULT: '#85993D',
          light: '#9DAE52',
          dark: '#6D7F32',
        },
        burgundy: {
          DEFAULT: '#7A3644',
          light: '#8F4A58',
          dark: '#5E2A36',
        },
      }
    },
  },
  plugins: [],
}