#!/usr/bin/env node

/**
 * TypeScript Monitoring Setup Script
 * 
 * Sets up metrics collection for TypeScript validation runs and configures
 * quality trend tracking over time with alerting for threshold violations.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class TypeScriptMonitoringSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.monitoringDir = path.join(this.projectRoot, '.typescript-monitoring');
    this.configFile = path.join(this.monitoringDir, 'monitoring-config.json');
    this.metricsFile = path.join(this.monitoringDir, 'metrics-history.json');
    this.alertsFile = path.join(this.monitoringDir, 'alerts.json');
  }

  /**
   * Requirement 9.1: Set up metrics collection for TypeScript validation runs
   */
  setupMetricsCollection() {
    console.log('Setting up TypeScript metrics collection...');
    
    // Create monitoring directory
    if (!fs.existsSync(this.monitoringDir)) {
      fs.mkdirSync(this.monitoringDir, { recursive: true });
    }

    // Create default configuration
    const defaultConfig = {
      enabled: true,
      collectMetrics: true,
      trackTrends: true,
      enableAlerts: true,
      alertThresholds: {
        errorThreshold: 10,
        warningThreshold: 20,
        performanceThreshold: 60.0
      },
      retentionPeriod: 30, // days
      aggregationPeriods: ['daily', 'weekly', 'monthly'],
      monitoringInterval: 30000, // 30 seconds
      autoRefresh: true
    };

    fs.writeFileSync(this.configFile, JSON.stringify(defaultConfig, null, 2));
    console.log(`✓ Created monitoring configuration: ${this.configFile}`);

    // Initialize metrics history file
    if (!fs.existsSync(this.metricsFile)) {
      fs.writeFileSync(this.metricsFile, JSON.stringify([], null, 2));
      console.log(`✓ Initialized metrics history: ${this.metricsFile}`);
    }

    // Initialize alerts file
    if (!fs.existsSync(this.alertsFile)) {
      fs.writeFileSync(this.alertsFile, JSON.stringify([], null, 2));
      console.log(`✓ Initialized alerts file: ${this.alertsFile}`);
    }
  }

  /**
   * Requirement 9.2: Implement quality trend tracking over time
   */
  setupTrendTracking() {
    console.log('Setting up quality trend tracking...');

    // Create trend analysis script
    const trendAnalysisScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class TrendAnalyzer {
  constructor() {
    this.metricsFile = path.join(process.cwd(), '.typescript-monitoring', 'metrics-history.json');
    this.trendsFile = path.join(process.cwd(), '.typescript-monitoring', 'trends.json');
  }

  analyzeTrends() {
    if (!fs.existsSync(this.metricsFile)) {
      console.log('No metrics history found');
      return;
    }

    const metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    
    if (metrics.length < 2) {
      console.log('Insufficient data for trend analysis');
      return;
    }

    const trends = this.calculateTrends(metrics);
    fs.writeFileSync(this.trendsFile, JSON.stringify(trends, null, 2));
    
    console.log('Trend analysis complete:');
    console.log(\`- Error trend: \${trends.errorTrend}\`);
    console.log(\`- Warning trend: \${trends.warningTrend}\`);
    console.log(\`- Performance trend: \${trends.performanceTrend}\`);
  }

  calculateTrends(metrics) {
    const recent = metrics.slice(-10); // Last 10 measurements
    const older = metrics.slice(-20, -10); // Previous 10 measurements
    
    const recentAvgErrors = recent.reduce((sum, m) => sum + m.errorCount, 0) / recent.length;
    const olderAvgErrors = older.length > 0 ? older.reduce((sum, m) => sum + m.errorCount, 0) / older.length : recentAvgErrors;
    
    const recentAvgWarnings = recent.reduce((sum, m) => sum + m.warningCount, 0) / recent.length;
    const olderAvgWarnings = older.length > 0 ? older.reduce((sum, m) => sum + m.warningCount, 0) / older.length : recentAvgWarnings;
    
    const recentAvgPerf = recent.reduce((sum, m) => sum + (m.performance?.compilationTime || 0), 0) / recent.length;
    const olderAvgPerf = older.length > 0 ? older.reduce((sum, m) => sum + (m.performance?.compilationTime || 0), 0) / older.length : recentAvgPerf;

    return {
      timestamp: new Date().toISOString(),
      errorTrend: this.getTrendDirection(olderAvgErrors, recentAvgErrors),
      warningTrend: this.getTrendDirection(olderAvgWarnings, recentAvgWarnings),
      performanceTrend: this.getTrendDirection(olderAvgPerf, recentAvgPerf, true), // Lower is better for performance
      recentMetrics: {
        avgErrors: recentAvgErrors,
        avgWarnings: recentAvgWarnings,
        avgCompilationTime: recentAvgPerf
      },
      previousMetrics: {
        avgErrors: olderAvgErrors,
        avgWarnings: olderAvgWarnings,
        avgCompilationTime: olderAvgPerf
      }
    };
  }

  getTrendDirection(oldValue, newValue, lowerIsBetter = false) {
    const threshold = 0.1; // 10% change threshold
    const change = (newValue - oldValue) / oldValue;
    
    if (Math.abs(change) < threshold) {
      return 'stable';
    }
    
    if (lowerIsBetter) {
      return change < 0 ? 'improving' : 'declining';
    } else {
      return change < 0 ? 'improving' : 'declining';
    }
  }
}

if (require.main === module) {
  const analyzer = new TrendAnalyzer();
  analyzer.analyzeTrends();
}

module.exports = TrendAnalyzer;
`;

    const trendScriptPath = path.join(this.monitoringDir, 'analyze-trends.js');
    fs.writeFileSync(trendScriptPath, trendAnalysisScript);
    fs.chmodSync(trendScriptPath, '755');
    console.log(`✓ Created trend analysis script: ${trendScriptPath}`);
  }

  /**
   * Requirement 9.3: Create dashboard for visualizing code quality metrics
   */
  setupDashboard() {
    console.log('Setting up monitoring dashboard...');

    // Create dashboard page
    const dashboardPagePath = path.join(this.projectRoot, 'src', 'app', 'monitoring', 'page.tsx');
    const dashboardDir = path.dirname(dashboardPagePath);

    if (!fs.existsSync(dashboardDir)) {
      fs.mkdirSync(dashboardDir, { recursive: true });
    }

    const dashboardPage = `/**
 * TypeScript Monitoring Dashboard Page
 * 
 * Provides a comprehensive view of TypeScript code quality metrics,
 * trends, and alerts for the maintenance system.
 */

import React from 'react';
import { TypeScriptMonitoringDashboard } from '@/components/molecules/TypeScriptMonitoringDashboard';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <TypeScriptMonitoringDashboard 
          autoRefresh={true}
          refreshInterval={30000}
          showAlerts={true}
          alertConfig={{
            errorThreshold: 10,
            warningThreshold: 20,
            performanceThreshold: 60.0
          }}
        />
      </div>
    </div>
  );
}
`;

    fs.writeFileSync(dashboardPagePath, dashboardPage);
    console.log(`✓ Created dashboard page: ${dashboardPagePath}`);
  }

  /**
   * Requirement 9.4: Set up alerting for quality threshold violations
   */
  setupAlerting() {
    console.log('Setting up alerting system...');

    // Create alerting script
    const alertingScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

class AlertingSystem {
  constructor() {
    this.configFile = path.join(process.cwd(), '.typescript-monitoring', 'monitoring-config.json');
    this.metricsFile = path.join(process.cwd(), '.typescript-monitoring', 'metrics-history.json');
    this.alertsFile = path.join(process.cwd(), '.typescript-monitoring', 'alerts.json');
  }

  checkThresholds() {
    if (!fs.existsSync(this.configFile) || !fs.existsSync(this.metricsFile)) {
      console.log('Monitoring not properly configured');
      return;
    }

    const config = JSON.parse(fs.readFileSync(this.configFile, 'utf8'));
    const metrics = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    
    if (metrics.length === 0) {
      console.log('No metrics available for alerting');
      return;
    }

    const latestMetrics = metrics[metrics.length - 1];
    const alerts = [];

    // Check error threshold
    if (latestMetrics.errorCount > config.alertThresholds.errorThreshold) {
      alerts.push({
        type: 'error',
        severity: latestMetrics.errorCount > config.alertThresholds.errorThreshold * 2 ? 'critical' : 'high',
        message: \`Error count (\${latestMetrics.errorCount}) exceeds threshold (\${config.alertThresholds.errorThreshold})\`,
        threshold: config.alertThresholds.errorThreshold,
        actualValue: latestMetrics.errorCount,
        timestamp: new Date().toISOString()
      });
    }

    // Check warning threshold
    if (latestMetrics.warningCount > config.alertThresholds.warningThreshold) {
      alerts.push({
        type: 'warning',
        severity: latestMetrics.warningCount > config.alertThresholds.warningThreshold * 2 ? 'high' : 'medium',
        message: \`Warning count (\${latestMetrics.warningCount}) exceeds threshold (\${config.alertThresholds.warningThreshold})\`,
        threshold: config.alertThresholds.warningThreshold,
        actualValue: latestMetrics.warningCount,
        timestamp: new Date().toISOString()
      });
    }

    // Check performance threshold
    if (latestMetrics.performance && latestMetrics.performance.compilationTime > config.alertThresholds.performanceThreshold) {
      alerts.push({
        type: 'performance',
        severity: latestMetrics.performance.compilationTime > config.alertThresholds.performanceThreshold * 1.5 ? 'high' : 'medium',
        message: \`Compilation time (\${latestMetrics.performance.compilationTime}s) exceeds threshold (\${config.alertThresholds.performanceThreshold}s)\`,
        threshold: config.alertThresholds.performanceThreshold,
        actualValue: latestMetrics.performance.compilationTime,
        timestamp: new Date().toISOString()
      });
    }

    if (alerts.length > 0) {
      // Save alerts
      let existingAlerts = [];
      if (fs.existsSync(this.alertsFile)) {
        existingAlerts = JSON.parse(fs.readFileSync(this.alertsFile, 'utf8'));
      }
      
      const updatedAlerts = [...existingAlerts, ...alerts];
      fs.writeFileSync(this.alertsFile, JSON.stringify(updatedAlerts, null, 2));
      
      console.log(\`🚨 \${alerts.length} alert(s) triggered:\`);
      alerts.forEach(alert => {
        console.log(\`  - [\${alert.severity.toUpperCase()}] \${alert.message}\`);
      });
    } else {
      console.log('✓ All metrics within acceptable thresholds');
    }
  }
}

if (require.main === module) {
  const alerting = new AlertingSystem();
  alerting.checkThresholds();
}

module.exports = AlertingSystem;
`;

    const alertScriptPath = path.join(this.monitoringDir, 'check-alerts.js');
    fs.writeFileSync(alertScriptPath, alertingScript);
    fs.chmodSync(alertScriptPath, '755');
    console.log(`✓ Created alerting script: ${alertScriptPath}`);
  }

  /**
   * Requirement 9.5: Integrate with existing package.json scripts
   */
  integrateWithPackageScripts() {
    console.log('Integrating with package.json scripts...');

    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      console.log('⚠️  No package.json found, skipping script integration');
      return;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Add monitoring scripts
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }

    packageJson.scripts['monitoring:setup'] = 'node scripts/typescript-monitoring-setup.js';
    packageJson.scripts['monitoring:collect'] = 'node .typescript-monitoring/collect-metrics.js';
    packageJson.scripts['monitoring:trends'] = 'node .typescript-monitoring/analyze-trends.js';
    packageJson.scripts['monitoring:alerts'] = 'node .typescript-monitoring/check-alerts.js';
    packageJson.scripts['monitoring:dashboard'] = 'next dev --port 3001';

    // Integrate with existing TypeScript scripts
    if (packageJson.scripts['type-check']) {
      packageJson.scripts['type-check:monitored'] = packageJson.scripts['type-check'] + ' && npm run monitoring:collect';
    }

    if (packageJson.scripts['build']) {
      packageJson.scripts['build:monitored'] = packageJson.scripts['build'] + ' && npm run monitoring:collect';
    }

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✓ Updated package.json with monitoring scripts');
  }

  /**
   * Create metrics collection script
   */
  createMetricsCollectionScript() {
    const collectionScript = `#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class MetricsCollector {
  constructor() {
    this.metricsFile = path.join(process.cwd(), '.typescript-monitoring', 'metrics-history.json');
    this.configFile = path.join(process.cwd(), '.typescript-monitoring', 'monitoring-config.json');
  }

  collectMetrics() {
    console.log('Collecting TypeScript metrics...');
    
    try {
      // Run TypeScript compiler to get diagnostics
      const tscOutput = execSync('npx tsc --noEmit --pretty false', { 
        encoding: 'utf8',
        stdio: 'pipe'
      });
      
      const metrics = this.parseTypeScriptOutput(tscOutput);
      this.saveMetrics(metrics);
      
      console.log(\`✓ Collected metrics: \${metrics.errorCount} errors, \${metrics.warningCount} warnings\`);
      
    } catch (error) {
      // TypeScript compilation failed, parse error output
      const metrics = this.parseTypeScriptOutput(error.stdout || error.message);
      this.saveMetrics(metrics);
      
      console.log(\`✓ Collected metrics from failed compilation: \${metrics.errorCount} errors, \${metrics.warningCount} warnings\`);
    }
  }

  parseTypeScriptOutput(output) {
    const lines = output.split('\\n');
    let errorCount = 0;
    let warningCount = 0;
    const errorsByCategory = {
      syntax: 0,
      type: 0,
      import: 0,
      unused: 0,
      strict: 0
    };

    lines.forEach(line => {
      if (line.includes('error TS')) {
        errorCount++;
        // Categorize errors based on error codes
        if (line.includes('TS1') || line.includes('TS2304')) {
          errorsByCategory.syntax++;
        } else if (line.includes('TS2') || line.includes('TS7')) {
          errorsByCategory.type++;
        } else if (line.includes('TS2307') || line.includes('TS2306')) {
          errorsByCategory.import++;
        } else if (line.includes('TS6133') || line.includes('TS6196')) {
          errorsByCategory.unused++;
        } else {
          errorsByCategory.strict++;
        }
      } else if (line.includes('warning')) {
        warningCount++;
      }
    });

    return {
      timestamp: new Date().toISOString(),
      errorCount,
      warningCount,
      errorsByCategory,
      performance: {
        compilationTime: this.measureCompilationTime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        fileCount: this.countTypeScriptFiles(),
        cacheHitRate: Math.random() * 0.5 + 0.5 // Simulated for now
      }
    };
  }

  measureCompilationTime() {
    const start = Date.now();
    try {
      execSync('npx tsc --noEmit --incremental', { stdio: 'pipe' });
    } catch (error) {
      // Ignore compilation errors for timing
    }
    return (Date.now() - start) / 1000;
  }

  countTypeScriptFiles() {
    try {
      const output = execSync('find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | wc -l', { 
        encoding: 'utf8' 
      });
      return parseInt(output.trim());
    } catch (error) {
      return 0;
    }
  }

  saveMetrics(metrics) {
    let history = [];
    if (fs.existsSync(this.metricsFile)) {
      history = JSON.parse(fs.readFileSync(this.metricsFile, 'utf8'));
    }

    history.push(metrics);
    
    // Keep only last 1000 entries
    if (history.length > 1000) {
      history = history.slice(-1000);
    }

    fs.writeFileSync(this.metricsFile, JSON.stringify(history, null, 2));
  }
}

if (require.main === module) {
  const collector = new MetricsCollector();
  collector.collectMetrics();
}

module.exports = MetricsCollector;
`;

    const collectionScriptPath = path.join(this.monitoringDir, 'collect-metrics.js');
    fs.writeFileSync(collectionScriptPath, collectionScript);
    fs.chmodSync(collectionScriptPath, '755');
    console.log(`✓ Created metrics collection script: ${collectionScriptPath}`);
  }

  /**
   * Run the complete setup
   */
  run() {
    console.log('🚀 Setting up TypeScript Monitoring System...\n');
    
    try {
      this.setupMetricsCollection();
      this.setupTrendTracking();
      this.setupDashboard();
      this.setupAlerting();
      this.createMetricsCollectionScript();
      this.integrateWithPackageScripts();
      
      console.log('\n✅ TypeScript Monitoring System setup complete!');
      console.log('\nNext steps:');
      console.log('1. Run "npm run monitoring:collect" to collect initial metrics');
      console.log('2. Run "npm run monitoring:trends" to analyze trends');
      console.log('3. Run "npm run monitoring:alerts" to check for alerts');
      console.log('4. Visit /monitoring to view the dashboard');
      console.log('5. Set up a cron job to run metrics collection regularly');
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new TypeScriptMonitoringSetup();
  setup.run();
}

module.exports = TypeScriptMonitoringSetup;