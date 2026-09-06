/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5046E5',
          hover: '#4338CA',
          light: '#EEF0FE',
          50: '#EEF0FE',
          100: '#E0E3FD',
          500: '#5046E5',
          600: '#4338CA',
          700: '#3730A3',
        },
        surface: '#F8F9FD',
        card: '#FFFFFF',
        'card-border': '#ECEEF3',
        bihan: {
          navy: '#062B78',
          deep: '#001B4D',
          blue: '#1457B8',
          light: '#F8F9FD',
          tint: '#EEF0FE',
        },
        vikas: {
          50: '#f0f9ff',
          500: '#0284c7',
        },
        rupesh: {
          50: '#faf5ff',
          500: '#9333ea',
        }
      },
      borderRadius: {
        'xl': '14px',
        '2xl': '20px',
        '3xl': '26px',
        '4xl': '32px',
      },
      boxShadow: {
        'card': '0 2px 14px -2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.02)',
        'elevated': '0 10px 25px -5px rgba(80, 70, 229, 0.35), 0 8px 10px -6px rgba(80, 70, 229, 0.2)',
        'nav': '0 -4px 20px rgba(0, 0, 0, 0.03)',
      },
      fontFamily: {
        sans: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
