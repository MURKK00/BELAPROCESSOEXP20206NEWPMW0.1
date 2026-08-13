import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: '#F58025',
        secondary: '#1A7A43',
        bg: '#f3f4f6',
        surface: '#ffffff',
        border: '#e5e7eb',
        danger: '#ef4444',
        warning: '#f59e0b',
        success: '#10b981',
      },
    },
  },
  plugins: [],
};

export default config;
