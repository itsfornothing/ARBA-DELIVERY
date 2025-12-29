#!/usr/bin/env node

/**
 * Deployment Readiness Check
 * Verifies that the application is ready for deployment to Render
 */

const fs = require('fs');
const path = require('path');

class DeploymentReadinessCheck {
  constructor() {
    this.checks = [];
    this.warnings = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  addCheck(name, passed, message) {
    this.checks.push({ name, passed, message });
    if (passed) {
      this.log(`${name}: ${message}`, 'success');
    } else {
      this.log(`${name}: ${message}`, 'error');
      this.errors.push(`${name}: ${message}`);
    }
  }

  addWarning(name, message) {
    this.warnings.push(`${name}: ${message}`);
    this.log(`${name}: ${message}`, 'warning');
  }

  checkPackageJson() {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (!fs.existsSync(packagePath)) {
      this.addCheck('Package.json', false, 'package.json not found');
      return;
    }

    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Check required scripts
    const requiredScripts = ['build', 'start'];
    const missingScripts = requiredScripts.filter(script => !pkg.scripts[script]);
    
    if (missingScripts.length > 0) {
      this.addCheck('Required Scripts', false, `Missing scripts: ${missingScripts.join(', ')}`);
    } else {
      this.addCheck('Required Scripts', true, 'All required scripts present');
    }

    // Check dependencies
    const requiredDeps = ['next', 'react', 'react-dom'];
    const missingDeps = requiredDeps.filter(dep => !pkg.dependencies[dep]);
    
    if (missingDeps.length > 0) {
      this.addCheck('Required Dependencies', false, `Missing dependencies: ${missingDeps.join(', ')}`);
    } else {
      this.addCheck('Required Dependencies', true, 'All required dependencies present');
    }

    // Check for utility dependencies
    const utilityDeps = ['clsx', 'tailwind-merge'];
    const missingUtilityDeps = utilityDeps.filter(dep => !pkg.dependencies[dep]);
    
    if (missingUtilityDeps.length > 0) {
      this.addCheck('Utility Dependencies', false, `Missing utility dependencies: ${missingUtilityDeps.join(', ')}`);
    } else {
      this.addCheck('Utility Dependencies', true, 'All utility dependencies present');
    }
  }

  checkNextConfig() {
    const configPath = path.join(process.cwd(), 'next.config.js');
    if (!fs.existsSync(configPath)) {
      this.addWarning('Next.js Config', 'next.config.js not found - using defaults');
      return;
    }

    try {
      const config = require(configPath);
      
      // Check for standalone output (recommended for Render)
      if (config.output === 'standalone') {
        this.addCheck('Standalone Output', true, 'Configured for standalone deployment');
      } else {
        this.addWarning('Standalone Output', 'Consider using output: "standalone" for better deployment');
      }

      // Check for environment variables configuration
      if (config.env || config.publicRuntimeConfig) {
        this.addCheck('Environment Config', true, 'Environment variables configured');
      } else {
        this.addWarning('Environment Config', 'No environment variables configured');
      }

    } catch (error) {
      this.addCheck('Next.js Config', false, `Invalid next.config.js: ${error.message}`);
    }
  }

  checkTypeScriptConfig() {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      this.addWarning('TypeScript Config', 'tsconfig.json not found');
      return;
    }

    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      // Check for path mappings
      if (tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
        const paths = tsconfig.compilerOptions.paths;
        if (paths['@/*']) {
          this.addCheck('Path Mappings', true, 'Path mappings configured correctly');
        } else {
          this.addCheck('Path Mappings', false, '@/* path mapping not found');
        }
      } else {
        this.addCheck('Path Mappings', false, 'No path mappings configured');
      }

      // Check baseUrl
      if (tsconfig.compilerOptions && tsconfig.compilerOptions.baseUrl) {
        this.addCheck('Base URL', true, 'Base URL configured');
      } else {
        this.addCheck('Base URL', false, 'Base URL not configured');
      }

    } catch (error) {
      this.addCheck('TypeScript Config', false, `Invalid tsconfig.json: ${error.message}`);
    }
  }

  checkUtilityFiles() {
    const utilsPath = path.join(process.cwd(), 'src/lib/utils.ts');
    const validationPath = path.join(process.cwd(), 'src/lib/validation.ts');

    if (fs.existsSync(utilsPath)) {
      this.addCheck('Utils File', true, 'src/lib/utils.ts exists');
    } else {
      this.addCheck('Utils File', false, 'src/lib/utils.ts not found');
    }

    if (fs.existsSync(validationPath)) {
      this.addCheck('Validation File', true, 'src/lib/validation.ts exists');
    } else {
      this.addCheck('Validation File', false, 'src/lib/validation.ts not found');
    }
  }

  checkBuildOutput() {
    const buildDir = path.join(process.cwd(), '.next');
    if (!fs.existsSync(buildDir)) {
      this.addCheck('Build Output', false, 'No build output found - run npm run build first');
      return;
    }

    // Check for critical build files
    const criticalFiles = [
      '.next/BUILD_ID',
      '.next/static',
      '.next/server'
    ];

    const missingFiles = criticalFiles.filter(file => 
      !fs.existsSync(path.join(process.cwd(), file))
    );

    if (missingFiles.length > 0) {
      this.addCheck('Build Files', false, `Missing build files: ${missingFiles.join(', ')}`);
    } else {
      this.addCheck('Build Files', true, 'All critical build files present');
    }

    // Check for standalone build
    const standalonePath = path.join(process.cwd(), '.next/standalone');
    if (fs.existsSync(standalonePath)) {
      this.addCheck('Standalone Build', true, 'Standalone build output present');
    } else {
      this.addWarning('Standalone Build', 'No standalone build output - check next.config.js');
    }
  }

  checkEnvironmentVariables() {
    const envLocalPath = path.join(process.cwd(), '.env.local');
    const envPath = path.join(process.cwd(), '.env');

    if (fs.existsSync(envLocalPath) || fs.existsSync(envPath)) {
      this.addCheck('Environment File', true, 'Environment file found');
    } else {
      this.addWarning('Environment File', 'No .env file found - ensure environment variables are configured in Render');
    }

    // Check for required environment variables in process.env
    const requiredEnvVars = ['NEXT_PUBLIC_API_URL'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingEnvVars.length > 0) {
      this.addWarning('Environment Variables', `Missing environment variables: ${missingEnvVars.join(', ')}`);
    } else {
      this.addCheck('Environment Variables', true, 'Required environment variables present');
    }
  }

  checkRenderConfig() {
    const renderConfigPath = path.join(process.cwd(), '../render.yaml');
    if (!fs.existsSync(renderConfigPath)) {
      this.addWarning('Render Config', 'render.yaml not found in parent directory');
      return;
    }

    try {
      const renderConfig = fs.readFileSync(renderConfigPath, 'utf8');
      
      if (renderConfig.includes('arba-delivery-frontend')) {
        this.addCheck('Render Service Config', true, 'Frontend service configured in render.yaml');
      } else {
        this.addCheck('Render Service Config', false, 'Frontend service not found in render.yaml');
      }

      if (renderConfig.includes('npm run build')) {
        this.addCheck('Render Build Command', true, 'Build command configured in render.yaml');
      } else {
        this.addWarning('Render Build Command', 'Build command not found in render.yaml');
      }

      if (renderConfig.includes('npm start')) {
        this.addCheck('Render Start Command', true, 'Start command configured in render.yaml');
      } else {
        this.addWarning('Render Start Command', 'Start command not found in render.yaml');
      }

    } catch (error) {
      this.addCheck('Render Config', false, `Error reading render.yaml: ${error.message}`);
    }
  }

  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalChecks: this.checks.length,
        passed: this.checks.filter(c => c.passed).length,
        failed: this.checks.filter(c => !c.passed).length,
        warnings: this.warnings.length
      },
      checks: this.checks,
      warnings: this.warnings,
      errors: this.errors,
      readyForDeployment: this.errors.length === 0
    };

    // Save report
    const reportPath = path.join(process.cwd(), 'deployment-readiness-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    return report;
  }

  printSummary(report) {
    console.log('\n' + '='.repeat(60));
    console.log('🚀 DEPLOYMENT READINESS CHECK SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${report.summary.passed}/${report.summary.totalChecks}`);
    console.log(`❌ Failed: ${report.summary.failed}/${report.summary.totalChecks}`);
    console.log(`⚠️  Warnings: ${report.summary.warnings}`);
    console.log('='.repeat(60));

    if (report.readyForDeployment) {
      console.log('🎉 Application is ready for deployment to Render!');
      console.log('\nNext steps:');
      console.log('1. Commit and push your changes to your Git repository');
      console.log('2. Connect your repository to Render');
      console.log('3. Configure environment variables in Render dashboard');
      console.log('4. Deploy using the render.yaml configuration');
    } else {
      console.log('⚠️  Application has issues that should be resolved before deployment:');
      report.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    if (report.warnings.length > 0) {
      console.log('\n⚠️  Warnings (optional improvements):');
      report.warnings.forEach(warning => {
        console.log(`   • ${warning}`);
      });
    }

    console.log('='.repeat(60));
    console.log(`📄 Detailed report saved to: deployment-readiness-report.json`);
    
    return report.readyForDeployment;
  }

  run() {
    this.log('🔍 Starting deployment readiness check...');

    this.checkPackageJson();
    this.checkNextConfig();
    this.checkTypeScriptConfig();
    this.checkUtilityFiles();
    this.checkBuildOutput();
    this.checkEnvironmentVariables();
    this.checkRenderConfig();

    const report = this.generateReport();
    const ready = this.printSummary(report);
    
    process.exit(ready ? 0 : 1);
  }
}

// Run the check if called directly
if (require.main === module) {
  const checker = new DeploymentReadinessCheck();
  checker.run();
}

module.exports = DeploymentReadinessCheck;