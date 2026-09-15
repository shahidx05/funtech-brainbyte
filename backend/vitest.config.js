const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    environment: 'node',
    testTimeout: 60000,
    hookTimeout: 120000,
    globals: true,
    fileParallelism: false,
  },
});
