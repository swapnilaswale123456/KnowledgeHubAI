import { db } from "~/utils/db.server";

interface TemplateData {
  name: string;
  objective: string;
  style: string;
  rules: string;
}

export async function getTemplates(tenantId: string) {
  return db.instructionTemplate.findMany({
    
    select: {
      id: true,
      name: true,
      objective: true,
      style: true,
      rules: true,
      createdAt: true
    },
    orderBy: { createdAt: 'desc' }
  });
}

export async function getTemplateById(id: number) {
  return db.instructionTemplate.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      objective: true,
      style: true,
      rules: true,
      createdAt: true
    }
  });
}

export async function updateTemplate(id: number, data: TemplateData) {
  return db.instructionTemplate.update({
    where: { id },
    data: {
      name: data.name,
      objective: data.objective,
      style: data.style,
      rules: data.rules
    }
  });
}

export async function createTemplate(data: TemplateData & { tenantId: string }) {
  return db.instructionTemplate.create({
    data: {
      name: data.name,
      objective: data.objective,
      style: data.style,
      rules: data.rules,
      tenantId: data.tenantId
    }
  });
}

export async function deleteTemplate(id: number) {
  return db.instructionTemplate.delete({
    where: { id }
  });
} 