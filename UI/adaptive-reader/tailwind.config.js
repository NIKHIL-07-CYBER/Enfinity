/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        reading: ['"Atkinson Hyperlegible"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
