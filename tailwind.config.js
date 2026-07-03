/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#243247'
        },
        brand: {
          dark:    '#0A1128',
          darker:  '#050A18',
          primary: '#D8292E',
          card:    '#1B263B',
        }
      }
    }
  },
  plugins: []
};
