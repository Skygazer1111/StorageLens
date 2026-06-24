/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{html,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#1e1e2e',
          raised: '#262637',
          border: '#3b3b54',
        },
        accent: {
          DEFAULT: '#7c9cff',
          muted: '#5a7ae6',
        },
      },
    },
  },
  plugins: [],
}
