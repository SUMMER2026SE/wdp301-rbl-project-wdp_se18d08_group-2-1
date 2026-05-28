/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#22D3EE",
        secondary: "#8B5CF6",
        "background-dark": "#020617",
      },
      animation: {
        fadeIn: 'fadeIn 0.2s ease-out-in',
      },
    },
  },
  plugins: [],
};
