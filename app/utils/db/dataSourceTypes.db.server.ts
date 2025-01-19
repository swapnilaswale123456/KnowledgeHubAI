import { db } from "../db.server";

export interface DataSourceType {
  sourceTypeId: number;
  sourceKey: string;
  sourceName: string;
}

export async function getDataSourceTypes() {
  return await db.dataSourceType.findMany({
    orderBy: { sourceTypeId: "asc" }
  });
}

export async function getDataSourceType(sourceTypeId: number) {
  return await db.dataSourceType.findUnique({
    where: { sourceTypeId },
  });
}