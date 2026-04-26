#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 Running database migration...\n');

try {
  const { stdout, stderr } = await execAsync('npx drizzle-kit push', {
    cwd: '/workspaces/sms-gateway'
  });
  
  console.log(stdout);
  if (stderr) console.error(stderr);
  
  console.log('\n✅ Migration completed successfully!');
  console.log('\nYour users table now has:');
  console.log('  - email (required, unique)');
  console.log('  - password (required, bcrypt hashed)');
  console.log('  - name (required)');
  console.log('\n🎉 You can now create an account!');
} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
}
