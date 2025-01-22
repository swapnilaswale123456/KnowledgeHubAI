import { createContext, useContext, useEffect, useState } from 'react';

interface ChatbotContextType {
  selectedChatbotId: string | null;
  setSelectedChatbotId: (id: string | null) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

const STORAGE_KEY = 'selectedChatbotId';

export function ChatbotProvider({ children }: { children: React.ReactNode }) {
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  });

  useEffect(() => {
    if (selectedChatbotId) {
      localStorage.setItem(STORAGE_KEY, selectedChatbotId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [selectedChatbotId]);

  return (
    <ChatbotContext.Provider value={{ selectedChatbotId, setSelectedChatbotId }}>
      {children}
    </ChatbotContext.Provider>
  );
}

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within ChatbotProvider');
  }
  return context;
} 