#!/usr/bin/env node

const { execSync } = require('child_process');

// Environment detection
const isCI = process.env.CI === 'true';
const isProduction = process.env.NODE_ENV === 'production';
const isRender = process.env.RENDER === 'true';
const isVercel = process.env.VERCEL === '1';
const isNetlify = process.env.NETLIFY === 'true';

const isDeployment = isCI || isProduction || isRender || isVercel || isNetlify;

console.log('🔧 Conditional Husky Setup');
console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`CI: ${isCI}`);
console.log(`Production: ${isProduction}`);
console.log(`Render: ${isRender}`);
console.log(`Deployment detected: ${isDeployment}`);

if (isDeployment) {
  console.log('⏭️  Skipping Husky installation in deployment environment');
  console.log('   Git hooks are not needed in CI/production builds');
  process.exit(0);
}

try {
  console.log('🐕 Installing Husky Git hooks for development...');
  execSync('husky', { stdio: 'inherit', cwd: process.cwd() });
  console.log('✅ Husky installation completed successfully');
} catch (error) {
  console.error('❌ Husky installation failed:', error.message);
  console.log('⚠️  This is likely because:');
  console.log('   - Git is not available in this environment');
  console.log('   - Husky package is not installed');
  console.log('   - .git directory is not present');
  console.log('⚠️  Continuing without Git hooks...');
  // Don't fail the build - just warn and continue
  process.exit(0);
}