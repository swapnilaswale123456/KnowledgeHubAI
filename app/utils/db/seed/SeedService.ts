/* eslint-disable no-console */
import { PrismaClient } from "@prisma/client";
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
  await createLanguages(); 
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
async function createLanguages() {
  const languages = [
    { languageKey: "en", languageName: "English" },
    { languageKey: "es", languageName: "Spanish" },
    { languageKey: "fr", languageName: "French" }
  ];

  for (const lang of languages) {
    const existing = await db.languages.findFirst({
      where: { languageKey: lang.languageKey }
    });

    if (!existing) {
      await db.languages.create({ data: lang });
    }
  }
  console.log("Seeding completed: Languages added or already exist");
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
