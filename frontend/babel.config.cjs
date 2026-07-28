/* eslint-env node */
module.exports = {
  presets: [
    [
      '@quasar/babel-preset-app',
      process.env.NODE_ENV === 'test'
        ? { targets: { node: 'current' } }
        : {}
    ]
  ]
}
