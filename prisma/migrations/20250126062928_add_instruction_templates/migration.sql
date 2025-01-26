-- DropForeignKey
ALTER TABLE "WorkflowExecution" DROP CONSTRAINT "WorkflowExecution_tenantId_fkey";

-- CreateTable
CREATE TABLE "instruction_templates" (
    "TemplateID" SERIAL NOT NULL,
    "TemplateName" VARCHAR(255) NOT NULL,
    "Objective" TEXT NOT NULL,
    "Style" TEXT NOT NULL,
    "Rules" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "CreatedBy" TEXT,

    CONSTRAINT "instruction_templates_pkey" PRIMARY KEY ("TemplateID")
);

-- CreateTable
CREATE TABLE "user_instructions" (
    "InstructionID" SERIAL NOT NULL,
    "UserID" TEXT NOT NULL,
    "ChatbotID" TEXT NOT NULL,
    "TemplateID" INTEGER,
    "Objective" TEXT NOT NULL,
    "Style" TEXT NOT NULL,
    "Rules" TEXT NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "LastModified" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_instructions_pkey" PRIMARY KEY ("InstructionID")
);

-- AddForeignKey
ALTER TABLE "WorkflowExecution" ADD CONSTRAINT "WorkflowExecution_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instruction_templates" ADD CONSTRAINT "instruction_templates_CreatedBy_fkey" FOREIGN KEY ("CreatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_instructions" ADD CONSTRAINT "user_instructions_UserID_fkey" FOREIGN KEY ("UserID") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_instructions" ADD CONSTRAINT "user_instructions_ChatbotID_fkey" FOREIGN KEY ("ChatbotID") REFERENCES "chatbots"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_instructions" ADD CONSTRAINT "user_instructions_TemplateID_fkey" FOREIGN KEY ("TemplateID") REFERENCES "instruction_templates"("TemplateID") ON DELETE SET NULL ON UPDATE CASCADE;
