#!/usr/bin/env node

/**
 * IDE Setup Validation Script
 * Validates that VS Code workspace configuration is properly set up
 * for optimal TypeScript development experience
 */

const fs = require('fs');
const path = require('path');

const VSCODE_DIR = path.join(__dirname, '..', '.vscode');
const REQUIRED_FILES = [
  'settings.json',
  'extensions.json',
  'launch.json',
  'tasks.json',
  'typescript.code-snippets'
];

const REQUIRED_SETTINGS = [
  'typescript.preferences.includePackageJsonAutoImports',
  'typescript.suggest.autoImports',
  'editor.codeActionsOnSave',
  'editor.formatOnSave',
  'eslint.validate',
  'typescript.validate.enable'
];

const REQUIRED_EXTENSIONS = [
  'ms-vscode.vscode-typescript-next',
  'dbaeumer.vscode-eslint',
  'esbenp.prettier-vscode'
];

function validateIDESetup() {
  console.log('🔍 Validating VS Code IDE setup for TypeScript development...\n');
  
  let isValid = true;
  const issues = [];

  // Check if .vscode directory exists
  if (!fs.existsSync(VSCODE_DIR)) {
    issues.push('❌ .vscode directory does not exist');
    isValid = false;
    return { isValid, issues };
  }

  // Check required files
  console.log('📁 Checking required configuration files...');
  REQUIRED_FILES.forEach(file => {
    const filePath = path.join(VSCODE_DIR, file);
    if (fs.existsSync(filePath)) {
      console.log(`  ✅ ${file} exists`);
    } else {
      console.log(`  ❌ ${file} missing`);
      issues.push(`Missing required file: ${file}`);
      isValid = false;
    }
  });

  // Validate settings.json
  console.log('\n⚙️  Validating workspace settings...');
  const settingsPath = path.join(VSCODE_DIR, 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      
      REQUIRED_SETTINGS.forEach(setting => {
        if (setting in settings) {
          console.log(`  ✅ ${setting} configured`);
        } else {
          console.log(`  ❌ ${setting} missing`);
          issues.push(`Missing required setting: ${setting}`);
          isValid = false;
        }
      });

      // Check specific setting values
      if (settings['editor.formatOnSave'] !== true) {
        console.log('  ⚠️  Format on save is not enabled');
        issues.push('Format on save should be enabled for better developer experience');
      }

      if (!settings['editor.codeActionsOnSave'] || 
          !settings['editor.codeActionsOnSave']['source.fixAll.eslint']) {
        console.log('  ⚠️  ESLint auto-fix on save is not configured');
        issues.push('ESLint auto-fix on save should be enabled');
      }

    } catch (error) {
      console.log('  ❌ Invalid JSON in settings.json');
      issues.push('settings.json contains invalid JSON');
      isValid = false;
    }
  }

  // Validate extensions.json
  console.log('\n🔌 Validating recommended extensions...');
  const extensionsPath = path.join(VSCODE_DIR, 'extensions.json');
  if (fs.existsSync(extensionsPath)) {
    try {
      const extensions = JSON.parse(fs.readFileSync(extensionsPath, 'utf8'));
      
      if (extensions.recommendations && Array.isArray(extensions.recommendations)) {
        REQUIRED_EXTENSIONS.forEach(ext => {
          if (extensions.recommendations.includes(ext)) {
            console.log(`  ✅ ${ext} recommended`);
          } else {
            console.log(`  ❌ ${ext} not recommended`);
            issues.push(`Missing required extension recommendation: ${ext}`);
            isValid = false;
          }
        });
      } else {
        console.log('  ❌ No recommendations array found');
        issues.push('extensions.json should contain a recommendations array');
        isValid = false;
      }

    } catch (error) {
      console.log('  ❌ Invalid JSON in extensions.json');
      issues.push('extensions.json contains invalid JSON');
      isValid = false;
    }
  }

  // Validate launch.json
  console.log('\n🐛 Validating debug configurations...');
  const launchPath = path.join(VSCODE_DIR, 'launch.json');
  if (fs.existsSync(launchPath)) {
    try {
      const launch = JSON.parse(fs.readFileSync(launchPath, 'utf8'));
      
      if (launch.configurations && Array.isArray(launch.configurations)) {
        const hasNextJSDebug = launch.configurations.some(config => 
          config.name && config.name.includes('Next.js'));
        const hasJestDebug = launch.configurations.some(config => 
          config.name && config.name.includes('Jest'));

        if (hasNextJSDebug) {
          console.log('  ✅ Next.js debug configuration found');
        } else {
          console.log('  ⚠️  No Next.js debug configuration');
          issues.push('Consider adding Next.js debug configuration');
        }

        if (hasJestDebug) {
          console.log('  ✅ Jest debug configuration found');
        } else {
          console.log('  ⚠️  No Jest debug configuration');
          issues.push('Consider adding Jest debug configuration');
        }
      }

    } catch (error) {
      console.log('  ❌ Invalid JSON in launch.json');
      issues.push('launch.json contains invalid JSON');
      isValid = false;
    }
  }

  // Validate tasks.json
  console.log('\n⚡ Validating build tasks...');
  const tasksPath = path.join(VSCODE_DIR, 'tasks.json');
  if (fs.existsSync(tasksPath)) {
    try {
      const tasks = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
      
      if (tasks.tasks && Array.isArray(tasks.tasks)) {
        const hasTypeScriptTask = tasks.tasks.some(task => 
          task.type === 'typescript' || (task.label && task.label.includes('TypeScript')));
        const hasESLintTask = tasks.tasks.some(task => 
          task.label && task.label.includes('ESLint'));
        const hasJestTask = tasks.tasks.some(task => 
          task.label && task.label.includes('Jest'));

        if (hasTypeScriptTask) {
          console.log('  ✅ TypeScript build task found');
        } else {
          console.log('  ❌ No TypeScript build task');
          issues.push('Missing TypeScript build task');
          isValid = false;
        }

        if (hasESLintTask) {
          console.log('  ✅ ESLint task found');
        } else {
          console.log('  ⚠️  No ESLint task');
          issues.push('Consider adding ESLint task');
        }

        if (hasJestTask) {
          console.log('  ✅ Jest task found');
        } else {
          console.log('  ⚠️  No Jest task');
          issues.push('Consider adding Jest task');
        }
      }

    } catch (error) {
      console.log('  ❌ Invalid JSON in tasks.json');
      issues.push('tasks.json contains invalid JSON');
      isValid = false;
    }
  }

  // Check TypeScript configuration
  console.log('\n📝 Validating TypeScript configuration...');
  const tsconfigPath = path.join(__dirname, '..', 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      if (tsconfig.compilerOptions) {
        const options = tsconfig.compilerOptions;
        
        if (options.strict) {
          console.log('  ✅ Strict mode enabled');
        } else {
          console.log('  ⚠️  Strict mode not enabled');
          issues.push('Consider enabling TypeScript strict mode');
        }

        if (options.incremental) {
          console.log('  ✅ Incremental compilation enabled');
        } else {
          console.log('  ⚠️  Incremental compilation not enabled');
          issues.push('Consider enabling incremental compilation for better performance');
        }

        if (options.paths) {
          console.log('  ✅ Path mapping configured');
        } else {
          console.log('  ⚠️  No path mapping configured');
          issues.push('Consider configuring path mapping for better imports');
        }
      }

    } catch (error) {
      console.log('  ❌ Invalid JSON in tsconfig.json');
      issues.push('tsconfig.json contains invalid JSON');
      isValid = false;
    }
  } else {
    console.log('  ❌ tsconfig.json not found');
    issues.push('tsconfig.json is required for TypeScript development');
    isValid = false;
  }

  // Check package.json scripts
  console.log('\n📦 Validating package.json scripts...');
  const packagePath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      if (pkg.scripts) {
        const requiredScripts = ['type-check', 'lint', 'lint:fix', 'format'];
        
        requiredScripts.forEach(script => {
          if (pkg.scripts[script]) {
            console.log(`  ✅ ${script} script available`);
          } else {
            console.log(`  ❌ ${script} script missing`);
            issues.push(`Missing required script: ${script}`);
            isValid = false;
          }
        });
      }

    } catch (error) {
      console.log('  ❌ Invalid JSON in package.json');
      issues.push('package.json contains invalid JSON');
      isValid = false;
    }
  }

  return { isValid, issues };
}

function generateReport(result) {
  console.log('\n' + '='.repeat(60));
  console.log('📊 IDE SETUP VALIDATION REPORT');
  console.log('='.repeat(60));

  if (result.isValid) {
    console.log('🎉 SUCCESS: VS Code IDE setup is properly configured!');
    console.log('\n✨ Your development environment is optimized for:');
    console.log('   • Real-time TypeScript error detection');
    console.log('   • Automatic code formatting and linting');
    console.log('   • Intelligent code completion and imports');
    console.log('   • Integrated debugging and testing');
    console.log('   • Performance-optimized TypeScript compilation');
  } else {
    console.log('❌ ISSUES FOUND: IDE setup needs attention');
    console.log('\n🔧 Issues to resolve:');
    result.issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
    
    console.log('\n💡 Recommendations:');
    console.log('   • Run this script after making changes to verify fixes');
    console.log('   • Install all recommended VS Code extensions');
    console.log('   • Restart VS Code after configuration changes');
    console.log('   • Check VS Code TypeScript output panel for additional errors');
  }

  console.log('\n📚 For more information, see .vscode/README.md');
  console.log('='.repeat(60));
}

// Run validation
const result = validateIDESetup();
generateReport(result);

// Exit with appropriate code
process.exit(result.isValid ? 0 : 1);