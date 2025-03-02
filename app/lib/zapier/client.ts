import { zapierConfig } from "./config";

// Response type for authentication check
interface AuthCheckResponse {
  success: boolean;
  email?: string;
  name?: string;
  user_id?: number;
  is_staff?: boolean;
}

// Zapier API client implementation
export class ZapierClient {
  private apiKey: string;
  private baseUrl: string = 'https://actions.zapier.com/api/v2';

  constructor(apiKey: string = zapierConfig.apiKey) {
    this.apiKey = apiKey;
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`[Zapier API] Making ${method} request to ${url}`);
    
    const headers: HeadersInit = {
      'x-api-key': `${this.apiKey}`,
      'Content-Type': 'application/json',
    };

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    console.log(`[Zapier API] Sending request...`);
    const response = await fetch(url, options);
    
    console.log(`[Zapier API] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Zapier API] Error response:`, errorText);
      throw new Error(`Zapier API error (${response.status}): ${errorText}`);
    }
    
    return response.json();
  }

  // Authentication check
  // https://docs.zapier.com/ai-actions/how-tos/auth
  async checkAuth(): Promise<AuthCheckResponse> {
    console.log("[Zapier API] Checking auth with Zapier API...");
    try {
      const result = await this.request('/auth/check/');
      console.log("[Zapier API] Auth check response:", result);
      return result;
    } catch (error) {
      console.error("[Zapier API] Auth check error:", error);
      throw error;
    }
  }

  // Get action list
  async getActionList() {
    console.log("[Zapier API] Getting action list...");
    try {
      const result = await this.request('/ai-actions/');
      console.log("[Zapier API] Received actions:", result?.results?.length || 0);
      return result;
    } catch (error) {
      console.error("[Zapier API] Action list error:", error);
      throw error;
    }
  }

  // Execute action using the correct endpoint format
  // https://docs.zapier.com/ai-actions/api-reference/execute-action
  async executeAction(actionId: string, instructions: string, previewOnly: boolean = false, params: any = {}) {
    console.log(`[Zapier API] Executing action: ${actionId} with previewOnly=${previewOnly}`);
    try {
      // Use the correct URL format with preview_only as a query parameter
      const url = `/ai-actions/${actionId}/execute/?preview_only=${previewOnly}`;
      console.log(url)
      const result = await this.request(url, 'POST', {
        instructions,
        params
      });
      
      console.log("[Zapier API] Execution result:", result);
      return result;
    } catch (error) {
      console.error("[Zapier API] Execution error:", error);
      throw error;
    }
  }

  // Get execution details
  async getExecution(executionId: string) {
    return this.request(`/executions/${executionId}/`);
  }

  // List executions
  async listExecutions(page: number = 1, pageSize: number = 10, actionId?: string) {
    let url = '/executions/';
    const queryParams = [];
    
    queryParams.push(`page=${page}`);
    queryParams.push(`page_size=${pageSize}`);
    if (actionId) queryParams.push(`action_id=${actionId}`);
    
    if (queryParams.length > 0) {
      url += `?${queryParams.join('&')}`;
    }
    
    return this.request(url);
  }
}

// Create and export a singleton instance
export const zapierClient = new ZapierClient(); 