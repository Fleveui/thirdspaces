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
        'host-cream': '#F7D58F',
        'host-cream-light': '#FAE4AD',
        'host-cream-dark': '#F7D58F',
        'host-cream-accent': '#8B6018',
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
