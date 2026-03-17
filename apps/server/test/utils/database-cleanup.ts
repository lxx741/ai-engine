import { PrismaClient } from '@prisma/client'

/**
 * 清理数据库中的所有测试数据
 * 按照外键依赖关系逆序删除
 */
export async function cleanupDatabase(prisma: PrismaClient): Promise<void> {
  try {
    // 按照依赖关系逆序删除（先删除子表，再删除父表）
    await prisma.workflowRun.deleteMany()
    await prisma.workflow.deleteMany()
    await prisma.message.deleteMany()
    await prisma.conversation.deleteMany()
    await prisma.model.deleteMany()
    await prisma.app.deleteMany()
    
    console.log('✅ Database cleanup completed')
  } catch (error) {
    console.error('❌ Database cleanup failed:', error instanceof Error ? error.message : error)
    throw error
  }
}

/**
 * 创建测试用应用
 */
export async function createTestApp(
  prisma: PrismaClient,
  overrides: Partial<{
    name: string
    description: string
    apiKey: string
  }> = {}
) {
  const app = await prisma.app.create({
    data: {
      name: overrides.name || `Test App ${Date.now()}`,
      description: overrides.description || 'Test application for E2E tests',
      apiKey: overrides.apiKey || `test-api-key-${Date.now()}`,
    },
  })
  
  return app
}

/**
 * 创建测试用会话
 */
export async function createTestConversation(
  prisma: PrismaClient,
  appId: string,
  overrides: Partial<{
    title: string
    userId: string
  }> = {}
) {
  const conversation = await prisma.conversation.create({
    data: {
      appId,
      title: overrides.title || `Test Conversation ${Date.now()}`,
      userId: overrides.userId || 'test-user',
    },
  })
  
  return conversation
}

/**
 * 创建测试用工作流
 */
export async function createTestWorkflow(
  prisma: PrismaClient,
  appId: string,
  overrides: Partial<{
    name: string
    description: string
    definition: any
  }> = {}
) {
  const workflow = await prisma.workflow.create({
    data: {
      appId,
      name: overrides.name || `Test Workflow ${Date.now()}`,
      description: overrides.description || 'Test workflow for E2E tests',
      definition: overrides.definition || {
        nodes: [
          { id: 'start', type: 'start', config: {} },
          { id: 'end', type: 'end', config: {} },
        ],
        edges: [{ source: 'start', target: 'end' }],
      },
    },
  })
  
  return workflow
}
