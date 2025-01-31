export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  type?: 'text' | 'html' | 'file' | 'voice';
  isFormatted?: boolean;
  fileUrl?: string;
  fileName?: string;
  metadata?: {
    format?: string;
    language?: string;
    [key: string]: any;
  };
}

export interface ChatSettings {
  theme?: {
    headerColor?: string;
    botMessageColor?: string;
    userMessageColor?: string;
  };
  fontSize?: 'small' | 'medium' | 'large';
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