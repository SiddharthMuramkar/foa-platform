/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        foa: {
          red: '#E52421',
          green: '#00A651',
          blue: '#0055A5',
          navy: '#0F172A',
          amber: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
