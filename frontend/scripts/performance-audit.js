#!/usr/bin/env node

/**
 * Performance Audit Script
 * 
 * This script analyzes the build output to ensure that the enhanced UI system
 * maintains acceptable performance characteristics and bundle sizes.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Bundle size thresholds (in bytes)
const BUNDLE_SIZE_THRESHOLDS = {
  MAIN_BUNDLE_MAX: 250 * 1024, // 250KB
  VENDOR_BUNDLE_MAX: 500 * 1024, // 500KB
  CSS_BUNDLE_MAX: 50 * 1024, // 50KB
  TOTAL_MAX: 800 * 1024, // 800KB
};

/**
 * Analyze Next.js build output
 */
function analyzeBuildOutput() {
  const buildOutputPath = path.join(process.cwd(), '.next');
  
  if (!fs.existsSync(buildOutputPath)) {
    console.error('❌ Build output not found. Run "npm run build" first.');
    process.exit(1);
  }

  console.log('🔍 Analyzing build output...\n');

  // Read build manifest
  const manifestPath = path.join(buildOutputPath, 'build-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Build manifest not found.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  
  // Analyze static files
  const staticPath = path.join(buildOutputPath, 'static');
  const results = {
    js: analyzeJSBundles(staticPath),
    css: analyzeCSSBundles(staticPath),
  };

  // Generate report
  generatePerformanceReport(results);
  
  return results;
}

/**
 * Analyze JavaScript bundles
 */
function analyzeJSBundles(staticPath) {
  const jsPath = path.join(staticPath, 'chunks');
  
  if (!fs.existsSync(jsPath)) {
    return { files: [], totalSize: 0 };
  }

  const jsFiles = fs.readdirSync(jsPath)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(jsPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        gzipSize: getGzipSize(filePath),
      };
    })
    .sort((a, b) => b.size - a.size);

  const totalSize = jsFiles.reduce((sum, file) => sum + file.size, 0);
  const totalGzipSize = jsFiles.reduce((sum, file) => sum + file.gzipSize, 0);

  return {
    files: jsFiles,
    totalSize,
    totalGzipSize,
  };
}

/**
 * Analyze CSS bundles
 */
function analyzeCSSBundles(staticPath) {
  const cssPath = path.join(staticPath, 'css');
  
  if (!fs.existsSync(cssPath)) {
    return { files: [], totalSize: 0 };
  }

  const cssFiles = fs.readdirSync(cssPath)
    .filter(file => file.endsWith('.css'))
    .map(file => {
      const filePath = path.join(cssPath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        gzipSize: getGzipSize(filePath),
      };
    })
    .sort((a, b) => b.size - a.size);

  const totalSize = cssFiles.reduce((sum, file) => sum + file.size, 0);
  const totalGzipSize = cssFiles.reduce((sum, file) => sum + file.gzipSize, 0);

  return {
    files: cssFiles,
    totalSize,
    totalGzipSize,
  };
}

/**
 * Get gzipped size of a file
 */
function getGzipSize(filePath) {
  try {
    const gzipOutput = execSync(`gzip -c "${filePath}" | wc -c`, { encoding: 'utf8' });
    return parseInt(gzipOutput.trim(), 10);
  } catch (error) {
    // Fallback: estimate gzip size as ~30% of original
    const stats = fs.statSync(filePath);
    return Math.round(stats.size * 0.3);
  }
}

/**
 * Format file size for display
 */
function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Generate performance report
 */
function generatePerformanceReport(results) {
  console.log('📊 Performance Audit Report\n');
  console.log('=' .repeat(50));

  // JavaScript bundles analysis
  console.log('\n📦 JavaScript Bundles:');
  console.log('-'.repeat(30));
  
  if (results.js.files.length === 0) {
    console.log('No JavaScript files found.');
  } else {
    results.js.files.forEach(file => {
      const sizeStatus = file.gzipSize > BUNDLE_SIZE_THRESHOLDS.MAIN_BUNDLE_MAX ? '❌' : '✅';
      console.log(`${sizeStatus} ${file.name}`);
      console.log(`   Size: ${formatSize(file.size)} (${formatSize(file.gzipSize)} gzipped)`);
    });
    
    console.log(`\nTotal JS: ${formatSize(results.js.totalSize)} (${formatSize(results.js.totalGzipSize)} gzipped)`);
  }

  // CSS bundles analysis
  console.log('\n🎨 CSS Bundles:');
  console.log('-'.repeat(30));
  
  if (results.css.files.length === 0) {
    console.log('No CSS files found.');
  } else {
    results.css.files.forEach(file => {
      const sizeStatus = file.gzipSize > BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX ? '❌' : '✅';
      console.log(`${sizeStatus} ${file.name}`);
      console.log(`   Size: ${formatSize(file.size)} (${formatSize(file.gzipSize)} gzipped)`);
    });
    
    console.log(`\nTotal CSS: ${formatSize(results.css.totalSize)} (${formatSize(results.css.totalGzipSize)} gzipped)`);
  }

  // Overall analysis
  const totalGzipSize = results.js.totalGzipSize + results.css.totalGzipSize;
  console.log('\n📈 Overall Analysis:');
  console.log('-'.repeat(30));
  console.log(`Total bundle size (gzipped): ${formatSize(totalGzipSize)}`);
  
  // Threshold checks
  const failures = [];
  
  if (results.css.totalGzipSize > BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX) {
    failures.push(`CSS bundle (${formatSize(results.css.totalGzipSize)}) exceeds threshold (${formatSize(BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX)})`);
  }
  
  if (totalGzipSize > BUNDLE_SIZE_THRESHOLDS.TOTAL_MAX) {
    failures.push(`Total bundle (${formatSize(totalGzipSize)}) exceeds threshold (${formatSize(BUNDLE_SIZE_THRESHOLDS.TOTAL_MAX)})`);
  }

  // Report results
  if (failures.length === 0) {
    console.log('✅ All bundle size thresholds met!');
  } else {
    console.log('❌ Bundle size threshold violations:');
    failures.forEach(failure => console.log(`   - ${failure}`));
  }

  // Recommendations
  generateRecommendations(results, totalGzipSize);

  // Save report to file
  saveReportToFile(results, failures, totalGzipSize);
}

/**
 * Generate optimization recommendations
 */
function generateRecommendations(results, totalGzipSize) {
  const recommendations = [];

  if (results.css.totalGzipSize > BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX * 0.8) {
    recommendations.push('Consider reviewing Tailwind CSS purging configuration');
    recommendations.push('Remove unused CSS classes and custom styles');
  }

  if (totalGzipSize > BUNDLE_SIZE_THRESHOLDS.TOTAL_MAX * 0.8) {
    recommendations.push('Consider implementing code splitting for large components');
    recommendations.push('Review and remove unused dependencies');
    recommendations.push('Consider lazy loading for non-critical features');
  }

  if (recommendations.length > 0) {
    console.log('\n💡 Optimization Recommendations:');
    console.log('-'.repeat(30));
    recommendations.forEach(rec => console.log(`   • ${rec}`));
  }
}

/**
 * Save report to file
 */
function saveReportToFile(results, failures, totalGzipSize) {
  const report = {
    timestamp: new Date().toISOString(),
    bundleAnalysis: {
      javascript: {
        files: results.js.files,
        totalSize: results.js.totalSize,
        totalGzipSize: results.js.totalGzipSize,
      },
      css: {
        files: results.css.files,
        totalSize: results.css.totalSize,
        totalGzipSize: results.css.totalGzipSize,
      },
      total: {
        gzipSize: totalGzipSize,
      },
    },
    thresholds: BUNDLE_SIZE_THRESHOLDS,
    passed: failures.length === 0,
    failures,
  };

  const reportPath = path.join(process.cwd(), 'performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting performance audit...\n');
  
  try {
    const results = analyzeBuildOutput();
    
    // Exit with error code if thresholds are exceeded
    const totalGzipSize = results.js.totalGzipSize + results.css.totalGzipSize;
    const hasFailures = 
      results.css.totalGzipSize > BUNDLE_SIZE_THRESHOLDS.CSS_BUNDLE_MAX ||
      totalGzipSize > BUNDLE_SIZE_THRESHOLDS.TOTAL_MAX;
    
    if (hasFailures) {
      console.log('\n❌ Performance audit failed - bundle size thresholds exceeded');
      process.exit(1);
    } else {
      console.log('\n✅ Performance audit passed - all thresholds met');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Performance audit failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBuildOutput,
  BUNDLE_SIZE_THRESHOLDS,
};