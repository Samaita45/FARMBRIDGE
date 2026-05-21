/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#22c55e',
        secondary: '#16a34a',
        accent: '#86efac',
        dark: '#14532d',
        surface: '#f0fdf4',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      fontFamily: {
        display: ['Fraunces_700Bold'],
        sans: ['PlusJakartaSans_400Regular'],
        'sans-semibold': ['PlusJakartaSans_600SemiBold'],
        'sans-bold': ['PlusJakartaSans_700Bold'],
      },
    },
  },
  plugins: [],
};
