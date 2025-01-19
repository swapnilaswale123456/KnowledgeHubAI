import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { v4 as uuidv4 } from 'uuid';

interface FileUploadResponse {
  success: boolean;
  message: string;
  data?: {
    sourceId: number;
    filePath?: string;
  };
}

interface DataSourceResponse {
  sourceId: number;
}

export class FileUploadService {
  private baseUrl: string;
  private apiKey: string;

  constructor() {
    this.baseUrl = process.env.PYTHON_API_ENDPOINT || 'http://127.0.0.1:5000';
    this.apiKey = process.env.PYTHON_API_KEY || '';
  }

  async uploadFile(file: File, tenantId: string, request: Request): Promise<FileUploadResponse> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/file/upload/v2/file`, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTczNzI3MjcyMSwianRpIjoiNjM4Y2RlYjctNWMxYS00MDYxLTgyY2MtOGJhMjc5ZmQ4ZTU5IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6InN3YXBuaWxhMzAyQGdtYWlsLmNvbSIsIm5iZiI6MTczNzI3MjcyMSwiY3NyZiI6ImY0NzI2MDk2LTU0ODMtNDM3OC04NTRlLTI2MjhiMGYzZTJjYiIsImV4cCI6MTczNzI3MzYyMSwiZ29vZ2xlX3Rva2VuIjpbInlhMjkuYTBBUlc1bTc2YjQ3RGsyWm1YRWJaRnppT0RnbnZ4UWNCbHl0dXZmbjR6Y2pFOUItS3VRLXRxLTdIempZV3ZNcXllMlpRd3MwUEVOR2Y2TnBSMUFzUEh2QnI3TjFmcWh5Z3VHYUwyelQtNUlWTjcyelVna2ZwNjZYeWpHdXVONXVxRWIxMlVPOVFfUnB3YWFkZnRPaWNEWjBiaDVmRHJsX0xSOGZkcGFDZ1lLQWI4U0FSQVNGUUhHWDJNaXM5ZFBsbEhXdUIzRGoxbGpzdUdmYXcwMTcxIiwiIl19.KZVMOVC9uMa51SVb6oANiqWo1Wu2cdN_B3ZUVXXVcxc`
        }
      });

      if (!response.ok) {
        return {
          success: false,
          message: `Upload to Python API failed: ${response.statusText}`
        };
      }

      const uploadedFilePath = response.url;

      // Create DataSource record using Prisma
      const dataSource = await db.$queryRaw<DataSourceResponse[]>`
        INSERT INTO "DataSources" (
          "chatbotId",
          "sourceTypeId",
          "tenantId",
          "sourceDetails",
          "uploadedFilePath",
          "createdAt"
        ) VALUES (
          ${uuidv4()}::uuid,
          ${2},
          ${tenantId},
          ${JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          })}::jsonb,
          ${uploadedFilePath},
          CURRENT_TIMESTAMP
        ) RETURNING "sourceId"`;

      return {
        success: true,
        message: 'File uploaded and metadata saved successfully',
        data: {
          sourceId: dataSource[0].sourceId,
          filePath: uploadedFilePath
        }
      };

    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'File upload failed'
      };
    }
  }

  async deleteFile(filePath: string, tenantId: string) {
    const response = await fetch(`${this.baseUrl}/delete-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filePath,
        tenantId
      })
    });

    if (!response.ok) {
      throw new Error('Failed to delete file');
    }

    return await response.json();
  }
}

let fileUploadService: FileUploadService;

export function getFileUploadService() {
  if (!fileUploadService) {
    fileUploadService = new FileUploadService();
  }
  return fileUploadService;
}