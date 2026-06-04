/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Community-friendly color palette
        primary: '#3b82f6',     // Blue
        accent: '#10b981',      // Green (growth, community)
        warm: '#f59e0b',        // Amber (friendly)
        light: '#f3f4f6',       // Light gray
        dark: '#1f2937',        // Dark gray
      },
    },
  },
  plugins: [],
}
