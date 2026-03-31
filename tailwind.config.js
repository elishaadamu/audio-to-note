/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        surface: 'var(--surface)',
        surfaceElevated: 'var(--surfaceElevated)',
        surfaceBorder: 'var(--surfaceBorder)',
        accent: 'var(--accent)',
        accentLight: 'var(--accentLight)',
        accentDark: 'var(--accentDark)',
        accentGlow: 'var(--accentGlow)',
        danger: 'var(--danger)',
        dangerLight: 'var(--dangerLight)',
        dangerGlow: 'var(--dangerGlow)',
        success: 'var(--success)',
        successGlow: 'var(--successGlow)',
        warning: 'var(--warning)',
        textPrimary: 'var(--textPrimary)',
        textSecondary: 'var(--textSecondary)',
        textMuted: 'var(--textMuted)',
        textPlaceholder: 'var(--textPlaceholder)',
        waveform: 'var(--waveform)',
        waveformMuted: 'var(--waveformMuted)',
        tabActive: 'var(--tabActive)',
        tabInactive: 'var(--tabInactive)',
      }
    },
  },
  plugins: [],
}
