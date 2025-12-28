#!/usr/bin/env node

/**
 * Runtime Performance Validator
 * 
 * This script validates runtime performance characteristics of the enhanced UI system
 * by running performance tests and measuring key metrics.
 * 
 * Requirements: 8.3, 8.5
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Performance thresholds
const PERFORMANCE_THRESHOLDS = {
  // Component rendering (milliseconds)
  COMPONENT_RENDER_MAX: 16,      // 60fps target
  COMPLEX_RENDER_MAX: 200,       // Complex trees
  RAPID_RERENDER_MAX: 300,       // Rapid state updates
  
  // Interaction response times (milliseconds)
  BUTTON_CLICK_MAX: 100,         // Button click response
  INPUT_RESPONSE_MAX: 200,       // Input typing response
  HOVER_RESPONSE_MAX: 300,       // Hover interactions
  FOCUS_MANAGEMENT_MAX: 250,     // Focus transitions
  
  // Code splitting (milliseconds)
  LAZY_LOAD_MAX: 100,           // Lazy component loading
  DYNAMIC_IMPORT_MAX: 150,      // Dynamic imports
  
  // Memory and lifecycle (milliseconds)
  LIFECYCLE_MAX: 500,           // Component lifecycle
  CLEANUP_MAX: 50,              // Resource cleanup
};

/**
 * Run performance tests and collect results
 */
function runPerformanceTests() {
  console.log('🚀 Running runtime performance validation tests...\n');
  
  try {
    // Run the performance validation test suite
    const testOutput = execSync(
      'npm test -- --testPathPattern=runtime-performance-validation.test.tsx --silent',
      { 
        encoding: 'utf8',
        cwd: process.cwd(),
        stdio: 'pipe'
      }
    );
    
    // Since Jest doesn't output JSON by default, we'll parse the text output
    return parseTestOutput(testOutput);
    
  } catch (error) {
    console.error('❌ Failed to run performance tests:', error.message);
    
    // Try to parse results from the error output
    if (error.stdout) {
      return parseTestOutput(error.stdout);
    }
    
    return {
      passed: false,
      failures: ['Failed to run performance tests'],
      metrics: {},
    };
  }
}

/**
 * Parse Jest text output to extract test results
 */
function parseTestOutput(output) {
  const lines = output.split('\n');
  const failures = [];
  const metrics = {};
  let passed = true;
  
  // Look for test failures
  lines.forEach(line => {
    if (line.includes('FAIL') || line.includes('✕')) {
      passed = false;
    }
    
    if (line.includes('Expected:') && line.includes('Received:')) {
      failures.push(line.trim());
    }
    
    // Extract timing information
    const timingMatch = line.match(/(\d+)\s*ms\)/);
    if (timingMatch) {
      const time = parseInt(timingMatch[1]);
      if (line.includes('render')) {
        metrics.renderTime = time;
      } else if (line.includes('interaction')) {
        metrics.interactionTime = time;
      }
    }
  });
  
  // Check for overall test results
  const testSummaryLine = lines.find(line => 
    line.includes('Test Suites:') || line.includes('Tests:')
  );
  
  if (testSummaryLine && testSummaryLine.includes('failed')) {
    passed = false;
  }
  
  return {
    passed,
    failures,
    metrics,
    rawOutput: output,
  };
}

/**
 * Analyze test results and extract performance metrics
 */
function analyzeTestResults(testResults) {
  const failures = [];
  const metrics = {};
  
  if (!testResults.success) {
    // Extract failure information
    if (testResults.testResults && testResults.testResults.length > 0) {
      testResults.testResults.forEach(testFile => {
        if (testFile.assertionResults) {
          testFile.assertionResults.forEach(test => {
            if (test.status === 'failed') {
              failures.push(`${test.title}: ${test.failureMessages.join(', ')}`);
            }
          });
        }
      });
    }
  }
  
  // Extract performance metrics from test output
  if (testResults.testResults) {
    testResults.testResults.forEach(testFile => {
      if (testFile.message) {
        extractMetricsFromMessage(testFile.message, metrics);
      }
    });
  }
  
  return {
    passed: testResults.success && failures.length === 0,
    failures,
    metrics,
    testResults,
  };
}

/**
 * Extract performance metrics from test messages
 */
function extractMetricsFromMessage(message, metrics) {
  // Look for timing information in test output
  const timingRegex = /(\w+)\s+time[:\s]+(\d+(?:\.\d+)?)\s*ms/gi;
  let match;
  
  while ((match = timingRegex.exec(message)) !== null) {
    const [, metricName, timeValue] = match;
    metrics[metricName] = parseFloat(timeValue);
  }
  
  // Look for render time information
  const renderRegex = /render\s+time[:\s]+(\d+(?:\.\d+)?)\s*ms/gi;
  match = renderRegex.exec(message);
  if (match) {
    metrics.renderTime = parseFloat(match[1]);
  }
  
  // Look for interaction time information
  const interactionRegex = /interaction\s+time[:\s]+(\d+(?:\.\d+)?)\s*ms/gi;
  match = interactionRegex.exec(message);
  if (match) {
    metrics.interactionTime = parseFloat(match[1]);
  }
}

/**
 * Validate performance metrics against thresholds
 */
function validatePerformanceMetrics(metrics) {
  const violations = [];
  
  // Check component rendering performance
  if (metrics.renderTime && metrics.renderTime > PERFORMANCE_THRESHOLDS.COMPONENT_RENDER_MAX) {
    violations.push(`Component render time (${metrics.renderTime}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.COMPONENT_RENDER_MAX}ms)`);
  }
  
  if (metrics.complexRenderTime && metrics.complexRenderTime > PERFORMANCE_THRESHOLDS.COMPLEX_RENDER_MAX) {
    violations.push(`Complex render time (${metrics.complexRenderTime}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.COMPLEX_RENDER_MAX}ms)`);
  }
  
  // Check interaction response times
  if (metrics.interactionTime && metrics.interactionTime > PERFORMANCE_THRESHOLDS.BUTTON_CLICK_MAX) {
    violations.push(`Interaction time (${metrics.interactionTime}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.BUTTON_CLICK_MAX}ms)`);
  }
  
  if (metrics.inputResponseTime && metrics.inputResponseTime > PERFORMANCE_THRESHOLDS.INPUT_RESPONSE_MAX) {
    violations.push(`Input response time (${metrics.inputResponseTime}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.INPUT_RESPONSE_MAX}ms)`);
  }
  
  // Check code splitting performance
  if (metrics.lazyLoadTime && metrics.lazyLoadTime > PERFORMANCE_THRESHOLDS.LAZY_LOAD_MAX) {
    violations.push(`Lazy load time (${metrics.lazyLoadTime}ms) exceeds threshold (${PERFORMANCE_THRESHOLDS.LAZY_LOAD_MAX}ms)`);
  }
  
  return violations;
}

/**
 * Run code splitting validation
 */
function validateCodeSplitting() {
  console.log('📦 Validating code splitting configuration...\n');
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.ts');
  
  if (!fs.existsSync(nextConfigPath)) {
    return {
      passed: false,
      message: 'Next.js configuration file not found',
    };
  }
  
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check for optimization configurations
  const optimizations = {
    packageImports: nextConfig.includes('optimizePackageImports'),
    experimental: nextConfig.includes('experimental'),
  };
  
  const recommendations = [];
  
  if (!optimizations.packageImports) {
    recommendations.push('Consider enabling optimizePackageImports for better tree shaking');
  }
  
  // Check build output for code splitting
  const buildOutputPath = path.join(process.cwd(), '.next');
  let codeSplittingActive = false;
  
  if (fs.existsSync(buildOutputPath)) {
    const chunksPath = path.join(buildOutputPath, 'static', 'chunks');
    if (fs.existsSync(chunksPath)) {
      const chunks = fs.readdirSync(chunksPath);
      codeSplittingActive = chunks.length > 1; // More than just main chunk
    }
  }
  
  return {
    passed: codeSplittingActive,
    message: codeSplittingActive 
      ? 'Code splitting is active' 
      : 'Code splitting may not be working properly',
    optimizations,
    recommendations,
  };
}

/**
 * Generate performance report
 */
function generatePerformanceReport(testResults, codeSplittingResults) {
  console.log('📊 Runtime Performance Validation Report\n');
  console.log('=' .repeat(50));
  
  // Test results summary
  console.log('\n🧪 Test Results:');
  console.log('-'.repeat(30));
  
  if (testResults.passed) {
    console.log('✅ All performance tests passed');
  } else {
    console.log('❌ Performance test failures:');
    testResults.failures.forEach(failure => {
      console.log(`   - ${failure}`);
    });
  }
  
  // Performance metrics
  if (Object.keys(testResults.metrics).length > 0) {
    console.log('\n📈 Performance Metrics:');
    console.log('-'.repeat(30));
    
    Object.entries(testResults.metrics).forEach(([metric, value]) => {
      console.log(`   ${metric}: ${value}ms`);
    });
    
    // Validate metrics against thresholds
    const violations = validatePerformanceMetrics(testResults.metrics);
    if (violations.length > 0) {
      console.log('\n⚠️  Performance Threshold Violations:');
      violations.forEach(violation => {
        console.log(`   - ${violation}`);
      });
    }
  }
  
  // Code splitting results
  console.log('\n📦 Code Splitting:');
  console.log('-'.repeat(30));
  
  if (codeSplittingResults.passed) {
    console.log('✅ Code splitting is working properly');
  } else {
    console.log(`❌ ${codeSplittingResults.message}`);
  }
  
  if (codeSplittingResults.recommendations && codeSplittingResults.recommendations.length > 0) {
    console.log('\n💡 Code Splitting Recommendations:');
    codeSplittingResults.recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  }
  
  // Overall assessment
  const overallPassed = testResults.passed && codeSplittingResults.passed;
  
  console.log('\n🎯 Overall Assessment:');
  console.log('-'.repeat(30));
  
  if (overallPassed) {
    console.log('✅ Runtime performance validation PASSED');
    console.log('   All performance requirements are met');
  } else {
    console.log('❌ Runtime performance validation FAILED');
    console.log('   Performance improvements needed');
  }
  
  // Performance recommendations
  generatePerformanceRecommendations(testResults, codeSplittingResults);
  
  // Save report to file
  savePerformanceReport(testResults, codeSplittingResults, overallPassed);
  
  return overallPassed;
}

/**
 * Generate performance optimization recommendations
 */
function generatePerformanceRecommendations(testResults, codeSplittingResults) {
  const recommendations = [];
  
  // Based on test failures
  if (!testResults.passed) {
    recommendations.push('Review component rendering performance');
    recommendations.push('Optimize state management to reduce unnecessary re-renders');
    recommendations.push('Consider using React.memo for expensive components');
  }
  
  // Based on metrics
  if (testResults.metrics.renderTime > PERFORMANCE_THRESHOLDS.COMPONENT_RENDER_MAX * 0.8) {
    recommendations.push('Consider optimizing component render logic');
    recommendations.push('Review component prop dependencies');
  }
  
  if (testResults.metrics.interactionTime > PERFORMANCE_THRESHOLDS.BUTTON_CLICK_MAX * 0.8) {
    recommendations.push('Optimize event handler performance');
    recommendations.push('Consider debouncing rapid interactions');
  }
  
  // Based on code splitting
  if (!codeSplittingResults.passed) {
    recommendations.push('Implement proper code splitting for large components');
    recommendations.push('Use React.lazy for non-critical components');
    recommendations.push('Configure Next.js dynamic imports');
  }
  
  if (recommendations.length > 0) {
    console.log('\n💡 Performance Optimization Recommendations:');
    console.log('-'.repeat(30));
    recommendations.forEach(rec => {
      console.log(`   • ${rec}`);
    });
  }
}

/**
 * Save performance report to file
 */
function savePerformanceReport(testResults, codeSplittingResults, overallPassed) {
  const report = {
    timestamp: new Date().toISOString(),
    overallPassed,
    testResults: {
      passed: testResults.passed,
      failures: testResults.failures,
      metrics: testResults.metrics,
    },
    codeSplitting: {
      passed: codeSplittingResults.passed,
      message: codeSplittingResults.message,
      optimizations: codeSplittingResults.optimizations,
      recommendations: codeSplittingResults.recommendations,
    },
    thresholds: PERFORMANCE_THRESHOLDS,
  };
  
  const reportPath = path.join(process.cwd(), 'runtime-performance-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`\n📄 Report saved to: ${reportPath}`);
}

/**
 * Main execution
 */
function main() {
  console.log('🚀 Starting runtime performance validation...\n');
  
  try {
    // Run performance tests
    const testResults = runPerformanceTests();
    
    // Validate code splitting
    const codeSplittingResults = validateCodeSplitting();
    
    // Generate report
    const passed = generatePerformanceReport(testResults, codeSplittingResults);
    
    // Exit with appropriate code
    if (passed) {
      console.log('\n✅ Runtime performance validation completed successfully');
      process.exit(0);
    } else {
      console.log('\n❌ Runtime performance validation failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Runtime performance validation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  runPerformanceTests,
  validateCodeSplitting,
  PERFORMANCE_THRESHOLDS,
};