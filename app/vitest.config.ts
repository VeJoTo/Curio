import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@curio/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
  test: {
    include: ['theme/**/*.test.ts', 'data/**/*.test.ts', 'onboarding/**/*.test.ts'],
    environment: 'node',
  },
});
