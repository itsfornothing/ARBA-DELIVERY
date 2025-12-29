#!/usr/bin/env node

/**
 * TypeScript Configuration Management Script
 * 
 * This script provides command-line interface for TypeScript configuration
 * validation, optimization, and management.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptConfigManagerCLI {
  constructor() {
    this.projectRoot = process.cwd();
    this.configPath = path.join(this.projectRoot, 'tsconfig.json');
  }

  async validateConfig() {
    console.log('🔍 Validating TypeScript configuration...\n');
    
    const result = {
      isValid: true,
      errors: [],
      warnings: [],
      suggestions: [],
      configPath: this.configPath
    };

    try {
      // Check if tsconfig.json exists
      if (!fs.existsSync(this.configPath)) {
        result.isValid = false;
        result.errors.push('tsconfig.json not found');
        this.printResults(result);
        return result;
      }

      // Parse and validate JSON structure
      const configContent = fs.readFileSync(this.configPath, 'utf-8');
      let config;
      
      try {
        config = JSON.parse(configContent);
      } catch (parseError) {
        result.isValid = false;
        result.errors.push(`Invalid JSON in tsconfig.json: ${parseError.message}`);
        this.printResults(result);
        return result;
      }

      // Validate compiler options
      const compilerOptions = config.compilerOptions || {};
      
      // Check essential settings
      const checks = [
        {
          condition: !compilerOptions.strict,
          type: 'warning',
          message: 'Strict mode is disabled - consider enabling for better type safety'
        },
        {
          condition: compilerOptions.noEmit === undefined,
          type: 'suggestion',
          message: 'Consider setting "noEmit" explicitly based on your build setup'
        },
        {
          condition: !compilerOptions.moduleResolution,
          type: 'warning',
          message: 'moduleResolution not specified - may cause import issues'
        },
        {
          condition: !compilerOptions.incremental,
          type: 'suggestion',
          message: 'Enable "incremental": true for faster compilation'
        },
        {
          condition: !config.include || config.include.length === 0,
          type: 'warning',
          message: 'No include patterns specified - may include unintended files'
        },
        {
          condition: !config.exclude || !config.exclude.includes('node_modules'),
          type: 'warning',
          message: 'node_modules not excluded - may slow down compilation'
        }
      ];

      checks.forEach(check => {
        if (check.condition) {
          result[check.type === 'warning' ? 'warnings' : 'suggestions'].push(check.message);
        }
      });

      // Test compilation
      try {
        execSync('npx tsc --noEmit --skipLibCheck', { 
          cwd: this.projectRoot,
          stdio: 'pipe'
        });
        console.log('✅ TypeScript compilation successful');
      } catch (compileError) {
        const errorOutput = compileError.stdout?.toString() || compileError.stderr?.toString() || '';
        if (errorOutput.includes('error TS')) {
          result.warnings.push('TypeScript compilation has errors - run type checking for details');
        }
      }

    } catch (error) {
      result.isValid = false;
      result.errors.push(`Configuration validation failed: ${error.message}`);
    }

    this.printResults(result);
    return result;
  }

  async validatePathMappings() {
    console.log('🗺️  Validating path mappings...\n');
    
    const result = {
      isValid: true,
      invalidMappings: [],
      unresolvedPaths: [],
      suggestions: []
    };

    try {
      const configContent = fs.readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(configContent);
      const compilerOptions = config.compilerOptions || {};
      const paths = compilerOptions.paths || {};
      const baseUrl = compilerOptions.baseUrl || '.';

      console.log(`Base URL: ${baseUrl}`);
      console.log(`Found ${Object.keys(paths).length} path mappings\n`);

      for (const [alias, mappings] of Object.entries(paths)) {
        if (!Array.isArray(mappings)) {
          result.invalidMappings.push(`${alias}: mappings must be an array`);
          result.isValid = false;
          continue;
        }

        console.log(`Checking ${alias}:`);
        for (const mapping of mappings) {
          const resolvedPath = path.resolve(this.projectRoot, baseUrl, mapping.replace('/*', ''));
          
          if (fs.existsSync(resolvedPath)) {
            console.log(`  ✅ ${mapping} -> ${resolvedPath}`);
          } else {
            console.log(`  ❌ ${mapping} -> ${resolvedPath} (not found)`);
            result.unresolvedPaths.push(`${alias} -> ${mapping} (resolved to: ${resolvedPath})`);
            result.isValid = false;
          }
        }
        console.log();
      }

      // Suggest common path mappings if missing
      const commonMappings = {
        '@/*': ['./src/*'],
        '@/components/*': ['./src/components/*'],
        '@/lib/*': ['./src/lib/*'],
        '@/types/*': ['./src/types/*']
      };

      for (const [alias, mapping] of Object.entries(commonMappings)) {
        if (!paths[alias]) {
          const suggestedPath = path.resolve(this.projectRoot, baseUrl, mapping[0].replace('/*', ''));
          if (fs.existsSync(suggestedPath)) {
            result.suggestions.push(`Consider adding path mapping: "${alias}": ${JSON.stringify(mapping)}`);
          }
        }
      }

    } catch (error) {
      result.isValid = false;
      result.invalidMappings.push(`Path mapping validation failed: ${error.message}`);
    }

    this.printPathMappingResults(result);
    return result;
  }

  async checkDependencies() {
    console.log('📦 Checking dependency compatibility...\n');
    
    const result = {
      isCompatible: true,
      incompatibleDependencies: [],
      recommendations: []
    };

    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        result.isCompatible = false;
        result.recommendations.push('package.json not found');
        this.printDependencyResults(result);
        return result;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Check TypeScript version
      const tsVersion = dependencies.typescript;
      if (!tsVersion) {
        result.isCompatible = false;
        result.incompatibleDependencies.push({
          name: 'typescript',
          currentVersion: 'not installed',
          requiredVersion: '^5.0.0',
          issue: 'TypeScript is required for the project'
        });
      } else {
        console.log(`TypeScript version: ${tsVersion}`);
        const versionMatch = tsVersion.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          const [major] = versionMatch[1].split('.').map(Number);
          if (major < 5) {
            result.incompatibleDependencies.push({
              name: 'typescript',
              currentVersion: tsVersion,
              requiredVersion: '^5.0.0',
              issue: 'TypeScript version is outdated - consider upgrading for better features'
            });
          } else {
            console.log('✅ TypeScript version is compatible');
          }
        }
      }

      // Check for @types packages
      const typesNeeded = [
        { dep: 'react', types: '@types/react' },
        { dep: 'react-dom', types: '@types/react-dom' },
        { dep: 'node', types: '@types/node' },
        { dep: 'jest', types: '@types/jest' }
      ];

      console.log('\nChecking @types packages:');
      for (const { dep, types } of typesNeeded) {
        if (dependencies[dep]) {
          if (dependencies[types]) {
            console.log(`✅ ${types} (${dependencies[types]})`);
          } else {
            console.log(`❌ ${types} (missing)`);
            result.recommendations.push(`Install ${types} for better TypeScript support with ${dep}`);
          }
        }
      }

      // Check ESLint TypeScript integration
      if (dependencies.eslint) {
        if (dependencies['@typescript-eslint/parser']) {
          console.log('✅ TypeScript ESLint integration configured');
        } else {
          console.log('❌ TypeScript ESLint integration missing');
          result.recommendations.push('Install @typescript-eslint/parser and @typescript-eslint/eslint-plugin for TypeScript linting');
        }
      }

    } catch (error) {
      result.isCompatible = false;
      result.recommendations.push(`Dependency compatibility check failed: ${error.message}`);
    }

    this.printDependencyResults(result);
    return result;
  }

  async getOptimizations() {
    console.log('⚡ Analyzing configuration for optimizations...\n');
    
    const result = {
      optimizations: [],
      performanceImprovements: [],
      strictnessImprovements: []
    };

    try {
      const configContent = fs.readFileSync(this.configPath, 'utf-8');
      const config = JSON.parse(configContent);
      const compilerOptions = config.compilerOptions || {};

      // Performance optimizations
      const performanceChecks = [
        {
          setting: 'incremental',
          current: compilerOptions.incremental,
          recommended: true,
          reason: 'Enables faster subsequent compilations',
          impact: 'high'
        },
        {
          setting: 'skipLibCheck',
          current: compilerOptions.skipLibCheck,
          recommended: true,
          reason: 'Skips type checking of declaration files for faster compilation',
          impact: 'medium'
        }
      ];

      // Strictness improvements
      const strictnessChecks = [
        {
          setting: 'strict',
          current: compilerOptions.strict,
          recommended: true,
          reason: 'Enables all strict type checking options',
          impact: 'high'
        },
        {
          setting: 'noUnusedLocals',
          current: compilerOptions.noUnusedLocals,
          recommended: true,
          reason: 'Reports errors on unused local variables',
          impact: 'low'
        },
        {
          setting: 'noUnusedParameters',
          current: compilerOptions.noUnusedParameters,
          recommended: true,
          reason: 'Reports errors on unused parameters',
          impact: 'low'
        },
        {
          setting: 'exactOptionalPropertyTypes',
          current: compilerOptions.exactOptionalPropertyTypes,
          recommended: true,
          reason: 'Ensures optional properties are handled correctly',
          impact: 'medium'
        }
      ];

      // Process all checks
      [...performanceChecks, ...strictnessChecks].forEach(check => {
        if (check.current !== check.recommended) {
          result.optimizations.push({
            setting: check.setting,
            currentValue: check.current || false,
            recommendedValue: check.recommended,
            reason: check.reason,
            impact: check.impact
          });

          const improvement = `${check.setting}: ${check.reason}`;
          if (performanceChecks.includes(check)) {
            result.performanceImprovements.push(improvement);
          } else {
            result.strictnessImprovements.push(improvement);
          }
        }
      });

      // Module resolution optimization
      if (compilerOptions.moduleResolution !== 'bundler') {
        result.optimizations.push({
          setting: 'moduleResolution',
          currentValue: compilerOptions.moduleResolution || 'node',
          recommendedValue: 'bundler',
          reason: 'Better support for modern bundlers like Webpack, Vite',
          impact: 'medium'
        });
        result.performanceImprovements.push('moduleResolution: Better support for modern bundlers');
      }

    } catch (error) {
      result.performanceImprovements.push('Ensure tsconfig.json is properly configured');
    }

    this.printOptimizationResults(result);
    return result;
  }

  async generateReport() {
    console.log('📊 Generating comprehensive configuration report...\n');
    console.log('='.repeat(60));
    
    const validation = await this.validateConfig();
    console.log('\n' + '='.repeat(60));
    
    const pathMappings = await this.validatePathMappings();
    console.log('='.repeat(60));
    
    const dependencies = await this.checkDependencies();
    console.log('\n' + '='.repeat(60));
    
    const optimizations = await this.getOptimizations();
    console.log('='.repeat(60));

    const report = {
      validation,
      pathMappings,
      dependencies,
      optimizations,
      timestamp: new Date().toISOString()
    };

    // Save report to file
    const reportPath = path.join(this.projectRoot, 'typescript-config-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`\n📄 Full report saved to: ${reportPath}`);
    
    return report;
  }

  printResults(result) {
    if (result.errors.length > 0) {
      console.log('❌ Errors:');
      result.errors.forEach(error => console.log(`  • ${error}`));
      console.log();
    }

    if (result.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  • ${warning}`));
      console.log();
    }

    if (result.suggestions.length > 0) {
      console.log('💡 Suggestions:');
      result.suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
      console.log();
    }

    if (result.errors.length === 0 && result.warnings.length === 0) {
      console.log('✅ Configuration validation passed!\n');
    }
  }

  printPathMappingResults(result) {
    if (result.invalidMappings.length > 0) {
      console.log('❌ Invalid mappings:');
      result.invalidMappings.forEach(mapping => console.log(`  • ${mapping}`));
      console.log();
    }

    if (result.unresolvedPaths.length > 0) {
      console.log('❌ Unresolved paths:');
      result.unresolvedPaths.forEach(path => console.log(`  • ${path}`));
      console.log();
    }

    if (result.suggestions.length > 0) {
      console.log('💡 Suggestions:');
      result.suggestions.forEach(suggestion => console.log(`  • ${suggestion}`));
      console.log();
    }

    if (result.isValid) {
      console.log('✅ All path mappings are valid!\n');
    }
  }

  printDependencyResults(result) {
    if (result.incompatibleDependencies.length > 0) {
      console.log('\n❌ Incompatible dependencies:');
      result.incompatibleDependencies.forEach(dep => {
        console.log(`  • ${dep.name}: ${dep.currentVersion} (requires ${dep.requiredVersion})`);
        console.log(`    ${dep.issue}`);
      });
      console.log();
    }

    if (result.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      result.recommendations.forEach(rec => console.log(`  • ${rec}`));
      console.log();
    }

    if (result.isCompatible && result.recommendations.length === 0) {
      console.log('✅ All dependencies are compatible!\n');
    }
  }

  printOptimizationResults(result) {
    if (result.optimizations.length > 0) {
      console.log('⚡ Available optimizations:');
      result.optimizations.forEach(opt => {
        const impact = opt.impact === 'high' ? '🔥' : opt.impact === 'medium' ? '⚡' : '💡';
        console.log(`  ${impact} ${opt.setting}: ${opt.currentValue} → ${opt.recommendedValue}`);
        console.log(`    ${opt.reason}`);
      });
      console.log();
    }

    if (result.performanceImprovements.length > 0) {
      console.log('🚀 Performance improvements:');
      result.performanceImprovements.forEach(improvement => console.log(`  • ${improvement}`));
      console.log();
    }

    if (result.strictnessImprovements.length > 0) {
      console.log('🔒 Strictness improvements:');
      result.strictnessImprovements.forEach(improvement => console.log(`  • ${improvement}`));
      console.log();
    }

    if (result.optimizations.length === 0) {
      console.log('✅ Configuration is already optimized!\n');
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'report';
  
  const manager = new TypeScriptConfigManagerCLI();

  switch (command) {
    case 'validate':
      await manager.validateConfig();
      break;
    case 'paths':
      await manager.validatePathMappings();
      break;
    case 'deps':
    case 'dependencies':
      await manager.checkDependencies();
      break;
    case 'optimize':
      await manager.getOptimizations();
      break;
    case 'report':
    default:
      await manager.generateReport();
      break;
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = TypeScriptConfigManagerCLI;