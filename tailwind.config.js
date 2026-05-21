/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#1a56db',
        secondary: '#1e40af',
        accent: '#16a34a',
        dark: '#0f172a',
        surface: '#eff6ff',
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
