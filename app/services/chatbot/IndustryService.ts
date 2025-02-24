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
      { description: { contains: search, mode: 'insensitive' as const } }
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

export async function createIndustry({ name, description }: { name: string; description: string }) {
  return db.industry.create({
    data: {
      name,
      description
    }
  });
}

export async function updateIndustry(id: string, { name, description }: { name: string; description: string }) {
  return db.industry.update({
    where: { id: parseInt(id) },
    data: {
      name,
      description
    }
  });
}

export async function deleteIndustry(id: string) {
  return db.industry.delete({
    where: { id: parseInt(id) }
  });
} 