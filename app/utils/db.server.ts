import { PrismaClient } from "@prisma/client";

let db: PrismaClient;

declare global {
  var __db: PrismaClient | undefined;
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === "production") {
  db = new PrismaClient({   
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: [], // Disable all logging in production
  });
} else {
  if (!global.__db) {
    global.__db = new PrismaClient({
      log: [], // Disable all logging in development
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  db = global.__db;
}

// Add error handling middleware
db.$use(async (params, next) => {
  try {
    return await next(params);
  } catch (error) {
    throw error;
  }
});

// Connection verification
async function verifyConnection() {
  try {
    await db.$queryRaw`SELECT 1`;
    console.log('Database connection verified successfully');
  } catch (error) {
    console.error('Database connection verification failed:', error);
    throw error;
  }
}

// Verify connection on startup
verifyConnection().catch((error) => {
  console.error('Failed to verify database connection:', error);
});

export { db };
