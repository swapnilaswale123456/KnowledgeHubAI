import { db } from "~/utils/db.server";

interface GetIndustriesParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export async function getIndustries({
  page = 1,
  limit = 10,
  sortBy = 'name',
  sortOrder = 'asc',
  search = ''
}: GetIndustriesParams = {}) {
  const skip = (page - 1) * limit;

  const where = search ? {
    OR: [
      { name: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const }, isEnabled: true, icon: { contains: search, mode: 'insensitive' as const } }
    ]
  } : {};

  const [industries, total] = await Promise.all([
    db.industry.findMany({
      where,
      include: {
        chatbotTypes: {
          include: {
            chatbotType: true
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit
    }),
    db.industry.count({ where })
  ]);

  return {
    industries,
    total,
    totalPages: Math.ceil(total / limit)
  };
}

export async function getIndustry(id: string) {
  return db.industry.findUnique({
    where: { id: parseInt(id) },
    include: {
      chatbotTypes: {
        include: {
          chatbotType: true
        }
      }
    }
  });
}

export async function createIndustry({ name, description, isEnabled, icon }: { name: string; description: string; isEnabled: boolean; icon: string }) {
  return db.industry.create({
    data: {
      name,
      description,
      isEnabled,
      icon
    }
  });
}

export async function updateIndustry(id: string, { name, description, isEnabled, icon }: { name: string; description: string; isEnabled: boolean; icon: string }) {
  console.log(id, name, description, isEnabled, icon);
  return db.industry.update({
    where: { id: parseInt(id) },
    data: {
      name,
      description,
      isEnabled,
      icon
    }
  });
}

export async function deleteIndustry(id: string) {
  return db.industry.delete({
    where: { id: parseInt(id) }
  });
} 