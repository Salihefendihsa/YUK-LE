// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Kaynak dışı dizinler — node_modules dahil (özyinelemeli glob şart).
    ignores: [
      '**/node_modules/**',
      '.expo/**',
      'dist/**',
      'web-build/**',
      'scripts/**',
      'android/**',
      'ios/**',
    ],
  },
]);
