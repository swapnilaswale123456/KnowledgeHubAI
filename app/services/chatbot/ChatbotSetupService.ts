import { db } from "~/utils/db.server";
import type { ChatbotConfig } from "~/types/chatbot";
import { ChatbotStatus } from "@prisma/client";
import { nanoid } from 'nanoid';

export class ChatbotSetupService {
  static async createChatbot(tenantId: string, config: ChatbotConfig) {
    // First verify tenant exists
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const uniqueId = nanoid();
    const chatbot = await db.chatbot.create({
      data: {
        name: "New Chatbot", // Can be customized later
        uniqueUrl: `chat-${uniqueId}`, // Format: chat-{unique_id}
        tenantId: tenant.id, // Use verified tenant ID
        status: ChatbotStatus.ARCHIVED,
        instructions: {
          create: {
            industryId: parseInt(config.industry),
            chatbotTypeId: parseInt(config.type),
            purpose: config.scope.purpose,
            audience: config.scope.audience,
            tone: config.scope.tone,
            instructionSkills: {
              create: config.skills.map(skillId => ({
                skillId: parseInt(skillId)
              }))
            }
          }
        }
      },
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

    return chatbot;
  }

  static async updateChatbot(chatbotId: string, config: Partial<ChatbotConfig>) {
    // First get the instruction id
    const instruction = await db.instructionMaster.findFirst({
      where: { chatbotId }
    });

    if (!instruction) {
      throw new Error("Instruction not found");
    }

    const chatbot = await db.chatbot.update({
      where: { id: chatbotId },
      data: {
        instructions: {
          update: {
            where: { id: instruction.id }, // Use instruction.id instead of chatbotId
            data: {
              industryId: config.industry ? parseInt(config.industry) : undefined,
              chatbotTypeId: config.type ? parseInt(config.type) : undefined,
              purpose: config.scope?.purpose,
              audience: config.scope?.audience,
              tone: config.scope?.tone,
              instructionSkills: config.skills ? {
                deleteMany: {},
                create: config.skills.map(skillId => ({
                  skillId: parseInt(skillId)
                }))
              } : undefined
            }
          }
        }
      },
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

    return chatbot;
  }

  static async deleteChatbot(chatbotId: string) {
    await db.chatbot.delete({
      where: { id: chatbotId }
    });
  }
} 