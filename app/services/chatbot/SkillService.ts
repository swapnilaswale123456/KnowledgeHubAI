import { db } from "~/utils/db.server";

interface GetSkillsOptions {
  page?: number;
  perPage?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}

export async function getSkills({
  page = 1,
  perPage = 10,
  sortBy = "name",
  sortOrder = "asc",
  search = ""
}: GetSkillsOptions) {
  const skip = (page - 1) * perPage;
  
  const where = {
    ...(search ? {
      OR: [
        { name: { contains: search } },
        { description: { contains: search } }
      ]
    } : {})
  };

  const [skills, total] = await Promise.all([
    db.skill.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: perPage,
    }),
    db.skill.count({ where })
  ]);

  return {
    skills,
    total,
    totalPages: Math.ceil(total / perPage)
  };
}

export async function createSkill({ name, description, isEnabled, icon }: { 
  name: string;
  description: string;
  isEnabled: boolean;
  icon: string;
}) {
  return db.skill.create({
    data: { name, description, isEnabled, icon }
  });
}

export async function updateSkill(id: string, data: {
  name: string;
  description: string;
  isEnabled: boolean;
  icon: string;
}) {
  return db.skill.update({
    where: { id: parseInt(id) },
    data
  });
}

export async function deleteSkill(id: string) {
  return db.skill.delete({
    where: { id: parseInt(id) }
  });
} 