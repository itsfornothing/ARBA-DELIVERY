#!/usr/bin/env node

/**
 * Deployment Test Runner
 * Runs all deployment validation tests including unit tests and integration tests
 * Validates: Requirements 6.1, 6.2, 6.3
 */

const { spawn } = require('child_process');
const path = require('path');

class DeploymentTestRunner {
  constructor() {
    this.results = {
      unitTests: { status: false, output: '' },
      integrationTests: { status: false, output: '' },
      deploymentValidation: { status: false, output: '' },
      errors: []
    };
  }

  async runAllTests() {
    console.log('🧪 Starting Deployment Test Suite...\n');

    try {
      // Step 1: Run unit tests
      await this.runUnitTests();

      // Step 2: Run integration tests
      await this.runIntegrationTests();

      // Step 3: Run deployment validation
      await this.runDeploymentValidation();

      // Generate summary report
      this.generateSummary();

      const allPassed = Object.values(this.results).every(result => 
        typeof result === 'object' && result.status === true
      );

      if (allPassed) {
        console.log('\n✅ All deployment tests passed!');
        process.exit(0);
      } else {
        console.log('\n❌ Some deployment tests failed.');
        process.exit(1);
      }

    } catch (error) {
      console.error('\n💥 Deployment test suite failed:', error.message);
      process.exit(1);
    }
  }

  async runUnitTests() {
    console.log('🔍 Running Unit Tests...');
    
    try {
      const output = await this.runCommand('npm', ['test', '--', '--testPathPattern=deployment.*test'], {
        cwd: path.join(__dirname, '../frontend')
      });

      this.results.unitTests.status = true;
      this.results.unitTests.output = output;
      console.log('  ✅ Unit tests passed');
    } catch (error) {
      this.results.unitTests.output = error.message;
      this.results.errors.push(`Unit tests: ${error.message}`);
      console.log('  ❌ Unit tests failed');
    }
  }

  async runIntegrationTests() {
    console.log('🔍 Running Integration Tests...');
    
    try {
      const output = await this.runCommand('npm', ['test', '--', '--testPathPattern=deployment-pipeline-integration'], {
        cwd: path.join(__dirname, '../frontend')
      });

      this.results.integrationTests.status = true;
      this.results.integrationTests.output = output;
      console.log('  ✅ Integration tests passed');
    } catch (error) {
      this.results.integrationTests.output = error.message;
      this.results.errors.push(`Integration tests: ${error.message}`);
      console.log('  ❌ Integration tests failed');
    }
  }

  async runDeploymentValidation() {
    console.log('🔍 Running Deployment Validation...');
    
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';

      const output = await this.runCommand('node', [
        'deployment-pipeline-validator.js',
        '--frontend-url', frontendUrl,
        '--backend-url', backendUrl
      ], {
        cwd: path.join(__dirname)
      });

      this.results.deploymentValidation.status = true;
      this.results.deploymentValidation.output = output;
      console.log('  ✅ Deployment validation passed');
    } catch (error) {
      this.results.deploymentValidation.output = error.message;
      this.results.errors.push(`Deployment validation: ${error.message}`);
      console.log('  ❌ Deployment validation failed');
    }
  }

  runCommand(command, args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        stdio: 'pipe',
        ...options
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || stdout || `Command failed with exit code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Set timeout for long-running tests
      setTimeout(() => {
        child.kill();
        reject(new Error('Test timeout'));
      }, 300000); // 5 minutes timeout
    });
  }

  generateSummary() {
    console.log('\n📊 Deployment Test Summary');
    console.log('='.repeat(30));

    const tests = [
      { name: 'Unit Tests', result: this.results.unitTests },
      { name: 'Integration Tests', result: this.results.integrationTests },
      { name: 'Deployment Validation', result: this.results.deploymentValidation }
    ];

    tests.forEach(test => {
      const status = test.result.status ? '✅ PASS' : '❌ FAIL';
      console.log(`${test.name}: ${status}`);
    });

    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }

    // Save detailed results to file
    const fs = require('fs');
    const reportPath = path.join(__dirname, '../deployment-test-results.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        totalTests: tests.length,
        passed: tests.filter(t => t.result.status).length,
        failed: tests.filter(t => !t.result.status).length
      }
    }, null, 2));

    console.log(`\n📄 Detailed results saved to: ${reportPath}`);
  }
}

// CLI execution
async function main() {
  const runner = new DeploymentTestRunner();
  await runner.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeploymentTestRunner;