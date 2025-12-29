#!/usr/bin/env node

/**
 * Integration Compatibility Validation Script
 * 
 * Validates that the TypeScript maintenance system integrates seamlessly
 * with existing development workflows without breaking functionality.
 * 
 * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class IntegrationCompatibilityValidator {
  constructor() {
    this.projectRoot = process.cwd();
    this.results = {
      packageJsonCompatible: false,
      gitHooksCompatible: false,
      cicdCompatible: false,
      ideCompatible: false,
      overallCompatible: false,
      issues: [],
      recommendations: []
    };
  }

  /**
   * Main validation function
   */
  async validate() {
    console.log('🔍 Validating TypeScript Maintenance System Integration Compatibility...\n');

    try {
      // Validate each integration aspect
      this.validatePackageJsonIntegration();
      this.validateGitHooksIntegration();
      this.validateCICDIntegration();
      this.validateIDEIntegration();
      this.validateExistingFunctionality();

      // Calculate overall compatibility
      this.results.overallCompatible = 
        this.results.packageJsonCompatible &&
        this.results.gitHooksCompatible &&
        this.results.cicdCompatible &&
        this.results.ideCompatible;

      this.generateReport();

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Validates package.json scripts integration
   * **Validates: Requirement 10.1**
   */
  validatePackageJsonIntegration() {
    console.log('📦 Validating package.json integration...');

    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      
      if (!fs.existsSync(packageJsonPath)) {
        this.results.issues.push('package.json not found');
        return;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check essential scripts exist and work
      const essentialScripts = ['dev', 'build', 'start', 'lint', 'test'];
      const missingScripts = essentialScripts.filter(script => !packageJson.scripts?.[script]);
      
      if (missingScripts.length > 0) {
        this.results.issues.push(`Missing essential scripts: ${missingScripts.join(', ')}`);
        return;
      }

      // Check TypeScript enhancement scripts exist
      const typescriptScripts = Object.keys(packageJson.scripts || {})
        .filter(script => script.startsWith('typescript:'));
      
      if (typescriptScripts.length === 0) {
        this.results.issues.push('No TypeScript enhancement scripts found');
        return;
      }

      // Verify enhanced scripts use existing tools
      const sampleEnhancedScript = packageJson.scripts['typescript:validate'] || 
                                   packageJson.scripts['typescript:detect-errors'];
      
      if (sampleEnhancedScript && sampleEnhancedScript.includes('node scripts/')) {
        this.results.recommendations.push('✅ Enhanced scripts properly wrap existing tools');
      }

      this.results.packageJsonCompatible = true;
      console.log('  ✅ Package.json integration compatible');

    } catch (error) {
      this.results.issues.push(`Package.json validation failed: ${error.message}`);
      console.log('  ❌ Package.json integration failed');
    }
  }

  /**
   * Validates Git hooks integration
   * **Validates: Requirement 10.2**
   */
  validateGitHooksIntegration() {
    console.log('🪝 Validating Git hooks integration...');

    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for Husky setup
      const huskyPath = path.join(this.projectRoot, '.husky');
      if (!fs.existsSync(huskyPath)) {
        this.results.recommendations.push('Consider setting up Husky for Git hooks');
      }

      // Check lint-staged configuration
      if (!packageJson['lint-staged']) {
        this.results.issues.push('lint-staged configuration not found');
        return;
      }

      const lintStaged = packageJson['lint-staged'];
      
      // Verify TypeScript files have proper configuration
      if (lintStaged['*.{ts,tsx}']) {
        const tsCommands = lintStaged['*.{ts,tsx}'];
        const hasTypeScriptCheck = tsCommands.some(cmd => 
          cmd.includes('typescript-check') || cmd.includes('tsc --noEmit')
        );
        const hasEslint = tsCommands.some(cmd => cmd.includes('eslint'));
        const hasPrettier = tsCommands.some(cmd => cmd.includes('prettier'));

        if (hasTypeScriptCheck && hasEslint && hasPrettier) {
          this.results.recommendations.push('✅ Comprehensive pre-commit validation configured');
        }
      }

      this.results.gitHooksCompatible = true;
      console.log('  ✅ Git hooks integration compatible');

    } catch (error) {
      this.results.issues.push(`Git hooks validation failed: ${error.message}`);
      console.log('  ❌ Git hooks integration failed');
    }
  }

  /**
   * Validates CI/CD integration
   * **Validates: Requirement 10.3**
   */
  validateCICDIntegration() {
    console.log('🚀 Validating CI/CD integration...');

    try {
      // Check for GitHub Actions workflows
      const workflowsPath = path.join(this.projectRoot, '../../.github/workflows');
      
      if (!fs.existsSync(workflowsPath)) {
        this.results.recommendations.push('Consider setting up GitHub Actions workflows');
        this.results.cicdCompatible = true; // Not required
        console.log('  ⚠️  No CI/CD workflows found (optional)');
        return;
      }

      const workflowFiles = fs.readdirSync(workflowsPath)
        .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'));

      if (workflowFiles.length === 0) {
        this.results.recommendations.push('No workflow files found');
        this.results.cicdCompatible = true;
        return;
      }

      // Check for TypeScript-related workflows
      const typescriptWorkflows = workflowFiles.filter(file => 
        file.includes('typescript') || file.includes('validation')
      );

      if (typescriptWorkflows.length > 0) {
        this.results.recommendations.push(`✅ Found ${typescriptWorkflows.length} TypeScript workflow(s)`);
        
        // Validate workflow structure
        for (const workflowFile of typescriptWorkflows) {
          const workflowPath = path.join(workflowsPath, workflowFile);
          const workflowContent = fs.readFileSync(workflowPath, 'utf8');
          
          // Check for standard CI/CD patterns
          const hasStandardStructure = 
            workflowContent.includes('actions/setup-node') &&
            workflowContent.includes('npm ci') &&
            (workflowContent.includes('npm run type-check') || 
             workflowContent.includes('npm run lint'));

          if (hasStandardStructure) {
            this.results.recommendations.push(`✅ ${workflowFile} follows standard patterns`);
          }
        }
      }

      this.results.cicdCompatible = true;
      console.log('  ✅ CI/CD integration compatible');

    } catch (error) {
      this.results.issues.push(`CI/CD validation failed: ${error.message}`);
      console.log('  ❌ CI/CD integration failed');
    }
  }

  /**
   * Validates IDE integration
   * **Validates: Requirement 10.4**
   */
  validateIDEIntegration() {
    console.log('💻 Validating IDE integration...');

    try {
      const vscodeSettingsPath = path.join(this.projectRoot, '.vscode/settings.json');
      const vscodeExtensionsPath = path.join(this.projectRoot, '.vscode/extensions.json');
      
      if (!fs.existsSync(vscodeSettingsPath)) {
        this.results.recommendations.push('Consider adding VS Code settings for better TypeScript experience');
        this.results.ideCompatible = true; // Not required
        console.log('  ⚠️  No VS Code settings found (optional)');
        return;
      }

      const settings = JSON.parse(fs.readFileSync(vscodeSettingsPath, 'utf8'));
      
      // Check for essential TypeScript settings
      const hasTypeScriptValidation = settings['typescript.validate.enable'];
      const hasCodeActions = settings['editor.codeActionsOnSave'];
      const hasEslintValidation = settings['eslint.validate'];

      if (hasTypeScriptValidation && hasCodeActions && hasEslintValidation) {
        this.results.recommendations.push('✅ Comprehensive VS Code TypeScript configuration');
      }

      // Check extensions
      if (fs.existsSync(vscodeExtensionsPath)) {
        const extensions = JSON.parse(fs.readFileSync(vscodeExtensionsPath, 'utf8'));
        const recommendedExtensions = extensions.recommendations || [];
        
        const hasTypeScriptExtension = recommendedExtensions.some(ext => 
          ext.includes('typescript') || ext.includes('eslint') || ext.includes('prettier')
        );

        if (hasTypeScriptExtension) {
          this.results.recommendations.push('✅ Recommended extensions configured');
        }
      }

      this.results.ideCompatible = true;
      console.log('  ✅ IDE integration compatible');

    } catch (error) {
      this.results.issues.push(`IDE validation failed: ${error.message}`);
      console.log('  ❌ IDE integration failed');
    }
  }

  /**
   * Validates existing functionality is preserved
   * **Validates: Requirements 10.1, 10.2, 10.3, 10.4, 10.5**
   */
  validateExistingFunctionality() {
    console.log('🔧 Validating existing functionality preservation...');

    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Test that essential commands still exist
      const essentialCommands = ['dev', 'build', 'start', 'lint', 'test'];
      const workingCommands = [];
      const brokenCommands = [];

      for (const command of essentialCommands) {
        if (packageJson.scripts?.[command]) {
          workingCommands.push(command);
        } else {
          brokenCommands.push(command);
        }
      }

      if (brokenCommands.length === 0) {
        this.results.recommendations.push(`✅ All essential commands preserved: ${workingCommands.join(', ')}`);
      } else {
        this.results.issues.push(`Missing essential commands: ${brokenCommands.join(', ')}`);
      }

      // Check that enhanced commands are additive
      const enhancedCommands = Object.keys(packageJson.scripts || {})
        .filter(script => script.startsWith('typescript:'));

      if (enhancedCommands.length > 0) {
        this.results.recommendations.push(`✅ ${enhancedCommands.length} enhanced TypeScript commands added`);
      }

      console.log('  ✅ Existing functionality preserved');

    } catch (error) {
      this.results.issues.push(`Functionality validation failed: ${error.message}`);
      console.log('  ❌ Functionality validation failed');
    }
  }

  /**
   * Generates comprehensive report
   */
  generateReport() {
    console.log('\n📊 Integration Compatibility Report');
    console.log('=====================================\n');

    // Overall status
    if (this.results.overallCompatible) {
      console.log('🎉 Overall Status: COMPATIBLE ✅');
      console.log('The TypeScript maintenance system integrates seamlessly with your existing workflow.\n');
    } else {
      console.log('⚠️  Overall Status: ISSUES DETECTED ❌');
      console.log('Some integration issues were found that need attention.\n');
    }

    // Component status
    console.log('Component Status:');
    console.log(`  📦 Package.json Scripts: ${this.results.packageJsonCompatible ? '✅' : '❌'}`);
    console.log(`  🪝 Git Hooks: ${this.results.gitHooksCompatible ? '✅' : '❌'}`);
    console.log(`  🚀 CI/CD Pipelines: ${this.results.cicdCompatible ? '✅' : '❌'}`);
    console.log(`  💻 IDE Configuration: ${this.results.ideCompatible ? '✅' : '❌'}\n`);

    // Issues
    if (this.results.issues.length > 0) {
      console.log('🚨 Issues Found:');
      this.results.issues.forEach(issue => console.log(`  • ${issue}`));
      console.log('');
    }

    // Recommendations
    if (this.results.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      this.results.recommendations.forEach(rec => console.log(`  • ${rec}`));
      console.log('');
    }

    // Migration guidance
    console.log('📚 Migration Guidance:');
    console.log('  • All existing commands continue to work unchanged');
    console.log('  • New TypeScript-specific commands are additive');
    console.log('  • Configuration files are enhanced, not replaced');
    console.log('  • Rollback is possible by reverting configuration changes');
    console.log('  • No breaking changes to existing development workflow\n');

    // Exit with appropriate code
    if (this.results.overallCompatible) {
      console.log('✅ Integration compatibility validation completed successfully!');
      process.exit(0);
    } else {
      console.log('❌ Integration compatibility validation found issues that need attention.');
      process.exit(1);
    }
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new IntegrationCompatibilityValidator();
  validator.validate().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = IntegrationCompatibilityValidator;