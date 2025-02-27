import { execSync } from 'child_process';

console.log('Starting Prisma DB push with debug flags...');

try {
  // Run prisma db push with debug flags and timeout
  const output = execSync(
    'npx prisma db push --verbose --timeout 120',
    { stdio: 'inherit' }
  );
  
  console.log('Prisma DB push completed successfully');
} catch (error) {
  console.error('Prisma DB push failed:', error);
} 