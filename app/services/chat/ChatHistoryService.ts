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

interface Conversation {
  session_id: string;
  message_pairs: MessagePair[];
  message_count: number;
}

interface ChatHistoryResponse {
  data: {
    conversations: Conversation[];
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

      const url = `${this.baseUrl}/ask/chat/history?${queryParams.toString()}`;
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

  async getHistoryBySessionId(sessionId: string): Promise<Conversation | null> {
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

  // Helper method to convert API response to our app's Conversation format
  static convertToAppConversation(apiConversation: Conversation): {
    sessionId: string;
    lastMessage: string;
    timestamp: Date;
    messages: Message[];
  } {
    if (!apiConversation?.message_pairs) {
      console.warn('Invalid conversation format:', apiConversation);
      return {
        sessionId: apiConversation?.session_id || crypto.randomUUID(),
        lastMessage: '',
        timestamp: new Date(),
        messages: []
      };
    }

    const messages: Message[] = [];
    apiConversation.message_pairs.forEach(pair => {
      // Add user message
      if (pair.user) {
        messages.push({
          id: crypto.randomUUID(),
          content: pair.user.message,
          sender: 'user',
          timestamp: new Date(pair.user.timestamp),
          status: 'sent',
          isFormatted: false
        });
      }

      // Add assistant message
      if (pair.assistant) {
        messages.push({
          id: crypto.randomUUID(),
          content: pair.assistant.message,
          sender: 'bot',
          timestamp: new Date(typeof pair.assistant.timestamp === 'number' 
            ? pair.assistant.timestamp * 1000 
            : pair.assistant.timestamp),
          status: 'sent',
          isFormatted: pair.assistant.message.includes('<') // Check if message contains HTML
        });
      }
    });

    return {
      sessionId: apiConversation.session_id,
      lastMessage: messages[messages.length - 1]?.content || '',
      timestamp: new Date(messages[messages.length - 1]?.timestamp || new Date()),
      messages
    };
  }
} 