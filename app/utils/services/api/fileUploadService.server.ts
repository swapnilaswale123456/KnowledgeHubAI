import { json } from "@remix-run/node";
import { db } from "~/utils/db.server";
import { v4 as uuidv4 } from 'uuid';
import { ChatbotStatus } from "@prisma/client";
import { ChatbotSetupService } from "~/services/chatbot/ChatbotSetupService";
import { ChatbotQueryService } from "~/services/chatbot/ChatbotQueryService";

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
  public chatbotIdlocal: string | null = null;
  constructor() {
    this.baseUrl = process.env.PYTHON_API_ENDPOINT || 'http://127.0.0.1:5000';
    this.apiKey = process.env.PYTHON_API_KEY || '';
  }

  async uploadFile(file: File, tenantId: string, request: Request, isTrain = false, chatbotId: string | null = null, sourceId: string | null = null) {
    try {
      this.chatbotIdlocal = chatbotId;
      const formData = new FormData();
      formData.append('file', file);
      formData.append('chatbot_id', this.chatbotIdlocal ?? '');     
    
      if (isTrain) {
        // Training flow
        const response = await fetch(`${this.baseUrl}/api/v1/files/upload/v2`, {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer`
          }          
        });
        
        if (!response.ok) {
         
          return {
            success: false,
            message: `Upload failed: ${response.statusText}`
          };
        }
        if(response.ok){
           // Update training status
           await fileUploadService.updateDataSource(parseInt(sourceId ?? '0'), {
            sourceDetails: {
              isTrained: true,
              status: 'TRAINED',
              message: 'Training completed'
            }
          });
          return {
            success: true,
            message: 'File trained successfully'
          };
        }
      } else {
        // Regular upload flow
        if (!chatbotId) {
          return {
            success: false,
            message: 'Chatbot ID is required'
          };
        }

        const chatbot = await ChatbotQueryService.getChatbot(chatbotId);
        if (!chatbot) {
          return {
            success: false,
            message: 'Invalid chatbot ID'
          };
        }
        this.chatbotIdlocal = chatbot.id;
        formData.append('chatbotId', this.chatbotIdlocal ?? '');
        // Create DataSource record using Prisma instead of raw query
        const dataSource = await db.dataSources.create({
          data: {
            chatbotId: chatbot.id,
            sourceTypeId: 2,
            tenantId: tenantId,
            sourceDetails: {
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedBy: tenantId,
              createdAt: new Date().toISOString(),
              isTrained: isTrain
            }
          }
        });
        formData.append('sourceId', dataSource.sourceId.toString());

        return {
          success: true,
          message: 'File uploaded successfully',
          data: {
            sourceId: dataSource.sourceId,
            fileName: file.name,
            fileSize: file.size,
            chatbotId: chatbot.id,
            isTrain: isTrain
          }
        };
      }
    } catch (error) {
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
      await db.dataSources.delete({
        where: { sourceId }
      });
      return { success: true };
    } catch (error) {
      console.error('Delete datasource error:', error);
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Delete datasource failed'
      };
    }
  }

  async deleteChatbot(chatbotId: string) {
    try {
      await db.chatbot.delete({
        where: { id: chatbotId }
      });
      return { success: true };
    } catch (error) {
      console.error('Delete chatbot error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Delete chatbot failed'
      };
    }
  }

  async deleteDataSourceAndChatbot(sourceId: number) {
    try {
      const dataSource = await db.dataSources.findUnique({
        where: { sourceId },
        select: { chatbotId: true }
      });

      const results = await Promise.all([
        this.deleteDataSource(sourceId),
        dataSource?.chatbotId ? this.deleteChatbot(dataSource.chatbotId) : { success: true }
      ]);

      return results.every(r => r.success) 
        ? { success: true }
        : { success: false, message: 'Failed to delete all resources' };
    } catch (error) {
      console.error('Delete error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Delete failed'
      };
    }
  }

  async updateDataSource(sourceId: number, updates: Partial<{
    sourceDetails: {
      fileName?: string;
      fileSize?: number;
      fileType?: string;
      isTrained?: boolean;
      status?: string;
      message?: string;
      updatedAt?: string;
    }
  }>) {
    try {
      const dataSource = await db.dataSources.findUnique({
        where: { sourceId }
      });

      if (!dataSource) {
        throw new Error('Data source not found');
      }

      const updatedDataSource = await db.dataSources.update({
        where: { sourceId },
        data: {
          sourceDetails: {
            ...(dataSource.sourceDetails as any),
            ...updates.sourceDetails,
            updatedAt: new Date().toISOString()
          }
        }
      });

      return {
        success: true,
        message: 'Data source updated successfully',
        data: updatedDataSource
      };
    } catch (error) {
      console.error('Update error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Update failed'
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