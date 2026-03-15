#!/bin/bash

BASE_URL="http://localhost:3000/api"

echo "========================================"
echo "Tool System Test Script"
echo "========================================"
echo ""

echo "1. Testing GET /tools - List all tools"
echo "----------------------------------------"
curl -s "$BASE_URL/tools" | python3 -m json.tool
echo ""

echo "2. Testing GET /tools/http - Get HTTP tool details"
echo "----------------------------------------"
curl -s "$BASE_URL/tools/http" | python3 -m json.tool
echo ""

echo "3. Testing POST /tools/time/execute - Get current time"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/tools/time/execute" \
  -H "Content-Type: application/json" \
  -d '{"params": {"action": "now"}}' | python3 -m json.tool
echo ""

echo "4. Testing POST /tools/time/execute - Format time"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/tools/time/execute" \
  -H "Content-Type: application/json" \
  -d '{"params": {"action": "format", "format": "yyyy-MM-dd HH:mm:ss", "timezone": "Asia/Shanghai"}}' | python3 -m json.tool
echo ""

echo "5. Testing POST /tools/http/execute - HTTP GET request"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/tools/http/execute" \
  -H "Content-Type: application/json" \
  -d '{"params": {"url": "https://httpbin.org/get", "method": "GET"}}' | python3 -m json.tool | head -30
echo ""

echo "6. Testing POST /tools/code/execute - Execute JavaScript"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/tools/code/execute" \
  -H "Content-Type: application/json" \
  -d '{"params": {"code": "const sum = [1,2,3,4,5].reduce((a,b) => a+b, 0); sum"}}' | python3 -m json.tool
echo ""

echo "7. Testing POST /tools/code/execute - Math operations"
echo "----------------------------------------"
curl -s -X POST "$BASE_URL/tools/code/execute" \
  -H "Content-Type: application/json" \
  -d '{"params": {"code": "Math.sqrt(144) * Math.PI"}}' | python3 -m json.tool
echo ""

echo "========================================"
echo "All tests completed!"
echo "========================================"
