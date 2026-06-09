import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    jsx: 'automatic',
  },
  resolve: {
    alias: {
      '@curio/shared': path.resolve(__dirname, '../shared/src/index.ts'),
      'react-native': 'react-native-web',
    },
  },
  test: {
    include: [
      'theme/**/*.test.ts',
      'data/**/*.test.ts',
      'onboarding/**/*.test.ts',
      'onboarding/**/*.test.tsx',
      'today/**/*.test.ts',
      'profile/**/*.test.ts',
      'components/**/*.test.tsx',
      'hooks/**/*.test.tsx',
    ],
    environment: 'node',
    environmentMatchGlobs: [
      ['components/**/*.test.tsx', 'jsdom'],
      ['hooks/**/*.test.tsx', 'jsdom'],
      ['onboarding/**/*.test.tsx', 'jsdom'],
    ],
    setupFiles: ['./vitest.setup.ts'],
  },
});
