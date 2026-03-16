import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules', 'dist', 'coverage', '**/*.d.ts'],
  },
  coverage: {
    provider: 'v8',
    reporter: ['text', 'json', 'html'],
    include: ['src/utils.ts'],
    exclude: ['src/**/*.spec.ts', 'src/**/*.d.ts', 'src/**/__tests__/**'],
  },
})
