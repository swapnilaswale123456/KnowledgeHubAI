import { db } from "~/utils/db.server";
import type { ChatbotDetails } from "~/utils/services/chatbots/chatbotService.server";

interface ChatbotUpdateData {
  theme?: any;
  initialMessage?: string;
}

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
      include: {
        instructions: {
          include: {
            industry: true,
            chatbotType: true,
            instructionSkills: {
              include: {
                skill: true
              }
            }
          }
        }
      }
    });

    if (!chatbot) return null;

    return {
      ...chatbot,
      theme: chatbot.theme ? JSON.stringify(chatbot.theme) : undefined,
      initialMessage: chatbot.initialMessage ?? undefined,
      businessName: chatbot.businessName ?? undefined,
      createdAt: new Date(chatbot.createdAt),
      updatedAt: new Date(chatbot.updatedAt),
      industry: chatbot.instructions?.[0]?.industryId?.toString(),
      type: chatbot.instructions?.[0]?.chatbotTypeId?.toString(),
      skills: chatbot.instructions?.[0]?.instructionSkills?.map(is => is.skillId.toString()) ?? [],
      scope: {
        purpose: chatbot.instructions?.[0]?.purpose ?? "",
        audience: chatbot.instructions?.[0]?.audience ?? "",
        tone: chatbot.instructions?.[0]?.tone ?? ""
      }
    };
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

  static async updateChatbot(id: string, data: Partial<ChatbotUpdateData>) {
    return await db.chatbot.update({
      where: { id },
      data
    });
  }
} 