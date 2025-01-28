import { db } from "~/utils/db.server";

export async function getIndustries() {
  return await db.industry.findMany({
    where: { isEnabled: true },
    include: {
      chatbotTypes: {
        include: {
          chatbotType: true
        },
        where: {
          chatbotType: {
            isEnabled: true
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

export async function getChatbotTypesByIndustry(industryId: number) {
  return await db.chatbotType.findMany({
    where: { 
      isEnabled: true,
      industries: {
        some: { industryId }
      }
    },
    include: {
      skills: {
        include: {
          skill: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });
}

export async function getSkillsByChatbotType(chatbotTypeId: number) {
  return await db.skill.findMany({
    where: { 
      isEnabled: true,
      chatbotTypes: {
        some: { chatbotTypeId }
      }
    },
    orderBy: { name: 'asc' }
  });
}

export async function createInstruction(data: {
  chatbotId: string;
  industryId?: number;
  chatbotTypeId?: number;
  skillIds?: number[];
  purpose?: string;
  audience?: string;
  tone?: string;
  objective?: string;
  style?: string;
  rules?: string;
}) {
  const { skillIds, ...instructionData } = data;
  
  return await db.instructionMaster.create({
    data: {
      ...instructionData,
      instructionSkills: {
        create: skillIds?.map(skillId => ({
          skillId
        })) || []
      }
    },
    include: {
      industry: true,
      chatbotType: true,
      instructionSkills: {
        include: {
          skill: true
        }
      }
    }
  });
}

export async function getInstructionById(id: number) {
  return await db.instructionMaster.findUnique({
    where: { id },
    include: {
      industry: true,
      chatbotType: true,
      instructionSkills: {
        include: {
          skill: true
        }
      }
    }
  });
}

export async function updateInstruction(id: number, data: {
  industryId?: number;
  chatbotTypeId?: number;
  skillIds?: number[];
  purpose?: string;
  audience?: string;
  tone?: string;
  objective?: string;
  style?: string;
  rules?: string;
}) {
  const { skillIds, ...instructionData } = data;

  // First delete existing skills
  await db.instructionSkill.deleteMany({
    where: { instructionId: id }
  });

  // Then update instruction with new data
  return await db.instructionMaster.update({
    where: { id },
    data: {
      ...instructionData,
      instructionSkills: {
        create: skillIds?.map(skillId => ({
          skillId
        })) || []
      }
    },
    include: {
      industry: true,
      chatbotType: true,
      instructionSkills: {
        include: {
          skill: true
        }
      }
    }
  });
}
