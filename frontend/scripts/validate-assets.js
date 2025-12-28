#!/usr/bin/env node

/**
 * Static Asset Validation Script
 * 
 * Validates that all required static assets are generated during build
 * and provides detailed reporting for missing or problematic assets.
 */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

class AssetValidator {
  constructor(buildPath = '.next') {
    this.buildPath = buildPath;
    this.requiredAssets = [
      {
        pattern: /static\/chunks\/.*\.js$/,
        type: 'JS',
        required: true,
        description: 'JavaScript chunks',
      },
      {
        pattern: /server\/app\/.*\.js$/,
        type: 'JS',
        required: false,
        description: 'Server-side app bundles',
      },
      {
        pattern: /static\/.*\/_buildManifest\.js$/,
        type: 'JS',
        required: false,
        description: 'Build manifest',
      },
      {
        pattern: /static\/.*\/_ssgManifest\.js$/,
        type: 'JS',
        required: false,
        description: 'SSG manifest',
      },
    ];
  }

  /**
   * Main validation method
   */
  async validate() {
    console.log('🔍 Starting static asset validation...\n');
    
    const result = {
      isValid: true,
      totalAssets: 0,
      validAssets: 0,
      missingAssets: [],
      invalidAssets: [],
      warnings: [],
      details: [],
    };

    try {
      // Check if build directory exists
      if (!fs.existsSync(this.buildPath)) {
        throw new Error(`Build directory not found: ${this.buildPath}`);
      }

      // Discover all assets
      const discoveredAssets = await this.discoverAssets();
      result.totalAssets = discoveredAssets.length;
      
      console.log(`📊 Found ${discoveredAssets.length} assets in build output\n`);

      // Validate each asset
      for (const assetPath of discoveredAssets) {
        const assetDetails = await this.validateAsset(assetPath);
        result.details.push(assetDetails);

        if (assetDetails.exists && assetDetails.issues.length === 0) {
          result.validAssets++;
        } else if (!assetDetails.exists) {
          result.missingAssets.push(assetPath);
        } else if (assetDetails.issues.length > 0) {
          result.invalidAssets.push(assetPath);
        }
      }

      // Check required assets
      const requiredCheck = this.validateRequiredAssets(discoveredAssets);
      result.missingAssets.push(...requiredCheck.missing);
      result.warnings.push(...requiredCheck.warnings);

      // Validate critical directories
      const structureCheck = this.validateDirectoryStructure();
      result.warnings.push(...structureCheck.warnings);

      // Determine overall validity
      result.isValid = result.missingAssets.length === 0 && 
                      result.invalidAssets.length === 0;

      // Generate and display report
      this.displayReport(result);

      return result;

    } catch (error) {
      console.error(`❌ Asset validation failed: ${error.message}`);
      result.isValid = false;
      return result;
    }
  }

  /**
   * Recursively discover all assets in the build directory
   */
  async discoverAssets(dir = this.buildPath, basePath = '') {
    const assets = [];
    
    try {
      const entries = await readdir(dir);
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const relativePath = path.join(basePath, entry);
        const stats = await stat(fullPath);
        
        if (stats.isDirectory()) {
          // Recursively scan subdirectories
          const subAssets = await this.discoverAssets(fullPath, relativePath);
          assets.push(...subAssets);
        } else if (stats.isFile()) {
          // Add file to assets list
          assets.push(relativePath);
        }
      }
    } catch (error) {
      console.warn(`⚠️  Could not scan directory ${dir}: ${error.message}`);
    }
    
    return assets;
  }

  /**
   * Validate a single asset
   */
  async validateAsset(assetPath) {
    const fullPath = path.join(this.buildPath, assetPath);
    const assetDetails = {
      path: assetPath,
      type: this.determineAssetType(assetPath),
      exists: false,
      size: 0,
      lastModified: null,
      issues: [],
    };

    try {
      const stats = await stat(fullPath);
      assetDetails.exists = true;
      assetDetails.size = stats.size;
      assetDetails.lastModified = stats.mtime;

      // Validate based on asset type
      this.validateAssetByType(assetDetails);

    } catch (error) {
      assetDetails.exists = false;
      assetDetails.issues.push(`Cannot access asset: ${error.message}`);
    }

    return assetDetails;
  }

  /**
   * Validate required assets are present
   */
  validateRequiredAssets(discoveredAssets) {
    const missing = [];
    const warnings = [];

    for (const requirement of this.requiredAssets) {
      const matchingAssets = discoveredAssets.filter(asset => 
        requirement.pattern.test(asset)
      );
      
      if (matchingAssets.length === 0 && requirement.required) {
        missing.push(`Required ${requirement.type} asset missing: ${requirement.description}`);
      } else if (matchingAssets.length === 0) {
        warnings.push(`Optional ${requirement.type} asset missing: ${requirement.description}`);
      } else {
        console.log(`✅ Found ${requirement.description}: ${matchingAssets.length} file(s)`);
      }
    }

    return { missing, warnings };
  }

  /**
   * Validate directory structure
   */
  validateDirectoryStructure() {
    const warnings = [];
    const criticalDirs = ['static', 'server'];

    for (const dir of criticalDirs) {
      const dirPath = path.join(this.buildPath, dir);
      if (!fs.existsSync(dirPath)) {
        warnings.push(`Critical directory missing: ${dir}`);
      } else {
        console.log(`✅ Critical directory exists: ${dir}`);
      }
    }

    return { warnings };
  }

  /**
   * Determine asset type from file extension
   */
  determineAssetType(assetPath) {
    const extension = path.extname(assetPath).toLowerCase();
    
    switch (extension) {
      case '.css':
        return 'CSS';
      case '.js':
      case '.mjs':
        return 'JS';
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.gif':
      case '.svg':
      case '.webp':
      case '.ico':
        return 'IMAGE';
      case '.woff':
      case '.woff2':
      case '.ttf':
      case '.eot':
        return 'FONT';
      case '.json':
        return 'JSON';
      case '.html':
        return 'HTML';
      default:
        return 'OTHER';
    }
  }

  /**
   * Validate asset based on its type
   */
  validateAssetByType(assetDetails) {
    // Skip validation for certain expected empty files
    const expectedEmptyFiles = [
      'dev/lock',
      'turbopack',
      'trace',
      'trace-build',
    ];
    
    if (expectedEmptyFiles.some(file => assetDetails.path.includes(file))) {
      return; // Skip validation for expected empty files
    }

    switch (assetDetails.type) {
      case 'CSS':
        if (assetDetails.size === 0) {
          assetDetails.issues.push('CSS file is empty');
        } else if (assetDetails.size > 2 * 1024 * 1024) { // 2MB (increased threshold)
          assetDetails.issues.push(`Large CSS file: ${this.formatSize(assetDetails.size)}`);
        }
        break;
        
      case 'JS':
        if (assetDetails.size === 0 && !assetDetails.path.includes('client-only')) {
          assetDetails.issues.push('JavaScript file is empty');
        } else if (assetDetails.size > 10 * 1024 * 1024) { // 10MB (increased threshold)
          assetDetails.issues.push(`Very large JavaScript file: ${this.formatSize(assetDetails.size)}`);
        }
        break;
        
      case 'IMAGE':
        if (assetDetails.size === 0) {
          assetDetails.issues.push('Image file is empty');
        } else if (assetDetails.size > 10 * 1024 * 1024) { // 10MB
          assetDetails.issues.push(`Very large image file: ${this.formatSize(assetDetails.size)}`);
        }
        break;
        
      default:
        if (assetDetails.size === 0 && !expectedEmptyFiles.some(file => assetDetails.path.includes(file))) {
          assetDetails.issues.push('File is empty');
        }
        break;
    }
  }

  /**
   * Format file size for display
   */
  formatSize(bytes) {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Display validation report
   */
  displayReport(result) {
    console.log('\n' + '='.repeat(60));
    console.log('📊 STATIC ASSET VALIDATION REPORT');
    console.log('='.repeat(60));

    // Summary
    console.log(`\n📈 Summary:`);
    console.log(`   Total Assets: ${result.totalAssets}`);
    console.log(`   Valid Assets: ${result.validAssets}`);
    console.log(`   Missing Assets: ${result.missingAssets.length}`);
    console.log(`   Invalid Assets: ${result.invalidAssets.length}`);
    console.log(`   Overall Status: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);

    // Asset breakdown by type
    const assetsByType = this.groupAssetsByType(result.details);
    console.log(`\n📁 Assets by Type:`);
    Object.entries(assetsByType).forEach(([type, assets]) => {
      const validCount = assets.filter(a => a.exists && a.issues.length === 0).length;
      const totalSize = assets.reduce((sum, a) => sum + (a.size || 0), 0);
      console.log(`   ${type}: ${validCount}/${assets.length} valid (${this.formatSize(totalSize)})`);
    });

    // Missing assets
    if (result.missingAssets.length > 0) {
      console.log(`\n❌ Missing Assets (${result.missingAssets.length}):`);
      result.missingAssets.forEach((asset, index) => {
        console.log(`   ${index + 1}. ${asset}`);
      });
    }

    // Invalid assets
    if (result.invalidAssets.length > 0) {
      console.log(`\n⚠️  Invalid Assets (${result.invalidAssets.length}):`);
      result.invalidAssets.forEach((asset, index) => {
        const details = result.details.find(d => d.path === asset);
        console.log(`   ${index + 1}. ${asset}`);
        if (details && details.issues.length > 0) {
          details.issues.forEach(issue => {
            console.log(`      - ${issue}`);
          });
        }
      });
    }

    // Warnings
    if (result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings (${result.warnings.length}):`);
      result.warnings.forEach((warning, index) => {
        console.log(`   ${index + 1}. ${warning}`);
      });
    }

    console.log('\n' + '='.repeat(60));

    // Save detailed report
    this.saveDetailedReport(result);
  }

  /**
   * Group assets by type
   */
  groupAssetsByType(assets) {
    return assets.reduce((groups, asset) => {
      const type = asset.type;
      if (!groups[type]) {
        groups[type] = [];
      }
      groups[type].push(asset);
      return groups;
    }, {});
  }

  /**
   * Save detailed report to file
   */
  saveDetailedReport(result) {
    const report = {
      timestamp: new Date().toISOString(),
      buildPath: this.buildPath,
      validation: result,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        cwd: process.cwd(),
      },
    };

    const reportPath = 'asset-validation-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);
  }
}

// CLI execution
async function main() {
  const buildPath = process.argv[2] || '.next';
  const validator = new AssetValidator(buildPath);
  
  try {
    const result = await validator.validate();
    
    if (!result.isValid) {
      console.error('\n❌ Asset validation failed!');
      process.exit(1);
    } else {
      console.log('\n✅ All assets validated successfully!');
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n❌ Validation error: ${error.message}`);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AssetValidator;