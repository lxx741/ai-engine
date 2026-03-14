# 变更日志

本文档记录项目的所有重要变更。

---

## [2026-03-14] Monorepo 重构

### 重构目标
解决 Prisma 与 pnpm workspace 兼容性问题

### 主要变更
- 移动 `prisma/` 目录到 `apps/server/prisma/`
- 精简 `packages/shared` 为仅类型定义
- 工具函数移至 `apps/server/src/common/utils/`
- 更新 TypeScript 路径映射
  - `@/*` → `apps/server/src/*`
  - `@ai-engine/shared` → `packages/shared/src`（仅类型）

### 技术细节
- Prisma Client 生成位置：`node_modules/.pnpm/@prisma+client@5.22.0/node_modules/@prisma/client`
- TypeScript 编译错误：从 17 个减少到 0 个
- 重构耗时：40 分钟

### 导入路径变更
```typescript
// 之前
import { generateApiKey } from '@ai-engine/shared';

// 之后
import { generateApiKey } from '@/common/utils';
```

详见：[RESTRUCTURE-PLAN.md](./RESTRUCTURE-PLAN.md)

---

## [2026-03-14] 阶段 2 完成

### 完成内容
- ✅ 应用管理 API（CRUD + API Key 认证）
- ✅ 模型管理 API（CRUD + 默认模型）
- ✅ 数据库迁移完成
- ✅ API Key 认证机制实现
- ✅ Swagger 文档集成

### 数据库模型
- App（应用表）
- Model（模型配置表）
- Conversation（会话表）
- Message（消息表）
- Workflow（工作流表）
- WorkflowRun（工作流执行记录表）
- AuditLog（审计日志表）

### API 端点
- POST/GET/PATCH/DELETE /api/apps
- POST/GET/PATCH/DELETE /api/models
- GET /api/models/default/active

---

## [2026-03-14] 项目初始化

### 完成内容
- ✅ Monorepo 架构（pnpm workspace）
- ✅ NestJS 后端框架
- ✅ Next.js 前端框架
- ✅ Docker 环境（PostgreSQL + Redis）
- ✅ TypeScript 配置
- ✅ ESLint + Prettier
- ✅ shadcn/ui 组件库

### 技术栈
- 后端：NestJS 10 + TypeScript + Prisma
- 前端：Next.js 14 + React + shadcn/ui
- 数据库：PostgreSQL 16 + pgvector
- 缓存：Redis 7
- 包管理：pnpm workspace
