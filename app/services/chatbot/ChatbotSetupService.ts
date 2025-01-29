import { db } from "~/utils/db.server";
import type { ChatbotConfig } from "~/types/chatbot";
import { ChatbotStatus } from "@prisma/client";
import { nanoid } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import { validate as isUUID, parse as parseUUID } from "uuid";

interface DataSource {
  sourceId: number;
  chatbotId: string;
}

export class ChatbotSetupService {
  static async createChatbot(tenantId: string, config: ChatbotConfig, step: number) {
    // First verify tenant exists
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId }
    });

    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const uniqueIdentifier = uuidv4();
    const chatbot = await db.chatbot.create({
      data: {
        id: uniqueIdentifier,
        name: `${config.industry} Bot`,
        uniqueUrl: `chat-${tenantId}-${uniqueIdentifier.slice(0,8)}`,
        tenantId,
        status: ChatbotStatus.ARCHIVED,
        llmModelId: 1,
        languageId: 1,
        lastCompletedStep: step,
        theme: {
          primaryColor: "#4F46E5",
          secondaryColor: "#6366F1",
          fontFamily: "Inter",
          fontSize: "16px",
          borderRadius: "8px",
          backgroundColor: "#F9FAFB"
        },
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
    try {
      // First get the chatbot to verify it exists
      const chatbot = await db.chatbot.findUnique({
        where: { id: chatbotId }
      });

      if (!chatbot) {
        throw new Error("Chatbot not found");
      }

      // Delete in this order to handle foreign key constraints
      await db.$transaction([
        // Delete instruction skills first
        db.instructionSkill.deleteMany({
          where: {
            instruction: {
              chatbotId
            }
          }
        }),

        // Delete instruction master records
        db.instructionMaster.deleteMany({
          where: { chatbotId }
        }),

        // Delete data sources
        db.dataSources.deleteMany({
          where: { chatbotId: chatbot.id }
        }),

        // Finally delete the chatbot
        db.chatbot.delete({
          where: { id: chatbotId }
        })
      ]);
    } catch (error) {
      console.error("Error deleting chatbot:", error);
      throw error;
    }
  }
} 