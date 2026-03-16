import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', '.next', 'coverage'],
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.spec.ts', 'src/**/__tests__/**', 'src/main.ts'],
    },
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@ai-engine/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@ai-engine/core': path.resolve(__dirname, '../../packages/core/src'),
      '@ai-engine/providers': path.resolve(__dirname, '../../packages/providers/src'),
    },
    extensions: ['.ts', '.js'],
  },
})
