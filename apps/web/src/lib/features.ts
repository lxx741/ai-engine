// Feature Flags for AI Engine

export const FEATURES = {
  /**
   * 可视化工作流编辑器
   * 启用后，新建/编辑工作流时使用 React Flow 可视化编辑器
   * 默认：false（使用经典表单编辑器）
   */
  VISUAL_EDITOR: process.env.NEXT_PUBLIC_FEATURE_VISUAL_EDITOR === 'true',

  /**
   * 知识库 RAG 功能
   * 启用后，显示知识库管理界面
   * 默认：false
   */
  KNOWLEDGE_BASE: process.env.NEXT_PUBLIC_FEATURE_KNOWLEDGE_BASE === 'true',

  /**
   * Agent 模式
   * 启用后，显示 Agent 创建和管理界面
   * 默认：false
   */
  AGENT_MODE: process.env.NEXT_PUBLIC_FEATURE_AGENT_MODE === 'true',

  /**
   * 日志监控中心
   * 启用后，显示统计面板和日志查询
   * 默认：false
   */
  ANALYTICS: process.env.NEXT_PUBLIC_FEATURE_ANALYTICS === 'true',
} as const;

export type FeatureKey = keyof typeof FEATURES;

/**
 * 检查某个功能是否启用
 * @param key 功能键名
 */
export function isFeatureEnabled(key: FeatureKey): boolean {
  return FEATURES[key];
}

/**
 * 获取所有功能开关状态
 */
export function getAllFeatures(): Record<FeatureKey, boolean> {
  return FEATURES;
}
