# Monorepo 重构计划

> **目标**：解决 Prisma 与 pnpm workspace 兼容性问题，优化项目结构  
> **执行日期**：2026-03-14  
> **预计时间**：70 分钟  
> **状态**：🔄 执行中

---

## 重构背景

### 当前问题
1. ❌ Prisma Client 生成失败（17 个 TypeScript 错误）
2. ❌ Prisma schema 在根目录，但 Client 安装在 `apps/server/node_modules/`
3. ❌ TypeScript 路径映射复杂，编译时无法正确解析
4. ❌ pnpm workspace 符号链接导致路径问题

### 重构目标
1. ✅ 将 Prisma 移至 `apps/server/prisma/`（服务层）
2. ✅ 保留 `packages/shared` 仅用于类型定义
3. ✅ 工具函数移到 `apps/server/src/common/utils/`
4. ✅ 简化 TypeScript 路径配置
5. ✅ 符合 Monorepo 最佳实践

---

## 重构后结构

```
ai-engine/
├── apps/
│   ├── server/
│   │   ├── prisma/                    # ✅ Prisma 移到这里
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── common/
│   │   │   │   ├── utils/             # ✅ 服务端工具函数
│   │   │   │   └── decorators/
│   │   │   ├── modules/               # ✅ 业务模块
│   │   │   │   ├── app/
│   │   │   │   ├── model/
│   │   │   │   ├── chat/
│   │   │   │   └── workflow/
│   │   │   └── prisma/                # ✅ PrismaService
│   │   └── package.json
│   │
│   └── web/
│       ├── src/
│       └── package.json
│
├── packages/                          # ✅ 纯代码包
│   ├── core/                          # 工作流引擎核心
│   ├── providers/                     # LLM 提供商
│   └── shared/                        # ✅ 仅类型定义
│       └── src/
│           ├── types.ts               # 通用类型
│           ├── api-types.ts           # API 类型
│           └── index.ts
│
├── docker/
├── docs/
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.json
```

---

## 详细执行步骤

### 阶段 1：准备新目录结构（5 分钟）

#### 任务清单
- [ ] 1.1.1 创建 `apps/server/src/common/utils/` 目录
- [ ] 1.1.2 创建 `apps/server/src/common/decorators/` 目录
- [ ] 1.1.3 复制工具函数到服务器端
  - [ ] `api-key.util.ts` (generateApiKey, randomString)
  - [ ] `template.util.ts` (parseTemplate, getNestedValue)
  - [ ] `common.util.ts` (sleep, isValidJson, estimateTokens)
- [ ] 1.1.4 清理 `packages/shared/src/utils.ts`
- [ ] 1.1.5 更新 `packages/shared/src/index.ts`（仅导出类型）

#### 执行命令
```bash
mkdir -p apps/server/src/common/utils
mkdir -p apps/server/src/common/decorators
```

---

### 阶段 2：移动 Prisma 文件（5 分钟）

#### 任务清单
- [ ] 2.1.1 移动 `prisma/` 目录到 `apps/server/prisma/`
- [ ] 2.1.2 验证 `schema.prisma` 配置（无需修改）
- [ ] 2.1.3 更新 `apps/server/prisma/seed.ts` 导入路径（如果有）
- [ ] 2.1.4 更新 `apps/server/package.json` scripts

#### 执行命令
```bash
mv prisma/ apps/server/prisma/
```

#### 配置文件更新
**apps/server/package.json**:
```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

---

### 阶段 3：重构 TypeScript 配置（10 分钟）

#### 任务清单
- [ ] 3.1.1 更新根目录 `tsconfig.json`
- [ ] 3.1.2 更新 `apps/server/tsconfig.json`
- [ ] 3.1.3 创建/更新 `apps/server/tsconfig.build.json`
- [ ] 3.1.4 更新 `apps/server/nest-cli.json`

#### 配置文件

**3.1.1 根目录 tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "commonjs",
    "moduleResolution": "node",
    "baseUrl": ".",
    "paths": {
      "@ai-engine/shared": ["packages/shared/src"],
      "@ai-engine/core": ["packages/core/src"],
      "@ai-engine/providers": ["packages/providers/src"]
    }
  },
  "exclude": ["node_modules", "dist", "build", ".next"]
}
```

**3.1.2 apps/server/tsconfig.json**:
```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "target": "ES2022",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./src",
    "rootDir": "./src",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": false,
    "paths": {
      "@/*": ["./*"],
      "@ai-engine/shared": ["../../packages/shared/src"],
      "@ai-engine/core": ["../../packages/core/src"],
      "@ai-engine/providers": ["../../packages/providers/src"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

**3.1.3 apps/server/tsconfig.build.json**:
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": false,
    "sourceMap": false,
    "incremental": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test", "**/*.spec.ts"]
}
```

**3.1.4 apps/server/nest-cli.json**:
```json
{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "tsConfigPath": "./tsconfig.build.json"
  }
}
```

---

### 阶段 4：更新代码导入路径（15 分钟）

#### 任务清单
- [ ] 4.1.1 更新 `apps/server/src/modules/app/app.service.ts`
  - `@ai-engine/shared` → `@/common/utils`
- [ ] 4.1.2 检查并更新所有 `apps/server/src/modules/**/*.ts`
- [ ] 4.1.3 检查 `packages/core/src/*.ts`（应保留 `@ai-engine/shared`）
- [ ] 4.1.4 检查 `packages/providers/src/*.ts`（应保留 `@ai-engine/shared`）
- [ ] 4.1.5 检查 `apps/web/src/`（如果有引用）

#### 导入路径变更表

| 原导入 | 新导入 | 位置 |
|--------|--------|------|
| `import { generateApiKey } from '@ai-engine/shared'` | `import { generateApiKey } from '@/common/utils'` | apps/server/** |
| `import { ChatMessage } from '@ai-engine/shared'` | 保持不变（类型定义） | 所有文件 |

---

### 阶段 5：重新安装依赖并生成 Prisma（10 分钟）

#### 任务清单
- [ ] 5.1.1 清理旧的 Prisma Client
- [ ] 5.1.2 重新安装依赖
- [ ] 5.1.3 生成 Prisma Client
- [ ] 5.1.4 验证数据库连接

#### 执行命令
```bash
# 清理旧的生成文件
rm -rf apps/server/node_modules/@prisma/client
rm -rf node_modules/.pnpm/@prisma+client*

# 重新安装
pnpm install

# 生成 Prisma Client
cd apps/server
pnpm db:generate
```

#### 预期输出
```
✔ Generated Prisma Client (v5.22.0) to ./../../node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client
```

---

### 阶段 6：编译验证（10 分钟）

#### 任务清单
- [ ] 6.1.1 编译服务器端
- [ ] 6.1.2 编译前端（可选）
- [ ] 6.1.3 启动开发服务器
- [ ] 6.1.4 验证 Swagger 文档

#### 执行命令
```bash
# 编译服务器
cd apps/server
npm run build

# 启动开发服务
cd /Users/lxx/Desktop/ai-engine
pnpm dev
```

#### 验证点
- [ ] NestJS 服务启动成功（端口 3000）
- [ ] Next.js 服务启动成功（端口 3001）
- [ ] 访问 http://localhost:3000/docs 显示 Swagger
- [ ] 访问 http://localhost:3000/api 返回欢迎信息
- [ ] 0 TypeScript 编译错误

---

### 阶段 7：功能测试（10 分钟）

#### 任务清单
- [ ] 7.1.1 测试应用管理 API
- [ ] 7.1.2 测试数据库操作
- [ ] 7.1.3 测试前端（如果已开发）

#### 测试命令
```bash
# 创建应用
curl -X POST http://localhost:3000/api/apps \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{"name":"测试应用","description":"测试"}'

# 获取应用列表
curl http://localhost:3000/api/apps \
  -H "X-API-Key: test-key"

# 获取模型列表
curl http://localhost:3000/api/models \
  -H "X-API-Key: test-key"
```

#### 验证点
- [ ] 应用能够正确创建（数据库中有记录）
- [ ] API Key 正确生成（格式：`sk_xxxxxxxxx`）
- [ ] 模型数据正确种子（阿里云 + Ollama）
- [ ] 返回正确的 JSON 响应

---

### 阶段 8：清理与文档（5 分钟）

#### 任务清单
- [ ] 8.1.1 清理临时文件
- [ ] 8.1.2 更新 `docs/MVP.md`
- [ ] 8.1.3 更新 `README.md`（如果存在）
- [ ] 8.1.4 Git 提交

#### 清理命令
```bash
# 删除编译产物
rm -rf apps/server/dist
rm -rf apps/server/tsconfig.build.tsbuildinfo

# 删除备份文件
rm -f apps/server/tsconfig.build.json.bak
```

#### Git 提交
```bash
git add -A
git commit -m "refactor: restructure monorepo for better Prisma support

- Move prisma directory to apps/server/prisma
- Restructure packages (shared types only, utils moved to server)
- Update TypeScript configurations
- Fix path mappings for better monorepo support
- Add server-side utility modules

BREAKING CHANGE: Import paths changed
- @ai-engine/shared utils moved to @/common/utils
- Prisma schema now in apps/server/prisma"
```

---

## 关键变更总结

### 文件移动
| 原路径 | 新路径 | 说明 |
|--------|--------|------|
| `prisma/schema.prisma` | `apps/server/prisma/schema.prisma` | Prisma 移到服务层 |
| `prisma/seed.ts` | `apps/server/prisma/seed.ts` | 种子脚本 |
| `packages/shared/src/utils.ts` | `apps/server/src/common/utils/` | 工具函数移到 server |

### 路径映射变更
| 包 | 旧路径映射 | 新路径映射 |
|----|-----------|-----------|
| Server | `@ai-engine/shared` → `../../packages/shared/src` | `@/*` → `./src/*` |
| Server | - | `@ai-engine/shared` → `../../packages/shared/src` (types only) |
| Web | `@/*` → `./src/*` | 保持不变 |

### 导入路径变更
| 原导入 | 新导入 | 位置 |
|--------|--------|------|
| `import { generateApiKey } from '@ai-engine/shared'` | `import { generateApiKey } from '@/common/utils'` | apps/server/** |
| `import { ChatMessage } from '@ai-engine/shared'` | 保持不变（类型定义） | 所有文件 |

---

## 风险与应对

### 风险 1：Prisma Client 生成失败
**概率**：低  
**应对**：
- 检查 `apps/server/package.json` 中 Prisma 版本
- 确保 `DATABASE_URL` 环境变量正确
- 使用 `pnpm --filter @ai-engine/server db:generate`

### 风险 2：TypeScript 编译错误
**概率**：中  
**应对**：
- 检查 `tsconfig.json` 的 baseUrl 和 rootDir
- 确保所有导入路径正确
- 使用 `tsc --noEmit` 检查类型错误

### 风险 3：前端引用失效
**概率**：低  
**应对**：
- 检查 `apps/web/src/` 中的导入
- 更新前端工具函数路径
- 类型定义应继续可用

### 风险 4：packages 编译失败
**概率**：低  
**应对**：
- 检查 `packages/core` 和 `packages/providers` 的 tsconfig.json
- 确保 `@ai-engine/shared` 路径正确
- 更新它们的 package.json 依赖

---

## 执行进度记录

| 阶段 | 开始时间 | 完成时间 | 实际耗时 | 状态 | 备注 |
|------|----------|----------|----------|------|------|
| 阶段 1：准备目录结构 | --:-- | --:-- | -- 分钟 | ⏳ 待开始 | - |
| 阶段 2：移动 Prisma 文件 | --:-- | --:-- | -- 分钟 | ⏳ 待开始 | - |
| 阶段 3：重构 TypeScript 配置 | --:-- | --:-- | -- 分钟 | ⏳ 待开始 | - |
| 阶段 4：更新代码导入路径 | --:-- | --:-- | -- 分钟 | ⏳ 待开始 | - |
| 阶段 5：重新安装依赖并生成 Prisma | --:-- | --:-- | -- 分钟 | ⏳ 待开始 | - |
| 阶段 6：编译验证 | --:-- | --:-- | -- 分钟 | ⏳ 待开始 | - |
| 阶段 7：功能测试 | --:-- | --:-- | -- 分钟 | ⏳ 待开始 | - |
| 阶段 8：清理与文档 | --:-- | --:-- | -- 分钟 | ⏳ 待开始 | - |

---

## 验证清单

### 编译验证
- [ ] TypeScript 编译 0 错误
- [ ] Prisma Client 正确生成
- [ ] dist/ 目录结构正确

### 服务验证
- [ ] NestJS 服务启动（端口 3000）
- [ ] Next.js 服务启动（端口 3001）
- [ ] Swagger 文档可访问（/docs）
- [ ] 健康检查接口正常（/api/health）

### 功能验证
- [ ] 应用 CRUD API 正常
- [ ] 模型 CRUD API 正常
- [ ] 数据库记录正确
- [ ] API Key 正确生成

### 代码质量
- [ ] 无 TypeScript 类型错误
- [ ] 导入路径清晰一致
- [ ] 目录结构合理
- [ ] 文档已更新

---

## 回滚方案

如果重构失败，执行以下命令回滚：

```bash
# 回滚到重构前的提交
git reset --hard <backup-commit-hash>

# 或者使用 git revert
git revert <restructure-commit-hash>
```

**备份提交**：`4a947ff` (before monorepo restructure)

---

> **文档版本**：v1.0  
> **创建日期**：2026-03-14  
> **维护方式**：每完成一个阶段，更新进度记录表格
