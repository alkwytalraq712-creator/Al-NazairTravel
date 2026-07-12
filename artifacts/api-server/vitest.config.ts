import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/**'],
    },
    // Longer timeout for OCR tests that use sharp
    testTimeout: 30_000,
  },
});
