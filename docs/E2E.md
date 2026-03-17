# AI Engine - E2E 测试完善计划

**文档创建日期**: 2026-03-16  
**当前状态**: 基础配置完成，待扩展  
**目标**: 50+ 测试用例，覆盖核心业务流程

---

## 一、当前 E2E 测试状态

### 1.1 已有基础

**配置文件**:
- ✅ `apps/server/test/vitest-e2e.config.ts` - Vitest E2E 配置
- ✅ `apps/server/src/test/setup.ts` - 测试全局 Mock 设置

**测试文件**:
- ✅ `apps/server/test/integration/chat.e2e-spec.ts` - 15 个测试用例

**测试框架**:
- Vitest (测试运行器)
- Supertest (HTTP 测试)
- NestJS Testing Module (依赖注入)

**NPM 脚本**:
```bash
pnpm --filter @ai-engine/server test:e2e
```

---

### 1.2 当前测试覆盖

| 模块 | API 端点 | 测试用例数 | 状态 |
|------|---------|-----------|------|
| **Chat** | POST /api/chat/completions | 3 | ✅ 基础验证 |
| **Chat** | GET /api/chat/sessions/:id | 2 | ✅ 基础验证 |
| **Apps** | GET /api/apps | 2 | ✅ 认证测试 |
| **Workflow** | POST /api/workflows/:id/run | 2 | ⚠️ Mock 测试 |
| **Tools** | GET /api/tools | 2 | ✅ 完整测试 |
| **总计** | 5 个端点 | 11 个用例 | 基础覆盖 |

---

### 1.3 当前问题

**配置问题**:
1. ❌ E2E 配置缺少 `vite-tsconfig-paths` 插件，无法解析 workspace 包
2. ❌ Mock 策略不完善（Prisma、Providers、Core 都需要 Mock）
3. ❌ 缺少数据库清理机制
4. ❌ 缺少测试数据种子

**测试覆盖问题**:
1. ❌ 缺少完整业务流程测试（创建应用→对话→工作流→工具）
2. ❌ 缺少数据库集成测试（当前全是 Mock）
3. ❌ 缺少前端 E2E 测试
4. ❌ 覆盖率仅 4%（需要扩展到 50+ 用例）

---

## 二、E2E 测试完善计划

### 2.1 第一阶段：修复配置（P0 - 必须）

**目标**: 让现有 E2E 测试能够正常运行

**任务**:
1. **修复 Vitest 配置**
   ```bash
   # 安装 vite-tsconfig-paths
   pnpm add -D vite-tsconfig-paths
   ```

2. **更新 vitest-e2e.config.ts**
   ```typescript
   import { defineConfig } from 'vitest/config'
   import tsconfigPaths from 'vite-tsconfig-paths'

   export default defineConfig({
     plugins: [tsconfigPaths()],
     test: {
       globals: true,
       environment: 'node',
       include: ['test/integration/**/*.e2e-spec.ts'],
       testTimeout: 30000,
       globalSetup: ['test/global-setup.ts'],
     },
   })
   ```

3. **创建全局 Setup 文件**
   ```typescript
   // test/global-setup.ts
   import { execSync } from 'child_process'

   export default async function setup() {
     // 运行数据库迁移
     execSync('pnpm db:migrate')
     // 运行种子数据
     execSync('pnpm db:seed')
   }
   ```

4. **创建测试数据库清理工具**
   ```typescript
   // test/utils/database-cleanup.ts
   export async function cleanupDatabase(prisma: PrismaClient) {
     await prisma.workflowRun.deleteMany()
     await prisma.workflow.deleteMany()
     await prisma.message.deleteMany()
     await prisma.conversation.deleteMany()
     await prisma.model.deleteMany()
     await prisma.app.deleteMany()
   }
   ```

**预期结果**: E2E 测试能够正常运行，无模块解析错误

---

### 2.2 第二阶段：扩展后端 E2E 测试（P0 - 必须）

**目标**: 覆盖所有核心 API 端点，50+ 测试用例

#### 测试文件结构

```
apps/server/test/integration/
├── chat.e2e-spec.ts              # 对话功能（已有，需完善）
├── apps.e2e-spec.ts              # 应用管理（新增）
├── workflows.e2e-spec.ts         # 工作流管理（新增）
├── tools.e2e-spec.ts             # 工具管理（已有，需完善）
├── models.e2e-spec.ts            # 模型管理（新增）
└── full-flow.e2e-spec.ts         # 完整业务流程（新增）
```

---

#### 2.2.1 应用管理测试 (`apps.e2e-spec.ts`)

**测试用例** (10 个):

```typescript
describe('Apps API E2E', () => {
  // 1. 创建应用
  it('should create an application', async () => {
    const response = await request(app)
      .post('/api/apps')
      .send({
        name: '测试应用',
        description: '用于 E2E 测试',
        modelId: 'qwen3.5:9b',
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toMatchObject({
      name: '测试应用',
      apiKey: expect.stringMatching(/^sk_/),
    });
  });

  // 2. 获取应用列表
  it('should get list of applications', async () => {
    const response = await request(app)
      .get('/api/apps')
      .set('X-API-Key', authToken);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // 3. 获取应用详情
  it('should get application details', async () => {
    const response = await request(app)
      .get(`/api/apps/${appId}`)
      .set('X-API-Key', authToken);
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(appId);
  });

  // 4. 更新应用
  it('should update application', async () => {
    const response = await request(app)
      .patch(`/api/apps/${appId}`)
      .set('X-API-Key', authToken)
      .send({ name: '更新后的名称' });
    
    expect(response.status).toBe(200);
    expect(response.body.name).toBe('更新后的名称');
  });

  // 5. 删除应用
  it('should delete application', async () => {
    const response = await request(app)
      .delete(`/api/apps/${appId}`)
      .set('X-API-Key', authToken);
    
    expect(response.status).toBe(200);
  });

  // 6. 重置 API Key
  it('should regenerate API key', async () => {
    const response = await request(app)
      .post(`/api/apps/${appId}/regenerate-key`)
      .set('X-API-Key', authToken);
    
    expect(response.status).toBe(200);
    expect(response.body.apiKey).toMatch(/^sk_/);
  });

  // 7. 认证失败 - 无 API Key
  it('should return 401 without API key', async () => {
    const response = await request(app).get('/api/apps');
    expect(response.status).toBe(401);
  });

  // 8. 认证失败 - 无效 API Key
  it('should return 403 with invalid API key', async () => {
    const response = await request(app)
      .get('/api/apps')
      .set('X-API-Key', 'invalid-key');
    expect(response.status).toBe(403);
  });

  // 9. 验证必填字段
  it('should return 400 when name is missing', async () => {
    const response = await request(app)
      .post('/api/apps')
      .send({ description: '缺少名称' });
    expect(response.status).toBe(400);
  });

  // 10. 测试 API Key 认证功能
  it('should access protected resource with valid API key', async () => {
    const response = await request(app)
      .get('/api/apps')
      .set('X-API-Key', validApiKey);
    expect(response.status).toBe(200);
  });
});
```

---

#### 2.2.2 对话功能测试 (`chat.e2e-spec.ts` 完善版)

**新增测试用例** (12 个):

```typescript
describe('Chat API E2E', () => {
  // 前置步骤：创建应用和会话
  beforeAll(async () => {
    // 创建测试应用
    const appResponse = await request(app)
      .post('/api/apps')
      .send({ name: 'Chat Test App' });
    testAppId = appResponse.body.id;
    testApiKey = appResponse.body.apiKey;

    // 创建测试会话
    const conversationResponse = await request(app)
      .post('/api/chat/sessions')
      .set('X-API-Key', testApiKey)
      .send({ appId: testAppId });
    testConversationId = conversationResponse.body.id;
  });

  // 1. 发送消息（非流式）
  it('should send message and get response (non-streaming)', async () => {
    const response = await request(app)
      .post('/api/chat/completions')
      .set('X-API-Key', testApiKey)
      .send({
        conversationId: testConversationId,
        message: '你好，请介绍你自己',
      });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('content');
    expect(response.body).toHaveProperty('role', 'assistant');
  });

  // 2. 发送消息（流式）
  it('should send message and get streaming response', async () => {
    const response = await request(app)
      .post('/api/chat/completions/stream')
      .set('X-API-Key', testApiKey)
      .send({
        conversationId: testConversationId,
        message: '你好',
      });
    
    expect(response.status).toBe(200);
    expect(response.header['content-type']).toContain('text/event-stream');
  });

  // 3. 获取会话列表
  it('should get list of conversations', async () => {
    const response = await request(app)
      .get('/api/chat/sessions')
      .set('X-API-Key', testApiKey);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // 4. 获取会话详情
  it('should get conversation details', async () => {
    const response = await request(app)
      .get(`/api/chat/sessions/${testConversationId}`)
      .set('X-API-Key', testApiKey);
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(testConversationId);
  });

  // 5. 获取消息历史
  it('should get message history', async () => {
    const response = await request(app)
      .get(`/api/chat/sessions/${testConversationId}/messages`)
      .set('X-API-Key', testApiKey);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // 6. 删除会话
  it('should delete conversation', async () => {
    const response = await request(app)
      .delete(`/api/chat/sessions/${testConversationId}`)
      .set('X-API-Key', testApiKey);
    
    expect(response.status).toBe(200);
  });

  // 7-12. 错误处理测试
  it('should return 400 when message is missing', async () => {
    const response = await request(app)
      .post('/api/chat/completions')
      .set('X-API-Key', testApiKey)
      .send({ conversationId: testConversationId });
    expect(response.status).toBe(400);
  });

  it('should return 404 for non-existent conversation', async () => {
    const response = await request(app)
      .get('/api/chat/sessions/non-existent-id')
      .set('X-API-Key', testApiKey);
    expect(response.status).toBe(404);
  });

  // ... 更多错误处理测试
});
```

---

#### 2.2.3 工作流测试 (`workflows.e2e-spec.ts`)

**测试用例** (15 个):

```typescript
describe('Workflows API E2E', () => {
  // 前置步骤
  beforeAll(async () => {
    // 创建测试应用
    const appResponse = await request(app).post('/api/apps').send({ name: 'Workflow Test App' });
    testAppId = appResponse.body.id;
    testApiKey = appResponse.body.apiKey;
  });

  // 1. 创建工作流
  it('should create a workflow', async () => {
    const response = await request(app)
      .post('/api/workflows')
      .set('X-API-Key', testApiKey)
      .send({
        appId: testAppId,
        name: '测试工作流',
        description: 'E2E 测试',
        definition: {
          nodes: [
            { id: 'start', type: 'start', config: {} },
            { id: 'end', type: 'end', config: {} },
          ],
          edges: [{ source: 'start', target: 'end' }],
        },
      });
    
    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
    testWorkflowId = response.body.id;
  });

  // 2. 获取工作流列表
  it('should get list of workflows', async () => {
    const response = await request(app)
      .get('/api/workflows')
      .set('X-API-Key', testApiKey);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // 3. 获取工作流详情
  it('should get workflow details', async () => {
    const response = await request(app)
      .get(`/api/workflows/${testWorkflowId}`)
      .set('X-API-Key', testApiKey);
    
    expect(response.status).toBe(200);
    expect(response.body.id).toBe(testWorkflowId);
  });

  // 4. 更新工作流
  it('should update workflow', async () => {
    const response = await request(app)
      .patch(`/api/workflows/${testWorkflowId}`)
      .set('X-API-Key', testApiKey)
      .send({ name: '更新后的名称' });
    
    expect(response.status).toBe(200);
  });

  // 5. 删除工作流
  it('should delete workflow', async () => {
    const response = await request(app)
      .delete(`/api/workflows/${testWorkflowId}`)
      .set('X-API-Key', testApiKey);
    
    expect(response.status).toBe(200);
  });

  // 6-10. 工作流执行测试
  it('should execute a workflow', async () => {
    const response = await request(app)
      .post(`/api/workflows/${testWorkflowId}/run`)
      .set('X-API-Key', testApiKey)
      .send({ input: {} });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
  });

  // 11-15. 执行记录测试
  it('should get workflow execution history', async () => {
    const response = await request(app)
      .get(`/api/workflows/${testWorkflowId}/runs`)
      .set('X-API-Key', testApiKey);
    
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  // ... 更多测试
});
```

---

#### 2.2.4 完整业务流程测试 (`full-flow.e2e-spec.ts`)

**核心测试** (10 个):

```typescript
describe('Full Business Flow E2E', () => {
  it('should complete full flow: create app -> chat -> workflow -> tool', async () => {
    // 步骤 1: 创建应用
    const appResponse = await request(app)
      .post('/api/apps')
      .send({ name: 'Full Flow Test App' });
    const appId = appResponse.body.id;
    const apiKey = appResponse.body.apiKey;

    // 步骤 2: 创建对话会话
    const conversationResponse = await request(app)
      .post('/api/chat/sessions')
      .set('X-API-Key', apiKey)
      .send({ appId });
    const conversationId = conversationResponse.body.id;

    // 步骤 3: 发送对话消息
    const chatResponse = await request(app)
      .post('/api/chat/completions')
      .set('X-API-Key', apiKey)
      .send({
        conversationId,
        message: '你好',
      });
    expect(chatResponse.status).toBe(200);

    // 步骤 4: 创建工作流
    const workflowResponse = await request(app)
      .post('/api/workflows')
      .set('X-API-Key', apiKey)
      .send({
        appId,
        name: '测试工作流',
        definition: {
          nodes: [
            { id: 'start', type: 'start', config: {} },
            { id: 'end', type: 'end', config: {} },
          ],
          edges: [{ source: 'start', target: 'end' }],
        },
      });
    const workflowId = workflowResponse.body.id;

    // 步骤 5: 执行工作流
    const runResponse = await request(app)
      .post(`/api/workflows/${workflowId}/run`)
      .set('X-API-Key', apiKey)
      .send({ input: {} });
    expect(runResponse.status).toBe(200);

    // 步骤 6: 调用工具
    const toolResponse = await request(app)
      .get('/api/tools');
    expect(toolResponse.status).toBe(200);
    expect(Array.isArray(toolResponse.body)).toBe(true);

    // 清理：删除工作流和应用
    await request(app).delete(`/api/workflows/${workflowId}`).set('X-API-Key', apiKey);
    await request(app).delete(`/api/apps/${appId}`).set('X-API-Key', apiKey);
  });

  // 更多完整流程测试...
});
```

---

### 2.3 第三阶段：数据库集成测试（P1 - 重要）

**目标**: 使用真实数据库测试，而非全 Mock

**方案 A: Test Containers（推荐）**

```bash
pnpm add -D @testcontainers/postgresql
```

```typescript
// test/global-setup.ts
import { PostgreSqlContainer } from '@testcontainers/postgresql';

let container: any;
let dbUrl: string;

export async function setup() {
  // 启动临时 PostgreSQL 容器
  container = await new PostgreSqlContainer().start();
  dbUrl = container.getConnectionUri();
  
  // 设置环境变量
  process.env.DATABASE_URL = dbUrl;
  
  // 运行迁移
  execSync('pnpm db:migrate');
}

export async function teardown() {
  await container.stop();
}
```

**方案 B: 事务回滚**

```typescript
// 每个测试用例在事务中运行，测试后回滚
beforeEach(async () => {
  await prisma.$transaction(async (tx) => {
    // 测试代码
  });
});
```

---

### 2.4 第四阶段：前端 E2E 测试（P2 - 可选）

**工具选择**: Playwright（推荐）或 Cypress

```bash
pnpm add -D @playwright/test
```

**测试场景**:
1. 创建应用流程
2. 对话功能流程
3. 工作流配置流程
4. 工具测试流程

---

## 三、测试用例统计

### 3.1 目标覆盖

| 模块 | 当前用例 | 目标用例 | 优先级 |
|------|---------|---------|--------|
| 应用管理 | 2 | 10 | P0 |
| 对话功能 | 3 | 12 | P0 |
| 工作流管理 | 2 | 15 | P0 |
| 工具管理 | 2 | 8 | P1 |
| 模型管理 | 0 | 5 | P1 |
| 完整流程 | 0 | 10 | P0 |
| **总计** | **9** | **70** | - |

### 3.2 测试类型分布

| 类型 | 占比 | 说明 |
|------|------|------|
| 功能测试 | 60% | 正常流程验证 |
| 错误处理 | 25% | 异常场景验证 |
| 认证授权 | 10% | API Key 认证 |
| 性能测试 | 5% | 响应时间验证 |

---

## 四、执行计划

### 4.1 第一阶段（1-2 天）
- ✅ 修复 Vitest 配置
- ✅ 创建数据库清理工具
- ✅ 创建全局 Setup 文件
- ✅ 运行现有测试验证

### 4.2 第二阶段（3-4 天）
- ✅ 编写应用管理测试（10 用例）
- ✅ 编写对话功能测试（12 用例）
- ✅ 编写工作流测试（15 用例）
- ✅ 编写完整流程测试（10 用例）
- ✅ 编写工具测试（8 用例）
- ✅ 编写模型测试（5 用例）

### 4.3 第三阶段（2-3 天）
- ✅ 集成 Test Containers
- ✅ 转换为真实数据库测试
- ✅ 验证测试稳定性

### 4.4 第四阶段（可选 3-5 天）
- ⏸️ 配置 Playwright
- ⏸️ 编写前端 E2E 测试
- ⏸️ CI/CD 集成

---

## 五、成功标准

### 5.1 数量指标
- ✅ 测试用例数：70+ 个
- ✅ 测试覆盖率：核心模块 85%+
- ✅ 执行时间：< 10 分钟
- ✅ 通过率：100%

### 5.2 质量指标
- ✅ 所有核心 API 端点覆盖
- ✅ 完整业务流程测试
- ✅ 错误处理完善
- ✅ 测试稳定可靠

---

## 六、运行命令

```bash
# 运行所有 E2E 测试
pnpm --filter @ai-engine/server test:e2e

# 运行特定测试文件
pnpm --filter @ai-engine/server test:e2e -- apps.e2e-spec.ts

# 运行并生成覆盖率报告
pnpm --filter @ai-engine/server test:e2e --coverage

# 监听模式运行
pnpm --filter @ai-engine/server test:e2e --watch
```

---

## 七、参考资料

- [Vitest 文档](https://vitest.dev/)
- [Supertest 文档](https://github.com/ladjs/supertest)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Test Containers](https://testcontainers.com/)
- [Playwright 文档](https://playwright.dev/)

---

> **文档版本**: v1.0  
> **创建日期**: 2026-03-16  
> **下次更新**: E2E 测试完善后  
> **维护者**: AI Engine 开发团队
