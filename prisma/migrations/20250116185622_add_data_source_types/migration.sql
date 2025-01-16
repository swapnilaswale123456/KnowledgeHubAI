-- CreateTable
CREATE TABLE "DataSourceTypes" (
    "sourceTypeId" SERIAL NOT NULL,
    "sourceKey" VARCHAR(50) NOT NULL,
    "sourceName" TEXT NOT NULL,

    CONSTRAINT "DataSourceTypes_pkey" PRIMARY KEY ("sourceTypeId")
);