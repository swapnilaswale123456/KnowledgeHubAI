import { db } from "~/utils/db.server";
import { ChatbotStatus } from "@prisma/client";

export interface ChatbotDetails {
  id: string;
  name: string;
  uniqueUrl: string;
  theme?: any;
  initialMessage: string | null;
  businessName: string | null;
  status: ChatbotStatus;
  createdAt: Date;
  updatedAt: Date;
}

export class ChatbotService {
  static async getChatbotCount(tenantId: string): Promise<number> {
    return await db.chatbot.count({
      where: { tenantId }
    });
  }

  static async getChatbotDetails(chatbotId: string): Promise<ChatbotDetails | null> {
    return await db.chatbot.findUnique({
      where: { id: chatbotId },
      select: {
        id: true,
        name: true,
        uniqueUrl: true,
        theme: true,
        initialMessage: true,
        businessName: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  static async getChatbots(tenantId: string): Promise<ChatbotDetails[]> {
    return await db.chatbot.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        uniqueUrl: true,
        theme: true,
        initialMessage: true,
        businessName: true,
        status: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  static async getChatbotByUrl(uniqueUrl: string): Promise<ChatbotDetails | null> {
    return await db.chatbot.findUnique({
      where: { uniqueUrl },
      select: {
        id: true,
        name: true,
        uniqueUrl: true,
        theme: true,
        initialMessage: true,
        businessName: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }
} 