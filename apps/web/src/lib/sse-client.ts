export interface StreamChunkDto {
  content: string;
  finishReason?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface SSECallbacks {
  onChunk?: (chunk: StreamChunkDto) => void;
  onDone?: () => void;
  onError?: (error: Error) => void;
}

export interface SSEConnection {
  close: () => void;
  reconnect: () => void;
}

export function createSSESource(
  url: string,
  body: {
    conversationId: string;
    message: string;
    userId?: string;
  },
  callbacks: SSECallbacks,
  options: {
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): SSEConnection {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  let retryCount = 0;
  let eventSource: EventSource | null = null;
  let isClosed = false;

  const connect = () => {
    if (isClosed) return;

    try {
      eventSource = new EventSource(url);

      eventSource.onopen = () => {
        retryCount = 0;
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (data.type === 'done') {
            callbacks.onDone?.();
            close();
            return;
          }

          callbacks.onChunk?.(data as StreamChunkDto);
        } catch (error) {
          callbacks.onError?.(new Error('Failed to parse SSE data'));
        }
      };

      eventSource.onerror = (error) => {
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(() => {
            if (!isClosed) {
              connect();
            }
          }, retryDelay * retryCount);
        } else {
          callbacks.onError?.(new Error('Connection failed after multiple retries'));
          close();
        }
      };
    } catch (error) {
      callbacks.onError?.(
        error instanceof Error ? error : new Error('Failed to create SSE connection')
      );
    }
  };

  const close = () => {
    isClosed = true;
    if (eventSource) {
      eventSource.close();
      eventSource = null;
    }
  };

  const reconnect = () => {
    retryCount = 0;
    close();
    connect();
  };

  connect();

  return { close, reconnect };
}

export async function sendSSEMessage(
  url: string,
  body: {
    conversationId: string;
    message: string;
    userId?: string;
  },
  callbacks: SSECallbacks,
  options: {
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<SSEConnection> {
  const { maxRetries = 3, retryDelay = 1000 } = options;
  let retryCount = 0;

  const tryConnect = async (): Promise<SSEConnection> => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return new Promise((resolve) => {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let isDone = false;

        const processStream = async () => {
          if (!reader || isDone) return;

          try {
            const { done, value } = await reader.read();

            if (done) {
              callbacks.onDone?.();
              isDone = true;
              resolve({ close: () => {}, reconnect: () => {} });
              return;
            }

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                const parsed = JSON.parse(data);

                if (parsed.type === 'done') {
                  callbacks.onDone?.();
                  isDone = true;
                  resolve({ close: () => {}, reconnect: () => {} });
                  return;
                }

                callbacks.onChunk?.(parsed);
              }
            }

            processStream();
          } catch (error) {
            if (retryCount < maxRetries) {
              retryCount++;
              setTimeout(() => {
                tryConnect().then(resolve);
              }, retryDelay * retryCount);
            } else {
              callbacks.onError?.(error instanceof Error ? error : new Error('Stream failed'));
              isDone = true;
              resolve({ close: () => {}, reconnect: () => {} });
            }
          }
        };

        processStream();
      });
    } catch (error) {
      if (retryCount < maxRetries) {
        retryCount++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay * retryCount));
        return tryConnect();
      }
      throw error;
    }
  };

  return tryConnect();
}
