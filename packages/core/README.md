# Workflow Executor

## Usage

```typescript
import { createWorkflowExecutor } from '@ai-engine/core';

// Create executor
const executor = createWorkflowExecutor({
  timeout: 60000,
  maxRetries: 2,
});

// Define workflow
const workflow = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      name: 'Start',
      config: {
        variables: { userInput: 'Hello' },
      },
    },
    {
      id: 'llm-node',
      type: 'llm',
      name: 'LLM Call',
      config: {
        modelId: 'ollama:qwen3.5:9b',
        prompt: 'Respond to: {{ userInput }}',
      },
    },
    {
      id: 'end',
      type: 'end',
      name: 'End',
      config: {},
    },
  ],
  edges: [
    { id: 'e1', source: 'start', target: 'llm-node' },
    { id: 'e2', source: 'llm-node', target: 'end' },
  ],
};

// Execute workflow
const result = await executor.execute(workflow, {
  userInput: 'Hello, AI!',
});

console.log(result);
// {
//   status: 'success',
//   output: { ... },
//   nodeResults: [...],
//   duration: 1234,
// }
```
