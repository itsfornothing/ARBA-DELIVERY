#!/usr/bin/env node

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
        message: `Error count (${latestMetrics.errorCount}) exceeds threshold (${config.alertThresholds.errorThreshold})`,
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
        message: `Warning count (${latestMetrics.warningCount}) exceeds threshold (${config.alertThresholds.warningThreshold})`,
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
        message: `Compilation time (${latestMetrics.performance.compilationTime}s) exceeds threshold (${config.alertThresholds.performanceThreshold}s)`,
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
      
      console.log(`🚨 ${alerts.length} alert(s) triggered:`);
      alerts.forEach(alert => {
        console.log(`  - [${alert.severity.toUpperCase()}] ${alert.message}`);
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
