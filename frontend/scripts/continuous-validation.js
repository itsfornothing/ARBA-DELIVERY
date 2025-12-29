#!/usr/bin/env node

/**
 * Continuous Validation Script
 * 
 * Provides ongoing monitoring and validation of the frontend application.
 * Runs periodic checks to ensure the application remains healthy and functional.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const PreBuildValidator = require('./pre-build-validation');
const DeploymentHealthChecker = require('./deployment-health-check');

class ContinuousValidator {
  constructor(options = {}) {
    this.interval = options.interval || 300000; // 5 minutes default
    this.maxFailures = options.maxFailures || 3;
    this.alertThreshold = options.alertThreshold || 2;
    this.projectRoot = path.resolve(__dirname, '..');
    this.isRunning = false;
    this.failureCount = 0;
    this.lastSuccessTime = null;
    this.validationHistory = [];
    this.watchers = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  // Start continuous validation
  start() {
    if (this.isRunning) {
      this.log('Continuous validation is already running');
      return;
    }

    this.isRunning = true;
    this.log('Starting continuous validation...');
    
    // Initial validation
    this.runValidationCycle();
    
    // Set up periodic validation
    this.validationTimer = setInterval(() => {
      this.runValidationCycle();
    }, this.interval);

    // Set up file watchers for critical files
    this.setupFileWatchers();

    // Handle graceful shutdown
    process.on('SIGINT', () => this.stop());
    process.on('SIGTERM', () => this.stop());
  }

  // Stop continuous validation
  stop() {
    if (!this.isRunning) {
      return;
    }

    this.log('Stopping continuous validation...');
    this.isRunning = false;

    if (this.validationTimer) {
      clearInterval(this.validationTimer);
    }

    // Clean up file watchers
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];

    this.generateFinalReport();
    process.exit(0);
  }

  // Set up file watchers for critical configuration files
  setupFileWatchers() {
    const criticalFiles = [
      'tsconfig.json',
      'next.config.js',
      'package.json',
      'src/lib/utils.ts',
      'src/lib/validation.ts'
    ];

    for (const file of criticalFiles) {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        try {
          const watcher = fs.watchFile(filePath, { interval: 5000 }, (curr, prev) => {
            if (curr.mtime !== prev.mtime) {
              this.log(`Critical file changed: ${file}`, 'warning');
              this.onCriticalFileChange(file);
            }
          });
          this.watchers.push({ close: () => fs.unwatchFile(filePath) });
        } catch (error) {
          this.log(`Failed to watch file ${file}: ${error.message}`, 'warning');
        }
      }
    }
  }

  // Handle critical file changes
  async onCriticalFileChange(file) {
    this.log(`Triggering validation due to change in ${file}`);
    
    // Wait a bit for file operations to complete
    await this.sleep(2000);
    
    // Run immediate validation
    await this.runValidationCycle();
  }

  // Run a complete validation cycle
  async runValidationCycle() {
    const cycleStart = Date.now();
    this.log('Running validation cycle...');

    const results = {
      timestamp: new Date().toISOString(),
      cycleId: this.generateCycleId(),
      duration: 0,
      status: 'UNKNOWN',
      checks: {}
    };

    try {
      // Run pre-build validation
      results.checks.preBuild = await this.runPreBuildValidation();
      
      // Run build test
      results.checks.build = await this.runBuildTest();
      
      // Run deployment health check (if deployment URL is available)
      if (process.env.DEPLOYMENT_URL) {
        results.checks.deployment = await this.runDeploymentHealthCheck();
      }

      // Run performance checks
      results.checks.performance = await this.runPerformanceChecks();

      // Determine overall status
      results.status = this.determineOverallStatus(results.checks);
      results.duration = Date.now() - cycleStart;

      // Update failure tracking
      if (results.status === 'FAILED') {
        this.failureCount++;
        this.log(`Validation cycle failed (${this.failureCount}/${this.maxFailures})`, 'error');
        
        if (this.failureCount >= this.alertThreshold) {
          this.sendAlert(results);
        }
        
        if (this.failureCount >= this.maxFailures) {
          this.log('Maximum failures reached. Stopping continuous validation.', 'error');
          this.stop();
          return;
        }
      } else {
        this.failureCount = 0;
        this.lastSuccessTime = new Date();
        this.log('Validation cycle completed successfully', 'success');
      }

      // Store results
      this.validationHistory.push(results);
      this.saveValidationResults(results);

    } catch (error) {
      results.status = 'ERROR';
      results.error = error.message;
      results.duration = Date.now() - cycleStart;
      
      this.log(`Validation cycle error: ${error.message}`, 'error');
      this.validationHistory.push(results);
    }
  }

  // Run pre-build validation
  async runPreBuildValidation() {
    try {
      const validator = new PreBuildValidator();
      
      // Capture validation results without exiting
      const originalExit = process.exit;
      let exitCode = 0;
      process.exit = (code) => { exitCode = code; };
      
      await validator.runValidation();
      
      process.exit = originalExit;
      
      return {
        status: exitCode === 0 ? 'PASSED' : 'FAILED',
        errors: validator.errors,
        warnings: validator.warnings
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  // Run build test
  async runBuildTest() {
    try {
      this.log('Testing build process...');
      
      const startTime = Date.now();
      execSync('npm run build', { 
        cwd: this.projectRoot,
        stdio: 'pipe'
      });
      const buildTime = Date.now() - startTime;

      return {
        status: 'PASSED',
        buildTime: buildTime,
        details: 'Build completed successfully'
      };
    } catch (error) {
      return {
        status: 'FAILED',
        error: error.message,
        details: 'Build process failed'
      };
    }
  }

  // Run deployment health check
  async runDeploymentHealthCheck() {
    try {
      const healthChecker = new DeploymentHealthChecker({
        baseUrl: process.env.DEPLOYMENT_URL,
        timeout: 15000,
        retries: 2
      });

      // Capture health check results without exiting
      const originalExit = process.exit;
      let exitCode = 0;
      process.exit = (code) => { exitCode = code; };
      
      await healthChecker.runHealthCheck();
      
      process.exit = originalExit;
      
      return {
        status: exitCode === 0 ? 'PASSED' : 'FAILED',
        results: healthChecker.results
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  // Run performance checks
  async runPerformanceChecks() {
    try {
      const performanceResults = {
        status: 'PASSED',
        metrics: {}
      };

      // Check bundle size
      const buildDir = path.join(this.projectRoot, '.next');
      if (fs.existsSync(buildDir)) {
        const bundleSize = this.calculateDirectorySize(buildDir);
        performanceResults.metrics.bundleSize = bundleSize;
        
        // Alert if bundle size is too large (>50MB)
        if (bundleSize > 50 * 1024 * 1024) {
          performanceResults.status = 'WARNING';
          performanceResults.warning = 'Bundle size is large';
        }
      }

      // Check memory usage
      const memUsage = process.memoryUsage();
      performanceResults.metrics.memoryUsage = memUsage;

      return performanceResults;
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message
      };
    }
  }

  // Calculate directory size recursively
  calculateDirectorySize(dirPath) {
    let totalSize = 0;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          totalSize += this.calculateDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    
    return totalSize;
  }

  // Determine overall status from individual checks
  determineOverallStatus(checks) {
    const statuses = Object.values(checks).map(check => check.status);
    
    if (statuses.includes('FAILED') || statuses.includes('ERROR')) {
      return 'FAILED';
    } else if (statuses.includes('WARNING')) {
      return 'WARNING';
    } else {
      return 'PASSED';
    }
  }

  // Send alert for failures
  sendAlert(results) {
    this.log(`ALERT: Validation failures detected (${this.failureCount}/${this.maxFailures})`, 'error');
    
    // In a real implementation, this would send notifications via:
    // - Email
    // - Slack
    // - Discord
    // - SMS
    // - Webhook
    
    const alertData = {
      timestamp: results.timestamp,
      failureCount: this.failureCount,
      maxFailures: this.maxFailures,
      lastSuccess: this.lastSuccessTime,
      results: results
    };

    // Save alert to file for now
    const alertPath = path.join(this.projectRoot, `alert-${Date.now()}.json`);
    fs.writeFileSync(alertPath, JSON.stringify(alertData, null, 2));
    
    this.log(`Alert saved to: ${alertPath}`);
  }

  // Save validation results
  saveValidationResults(results) {
    const resultsDir = path.join(this.projectRoot, 'validation-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const filename = `validation-${results.cycleId}.json`;
    const filepath = path.join(resultsDir, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));
  }

  // Generate final report
  generateFinalReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalCycles: this.validationHistory.length,
      successfulCycles: this.validationHistory.filter(r => r.status === 'PASSED').length,
      failedCycles: this.validationHistory.filter(r => r.status === 'FAILED').length,
      warningCycles: this.validationHistory.filter(r => r.status === 'WARNING').length,
      lastSuccessTime: this.lastSuccessTime,
      finalFailureCount: this.failureCount,
      history: this.validationHistory.slice(-10) // Last 10 cycles
    };

    const reportPath = path.join(this.projectRoot, 'continuous-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Final validation report saved to: ${reportPath}`);
  }

  // Generate unique cycle ID
  generateCycleId() {
    return `cycle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sleep utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run continuous validation if called directly
if (require.main === module) {
  const options = {
    interval: parseInt(process.argv[2]) || 300000, // 5 minutes default
    maxFailures: parseInt(process.argv[3]) || 3,
    alertThreshold: parseInt(process.argv[4]) || 2
  };

  const validator = new ContinuousValidator(options);
  validator.start();
}

module.exports = ContinuousValidator;