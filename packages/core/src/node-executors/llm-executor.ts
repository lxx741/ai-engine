import { INodeExecutor, ExecutionContext, NodeExecuteResult } from '../workflow-executor';
import { getProviderFactory } from '@ai-engine/providers';
import { parseTemplate } from '@ai-engine/shared';

export class LLMNodeExecutor implements INodeExecutor {
  canExecute(nodeType: string): boolean {
    return nodeType === 'llm';
  }

  async execute(config: any, context: ExecutionContext): Promise<NodeExecuteResult> {
    try {
      const startTime = Date.now();
      
      const providerFactory = getProviderFactory();
      
      const modelId = config.modelId || 'ollama:qwen3.5:9b';
      
      const provider = providerFactory.getProviderForModel(modelId);
      const modelName = providerFactory.getModelName(modelId);
      
      const promptTemplate = config.prompt || '';
      const parsedPrompt = parseTemplate(promptTemplate, context.variables);
      
      const response = await provider.chatComplete?.(
        {
          messages: [
            { role: 'user', content: parsedPrompt },
          ],
          model: modelName,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
        },
        {
          provider: provider.name as any,
          model: modelName,
        }
      );

      const duration = Date.now() - startTime;

      return {
        success: true,
        output: {
          content: response?.content || '',
          usage: response?.usage,
          duration,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
