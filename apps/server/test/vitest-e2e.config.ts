import { defineConfig } from 'vitest/config'
import path from 'path'

// 在配置加载时就设置环境变量
process.env.NODE_ENV = 'test'
process.env.API_PREFIX = '/api'
process.env.APP_PORT = '3001'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/integration/**/*.e2e-spec.ts'],
    testTimeout: 30000,
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./src/test/setup.ts'],
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
