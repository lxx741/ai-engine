# Chat API 文档

本文档描述了 AI Engine 的对话 API 端点使用方法。

## 基础信息

- **Base URL**: `http://localhost:3000/api`
- **认证方式**: 通过 Header 传递 `X-API-Key`
- **数据格式**: JSON

## API 端点列表

### 1. 发送消息（非流式）

**端点**: `POST /api/chat/completions`

发送消息并获取完整的 AI 响应。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| conversationId | string | 是 | 会话 ID |
| message | string | 是 | 消息内容 |
| userId | string | 否 | 用户 ID（可选） |

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/chat/completions \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "conversationId": "test-conversation-id",
    "message": "你好"
  }'
```

#### 响应示例

```json
{
  "content": "你好！有什么我可以帮助你的吗？",
  "usage": {
    "promptTokens": 10,
    "completionTokens": 20,
    "totalTokens": 30
  }
}
```

---

### 2. 发送消息（SSE 流式）

**端点**: `POST /api/chat/completions/stream`

发送消息并通过 SSE（Server-Sent Events）流式接收 AI 响应。

#### 请求参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| conversationId | string | 是 | 会话 ID |
| message | string | 是 | 消息内容 |
| userId | string | 否 | 用户 ID（可选） |

#### 请求示例

```bash
curl -X POST http://localhost:3000/api/chat/completions/stream \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-key" \
  -d '{
    "conversationId": "test-conversation-id",
    "message": "你好"
  }'
```

#### 响应示例（SSE 事件流）

```
data: {"content":"你"}
data: {"content":"好"}
data: {"content":"！"}
data: {"content":"有","finishReason":"stop","usage":{"promptTokens":10,"completionTokens":20,"totalTokens":30}}
data: {"type":"done"}
```

#### 流式响应说明

- 每个 SSE 事件包含一个 `data` 字段
- `content`: 当前 chunk 的文本内容
- `finishReason`: 结束原因，值为 `stop` 表示响应完成
- `usage`: token 使用统计（仅在最后一个 chunk 中）
- `type: done`: 表示流式传输完成

---

### 3. 会话列表

**端点**: `GET /api/chat/sessions`

获取所有会话列表（支持分页）。

#### 请求参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | 否 | 1 | 页码 |
| pageSize | number | 否 | 20 | 每页数量 |

#### 请求示例

```bash
curl http://localhost:3000/api/chat/sessions \
  -H "X-API-Key: test-key"
```

#### 响应示例

```json
{
  "data": [
    {
      "id": "session-1",
      "appId": "app-1",
      "metadata": { "title": "新对话" },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pageSize": 20,
  "totalPages": 5
}
```

---

### 4. 会话详情

**端点**: `GET /api/chat/sessions/:id`

获取指定会话的详细信息。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 会话 ID |

#### 请求示例

```bash
curl http://localhost:3000/api/chat/sessions/session-id \
  -H "X-API-Key: test-key"
```

#### 响应示例

```json
{
  "id": "session-id",
  "appId": "app-1",
  "metadata": { "title": "新对话" },
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 5. 消息历史

**端点**: `GET /api/chat/sessions/:id/messages`

获取指定会话的消息历史记录。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 会话 ID |

#### 查询参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| limit | number | 否 | 50 | 返回消息数量 |

#### 请求示例

```bash
curl http://localhost:3000/api/chat/sessions/session-id/messages \
  -H "X-API-Key: test-key"
```

#### 响应示例

```json
[
  {
    "id": "msg-1",
    "role": "user",
    "content": "你好",
    "tokens": 5,
    "metadata": {},
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "msg-2",
    "role": "assistant",
    "content": "你好！有什么我可以帮助你的吗？",
    "tokens": 20,
    "metadata": { "modelId": "qwen-turbo" },
    "createdAt": "2024-01-01T00:00:01.000Z"
  }
]
```

---

### 6. 删除会话

**端点**: `DELETE /api/chat/sessions/:id`

删除指定的对话会话。

#### 路径参数

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string | 是 | 会话 ID |

#### 请求示例

```bash
curl -X DELETE http://localhost:3000/api/chat/sessions/session-id \
  -H "X-API-Key: test-key"
```

#### 响应示例

```json
{
  "message": "Conversation \"session-id\" deleted successfully"
}
```

---

## 错误码说明

| 状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误（如缺少必填参数） |
| 403 | 未授权（API Key 无效或缺失） |
| 404 | 资源不存在（如会话 ID 不存在） |
| 500 | 服务器内部错误 |

### 错误响应格式

```json
{
  "statusCode": 400,
  "message": "conversationId 是必填参数",
  "error": "Bad Request"
}
```

---

## 完整测试脚本

```bash
#!/bin/bash

BASE_URL="http://localhost:3000/api"
API_KEY="test-key"

echo "=== 1. 创建会话 ==="
CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/chat/sessions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d '{"appId": "test-app-id"}')
echo "$CREATE_RESPONSE"
SESSION_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id')
echo "Session ID: $SESSION_ID"

echo ""
echo "=== 2. 获取会话列表 ==="
curl -s "${BASE_URL}/chat/sessions" \
  -H "X-API-Key: ${API_KEY}" | jq .

echo ""
echo "=== 3. 获取会话详情 ==="
curl -s "${BASE_URL}/chat/sessions/${SESSION_ID}" \
  -H "X-API-Key: ${API_KEY}" | jq .

echo ""
echo "=== 4. 发送消息（非流式） ==="
curl -s -X POST "${BASE_URL}/chat/completions" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d "{
    \"conversationId\": \"${SESSION_ID}\",
    \"message\": \"你好\"
  }" | jq .

echo ""
echo "=== 5. 获取消息历史 ==="
curl -s "${BASE_URL}/chat/sessions/${SESSION_ID}/messages" \
  -H "X-API-Key: ${API_KEY}" | jq .

echo ""
echo "=== 6. 发送消息（流式） ==="
curl -s -X POST "${BASE_URL}/chat/completions/stream" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ${API_KEY}" \
  -d "{
    \"conversationId\": \"${SESSION_ID}\",
    \"message\": \"请讲一个故事\"
  }"

echo ""
echo "=== 7. 删除会话 ==="
curl -s -X DELETE "${BASE_URL}/chat/sessions/${SESSION_ID}" \
  -H "X-API-Key: ${API_KEY}" | jq .
```

---

## Swagger 文档

启动服务后，访问以下地址查看完整的 Swagger 文档：

- **Swagger UI**: `http://localhost:3000/docs`
- **JSON 文档**: `http://localhost:3000/docs-json`

---

## 注意事项

1. **API Key**: 所有请求都需要在 Header 中包含 `X-API-Key`
2. **会话 ID**: 发送消息前需要先创建会话或提供有效的会话 ID
3. **流式响应**: SSE 流式响应需要使用支持 EventSource 的客户端
4. **消息历史**: 默认返回最近 50 条消息，可通过 `limit` 参数调整
5. **分页**: 会话列表支持分页，默认每页 20 条
