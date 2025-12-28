#!/usr/bin/env node

/**
 * Build Error Handler Script
 * 
 * Enhances the build process with better error detection and reporting.
 * This script wraps the standard build process and provides detailed
 * diagnostics for common build failures.
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class BuildErrorHandler {
  constructor() {
    this.buildStartTime = Date.now();
    this.buildLogs = [];
    this.errors = [];
  }

  /**
   * Main build execution with enhanced error handling
   */
  async executeBuild() {
    console.log('🚀 Starting enhanced build process...\n');
    
    try {
      // Pre-build validation
      await this.validateBuildEnvironment();
      
      // Execute the actual build
      await this.runBuildProcess();
      
      // Post-build validation
      await this.validateBuildOutput();
      
      console.log('✅ Build completed successfully!');
      this.reportBuildSuccess();
      
    } catch (error) {
      console.error('❌ Build failed with errors');
      this.handleBuildError(error);
      process.exit(1);
    }
  }

  /**
   * Validates the build environment before starting
   */
  async validateBuildEnvironment() {
    console.log('🔍 Validating build environment...');
    
    const validations = [
      this.checkNodeVersion(),
      this.checkPackageJson(),
      this.checkDependencies(),
      this.checkEnvironmentVariables(),
      this.checkDirectoryStructure(),
    ];
    
    const results = await Promise.allSettled(validations);
    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      const errorMessages = failures.map(failure => failure.reason.message);
      throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
    }
    
    console.log('✅ Environment validation passed\n');
  }

  /**
   * Executes the build process with enhanced monitoring
   */
  async runBuildProcess() {
    console.log('🔨 Running build process...');
    
    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });
      
      let stdout = '';
      let stderr = '';
      
      buildProcess.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        this.buildLogs.push({ type: 'stdout', message: output, timestamp: Date.now() });
        process.stdout.write(output);
      });
      
      buildProcess.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
        this.buildLogs.push({ type: 'stderr', message: output, timestamp: Date.now() });
        process.stderr.write(output);
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr });
        } else {
          const error = new Error(`Build process exited with code ${code}`);
          error.stdout = stdout;
          error.stderr = stderr;
          error.exitCode = code;
          reject(error);
        }
      });
      
      buildProcess.on('error', (error) => {
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      });
    });
  }

  /**
   * Validates the build output
   */
  async validateBuildOutput() {
    console.log('🔍 Validating build output...');
    
    const validations = [
      this.checkBuildDirectory(),
      this.checkStaticAssets(),
      this.checkNextJsOutput(),
      this.validateAssetsWithScript(),
    ];
    
    const results = await Promise.allSettled(validations);
    const failures = results.filter(result => result.status === 'rejected');
    
    if (failures.length > 0) {
      const errorMessages = failures.map(failure => failure.reason.message);
      throw new Error(`Build output validation failed:\n${errorMessages.join('\n')}`);
    }
    
    console.log('✅ Build output validation passed\n');
  }

  /**
   * Enhanced error handling with detailed diagnostics
   */
  handleBuildError(error) {
    console.error('\n' + '='.repeat(80));
    console.error('🚨 BUILD ERROR ANALYSIS');
    console.error('='.repeat(80));
    
    // Analyze the error type
    const errorAnalysis = this.analyzeBuildError(error);
    
    console.error(`\n📋 Error Type: ${errorAnalysis.type}`);
    console.error(`📝 Description: ${errorAnalysis.description}`);
    console.error(`🔍 Root Cause: ${errorAnalysis.rootCause}`);
    
    if (errorAnalysis.pathIssues.length > 0) {
      console.error('\n📁 Path Issues Detected:');
      errorAnalysis.pathIssues.forEach((issue, index) => {
        console.error(`   ${index + 1}. ${issue}`);
      });
    }
    
    console.error('\n💡 Suggested Solutions:');
    errorAnalysis.suggestions.forEach((suggestion, index) => {
      console.error(`   ${index + 1}. ${suggestion}`);
    });
    
    if (errorAnalysis.renderSpecific.length > 0) {
      console.error('\n🌐 Render.com Specific Fixes:');
      errorAnalysis.renderSpecific.forEach((fix, index) => {
        console.error(`   ${index + 1}. ${fix}`);
      });
    }
    
    // Generate diagnostic report
    this.generateDiagnosticReport(error, errorAnalysis);
    
    console.error('\n' + '='.repeat(80));
    console.error('📊 Diagnostic report saved to: build-error-report.json');
    console.error('='.repeat(80) + '\n');
  }

  /**
   * Analyzes build errors and categorizes them
   */
  analyzeBuildError(error) {
    const errorMessage = error.message || '';
    const stderr = error.stderr || '';
    const stdout = error.stdout || '';
    const fullOutput = `${errorMessage}\n${stderr}\n${stdout}`;
    
    // Path-related errors
    if (this.isPathError(fullOutput)) {
      return {
        type: 'PATH_ERROR',
        description: 'Build failed due to incorrect file or directory paths',
        rootCause: 'The build process cannot locate required files (likely package.json)',
        pathIssues: this.extractPathIssues(fullOutput),
        suggestions: [
          'Verify the repository directory structure matches expectations',
          'Check if package.json exists in the correct location',
          'Update render.yaml buildCommand to use correct directory paths',
          'Ensure build commands run from the proper working directory',
        ],
        renderSpecific: [
          'Update render.yaml: "cd frontend && npm ci && npm run build"',
          'Verify frontend/ directory exists at repository root',
          'Check Render build logs for actual vs expected paths',
        ],
      };
    }
    
    // Dependency errors
    if (this.isDependencyError(fullOutput)) {
      return {
        type: 'DEPENDENCY_ERROR',
        description: 'Build failed due to dependency installation or resolution issues',
        rootCause: 'npm cannot install or resolve project dependencies',
        pathIssues: [],
        suggestions: [
          'Use "npm ci" instead of "npm install" for consistent installs',
          'Verify package-lock.json is committed and up to date',
          'Check Node.js version compatibility',
          'Clear node_modules and reinstall dependencies',
        ],
        renderSpecific: [
          'Ensure render.yaml uses "npm ci --only=production"',
          'Verify NODE_VERSION is set correctly in render.yaml',
          'Check if all dependencies support the Node.js version',
        ],
      };
    }
    
    // Environment errors
    if (this.isEnvironmentError(fullOutput)) {
      return {
        type: 'ENVIRONMENT_ERROR',
        description: 'Build failed due to missing or invalid environment configuration',
        rootCause: 'Required environment variables or configuration are missing',
        pathIssues: [],
        suggestions: [
          'Verify all required environment variables are set',
          'Check environment variable names for typos',
          'Validate environment values are correct',
          'Ensure variables are available during build time',
        ],
        renderSpecific: [
          'Add missing environment variables to render.yaml',
          'Verify NEXT_PUBLIC_* variables are set correctly',
          'Check if environment variables are accessible in build context',
        ],
      };
    }
    
    // Default unknown error
    return {
      type: 'UNKNOWN_ERROR',
      description: 'Build failed with an unrecognized error',
      rootCause: 'The specific cause could not be determined automatically',
      pathIssues: [],
      suggestions: [
        'Review the complete build logs for additional context',
        'Try running the build locally to reproduce the issue',
        'Check for recent changes that might have caused the failure',
        'Verify all build requirements are met',
      ],
      renderSpecific: [
        'Check Render build logs for additional error details',
        'Verify render.yaml configuration is correct',
        'Compare with a known working deployment configuration',
      ],
    };
  }

  /**
   * Validation methods
   */
  checkNodeVersion() {
    const version = process.version;
    const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
    
    if (majorVersion < 18) {
      throw new Error(`Node.js version ${version} is not supported. Minimum required: v18.0.0`);
    }
    
    console.log(`✅ Node.js version: ${version}`);
  }

  checkPackageJson() {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error(`package.json not found at: ${packageJsonPath}`);
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      if (!packageJson.scripts || !packageJson.scripts.build) {
        throw new Error('package.json is missing build script');
      }
      
      console.log(`✅ package.json found with build script`);
    } catch (error) {
      throw new Error(`Invalid package.json: ${error.message}`);
    }
  }

  checkDependencies() {
    const nodeModulesPath = path.join(process.cwd(), 'node_modules');
    
    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error('node_modules directory not found. Run "npm install" first.');
    }
    
    console.log(`✅ node_modules directory exists`);
  }

  checkEnvironmentVariables() {
    const requiredVars = ['NODE_ENV'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.warn(`⚠️  Missing optional environment variables: ${missingVars.join(', ')}`);
    }
    
    console.log(`✅ Environment variables checked`);
  }

  checkDirectoryStructure() {
    const requiredDirs = ['src', 'public'];
    const missingDirs = requiredDirs.filter(dir => !fs.existsSync(path.join(process.cwd(), dir)));
    
    if (missingDirs.length > 0) {
      throw new Error(`Missing required directories: ${missingDirs.join(', ')}`);
    }
    
    console.log(`✅ Directory structure validated`);
  }

  checkBuildDirectory() {
    const buildDir = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(buildDir)) {
      throw new Error('Build output directory (.next) not found');
    }
    
    console.log(`✅ Build directory exists`);
  }

  checkStaticAssets() {
    const staticDir = path.join(process.cwd(), '.next', 'static');
    
    if (!fs.existsSync(staticDir)) {
      throw new Error('Static assets directory not found in build output');
    }
    
    console.log(`✅ Static assets generated`);
  }

  checkNextJsOutput() {
    const serverDir = path.join(process.cwd(), '.next', 'server');
    
    if (!fs.existsSync(serverDir)) {
      throw new Error('Next.js server output not found');
    }
    
    console.log(`✅ Next.js server output generated`);
  }

  /**
   * Validates assets using the dedicated asset validation script
   */
  async validateAssetsWithScript() {
    console.log('🔍 Running comprehensive asset validation...');
    
    return new Promise((resolve, reject) => {
      const { spawn } = require('child_process');
      const assetValidator = spawn('node', ['scripts/validate-assets.js'], {
        stdio: ['inherit', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });
      
      let stdout = '';
      let stderr = '';
      
      assetValidator.stdout.on('data', (data) => {
        const output = data.toString();
        stdout += output;
        // Don't echo to console as the script handles its own output
      });
      
      assetValidator.stderr.on('data', (data) => {
        const output = data.toString();
        stderr += output;
      });
      
      assetValidator.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Asset validation completed successfully');
          resolve({ stdout, stderr });
        } else {
          reject(new Error(`Asset validation failed with exit code ${code}\n${stderr}`));
        }
      });
      
      assetValidator.on('error', (error) => {
        reject(new Error(`Asset validation script error: ${error.message}`));
      });
    });
  }

  /**
   * Error detection helpers
   */
  isPathError(output) {
    const pathPatterns = [
      /ENOENT.*package\.json/i,
      /Cannot find module.*package\.json/i,
      /No such file or directory.*package\.json/i,
      /npm error path.*package\.json/i,
      /Error: Cannot resolve.*src\/frontend/i,
      /Module not found.*frontend/i,
    ];
    
    return pathPatterns.some(pattern => pattern.test(output));
  }

  isDependencyError(output) {
    const depPatterns = [
      /npm ERR! peer dep missing/i,
      /Module not found: Can't resolve/i,
      /Cannot resolve dependency/i,
      /npm ERR! missing script/i,
      /npm ERR! code ELIFECYCLE/i,
    ];
    
    return depPatterns.some(pattern => pattern.test(output));
  }

  isEnvironmentError(output) {
    const envPatterns = [
      /Missing required environment variable/i,
      /Environment variable.*not defined/i,
      /Invalid environment configuration/i,
      /NODE_ENV.*not set/i,
    ];
    
    return envPatterns.some(pattern => pattern.test(output));
  }

  extractPathIssues(output) {
    const issues = [];
    const pathMatches = output.match(/(?:path|file|directory)[\s:]*([^\s]+)/gi);
    
    if (pathMatches) {
      pathMatches.forEach(match => {
        issues.push(`Problematic path detected: ${match}`);
      });
    }
    
    return issues;
  }

  /**
   * Generate diagnostic report
   */
  generateDiagnosticReport(error, analysis) {
    const report = {
      timestamp: new Date().toISOString(),
      buildDuration: Date.now() - this.buildStartTime,
      error: {
        message: error.message,
        stack: error.stack,
        exitCode: error.exitCode,
      },
      analysis,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
        env: {
          NODE_ENV: process.env.NODE_ENV,
          NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
          NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
        },
      },
      buildLogs: this.buildLogs.slice(-50), // Last 50 log entries
    };
    
    fs.writeFileSync('build-error-report.json', JSON.stringify(report, null, 2));
  }

  /**
   * Report successful build
   */
  reportBuildSuccess() {
    const duration = Date.now() - this.buildStartTime;
    console.log(`\n🎉 Build completed successfully in ${duration}ms`);
    
    // Generate success report
    const report = {
      timestamp: new Date().toISOString(),
      buildDuration: duration,
      status: 'success',
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
      },
    };
    
    fs.writeFileSync('build-success-report.json', JSON.stringify(report, null, 2));
  }
}

// Execute if run directly
if (require.main === module) {
  const handler = new BuildErrorHandler();
  handler.executeBuild().catch(console.error);
}

module.exports = BuildErrorHandler;