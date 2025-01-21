import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { ChatbotDetails } from "~/utils/services/chatbots/chatbotService.server";
import { chatbotStorage } from "~/utils/services/chatbots/chatbotLocalStorage";

interface ChatbotContextType {
  selectedChatbot: ChatbotDetails | null;
  setSelectedChatbot: (chatbot: ChatbotDetails | null) => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function ChatbotProvider({ children }: { children: ReactNode }) {
  const [selectedChatbot, setSelectedChatbot] = useState<ChatbotDetails | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const storedChatbot = chatbotStorage.getStoredChatbot();
    if (storedChatbot) {
      setSelectedChatbot(storedChatbot);
    }
  }, []);

  const handleSetChatbot = (chatbot: ChatbotDetails | null) => {
    setSelectedChatbot(chatbot);
    chatbotStorage.setStoredChatbot(chatbot);
  };

  return (
    <ChatbotContext.Provider value={{ selectedChatbot, setSelectedChatbot: handleSetChatbot }}>
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