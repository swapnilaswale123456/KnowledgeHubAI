import { Message } from "~/types/chat";

interface MessageContent {
  message: string;
  timestamp: string | number;
  role: 'user' | 'assistant';
  chatbot_id?: string;
  user_id?: string;
}

interface MessagePair {
  user: MessageContent;
  assistant: MessageContent;
  timestamp: string;
}

interface ApiConversation {
  session_id: string;
  message_pairs: MessagePair[];
  message_count: number;
}

interface AppConversation {
  sessionId: string;
  lastMessage: string;
  timestamp: Date;
  messages: Message[];
}

interface ChatHistoryResponse {
  data: {
    conversations: ApiConversation[];
    total_messages: number;
  };
  status: string;
}

export class ChatHistoryService {
  private baseUrl: string;

  constructor() {
    // Use window.ENV for client-side environment variables
    this.baseUrl = 'http://localhost:5000';
  }

  async getHistory(userId: string, limit?: number): Promise<ChatHistoryResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (limit) {
        queryParams.append('limit', limit.toString());
      }
      queryParams.append('user_id', userId);

      const url = `${this.baseUrl}/api/v1/chat/history?${queryParams.toString()}`;
      console.log('Fetching chat history from:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
          // Removed Authorization header since it's using process.env
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        console.error('Response error:', response.statusText);
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: ChatHistoryResponse = await response.json();
      console.log('Received chat history data:', data);
      return data;
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
      throw error;
    }
  }

  async getHistoryBySessionId(sessionId: string): Promise<ApiConversation | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/chat/history/${sessionId}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.API_KEY}`
          }
        }
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data.conversation;
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
      throw error;
    }
  }

  static convertToAppMessage(apiMessage: { message: string; timestamp: number; role: string }): Message {
    return {
      id: crypto.randomUUID(),
      content: apiMessage.message,
      sender: apiMessage.role === 'assistant' ? 'bot' : 'user',
      timestamp: new Date(apiMessage.timestamp),
      status: 'sent'
    };
  }

  static convertToAppConversation(apiConversation: ApiConversation): AppConversation {
    const messages: Message[] = [];
    apiConversation.message_pairs.forEach((pair: any) => {
      if (pair.user) {
        messages.push(this.convertToAppMessage({
          message: pair.user.message,
          timestamp: new Date(pair.user.timestamp).getTime(),
          role: 'user'
        }));
      }
      if (pair.assistant) {
        messages.push(this.convertToAppMessage({
          message: pair.assistant.message,
          timestamp: new Date(pair.assistant.timestamp * 1000).getTime(),
          role: 'assistant'
        }));
      }
    });

    return {
      sessionId: apiConversation.session_id,
      messages,
      lastMessage: messages.length > 0 
        ? messages[messages.length - 1].content.replace(/<\/?[^>]+(>|$)/g, "") 
        : '',
      timestamp: new Date(messages[messages.length - 1]?.timestamp || new Date())
    };
    
  }
} 