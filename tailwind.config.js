module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        cacau: {
          50: '#f5ede8',
          100: '#e8d9d1',
          500: '#8B4513',
          700: '#5C2E0F',
          900: '#2d1807',
        },
        gold: {
          50: '#fffef0',
          500: '#FFD700',
          700: '#f9a825',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
