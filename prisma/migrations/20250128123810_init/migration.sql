-- CreateTable
CREATE TABLE "industry_chatbot_types" (
    "industryId" INTEGER NOT NULL,
    "chatbotTypeId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "industry_chatbot_types_pkey" PRIMARY KEY ("industryId","chatbotTypeId")
);

-- CreateTable
CREATE TABLE "chatbot_type_skills" (
    "chatbotTypeId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chatbot_type_skills_pkey" PRIMARY KEY ("chatbotTypeId","skillId")
);

-- AddForeignKey
ALTER TABLE "industry_chatbot_types" ADD CONSTRAINT "industry_chatbot_types_industryId_fkey" FOREIGN KEY ("industryId") REFERENCES "Industry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "industry_chatbot_types" ADD CONSTRAINT "industry_chatbot_types_chatbotTypeId_fkey" FOREIGN KEY ("chatbotTypeId") REFERENCES "ChatbotType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_type_skills" ADD CONSTRAINT "chatbot_type_skills_chatbotTypeId_fkey" FOREIGN KEY ("chatbotTypeId") REFERENCES "ChatbotType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chatbot_type_skills" ADD CONSTRAINT "chatbot_type_skills_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
