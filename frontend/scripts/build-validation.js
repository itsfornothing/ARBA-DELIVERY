#!/usr/bin/env node

/**
 * Build Validation Script
 * Comprehensive validation of build process using the new validation utilities
 */

const path = require('path');
const fs = require('fs');

// Since we're dealing with TypeScript modules, we'll implement the validation logic directly
// or use a simpler approach that doesn't require TypeScript compilation

class BuildValidator {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.results = {
      moduleResolution: null,
      dependencies: null,
      buildProcess: null,
      overall: false
    };
  }

  async validateAll() {
    console.log('🔍 Starting comprehensive build validation...\n');

    try {
      // 1. Validate module resolution
      await this.validateModuleResolution();
      
      // 2. Validate dependencies
      await this.validateDependencies();
      
      // 3. Validate build process
      await this.validateBuildProcess();
      
      // 4. Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Build validation failed:', error.message);
      process.exit(1);
    }
  }

  async validateModuleResolution() {
    console.log('📦 Validating module resolution...');
    
    try {
      // Check if utils.ts exists and is accessible
      const utilsPath = path.join(this.projectRoot, 'src', 'lib', 'utils.ts');
      const validationPath = path.join(this.projectRoot, 'src', 'lib', 'validation.ts');
      
      const utilsExists = fs.existsSync(utilsPath);
      const validationExists = fs.existsSync(validationPath);
      
      // Check tsconfig.json path mappings
      const tsconfigPath = path.join(this.projectRoot, 'tsconfig.json');
      let pathMappingsValid = false;
      
      if (fs.existsSync(tsconfigPath)) {
        const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
        const paths = tsconfig.compilerOptions?.paths;
        pathMappingsValid = paths && paths['@/lib/*'] && paths['@/lib/*'].includes('./src/lib/*');
      }

      this.results.moduleResolution = {
        success: utilsExists && validationExists && pathMappingsValid,
        utilsImport: { isValid: utilsExists, importPath: '@/lib/utils' },
        validationImport: { isValid: validationExists, importPath: '@/lib/validation' },
        pathMappings: pathMappingsValid
      };

      if (this.results.moduleResolution.success) {
        console.log('✅ Module resolution validation passed');
        console.log('   - utils.ts found and accessible');
        console.log('   - validation.ts found and accessible');
        console.log('   - Path mappings configured correctly');
      } else {
        console.log('❌ Module resolution validation failed');
        if (!utilsExists) {
          console.log('   - utils.ts not found at expected location');
        }
        if (!validationExists) {
          console.log('   - validation.ts not found at expected location');
        }
        if (!pathMappingsValid) {
          console.log('   - Path mappings not configured correctly in tsconfig.json');
        }
      }
    } catch (error) {
      console.log('❌ Module resolution validation error:', error.message);
      this.results.moduleResolution = { success: false, error: error.message };
    }
    
    console.log('');
  }

  async validateDependencies() {
    console.log('📚 Validating dependencies...');
    
    try {
      // Check package.json
      const packagePath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      
      // Check critical dependencies
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      const clsxAvailable = 'clsx' in deps;
      const tailwindMergeAvailable = 'tailwind-merge' in deps;
      
      // Try to resolve the modules
      let clsxResolvable = false;
      let tailwindMergeResolvable = false;
      
      try {
        require.resolve('clsx', { paths: [this.projectRoot] });
        clsxResolvable = true;
      } catch {}
      
      try {
        require.resolve('tailwind-merge', { paths: [this.projectRoot] });
        tailwindMergeResolvable = true;
      } catch {}

      this.results.dependencies = {
        success: clsxAvailable && tailwindMergeAvailable && clsxResolvable && tailwindMergeResolvable,
        clsx: { 
          isAvailable: clsxAvailable && clsxResolvable, 
          version: deps.clsx 
        },
        tailwindMerge: { 
          isAvailable: tailwindMergeAvailable && tailwindMergeResolvable, 
          version: deps['tailwind-merge'] 
        },
        totalDependencies: Object.keys(deps).length
      };

      if (this.results.dependencies.success) {
        console.log('✅ Dependency validation passed');
        console.log(`   - Total dependencies: ${this.results.dependencies.totalDependencies}`);
        console.log(`   - clsx version: ${deps.clsx || 'unknown'}`);
        console.log(`   - tailwind-merge version: ${deps['tailwind-merge'] || 'unknown'}`);
      } else {
        console.log('❌ Dependency validation failed');
        if (!clsxAvailable || !clsxResolvable) {
          console.log('   - clsx not available or not resolvable');
        }
        if (!tailwindMergeAvailable || !tailwindMergeResolvable) {
          console.log('   - tailwind-merge not available or not resolvable');
        }
      }
    } catch (error) {
      console.log('❌ Dependency validation error:', error.message);
      this.results.dependencies = { success: false, error: error.message };
    }
    
    console.log('');
  }

  async validateBuildProcess() {
    console.log('🔨 Validating build process...');
    
    try {
      // Check if build directory exists
      const buildDir = path.join(this.projectRoot, '.next');
      const buildExists = fs.existsSync(buildDir);
      
      let buildSize = 0;
      let criticalFilesExist = true;
      
      if (buildExists) {
        // Calculate build size
        buildSize = this.getDirectorySize(buildDir);
        
        // Check for critical build files
        const criticalFiles = [
          'build-manifest.json',
          'static'
        ];
        
        for (const file of criticalFiles) {
          const filePath = path.join(buildDir, file);
          if (!fs.existsSync(filePath)) {
            criticalFilesExist = false;
            break;
          }
        }
      }

      this.results.buildProcess = {
        success: buildExists && criticalFilesExist,
        buildExists,
        criticalFilesExist,
        buildSize: buildSize > 0 ? buildSize : undefined
      };

      if (this.results.buildProcess.success) {
        console.log('✅ Build process validation passed');
        if (buildSize > 0) {
          console.log(`   - Build size: ${(buildSize / 1024 / 1024).toFixed(2)}MB`);
        }
        console.log('   - Critical build files present');
      } else {
        console.log('❌ Build process validation failed');
        if (!buildExists) {
          console.log('   - Build directory (.next) not found - run npm run build first');
        }
        if (!criticalFilesExist) {
          console.log('   - Critical build files missing');
        }
      }
    } catch (error) {
      console.log('❌ Build process validation error:', error.message);
      this.results.buildProcess = { success: false, error: error.message };
    }
    
    console.log('');
  }

  generateFinalReport() {
    const allPassed = this.results.moduleResolution?.success && 
                     this.results.dependencies?.success && 
                     this.results.buildProcess?.success;

    console.log('📊 Final Validation Report');
    console.log('========================');
    console.log(`Module Resolution: ${this.results.moduleResolution?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Dependencies: ${this.results.dependencies?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Build Process: ${this.results.buildProcess?.success ? '✅ PASS' : '❌ FAIL'}`);
    console.log('========================');
    
    if (allPassed) {
      console.log('🎉 All validations passed! Build system is healthy.');
      this.results.overall = true;
    } else {
      console.log('⚠️  Some validations failed. Please review the issues above.');
      this.results.overall = false;
    }

    // Save detailed report to file
    this.saveDetailedReport();
  }

  saveDetailedReport() {
    const reportPath = path.join(this.projectRoot, 'build-validation-report.json');
    const report = {
      timestamp: new Date().toISOString(),
      results: this.results,
      summary: {
        overall: this.results.overall,
        moduleResolution: this.results.moduleResolution?.success || false,
        dependencies: this.results.dependencies?.success || false,
        buildProcess: this.results.buildProcess?.success || false
      }
    };

    try {
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Detailed report saved to: ${reportPath}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save detailed report: ${error.message}`);
    }
  }

  getDirectorySize(dirPath) {
    let size = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          size += this.getDirectorySize(itemPath);
        } else {
          size += stats.size;
        }
      }
    } catch {
      // Ignore errors
    }
    
    return size;
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new BuildValidator();
  validator.validateAll().then(() => {
    process.exit(validator.results.overall ? 0 : 1);
  }).catch(error => {
    console.error('Validation failed:', error);
    process.exit(1);
  });
}

module.exports = BuildValidator;