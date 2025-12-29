#!/usr/bin/env node

/**
 * TypeScript Performance Optimizer Script
 * Manages performance optimization for TypeScript validation processes
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { performance } = require('perf_hooks');

class TypeScriptPerformanceManager {
  constructor() {
    this.config = this.loadConfig();
    this.cacheDir = path.resolve('.typescript-cache');
    this.metricsFile = path.join(this.cacheDir, 'performance-metrics.json');
    this.alertsFile = path.join(this.cacheDir, 'performance-alerts.json');
    
    this.ensureCacheDirectory();
  }

  loadConfig() {
    const defaultConfig = {
      enableIncrementalCompilation: true,
      enableIntelligentCaching: true,
      enableParallelProcessing: true,
      maxConcurrentProcesses: 4,
      performanceThresholds: {
        maxCompilationTime: 30000, // 30 seconds
        maxValidationTime: 5000,   // 5 seconds
        maxMemoryUsage: 512 * 1024 * 1024, // 512MB
        maxCacheSize: 1000,
      },
      monitoring: {
        enableAlerts: true,
        alertThresholds: {
          compilationTimeIncrease: 50, // 50% increase
          memoryUsageIncrease: 30,     // 30% increase
          errorRateIncrease: 25,       // 25% increase
        },
      },
    };

    try {
      const configFile = path.resolve('typescript-performance.config.json');
      if (fs.existsSync(configFile)) {
        const userConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'));
        return { ...defaultConfig, ...userConfig };
      }
    } catch (error) {
      console.warn('Failed to load performance config, using defaults:', error.message);
    }

    return defaultConfig;
  }

  ensureCacheDirectory() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  async setupIncrementalCompilation() {
    if (!this.config.enableIncrementalCompilation) {
      console.log('Incremental compilation is disabled');
      return;
    }

    console.log('Setting up TypeScript incremental compilation...');

    const tsconfigPath = path.resolve('tsconfig.json');
    
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
      
      // Enable incremental compilation options
      const updatedConfig = {
        ...tsconfig,
        compilerOptions: {
          ...tsconfig.compilerOptions,
          incremental: true,
          tsBuildInfoFile: path.join(this.cacheDir, 'tsconfig.tsbuildinfo'),
        },
      };

      // Backup original tsconfig
      const backupPath = `${tsconfigPath}.backup`;
      if (!fs.existsSync(backupPath)) {
        fs.copyFileSync(tsconfigPath, backupPath);
      }

      // Write updated tsconfig
      fs.writeFileSync(tsconfigPath, JSON.stringify(updatedConfig, null, 2));
      console.log('✓ Incremental compilation enabled');
    } catch (error) {
      console.error('Failed to setup incremental compilation:', error.message);
    }
  }

  async runTypeScriptValidation(files = []) {
    const startTime = performance.now();
    const startMemory = process.memoryUsage();

    console.log('Running TypeScript validation with performance optimization...');

    return new Promise((resolve, reject) => {
      const tscArgs = ['--noEmit'];
      
      if (this.config.enableIncrementalCompilation) {
        tscArgs.push('--incremental');
      }

      if (files.length > 0) {
        tscArgs.push(...files);
      }

      const tsc = spawn('npx', ['tsc', ...tscArgs], {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: process.cwd(),
      });

      let stdout = '';
      let stderr = '';

      tsc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      tsc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      tsc.on('close', (code) => {
        const endTime = performance.now();
        const endMemory = process.memoryUsage();

        const metrics = {
          timestamp: Date.now(),
          compilationTime: endTime - startTime,
          memoryUsage: endMemory.heapUsed - startMemory.heapUsed,
          exitCode: code,
          filesProcessed: files.length || this.countTypeScriptFiles(),
          errorsFound: this.countErrors(stderr),
          warningsFound: this.countWarnings(stderr),
          cacheHitRate: this.calculateCacheHitRate(),
        };

        this.recordMetrics(metrics);
        this.checkPerformanceAlerts(metrics);

        if (code === 0) {
          console.log('✓ TypeScript validation completed successfully');
          console.log(`  Compilation time: ${Math.round(metrics.compilationTime)}ms`);
          console.log(`  Memory usage: ${Math.round(metrics.memoryUsage / 1024 / 1024)}MB`);
          console.log(`  Files processed: ${metrics.filesProcessed}`);
          resolve(metrics);
        } else {
          console.error('✗ TypeScript validation failed');
          console.error(stderr);
          reject(new Error(`TypeScript validation failed with code ${code}`));
        }
      });

      tsc.on('error', (error) => {
        console.error('Failed to run TypeScript validation:', error.message);
        reject(error);
      });
    });
  }

  countTypeScriptFiles() {
    try {
      const result = require('child_process').execSync(
        'find src -name "*.ts" -o -name "*.tsx" | wc -l',
        { encoding: 'utf-8' }
      );
      return parseInt(result.trim(), 10);
    } catch (error) {
      return 0;
    }
  }

  countErrors(output) {
    const errorMatches = output.match(/error TS\d+:/g);
    return errorMatches ? errorMatches.length : 0;
  }

  countWarnings(output) {
    const warningMatches = output.match(/warning TS\d+:/g);
    return warningMatches ? warningMatches.length : 0;
  }

  calculateCacheHitRate() {
    try {
      const buildInfoPath = path.join(this.cacheDir, 'tsconfig.tsbuildinfo');
      if (fs.existsSync(buildInfoPath)) {
        const stats = fs.statSync(buildInfoPath);
        const age = Date.now() - stats.mtime.getTime();
        // Simple heuristic: newer build info suggests better cache utilization
        return Math.max(0, Math.min(1, 1 - (age / (24 * 60 * 60 * 1000))));
      }
    } catch (error) {
      // Ignore errors
    }
    return 0;
  }

  recordMetrics(metrics) {
    try {
      let history = [];
      if (fs.existsSync(this.metricsFile)) {
        history = JSON.parse(fs.readFileSync(this.metricsFile, 'utf-8'));
      }

      history.push(metrics);

      // Keep only last 100 entries
      if (history.length > 100) {
        history = history.slice(-100);
      }

      fs.writeFileSync(this.metricsFile, JSON.stringify(history, null, 2));
    } catch (error) {
      console.warn('Failed to record metrics:', error.message);
    }
  }

  checkPerformanceAlerts(currentMetrics) {
    if (!this.config.monitoring.enableAlerts) {
      return;
    }

    try {
      const history = this.getMetricsHistory();
      if (history.length < 5) {
        return; // Need some history for comparison
      }

      const recentHistory = history.slice(-5);
      const averages = this.calculateAverages(recentHistory);
      const alerts = [];

      // Check compilation time increase
      const compilationIncrease = ((currentMetrics.compilationTime - averages.compilationTime) / averages.compilationTime) * 100;
      if (compilationIncrease > this.config.monitoring.alertThresholds.compilationTimeIncrease) {
        alerts.push({
          type: 'compilation_time_increase',
          message: `Compilation time increased by ${Math.round(compilationIncrease)}%`,
          current: currentMetrics.compilationTime,
          average: averages.compilationTime,
          threshold: this.config.monitoring.alertThresholds.compilationTimeIncrease,
        });
      }

      // Check memory usage increase
      const memoryIncrease = ((currentMetrics.memoryUsage - averages.memoryUsage) / averages.memoryUsage) * 100;
      if (memoryIncrease > this.config.monitoring.alertThresholds.memoryUsageIncrease) {
        alerts.push({
          type: 'memory_usage_increase',
          message: `Memory usage increased by ${Math.round(memoryIncrease)}%`,
          current: currentMetrics.memoryUsage,
          average: averages.memoryUsage,
          threshold: this.config.monitoring.alertThresholds.memoryUsageIncrease,
        });
      }

      // Check error rate increase
      const errorIncrease = ((currentMetrics.errorsFound - averages.errorsFound) / Math.max(1, averages.errorsFound)) * 100;
      if (errorIncrease > this.config.monitoring.alertThresholds.errorRateIncrease) {
        alerts.push({
          type: 'error_rate_increase',
          message: `Error rate increased by ${Math.round(errorIncrease)}%`,
          current: currentMetrics.errorsFound,
          average: averages.errorsFound,
          threshold: this.config.monitoring.alertThresholds.errorRateIncrease,
        });
      }

      if (alerts.length > 0) {
        this.recordAlerts(alerts);
        console.warn('⚠️  Performance alerts detected:');
        alerts.forEach(alert => {
          console.warn(`   ${alert.message}`);
        });
      }
    } catch (error) {
      console.warn('Failed to check performance alerts:', error.message);
    }
  }

  calculateAverages(metrics) {
    const sum = metrics.reduce((acc, m) => ({
      compilationTime: acc.compilationTime + m.compilationTime,
      memoryUsage: acc.memoryUsage + m.memoryUsage,
      errorsFound: acc.errorsFound + m.errorsFound,
      warningsFound: acc.warningsFound + m.warningsFound,
    }), { compilationTime: 0, memoryUsage: 0, errorsFound: 0, warningsFound: 0 });

    const count = metrics.length;
    return {
      compilationTime: sum.compilationTime / count,
      memoryUsage: sum.memoryUsage / count,
      errorsFound: sum.errorsFound / count,
      warningsFound: sum.warningsFound / count,
    };
  }

  recordAlerts(alerts) {
    try {
      const alertRecord = {
        timestamp: Date.now(),
        alerts,
      };

      let alertHistory = [];
      if (fs.existsSync(this.alertsFile)) {
        alertHistory = JSON.parse(fs.readFileSync(this.alertsFile, 'utf-8'));
      }

      alertHistory.push(alertRecord);

      // Keep only last 50 alert records
      if (alertHistory.length > 50) {
        alertHistory = alertHistory.slice(-50);
      }

      fs.writeFileSync(this.alertsFile, JSON.stringify(alertHistory, null, 2));
    } catch (error) {
      console.warn('Failed to record alerts:', error.message);
    }
  }

  getMetricsHistory() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        return JSON.parse(fs.readFileSync(this.metricsFile, 'utf-8'));
      }
    } catch (error) {
      console.warn('Failed to load metrics history:', error.message);
    }
    return [];
  }

  async generatePerformanceReport() {
    console.log('Generating performance report...');

    const history = this.getMetricsHistory();
    if (history.length === 0) {
      console.log('No performance data available');
      return;
    }

    const averages = this.calculateAverages(history);
    const latest = history[history.length - 1];

    const report = {
      summary: {
        totalValidations: history.length,
        averageCompilationTime: Math.round(averages.compilationTime),
        averageMemoryUsage: Math.round(averages.memoryUsage / 1024 / 1024),
        averageErrorsFound: Math.round(averages.errorsFound * 100) / 100,
        averageWarningsFound: Math.round(averages.warningsFound * 100) / 100,
      },
      latest: {
        timestamp: new Date(latest.timestamp).toISOString(),
        compilationTime: Math.round(latest.compilationTime),
        memoryUsage: Math.round(latest.memoryUsage / 1024 / 1024),
        errorsFound: latest.errorsFound,
        warningsFound: latest.warningsFound,
        cacheHitRate: Math.round(latest.cacheHitRate * 100),
      },
      trends: this.calculateTrends(history),
      recommendations: this.generateRecommendations(history, averages),
    };

    const reportPath = path.join(this.cacheDir, 'performance-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log('Performance Report:');
    console.log('==================');
    console.log(`Total validations: ${report.summary.totalValidations}`);
    console.log(`Average compilation time: ${report.summary.averageCompilationTime}ms`);
    console.log(`Average memory usage: ${report.summary.averageMemoryUsage}MB`);
    console.log(`Average errors found: ${report.summary.averageErrorsFound}`);
    console.log(`Average warnings found: ${report.summary.averageWarningsFound}`);
    console.log(`\nLatest validation:`);
    console.log(`  Compilation time: ${report.latest.compilationTime}ms`);
    console.log(`  Memory usage: ${report.latest.memoryUsage}MB`);
    console.log(`  Cache hit rate: ${report.latest.cacheHitRate}%`);
    
    if (report.recommendations.length > 0) {
      console.log('\nRecommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
    }

    console.log(`\nFull report saved to: ${reportPath}`);
  }

  calculateTrends(history) {
    if (history.length < 10) {
      return { insufficient_data: true };
    }

    const recent = history.slice(-10);
    const older = history.slice(-20, -10);

    const recentAvg = this.calculateAverages(recent);
    const olderAvg = this.calculateAverages(older);

    return {
      compilationTime: {
        trend: recentAvg.compilationTime > olderAvg.compilationTime ? 'increasing' : 'decreasing',
        change: Math.round(((recentAvg.compilationTime - olderAvg.compilationTime) / olderAvg.compilationTime) * 100),
      },
      memoryUsage: {
        trend: recentAvg.memoryUsage > olderAvg.memoryUsage ? 'increasing' : 'decreasing',
        change: Math.round(((recentAvg.memoryUsage - olderAvg.memoryUsage) / olderAvg.memoryUsage) * 100),
      },
      errorRate: {
        trend: recentAvg.errorsFound > olderAvg.errorsFound ? 'increasing' : 'decreasing',
        change: Math.round(((recentAvg.errorsFound - olderAvg.errorsFound) / Math.max(1, olderAvg.errorsFound)) * 100),
      },
    };
  }

  generateRecommendations(history, averages) {
    const recommendations = [];
    const thresholds = this.config.performanceThresholds;

    if (averages.compilationTime > thresholds.maxCompilationTime) {
      recommendations.push('Consider enabling incremental compilation to reduce compilation time');
    }

    if (averages.memoryUsage > thresholds.maxMemoryUsage) {
      recommendations.push('Memory usage is high - consider reducing cache size or enabling garbage collection');
    }

    const recentErrors = history.slice(-5).reduce((sum, m) => sum + m.errorsFound, 0);
    if (recentErrors > 0) {
      recommendations.push('Recent validations found errors - consider running error detection more frequently');
    }

    const cacheHitRates = history.slice(-10).map(m => m.cacheHitRate);
    const avgCacheHitRate = cacheHitRates.reduce((sum, rate) => sum + rate, 0) / cacheHitRates.length;
    if (avgCacheHitRate < 0.5) {
      recommendations.push('Low cache hit rate - consider optimizing caching strategy');
    }

    return recommendations;
  }

  async clearCache() {
    console.log('Clearing TypeScript performance cache...');
    
    try {
      const files = [
        path.join(this.cacheDir, 'tsconfig.tsbuildinfo'),
        path.join(this.cacheDir, 'cache.json'),
        this.metricsFile,
        this.alertsFile,
      ];

      for (const file of files) {
        if (fs.existsSync(file)) {
          fs.unlinkSync(file);
          console.log(`✓ Removed ${path.basename(file)}`);
        }
      }

      console.log('Cache cleared successfully');
    } catch (error) {
      console.error('Failed to clear cache:', error.message);
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'validate';

  const manager = new TypeScriptPerformanceManager();

  try {
    switch (command) {
      case 'setup':
        await manager.setupIncrementalCompilation();
        break;
      
      case 'validate':
        const files = args.slice(1);
        await manager.runTypeScriptValidation(files);
        break;
      
      case 'report':
        await manager.generatePerformanceReport();
        break;
      
      case 'clear':
        await manager.clearCache();
        break;
      
      case 'help':
        console.log('TypeScript Performance Optimizer');
        console.log('Usage: node typescript-performance-optimizer.js <command> [options]');
        console.log('');
        console.log('Commands:');
        console.log('  setup     - Setup incremental compilation');
        console.log('  validate  - Run TypeScript validation with performance monitoring');
        console.log('  report    - Generate performance report');
        console.log('  clear     - Clear performance cache');
        console.log('  help      - Show this help message');
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        console.error('Run "node typescript-performance-optimizer.js help" for usage information');
        process.exit(1);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = TypeScriptPerformanceManager;