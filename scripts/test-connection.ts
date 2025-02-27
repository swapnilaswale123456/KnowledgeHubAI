import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('Testing database connection...');
  
  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });
  
  try {
    console.log('Attempting to connect...');
    const result = await prisma.$queryRaw`SELECT 1 as "connectionTest"`;
    console.log('Connection successful:', result);
    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.error('Connection failed:', error);
    await prisma.$disconnect();
    return false;
  }
}

testConnection()
  .then(success => {
    console.log(`Connection test ${success ? 'passed' : 'failed'}`);
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  }); 