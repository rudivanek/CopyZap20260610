/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Only gray colors - completely monochrome
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          200: '#e5e7eb',
          300: '#d1d5db',
          400: '#9ca3af',
          500: '#6b7280',
          600: '#4b5563',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#030712',
        },
        // Map primary to orange brand color
        primary: {
          50: '#fff4ed',
          100: '#ffe4d5',
          200: '#ffc7aa',
          300: '#ffa374',
          400: '#ff7a3c',
          500: '#ff6b35',
          600: '#e5602f',
          700: '#cc552a',
          800: '#b24924',
          900: '#993e1f',
        },
        // Remove all other colors - only black, white, and gray
        black: '#000000',
        white: '#ffffff',
      },
      fontFamily: {
        sans: ['Geist', 'sans-serif'],
        display: ['Geist', 'sans-serif'],
      },
      // Remove rounded corners from design system
      borderRadius: {
        'none': '0px',
        'sm': '0px', 
        'DEFAULT': '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        '3xl': '0px',
        'full': '0px', // Even full should be square
      },
      zIndex: {
        '60': '60',
        '70': '70',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fadeIn': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        }
      }
    },
  },
  plugins: [],
};