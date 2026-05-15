/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#18cb6e',
          dark: '#13b560',
          light: '#e5f9ef',
        },
        secondary: {
          DEFAULT: '#6FD3F2',
          dark: '#3bbfe0',
          light: '#e4f7fd',
        },
        cream: '#F7F8FA',
        charcoal: '#1A1A1A',
        'warm-gray': '#6B7280',
      },
    },
  },
  plugins: [],
}
