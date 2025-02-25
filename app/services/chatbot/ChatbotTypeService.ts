import { db } from "~/utils/db.server";

interface GetChatbotTypesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export async function getChatbotTypes({
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'asc',
  search = ''
}: GetChatbotTypesParams = {}) {
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } }
    ]
  } : {};

  const [chatbotTypes, total] = await Promise.all([
    db.chatbotType.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    }),
    db.chatbotType.count({ where })
  ]);

  return {
    chatbotTypes,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

export async function createChatbotType({ name, description, isEnabled, icon }: { 
  name: string; 
  description: string; 
  isEnabled: boolean; 
  icon: string;
}) {
  return db.chatbotType.create({
    data: { name, description, isEnabled, icon }
  });
}

export async function updateChatbotType(id: string, data: {
  name: string;
  description: string;
  isEnabled: boolean;
  icon: string;
}) {
  return db.chatbotType.update({
    where: { id: parseInt(id) },
    data
  });
}

export async function deleteChatbotType(id: string) {
  return db.chatbotType.delete({
    where: { id: parseInt(id) }
  });
} 