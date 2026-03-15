import { Tool } from '../tool.interface';

export class HttpTool implements Tool {
  name = 'http';
  description = 'Execute HTTP requests (GET, POST, PUT, DELETE, PATCH) with custom headers, body, and query parameters';
  parameters = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'The URL to send the request to',
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        description: 'HTTP method',
      },
      headers: {
        type: 'object',
        description: 'Request headers',
        additionalProperties: { type: 'string' },
      },
      body: {
        type: ['object', 'string'],
        description: 'Request body (JSON or form data)',
      },
      query: {
        type: 'object',
        description: 'Query parameters',
        additionalProperties: { type: ['string', 'number', 'boolean'] },
      },
      timeout: {
        type: 'number',
        description: 'Request timeout in milliseconds',
        default: 5000,
      },
    },
    required: ['url', 'method'],
  } as const;

  async execute(params: Record<string, any>): Promise<any> {
    const { url, method, headers = {}, body, query, timeout = 5000 } = params;

    const urlObj = new URL(url);

    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        urlObj.searchParams.append(key, String(value));
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const fetchOptions: RequestInit = {
      method,
      headers: {
        ...headers,
      },
      signal: controller.signal,
    };

    if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
      if (typeof body === 'object') {
        const contentType = headers['Content-Type'] || headers['content-type'];
        if (contentType && contentType.includes('application/x-www-form-urlencoded')) {
          const formParams = new URLSearchParams();
          Object.entries(body).forEach(([key, value]) => {
            formParams.append(key, String(value));
          });
          fetchOptions.body = formParams.toString();
        } else {
          fetchOptions.body = JSON.stringify(body);
          if (!fetchOptions.headers['Content-Type'] && !fetchOptions.headers['content-type']) {
            fetchOptions.headers['Content-Type'] = 'application/json';
          }
        }
      } else {
        fetchOptions.body = body;
      }
    }

    try {
      const response = await fetch(urlObj.toString(), fetchOptions);
      clearTimeout(timeoutId);

      const contentType = response.headers.get('content-type');
      let data: any;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      return {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data,
      };
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }
}
