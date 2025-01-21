import { ChatbotDetails } from "./chatbotService.server";

export interface StoredChatbot extends ChatbotDetails {
  id: string;
  name: string;
  // Add other required properties
}

export const chatbotStorage = {
  getStoredChatbot: (): StoredChatbot | null => {
    if (typeof window === 'undefined') return null;
    
    try {
      const stored = localStorage.getItem('selectedChatbot');
      if (!stored) return null;
      
      const chatbot = JSON.parse(stored) as StoredChatbot;
      if (!chatbot?.id) return null;
      
      return chatbot;
    } catch (error) {
      console.error('Error reading chatbot from localStorage:', error);
      return null;
    }
  },

  setStoredChatbot: (chatbot: ChatbotDetails | null): void => {
    if (typeof window === 'undefined') return;
    
    try {
      if (chatbot) {
        localStorage.setItem('selectedChatbot', JSON.stringify(chatbot));
      } else {
        localStorage.removeItem('selectedChatbot');
      }
    } catch (error) {
      console.error('Error storing chatbot in localStorage:', error);
    }
  },

  clearStoredChatbot: (): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.removeItem('selectedChatbot');
    } catch (error) {
      console.error('Error clearing chatbot from localStorage:', error);
    }
  }
}; 