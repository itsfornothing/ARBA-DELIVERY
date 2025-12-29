#!/usr/bin/env node

/**
 * Build Configuration Validator
 * Validates that Next.js build configuration optimizations are working correctly
 */

const fs = require('fs');
const path = require('path');

class BuildConfigValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.validations = [];
  }

  /**
   * Validate Next.js configuration
   */
  validateNextConfig() {
    console.log('🔍 Validating Next.js configuration...');
    
    try {
      const nextConfigPath = path.join(process.cwd(), 'next.config.js');
      const nextConfig = require(nextConfigPath);
      
      // Check for required optimizations
      this.checkRequired(nextConfig.output === 'standalone', 'Standalone output enabled');
      this.checkRequired(nextConfig.compress === true, 'Compression enabled');
      this.checkRequired(nextConfig.poweredByHeader === false, 'X-Powered-By header disabled');
      
      // Check experimental features
      if (nextConfig.experimental) {
        this.checkOptional(nextConfig.experimental.optimizeCss, 'CSS optimization enabled');
        this.checkOptional(nextConfig.experimental.optimizePackageImports, 'Package imports optimization enabled');
      }
      
      // Check webpack configuration
      this.checkRequired(typeof nextConfig.webpack === 'function', 'Custom webpack configuration present');
      
      // Check TypeScript configuration
      if (nextConfig.typescript) {
        const isDev = process.env.NODE_ENV === 'development';
        const expectedIgnore = isDev;
        this.checkRequired(
          nextConfig.typescript.ignoreBuildErrors === expectedIgnore,
          `TypeScript checking properly configured for ${process.env.NODE_ENV || 'production'}`
        );
      }
      
      console.log('✅ Next.js configuration validation completed');
      
    } catch (error) {
      this.errors.push(`Failed to validate Next.js config: ${error.message}`);
    }
  }

  /**
   * Validate TypeScript configuration
   */
  validateTypeScriptConfig() {
    console.log('🔍 Validating TypeScript configuration...');
    
    try {
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      // Check compiler options
      const compilerOptions = tsconfig.compilerOptions;
      this.checkRequired(compilerOptions.baseUrl === '.', 'Base URL set to current directory');
      this.checkRequired(compilerOptions.paths && compilerOptions.paths['@/*'], 'Path mapping for @/* configured');
      this.checkRequired(compilerOptions.moduleResolution === 'bundler', 'Module resolution set to bundler');
      
      // Check additional path mappings
      if (compilerOptions.paths) {
        this.checkOptional(compilerOptions.paths['@/lib/*'], 'Lib path mapping configured');
        this.checkOptional(compilerOptions.paths['@/components/*'], 'Components path mapping configured');
      }
      
      console.log('✅ TypeScript configuration validation completed');
      
    } catch (error) {
      this.errors.push(`Failed to validate TypeScript config: ${error.message}`);
    }
  }

  /**
   * Validate build output structure
   */
  validateBuildOutput() {
    console.log('🔍 Validating build output...');
    
    const buildDir = path.join(process.cwd(), '.next');
    
    if (!fs.existsSync(buildDir)) {
      this.warnings.push('Build directory not found - run npm run build first');
      return;
    }
    
    // Check for optimized chunks
    const staticDir = path.join(buildDir, 'static');
    if (fs.existsSync(staticDir)) {
      const chunks = fs.readdirSync(path.join(staticDir, 'chunks')).filter(f => f.endsWith('.js'));
      this.checkOptional(chunks.length > 0, `Found ${chunks.length} JavaScript chunks`);
      
      // Check for specific optimized chunks
      const hasVendorChunk = chunks.some(chunk => chunk.includes('vendors'));
      const hasUtilsChunk = chunks.some(chunk => chunk.includes('utils'));
      
      this.checkOptional(hasVendorChunk, 'Vendor chunk separation working');
      this.checkOptional(hasUtilsChunk, 'Utils chunk separation working');
    }
    
    console.log('✅ Build output validation completed');
  }

  /**
   * Validate package dependencies
   */
  validateDependencies() {
    console.log('🔍 Validating dependencies...');
    
    try {
      const packagePath = path.join(process.cwd(), 'package.json');
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      
      // Check for required utilities
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      this.checkRequired(deps['clsx'], 'clsx utility library present');
      this.checkRequired(deps['tailwind-merge'], 'tailwind-merge utility library present');
      this.checkRequired(deps['next'], 'Next.js framework present');
      this.checkRequired(deps['typescript'], 'TypeScript present');
      
      // Check for optimization packages
      this.checkOptional(deps['webpack-bundle-analyzer'], 'Bundle analyzer available');
      
      console.log('✅ Dependencies validation completed');
      
    } catch (error) {
      this.errors.push(`Failed to validate dependencies: ${error.message}`);
    }
  }

  /**
   * Check required condition
   */
  checkRequired(condition, message) {
    if (condition) {
      this.validations.push(`✅ ${message}`);
    } else {
      this.errors.push(`❌ ${message}`);
    }
  }

  /**
   * Check optional condition
   */
  checkOptional(condition, message) {
    if (condition) {
      this.validations.push(`✅ ${message}`);
    } else {
      this.warnings.push(`⚠️  ${message}`);
    }
  }

  /**
   * Run all validations
   */
  async validate() {
    console.log('🚀 Starting build configuration validation...\n');
    
    this.validateNextConfig();
    this.validateTypeScriptConfig();
    this.validateDependencies();
    this.validateBuildOutput();
    
    // Print results
    console.log('\n📊 Validation Results:');
    console.log('='.repeat(50));
    
    if (this.validations.length > 0) {
      console.log('\n✅ Successful Validations:');
      this.validations.forEach(validation => console.log(`  ${validation}`));
    }
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      this.warnings.forEach(warning => console.log(`  ${warning}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => console.log(`  ${error}`));
      console.log('\n💡 Please fix the errors above before deployment.');
      process.exit(1);
    }
    
    console.log('\n🎉 Build configuration validation completed successfully!');
    console.log(`✅ ${this.validations.length} validations passed`);
    console.log(`⚠️  ${this.warnings.length} warnings found`);
    console.log(`❌ ${this.errors.length} errors found`);
  }
}

// Run validation if called directly
if (require.main === module) {
  const validator = new BuildConfigValidator();
  validator.validate().catch(error => {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  });
}

module.exports = BuildConfigValidator;