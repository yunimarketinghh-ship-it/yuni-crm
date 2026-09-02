export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans Variable"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#F0F1FE',
          100: '#E2E4FD',
          200: '#C9CCFB',
          300: '#A7ABF6',
          400: '#8286EF',
          500: '#5A5CE6',
          600: '#4A4AD4',
          700: '#3D3CB2',
          800: '#33338E',
          900: '#2C2D71',
        },
        surface: '#F3F5FB',
        ink: {
          900: '#171B33',
          700: '#3A3F5C',
          500: '#6B7194',
          400: '#9298B8',
          300: '#C0C5DC',
          200: '#E4E8F4',
          100: '#EEF1F9',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(35, 43, 96, 0.05), 0 10px 30px -14px rgba(35, 43, 96, 0.14)',
        pop:  '0 4px 10px rgba(35, 43, 96, 0.06), 0 24px 60px -20px rgba(35, 43, 96, 0.25)',
        btn:  '0 1px 2px rgba(35, 43, 96, 0.12), 0 6px 16px -6px rgba(90, 92, 230, 0.45)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        grow: {
          '0%':   { transform: 'scaleY(0)' },
          '100%': { transform: 'scaleY(1)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        grow: 'grow 0.7s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
