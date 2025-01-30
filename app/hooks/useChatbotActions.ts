import { useFetcher } from "@remix-run/react";
import { ChatbotStatus } from "@prisma/client";
import type { ChatbotFormData } from "~/types/chatbot";

export function useChatbotActions() {
  const fetcher = useFetcher();

  const createFormData = (data: ChatbotFormData): FormData => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });
    return formData;
  };

  const handleChatbotAction = async (intent: string, chatbotId?: string, config?: any) => {
    const formData = createFormData({
      intent,
      chatbotId,
      config: config ? JSON.stringify(config) : undefined,
    });
    
    return await fetcher.submit(formData, { method: "POST" });
  };

  const handleTraining = async (chatbotId: string, sourceId: string) => {
    return await handleChatbotAction("train", chatbotId, { sourceId });
  };

  const handleStatusUpdate = async (chatbotId: string, status: ChatbotStatus) => {
    return await handleChatbotAction("update-status", chatbotId, { status });
  };

  return {
    fetcher,
    handleChatbotAction,
    handleTraining,
    handleStatusUpdate
  };
} 