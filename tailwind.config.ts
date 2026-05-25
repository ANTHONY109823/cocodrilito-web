import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'police-green': {
          50: '#F2F6F3',
          100: '#E8F0EB',
          200: '#C5D9CA',
          300: '#9DC2A6',
          400: '#6B9E7A',
          500: '#4A7C59',
          600: '#3A6347',
          700: '#2D5A3D',
          800: '#1F3D2A',
          900: '#0F1F14',
        },
      },
    },
  },
  plugins: [],
}

export default config
