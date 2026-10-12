/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        twilight: '#0b1120',
        skyGlow: '#38bdf8',
        mintGlow: '#34d399',
        neonPink: '#f472b6',
      },
      boxShadow: {
        glow: '0 0 30px rgba(56, 189, 248, 0.35)',
      },
    },
  },
  plugins: [],
};
