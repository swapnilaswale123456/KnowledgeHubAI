import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { v4 as uuidv4 } from 'uuid';

interface FileUploadResponse {
  success: boolean;
  message: string;
  data?: {
    sourceId: number;
    fileName: string;
    fileSize: number;
    filePath?: string;
    isTrain?: boolean;
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

  async uploadFile(file: File, tenantId: string, request: Request, isTrain = false) {
    try {
      const formData = new FormData();
      
      formData.append('file', file);      
      if (isTrain == true) {
       
        const response = await fetch(`${this.baseUrl}/file/upload/v2/file`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTczNzI5MDc0MSwianRpIjoiYzBiZDE1NjctZWFmZi00YjY1LTk1YjktMjQ2NGY1MmViMmY1IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6InN3YXBuaWxhMzAyQGdtYWlsLmNvbSIsIm5iZiI6MTczNzI5MDc0MSwiY3NyZiI6ImJlODRiMTYzLTNkYjktNGZmZi05YWM0LTcyNmJlOGI5M2QwNSIsImV4cCI6MTczNzI5MTY0MSwiZ29vZ2xlX3Rva2VuIjpbInlhMjkuYTBBUlc1bTc1NmNQWWZUSVl0eGlfOWlLQ3hGRllKV1ZmTXZTcjRUa3BFc19PYnJ1TXJNYWJQYWtMUG9NZ0FNQm0xLWdsUHptNDFnUHpia212Mmp4RkhfUmZDVzB5bHJsV0dwZlNNSWRwLU1SSkFOT1VlRGRLU1R2ejJoSGN6c09fWlQ3VEEzeXhVRVdHTlVMSEZBekFkTkRLclJPRGJEenlELU1LOGFDZ1lLQVRjU0FSQVNGUUhHWDJNaXdsV0x0QnNKN3lPZVZUUVpiX1ZOT0EwMTcxIiwiIl19.XYa_U1scl8eIhDiZ0XpT8r_xbP9BDCI46RtGY5EjGHE`
          }
          
        });
        if (!response.ok) {
          return {
            success: false,
            message: `Upload failed: ${response.statusText}`
          };
        }
  
        const result = await response.json();
      }
      else{
        formData.append('action', 'train');
      }  
      
      // Create DataSource record
      const dataSource = await db.$queryRaw<DataSourceResponse[]>`
        INSERT INTO "DataSources" (
          "chatbotId", "sourceTypeId", "tenantId", "sourceDetails", "createdAt"
        ) VALUES (
          ${uuidv4()}::uuid, ${2}, ${tenantId},
          ${JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type
          })}::jsonb,
          CURRENT_TIMESTAMP
        ) RETURNING "sourceId"`;

      return {
        success: true,
        message: 'File uploaded successfully',
        data: {
          sourceId: dataSource[0].sourceId,
          fileName: file.name,
          fileSize: file.size,
          isTrain: isTrain,
          //filePath: result.filePath
        }
      };

    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
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

  async trainFile(sourceId: number, tenantId: string) {
    const response = await fetch(`${this.baseUrl}/file/train`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTczNzI5MDc0MSwianRpIjoiYzBiZDE1NjctZWFmZi00YjY1LTk1YjktMjQ2NGY1MmViMmY1IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6InN3YXBuaWxhMzAyQGdtYWlsLmNvbSIsIm5iZiI6MTczNzI5MDc0MSwiY3NyZiI6ImJlODRiMTYzLTNkYjktNGZmZi05YWM0LTcyNmJlOGI5M2QwNSIsImV4cCI6MTczNzI5MTY0MSwiZ29vZ2xlX3Rva2VuIjpbInlhMjkuYTBBUlc1bTc1NmNQWWZUSVl0eGlfOWlLQ3hGRllKV1ZmTXZTcjRUa3BFc19PYnJ1TXJNYWJQYWtMUG9NZ0FNQm0xLWdsUHptNDFnUHpia212Mmp4RkhfUmZDVzB5bHJsV0dwZlNNSWRwLU1SSkFOT1VlRGRLU1R2ejJoSGN6c09fWlQ3VEEzeXhVRVdHTlVMSEZBekFkTkRLclJPRGJEenlELU1LOGFDZ1lLQVRjU0FSQVNGUUhHWDJNaXdsV0x0QnNKN3lPZVZUUVpiX1ZOT0EwMTcxIiwiIl19.XYa_U1scl8eIhDiZ0XpT8r_xbP9BDCI46RtGY5EjGHE`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        source_id: sourceId,
        tenant_id: tenantId,
        model_name: "gpt-3.5-turbo"
      })
    });

    if (!response.ok) {
      return {
        success: false,
        message: `Training failed: ${response.statusText}`
      };
    }

    return {
      success: true,
      message: 'Training started successfully'
    };
  }
}

let fileUploadService: FileUploadService;

export function getFileUploadService() {
  if (!fileUploadService) {
    fileUploadService = new FileUploadService();
  }
  return fileUploadService;
}