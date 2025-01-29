import { db } from "~/utils/db.server";
import { ChatbotStatus } from "@prisma/client";
import { FileSource } from "~/components/core/files/FileList";

export interface ChatbotDetails {
  id: string;
  name: string;
  uniqueUrl: string;
  status: ChatbotStatus;
  createdAt: Date | string;
  updatedAt: Date | string;
  theme?: string;
  initialMessage?: string;
  businessName?: string;
  industry?: string;
  type?: string;
  skills?: string[];
  scope?: {
    purpose: string;
    audience: string;
    tone: string;
  };
  dataSource?: string;
  trainingData?: any[];
  lastCompletedStep?: number;
  files?: FileSource[];
}

export class ChatbotService {
  static async getChatbotCount(tenantId: string): Promise<number> {
    return await db.chatbot.count({
      where: { tenantId }
    });
  }

  static async getChatbotDetails(chatbotId: string): Promise<ChatbotDetails | null> {
    const chatbot = await db.chatbot.findUnique({
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

    return chatbot ? {
      ...chatbot,
      theme: chatbot.theme ? JSON.stringify(chatbot.theme) : undefined,
      initialMessage: chatbot.initialMessage ?? undefined,
      businessName: chatbot.businessName ?? undefined,
      createdAt: new Date(chatbot.createdAt),
      updatedAt: new Date(chatbot.updatedAt)
    } : null;
  }

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
      },
      orderBy: { createdAt: 'desc' }
    });

    return chatbots.map(chatbot => ({
      ...chatbot,
      theme: chatbot.theme ? JSON.stringify(chatbot.theme) : undefined,
      initialMessage: chatbot.initialMessage ?? undefined,
      businessName: chatbot.businessName ?? undefined,
      createdAt: new Date(chatbot.createdAt),
      updatedAt: new Date(chatbot.updatedAt)
    }));
  }

  static async getChatbotByUrl(uniqueUrl: string): Promise<ChatbotDetails | null> {
    const chatbot = await db.chatbot.findUnique({
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

    return chatbot ? {
      ...chatbot,
      theme: chatbot.theme ? JSON.stringify(chatbot.theme) : undefined,
      initialMessage: chatbot.initialMessage ?? undefined,
      businessName: chatbot.businessName ?? undefined,
      createdAt: new Date(chatbot.createdAt),
      updatedAt: new Date(chatbot.updatedAt)
    } : null;
  }
} 