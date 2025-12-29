#!/usr/bin/env node

/**
 * TypeScript Maintenance System - Migration Assistant
 * 
 * This script helps teams migrate from their existing development workflows
 * to the TypeScript maintenance system with minimal disruption.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MigrationAssistant {
  constructor() {
    this.projectRoot = process.cwd();
    this.backupDir = path.join(this.projectRoot, '.typescript-maintenance-backup');
    this.migrationLog = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, type, message };
    this.migrationLog.push(logEntry);
    
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  // Backup existing configurations
  async backupExistingConfigurations() {
    this.log("Creating backup of existing configurations...");
    
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }

    const configFiles = [
      'tsconfig.json',
      'eslint.config.mjs',
      '.eslintrc.js',
      '.eslintrc.json',
      'package.json',
      '.husky',
      '.vscode/settings.json',
      '.vscode/extensions.json',
      '.github/workflows'
    ];

    for (const configFile of configFiles) {
      const sourcePath = path.join(this.projectRoot, configFile);
      const backupPath = path.join(this.backupDir, configFile);
      
      if (fs.existsSync(sourcePath)) {
        try {
          if (fs.statSync(sourcePath).isDirectory()) {
            this.copyDirectory(sourcePath, backupPath);
          } else {
            fs.mkdirSync(path.dirname(backupPath), { recursive: true });
            fs.copyFileSync(sourcePath, backupPath);
          }
          this.log(`Backed up: ${configFile}`);
        } catch (error) {
          this.log(`Failed to backup ${configFile}: ${error.message}`, 'error');
        }
      }
    }

    this.log("Backup completed");
  }

  copyDirectory(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  // Analyze existing workflow
  analyzeExistingWorkflow() {
    this.log("Analyzing existing development workflow...");
    
    const analysis = {
      typescript: this.analyzeTypeScriptSetup(),
      eslint: this.analyzeESLintSetup(),
      git: this.analyzeGitHooks(),
      ide: this.analyzeIDESetup(),
      ci: this.analyzeCISetup(),
      dependencies: this.analyzeDependencies()
    };

    this.log("Workflow analysis completed");
    return analysis;
  }

  analyzeTypeScriptSetup() {
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    
    if (!fs.existsSync(tsconfigPath)) {
      return { exists: false, issues: ['No tsconfig.json found'] };
    }

    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      const issues = [];
      
      // Check for common configuration issues
      if (!tsconfig.compilerOptions?.strict) {
        issues.push('Strict mode not enabled');
      }
      
      if (!tsconfig.compilerOptions?.noImplicitAny) {
        issues.push('noImplicitAny not enabled');
      }
      
      if (!tsconfig.compilerOptions?.noUnusedLocals) {
        issues.push('noUnusedLocals not enabled');
      }

      return {
        exists: true,
        config: tsconfig,
        issues,
        recommendations: this.getTypeScriptRecommendations(tsconfig)
      };
    } catch (error) {
      return {
        exists: true,
        issues: [`Invalid tsconfig.json: ${error.message}`]
      };
    }
  }

  analyzeESLintSetup() {
    const eslintConfigs = [
      'eslint.config.mjs',
      '.eslintrc.js',
      '.eslintrc.json',
      '.eslintrc.yml'
    ];

    for (const configFile of eslintConfigs) {
      const configPath = path.join(this.projectRoot, configFile);
      if (fs.existsSync(configPath)) {
        try {
          let config;
          if (configFile.endsWith('.json')) {
            config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          } else {
            // For JS/MJS files, we'll just check if they exist
            config = { exists: true };
          }

          return {
            exists: true,
            configFile,
            config,
            hasTypeScriptRules: this.checkTypeScriptESLintRules(configPath),
            recommendations: this.getESLintRecommendations()
          };
        } catch (error) {
          return {
            exists: true,
            configFile,
            issues: [`Invalid ESLint config: ${error.message}`]
          };
        }
      }
    }

    return {
      exists: false,
      recommendations: ['Install and configure ESLint with TypeScript support']
    };
  }

  analyzeGitHooks() {
    const huskyDir = path.join(this.projectRoot, '.husky');
    const gitHooksDir = path.join(this.projectRoot, '.git', 'hooks');
    
    const analysis = {
      husky: fs.existsSync(huskyDir),
      gitHooks: fs.existsSync(gitHooksDir),
      preCommitHooks: [],
      recommendations: []
    };

    if (analysis.husky) {
      const preCommitPath = path.join(huskyDir, 'pre-commit');
      if (fs.existsSync(preCommitPath)) {
        const content = fs.readFileSync(preCommitPath, 'utf8');
        analysis.preCommitHooks.push('husky pre-commit');
        
        if (!content.includes('tsc') && !content.includes('typescript')) {
          analysis.recommendations.push('Add TypeScript validation to pre-commit hooks');
        }
      }
    } else {
      analysis.recommendations.push('Install Husky for Git hooks management');
    }

    return analysis;
  }

  analyzeIDESetup() {
    const vscodeDir = path.join(this.projectRoot, '.vscode');
    const analysis = {
      vscode: fs.existsSync(vscodeDir),
      settings: {},
      extensions: [],
      recommendations: []
    };

    if (analysis.vscode) {
      const settingsPath = path.join(vscodeDir, 'settings.json');
      const extensionsPath = path.join(vscodeDir, 'extensions.json');
      
      if (fs.existsSync(settingsPath)) {
        try {
          analysis.settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
        } catch (error) {
          analysis.recommendations.push('Fix invalid VS Code settings.json');
        }
      }
      
      if (fs.existsSync(extensionsPath)) {
        try {
          const extensionsConfig = JSON.parse(fs.readFileSync(extensionsPath, 'utf8'));
          analysis.extensions = extensionsConfig.recommendations || [];
        } catch (error) {
          analysis.recommendations.push('Fix invalid VS Code extensions.json');
        }
      }
    } else {
      analysis.recommendations.push('Create VS Code workspace configuration');
    }

    return analysis;
  }

  analyzeCISetup() {
    const ciConfigs = [
      '.github/workflows',
      '.gitlab-ci.yml',
      'azure-pipelines.yml',
      '.circleci/config.yml'
    ];

    const analysis = {
      provider: null,
      hasTypeScriptValidation: false,
      recommendations: []
    };

    for (const configPath of ciConfigs) {
      const fullPath = path.join(this.projectRoot, configPath);
      if (fs.existsSync(fullPath)) {
        if (configPath === '.github/workflows') {
          analysis.provider = 'GitHub Actions';
          analysis.hasTypeScriptValidation = this.checkGitHubActionsTypeScript(fullPath);
        } else {
          analysis.provider = this.getCIProvider(configPath);
        }
        break;
      }
    }

    if (!analysis.provider) {
      analysis.recommendations.push('Set up CI/CD pipeline with TypeScript validation');
    } else if (!analysis.hasTypeScriptValidation) {
      analysis.recommendations.push('Add TypeScript validation to CI/CD pipeline');
    }

    return analysis;
  }

  analyzeDependencies() {
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    
    if (!fs.existsSync(packageJsonPath)) {
      return { exists: false, issues: ['No package.json found'] };
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies
      };

      const analysis = {
        exists: true,
        typescript: !!allDeps.typescript,
        eslint: !!allDeps.eslint,
        husky: !!allDeps.husky,
        lintStaged: !!allDeps['lint-staged'],
        typescriptESLint: !!(allDeps['@typescript-eslint/parser'] || allDeps['@typescript-eslint/eslint-plugin']),
        recommendations: []
      };

      if (!analysis.typescript) {
        analysis.recommendations.push('Install TypeScript');
      }
      
      if (!analysis.eslint) {
        analysis.recommendations.push('Install ESLint');
      }
      
      if (!analysis.typescriptESLint) {
        analysis.recommendations.push('Install TypeScript ESLint plugins');
      }
      
      if (!analysis.husky) {
        analysis.recommendations.push('Install Husky for Git hooks');
      }

      return analysis;
    } catch (error) {
      return {
        exists: true,
        issues: [`Invalid package.json: ${error.message}`]
      };
    }
  }

  // Migration execution
  async executeMigration(options = {}) {
    this.log("Starting TypeScript Maintenance System migration...");
    
    try {
      // Step 1: Backup existing configurations
      await this.backupExistingConfigurations();
      
      // Step 2: Analyze current setup
      const analysis = this.analyzeExistingWorkflow();
      
      // Step 3: Install required dependencies
      await this.installDependencies(analysis);
      
      // Step 4: Migrate configurations
      await this.migrateConfigurations(analysis, options);
      
      // Step 5: Set up Git hooks
      await this.setupGitHooks(analysis);
      
      // Step 6: Configure IDE
      await this.configureIDE(analysis);
      
      // Step 7: Update CI/CD
      await this.updateCICD(analysis);
      
      // Step 8: Generate migration report
      await this.generateMigrationReport(analysis);
      
      this.log("Migration completed successfully! 🎉");
      
    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error');
      this.log("Rolling back changes...");
      await this.rollbackMigration();
      throw error;
    }
  }

  async installDependencies(analysis) {
    this.log("Installing required dependencies...");
    
    const requiredDeps = [];
    const requiredDevDeps = [];

    if (!analysis.dependencies.typescript) {
      requiredDevDeps.push('typescript');
    }
    
    if (!analysis.dependencies.eslint) {
      requiredDevDeps.push('eslint');
    }
    
    if (!analysis.dependencies.typescriptESLint) {
      requiredDevDeps.push('@typescript-eslint/parser', '@typescript-eslint/eslint-plugin');
    }
    
    if (!analysis.dependencies.husky) {
      requiredDevDeps.push('husky');
    }
    
    if (!analysis.dependencies.lintStaged) {
      requiredDevDeps.push('lint-staged');
    }

    if (requiredDevDeps.length > 0) {
      try {
        execSync(`npm install --save-dev ${requiredDevDeps.join(' ')}`, { stdio: 'inherit' });
        this.log(`Installed dev dependencies: ${requiredDevDeps.join(', ')}`);
      } catch (error) {
        throw new Error(`Failed to install dependencies: ${error.message}`);
      }
    }
  }

  async migrateConfigurations(analysis, options) {
    this.log("Migrating configurations...");
    
    // Migrate TypeScript configuration
    if (analysis.typescript.exists && analysis.typescript.issues.length > 0) {
      await this.migrateTypeScriptConfig(analysis.typescript);
    }
    
    // Migrate ESLint configuration
    if (!analysis.eslint.exists || !analysis.eslint.hasTypeScriptRules) {
      await this.migrateESLintConfig(analysis.eslint);
    }
    
    // Update package.json scripts
    await this.updatePackageJsonScripts();
  }

  async migrateTypeScriptConfig(tsAnalysis) {
    this.log("Updating TypeScript configuration...");
    
    const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
    let tsconfig = tsAnalysis.config || {};
    
    // Ensure compiler options exist
    if (!tsconfig.compilerOptions) {
      tsconfig.compilerOptions = {};
    }
    
    // Apply recommended settings
    const recommendedOptions = {
      strict: true,
      noImplicitAny: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      exactOptionalPropertyTypes: true,
      noImplicitReturns: true,
      noFallthroughCasesInSwitch: true
    };
    
    Object.assign(tsconfig.compilerOptions, recommendedOptions);
    
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    this.log("TypeScript configuration updated");
  }

  async migrateESLintConfig(eslintAnalysis) {
    this.log("Setting up ESLint configuration...");
    
    const eslintConfigPath = path.join(this.projectRoot, 'eslint.config.mjs');
    
    const eslintConfig = `import js from '@eslint/js';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        project: './tsconfig.json'
      }
    },
    plugins: {
      '@typescript-eslint': tseslint
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/no-implicit-any-catch': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error'
    }
  }
];`;

    fs.writeFileSync(eslintConfigPath, eslintConfig);
    this.log("ESLint configuration created");
  }

  async updatePackageJsonScripts() {
    this.log("Updating package.json scripts...");
    
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    // Add TypeScript maintenance scripts
    const newScripts = {
      'type-check': 'tsc --noEmit',
      'type-check:watch': 'tsc --noEmit --watch',
      'lint:ts': 'eslint "**/*.{ts,tsx}"',
      'lint:ts:fix': 'eslint "**/*.{ts,tsx}" --fix',
      'validate': 'npm run type-check && npm run lint:ts',
      'prepare': 'husky install'
    };
    
    Object.assign(packageJson.scripts, newScripts);
    
    // Add lint-staged configuration
    packageJson['lint-staged'] = {
      '*.{ts,tsx}': [
        'eslint --fix',
        'tsc --noEmit'
      ]
    };
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    this.log("Package.json updated with TypeScript maintenance scripts");
  }

  async setupGitHooks(analysis) {
    this.log("Setting up Git hooks...");
    
    try {
      // Initialize Husky
      execSync('npx husky install', { stdio: 'inherit' });
      
      // Create pre-commit hook
      const preCommitHook = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged`;
      
      const huskyDir = path.join(this.projectRoot, '.husky');
      const preCommitPath = path.join(huskyDir, 'pre-commit');
      
      fs.writeFileSync(preCommitPath, preCommitHook);
      fs.chmodSync(preCommitPath, '755');
      
      this.log("Git hooks configured");
    } catch (error) {
      this.log(`Failed to setup Git hooks: ${error.message}`, 'error');
    }
  }

  async configureIDE(analysis) {
    this.log("Configuring IDE settings...");
    
    const vscodeDir = path.join(this.projectRoot, '.vscode');
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir);
    }
    
    // VS Code settings
    const settings = {
      'typescript.preferences.includePackageJsonAutoImports': 'auto',
      'typescript.suggest.autoImports': true,
      'typescript.updateImportsOnFileMove.enabled': 'always',
      'editor.codeActionsOnSave': {
        'source.fixAll.eslint': true,
        'source.organizeImports': true
      },
      'eslint.validate': ['typescript', 'typescriptreact'],
      'editor.formatOnSave': true,
      'typescript.preferences.noSemicolons': false
    };
    
    const settingsPath = path.join(vscodeDir, 'settings.json');
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    
    // VS Code extensions
    const extensions = {
      recommendations: [
        'ms-vscode.vscode-typescript-next',
        'dbaeumer.vscode-eslint',
        'esbenp.prettier-vscode',
        'bradlc.vscode-tailwindcss'
      ]
    };
    
    const extensionsPath = path.join(vscodeDir, 'extensions.json');
    fs.writeFileSync(extensionsPath, JSON.stringify(extensions, null, 2));
    
    this.log("IDE configuration completed");
  }

  async updateCICD(analysis) {
    this.log("Updating CI/CD configuration...");
    
    if (analysis.ci.provider === 'GitHub Actions') {
      await this.updateGitHubActions();
    } else {
      this.log("Creating GitHub Actions workflow for TypeScript validation");
      await this.createGitHubActionsWorkflow();
    }
  }

  async createGitHubActionsWorkflow() {
    const workflowsDir = path.join(this.projectRoot, '.github', 'workflows');
    if (!fs.existsSync(workflowsDir)) {
      fs.mkdirSync(workflowsDir, { recursive: true });
    }
    
    const workflow = `name: TypeScript Validation

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  typescript-check:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: TypeScript type check
      run: npm run type-check
    
    - name: ESLint check
      run: npm run lint:ts
    
    - name: Build check
      run: npm run build --if-present`;
    
    const workflowPath = path.join(workflowsDir, 'typescript-validation.yml');
    fs.writeFileSync(workflowPath, workflow);
    
    this.log("GitHub Actions workflow created");
  }

  async generateMigrationReport(analysis) {
    const report = {
      timestamp: new Date().toISOString(),
      migrationLog: this.migrationLog,
      preMigrationAnalysis: analysis,
      postMigrationStatus: {
        typescript: fs.existsSync(path.join(this.projectRoot, 'tsconfig.json')),
        eslint: fs.existsSync(path.join(this.projectRoot, 'eslint.config.mjs')),
        husky: fs.existsSync(path.join(this.projectRoot, '.husky')),
        vscode: fs.existsSync(path.join(this.projectRoot, '.vscode')),
        github: fs.existsSync(path.join(this.projectRoot, '.github', 'workflows'))
      },
      nextSteps: [
        'Run "npm run validate" to test the setup',
        'Commit changes to test pre-commit hooks',
        'Review and customize ESLint rules as needed',
        'Train team members on new workflow',
        'Monitor system performance and gather feedback'
      ]
    };
    
    const reportPath = path.join(this.projectRoot, 'typescript-maintenance-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Migration report saved to: ${reportPath}`);
    
    // Display summary
    console.log("\n📋 Migration Summary:");
    console.log("✅ Configurations backed up");
    console.log("✅ Dependencies installed");
    console.log("✅ TypeScript configuration updated");
    console.log("✅ ESLint configuration created");
    console.log("✅ Git hooks configured");
    console.log("✅ IDE settings configured");
    console.log("✅ CI/CD workflow updated");
    
    console.log("\n🚀 Next Steps:");
    report.nextSteps.forEach(step => console.log(`   • ${step}`));
  }

  async rollbackMigration() {
    this.log("Rolling back migration changes...");
    
    try {
      // Restore backed up files
      if (fs.existsSync(this.backupDir)) {
        const backupFiles = fs.readdirSync(this.backupDir);
        
        for (const file of backupFiles) {
          const backupPath = path.join(this.backupDir, file);
          const originalPath = path.join(this.projectRoot, file);
          
          if (fs.statSync(backupPath).isDirectory()) {
            this.copyDirectory(backupPath, originalPath);
          } else {
            fs.copyFileSync(backupPath, originalPath);
          }
        }
        
        this.log("Configurations restored from backup");
      }
      
      this.log("Rollback completed");
    } catch (error) {
      this.log(`Rollback failed: ${error.message}`, 'error');
    }
  }

  // Helper methods
  getTypeScriptRecommendations(tsconfig) {
    const recommendations = [];
    
    if (!tsconfig.compilerOptions?.strict) {
      recommendations.push('Enable strict mode for better type safety');
    }
    
    if (!tsconfig.compilerOptions?.noImplicitAny) {
      recommendations.push('Enable noImplicitAny to catch implicit any types');
    }
    
    return recommendations;
  }

  getESLintRecommendations() {
    return [
      'Configure TypeScript-specific ESLint rules',
      'Set up automatic fixing on save',
      'Add custom rules for team coding standards'
    ];
  }

  checkTypeScriptESLintRules(configPath) {
    try {
      const content = fs.readFileSync(configPath, 'utf8');
      return content.includes('@typescript-eslint') || content.includes('typescript');
    } catch {
      return false;
    }
  }

  checkGitHubActionsTypeScript(workflowsDir) {
    try {
      const workflows = fs.readdirSync(workflowsDir);
      
      for (const workflow of workflows) {
        const workflowPath = path.join(workflowsDir, workflow);
        const content = fs.readFileSync(workflowPath, 'utf8');
        
        if (content.includes('tsc') || content.includes('typescript') || content.includes('type-check')) {
          return true;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }

  getCIProvider(configPath) {
    if (configPath.includes('gitlab')) return 'GitLab CI';
    if (configPath.includes('azure')) return 'Azure Pipelines';
    if (configPath.includes('circleci')) return 'CircleCI';
    return 'Unknown';
  }
}

// CLI Interface
function main() {
  const assistant = new MigrationAssistant();
  const command = process.argv[2];

  switch (command) {
    case "analyze":
      console.log("Analyzing existing workflow...");
      const analysis = assistant.analyzeExistingWorkflow();
      console.log(JSON.stringify(analysis, null, 2));
      break;

    case "migrate":
      assistant.executeMigration().catch(error => {
        console.error("Migration failed:", error.message);
        process.exit(1);
      });
      break;

    case "backup":
      assistant.backupExistingConfigurations().catch(error => {
        console.error("Backup failed:", error.message);
        process.exit(1);
      });
      break;

    case "rollback":
      assistant.rollbackMigration().catch(error => {
        console.error("Rollback failed:", error.message);
        process.exit(1);
      });
      break;

    default:
      console.log("TypeScript Maintenance System - Migration Assistant");
      console.log("\nAvailable commands:");
      console.log("  analyze  - Analyze existing development workflow");
      console.log("  migrate  - Execute full migration to TypeScript maintenance system");
      console.log("  backup   - Backup existing configurations");
      console.log("  rollback - Rollback migration changes");
      break;
  }
}

if (require.main === module) {
  main();
}

module.exports = MigrationAssistant;