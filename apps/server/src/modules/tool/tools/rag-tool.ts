import { Tool, ToolExecutionResult } from '../tool.interface';
import { Injectable } from '@nestjs/common';
import { KnowledgeBaseService } from '../../knowledge-base/knowledge-base.service';

/**
 * RAG (Retrieval-Augmented Generation) Search Tool
 * 
 * Usage in workflow:
 * {
 *   "name": "rag_search",
 *   "knowledgeBaseId": "kb-id-here",
 *   "query": "{{ nodes.start.outputs.question }}",
 *   "topK": 5,
 *   "threshold": 0.3
 * }
 */
@Injectable()
export class RagTool implements Tool {
  name = 'rag_search';
  description = 'Search knowledge base for relevant information using RAG (Retrieval-Augmented Generation). Returns relevant chunks with similarity scores.';
  
  parameters = {
    type: 'object',
    properties: {
      knowledgeBaseId: {
        type: 'string',
        description: 'ID of the knowledge base to search in',
      },
      query: {
        type: 'string',
        description: 'Search query (supports variable references)',
      },
      topK: {
        type: 'number',
        description: 'Maximum number of results to return',
        default: 5,
        minimum: 1,
        maximum: 100,
      },
      threshold: {
        type: 'number',
        description: 'Minimum similarity threshold (0-1)',
        default: 0.3,
        minimum: 0,
        maximum: 1,
      },
    },
    required: ['knowledgeBaseId', 'query'],
  } as const;

  constructor(
    private kbService: KnowledgeBaseService,
  ) {}

  async execute(params: Record<string, any>): Promise<ToolExecutionResult> {
    try {
      const { knowledgeBaseId, query, topK = 5, threshold = 0.3 } = params;

      if (!knowledgeBaseId) {
        return {
          success: false,
          error: 'knowledgeBaseId is required',
        };
      }

      if (!query) {
        return {
          success: false,
          error: 'query is required',
        };
      }

      // Search in knowledge base
      const results = await this.kbService.search(knowledgeBaseId, {
        query,
        topK,
        threshold,
      });

      if (results.length === 0) {
        return {
          success: true,
          data: {
            query,
            results: [],
            message: 'No relevant documents found',
          },
        };
      }

      // Format results for LLM consumption
      const formattedResults = results.map((r: any) => ({
        content: r.content,
        score: r.score,
        source: r.document.name,
        fileType: r.document.fileType,
      }));

      // Combine context for LLM
      const combinedContext = formattedResults
        .map((r: any, i: number) => 
          `[Source ${i + 1}: ${r.source} (${r.fileType}) - Score: ${r.score.toFixed(3)}]\n${r.content}`
        )
        .join('\n\n');

      return {
        success: true,
        data: {
          query,
          results: formattedResults,
          combinedContext,
          resultCount: results.length,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
