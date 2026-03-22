/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#eaded0',
        forest: '#4e705e',
        maroon: '#361319',
        berry: '#6d3a3c',
        bark: '#110703',
        sand: '#c7af94',
        lavender: '#e8def8',
      },
    },
  },
  plugins: [],
};
