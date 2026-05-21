/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#2563EB',
        secondary: '#1D4ED8',
        accent: '#16A34A',
        dark: '#0F172A',
        surface: '#F8FAFC',
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
