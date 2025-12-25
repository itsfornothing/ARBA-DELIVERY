#!/usr/bin/env node

/**
 * Local Validation Test
 * Tests the validation logic with local development server
 */

const { spawn } = require('child_process');
const path = require('path');

async function testLocalValidation() {
  console.log('🧪 Testing deployment validation logic locally...\n');
  
  // Start the Next.js development server
  console.log('🚀 Starting local development server...');
  
  const serverProcess = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, '../frontend'),
    stdio: 'pipe'
  });
  
  // Wait for server to start
  await new Promise((resolve) => {
    serverProcess.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('Ready') || output.includes('localhost:3000')) {
        console.log('✅ Development server started');
        resolve();
      }
    });
    
    // Fallback timeout
    setTimeout(resolve, 10000);
  });
  
  try {
    // Test with local URLs
    process.env.FRONTEND_URL = 'http://localhost:3000';
    process.env.BACKEND_URL = 'http://localhost:8000'; // This will fail, but that's expected
    
    const DeploymentValidator = require('./validate-frontend-deployment.js');
    const validator = new DeploymentValidator(
      'http://localhost:3000',
      'http://localhost:8000'
    );
    
    console.log('\n🔍 Running validation against local server...');
    
    // Test individual components
    await validator.testHealthCheck();
    await validator.testStaticAssets();
    await validator.testInterfaceRendering();
    // Skip API connectivity test as backend isn't running
    
    console.log('\n✅ Local validation test completed');
    console.log('📝 Note: Backend connectivity test skipped (backend not running locally)');
    
  } catch (error) {
    console.error('❌ Local validation test failed:', error.message);
  } finally {
    // Clean up
    console.log('\n🧹 Cleaning up...');
    serverProcess.kill();
    process.exit(0);
  }
}

if (require.main === module) {
  testLocalValidation().catch(console.error);
}