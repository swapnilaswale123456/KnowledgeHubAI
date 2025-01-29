import { db } from "~/utils/db.server";
import type { ChatbotDetails } from "~/utils/services/chatbots/chatbotService.server";

export class ChatbotQueryService {
  static async getChatbots(tenantId: string): Promise<ChatbotDetails[]> {
    return await db.chatbot.findMany({
      where: { tenantId },
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async getChatbot(chatbotId: string): Promise<ChatbotDetails | null> {
    return await db.chatbot.findUnique({
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