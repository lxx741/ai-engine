# RAG 知识库系统实施进度 - Week 1 Day 1

**日期**: 2026-03-20  
**阶段**: Week 1 - 基础设施  
**状态**: ✅ Day 1 完成

---

## ✅ 已完成任务

### 1. 环境准备
- [x] 安装后端依赖
  - `@nestjs/config` - 配置管理
  - `multer` - 文件上传
  - `pdf-parse` - PDF 解析（基础支持）
  - `mammoth` - DOCX 解析
  - `csv-parse` - CSV 解析
  - `tesseract.js` - OCR 支持
- [x] 安装开发依赖
  - `@types/multer` - Multer 类型定义
- [x] Ollama 向量模型拉取
  - 模型：`mxbai-embed-large` (680MB)
  - 状态：后台下载中

### 2. 类型定义（共享层）
**文件**: `packages/shared/src/types.ts`

新增类型：
- `RAGConfig` - RAG 配置接口
- `DEFAULT_RAG_CONFIG` - 默认配置
- `FileTypeRAGConfig` - 文件类型特定配置
- `FILE_TYPE_RAG_CONFIG` - 文件类型配置映射
- `FILE_SIZE_LIMITS` - 文件大小限制常量
- `KnowledgeBaseQuota` - 知识库配额
- `DocumentChunk` - 文档分块
- `RAGSearchResult` - RAG 搜索结果
- `KnowledgeDocument` - 知识库文档
- `KnowledgeBase` - 知识库
- `RAGNodeConfig` - RAG 节点配置
- `UploadDocumentOptions` - 上传选项
- `OCROptions` - OCR 选项

**配置默认值**:
```typescript
{
  chunkSize: 500,        // tokens
  chunkOverlap: 50,      // tokens
  similarityThreshold: 0.3,
  maxResults: 10,
  separators: ['\n\n', '\n', '.', '!', '?', ' ']
}
```

### 3. 数据库迁移
**文件**: `apps/server/prisma/schema.prisma`

新增模型：
- `KnowledgeBase` - 知识库表
  - 每应用一个知识库（`@@unique([appId])`）
  - JSON 配置字段存储 RAG 配置
- `Document` - 文档表
  - 支持 5 种文件类型：pdf, docx, txt, json, csv
  - 状态追踪：pending, processing, completed, failed
- `DocumentChunk` - 分块表
  - 向量嵌入：`Float[]` (Pgvector)
  - 索引优化：`@@index([embedding])`

**迁移文件**: `migrations/20260320114653_add_knowledge_base_rag/migration.sql`

### 4. 核心服务实现

#### 4.1 VectorService
**文件**: `apps/server/src/modules/knowledge-base/vector.service.ts`

功能：
- `generateEmbedding(text)` - 生成单个嵌入
- `generateEmbeddings(texts)` - 批量生成（批次大小：5）
- `cosineSimilarity(vec1, vec2)` - 余弦相似度计算

集成：
- Ollama API: `http://localhost:11434/api/embeddings`
- 模型：`mxbai-embed-large`

#### 4.2 ChunkingService
**文件**: `apps/server/src/modules/knowledge-base/chunking.service.ts`

功能：
- `chunkText(text, config, fileType)` - 文本分块
- `recursiveChunk()` - 递归分块算法
- `splitBySeparator()` - 按分隔符分割
- `applyOverlap()` - 应用重叠
- `estimateTokenCount()` - Token 数估算

策略：
- 按文件类型使用不同配置
- 递归字符分割（优先级：段落 → 行 → 句子 → 词）
- 重叠保持上下文

#### 4.3 FileParser
**文件**: `apps/server/src/modules/knowledge-base/utils/file-parser.ts`

支持格式：
- ✅ TXT - 直接读取
- ✅ JSON - 转换为可读文本
- ✅ CSV - 解析为键值对
- ✅ DOCX - 使用 mammoth 解析
- ⚠️  PDF - 占位符（需要额外配置）
- ✅ OCR - Tesseract 集成框架

#### 4.4 DocumentService
**文件**: `apps/server/src/modules/knowledge-base/document.service.ts`

功能：
- `upload()` - 文档上传和处理
- `processDocument()` - 异步文档处理（分块 + 嵌入）
- `checkQuota()` - 配额检查
- `findById()` - 按 ID 查询
- `findByKnowledgeBase()` - 按知识库查询
- `delete()` - 删除文档

限制：
- 单文件最大：10MB
- 单知识库最大：500MB
- 单知识库最多文件数：100

#### 4.5 KnowledgeBaseService
**文件**: `apps/server/src/modules/knowledge-base/knowledge-base.service.ts`

功能：
- `create()` - 创建知识库
- `findByAppId()` - 按应用 ID 查询
- `update()` - 更新知识库
- `delete()` - 删除知识库
- `search()` - 向量相似度搜索
- `getStats()` - 统计信息

搜索：
- 使用 Pgvector `<->` 运算符
- 余弦相似度计算
- 阈值过滤

### 5. Controller 和 Module

#### KnowledgeBaseController
**文件**: `apps/server/src/modules/knowledge-base/knowledge-base.controller.ts`

API 端点：
- `POST /api/knowledge-bases` - 创建知识库
- `GET /api/knowledge-bases/by-app/:appId` - 按应用查询
- `GET /api/knowledge-bases/:id` - 按 ID 查询
- `PATCH /api/knowledge-bases/:id` - 更新知识库
- `DELETE /api/knowledge-bases/:id` - 删除知识库
- `GET /api/knowledge-bases/:id/stats` - 统计信息
- `GET /api/knowledge-bases/:id/search` - 搜索
- `GET /api/knowledge-bases/:id/documents` - 获取文档列表
- `POST /api/knowledge-bases/:id/documents` - 上传文档
- `GET /api/knowledge-bases/:id/documents/:docId` - 获取文档
- `DELETE /api/knowledge-bases/:id/documents/:docId` - 删除文档

#### KnowledgeBaseModule
**文件**: `apps/server/src/modules/knowledge-base/knowledge-base.module.ts`

已注册到：`apps/server/src/app.module.ts`

---

## ⚠️ 待解决问题

### 1. PDF 解析
**问题**: pdf-parse 库 ESM/CJS 兼容性
**临时方案**: 返回占位符文本
**解决方案**:
- 选项 1: 使用 pdfjs-dist (Mozilla PDF.js)
- 选项 2: 使用微服务进行 PDF 转换
- 选项 3: 使用命令行工具 (pdftotext)

### 2. OCR 功能
**状态**: 框架已搭建，需要 PDF 转图片
**依赖**: 需要 pdf2image 或类似库
**优先级**: 中（可后期完善）

### 3. Ollama 模型
**状态**: 后台下载中
**模型**: mxbai-embed-large (680MB)
**预计时间**: 5-10 分钟（取决于网络）

---

## 📊 代码统计

| 类别 | 数量 |
|------|------|
| 新增文件 | 9 |
| 修改文件 | 3 |
| 代码行数 | ~1500 |
| API 端点 | 11 |
| 服务类 | 5 |
| DTO 类 | 6 |

---

## 🎯 下一步计划 (Day 2)

### Agent 1 (基础设施)
- [ ] 测试数据库迁移
- [ ] 验证 Ollama 向量模型
- [ ] 编写服务单元测试
- [ ] 完善 PDF 解析（可选）

### Agent 2 (RAG 工具)
- [ ] 创建 RAG 工具 (`rag-tool.ts`)
- [ ] 实现 RAG 节点执行器
- [ ] 集成到工作流系统
- [ ] 创建前端配置类型

### Agent 3 (前端界面)
- [ ] 创建知识库管理页面框架
- [ ] 创建 hooks (`use-knowledge-bases`, `use-documents`)
- [ ] 设计 UI 组件结构

---

## 🧪 测试计划

### 单元测试
- [ ] VectorService 测试
- [ ] ChunkingService 测试
- [ ] FileParser 测试
- [ ] DocumentService 测试

### 集成测试
- [ ] API 端点测试
- [ ] 文件上传流程测试
- [ ] 向量搜索测试

### E2E 测试
- [ ] 创建知识库流程
- [ ] 上传文档流程
- [ ] 搜索测试

---

## 📝 技术决策记录

### 1. 向量模型选择
**决策**: mxbai-embed-large  
**理由**: 
- M4 性能足够
- 准确性优于 nomic-embed-text
- 1024 维嵌入，语义捕捉更好

### 2. 分块策略
**决策**: 递归字符分块  
**理由**:
- 保持语义完整性
- 支持多种语言
- 可配置分隔符优先级

### 3. 向量数据库
**决策**: Pgvector  
**理由**:
- 已有 PostgreSQL 基础设施
- 无需额外部署
- 性能足够（<100ms @ 10k chunks）

### 4. 配额限制
**决策**: 
- 单文件：10MB
- 单知识库：500MB（可扩展至 1GB）
- 文件数：100

**理由**:
- 平衡存储成本和实用性
- 支持扩展

---

**下一步**: 继续 Week 1 Day 2 实施
