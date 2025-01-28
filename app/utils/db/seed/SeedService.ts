/* eslint-disable no-console */
import { PrismaClient, LlmModelType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { TenantUserJoined } from "~/application/enums/tenants/TenantUserJoined";
import { TenantUserType } from "~/application/enums/tenants/TenantUserType";
import { TenantUserStatus } from "~/application/enums/tenants/TenantUserStatus";
import { getAvailableTenantInboundAddress } from "~/utils/services/emailService";
import { seedRolesAndPermissions } from "~/utils/services/rolesAndPermissionsService";
const db = new PrismaClient();

const ADMIN_EMAIL = "admin@email.com";

async function seed() {
  console.log("🌱 Seeding admin user", 1);
  const admin = await createUser("Admin", "User", ADMIN_EMAIL, "password", TenantUserType.OWNER);

  console.log("🌱 Creating users with tenants", 2);
  const user1 = await createUser("John", "Doe", "john.doe@company.com", "password");
  const user2 = await createUser("Luna", "Davis", "luna.davis@company.com", "password");

  console.log("🌱 Creating tenants", 2);
  await createTenant("acme-corp-1", "Acme Corp 1", [
    { ...admin, type: TenantUserType.ADMIN },
    { ...user1, type: TenantUserType.ADMIN },
    { ...user2, type: TenantUserType.MEMBER },
  ]);
  await createTenant("acme-corp-2", "Acme Corp 2", [
    { ...user1, type: TenantUserType.OWNER },
    { ...user2, type: TenantUserType.MEMBER },
  ]);

  // Permissions
  await seedRolesAndPermissions(ADMIN_EMAIL);

  await createDataSourceTypes();
  await seedLanguages();
  await seedLlmModels();
  await seedIndustries();
  await seedChatbotTypes();
  await seedSkills();
  await seedIndustryChatbotTypes();
  await seedChatbotTypeSkills();
}


async function createUser(firstName: string, lastName: string, email: string, password: string, adminRole?: TenantUserType) {
  const passwordHash = await bcrypt.hash(password, 10);
  let user = await db.user.findUnique({
    where: {
      email,
    },
  });
  if (user) {
    console.log(`ℹ️ User already exists`, email);
    return user;
  }
  user = await db.user.create({
    data: {
      email,
      passwordHash,
      avatar: "",
      firstName,
      lastName,
      phone: "",
    },
  });
  if (adminRole !== undefined) {
    await db.adminUser.create({
      data: {
        userId: user.id,
      },
    });
  }
  return user;
}
async function createDataSourceTypes() {
  const dataSourceTypes = [
    { sourceKey: "overview", sourceName: "Overview" },
    { sourceKey: "file", sourceName: "File Upload" },
    { sourceKey: "website", sourceName: "Website" },
    { sourceKey: "text", sourceName: "Text Input" },
    { sourceKey: "notion", sourceName: "Notion" },
    { sourceKey: "youtube", sourceName: "YouTube" }
  ];

  for (const type of dataSourceTypes) {
    const existing = await db.dataSourceType.findFirst({
      where: { sourceKey: type.sourceKey }
    });

    if (!existing) {
      await db.dataSourceType.create({ data: type });
    }
  }
  console.log("Seeding completed: DataSourceTypes added or already exist");
}
async function seedLanguages() {
  const languages = [
    { name: 'English', code: 'en' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
    { name: 'German', code: 'de' },
    { name: 'Chinese', code: 'zh' },
    { name: 'Japanese', code: 'ja' }
  ];

  for (const lang of languages) {
    await db.language.upsert({
      where: { code: lang.code },
      update: {},
      create: {
        code: lang.code,
        name: lang.name,
        isEnabled: true
      }
    });
  }
  console.log("✅ Languages seeded");
}
async function seedLlmModels() {
  const models = [
    {
      id: 1,
      name: 'GPT-3.5 Turbo',
      type: LlmModelType.GPT_3_5,
      maxTokens: 4096,
      temperature: 0.7
    },
    {
      id: 2,
      name: 'GPT-4',
      type: LlmModelType.GPT_4,
      maxTokens: 8192,
      temperature: 0.7
    },
    {
      id: 3,
      name: 'Claude 2',
      type: LlmModelType.CLAUDE,
      maxTokens: 100000,
      temperature: 0.7
    }
  ];

  for (const model of models) {
    await db.llmModel.upsert({
      where: { id: model.id ?? 1 },
      update: {},
      create: model
    });
  }
  console.log("✅ LLM Models seeded");
}
async function createTenant(slug: string, name: string, users: { id: string; type: TenantUserType }[]) {
  let tenant = await db.tenant.findUnique({
    where: { slug },
  });
  if (tenant) {
    console.log(`ℹ️ Tenant already exists`, slug);
    return tenant;
  }
  const address = await getAvailableTenantInboundAddress(name);
  tenant = await db.tenant.create({
    data: {
      name,
      slug,
      icon: "",
      inboundAddresses: {
        create: {
          address,
        },
      },
    },
  });

  let tenantId = tenant.id;

  await db.tenantSubscription.create({
    data: {
      tenantId,
      stripeCustomerId: "",
    },
  });

  for (const user of users) {
    const tenantUser = await db.tenantUser.findFirst({
      where: { tenantId, userId: user.id },
    });
    if (tenantUser) {
      console.log(`ℹ️ User already in tenant`, user.id, tenantId);
      continue;
    }
    await db.tenantUser.create({
      data: {
        tenantId,
        userId: user.id,
        type: user.type,
        joined: TenantUserJoined.CREATOR,
        status: TenantUserStatus.ACTIVE,
      },
    });
  }

  return tenant;
}

async function seedIndustries() {
  const industries = [
    { name: "E-commerce", icon: "🛍️", description: "E-commerce description" },
    { name: "Healthcare", icon: "🏥", description: "Healthcare description" },
    { name: "Education", icon: "📚", description: "Education description" },
    { name: "Finance", icon: "💰", description: "Finance description" },
    { name: "Technology", icon: "💻", description: "Technology description" }
  ];

  for (const industry of industries) {
    await db.industry.upsert({
      where: { name: industry.name },
      update: {},
      create: industry
    });
  }
  console.log("✅ Industries seeded");
}

async function seedChatbotTypes() {
  const types = [
    { name: "Customer Service", icon: "🎯", description: "Handle customer inquiries and support requests" },
    { name: "Sales Assistant", icon: "💼", description: "Help customers with product selection and purchases" },
    { name: "Knowledge Base", icon: "📚", description: "Answer questions based on your documentation" },
    { name: "Custom Assistant", icon: "🎨", description: "Build a custom chatbot for your specific needs" }
  ];

  for (const type of types) {
    await db.chatbotType.upsert({
      where: { name: type.name },
      update: {},
      create: type
    });
  }
  console.log("✅ Chatbot Types seeded");
}

async function seedSkills() {
  const skills = [
    { name: "Question Answering", icon: "❓", description: "Answer questions based on provided context" },
    { name: "Text Summarization", icon: "📝", description: "Create concise summaries of longer texts" },
    { name: "Sentiment Analysis", icon: "😊", description: "Detect emotion and sentiment in messages" },
    { name: "Language Translation", icon: "🌐", description: "Translate between different languages" },
    { name: "Recommendations", icon: "🎯", description: "Provide personalized suggestions" }
  ];

  for (const skill of skills) {
    await db.skill.upsert({
      where: { name: skill.name },
      update: {},
      create: skill
    });
  }
  console.log("✅ Skills seeded");
}

async function seedIndustryChatbotTypes() {
  const industries = await db.industry.findMany();
  const chatbotTypes = await db.chatbotType.findMany();

  // Example mapping
  const mappings = [
    { industryId: industries[0].id, chatbotTypeId: chatbotTypes[0].id }, // E-commerce -> Customer Service
    { industryId: industries[0].id, chatbotTypeId: chatbotTypes[1].id }, // E-commerce -> Sales Assistant
    // Add more mappings as needed
  ];

  for (const mapping of mappings) {
    await db.industryChatbotTypes.upsert({
      where: { 
        industryId_chatbotTypeId: {
          industryId: mapping.industryId,
          chatbotTypeId: mapping.chatbotTypeId
        }
      },
      create: mapping,
      update: {}
    });
  }
  console.log("✅ seedIndustryChatbotTypes seeded");
}

async function seedChatbotTypeSkills() {
  const chatbotTypes = await db.chatbotType.findMany();
  const skills = await db.skill.findMany();

  // Example mapping
  const mappings = [
    { chatbotTypeId: chatbotTypes[0].id, skillId: skills[0].id }, // Customer Service -> Question Answering
    { chatbotTypeId: chatbotTypes[0].id, skillId: skills[2].id }, // Customer Service -> Sentiment Analysis
    // Add more mappings as needed
  ];

  for (const mapping of mappings) {
    await db.chatbotTypeSkills.upsert({
      where: { 
        chatbotTypeId_skillId: {
          chatbotTypeId: mapping.chatbotTypeId,
          skillId: mapping.skillId
        }
      },
      create: mapping,
      update: {}
    });
  }
  console.log("✅ chatbotTypeSkills seeded");
}

export default {
  seed,
};
