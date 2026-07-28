/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        background: 'var(--color-background)',
        surface: 'var(--color-surface)',
        textColor: 'var(--color-text)',
        text: 'var(--color-text)',
        textMuted: 'var(--color-textMuted)',
        borderColor: 'var(--color-border)',
        border: 'var(--color-border)',
        neutral: 'var(--color-neutral)',
        adminSidebarBg: 'var(--color-adminSidebarBg)',
        adminSidebarText: 'var(--color-adminSidebarText)',
        adminSidebarActiveBg: 'var(--color-adminSidebarActiveBg)',
        headerBg: 'var(--color-headerBg)',
        headerText: 'var(--color-headerText)',
        navBg: 'var(--color-navBg)',
        navText: 'var(--color-navText)',
        searchBg: 'var(--color-searchBg)',
        searchText: 'var(--color-searchText)',
      }
    },
  },
  plugins: [],
}
