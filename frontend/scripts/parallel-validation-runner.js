#!/usr/bin/env node

/**
 * Parallel Validation Runner
 * Runs TypeScript and ESLint validation in parallel for faster feedback
 */

const { spawn } = require('child_process');
const path = require('path');

class ParallelValidationRunner {
  constructor() {
    this.processes = [];
    this.results = {};
  }

  async runParallelValidation() {
    console.log('⚡ Starting parallel validation...');
    
    const validations = [
      {
        name: 'typescript',
        command: 'npm',
        args: ['run', 'type-check:fast'],
        timeout: 30000
      },
      {
        name: 'eslint',
        command: 'npm',
        args: ['run', 'lint:fast'],
        timeout: 30000
      }
    ];
    
    // Run validations in parallel
    const promises = validations.map(validation => this.runValidation(validation));
    
    try {
      const results = await Promise.allSettled(promises);
      
      let allPassed = true;
      results.forEach((result, index) => {
        const validation = validations[index];
        if (result.status === 'fulfilled') {
          console.log(`✅ ${validation.name} validation passed`);
        } else {
          console.error(`❌ ${validation.name} validation failed:`, result.reason);
          allPassed = false;
        }
      });
      
      if (allPassed) {
        console.log('🎉 All validations passed!');
        process.exit(0);
      } else {
        console.error('💥 Some validations failed');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Parallel validation failed:', error.message);
      process.exit(1);
    }
  }

  runValidation(validation) {
    return new Promise((resolve, reject) => {
      const process = spawn(validation.command, validation.args, {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      const timeout = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(`${validation.name} validation timed out after ${validation.timeout}ms`));
      }, validation.timeout);
      
      process.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          resolve({ name: validation.name, stdout, stderr });
        } else {
          reject(new Error(`${validation.name} validation failed with code ${code}\n${stderr}`));
        }
      });
      
      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(`${validation.name} validation process error: ${error.message}`));
      });
    });
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new ParallelValidationRunner();
  runner.runParallelValidation();
}

module.exports = ParallelValidationRunner;
