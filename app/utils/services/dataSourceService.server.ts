import { getDataSourceTypes, DataSourceType } from "../db/dataSourceTypes.db.server";

export class DataSourceService {
  async getDataSourceTypes(): Promise<DataSourceType[]> {
    return await getDataSourceTypes();
  }

  async getStats() {
    const types = await getDataSourceTypes();
    return {
      total: types.length
    };
  }
}

let dataSourceService: DataSourceService;

export function getDataSourceService() {
  if (!dataSourceService) {
    dataSourceService = new DataSourceService();
  }
  return dataSourceService;
}

export type { DataSourceType };