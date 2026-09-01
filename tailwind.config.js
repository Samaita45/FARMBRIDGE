/** @type {import('tailwindcss').Config} */
const tokens = require('./constants/design-tokens');

// NativeWind classes and StyleSheet styles are both in use across the app, so
// both have to resolve to the same palette. Everything below is derived from
// constants/design-tokens.js — do not hardcode a colour or size here.
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        primaryDark: tokens.colors.primaryDark,
        primaryLight: tokens.colors.primaryLight,
        primaryBg: tokens.colors.primaryBg,
        primaryMid: tokens.colors.primaryMid,

        secondary: tokens.colors.primaryDark,
        accent: tokens.colors.accent,
        accentLight: tokens.colors.accentLight,

        dark: tokens.colors.text,
        muted: tokens.colors.textMuted,
        soft: tokens.colors.textSoft,

        surface: tokens.colors.background,
        card: tokens.colors.surface,
        border: tokens.colors.border,

        success: tokens.colors.success,
        warning: tokens.colors.warning,
        danger: tokens.colors.danger,
        error: tokens.colors.danger,

        gray: tokens.colors.gray,
        blue: tokens.colors.blue,
        green: tokens.colors.green,
      },
      spacing: {
        xs: tokens.spacing.xs,
        sm: tokens.spacing.sm,
        md: tokens.spacing.md,
        lg: tokens.spacing.lg,
        xl: tokens.spacing.xl,
        xxl: tokens.spacing.xxl,
      },
      borderRadius: {
        xs: tokens.radius.xs,
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
        xl: tokens.radius.xl,
        '2xl': tokens.radius.xxl,
        full: tokens.radius.full,
      },
      fontFamily: {
        display: [tokens.fontFamily.display],
        sans: [tokens.fontFamily.regular],
        'sans-semibold': [tokens.fontFamily.semibold],
        'sans-bold': [tokens.fontFamily.bold],
      },
    },
  },
  plugins: [],
};
