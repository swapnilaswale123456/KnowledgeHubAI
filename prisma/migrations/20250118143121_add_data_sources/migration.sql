/*
  Warnings:

  - A unique constraint covering the columns `[sourceKey]` on the table `DataSourceTypes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "DataSources" (
    "sourceId" SERIAL NOT NULL,
    "chatbotId" UUID NOT NULL,
    "sourceTypeId" INTEGER NOT NULL,
    "tenantId" TEXT NOT NULL,
    "sourceDetails" JSONB,
    "uploadedFilePath" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataSources_pkey" PRIMARY KEY ("sourceId")
);

-- CreateIndex
CREATE UNIQUE INDEX "DataSourceTypes_sourceKey_key" ON "DataSourceTypes"("sourceKey");

-- AddForeignKey
ALTER TABLE "DataSources" ADD CONSTRAINT "DataSources_sourceTypeId_fkey" FOREIGN KEY ("sourceTypeId") REFERENCES "DataSourceTypes"("sourceTypeId") ON DELETE RESTRICT ON UPDATE CASCADE;
