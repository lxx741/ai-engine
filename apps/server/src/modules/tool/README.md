# Tool System Implementation

## 概述

工具系统提供了可扩展的工具抽象层，支持 HTTP 请求、代码执行和时间操作等内置工具。

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      ToolModule                              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐    ┌─────────────────┐                 │
│  │  ToolRegistry   │    │   ToolService   │                 │
│  │                 │    │                 │                 │
│  │ - register()    │    │ - listTools()   │                 │
│  │ - get()         │    │ - getTool()     │                 │
│  │ - execute()     │    │ - executeTool() │                 │
│  └────────┬────────┘    └────────┬────────┘                 │
│           │                      │                          │
│           └──────────┬───────────┘                          │
│                      │                                      │
│           ┌──────────┴───────────┐                          │
│           │   ToolController     │                          │
│           │                      │                          │
│           │ GET /api/tools       │                          │
│           │ GET /api/tools/:name │                          │
│           │ POST /api/tools/:name/execute                  │
│           └──────────────────────┘                          │
└─────────────────────────────────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
    ┌────▼────┐  ┌────▼────┐  ┌────▼────┐
    │HttpTool │  │CodeTool │  │TimeTool │
    └─────────┘  └─────────┘  └─────────┘
```

## 文件结构

```
apps/server/src/modules/tool/
├── tool.interface.ts       # Tool 接口定义
├── tool.registry.ts        # 工具注册表
├── tool.service.ts         # 工具服务
├── tool.controller.ts      # API 控制器
├── tool.module.ts          # NestJS 模块
├── dto/
│   └── tool.dto.ts         # DTO 定义
└── tools/
    ├── http-tool.ts        # HTTP 请求工具
    ├── code-tool.ts        # 代码执行工具
    └── time-tool.ts        # 时间工具
```

## API 端点

### 获取工具列表
```bash
GET /api/tools
```

### 获取工具详情
```bash
GET /api/tools/:name
```

### 执行工具
```bash
POST /api/tools/:name/execute
Content-Type: application/json

{
  "params": { ... }
}
```

## 内置工具

### 1. HTTP 工具

发送 HTTP 请求（GET/POST/PUT/DELETE/PATCH）

**参数**:
- `url` (required): 请求 URL
- `method` (required): HTTP 方法
- `headers` (optional): 请求头
- `body` (optional): 请求体
- `query` (optional): 查询参数
- `timeout` (optional): 超时时间（毫秒），默认 5000

**示例**:
```bash
curl -X POST http://localhost:3000/api/tools/http/execute \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "url": "https://api.example.com/data",
      "method": "POST",
      "headers": {"Content-Type": "application/json"},
      "body": {"key": "value"},
      "timeout": 5000
    }
  }'
```

### 2. 代码工具

在安全沙箱中执行 JavaScript 代码

**参数**:
- `code` (required): JavaScript 代码
- `timeout` (optional): 执行超时（毫秒），默认 3000
- `memoryLimit` (optional): 内存限制（字节），默认 10MB

**示例**:
```bash
curl -X POST http://localhost:3000/api/tools/code/execute \
  -H "Content-Type: application/json" \
  -d '{
    "params": {
      "code": "const result = [1,2,3].map(x => x * 2); result"
    }
  }'
```

**安全特性**:
- 使用 vm2 沙箱隔离
- 限制全局对象（仅允许 console、Math、Date 等安全对象）
- 禁止文件系统访问
- 禁止网络访问
- 超时控制
- 内存限制

### 3. 时间工具

时间获取、格式化、时区转换和计算

**参数**:
- `action` (required): 操作类型
  - `now`: 获取当前时间
  - `format`: 格式化时间
  - `convert`: 时区转换
  - `add`: 增加时间
  - `subtract`: 减少时间
- `format` (optional): 时间格式字符串
- `timezone` (optional): 时区，默认 UTC
- `date` (optional): 输入日期（ISO 格式）
- `unit` (optional): 时间单位（days/hours/minutes）
- `value` (optional): 增加/减少的值

**示例**:
```bash
# 获取当前时间
curl -X POST http://localhost:3000/api/tools/time/execute \
  -H "Content-Type: application/json" \
  -d '{"params": {"action": "now"}}'

# 格式化时间
curl -X POST http://localhost:3000/api/tools/time/execute \
  -H "Content-Type: application/json" \
  -d '{"params": {"action": "format", "format": "yyyy-MM-dd HH:mm:ss", "timezone": "Asia/Shanghai"}}'

# 时区转换
curl -X POST http://localhost:3000/api/tools/time/execute \
  -H "Content-Type: application/json" \
  -d '{"params": {"action": "convert", "date": "2026-03-15T12:00:00Z", "timezone": "America/New_York"}}'

# 增加天数
curl -X POST http://localhost:3000/api/tools/time/execute \
  -H "Content-Type: application/json" \
  -d '{"params": {"action": "add", "unit": "days", "value": 7}}'
```

## 集成到工作流

工具节点可以在工作流中使用：

```json
{
  "id": "tool-node-1",
  "type": "tool",
  "config": {
    "toolName": "http",
    "params": {
      "url": "https://api.example.com/data",
      "method": "GET"
    }
  }
}
```

## 自定义工具

实现 `Tool` 接口并注册到 `ToolRegistry`:

```typescript
import { Tool } from './tool.interface';

class MyCustomTool implements Tool {
  name = 'myTool';
  description = 'My custom tool description';
  parameters = {
    type: 'object',
    properties: {
      param1: { type: 'string', description: 'Parameter 1' },
    },
    required: ['param1'],
  };

  async execute(params: Record<string, any>): Promise<any> {
    // 实现工具逻辑
    return { result: 'success' };
  }
}

// 在 ToolService 中注册
this.toolRegistry.register(new MyCustomTool());
```

## 测试

运行测试脚本：
```bash
cd apps/server
./test-tools.sh
```

## Swagger 文档

访问 http://localhost:3000/docs 查看完整的 API 文档。

## 依赖

- `ajv`: JSON Schema 验证
- `vm2`: JavaScript 沙箱
- `date-fns`: 日期时间处理
- `date-fns-tz`: 时区支持
