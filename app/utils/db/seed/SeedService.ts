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

  //await createDataSourceTypes();
  await seedLanguages();
  await seedLlmModels();
  await seedIndustries();
  //await seedChatbotTypes();
  //await seedSkills();
  //await seedIndustryChatbotTypes();
  //await seedChatbotTypeSkills();
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

interface IndustryData {
  id: number;
  name: string;
  icon: string;
  description: string;
  chatbotTypes: ChatbotTypeData[];
}

interface ChatbotTypeData {
  id: number;
  name: string;
  icon: string;
  description: string;
  aiAgents: AiAgentData[];
}

interface AiAgentData {
  id: number;
  name: string;
  skills: string[];
}

async function seedIndustries() {
  const industries: IndustryData[] = [
    {
      id: 1,
      name: "E-commerce",
      icon: "🛒",
      description: "Industry focused on buying and selling goods online.",
      chatbotTypes: [
        {
          id: 101,
          name: "E-commerce Assistant Chatbot",
          icon: "🤖",
          description: "Assists with various e-commerce tasks.",
          aiAgents: [
            {
              id: 1001,
              name: "SEO Agent",
              skills: ["Keyword Research", "On-Page SEO"]
            },
            {
              id: 1002,
              name: "Content Writing Agent",
              skills: ["Product Descriptions", "Copywriting"]
            },
            {
              id: 1003,
              name: "Social Media Agent",
              skills: ["Facebook Ads", "Instagram Marketing"]
            },
            {
              id: 1004,
              name: "Email Marketing Agent",
              skills: ["Sales Emails", "Drip Campaigns"]
            }
          ]
        },
        {
          id: 102,
          name: "Product Discovery Chatbot",
          icon: "🔍",
          description: "Helps customers discover products.",
          aiAgents: [
            {
              id: 1005,
              name: "Product Recommendation Agent",
              skills: ["Personalized Shopping Suggestions"]
            },
            {
              id: 1006,
              name: "Dynamic Pricing Agent",
              skills: ["Price Optimization"]
            }
          ]
        },
        {
          id: 103,
          name: "Order Support Chatbot",
          icon: "📦",
          description: "Provides support for order-related queries.",
          aiAgents: [
            {
              id: 1007,
              name: "Order Tracking Agent",
              skills: ["Real-time Order Updates"]
            },
            {
              id: 1008,
              name: "Returns Processing Agent",
              skills: ["Automated Refunds", "Return Handling"]
            }
          ]
        }
      ]
    },
    {
      id: 2,
      name: "Healthcare",
      icon: "🏥",
      description: "Industry focused on health and medical services.",
      chatbotTypes: [
        {
          id: 201,
          name: "Healthcare Support Chatbot",
          icon: "🩺",
          description: "Assists with healthcare-related inquiries.",
          aiAgents: [
            {
              id: 2001,
              name: "Medical Writing Agent",
              skills: ["AI-Generated Health Articles"]
            },
            {
              id: 2002,
              name: "Patient Engagement Agent",
              skills: ["Appointment Scheduling", "Reminders"]
            },
            {
              id: 2003,
              name: "Healthcare FAQ Agent",
              skills: ["Symptom Analysis", "Disease Information"]
            }
          ]
        },
        {
          id: 202,
          name: "Medical Consultation Chatbot",
          icon: "💬",
          description: "Facilitates virtual medical consultations.",
          aiAgents: [
            {
              id: 2004,
              name: "Telemedicine Agent",
              skills: ["Virtual Consultation", "Diagnosis Support"]
            }
          ]
        }
      ]
    },
    {
      id: 3,
      name: "Finance",
      icon: "💰",
      description: "Industry focused on financial services and advice.",
      chatbotTypes: [
        {
          id: 301,
          name: "Financial Insights Chatbot",
          icon: "📈",
          description: "Provides insights into financial markets.",
          aiAgents: [
            {
              id: 3001,
              name: "Investment Insights Agent",
              skills: ["Market Trends", "Stock Analysis"]
            },
            {
              id: 3002,
              name: "Budgeting Assistant Agent",
              skills: ["Expense Tracking", "Financial Planning"]
            },
            {
              id: 3003,
              name: "Tax Compliance Agent",
              skills: ["Tax Filing", "Regulatory Compliance"]
            }
          ]
        }
      ]
    },
    {
      id: 4,
      name: "Retail",
      icon: "🛍️",
      description: "Industry focused on selling goods to consumers.",
      chatbotTypes: [
        {
          id: 401,
          name: "Retail Shopping Assistant Chatbot",
          icon: "🛒",
          description: "Assists with retail shopping experiences.",
          aiAgents: [
            {
              id: 4001,
              name: "AI Sales Agent",
              skills: ["Personalized Shopping", "Dynamic Pricing"]
            },
            {
              id: 4002,
              name: "Customer Support Agent",
              skills: ["Order Management", "FAQs"]
            }
          ]
        },
        {
          id: 402,
          name: "Retail Marketing Chatbot",
          icon: "📢",
          description: "Handles marketing and promotions in retail.",
          aiAgents: [
            {
              id: 4003,
              name: "Promotions Agent",
              skills: ["Discounts", "Event Marketing"]
            }
          ]
        }
      ]
    }
  ];

  for (const industry of industries) {
    await db.industry.upsert({
      where: { id: industry.id },
      update: {
        name: industry.name,
        icon: industry.icon,
        description: industry.description,
        isEnabled: true
      },
      create: {
        id: industry.id,
        name: industry.name,
        icon: industry.icon,
        description: industry.description,
        isEnabled: true
      }
    });

    for (const chatbotType of industry.chatbotTypes) {
      await db.chatbotType.upsert({
        where: { id: chatbotType.id },
        update: {
          name: chatbotType.name,
          icon: chatbotType.icon,
          description: chatbotType.description,
          isEnabled: true
        },
        create: {
          id: chatbotType.id,
          name: chatbotType.name,
          icon: chatbotType.icon,
          description: chatbotType.description,
          isEnabled: true
        }
      });

      await db.industryChatbotTypes.upsert({
        where: {
          industryId_chatbotTypeId: {
            industryId: industry.id,
            chatbotTypeId: chatbotType.id
          }
        },
        update: {},
        create: {
          industryId: industry.id,
          chatbotTypeId: chatbotType.id
        }
      });

      for (const agent of chatbotType.aiAgents) {
        for (const skillName of agent.skills) {
          const skill = await db.skill.upsert({
            where: { name: skillName },
            update: {
              isEnabled: true
            },
            create: {
              name: skillName,
              isEnabled: true
            }
          });

          await db.chatbotTypeSkills.upsert({
            where: {
              chatbotTypeId_skillId: {
                chatbotTypeId: chatbotType.id,
                skillId: skill.id
              }
            },
            update: {},
            create: {
              chatbotTypeId: chatbotType.id,
              skillId: skill.id
            }
          });
        }
      }
    }
  }
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
