import { defineConfig } from 'vitest/config';
import path from 'path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(root, './src'),
      '@telemetry': path.resolve(root, '../../telemetry/index.ts'),
      '@backend': path.resolve(root, '../../backend/src'),
      '@nlp': path.resolve(root, '../../nlp/src'),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
  },
});
