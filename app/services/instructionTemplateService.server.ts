import { db } from "~/utils/db.server";

export async function getTemplates(tenantId: string) {
  return db.instructionTemplate.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function deleteTemplate(id: number) {
  return db.instructionTemplate.delete({
    where: { id }
  });
} 