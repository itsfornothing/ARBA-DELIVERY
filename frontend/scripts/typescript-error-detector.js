#!/usr/bin/env node

/**
 * TypeScript Error Detection CLI
 * 
 * Command-line interface for the TypeScript error detection system.
 * Provides automated error detection, categorization, and reporting.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  projectPath: process.cwd(),
  tsconfigPath: path.join(process.cwd(), 'tsconfig.json'),
  maxErrors: 100,
  fastFail: true,
  outputFormat: 'detailed', // 'detailed', 'json', 'summary'
  enableSuggestions: true,
  enableQuickFixes: false,
  excludePatterns: ['node_modules', '.next', 'dist', 'build'],
  includePatterns: []
};

/**
 * TypeScript Error Categories and Priorities
 */
const ERROR_CATEGORIES = {
  CRITICAL: ['SYNTAX_ERROR', 'CONFIGURATION_ERROR', 'IMPORT_ERROR'],
  HIGH: ['TYPE_ERROR', 'DECLARATION_ERROR'],
  MEDIUM: ['STRICT_MODE_ERROR', 'GENERIC_ERROR'],
  LOW: ['UNUSED_CODE', 'DEPRECATED_API']
};

/**
 * Error Detection and Reporting System
 */
class TypeScriptErrorDetector {
  constructor(config = CONFIG) {
    this.config = { ...CONFIG, ...config };
    this.errors = [];
    this.warnings = [];
    this.suggestions = [];
    this.performance = {
      startTime: 0,
      endTime: 0,
      filesProcessed: 0,
      totalErrors: 0
    };
  }

  /**
   * Main entry point for error detection
   */
  async detectErrors(filePaths = []) {
    console.log('🔍 Starting TypeScript Error Detection...\n');
    this.performance.startTime = Date.now();

    try {
      // Validate TypeScript configuration
      await this.validateConfiguration();
      
      // Run TypeScript compilation with error capture
      const compilationResult = await this.runTypeScriptCompilation(filePaths);
      
      // Process and categorize errors
      await this.processCompilationResults(compilationResult);
      
      // Generate suggestions and quick fixes
      if (this.config.enableSuggestions) {
        await this.generateSuggestions();
      }
      
      // Report results
      await this.reportResults();
      
      // Handle fast-fail if enabled
      if (this.config.fastFail && this.hasCriticalErrors()) {
        this.handleFastFail();
      }
      
    } catch (error) {
      console.error('❌ Error detection failed:', error.message);
      process.exit(1);
    } finally {
      this.performance.endTime = Date.now();
    }
  }

  /**
   * Validates TypeScript configuration
   */
  async validateConfiguration() {
    console.log('📋 Validating TypeScript configuration...');
    
    // Check if tsconfig.json exists
    if (!fs.existsSync(this.config.tsconfigPath)) {
      throw new Error(`tsconfig.json not found at ${this.config.tsconfigPath}`);
    }
    
    // Use TypeScript to validate the config instead of manual JSON parsing
    try {
      execSync('npx tsc --showConfig', { stdio: 'pipe', cwd: this.config.projectPath });
    } catch (error) {
      throw new Error(`Invalid tsconfig.json: ${error.message}`);
    }
    
    // Check TypeScript installation
    try {
      execSync('npx tsc --version', { stdio: 'pipe' });
    } catch (error) {
      throw new Error('TypeScript not found. Please install TypeScript.');
    }
    
    console.log('✅ Configuration validated successfully\n');
  }

  /**
   * Runs TypeScript compilation and captures errors
   */
  async runTypeScriptCompilation(filePaths = []) {
    console.log('🔨 Running TypeScript compilation...');
    
    try {
      // Build TypeScript command
      let command = 'npx tsc --noEmit --pretty false';
      
      // Add specific files if provided
      if (filePaths.length > 0) {
        const validFiles = filePaths.filter(file => 
          fs.existsSync(file) && (file.endsWith('.ts') || file.endsWith('.tsx'))
        );
        if (validFiles.length > 0) {
          command += ` ${validFiles.join(' ')}`;
        }
      }
      
      // Execute TypeScript compilation
      const result = execSync(command, { 
        encoding: 'utf8',
        stdio: 'pipe',
        cwd: this.config.projectPath
      });
      
      return { success: true, output: result, errors: [] };
      
    } catch (error) {
      // TypeScript compilation failed - capture errors
      return {
        success: false,
        output: error.stdout || '',
        errors: error.stderr || error.stdout || error.message
      };
    }
  }

  /**
   * Processes TypeScript compilation results
   */
  async processCompilationResults(result) {
    console.log('📊 Processing compilation results...');
    
    if (result.success) {
      console.log('✅ No TypeScript errors found!\n');
      return;
    }
    
    // Parse TypeScript error output
    const errorLines = result.errors.split('\n').filter(line => line.trim());
    const parsedErrors = this.parseTypeScriptErrors(errorLines);
    
    // Categorize errors
    this.categorizeErrors(parsedErrors);
    
    // Update performance metrics
    this.performance.filesProcessed = this.getProcessedFilesCount(errorLines);
    this.performance.totalErrors = this.errors.length + this.warnings.length;
    
    console.log(`📈 Found ${this.errors.length} errors and ${this.warnings.length} warnings\n`);
  }

  /**
   * Parses TypeScript error output into structured format
   */
  parseTypeScriptErrors(errorLines) {
    const errors = [];
    let currentError = null;
    
    for (const line of errorLines) {
      // Match TypeScript error format: file(line,col): error TS#### message
      const errorMatch = line.match(/^(.+?)\((\d+),(\d+)\):\s+(error|warning)\s+TS(\d+):\s+(.+)$/);
      
      if (errorMatch) {
        if (currentError) {
          errors.push(currentError);
        }
        
        const [, file, line, column, severity, code, message] = errorMatch;
        currentError = {
          file: path.relative(this.config.projectPath, file),
          line: parseInt(line),
          column: parseInt(column),
          severity,
          code: parseInt(code),
          message: message.trim(),
          category: this.categorizeErrorByCode(parseInt(code)),
          rawLine: line
        };
      } else if (currentError && line.trim()) {
        // Multi-line error message
        currentError.message += ' ' + line.trim();
      }
    }
    
    if (currentError) {
      errors.push(currentError);
    }
    
    return errors;
  }

  /**
   * Categorizes errors by TypeScript error code
   */
  categorizeErrorByCode(code) {
    // Type-related errors
    if (code >= 2300 && code <= 2799) return 'TYPE_ERROR';
    
    // Import/module errors
    if ((code >= 2300 && code <= 2399) || [2307, 2304].includes(code)) {
      return 'IMPORT_ERROR';
    }
    
    // Syntax errors
    if (code >= 1000 && code <= 1999) return 'SYNTAX_ERROR';
    
    // Configuration errors
    if (code >= 5000 && code <= 5999) return 'CONFIGURATION_ERROR';
    
    // Declaration errors
    if (code >= 2600 && code <= 2699) return 'DECLARATION_ERROR';
    
    // Strict mode errors
    if ([2322, 2345, 2531, 2532, 2533, 2554].includes(code)) {
      return 'STRICT_MODE_ERROR';
    }
    
    // Unused code
    if ([6133, 6196, 6198].includes(code)) return 'UNUSED_CODE';
    
    // Deprecated API
    if (code === 6385) return 'DEPRECATED_API';
    
    return 'GENERIC_ERROR';
  }

  /**
   * Categorizes errors into errors and warnings
   */
  categorizeErrors(parsedErrors) {
    for (const error of parsedErrors) {
      if (error.severity === 'error') {
        this.errors.push(error);
      } else {
        this.warnings.push(error);
      }
    }
    
    // Sort by priority (critical errors first)
    this.errors.sort((a, b) => this.getErrorPriority(a) - this.getErrorPriority(b));
  }

  /**
   * Gets error priority for sorting
   */
  getErrorPriority(error) {
    if (ERROR_CATEGORIES.CRITICAL.includes(error.category)) return 1;
    if (ERROR_CATEGORIES.HIGH.includes(error.category)) return 2;
    if (ERROR_CATEGORIES.MEDIUM.includes(error.category)) return 3;
    return 4; // LOW priority
  }

  /**
   * Generates suggestions for fixing errors
   */
  async generateSuggestions() {
    console.log('💡 Generating suggestions...');
    
    const errorsByCategory = this.groupErrorsByCategory();
    
    for (const [category, categoryErrors] of errorsByCategory) {
      const suggestions = this.getSuggestionsForCategory(category, categoryErrors);
      this.suggestions.push(...suggestions);
    }
    
    console.log(`💡 Generated ${this.suggestions.length} suggestions\n`);
  }

  /**
   * Groups errors by category
   */
  groupErrorsByCategory() {
    const grouped = new Map();
    
    for (const error of this.errors) {
      const existing = grouped.get(error.category) || [];
      existing.push(error);
      grouped.set(error.category, existing);
    }
    
    return grouped;
  }

  /**
   * Gets suggestions for a specific error category
   */
  getSuggestionsForCategory(category, errors) {
    const suggestions = [];
    
    switch (category) {
      case 'TYPE_ERROR':
        if (errors.length > 5) {
          suggestions.push({
            type: 'improvement',
            description: 'Consider enabling stricter type checking to catch type errors earlier',
            category: 'TYPE_ERROR',
            confidence: 0.8,
            autoApplicable: false
          });
        }
        break;
        
      case 'IMPORT_ERROR':
        suggestions.push({
          type: 'fix',
          description: 'Review import paths and ensure all dependencies are installed',
          category: 'IMPORT_ERROR',
          confidence: 0.9,
          autoApplicable: false,
          commands: ['npm install', 'npm ci']
        });
        break;
        
      case 'UNUSED_CODE':
        suggestions.push({
          type: 'refactor',
          description: 'Remove unused code to improve maintainability',
          category: 'UNUSED_CODE',
          confidence: 0.95,
          autoApplicable: true
        });
        break;
        
      case 'SYNTAX_ERROR':
        suggestions.push({
          type: 'fix',
          description: 'Fix syntax errors by checking brackets, semicolons, and other syntax elements',
          category: 'SYNTAX_ERROR',
          confidence: 0.9,
          autoApplicable: false
        });
        break;
    }
    
    return suggestions;
  }

  /**
   * Reports the results of error detection
   */
  async reportResults() {
    const duration = this.performance.endTime - this.performance.startTime;
    
    console.log('📊 TypeScript Error Detection Results');
    console.log('=' .repeat(50));
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📁 Files processed: ${this.performance.filesProcessed}`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`💡 Suggestions: ${this.suggestions.length}`);
    console.log('');
    
    if (this.config.outputFormat === 'json') {
      this.outputJSON();
    } else if (this.config.outputFormat === 'summary') {
      this.outputSummary();
    } else {
      this.outputDetailed();
    }
  }

  /**
   * Outputs detailed error report
   */
  outputDetailed() {
    if (this.errors.length > 0) {
      console.log('❌ ERRORS:');
      console.log('-'.repeat(30));
      
      for (const error of this.errors.slice(0, 20)) { // Limit to first 20 errors
        console.log(`📍 ${error.file}:${error.line}:${error.column}`);
        console.log(`   TS${error.code} [${error.category}]: ${error.message}`);
        console.log('');
      }
      
      if (this.errors.length > 20) {
        console.log(`... and ${this.errors.length - 20} more errors`);
        console.log('');
      }
    }
    
    if (this.warnings.length > 0) {
      console.log('⚠️  WARNINGS:');
      console.log('-'.repeat(30));
      
      for (const warning of this.warnings.slice(0, 10)) { // Limit to first 10 warnings
        console.log(`📍 ${warning.file}:${warning.line}:${warning.column}`);
        console.log(`   TS${warning.code} [${warning.category}]: ${warning.message}`);
        console.log('');
      }
      
      if (this.warnings.length > 10) {
        console.log(`... and ${this.warnings.length - 10} more warnings`);
        console.log('');
      }
    }
    
    if (this.suggestions.length > 0) {
      console.log('💡 SUGGESTIONS:');
      console.log('-'.repeat(30));
      
      for (const suggestion of this.suggestions) {
        console.log(`${this.getSuggestionIcon(suggestion.type)} ${suggestion.description}`);
        if (suggestion.commands) {
          console.log(`   Commands: ${suggestion.commands.join(', ')}`);
        }
        console.log(`   Confidence: ${Math.round(suggestion.confidence * 100)}%`);
        console.log('');
      }
    }
  }

  /**
   * Outputs summary report
   */
  outputSummary() {
    const errorsByCategory = this.groupErrorsByCategory();
    
    console.log('📊 Error Summary by Category:');
    console.log('-'.repeat(30));
    
    for (const [category, errors] of errorsByCategory) {
      const priority = this.getCategoryPriority(category);
      console.log(`${this.getPriorityIcon(priority)} ${category}: ${errors.length} errors`);
    }
    
    console.log('');
  }

  /**
   * Outputs JSON report
   */
  outputJSON() {
    const report = {
      timestamp: new Date().toISOString(),
      performance: this.performance,
      errors: this.errors,
      warnings: this.warnings,
      suggestions: this.suggestions,
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        criticalErrors: this.errors.filter(e => ERROR_CATEGORIES.CRITICAL.includes(e.category)).length,
        highPriorityErrors: this.errors.filter(e => ERROR_CATEGORIES.HIGH.includes(e.category)).length
      }
    };
    
    console.log(JSON.stringify(report, null, 2));
  }

  /**
   * Checks if there are critical errors
   */
  hasCriticalErrors() {
    return this.errors.some(error => ERROR_CATEGORIES.CRITICAL.includes(error.category));
  }

  /**
   * Handles fast-fail scenario
   */
  handleFastFail() {
    const criticalErrors = this.errors.filter(error => 
      ERROR_CATEGORIES.CRITICAL.includes(error.category)
    );
    
    console.log('🚨 CRITICAL ERRORS DETECTED - FAST FAIL ENABLED');
    console.log('=' .repeat(50));
    console.log(`Found ${criticalErrors.length} critical errors that prevent successful compilation:`);
    console.log('');
    
    for (const error of criticalErrors.slice(0, 5)) {
      console.log(`❌ ${error.file}:${error.line}:${error.column}`);
      console.log(`   TS${error.code}: ${error.message}`);
      console.log('');
    }
    
    console.log('Please fix these critical errors before proceeding.');
    process.exit(1);
  }

  /**
   * Utility methods
   */
  getProcessedFilesCount(errorLines) {
    const files = new Set();
    for (const line of errorLines) {
      const match = line.match(/^(.+?)\(\d+,\d+\):/);
      if (match) {
        files.add(match[1]);
      }
    }
    return files.size;
  }

  getSuggestionIcon(type) {
    const icons = {
      fix: '🔧',
      refactor: '♻️',
      improvement: '⚡'
    };
    return icons[type] || '💡';
  }

  getCategoryPriority(category) {
    if (ERROR_CATEGORIES.CRITICAL.includes(category)) return 'CRITICAL';
    if (ERROR_CATEGORIES.HIGH.includes(category)) return 'HIGH';
    if (ERROR_CATEGORIES.MEDIUM.includes(category)) return 'MEDIUM';
    return 'LOW';
  }

  getPriorityIcon(priority) {
    const icons = {
      CRITICAL: '🚨',
      HIGH: '❌',
      MEDIUM: '⚠️',
      LOW: 'ℹ️'
    };
    return icons[priority] || 'ℹ️';
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const config = { ...CONFIG };
  const filePaths = [];
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--help':
      case '-h':
        showHelp();
        process.exit(0);
        break;
        
      case '--format':
        config.outputFormat = args[++i] || 'detailed';
        break;
        
      case '--max-errors':
        config.maxErrors = parseInt(args[++i]) || 100;
        break;
        
      case '--no-fast-fail':
        config.fastFail = false;
        break;
        
      case '--no-suggestions':
        config.enableSuggestions = false;
        break;
        
      case '--project':
        config.projectPath = args[++i] || process.cwd();
        break;
        
      default:
        if (arg.endsWith('.ts') || arg.endsWith('.tsx')) {
          filePaths.push(arg);
        }
        break;
    }
  }
  
  // Run error detection
  const detector = new TypeScriptErrorDetector(config);
  await detector.detectErrors(filePaths);
  
  // Exit with appropriate code
  const hasErrors = detector.errors.length > 0;
  process.exit(hasErrors ? 1 : 0);
}

/**
 * Shows help information
 */
function showHelp() {
  console.log(`
TypeScript Error Detection CLI

Usage: node typescript-error-detector.js [options] [files...]

Options:
  --help, -h              Show this help message
  --format <format>       Output format: detailed, json, summary (default: detailed)
  --max-errors <number>   Maximum number of errors to report (default: 100)
  --no-fast-fail          Disable fast-fail on critical errors
  --no-suggestions        Disable suggestion generation
  --project <path>        Project root path (default: current directory)

Examples:
  node typescript-error-detector.js
  node typescript-error-detector.js --format json
  node typescript-error-detector.js src/components/Button.tsx
  node typescript-error-detector.js --no-fast-fail --max-errors 50
`);
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  });
}

module.exports = { TypeScriptErrorDetector, CONFIG };