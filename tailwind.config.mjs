/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#318F48',
          dark: '#1A5C2E',
          accent: '#BDFFDF',
          surface: '#080E0A',
          card: '#0D1A10',
          border: 'rgba(189,255,223,0.12)',
          muted: '#A8BFB0',
          gold: '#C9943A',
        },
        'police-green': {
          50: '#F2FBF6',
          100: 'rgba(49,143,72,0.1)',
          200: '#BDFFDF',
          300: '#BDFFDF',
          400: '#5EC97A',
          500: '#318F48',
          600: '#256B38',
          700: '#1A5C2E',
          800: '#123D22',
          900: '#080E0A',
        },
      },
    },
  },
  plugins: [],
}

export default config
