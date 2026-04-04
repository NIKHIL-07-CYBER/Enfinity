/** @type {import('tailwindcss').Config} */
export default {
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
