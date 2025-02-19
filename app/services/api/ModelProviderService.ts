import { getApiUrl } from "~/config/api.config";

interface ModelBasicInfo {
  model_id: string;
  id: number;
  name: string;
}

interface ModelConfiguration {
  temperature: number;
  top_p: number;
  presence_penalty: number;
  frequency_penalty: number;
  stop_sequences: string[];
  max_tokens: number;
}

interface ModelDetailedInfo {
  id: number;
  model_id: string;
  name: string;
  description: string;
  context_window: number;
  max_tokens: number;
  supported_features: string[];
  pricing: any;
  configurations: ModelConfiguration[];
}

export class ModelProviderService {
  private static getBaseUrl() {
    return 'http://localhost:8000';
  }

  static async getProviders(): Promise<string[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/provider-names/`, {
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  static async getProviderModels(provider: string): Promise<ModelBasicInfo[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/provider/${provider}/models`, {
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models for provider ${provider}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching models for provider ${provider}:`, error);
      throw error;
    }
  }

  static async getModelDetails(provider: string, modelId: string): Promise<ModelDetailedInfo> {
    try {
      const response = await fetch(
        `${this.getBaseUrl()}/api/v1/model-provider/db/provider/${provider}/model/${modelId}`,
        {
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch details for model ${modelId}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching model details for ${modelId}:`, error);
      throw error;
    }
  }
} 