export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  type?: 'text' | 'file' | 'voice';
  fileUrl?: string;
  fileName?: string;
}

export interface ChatSettings {
  theme: 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
  messageAlignment: 'left' | 'right';
  soundEnabled: boolean;
}

export interface ChatContext {
  conversationId: string;
  previousMessages: Message[];
  userPreferences: {
    language: string;
    timezone: string;
  };
} 