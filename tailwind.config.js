/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Outfit"', 'Inter', 'sans-serif'],
      },
      colors: {
        slate: {
          350: '#b2c1d3',
          450: '#7e8f9e',
          550: '#536371',
          750: '#273544',
          755: '#222f3e',
        },
        emerald: {
          450: '#34d399',
          650: '#059669',
        },
        blue: {
          450: '#60a5fa',
          455: '#4786eb',
          955: '#101e35',
        },
        red: {
          405: '#ef4444',
          650: '#dc2626',
        },
        rose: {
          455: '#f43f5e',
        }
      },
      transitionDuration: {
        350: '350ms',
      }
    },
  },
  plugins: [],
};
