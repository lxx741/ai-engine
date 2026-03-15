# AI 应用引擎 MVP 开发任务清单

> 企业级类扣子、Dify AI 应用引擎项目
> 
> **技术栈**: NestJS + Next.js + PostgreSQL + Redis + pnpm Monorepo  
> **UI 框架**: shadcn/ui + TailwindCSS  
> **AI 服务**: 阿里云百炼平台 + Ollama 本地模型  
> **开发模式**: 单人 + 多智能体并行协作  
> **目标周期**: 2-4 周 MVP

---

## 项目结构

```
ai-engine/
├── apps/
│   ├── server/              # NestJS 后端 (端口 3000)
│   │   ├── prisma/          # Prisma ORM（schema + migrations）
│   │   └── src/
│   │       ├── common/      # 服务端工具函数
│   │       ├── modules/     # 业务模块（app, model, chat, workflow）
│   │       └── prisma/      # PrismaService
│   └── web/                 # Next.js 前端 (端口 3001)
├── packages/
│   ├── core/                # 核心引擎（工作流执行器）
│   ├── providers/           # LLM 提供商（阿里云、Ollama）
│   └── shared/              # 共享类型定义（仅 types）
├── docker/
├── docs/
└── prisma/                  # 已移至 apps/server/prisma/
```

---

## 阶段 1：项目初始化（预计 2-3 天）

### 1.1 Monorepo 架构搭建
- [x] **1.1.1** 创建项目根目录结构 ✅ 2026-03-14
  - `apps/` (server, web)
  - `packages/` (core, providers, shared)
  - `docker/`
  - `prisma/`

- [x] **1.1.2** 配置 pnpm workspace ✅ 2026-03-14
  - 根目录 `package.json` (workspace 配置)
  - `pnpm-workspace.yaml`
  - `.npmrc` (pnpm 配置)

- [x] **1.1.3** TypeScript 根配置 ✅ 2026-03-14
  - `tsconfig.json` (基础配置)
  - `tsconfig.server.json`
  - `tsconfig.web.json`

- [x] **1.1.4** ESLint + Prettier 统一配置 ✅ 2026-03-14
  - `.eslintrc.js`
  - `.prettierrc`
  - `.eslintignore` / `.prettierignore`

- [x] **1.1.5** Git 配置 ✅ 2026-03-14
  - `.gitignore`
  - `.gitattributes`

### 1.2 Docker 环境搭建
- [x] **1.2.1** PostgreSQL 容器配置 ✅ 2026-03-14
  - `docker-compose.yml` (PostgreSQL 16 + pgvector 扩展)
  - 初始化脚本
  - 数据卷持久化

- [x] **1.2.2** Redis 容器配置 ✅ 2026-03-14
  - Redis 7+ 配置
  - 密码认证（可选）

- [x] **1.2.3** 一键启动脚本 ✅ 2026-03-14
  - `docker-compose up -d`
  - 健康检查
  - `scripts/dev-setup.sh`

- [x] **1.2.4** 环境配置模板 ✅ 2026-03-14
  - `.env.example`
  - `.env.local` (本地开发)

### 1.3 后端服务初始化 (NestJS)
- [x] **1.3.1** NestJS 项目创建 ✅ 2026-03-14
  - `apps/server` 目录初始化
  - NestJS CLI 脚手架
  - 基础模块结构

- [x] **1.3.2** Prisma ORM 集成 ✅ 2026-03-14
  - `prisma/schema.prisma` 数据库模型
  - Prisma Client 生成
  - 数据库迁移脚本

- [x] **1.3.3** 基础依赖安装 ✅ 2026-03-14
  - `@nestjs/*` 核心模块
  - `prisma` + `@prisma/client`
  - `winston` (日志)
  - `class-validator` + `class-transformer`
  - `@nestjs/config` (配置管理)
  - `@nestjs/swagger` (API 文档)

- [x] **1.3.4** 项目结构规范 ✅ 2026-03-14
  - 模块目录结构
  - DTO 规范
  - 响应格式统一

- [x] **1.3.5** 开发服务器配置 ✅ 2026-03-14
  - `nest-cli.json`
  - `tsconfig.build.json`
  - `scripts/dev:server.sh`

### 1.4 前端服务初始化 (Next.js)
- [x] **1.4.1** Next.js 项目创建 ✅ 2026-03-14
  - `apps/web` 目录初始化
  - Next.js 14 App Router
  - TypeScript 配置

- [x] **1.4.2** shadcn/ui 集成 ✅ 2026-03-14
  - TailwindCSS 配置
  - shadcn/ui CLI 初始化
  - 基础组件安装 (Button, Input, Card, Label)

- [x] **1.4.3** 状态管理 ✅ 2026-03-14
  - Zustand 或 Jotai (轻量级状态)
  - React Query (数据获取)

- [x] **1.4.4** API 客户端 ✅ 2026-03-14
  - Axios 或 Fetch 封装
  - API Hook 封装
  - 错误处理

- [x] **1.4.5** 开发服务器配置 ✅ 2026-03-14
  - `next.config.js`
  - `tailwind.config.js`
  - `scripts/dev:web.sh`

### 1.5 共享包初始化
- [x] **1.5.1** `packages/shared` 创建 ✅ 2026-03-14
  - 通用工具函数
  - 类型定义
  - 常量配置

- [x] **1.5.2** `packages/core` 创建 ✅ 2026-03-14
  - 工作流引擎核心接口
  - 执行器抽象类

- [x] **1.5.3** `packages/providers` 创建 ✅ 2026-03-14
  - LLM 提供商抽象接口
  - 阿里云百炼适配器
  - Ollama 适配器

### 1.6 开发工具链
- [x] **1.6.1** 统一启动脚本 ✅ 2026-03-14
  - `package.json` scripts
  - `pnpm dev` (同时启动前后端)
  - `pnpm dev:server` / `pnpm dev:web`

- [x] **1.6.2** Docker 开发环境 ✅ 2026-03-14
  - 热重载配置
  - 调试配置

- [x] **1.6.3** API 文档 ✅ 2026-03-14
  - Swagger UI 配置
  - OpenAPI 规范

---

## 阶段 2：应用管理模块 ✅ 已完成（2026-03-14）

### 2.1 数据库模型 ✅
- [x] **2.1.1** App 模型定义 ✅ 2026-03-14
  - 字段：id, name, description, apiKey, modelId, config, timestamps
  - 索引优化

- [x] **2.1.2** Model 模型定义 ✅ 2026-03-14
  - 字段：id, name, provider, model, config, enabled, isDefault, timestamps
  - 预置模型数据种子（阿里云 + Ollama）

- [x] **2.1.3** 数据库迁移 ✅ 2026-03-14
  - Prisma migrate
  - Seed 数据脚本

### 2.2 后端 API ✅
- [x] **2.2.1** Auth 模块 ✅ 2026-03-14
  - API Key 认证中间件
  - `@Public()` 装饰器
  - ApiKeyGuard

- [x] **2.2.2** App 模块 - 控制器 ✅ 2026-03-14
  - `POST /api/apps` (创建应用)
  - `GET /api/apps` (应用列表)
  - `GET /api/apps/:id` (应用详情)
  - `PATCH /api/apps/:id` (更新应用)
  - `DELETE /api/apps/:id` (删除应用)
  - `POST /api/apps/:id/regenerate-key` (重置 API Key)

- [x] **2.2.3** App 模块 - 服务层 ✅ 2026-03-14
  - AppService CRUD
  - API Key 生成逻辑
  - Prisma 集成

- [x] **2.2.4** App 模块 - DTO ✅ 2026-03-14
  - CreateAppDto
  - UpdateAppDto
  - AppResponseDto

- [x] **2.2.5** Model 模块 ✅ 2026-03-14
  - `GET /api/models` (模型列表)
  - `GET /api/models/default/active` (默认模型)
  - ModelService CRUD

### 2.3 前端界面 ⏳ 待开发
- [ ] **2.3.1** 应用列表页
- [ ] **2.3.2** 应用创建/编辑表单
- [ ] **2.3.3** 应用详情页
- [ ] **2.3.4** API 客户端封装

---

## 阶段 3：对话引擎 ✅ 已完成（2026-03-15）

### 3.1 数据库模型 ✅
- [x] **3.1.1** Conversation 模型 ✅ 2026-03-15
- [x] **3.1.2** Message 模型 ✅ 2026-03-15

### 3.2 LLM 提供商抽象层 ✅
- [x] **3.2.1** Provider 接口定义 ✅ 2026-03-15
- [x] **3.2.2** 阿里云百炼 Provider ✅ 2026-03-15
- [x] **3.2.3** Ollama Provider ✅ 2026-03-15
- [x] **3.2.4** Provider 工厂 ✅ 2026-03-15

### 3.3 对话服务层 ✅
- [x] **3.3.1** Chat 模块 - 服务 ✅ 2026-03-15
- [x] **3.3.2** 流式响应实现 ⚠️ 需修复（Observable 返回类型）
- [x] **3.3.3** 会话管理 ✅ 2026-03-15
- [x] **3.3.4** 消息存储 ✅ 2026-03-15

### 3.4 对话 API ✅
- [x] **3.4.1** RESTful 接口 ✅ 2026-03-15
- [x] **3.4.2** SSE 流式接口 ⚠️ 需修复
- [x] **3.4.3** DTO 定义 ✅ 2026-03-15

### 3.5 前端对话界面 ✅
- [x] **3.5.1** 对话列表页 ✅ 2026-03-15
- [x] **3.5.2** 对话窗口 ✅ 2026-03-15
- [x] **3.5.3** 输入框组件 ✅ 2026-03-15
- [x] **3.5.4** SSE 客户端 ✅ 2026-03-15

### 完成内容
- ✅ Ollama qwen3.5:9b 本地模型集成
- ✅ 对话 API（非流式）
- ✅ 会话管理和消息存储
- ✅ 前端应用管理页面（/apps, /apps/new, /apps/[id]）
- ✅ API Key 复制功能

### 已知问题
- ⚠️ Ollama qwen3.5:9b 响应时间约 30-40 秒（模型较大）
- ⚠️ SSE 流式响应需要修复（Observable 返回类型）

---

## 阶段 4：工作流引擎 ⚠️ 部分完成（后端 80%，2026-03-15）

### 4.1 数据库模型 ✅
- [x] **4.1.1** Workflow 模型 ✅ 2026-03-15
- [x] **4.1.2** WorkflowRun 模型 ✅ 2026-03-15

### 4.2 工作流数据模型设计 ✅
- [x] **4.2.1** 节点类型定义 ✅ 2026-03-15
- [x] **4.2.2** 边定义 ✅ 2026-03-15
- [x] **4.2.3** 工作流定义 ✅ 2026-03-15

### 4.3 工作流执行引擎 (`packages/core`) ✅
- [x] **4.3.1** 执行器核心 ✅ 2026-03-15
- [x] **4.3.2** 节点执行器 ✅ 2026-03-15
  - [x] StartNodeExecutor
  - [x] LLMNodeExecutor
  - [x] HTTPNodeExecutor
  - [x] ConditionNodeExecutor
  - [x] EndNodeExecutor
- [x] **4.3.3** 变量系统 ✅ 2026-03-15
- [x] **4.3.4** 执行上下文 ✅ 2026-03-15

### 4.4 工作流 API ✅
- [x] **4.4.1** Workflow CRUD ✅ 2026-03-15
- [x] **4.4.2** 工作流执行 ✅ 2026-03-15
- [x] **4.4.3** 执行记录查询 ✅ 2026-03-15

### 4.5 前端工作流界面 ⏳
- [ ] **4.5.1** 工作流列表页 ⏳ 待开发
- [ ] **4.5.2** 工作流配置页（配置式）⏳ 待开发
- [ ] **4.5.3** 工作流执行页 ⏳ 待开发
- [ ] **4.5.4** React Flow 只读展示（可选 P1）⏳ 待开发

### 完成内容（后端）
- ✅ 数据库模型（Workflow + WorkflowRun）
- ✅ 完整的类型定义（10+ 个类型）
- ✅ 5 种节点执行器
- ✅ 变量系统（多作用域）
- ✅ 模板解析（支持表达式）
- ✅ 工作流执行引擎（DAG 调度）
- ✅ 工作流 API（8 个端点）

### 待完成（前端）
- ⏳ 工作流列表页
- ⏳ 配置式编辑页
- ⏳ 执行记录展示

### 已知问题
- ⚠️ 前端界面未实现（需通过 API 操作）
- ⚠️ 条件表达式较简单
- ⚠️ 无循环支持（仅支持 DAG）

---

## 阶段 5：工具系统（预计 3-4 天）

### 5.1 工具抽象层
- [ ] **5.1.1** Tool 接口定义
  ```typescript
  interface Tool {
    name: string;
    description: string;
    parameters: JsonSchema;
    execute(params: Record<string, any>): Promise<any>;
  }
  ```

- [ ] **5.1.2** 工具注册表
  - `ToolRegistry.register()`
  - `ToolRegistry.get()`
  - 工具列表查询

### 5.2 内置工具实现
- [ ] **5.2.1** HTTP 请求工具
  - GET/POST/PUT/DELETE
  - 请求头配置
  - 响应处理
  - 超时控制

- [ ] **5.2.2** 代码执行工具（沙箱）
  - Node.js vm 模块
  - 执行超时
  - 资源限制
  - 安全隔离

- [ ] **5.2.3** 时间工具
  - 当前时间
  - 时间格式化
  - 时区转换

### 5.3 工具集成
- [ ] **5.3.1** 工作流工具节点
  - 工具选择下拉框
  - 参数配置表单
  - 动态表单生成（基于 JSON Schema）

- [ ] **5.3.2** LLM 工具调用（可选 P1）
  - Function Calling 支持
  - 工具自动选择

---

## 阶段 6：完善优化（预计 3-4 天）

### 6.1 日志系统
- [ ] **6.1.1** Winston 配置
  - 控制台输出
  - 文件输出（按日切分）
  - 日志级别

- [ ] **6.1.2** 请求日志
  - HTTP 请求中间件
  - 响应时间记录
  - 错误日志

- [ ] **6.1.3** 审计日志
  - 关键操作记录
  - 用户行为追踪

### 6.2 监控与统计
- [ ] **6.2.1** 基础统计 API
  - `GET /api/stats/overview` (总览)
  - 调用次数统计
  - Token 消耗统计

- [ ] **6.2.2** 应用级统计
  - 单应用调用记录
  - 模型使用分布

### 6.3 前端优化
- [ ] **6.3.1** 响应式布局
  - 移动端适配
  - 侧边栏折叠

- [ ] **6.3.2** 加载状态
  - Skeleton 骨架屏
  - Loading 动画

- [ ] **6.3.3** 错误边界
  - React Error Boundary
  - 错误页面

### 6.4 文档
- [ ] **6.4.1** API 文档
  - Swagger UI 完善
  - 示例请求/响应

- [ ] **6.4.2** 部署文档
  - `README.md`
  - `docs/deployment.md`
  - 环境变量说明

- [ ] **6.4.3** 开发文档
  - `docs/development.md`
  - 架构说明
  - 贡献指南

---

## 阶段 7：测试与部署（预计 2-3 天）

### 7.1 测试
- [ ] **7.1.1** 单元测试
  - Jest 配置
  - 服务层测试
  - Provider 测试

- [ ] **7.1.2** 集成测试
  - API 端到端测试
  - 数据库测试

- [ ] **7.1.3** 前端测试
  - React Testing Library
  - 组件测试

### 7.2 Docker 部署
- [ ] **7.2.1** 生产镜像构建
  - 多阶段构建
  - 镜像优化

- [ ] **7.2.2** Docker Compose 生产配置
  - 环境变量注入
  - 数据卷持久化
  - 网络隔离

- [ ] **7.2.3** 一键部署脚本
  - `scripts/deploy.sh`
  - 健康检查

### 7.3 性能优化
- [ ] **7.3.1** 数据库优化
  - 索引优化
  - 查询优化

- [ ] **7.3.2** 缓存策略
  - Redis 缓存
  - 热点数据缓存

---

## 任务统计

| 阶段 | 原计划 | 已完成 | 待完成 | 状态 |
|------|--------|--------|--------|------|
| 1. 项目初始化 | ~30 | ~30 | 0 | ✅ 完成 |
| 2. 应用管理 | ~15 | ~10 | ~5（前端）| ✅ 后端完成 |
| 3. 对话引擎 | ~30 | ~25 | ~5（SSE）| ✅ 完成 |
| 4. 工作流引擎 | ~25 | ~20 | ~5（前端）| ⚠️ 后端完成 |
| 5. 工具系统 | ~10 | 0 | ~10 | ⏳ 待开始 |
| 6. 完善优化 | ~15 | 0 | ~15 | ⏳ 待开始 |
| 7. 测试与部署 | ~10 | 0 | ~10 | ⏳ 待开始 |
| **总计** | **~135** | **~85** | **~50** | **63% 完成** |

---

## MVP 最小可用版本（2 周快速验证）

如果要在 **2 周内** 完成最小可用版本，优先完成以下任务：

- ✅ 阶段 1：项目初始化（全部）
- ✅ 阶段 2：应用管理（全部）
- ✅ 阶段 3：对话引擎（100%）
- ✅ 阶段 4：工作流引擎（后端 80%）

**P1 任务可延后**：
- ❌ 工具系统（HTTP/代码执行）
- ❌ 工作流前端界面
- ❌ React Flow 可视化
- ❌ 统计监控
- ❌ 完善文档

---

## 多智能体分工建议

| SubAgent | 负责任务 | 预计工作量 |
|----------|----------|------------|
| **Agent 1 - 后端** | 阶段 1.3/1.5 + 阶段 2.2 + 阶段 3.3/3.4 | 40% |
| **Agent 2 - 前端** | 阶段 1.4 + 阶段 2.3 + 阶段 3.5 | 30% |
| **Agent 3 - AI 服务** | 阶段 3.2 (Provider) + 阶段 4.3 (执行引擎) | 20% |
| **Agent 4 - 运维** | 阶段 1.2 + 阶段 7 (测试部署) | 10% |

---

## 开发进度记录

| 阶段 | 开始日期 | 结束日期 | 状态 | 完成度 |
|------|----------|----------|------|--------|
| 1. 项目初始化 | 2026-03-14 | 2026-03-14 | ✅ 完成 | 100% |
| 2. 应用管理 | 2026-03-14 | 2026-03-14 | ✅ 完成 | 100%（后端）|
| 3. 对话引擎 | 2026-03-15 | 2026-03-15 | ✅ 完成 | 100% |
| 4. 工作流引擎 | 2026-03-15 | 2026-03-15 | ⚠️ 部分 | 80%（后端）|
| 5. 工具系统 | - | - | ⏳ 待开始 | 0% |
| 6. 完善优化 | - | - | ⏳ 待开始 | 0% |
| 7. 测试与部署 | - | - | ⏳ 待开始 | 0% |

**总体进度**: 3.8/7 阶段完成 (54.2%)

---

## 相关文档

- [CHANGELOG.md](./CHANGELOG.md) - 项目变更日志
- [PROJECT-STATUS.md](./PROJECT-STATUS.md) - 项目状态详情
- [API-TESTING.md](./API-TESTING.md) - API 测试记录
- [RESTRUCTURE-PLAN.md](./RESTRUCTURE-PLAN.md) - Monorepo 重构计划

---

> 文档版本：v2.0  
> 最后更新：2026-03-15  
> 维护方式：每完成一项任务，更新对应复选框状态 `[ ]` → `[x]`

---

## 最近完成记录

### 阶段 3：对话引擎 ✅ (2026-03-15)
**完成内容**:
- Ollama qwen3.5:9b 本地模型集成
- 对话 API（非流式）
- 会话管理和消息存储
- 前端应用管理页面（/apps, /apps/new, /apps/[id]）
- API Key 复制功能

**服务状态**:
- 后端：http://localhost:3000 ✅
- 前端：http://localhost:3001 ✅
- Ollama: http://localhost:11434 ✅

---

### 阶段 4：工作流引擎 ⚠️ (2026-03-15)
**完成内容（后端 80%）**:
- 数据库模型（Workflow + WorkflowRun）
- 完整的类型定义（10+ 个类型）
- 5 种节点执行器（start/llm/http/condition/end）
- 变量系统和模板解析
- 工作流执行引擎（DAG 调度）
- 工作流 API（8 个端点）

**待完成**:
- 前端工作流界面

**API 端点**:
- POST/GET/PATCH/DELETE /api/workflows
- POST /api/workflows/:id/run
- GET /api/workflows/:id/runs
- GET /api/workflows/runs/:runId

**已知问题**:
- 前端界面未实现（需通过 API 操作）
- 条件表达式较简单
- 无循环支持（仅支持 DAG）
