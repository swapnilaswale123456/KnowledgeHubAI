import { createContext, useContext, useState } from 'react';
import { ChatbotDetails } from '~/utils/services/chatbots/chatbotService.server';

interface ChatbotContextType {
  selectedChatbot: ChatbotDetails | null;
  setSelectedChatbot: (chatbot: ChatbotDetails | null) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotDetails | null>(null);

  return (
    <ChatbotContext.Provider value={{ selectedChatbot, setSelectedChatbot }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
} 