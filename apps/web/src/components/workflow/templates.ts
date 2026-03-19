import type { WorkflowNode, WorkflowEdge } from '@/hooks/use-workflows';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'customer-service' | 'content-generation' | 'data-analysis' | 'automation';
  icon: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'customer-service-bot',
    name: '智能客服机器人',
    description: '处理客户咨询、问题分类、自动回复',
    category: 'customer-service',
    icon: 'Headphones',
    nodes: [
      { id: 'start', type: 'start', config: { name: '用户输入', outputs: [{ name: 'query', type: 'string' }] } },
      { id: 'llm-classify', type: 'llm', config: { name: '问题分类', modelId: 'qwen-turbo', prompt: '请分类以下用户问题类型：{{ nodes.start.outputs.query }}\n类型包括：技术咨询、售后支持、产品咨询、其他' } },
      { id: 'condition', type: 'condition', config: { name: '判断类别', expression: 'nodes.llm-classify.output' } },
      { id: 'llm-tech', type: 'llm', config: { name: '技术回答', modelId: 'qwen-turbo', prompt: '作为技术支持专家，回答：{{ nodes.start.outputs.query }}' } },
      { id: 'llm-support', type: 'llm', config: { name: '售后回答', modelId: 'qwen-turbo', prompt: '作为售后客服，回答：{{ nodes.start.outputs.query }}' } },
      { id: 'end', type: 'end', config: { name: '输出回复', outputs: [{ name: 'answer', value: '{{ nodes.llm-tech.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'llm-classify' },
      { id: 'e2', source: 'llm-classify', target: 'condition' },
      { id: 'e3', source: 'condition', target: 'llm-tech', condition: 'tech' },
      { id: 'e4', source: 'condition', target: 'llm-support', condition: 'support' },
      { id: 'e5', source: 'llm-tech', target: 'end' },
      { id: 'e6', source: 'llm-support', target: 'end' },
    ],
  },
  {
    id: 'article-generator',
    name: '文章生成器',
    description: '根据主题自动生成高质量文章',
    category: 'content-generation',
    icon: 'FileText',
    nodes: [
      { id: 'start', type: 'start', config: { name: '输入主题', outputs: [{ name: 'topic', type: 'string' }, { name: 'keywords', type: 'string' }] } },
      { id: 'llm-outline', type: 'llm', config: { name: '生成大纲', modelId: 'qwen-turbo', prompt: '为主题 "{{ nodes.start.outputs.topic }}" 生成文章大纲，关键词：{{ nodes.start.outputs.keywords }}' } },
      { id: 'llm-expand', type: 'llm', config: { name: '扩展内容', modelId: 'qwen-turbo', prompt: '根据以下大纲撰写完整文章：\n{{ nodes.llm-outline.output }}' } },
      { id: 'llm-polish', type: 'llm', config: { name: '润色优化', modelId: 'qwen-turbo', prompt: '润色以下文章，使其更流畅专业：\n{{ nodes.llm-expand.output }}' } },
      { id: 'end', type: 'end', config: { name: '输出文章', outputs: [{ name: 'article', value: '{{ nodes.llm-polish.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'llm-outline' },
      { id: 'e2', source: 'llm-outline', target: 'llm-expand' },
      { id: 'e3', source: 'llm-expand', target: 'llm-polish' },
      { id: 'e4', source: 'llm-polish', target: 'end' },
    ],
  },
  {
    id: 'social-media-post',
    name: '社交媒体文案',
    description: '生成适合各平台的营销文案',
    category: 'content-generation',
    icon: 'Share2',
    nodes: [
      { id: 'start', type: 'start', config: { name: '产品信息', outputs: [{ name: 'product', type: 'string' }, { name: 'platform', type: 'string' }] } },
      { id: 'llm-analyze', type: 'llm', config: { name: '分析受众', modelId: 'qwen-turbo', prompt: '分析{{ nodes.start.outputs.platform }}平台的用户特点和喜好' } },
      { id: 'llm-write', type: 'llm', config: { name: '撰写文案', modelId: 'qwen-turbo', prompt: '为产品 "{{ nodes.start.outputs.product }}" 撰写{{ nodes.start.outputs.platform }}风格的营销文案，参考：{{ nodes.llm-analyze.output }}' } },
      { id: 'end', type: 'end', config: { name: '输出文案', outputs: [{ name: 'copy', value: '{{ nodes.llm-write.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'llm-analyze' },
      { id: 'e2', source: 'llm-analyze', target: 'llm-write' },
      { id: 'e3', source: 'llm-write', target: 'end' },
    ],
  },
  {
    id: 'sentiment-analysis',
    name: '情感分析',
    description: '分析文本情感倾向并分类',
    category: 'data-analysis',
    icon: 'BarChart3',
    nodes: [
      { id: 'start', type: 'start', config: { name: '输入文本', outputs: [{ name: 'text', type: 'string' }] } },
      { id: 'llm-sentiment', type: 'llm', config: { name: '情感判断', modelId: 'qwen-turbo', prompt: '分析以下文本的情感倾向（正面/负面/中性）并说明理由：{{ nodes.start.outputs.text }}' } },
      { id: 'condition', type: 'condition', config: { name: '情感分类', expression: 'nodes.llm-sentiment.output' } },
      { id: 'tool-positive', type: 'tool', config: { name: '正面处理', toolName: 'http', params: { action: 'positive' } } },
      { id: 'tool-negative', type: 'tool', config: { name: '负面处理', toolName: 'http', params: { action: 'negative' } } },
      { id: 'end', type: 'end', config: { name: '输出结果', outputs: [{ name: 'sentiment', value: '{{ nodes.llm-sentiment.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'llm-sentiment' },
      { id: 'e2', source: 'llm-sentiment', target: 'condition' },
      { id: 'e3', source: 'condition', target: 'tool-positive', condition: 'positive' },
      { id: 'e4', source: 'condition', target: 'tool-negative', condition: 'negative' },
      { id: 'e5', source: 'tool-positive', target: 'end' },
      { id: 'e6', source: 'tool-negative', target: 'end' },
    ],
  },
  {
    id: 'data-extraction',
    name: '数据提取',
    description: '从非结构化文本提取结构化数据',
    category: 'data-analysis',
    icon: 'Database',
    nodes: [
      { id: 'start', type: 'start', config: { name: '输入文本', outputs: [{ name: 'text', type: 'string' }] } },
      { id: 'llm-extract', type: 'llm', config: { name: '提取数据', modelId: 'qwen-turbo', prompt: '从以下文本提取关键信息（姓名、电话、邮箱、地址），返回 JSON 格式：{{ nodes.start.outputs.text }}' } },
      { id: 'tool-validate', type: 'tool', config: { name: '验证格式', toolName: 'code', params: { code: 'validate_json(input)' } } },
      { id: 'end', type: 'end', config: { name: '输出数据', outputs: [{ name: 'data', value: '{{ nodes.llm-extract.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'llm-extract' },
      { id: 'e2', source: 'llm-extract', target: 'tool-validate' },
      { id: 'e3', source: 'tool-validate', target: 'end' },
    ],
  },
  {
    id: 'email-automation',
    name: '邮件自动回复',
    description: '自动处理 incoming 邮件并回复',
    category: 'automation',
    icon: 'Mail',
    nodes: [
      { id: 'start', type: 'start', config: { name: '收到邮件', outputs: [{ name: 'sender', type: 'string' }, { name: 'subject', type: 'string' }, { name: 'body', type: 'string' }] } },
      { id: 'llm-classify', type: 'llm', config: { name: '邮件分类', modelId: 'qwen-turbo', prompt: '分类这封邮件：主题="{{ nodes.start.outputs.subject }}"，内容="{{ nodes.start.outputs.body }}"\n类别：咨询、投诉、合作、垃圾邮件' } },
      { id: 'condition', type: 'condition', config: { name: '判断类别', expression: 'nodes.llm-classify.output' } },
      { id: 'llm-reply-consult', type: 'llm', config: { name: '回复咨询', modelId: 'qwen-turbo', prompt: '回复这封咨询邮件，礼貌专业：{{ nodes.start.outputs.body }}' } },
      { id: 'llm-reply-complaint', type: 'llm', config: { name: '回复投诉', modelId: 'qwen-turbo', prompt: '回复这封投诉邮件，表达歉意并提供解决方案：{{ nodes.start.outputs.body }}' } },
      { id: 'tool-spam', type: 'tool', config: { name: '标记垃圾', toolName: 'http', params: { action: 'mark_spam' } } },
      { id: 'end', type: 'end', config: { name: '发送邮件', outputs: [{ name: 'reply', value: '{{ nodes.llm-reply-consult.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'llm-classify' },
      { id: 'e2', source: 'llm-classify', target: 'condition' },
      { id: 'e3', source: 'condition', target: 'llm-reply-consult', condition: 'consult' },
      { id: 'e4', source: 'condition', target: 'llm-reply-complaint', condition: 'complaint' },
      { id: 'e5', source: 'condition', target: 'tool-spam', condition: 'spam' },
      { id: 'e6', source: 'llm-reply-consult', target: 'end' },
      { id: 'e7', source: 'llm-reply-complaint', target: 'end' },
    ],
  },
  {
    id: 'meeting-scheduler',
    name: '会议安排助手',
    description: '协调多方时间自动安排会议',
    category: 'automation',
    icon: 'Calendar',
    nodes: [
      { id: 'start', type: 'start', config: { name: '会议请求', outputs: [{ name: 'participants', type: 'array' }, { name: 'duration', type: 'string' }, { name: 'topic', type: 'string' }] } },
      { id: 'tool-check-availability', type: 'tool', config: { name: '检查空闲时间', toolName: 'http', params: { endpoint: '/calendar/availability' } } },
      { id: 'llm-propose', type: 'llm', config: { name: '提议时间', modelId: 'qwen-turbo', prompt: '根据可用时间{{ nodes.tool-check-availability.output }}，提议 3 个会议时间' } },
      { id: 'end', type: 'end', config: { name: '发送提议', outputs: [{ name: 'proposals', value: '{{ nodes.llm-propose.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'tool-check-availability' },
      { id: 'e2', source: 'tool-check-availability', target: 'llm-propose' },
      { id: 'e3', source: 'llm-propose', target: 'end' },
    ],
  },
  {
    id: 'code-reviewer',
    name: '代码审查助手',
    description: '自动审查代码并提供改进建议',
    category: 'automation',
    icon: 'Code',
    nodes: [
      { id: 'start', type: 'start', config: { name: '输入代码', outputs: [{ name: 'code', type: 'string' }, { name: 'language', type: 'string' }] } },
      { id: 'llm-analyze', type: 'llm', config: { name: '代码分析', modelId: 'qwen-turbo', prompt: '审查以下{{ nodes.start.outputs.language }}代码，找出问题和改进建议：\n{{ nodes.start.outputs.code }}' } },
      { id: 'llm-suggest', type: 'llm', config: { name: '生成建议', modelId: 'qwen-turbo', prompt: '基于分析结果，给出具体的代码改进建议和示例：{{ nodes.llm-analyze.output }}' } },
      { id: 'end', type: 'end', config: { name: '输出报告', outputs: [{ name: 'review', value: '{{ nodes.llm-suggest.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'llm-analyze' },
      { id: 'e2', source: 'llm-analyze', target: 'llm-suggest' },
      { id: 'e3', source: 'llm-suggest', target: 'end' },
    ],
  },
  {
    id: 'translation-workflow',
    name: '多语言翻译',
    description: '高质量文档翻译工作流',
    category: 'content-generation',
    icon: 'Languages',
    nodes: [
      { id: 'start', type: 'start', config: { name: '输入文档', outputs: [{ name: 'text', type: 'string' }, { name: 'sourceLang', type: 'string' }, { name: 'targetLang', type: 'string' }] } },
      { id: 'llm-translate', type: 'llm', config: { name: '初步翻译', modelId: 'qwen-turbo', prompt: '将以下文本从{{ nodes.start.outputs.sourceLang }}翻译到{{ nodes.start.outputs.targetLang }}：{{ nodes.start.outputs.text }}' } },
      { id: 'llm-review', type: 'llm', config: { name: '翻译审校', modelId: 'qwen-turbo', prompt: '审校以下翻译的准确性和流畅性：{{ nodes.llm-translate.output }}' } },
      { id: 'llm-polish', type: 'llm', config: { name: '最终润色', modelId: 'qwen-turbo', prompt: '根据审校意见润色翻译：{{ nodes.llm-translate.output }}' } },
      { id: 'end', type: 'end', config: { name: '输出翻译', outputs: [{ name: 'translation', value: '{{ nodes.llm-polish.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'llm-translate' },
      { id: 'e2', source: 'llm-translate', target: 'llm-review' },
      { id: 'e3', source: 'llm-review', target: 'llm-polish' },
      { id: 'e4', source: 'llm-polish', target: 'end' },
    ],
  },
  {
    id: 'lead-qualification',
    name: '销售线索筛选',
    description: '自动评估和分类销售线索',
    category: 'automation',
    icon: 'Users',
    nodes: [
      { id: 'start', type: 'start', config: { name: '线索信息', outputs: [{ name: 'company', type: 'string' }, { name: 'budget', type: 'string' }, { name: 'needs', type: 'string' }] } },
      { id: 'llm-score', type: 'llm', config: { name: '线索评分', modelId: 'qwen-turbo', prompt: '评估销售线索质量（1-10 分）：公司={{ nodes.start.outputs.company }}, 预算={{ nodes.start.outputs.budget }}, 需求={{ nodes.start.outputs.needs }}' } },
      { id: 'condition', type: 'condition', config: { name: '分数判断', expression: 'nodes.llm-score.output >= 7' } },
      { id: 'tool-high-priority', type: 'tool', config: { name: '高优先级', toolName: 'http', params: { action: 'high_priority' } } },
      { id: 'tool-follow-up', type: 'tool', config: { name: '后续跟进', toolName: 'http', params: { action: 'follow_up' } } },
      { id: 'end', type: 'end', config: { name: '输出结果', outputs: [{ name: 'qualification', value: '{{ nodes.llm-score.output }}' }] } },
    ],
    edges: [
      { id: 'e1', source: 'start', target: 'llm-score' },
      { id: 'e2', source: 'llm-score', target: 'condition' },
      { id: 'e3', source: 'condition', target: 'tool-high-priority', condition: 'true' },
      { id: 'e4', source: 'condition', target: 'tool-follow-up', condition: 'false' },
      { id: 'e5', source: 'tool-high-priority', target: 'end' },
      { id: 'e6', source: 'tool-follow-up', target: 'end' },
    ],
  },
];

export function getTemplatesByCategory(category: string): WorkflowTemplate[] {
  return WORKFLOW_TEMPLATES.filter((t) => t.category === category);
}

export function searchTemplates(keyword: string): WorkflowTemplate[] {
  const lowerKeyword = keyword.toLowerCase();
  return WORKFLOW_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerKeyword) ||
      t.description.toLowerCase().includes(lowerKeyword)
  );
}
