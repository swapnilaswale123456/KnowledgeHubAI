import { createContext, useContext, useState, ReactNode } from 'react';

type ChatbotContextType = {
  selectedChatbotId: string | null;
  setSelectedChatbotId: (id: string | null) => void;
  clearSelectedChatbot: () => void;
};

export const ChatbotContext = createContext<ChatbotContextType>({
  selectedChatbotId: null,
  setSelectedChatbotId: () => {},
  clearSelectedChatbot: () => {}
});

export const ChatbotProvider = ({ children }: { children: ReactNode }) => {
  const [selectedChatbotId, setSelectedChatbotId] = useState<string | null>(null);
  
  const updateChatbotId = (id: string | null) => {
    setSelectedChatbotId(id);
  };

  const clearSelectedChatbot = () => {
    setSelectedChatbotId(null);
  };

  return (
    <ChatbotContext.Provider value={{ 
      selectedChatbotId, 
      setSelectedChatbotId: updateChatbotId,
      clearSelectedChatbot
    }}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbot = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}; 