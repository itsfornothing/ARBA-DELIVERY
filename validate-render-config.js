#!/usr/bin/env node

/**
 * Render Configuration Validator
 * Validates that the repository and configuration are ready for Render deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating Render Deployment Configuration...\n');

const checks = [];

// Check 1: Verify repository structure
function checkRepositoryStructure() {
  const requiredFiles = [
    'render.yaml',
    'frontend/package.json',
    'backend/requirements.txt',
    'backend/manage.py'
  ];

  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length === 0) {
    checks.push({ name: 'Repository Structure', status: '✅', message: 'All required files present' });
  } else {
    checks.push({ 
      name: 'Repository Structure', 
      status: '❌', 
      message: `Missing files: ${missingFiles.join(', ')}` 
    });
  }
}

// Check 2: Verify Git repository configuration
function checkGitConfiguration() {
  try {
    const remoteUrl = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    
    if (remoteUrl.includes('github.com/itsfornothing/ARBA-DELIVERY')) {
      checks.push({ 
        name: 'Git Repository', 
        status: '✅', 
        message: `Correct repository: ${remoteUrl}` 
      });
    } else {
      checks.push({ 
        name: 'Git Repository', 
        status: '⚠️', 
        message: `Repository URL: ${remoteUrl} (verify this matches Render configuration)` 
      });
    }
  } catch (error) {
    checks.push({ 
      name: 'Git Repository', 
      status: '❌', 
      message: 'Git repository not configured or not accessible' 
    });
  }
}

// Check 3: Verify render.yaml configuration
function checkRenderYaml() {
  try {
    const renderConfig = fs.readFileSync('render.yaml', 'utf8');
    
    // Check for correct build commands
    const hasFrontendService = renderConfig.includes('arba-delivery-frontend');
    const hasCorrectBuildCommand = renderConfig.includes('cd frontend');
    const hasHealthCheck = renderConfig.includes('healthCheckPath');
    
    if (hasFrontendService && hasCorrectBuildCommand && hasHealthCheck) {
      checks.push({ 
        name: 'Render Configuration', 
        status: '✅', 
        message: 'render.yaml has correct service configuration' 
      });
    } else {
      const issues = [];
      if (!hasFrontendService) issues.push('missing frontend service');
      if (!hasCorrectBuildCommand) issues.push('incorrect build commands');
      if (!hasHealthCheck) issues.push('missing health check configuration');
      
      checks.push({ 
        name: 'Render Configuration', 
        status: '❌', 
        message: `Issues: ${issues.join(', ')}` 
      });
    }
  } catch (error) {
    checks.push({ 
      name: 'Render Configuration', 
      status: '❌', 
      message: 'render.yaml not found or not readable' 
    });
  }
}

// Check 4: Verify frontend package.json
function checkFrontendPackage() {
  try {
    const packageJson = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
    
    const hasRequiredScripts = packageJson.scripts && 
                              packageJson.scripts.build && 
                              packageJson.scripts.start &&
                              packageJson.scripts['build:validate'];
    
    const hasRequiredDeps = packageJson.dependencies && 
                           packageJson.dependencies.next &&
                           packageJson.dependencies.react;
    
    if (hasRequiredScripts && hasRequiredDeps) {
      checks.push({ 
        name: 'Frontend Package', 
        status: '✅', 
        message: 'package.json has required scripts and dependencies' 
      });
    } else {
      const issues = [];
      if (!hasRequiredScripts) issues.push('missing required scripts');
      if (!hasRequiredDeps) issues.push('missing required dependencies');
      
      checks.push({ 
        name: 'Frontend Package', 
        status: '❌', 
        message: `Issues: ${issues.join(', ')}` 
      });
    }
  } catch (error) {
    checks.push({ 
      name: 'Frontend Package', 
      status: '❌', 
      message: 'frontend/package.json not found or invalid JSON' 
    });
  }
}

// Check 5: Verify backend requirements
function checkBackendRequirements() {
  try {
    const requirements = fs.readFileSync('backend/requirements.txt', 'utf8');
    
    const hasRequiredPackages = requirements.includes('Django') && 
                               requirements.includes('gunicorn');
    
    if (hasRequiredPackages) {
      checks.push({ 
        name: 'Backend Requirements', 
        status: '✅', 
        message: 'requirements.txt has required packages' 
      });
    } else {
      checks.push({ 
        name: 'Backend Requirements', 
        status: '❌', 
        message: 'Missing required packages (Django, gunicorn)' 
      });
    }
  } catch (error) {
    checks.push({ 
      name: 'Backend Requirements', 
      status: '❌', 
      message: 'backend/requirements.txt not found or not readable' 
    });
  }
}

// Check 6: Verify health check endpoints exist
function checkHealthEndpoints() {
  const frontendHealthCheck = fs.existsSync('frontend/src/app/api/health/route.ts');
  const backendHealthCheck = fs.existsSync('backend/delivery_platform/health_views.py');
  
  if (frontendHealthCheck && backendHealthCheck) {
    checks.push({ 
      name: 'Health Check Endpoints', 
      status: '✅', 
      message: 'Both frontend and backend health checks exist' 
    });
  } else {
    const missing = [];
    if (!frontendHealthCheck) missing.push('frontend health check');
    if (!backendHealthCheck) missing.push('backend health check');
    
    checks.push({ 
      name: 'Health Check Endpoints', 
      status: '❌', 
      message: `Missing: ${missing.join(', ')}` 
    });
  }
}

// Run all checks
checkRepositoryStructure();
checkGitConfiguration();
checkRenderYaml();
checkFrontendPackage();
checkBackendRequirements();
checkHealthEndpoints();

// Display results
console.log('📋 Validation Results:\n');
checks.forEach(check => {
  console.log(`${check.status} ${check.name}: ${check.message}`);
});

// Summary
const passed = checks.filter(check => check.status === '✅').length;
const warnings = checks.filter(check => check.status === '⚠️').length;
const failed = checks.filter(check => check.status === '❌').length;

console.log(`\n📊 Summary: ${passed} passed, ${warnings} warnings, ${failed} failed\n`);

if (failed === 0) {
  console.log('🎉 Configuration is ready for Render deployment!');
  console.log('\n📝 Next steps:');
  console.log('1. Push changes to GitHub: git push origin main');
  console.log('2. Update Render repository URL to: https://github.com/itsfornothing/ARBA-DELIVERY');
  console.log('3. Trigger new deployment in Render dashboard');
} else {
  console.log('⚠️  Please fix the failed checks before deploying to Render.');
  console.log('\n📖 See RENDER_DEPLOYMENT_FIX.md for detailed instructions.');
}

console.log('\n🔗 Repository URL for Render: https://github.com/itsfornothing/ARBA-DELIVERY');