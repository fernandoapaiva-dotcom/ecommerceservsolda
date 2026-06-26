/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Map themes to CSS custom variables injected dynamically
        primary: {
          500: 'var(--color-primary, #f59e0b)',
          600: 'var(--color-accent, #d97706)',
        },
        slate: {
          900: 'var(--color-secondary, #1e293b)',
          950: 'var(--color-secondary, #0f172a)',
        },
        theme: {
          primary: 'var(--color-primary, #f59e0b)',
          secondary: 'var(--color-secondary, #1e293b)',
          accent: 'var(--color-accent, #d97706)',
          background: 'var(--color-background, #f8fafc)',
          surface: 'var(--color-surface, #ffffff)',
          text: 'var(--color-text, #0f172a)',
          textMuted: 'var(--color-textMuted, #64748b)',
          border: 'var(--color-border, #e2e8f0)',
        }
      }
    },
  },
  plugins: [],
}
