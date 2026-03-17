import { execSync } from 'child_process'

export default async function setup() {
  console.log('🧪 Setting up E2E test environment...')

  try {
    // 设置测试环境变量（确保在模块加载前设置）
    process.env.NODE_ENV = 'test'
    process.env.API_PREFIX = '/api'
    
    console.log(`   API_PREFIX: ${process.env.API_PREFIX}`)
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`)
    
    // E2E 测试使用 Mock，不需要真实数据库连接
    // 仅当明确设置 USE_REAL_DB 时才尝试连接数据库
    if (process.env.USE_REAL_DB === 'true') {
      process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/ai-engine-test'
      
      console.log('📦 Running database migrations for test database...')
      execSync('pnpm db:generate', { stdio: 'inherit', cwd: process.cwd() })
      execSync('pnpm db:migrate', { stdio: 'inherit', cwd: process.cwd() })
    } else {
      console.log('ℹ️  Using Mock Prisma Client (set USE_REAL_DB=true for real database)')
      // 生成 Prisma Client 以便 Mock 可以使用
      try {
        execSync('pnpm db:generate', { stdio: 'pipe', cwd: process.cwd() })
      } catch {
        // 忽略生成失败，使用已有的 Prisma Client
      }
    }

    console.log('✅ E2E test environment setup complete')
  } catch (error) {
    console.error('❌ E2E test setup failed:', error instanceof Error ? error.message : error)
    // 不抛出错误，允许测试在 Mock 模式下继续
    console.log('⚠️  Continuing with Mock setup...')
  }
}

export async function teardown() {
  console.log('🧹 Tearing down E2E test environment...')
  
  try {
    // 清理逻辑（如果需要）
    console.log('✅ E2E test environment teardown complete')
  } catch (error) {
    console.error('❌ E2E test teardown failed:', error instanceof Error ? error.message : error)
  }
}
