import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/__tests__/**'],
    },
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@ai-engine/core': path.resolve(__dirname, '../core/src'),
      '@ai-engine/shared': path.resolve(__dirname, '../shared/src'),
    },
  },
})
