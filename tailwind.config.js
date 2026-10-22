/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backed by the tokens in index.css so opacity modifiers work (bg-brand-rose/20)
        brand: {
          rose:     'rgb(var(--brand-rose-rgb) / <alpha-value>)',
          primary:  'rgb(var(--brand-primary-rgb) / <alpha-value>)',
          burgundy: 'rgb(var(--brand-burgundy-rgb) / <alpha-value>)',
          navy:     'rgb(var(--brand-navy-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body:    ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
};