module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {
      // Suppress outdated gradient syntax warnings
      overrideBrowserslist: ['> 1%', 'last 2 versions'],
      // Suppress warnings
      grid: false,
    },
  },
}
