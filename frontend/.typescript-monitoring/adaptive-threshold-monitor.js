#!/usr/bin/env node

/**
 * Adaptive Threshold Monitor
 * Automatically adjusts thresholds based on changing performance patterns
 */

const fs = require('fs').promises;
const path = require('path');

class AdaptiveThresholdMonitor {
  constructor() {
    this.configPath = '.typescript-monitoring/monitoring-config.json';
    this.metricsPath = '.typescript-cache/performance-metrics.json';
    this.adaptiveLogPath = '.typescript-monitoring/adaptive-adjustments.log';
  }

  async runAdaptiveAdjustment() {
    console.log('🤖 Running adaptive threshold adjustment...');
    
    try {
      // Load current configuration
      const config = await this.loadConfiguration();
      
      // Analyze recent performance data
      const recentAnalysis = await this.analyzeRecentPerformance();
      
      // Calculate threshold adjustments
      const adjustments = this.calculateThresholdAdjustments(config, recentAnalysis);
      
      // Apply adjustments if significant
      if (this.shouldApplyAdjustments(adjustments)) {
        await this.applyThresholdAdjustments(config, adjustments);
        await this.logAdjustments(adjustments);
        console.log('✅ Adaptive thresholds adjusted');
      } else {
        console.log('ℹ️ No significant threshold adjustments needed');
      }
      
    } catch (error) {
      console.error('❌ Adaptive threshold adjustment failed:', error.message);
    }
  }

  async loadConfiguration() {
    const configData = await fs.readFile(this.configPath, 'utf8');
    return JSON.parse(configData);
  }

  async analyzeRecentPerformance() {
    const metricsData = await fs.readFile(this.metricsPath, 'utf8');
    const metrics = JSON.parse(metricsData);
    
    // Analyze last 7 days of data
    const recentMetrics = metrics.filter(m => {
      const metricDate = new Date(m.timestamp);
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return metricDate > weekAgo;
    });
    
    return {
      compilationTime: this.calculateStatistics(recentMetrics, 'compilationTime'),
      memoryUsage: this.calculateStatistics(recentMetrics, 'memoryUsage'),
      cacheHitRate: this.calculateStatistics(recentMetrics, 'cacheHitRate'),
      errorRate: this.calculateErrorStatistics(recentMetrics)
    };
  }

  calculateThresholdAdjustments(config, analysis) {
    const currentThresholds = config.alertThresholds;
    const maxAdjustment = config.adaptiveThresholds.maxAdjustment || 0.3;
    
    return {
      performanceThreshold: this.calculateAdjustment(
        currentThresholds.performanceThreshold,
        analysis.compilationTime.p90 / 1000 * 1.1,
        maxAdjustment
      ),
      memoryThreshold: this.calculateAdjustment(
        currentThresholds.memoryThreshold,
        analysis.memoryUsage.p90 / 1024 / 1024 * 1.2,
        maxAdjustment
      ),
      cacheHitRateThreshold: this.calculateAdjustment(
        currentThresholds.cacheHitRateThreshold,
        analysis.cacheHitRate.p25 * 0.9,
        maxAdjustment
      )
    };
  }

  calculateAdjustment(current, target, maxAdjustment) {
    const change = target - current;
    const maxChange = current * maxAdjustment;
    
    if (Math.abs(change) > maxChange) {
      return current + (change > 0 ? maxChange : -maxChange);
    }
    
    return target;
  }

  shouldApplyAdjustments(adjustments) {
    // Apply if any adjustment is more than 5%
    const threshold = 0.05;
    
    return Object.values(adjustments).some(adj => 
      Math.abs(adj.change) > adj.current * threshold
    );
  }

  async applyThresholdAdjustments(config, adjustments) {
    config.alertThresholds = {
      ...config.alertThresholds,
      ...adjustments
    };
    
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  async logAdjustments(adjustments) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      adjustments: adjustments,
      reason: 'adaptive_threshold_adjustment'
    };
    
    const logLine = JSON.stringify(logEntry) + '\n';
    await fs.appendFile(this.adaptiveLogPath, logLine);
  }

  calculateStatistics(data, field) {
    if (data.length === 0) return { mean: 0, p90: 0, p95: 0 };
    
    const values = data.map(d => d[field] || 0).sort((a, b) => a - b);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const p90 = values[Math.floor(values.length * 0.9)];
    const p95 = values[Math.floor(values.length * 0.95)];
    
    return { mean, p90, p95 };
  }

  calculateErrorStatistics(data) {
    if (data.length === 0) return { mean: 0, p90: 0, p95: 0 };
    
    const errorRates = data.map(d => {
      const errors = d.errorsFound || 0;
      const files = d.filesProcessed || 1;
      return errors / files;
    }).sort((a, b) => a - b);
    
    const mean = errorRates.reduce((sum, val) => sum + val, 0) / errorRates.length;
    const p90 = errorRates[Math.floor(errorRates.length * 0.9)];
    const p95 = errorRates[Math.floor(errorRates.length * 0.95)];
    
    return { mean, p90, p95 };
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new AdaptiveThresholdMonitor();
  monitor.runAdaptiveAdjustment();
}

module.exports = AdaptiveThresholdMonitor;
