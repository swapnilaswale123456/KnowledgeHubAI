import { db } from "~/utils/db.server";
import { ChatbotStatus } from "@prisma/client";

export class ChatbotStatusService {
  static async updateStatus(chatbotId: string, status: ChatbotStatus) {
    if (!chatbotId || !status) {
      throw new Error("Chatbot ID and status are required");
    }

    return await db.chatbot.update({
      where: { id: chatbotId },
      data: { 
        status: status // Ensure status is a valid ChatbotStatus enum value
      }
    });
  }

  static async activateChatbot(chatbotId: string) {
    return await this.updateStatus(chatbotId, ChatbotStatus.ACTIVE);
  }

  static async deactivateChatbot(chatbotId: string) {
    return await this.updateStatus(chatbotId, ChatbotStatus.INACTIVE);
  }

  static async archiveChatbot(chatbotId: string) {
    return await this.updateStatus(chatbotId, ChatbotStatus.ARCHIVED);
  }
} 