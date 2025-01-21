import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { v4 as uuidv4 } from 'uuid';
import { ChatbotStatus } from "@prisma/client";

interface FileUploadResponse {
  success: boolean;
  message: string;
  data?: {
    sourceId: number;
    fileName: string;
    fileSize: number;
    filePath?: string;
    isTrain?: boolean;
    chatbotId?: string;
  };
}

interface DataSourceResponse {
  sourceId: number;
}

async function createChatbot(tenantId: string, fileName: string) {
  const uniqueIdentifier = uuidv4();
  const sanitizedFileName = fileName.replace(/\.[^/.]+$/, ""); // Remove file extension

  const chatbot = await db.chatbot.create({
    data: {
      id: uniqueIdentifier,
      name: `${sanitizedFileName} Bot`,
      uniqueUrl: `chat-${tenantId}-${uniqueIdentifier.slice(0,8)}`,
      tenantId,
      status: ChatbotStatus.ACTIVE,
      llmModelId: 1, // Default to GPT-3.5
      languageId: 1, // Default to English
      theme: {
        primaryColor: "#4F46E5",
        secondaryColor: "#6366F1",
        fontFamily: "Inter",
        fontSize: "16px",
        borderRadius: "8px",
        backgroundColor: "#F9FAFB"
      }
    }
  });
  return chatbot;
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
            'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTczNzQ3NDIyMCwianRpIjoiYmQ1ZTdiNTctOTQ0Yy00Mjc0LWEzZmEtMWY5YTIzZTcxODk4IiwidHlwZSI6ImFjY2VzcyIsInN1YiI6InN3YXBuaWxhMzAyQGdtYWlsLmNvbSIsIm5iZiI6MTczNzQ3NDIyMCwiY3NyZiI6ImI4ZmY2ZDc3LTZkZWQtNDhlZi1iOTAzLTczYTAwMzdiY2JhNyIsImV4cCI6MTczNzQ3NTEyMCwiZ29vZ2xlX3Rva2VuIjpbInlhMjkuYTBBUlc1bTc1Z3AzT1VyaDlfNmJYTm1YUHlwMjA4NlhJMHo0UG5CaU53c3pEenN2S2E1R1NxLUxQdG5aLU1ieUg4Z3ptR2lUcW56Z0FCaDZsWlVJd0ZaVFl1YkVEbjRac2JKUDJzRDlod0R2d3YxV2dFa2d3ZmwxckdIUXVZV3h2TjE4Q21BTGV6OW1obkpFRjF5SGF6TnY2MWZsZ242ZVJQU2YwZmFDZ1lLQWY4U0FSQVNGUUhHWDJNaXBsVnFBZW1TTTNjR3RTR2RfLWdfamcwMTcxIiwiIl19.GY1Vk_VW4qadWOj1DZ3uSfPUaQ9JVYcawHiBnbcZXAM`
          }          
        });
        
        if (!response.ok) {
          return {
            success: false,
            message: `Upload failed: ${response.statusText}`
          };
        }
  
        const result = await response.json();
        return {
          success: true,
          message: 'File trained successfully'
        };
      }
      else {
        formData.append('action', 'train');
        
        // Create chatbot first
        const chatbot = await createChatbot(tenantId, file.name);

        // Create DataSource record with chatbot ID
        const dataSource = await db.$queryRaw<DataSourceResponse[]>`
          INSERT INTO "DataSources" (
            "chatbotId", "sourceTypeId", "tenantId", "sourceDetails", "createdAt"
          ) VALUES (
            ${chatbot.id}::uuid, 
            ${2}, 
            ${tenantId},
            ${JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedBy: tenantId,
              createdAt: new Date().toISOString()
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
            chatbotId: chatbot.id,
            isTrain: isTrain,
          }
        };
      }  
      
    } 
    catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }  

  async trainFile(sourceId: number, tenantId: string) {
    const response = await fetch(`${this.baseUrl}/file/train`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJmcmVzaCI6ZmFsc2UsImlhdCI6MTczNzI5MjA5NywianRpIjoiZDk4ZTAxYjktZDBjNy00Y2RiLWFjMDItMmJjMmVmNGJkYWRmIiwidHlwZSI6ImFjY2VzcyIsInN1YiI6InN3YXBuaWxhMzAyQGdtYWlsLmNvbSIsIm5iZiI6MTczNzI5MjA5NywiY3NyZiI6IjdmNzE3ZDY4LTM2MGMtNGZiZi04OWE4LTBkYjExMGIyMGUxYiIsImV4cCI6MTczNzI5Mjk5NywiZ29vZ2xlX3Rva2VuIjpbInlhMjkuYTBBUlc1bTc1Y2tadno1a3hVZW9tb3M2d0VqY3duSFFyRmdDZlV0M3E5NVNlR0k4elFCWVpUWmM0X3c2RDVrSENxV2dPMUxMNVE2SDktN2ZkYm1RbGE0ZFNJZ0djc3VTaThXNkNybkhycTN6bXJFTTlsU0NXdXd3a3UwZ3RZbEFMVll1dHdrNkVKZjNmM0Q0RV9oMUVXVmczMXVoVUN0d2tEMVZ5YmFDZ1lLQWRjU0FSQVNGUUhHWDJNaUxoa29xWlBGMzJqQ3hmWUFKM1VDNFEwMTcxIiwiIl19.1gJTl8N6ZhEQweubZKhsWgHPxGvhGtWciBkyx3nwE18`,
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

  async deleteDataSource(sourceId: number) {
    try {
      await db.$queryRaw`
        DELETE FROM "DataSources" 
        WHERE "sourceId" = ${sourceId}
      `;
      return {
        success: true,
        message: 'File deleted successfully'
      };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }
}

let fileUploadService: FileUploadService;

export function getFileUploadService() {
  if (!fileUploadService) {
    fileUploadService = new FileUploadService();
  }
  return fileUploadService;
}