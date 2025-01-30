import { db } from "~/utils/db.server";
import type { FileSource } from "~/components/core/files/FileList";

export class DataSourceQueryService {
  static async getDataSources(tenantId: string, chatbotId?: string): Promise<FileSource[]> {
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
      fileName: (f.sourceDetails as any)?.fileName ?? 'Untitled',
      fileType: (f.sourceDetails as any)?.fileType ?? 'application/octet-stream',
      createdAt: new Date(f.createdAt),
      isTrained: (f.sourceDetails as any)?.isTrained ?? true,
      chatbotId: f.chatbotId
    }));
  }
} 