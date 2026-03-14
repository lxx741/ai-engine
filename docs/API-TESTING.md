# API 测试指南

> API 端点测试方法和示例  
> 最后更新：2026-03-14

---

## 🚀 快速开始

### 服务地址
- **后端**: http://localhost:3000
- **Swagger 文档**: http://localhost:3000/docs

### 认证方式
大部分 API 需要 `X-API-Key` 请求头进行认证。

```bash
# 创建应用时会返回 API Key
curl -X POST http://localhost:3000/api/apps \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{"name":"测试应用"}'

# 响应中包含 API Key
{
  "apiKey": "sk_xxxxxxxxxxxxxxxx"
}
```

---

## 📋 API 端点列表

### 应用管理

#### 创建应用
```bash
curl -X POST http://localhost:3000/api/apps \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "我的 AI 助手",
    "description": "第一个 AI 应用",
    "modelId": "aliyun-default"
  }'
```

**响应示例**:
```json
{
  "id": "uuid",
  "name": "我的 AI 助手",
  "apiKey": "sk_xxxxxxxxxxxxxxxx",
  "createdAt": "2026-03-14T12:00:00.000Z"
}
```

#### 获取应用列表
```bash
curl http://localhost:3000/api/apps \
  -H "X-API-Key: your-api-key"
```

#### 获取应用详情
```bash
curl http://localhost:3000/api/apps/:id \
  -H "X-API-Key: your-api-key"
```

#### 更新应用
```bash
curl -X PATCH http://localhost:3000/api/apps/:id \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "更新后的名称"
  }'
```

#### 删除应用
```bash
curl -X DELETE http://localhost:3000/api/apps/:id \
  -H "X-API-Key: your-api-key"
```

#### 重置 API Key
```bash
curl -X POST http://localhost:3000/api/apps/:id/regenerate-key \
  -H "X-API-Key: your-api-key"
```

---

### 模型管理

#### 获取默认模型
```bash
curl http://localhost:3000/api/models/default/active
```

**响应示例**:
```json
{
  "id": "aliyun-default",
  "name": "通义千问",
  "provider": "aliyun",
  "model": "qwen-turbo",
  "isDefault": true
}
```

#### 获取模型列表
```bash
curl http://localhost:3000/api/models \
  -H "X-API-Key: your-api-key"
```

#### 创建模型
```bash
curl -X POST http://localhost:3000/api/models \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{
    "name": "Qwen2.5 7B",
    "provider": "ollama",
    "model": "qwen2.5:7b",
    "enabled": true
  }'
```

---

### 健康检查

#### 健康检查
```bash
curl http://localhost:3000/api/health
```

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-14T12:00:00.000Z"
}
```

#### 欢迎信息
```bash
curl http://localhost:3000/api
```

---

## 🧪 完整测试脚本

### 使用测试脚本
```bash
# 运行完整测试套件
/tmp/test-api.sh
```

### 手动测试
```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"

# 1. 健康检查
echo "健康检查..."
curl -s "$BASE_URL/health" | python3 -m json.tool

# 2. 获取默认模型
echo "获取默认模型..."
curl -s "$BASE_URL/models/default/active" | python3 -m json.tool

# 3. 创建应用
echo "创建应用..."
RESPONSE=$(curl -s -X POST "$BASE_URL/apps" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{"name":"测试应用"}')
echo "$RESPONSE" | python3 -m json.tool

# 提取应用 ID
APP_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")

# 4. 获取应用详情
echo "获取应用详情..."
curl -s "$BASE_URL/apps/$APP_ID" -H "X-API-Key: test-key" | python3 -m json.tool
```

---

## 📝 错误处理

### 常见错误码

| 状态码 | 说明 | 解决方法 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求体和字段格式 |
| 401 | 未授权 | 添加有效的 API Key |
| 403 | 禁止访问 | API Key 无效或无权限 |
| 404 | 资源不存在 | 检查 URL 和资源 ID |
| 500 | 服务器错误 | 查看服务器日志 |

### 错误响应示例
```json
{
  "message": "Forbidden resource",
  "error": "Forbidden",
  "statusCode": 403
}
```

---

## 🔍 调试技巧

### 1. 查看详细日志
```bash
# 查看服务器日志
tail -f /tmp/server.log
```

### 2. 使用 verbose 模式
```bash
curl -v http://localhost:3000/api/health
```

### 3. 检查数据库
```bash
# 连接 PostgreSQL
docker exec -it ai-engine-postgres psql -U aiengine -d aiengine

# 查看应用表
SELECT * FROM apps;

# 查看模型表
SELECT * FROM models;
```

---

## 📚 相关文档

- [MVP 任务清单](./MVP.md)
- [项目状态](./PROJECT-STATUS.md)
- [Swagger 文档](http://localhost:3000/docs)
