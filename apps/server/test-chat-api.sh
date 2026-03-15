#!/bin/bash

# Chat API 测试脚本
# 使用方法：./test-chat-api.sh

BASE_URL="http://localhost:3000/api"
API_KEY="test-key"

echo "======================================"
echo "  Chat API 测试脚本"
echo "======================================"
echo ""

# 检查服务器是否运行
echo "🔍 检查服务器状态..."
if ! curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$BASE_URL/health" | grep -q "200\|404"; then
  echo "❌ 服务器未运行或无法访问"
  echo "请先启动服务器：cd apps/server && npx ts-node -r tsconfig-paths/register src/main.ts"
  exit 1
fi
echo "✅ 服务器运行正常"
echo ""

# 测试 1: 创建会话
echo "📝 测试 1: 创建会话"
echo "POST $BASE_URL/chat/sessions"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/chat/sessions" \
  -H "Content-Type: application/json" \
  -d '{"appId": "test-app-id"}')
echo "$CREATE_RESPONSE" | jq .
SESSION_ID=$(echo "$CREATE_RESPONSE" | jq -r '.id // empty')

if [ -z "$SESSION_ID" ]; then
  echo "⚠️  无法创建会话（可能是数据库未配置）"
  echo "跳过后续需要会话 ID 的测试"
  echo ""
else
  echo "✅ 会话创建成功，ID: $SESSION_ID"
  echo ""

  # 测试 2: 获取会话列表
  echo "📋 测试 2: 获取会话列表"
  echo "GET $BASE_URL/chat/sessions"
  curl -s "$BASE_URL/chat/sessions" | jq .
  echo ""

  # 测试 3: 获取会话详情
  echo "📄 测试 3: 获取会话详情"
  echo "GET $BASE_URL/chat/sessions/$SESSION_ID"
  curl -s "$BASE_URL/chat/sessions/$SESSION_ID" | jq .
  echo ""

  # 测试 4: 获取消息历史
  echo "💬 测试 4: 获取消息历史"
  echo "GET $BASE_URL/chat/sessions/$SESSION_ID/messages"
  curl -s "$BASE_URL/chat/sessions/$SESSION_ID/messages" | jq .
  echo ""

  # 测试 5: 发送消息（非流式）
  echo "✉️  测试 5: 发送消息（非流式）"
  echo "POST $BASE_URL/chat/completions"
  curl -s -X POST "$BASE_URL/chat/completions" \
    -H "Content-Type: application/json" \
    -d "{
      \"conversationId\": \"$SESSION_ID\",
      \"message\": \"你好\"
    }" | jq .
  echo ""

  # 测试 6: 发送消息（流式）- 只显示前 5 行
  echo "🌊 测试 6: 发送消息（流式）"
  echo "POST $BASE_URL/chat/completions/stream"
  echo "（只显示前 5 行）"
  curl -s -X POST "$BASE_URL/chat/completions/stream" \
    -H "Content-Type: application/json" \
    -d "{
      \"conversationId\": \"$SESSION_ID\",
      \"message\": \"你好\"
    }" | head -5
  echo ""

  # 测试 7: 删除会话
  echo "🗑️  测试 7: 删除会话"
  echo "DELETE $BASE_URL/chat/sessions/$SESSION_ID"
  curl -s -X DELETE "$BASE_URL/chat/sessions/$SESSION_ID" | jq .
  echo ""
fi

# 测试 8: 错误处理 - 400 错误
echo "❌ 测试 8: 错误处理 - 400 错误（缺少参数）"
echo "POST $BASE_URL/chat/completions"
curl -s -X POST "$BASE_URL/chat/completions" \
  -H "Content-Type: application/json" \
  -d '{}' | jq .
echo ""

# 测试 9: 错误处理 - 404 错误
echo "❌ 测试 9: 错误处理 - 404 错误（会话不存在）"
echo "GET $BASE_URL/chat/sessions/non-existent-id"
curl -s "$BASE_URL/chat/sessions/non-existent-id" | jq .
echo ""

# 测试 10: Swagger 文档
echo "📚 测试 10: 检查 Swagger 文档"
echo "GET $BASE_URL/docs"
if curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/docs" | grep -q "200"; then
  echo "✅ Swagger 文档可访问：http://localhost:3000/docs"
else
  echo "❌ Swagger 文档不可访问"
fi
echo ""

echo "======================================"
echo "  测试完成"
echo "======================================"
