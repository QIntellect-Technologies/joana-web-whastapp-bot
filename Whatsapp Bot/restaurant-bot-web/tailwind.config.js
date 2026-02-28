/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whatsapp: {
          green: '#25D366',
          teal: '#128C7E',
          tealDark: '#075E54',
          light: '#E7FCE3', // Message bubble
          bg: '#ECE5DD', // Chat background
          input: '#F0F2F5', // Input field
        }
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
