import { db } from "~/utils/db.server";
import type { FileSource } from "~/components/core/files/FileList";
import { FileTrainingStatus } from "~/types/file-status.enum";

export interface SourceDetails {
  fileName: string;
  fileSize: number;
  fileType: string;
  status: FileTrainingStatus;
  message?: string;
  createdAt: string;
  updatedAt?: string;
}

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
        chatbotId: true,
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return files.map(f => {
      const details = f.sourceDetails as unknown as SourceDetails;
      return {
        sourceId: f.sourceId,
        fileName: details?.fileName ?? 'Untitled',
        fileType: details?.fileType ?? 'application/octet-stream',
        createdAt: new Date(f.createdAt),
        sourceDetails: details,
        chatbotId: f.chatbotId
      };
    });
  }
} 