import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'coverage'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/__tests__/**', 'src/**/*.d.ts'],
      all: true,
    },
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@ai-engine/shared': path.resolve(__dirname, '../shared/src'),
      '@ai-engine/providers': path.resolve(__dirname, '../providers/src'),
    },
    extensions: ['.ts', '.js'],
  },
})
