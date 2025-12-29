#!/usr/bin/env node

/**
 * Pre-commit TypeScript Error Detection
 * 
 * Integrates with Git pre-commit hooks to validate TypeScript files
 * before they are committed to version control.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Pre-commit TypeScript validation
 */
class PreCommitTypeScriptValidator {
  constructor() {
    this.stagedFiles = [];
    this.errors = [];
    this.warnings = [];
    this.config = {
      fastFail: true,
      maxErrors: 50,
      enableSuggestions: true,
      allowWarnings: true
    };
  }

  /**
   * Main validation entry point
   */
  async validate() {
    console.log('🔍 Running pre-commit TypeScript validation...\n');

    try {
      // Get staged TypeScript files
      await this.getStagedFiles();
      
      if (this.stagedFiles.length === 0) {
        console.log('✅ No TypeScript files staged for commit\n');
        return true;
      }

      console.log(`📁 Found ${this.stagedFiles.length} staged TypeScript files:`);
      this.stagedFiles.forEach(file => console.log(`   - ${file}`));
      console.log('');

      // Run TypeScript validation on staged files
      const validationResult = await this.validateStagedFiles();
      
      // Report results
      await this.reportResults(validationResult);
      
      // Determine if commit should proceed
      return this.shouldAllowCommit(validationResult);
      
    } catch (error) {
      console.error('❌ Pre-commit validation failed:', error.message);
      return false;
    }
  }

  /**
   * Gets list of staged TypeScript files
   */
  async getStagedFiles() {
    try {
      const output = execSync('git diff --cached --name-only --diff-filter=ACM', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      this.stagedFiles = output
        .split('\n')
        .filter(file => file.trim())
        .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'))
        .filter(file => fs.existsSync(file))
        .map(file => path.resolve(file));
        
    } catch (error) {
      throw new Error(`Failed to get staged files: ${error.message}`);
    }
  }

  /**
   * Validates staged TypeScript files
   */
  async validateStagedFiles() {
    console.log('🔨 Running TypeScript compilation on staged files...');
    
    try {
      // Create temporary tsconfig for staged files only
      const tempTsConfig = await this.createTempTsConfig();
      
      // Run TypeScript compilation
      const command = `npx tsc --noEmit --project ${tempTsConfig}`;
      
      try {
        execSync(command, { 
          stdio: 'pipe',
          encoding: 'utf8'
        });
        
        // Clean up temp config
        fs.unlinkSync(tempTsConfig);
        
        return { success: true, errors: [], warnings: [] };
        
      } catch (error) {
        // Clean up temp config
        if (fs.existsSync(tempTsConfig)) {
          fs.unlinkSync(tempTsConfig);
        }
        
        // Parse TypeScript errors
        const errorOutput = error.stderr || error.stdout || '';
        const parsedErrors = this.parseTypeScriptOutput(errorOutput);
        
        return {
          success: false,
          errors: parsedErrors.errors,
          warnings: parsedErrors.warnings
        };
      }
      
    } catch (error) {
      throw new Error(`TypeScript validation failed: ${error.message}`);
    }
  }

  /**
   * Creates temporary tsconfig.json for staged files only
   */
  async createTempTsConfig() {
    const originalTsConfig = path.join(process.cwd(), 'tsconfig.json');
    const tempTsConfig = path.join(process.cwd(), 'tsconfig.precommit.json');
    
    if (!fs.existsSync(originalTsConfig)) {
      throw new Error('tsconfig.json not found');
    }
    
    // Read original tsconfig
    const originalConfig = JSON.parse(fs.readFileSync(originalTsConfig, 'utf8'));
    
    // Create modified config for staged files
    const tempConfig = {
      ...originalConfig,
      files: this.stagedFiles.map(file => path.relative(process.cwd(), file)),
      include: undefined, // Remove include to use files array
      exclude: originalConfig.exclude || []
    };
    
    // Write temporary config
    fs.writeFileSync(tempTsConfig, JSON.stringify(tempConfig, null, 2));
    
    return tempTsConfig;
  }

  /**
   * Parses TypeScript compiler output
   */
  parseTypeScriptOutput(output) {
    const lines = output.split('\n').filter(line => line.trim());
    const errors = [];
    const warnings = [];
    
    for (const line of lines) {
      const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
      
      if (match) {
        const [, file, lineNum, column, severity, code, message] = match;
        
        const error = {
          file: path.relative(process.cwd(), file),
          line: parseInt(lineNum),
          column: parseInt(column),
          severity,
          code: parseInt(code),
          message: message.trim(),
          category: this.categorizeError(parseInt(code))
        };
        
        if (severity === 'error') {
          errors.push(error);
        } else {
          warnings.push(error);
        }
      }
    }
    
    return { errors, warnings };
  }

  /**
   * Categorizes TypeScript errors
   */
  categorizeError(code) {
    if (code >= 1000 && code <= 1999) return 'SYNTAX_ERROR';
    if (code >= 2300 && code <= 2799) return 'TYPE_ERROR';
    if ([2307, 2304].includes(code)) return 'IMPORT_ERROR';
    if (code >= 5000 && code <= 5999) return 'CONFIGURATION_ERROR';
    if ([6133, 6196, 6198].includes(code)) return 'UNUSED_CODE';
    return 'GENERIC_ERROR';
  }

  /**
   * Reports validation results
   */
  async reportResults(result) {
    if (result.success) {
      console.log('✅ All staged TypeScript files are valid!\n');
      return;
    }
    
    console.log(`❌ Found ${result.errors.length} errors and ${result.warnings.length} warnings in staged files:\n`);
    
    // Show errors
    if (result.errors.length > 0) {
      console.log('❌ ERRORS:');
      console.log('-'.repeat(40));
      
      for (const error of result.errors.slice(0, 10)) {
        console.log(`📍 ${error.file}:${error.line}:${error.column}`);
        console.log(`   TS${error.code} [${error.category}]: ${error.message}`);
        console.log('');
      }
      
      if (result.errors.length > 10) {
        console.log(`... and ${result.errors.length - 10} more errors\n`);
      }
    }
    
    // Show warnings if configured
    if (result.warnings.length > 0 && this.config.allowWarnings) {
      console.log('⚠️  WARNINGS:');
      console.log('-'.repeat(40));
      
      for (const warning of result.warnings.slice(0, 5)) {
        console.log(`📍 ${warning.file}:${warning.line}:${warning.column}`);
        console.log(`   TS${warning.code} [${warning.category}]: ${warning.message}`);
        console.log('');
      }
      
      if (result.warnings.length > 5) {
        console.log(`... and ${result.warnings.length - 5} more warnings\n`);
      }
    }
    
    // Show suggestions
    if (this.config.enableSuggestions) {
      this.showSuggestions(result);
    }
  }

  /**
   * Shows suggestions for fixing errors
   */
  showSuggestions(result) {
    const suggestions = [];
    
    // Analyze error patterns
    const errorsByCategory = this.groupErrorsByCategory(result.errors);
    
    if (errorsByCategory.has('SYNTAX_ERROR')) {
      suggestions.push('🔧 Fix syntax errors by checking brackets, semicolons, and other syntax elements');
    }
    
    if (errorsByCategory.has('TYPE_ERROR')) {
      suggestions.push('🔧 Add explicit type annotations or fix type mismatches');
    }
    
    if (errorsByCategory.has('IMPORT_ERROR')) {
      suggestions.push('🔧 Check import paths and ensure all dependencies are installed');
      suggestions.push('   Run: npm install or npm ci');
    }
    
    if (errorsByCategory.has('UNUSED_CODE')) {
      suggestions.push('♻️  Remove unused variables or prefix them with underscore');
    }
    
    if (suggestions.length > 0) {
      console.log('💡 SUGGESTIONS:');
      console.log('-'.repeat(40));
      suggestions.forEach(suggestion => console.log(suggestion));
      console.log('');
    }
    
    // Quick fix commands
    console.log('🚀 QUICK FIXES:');
    console.log('-'.repeat(40));
    console.log('1. Fix auto-fixable issues: npm run lint:fix');
    console.log('2. Check types manually: npm run type-check');
    console.log('3. Format code: npm run format');
    console.log('4. Run full build: npm run build');
    console.log('');
  }

  /**
   * Groups errors by category
   */
  groupErrorsByCategory(errors) {
    const grouped = new Map();
    
    for (const error of errors) {
      const existing = grouped.get(error.category) || [];
      existing.push(error);
      grouped.set(error.category, existing);
    }
    
    return grouped;
  }

  /**
   * Determines if commit should be allowed
   */
  shouldAllowCommit(result) {
    if (result.success) {
      return true;
    }
    
    // Check for critical errors
    const criticalErrors = result.errors.filter(error => 
      ['SYNTAX_ERROR', 'CONFIGURATION_ERROR', 'IMPORT_ERROR'].includes(error.category)
    );
    
    if (criticalErrors.length > 0) {
      console.log('🚨 COMMIT BLOCKED: Critical TypeScript errors must be fixed before committing');
      console.log(`   Found ${criticalErrors.length} critical errors that prevent compilation`);
      console.log('');
      return false;
    }
    
    // Allow commit with non-critical errors if fast-fail is disabled
    if (!this.config.fastFail && result.errors.length > 0) {
      console.log('⚠️  COMMIT ALLOWED: Non-critical errors found, but fast-fail is disabled');
      console.log('   Please fix these errors in a follow-up commit');
      console.log('');
      return true;
    }
    
    // Block commit if there are any errors and fast-fail is enabled
    if (result.errors.length > 0) {
      console.log('🚨 COMMIT BLOCKED: TypeScript errors must be fixed before committing');
      console.log('   Use --no-verify to bypass this check (not recommended)');
      console.log('');
      return false;
    }
    
    return true;
  }
}

/**
 * Integration with different Git hook systems
 */
class GitHookIntegration {
  /**
   * Generates Husky pre-commit hook
   */
  static generateHuskyHook() {
    return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Run TypeScript validation on staged files
node scripts/pre-commit-typescript-check.js

# Run lint-staged for other checks
npx lint-staged`;
  }

  /**
   * Generates lint-staged configuration
   */
  static generateLintStagedConfig() {
    return {
      "*.{ts,tsx}": [
        "node scripts/pre-commit-typescript-check.js",
        "eslint --fix",
        "prettier --write"
      ],
      "*.{js,jsx,json,css,md}": [
        "prettier --write"
      ]
    };
  }

  /**
   * Generates package.json scripts
   */
  static generatePackageScripts() {
    return {
      "pre-commit": "node scripts/pre-commit-typescript-check.js",
      "pre-commit:bypass": "echo 'Bypassing pre-commit TypeScript check'",
      "validate:staged": "node scripts/pre-commit-typescript-check.js"
    };
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  // Handle special commands
  if (args.includes('--generate-hooks')) {
    console.log('Generating Git hook configurations...\n');
    
    console.log('Husky pre-commit hook:');
    console.log(GitHookIntegration.generateHuskyHook());
    console.log('\nlint-staged configuration:');
    console.log(JSON.stringify(GitHookIntegration.generateLintStagedConfig(), null, 2));
    console.log('\nPackage.json scripts:');
    console.log(JSON.stringify(GitHookIntegration.generatePackageScripts(), null, 2));
    
    return;
  }
  
  if (args.includes('--help')) {
    console.log(`
Pre-commit TypeScript Validation

Usage: node pre-commit-typescript-check.js [options]

Options:
  --help              Show this help message
  --generate-hooks    Generate Git hook configurations
  --no-fast-fail      Allow commit with non-critical errors
  --no-suggestions    Disable suggestion generation

Examples:
  node pre-commit-typescript-check.js
  node pre-commit-typescript-check.js --no-fast-fail
  node pre-commit-typescript-check.js --generate-hooks
`);
    return;
  }
  
  // Run validation
  const validator = new PreCommitTypeScriptValidator();
  
  // Configure based on arguments
  if (args.includes('--no-fast-fail')) {
    validator.config.fastFail = false;
  }
  
  if (args.includes('--no-suggestions')) {
    validator.config.enableSuggestions = false;
  }
  
  const success = await validator.validate();
  process.exit(success ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Pre-commit validation failed:', error.message);
    process.exit(1);
  });
}

module.exports = { PreCommitTypeScriptValidator, GitHookIntegration };