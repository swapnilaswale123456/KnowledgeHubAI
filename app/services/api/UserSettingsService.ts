interface UserSettings {
  chatbotid: string;
  tenantid: string;
  settings: {
    provider: string;
    model: string;
    configuration: {
      temperature: number;
      topP: number;
      presencePenalty: number;
      frequencyPenalty: number;
      stopSequences: string;
      maxTokens: number;
    };
  };
}

export class UserSettingsService {
  private static baseUrl = 'http://localhost:8000';

  static async getUserSettings(chatbotId: string, tenantId: string): Promise<UserSettings | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/api/v1/user-settings/${chatbotId}/${tenantId}`,
        {
          headers: {
            'accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch user settings');
      }

      const data = await response.json();
      return {
        ...data,
        settings: JSON.parse(data.settings) // Parse the JSONB string back to object
      };
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  }

  static async saveSettings(settings: UserSettings): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/user-settings/`, {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chatbotid: settings.chatbotid,
          tenantid: settings.tenantid,
          settings: JSON.stringify(settings.settings) // Convert settings object to JSON string
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save user settings');
      }
    } catch (error) {
      console.error('Error saving user settings:', error);
      throw error;
    }
  }
} 