/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Single brand-red token used everywhere instead of scattered
        // red-600 / red-700 / #A11C1C / #b91c1c literals.
        brand: {
          DEFAULT: "#A11C1C",   // primary actions, active links, badges
          dark:    "#7A1414",   // hover states
          light:   "#F6E3E0",   // tinted backgrounds / chips
        },
      },
    },
  },
  plugins: [],
};
