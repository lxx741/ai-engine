# 代码规范

## TypeScript Configuration

| 配置项             | Server        | Web    |
| ------------------ | ------------- | ------ |
| Target             | ES2022        | ESNext |
| Module             | CommonJS      | ESM    |
| Strict Null Checks | false         | true   |
| Path Aliases       | @ai-engine/\* | @/\*   |

## Import Conventions

**顺序：**

1. 外部包 (`@nestjs/common`)
2. 内部模块 (`@ai-engine/core`)
3. 相对导入 (`../../`)

**规范：**

- NestJS 使用桶导出：`import { Module, Injectable } from '@nestjs/common'`
- 相对导入省略 `.ts` 扩展名

```typescript
// ✅ 正确
import { Module, Injectable } from '@nestjs/common';
import { getProviderFactory } from '@ai-engine/providers';
import { PrismaService } from '../../prisma/prisma.service';
```

## Naming Conventions

| 类型      | 规范             | 示例                        |
| --------- | ---------------- | --------------------------- |
| 文件      | kebab-case       | `chat.service.ts`           |
| 类/接口   | PascalCase       | `ChatService`, `User`       |
| 变量/函数 | camelCase        | `userId`, `getData()`       |
| 常量      | UPPER_SNAKE_CASE | `MAX_RETRIES`, `API_KEY`    |
| 组件      | PascalCase       | `ChatBox`, `WorkflowEditor` |

## Formatting (Prettier)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always"
}
```

## Error Handling

**NestJS:**

```typescript
private readonly logger = new Logger(ChatService.name);

try {
  await this.riskyOperation();
} catch (error) {
  this.logger.error(`Operation failed: ${error instanceof Error ? error.message : 'Unknown'}`);
  throw error;
}
```

**要点：**

- 使用 NestJS 内置 HTTP 异常和过滤器
- 异步操作使用 try-catch + 日志记录
- Logger 使用静态 `name` 属性

## Testing Conventions

**框架：** Vitest

**文件命名：**

- `*.spec.ts` - NestJS 服务/控制器
- `*.test.ts` - Packages

**测试结构：**

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(() => {
    // 直接实例化（不使用 TestingModule）
    service = new ChatService(mockPrisma, mockMessage);
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
```

**要点：**

- Mocks：`vi.mock()` 用于模块，`vi.fn()` 用于 spies
- Setup：直接实例化 + 模拟依赖
- Async：使用 async/await 模式
