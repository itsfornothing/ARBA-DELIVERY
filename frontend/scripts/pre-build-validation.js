#!/usr/bin/env node

/**
 * Pre-build Validation Script
 * 
 * Validates the frontend environment and configuration before starting the build process.
 * This script ensures all dependencies, configurations, and imports are ready for a successful build.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class PreBuildValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  addError(message) {
    this.errors.push(message);
    this.log(message, 'error');
  }

  addWarning(message) {
    this.warnings.push(message);
    this.log(message, 'warning');
  }

  // Validate TypeScript configuration
  validateTypeScriptConfig() {
    this.log('Validating TypeScript configuration...');
    
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) {
      this.addError('tsconfig.json not found');
      return false;
    }

    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      // Check baseUrl
      if (!tsconfig.compilerOptions?.baseUrl) {
        this.addError('tsconfig.json missing baseUrl configuration');
      }

      // Check paths mapping
      if (!tsconfig.compilerOptions?.paths) {
        this.addError('tsconfig.json missing paths configuration');
      } else {
        const paths = tsconfig.compilerOptions.paths;
        if (!paths['@/*']) {
          this.addError('tsconfig.json missing @/* path mapping');
        }
      }

      // Check module resolution
      if (tsconfig.compilerOptions?.moduleResolution !== 'node') {
        this.addWarning('moduleResolution should be set to "node" for better compatibility');
      }

      this.log('TypeScript configuration validation completed');
      return true;
    } catch (error) {
      this.addError(`Failed to parse tsconfig.json: ${error.message}`);
      return false;
    }
  }

  // Validate Next.js configuration
  validateNextConfig() {
    this.log('Validating Next.js configuration...');
    
    const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
    if (!fs.existsSync(nextConfigPath)) {
      this.addWarning('next.config.js not found - using default configuration');
      return true;
    }

    try {
      // Basic validation - ensure the file can be required
      delete require.cache[require.resolve(nextConfigPath)];
      const nextConfig = require(nextConfigPath);
      
      if (typeof nextConfig !== 'object') {
        this.addError('next.config.js should export an object');
        return false;
      }

      this.log('Next.js configuration validation completed');
      return true;
    } catch (error) {
      this.addError(`Failed to load next.config.js: ${error.message}`);
      return false;
    }
  }

  // Validate package.json and dependencies
  validateDependencies() {
    this.log('Validating dependencies...');
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.addError('package.json not found');
      return false;
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for required dependencies
      const requiredDeps = ['clsx', 'tailwind-merge'];
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      for (const dep of requiredDeps) {
        if (!allDeps[dep]) {
          this.addError(`Required dependency '${dep}' not found in package.json`);
        } else {
          // Check if dependency is actually installed
          const depPath = path.join(this.projectRoot, 'node_modules', dep);
          if (!fs.existsSync(depPath)) {
            this.addError(`Dependency '${dep}' not installed. Run 'npm install'`);
          }
        }
      }

      this.log('Dependencies validation completed');
      return true;
    } catch (error) {
      this.addError(`Failed to parse package.json: ${error.message}`);
      return false;
    }
  }

  // Validate utility files exist
  validateUtilityFiles() {
    this.log('Validating utility files...');
    
    const utilityFiles = [
      'src/lib/utils.ts',
      'src/lib/validation.ts'
    ];

    let allFilesExist = true;
    for (const file of utilityFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (!fs.existsSync(filePath)) {
        this.addError(`Utility file not found: ${file}`);
        allFilesExist = false;
      } else {
        // Basic syntax check
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.trim().length === 0) {
            this.addWarning(`Utility file is empty: ${file}`);
          }
        } catch (error) {
          this.addError(`Cannot read utility file ${file}: ${error.message}`);
          allFilesExist = false;
        }
      }
    }

    this.log('Utility files validation completed');
    return allFilesExist;
  }

  // Validate import statements in components
  validateImportStatements() {
    this.log('Validating import statements...');
    
    const srcDir = path.join(this.projectRoot, 'src');
    if (!fs.existsSync(srcDir)) {
      this.addError('src directory not found');
      return false;
    }

    try {
      const files = this.getAllTsxFiles(srcDir);
      let hasImportIssues = false;

      for (const file of files) {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('import') && line.includes('@/lib/')) {
            // Check for common import patterns that might cause issues
            if (line.includes('@/lib/utils') && !line.includes('from "@/lib/utils"')) {
              this.addWarning(`Potential import issue in ${file}:${i + 1}: ${line}`);
            }
            if (line.includes('@/lib/validation') && !line.includes('from "@/lib/validation"')) {
              this.addWarning(`Potential import issue in ${file}:${i + 1}: ${line}`);
            }
          }
        }
      }

      this.log('Import statements validation completed');
      return !hasImportIssues;
    } catch (error) {
      this.addError(`Failed to validate import statements: ${error.message}`);
      return false;
    }
  }

  // Helper method to get all TypeScript/TSX files
  getAllTsxFiles(dir) {
    const files = [];
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
        files.push(...this.getAllTsxFiles(fullPath));
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  // Test TypeScript compilation
  testTypeScriptCompilation() {
    this.log('Testing TypeScript compilation...');
    
    try {
      execSync('npx tsc --noEmit', { 
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      this.log('TypeScript compilation test passed');
      return true;
    } catch (error) {
      this.addError(`TypeScript compilation failed: ${error.message}`);
      return false;
    }
  }

  // Generate validation report
  generateReport() {
    const report = {
      timestamp: new Date().toISOString(),
      status: this.errors.length === 0 ? 'PASSED' : 'FAILED',
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length
      }
    };

    const reportPath = path.join(this.projectRoot, 'pre-build-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Validation report saved to: ${reportPath}`);
    return report;
  }

  // Run all validations
  async runValidation() {
    this.log('Starting pre-build validation...');
    
    const validations = [
      () => this.validateTypeScriptConfig(),
      () => this.validateNextConfig(),
      () => this.validateDependencies(),
      () => this.validateUtilityFiles(),
      () => this.validateImportStatements(),
      () => this.testTypeScriptCompilation()
    ];

    for (const validation of validations) {
      try {
        await validation();
      } catch (error) {
        this.addError(`Validation step failed: ${error.message}`);
      }
    }

    const report = this.generateReport();
    
    if (report.status === 'PASSED') {
      this.log('✅ Pre-build validation completed successfully!');
      process.exit(0);
    } else {
      this.log('❌ Pre-build validation failed. Please fix the errors before building.');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new PreBuildValidator();
  validator.runValidation().catch(error => {
    console.error('Pre-build validation crashed:', error);
    process.exit(1);
  });
}

module.exports = PreBuildValidator;