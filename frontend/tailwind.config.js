/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#a166ff',
        'primary-dark': '#8a4de6',
        'primary-light': '#f3ebff',
        'host-cream': '#FFBE68',
        'host-cream-light': '#FFD9A8',
        'host-cream-dark': '#E8A44E',
        'host-cream-accent': '#9A5516',
        light: '#fafafa',
        dark: '#1f2937',
      },
      fontFamily: {
        sans: ['var(--font-ibm-plex-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
