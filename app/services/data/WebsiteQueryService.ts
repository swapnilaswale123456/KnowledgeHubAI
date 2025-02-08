import { db } from "~/utils/db.server";
import { WebsiteSource } from "~/components/core/Websites/WebsiteList";

export class WebsiteQueryService {
  static async getDataSources(tenantId: string, chatbotId?: string): Promise<WebsiteSource[]> {
    const files = await db.dataSources.findMany({
      where: {
        tenantId,
        sourceTypeId: 2,
        ...(chatbotId && { chatbotId })
      },
      select: {
        sourceId: true,
        sourceDetails: true,
        createdAt: true,
        chatbotId: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return files.map(f => ({
      sourceId: f.sourceId,
      url: (f.sourceDetails as any)?.url ?? 'NA',
      createdAt: new Date(f.createdAt),
      isTrained: (f.sourceDetails as any)?.isTrained ?? true,
      chatbotId: f.chatbotId
    }));
  }
} 