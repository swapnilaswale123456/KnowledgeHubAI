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
    return 'http://localhost:9000';
  }

  static async getProviders(): Promise<string[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/model-provider/db/providers`, {
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch providers');
      }
      const providers = await response.json();
      return providers.map((provider: any) => provider.name);
    } catch (error) {
      console.error('Error fetching providers:', error);
      throw error;
    }
  }

  static async getProviderModels(provider: string): Promise<ModelBasicInfo[]> {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/v1/model-provider/db/provider/${provider}/models`, {
        headers: {
          'accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models for provider ${provider}`);
      }
      const models = await response.json();
      return models
        .filter((model: any) => model.is_active === true) // Filter active models
        .map((model: any) => ({
          model_id: model.model_id,
          id: model.id,
          name: model.name        
        }));

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