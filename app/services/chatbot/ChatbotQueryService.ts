import { db } from "~/utils/db.server";
import type { ChatbotDetails } from "~/utils/services/chatbots/chatbotService.server";

export class ChatbotQueryService {
  static async getChatbots(tenantId: string): Promise<ChatbotDetails[]> {
    const chatbots = await db.chatbot.findMany({
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
      }
    });

    return chatbots.map(chatbot => ({
      ...chatbot,
      theme: chatbot.theme ? JSON.stringify(chatbot.theme) : undefined,
      initialMessage: chatbot.initialMessage ?? undefined,
      businessName: chatbot.businessName ?? undefined
    }));
  }

  static async getChatbot(chatbotId: string): Promise<ChatbotDetails | null> {
    const chatbot = await db.chatbot.findUnique({
      where: { id: chatbotId },
      select: {
        id: true,
        name: true,
        uniqueUrl: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        theme: true,
        initialMessage: true,
        businessName: true
      }
    });

    return chatbot ? {
      ...chatbot,
      theme: chatbot.theme ? JSON.stringify(chatbot.theme) : undefined,
      initialMessage: chatbot.initialMessage ?? undefined,
      businessName: chatbot.businessName ?? undefined
    } : null;
  }

  static async getDashboardStats(tenantId: string) {
    const [totalDataSources, activeCount] = await Promise.all([
      // Get total data sources
      db.dataSources.count({
        where: {
          tenantId,
          sourceTypeId: 2
        }
      }),
      // Get active chatbots count
      db.chatbot.count({
        where: {
          tenantId,
          status: 'ACTIVE'
        }
      })
    ]);

    return {
      totalDataSources,
      activeCount
    };
  }
} 