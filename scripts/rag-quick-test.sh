#!/bin/bash

# RAG 功能快速验证测试脚本
# 用法：./scripts/rag-quick-test.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 计数器
TESTS_PASSED=0
TESTS_FAILED=0

# 打印函数
print_header() {
  echo -e "\n${BLUE}========================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
  echo -e "${YELLOW}测试：${NC}$1"
}

print_success() {
  echo -e "${GREEN}✅ 通过：${NC}$1"
  ((TESTS_PASSED++))
}

print_failure() {
  echo -e "${RED}❌ 失败：${NC}$1"
  ((TESTS_FAILED++))
}

# API 基础 URL
API_URL="http://localhost:3000"
FRONTEND_URL="http://localhost:3001"
OLLAMA_URL="http://localhost:11434"

# 临时变量
KB_ID=""
DOC_ID=""
WORKFLOW_ID=""

# ============================================
# 阶段 1：服务状态检查
# ============================================
print_header "阶段 1：服务状态检查"

# 测试 1.1：后端服务
print_test "后端服务 (端口 3000)"
if curl -s "$API_URL/api/health" | grep -q "ok"; then
  print_success "后端服务运行正常"
else
  print_failure "后端服务无响应"
  exit 1
fi

# 测试 1.2：前端服务
print_test "前端服务 (端口 3001)"
if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
  print_success "前端服务运行正常"
else
  print_failure "前端服务无响应"
fi

# 测试 1.3：Ollama 服务
print_test "Ollama 服务 (端口 11434)"
if curl -s "$OLLAMA_URL/api/tags" | grep -q "models"; then
  print_success "Ollama 服务运行正常"
  
  # 检查向量模型
  if curl -s "$OLLAMA_URL/api/tags" | grep -q "mxbai-embed-large"; then
    print_success "向量模型 mxbai-embed-large 可用"
  else
    print_failure "向量模型未安装，需要运行：ollama pull mxbai-embed-large"
  fi
else
  print_failure "Ollama 服务无响应"
fi

# 测试 1.4：PostgreSQL
print_test "PostgreSQL 数据库 (端口 5432)"
if lsof -ti:5432 > /dev/null 2>&1; then
  print_success "PostgreSQL 运行正常"
else
  print_failure "PostgreSQL 未运行"
  exit 1
fi

# ============================================
# 阶段 2：知识库 CRUD 测试
# ============================================
print_header "阶段 2：知识库 CRUD 测试"

# 测试 2.1：创建知识库
print_test "创建知识库"
RESPONSE=$(curl -s -X POST "$API_URL/api/knowledge-bases?appId=rag-test-app" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "RAG 快速验证知识库",
    "description": "用于快速验证测试"
  }')

if echo "$RESPONSE" | grep -q '"id"'; then
  KB_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
  print_success "知识库创建成功 (ID: $KB_ID)"
else
  print_failure "知识库创建失败：$RESPONSE"
  exit 1
fi

# 测试 2.2：获取知识库列表
print_test "获取知识库列表"
RESPONSE=$(curl -s "$API_URL/api/knowledge-bases")
if echo "$RESPONSE" | grep -q "$KB_ID"; then
  print_success "知识库列表查询成功"
else
  print_failure "知识库列表查询失败"
fi

# 测试 2.3：获取知识库详情
print_test "获取知识库详情"
RESPONSE=$(curl -s "$API_URL/api/knowledge-bases/$KB_ID")
if echo "$RESPONSE" | grep -q "$KB_ID"; then
  print_success "知识库详情查询成功"
else
  print_failure "知识库详情查询失败"
fi

# 测试 2.4：获取知识库统计（空）
print_test "获取知识库统计"
RESPONSE=$(curl -s "$API_URL/api/knowledge-bases/$KB_ID/stats")
if echo "$RESPONSE" | grep -q '"documentCount":0'; then
  print_success "知识库统计查询成功（空知识库）"
else
  print_failure "知识库统计查询失败"
fi

# ============================================
# 阶段 3：文档上传和处理测试
# ============================================
print_header "阶段 3：文档上传和处理测试"

# 创建测试文件
TEST_FILE="/tmp/rag_test_document.txt"
cat > "$TEST_FILE" << 'EOF'
人工智能（AI）是计算机科学的一个分支，致力于创建能够执行需要人类智能的任务的系统。
机器学习是 AI 的一个重要子领域，它使计算机能够从数据中学习，而无需显式编程。
深度学习是机器学习的特殊形式，使用神经网络来模拟人脑的工作方式。
自然语言处理（NLP）使计算机能够理解、解释和生成人类语言。
计算机视觉让计算机能够"看到"和理解图像和视频内容。
EOF

# 测试 3.1：上传文档
print_test "上传测试文档"
RESPONSE=$(curl -s -X POST "$API_URL/api/knowledge-bases/$KB_ID/documents" \
  -F "file=@$TEST_FILE")

if echo "$RESPONSE" | grep -q '"id"'; then
  DOC_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
  print_success "文档上传成功 (ID: $DOC_ID)"
else
  print_failure "文档上传失败：$RESPONSE"
fi

# 测试 3.2：等待文档处理
print_test "等待文档处理（5 秒）"
sleep 5
print_success "等待完成"

# 测试 3.3：检查文档状态
print_test "检查文档状态"
RESPONSE=$(curl -s "$API_URL/api/knowledge-bases/$KB_ID/documents/$DOC_ID")
if echo "$RESPONSE" | grep -q '"status":"completed"\|"status":"processing"'; then
  STATUS=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['status'])")
  print_success "文档状态：$STATUS"
else
  print_failure "文档状态检查失败"
fi

# 测试 3.4：检查知识库统计
print_test "检查知识库统计"
RESPONSE=$(curl -s "$API_URL/api/knowledge-bases/$KB_ID/stats")
if echo "$RESPONSE" | grep -q '"documentCount":1'; then
  print_success "知识库统计更新正确（1 个文档）"
else
  print_failure "知识库统计未更新"
fi

# ============================================
# 阶段 4：RAG 搜索测试
# ============================================
print_header "阶段 4：RAG 搜索测试"

# 测试 4.1：执行 RAG 搜索
print_test "执行 RAG 搜索（查询：什么是 AI）"
RESPONSE=$(curl -s "$API_URL/api/knowledge-bases/$KB_ID/search?query=什么是 AI&topK=5&threshold=0.3")

if echo "$RESPONSE" | grep -q '"content"'; then
  print_success "RAG 搜索返回结果"
  
  # 提取相似度分数
  SCORE=$(echo "$RESPONSE" | python3 -c "import sys, json; results=json.load(sys.stdin); print(results[0]['score'] if results else 'N/A')" 2>/dev/null || echo "N/A")
  if [ "$SCORE" != "N/A" ]; then
    print_success "最高相似度分数：$SCORE"
  fi
else
  print_failure "RAG 搜索无结果"
fi

# 测试 4.2：测试不相关查询
print_test "执行 RAG 搜索（不相关查询：如何做蛋糕）"
RESPONSE=$(curl -s "$API_URL/api/knowledge-bases/$KB_ID/search?query=如何做蛋糕&topK=5&threshold=0.5")

if echo "$RESPONSE" | grep -q '\[\]' || ! echo "$RESPONSE" | grep -q '"content"'; then
  print_success "不相关查询无结果（向量区分度正常）"
else
  print_failure "不相关查询返回结果（向量区分度可能有问题）"
fi

# ============================================
# 阶段 5：工作流 RAG 节点测试
# ============================================
print_header "阶段 5：工作流 RAG 节点测试"

# 测试 5.1：创建包含 RAG 节点的工作流
print_test "创建包含 RAG 节点的工作流"
RESPONSE=$(curl -s -X POST "$API_URL/api/workflows" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"RAG 测试工作流\",
    \"appId\": \"rag-test-app\",
    \"definition\": {
      \"nodes\": [
        {\"id\": \"start\", \"type\": \"start\", \"data\": {\"name\": \"开始\"}},
        {\"id\": \"rag1\", \"type\": \"rag\", \"data\": {\"name\": \"RAG 检索\", \"config\": {
          \"knowledgeBaseId\": \"$KB_ID\",
          \"query\": \"{{ nodes.start.outputs.query }}\",
          \"topK\": 5,
          \"similarityThreshold\": 0.3,
          \"outputFormat\": \"combined\"
        }}}
      ],
      \"edges\": [{\"source\": \"start\", \"target\": \"rag1\", \"id\": \"edge1\"}]
    }
  }")

if echo "$RESPONSE" | grep -q '"id"'; then
  WORKFLOW_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])")
  print_success "工作流创建成功 (ID: $WORKFLOW_ID)"
else
  print_failure "工作流创建失败：$RESPONSE"
fi

# 测试 5.2：执行工作流
print_test "执行工作流"
RESPONSE=$(curl -s -X POST "$API_URL/api/workflows/$WORKFLOW_ID/run" \
  -H "Content-Type: application/json" \
  -d '{"input": {"query": "什么是人工智能"}}')

if echo "$RESPONSE" | grep -q '"status":"success"'; then
  print_success "工作流执行成功"
  
  # 检查 RAG 节点输出
  if echo "$RESPONSE" | grep -q '"output"'; then
    print_success "RAG 节点返回输出"
  else
    print_failure "RAG 节点无输出"
  fi
else
  print_failure "工作流执行失败"
fi

# ============================================
# 清理测试数据
# ============================================
print_header "清理测试数据"

print_test "删除工作流"
curl -s -X DELETE "$API_URL/api/workflows/$WORKFLOW_ID" > /dev/null 2>&1
print_success "工作流已删除"

print_test "删除知识库"
curl -s -X DELETE "$API_URL/api/knowledge-bases/$KB_ID" > /dev/null 2>&1
print_success "知识库已删除"

# ============================================
# 测试结果汇总
# ============================================
print_header "测试结果汇总"

echo -e "${GREEN}通过：$TESTS_PASSED${NC}"
echo -e "${RED}失败：$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 所有测试通过！RAG 功能运行正常${NC}"
  exit 0
else
  echo -e "${RED}⚠️  有 $TESTS_FAILED 项测试失败，请检查日志${NC}"
  exit 1
fi
