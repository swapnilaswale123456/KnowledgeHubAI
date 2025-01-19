-- CreateTable
CREATE TABLE "Languages" (
    "languageId" SERIAL NOT NULL,
    "languageKey" TEXT NOT NULL,
    "languageName" TEXT NOT NULL,

    CONSTRAINT "Languages_pkey" PRIMARY KEY ("languageId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Languages_languageKey_key" ON "Languages"("languageKey");
