import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/integration/**/*.e2e-spec.ts'],
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
      '@ai-engine/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@ai-engine/core': path.resolve(__dirname, '../../packages/core/src'),
      '@ai-engine/providers': path.resolve(__dirname, '../../packages/providers/src'),
    },
  },
})
