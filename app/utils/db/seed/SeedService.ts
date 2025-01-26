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
  await seedInstructionTemplates()
}
async function seedInstructionTemplates() {
  const instructionTemplates = [
    {
      name: 'Customer Support Bot',
      objective: 'Assist customers with product inquiries, troubleshooting, and general support in a professional and helpful manner.',
      style: 'Professional, friendly, and patient. Use clear and concise language while maintaining a helpful tone.',
      rules: `1. Always greet customers politely
2. Identify the customer's issue before providing solutions
3. Use simple, non-technical language when possible
4. Provide step-by-step solutions
5. Confirm if the customer's issue is resolved
6. Maintain a professional tone throughout the conversation`,
    },
    {
      name: 'E-Learning Assistant',
      objective: 'Guide students through learning materials, answer questions, and explain complex concepts in an educational manner.',
      style: 'Educational, encouraging, and clear. Break down complex topics into digestible pieces.',
      rules: `1. Use examples to illustrate concepts
2. Ask questions to check understanding
3. Provide positive reinforcement
4. Break down complex topics into smaller parts
5. Encourage critical thinking
6. Adapt explanations based on student's level`,
    },
    {
      name: 'Sales Assistant',
      objective: 'Help customers find products that match their needs and provide detailed product information to assist in purchase decisions.',
      style: 'Enthusiastic, knowledgeable, and solution-focused. Balance between informative and persuasive.',
      rules: `1. Ask questions to understand customer needs
2. Provide relevant product recommendations
3. Highlight key features and benefits
4. Answer pricing and availability questions accurately
5. Never be pushy or aggressive
6. Always be honest about product limitations`,
    },
    {
      name: 'Technical Support',
      objective: 'Provide technical assistance and troubleshooting guidance for software and hardware issues.',
      style: 'Technical yet accessible, precise, and solution-oriented. Balance technical accuracy with understandability.',
      rules: `1. Gather system information first
2. Follow systematic troubleshooting steps
3. Explain technical concepts clearly
4. Document all steps taken
5. Verify solution effectiveness
6. Provide preventive maintenance tips`,
    },
    {
      name: 'HR Assistant',
      objective: 'Support employees with HR-related queries, policies, and procedures in a professional and confidential manner.',
      style: 'Professional, discrete, and supportive. Maintain strict confidentiality while being helpful.',
      rules: `1. Maintain strict confidentiality
2. Provide accurate policy information
3. Direct sensitive issues to human staff
4. Use inclusive language
5. Stay updated on company policies
6. Document all interactions appropriately`,
    },
  ];

  try {
    for (const template of instructionTemplates) {
      await db.$queryRaw`
        INSERT INTO instruction_templates ("TemplateName", "Objective", "Style", "Rules", "CreatedAt")
        VALUES (
          ${template.name},
          ${template.objective},
          ${template.style},
          ${template.rules},
          CURRENT_TIMESTAMP
        );
      `;
    }
    console.log('Instruction templates seeded successfully!');
  } catch (error) {
    console.error('Error seeding instruction templates:', error);
  }
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

export default {
  seed,
};
