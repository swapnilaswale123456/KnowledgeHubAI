import { db } from "~/utils/db.server";
import { ChatbotStatus } from "@prisma/client";

export class ChatbotStatusService {
  static async activateChatbot(chatbotId: string) {
    return await db.chatbot.update({
      where: { id: chatbotId },
      data: { status: ChatbotStatus.ACTIVE }
    });
  }

  static async deactivateChatbot(chatbotId: string) {
    return await db.chatbot.update({
      where: { id: chatbotId },
      data: { status: ChatbotStatus.INACTIVE }
    });
  }

  static async archiveChatbot(chatbotId: string) {
    return await db.chatbot.update({
      where: { id: chatbotId },
      data: { status: ChatbotStatus.ARCHIVED }
    });
  }

  static async updateStatus(chatbotId: string, status: ChatbotStatus) {
    return await db.chatbot.update({
      where: { id: chatbotId },
      data: { status }
    });
  }
} 