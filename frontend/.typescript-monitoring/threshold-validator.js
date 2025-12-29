#!/usr/bin/env node

/**
 * Threshold Validation System
 * Validates that monitoring thresholds are appropriate and effective
 */

const fs = require('fs').promises;

class ThresholdValidationSystem {
  constructor() {
    this.configPath = '.typescript-monitoring/monitoring-config.json';
    this.metricsPath = '.typescript-cache/performance-metrics.json';
    this.alertsPath = '.typescript-monitoring/alerts.json';
  }

  async validateThresholds() {
    console.log('✅ Validating monitoring thresholds...');
    
    try {
      const config = await this.loadConfiguration();
      const metrics = await this.loadMetrics();
      const alerts = await this.loadAlerts();
      
      const validation = {
        effectiveness: this.validateEffectiveness(config, metrics, alerts),
        sensitivity: this.validateSensitivity(config, metrics, alerts),
        coverage: this.validateCoverage(config, metrics),
        recommendations: []
      };
      
      // Generate recommendations
      validation.recommendations = this.generateRecommendations(validation);
      
      // Save validation report
      await this.saveValidationReport(validation);
      
      console.log(`✅ Threshold validation completed:
        - Effectiveness: ${validation.effectiveness.score.toFixed(2)}
        - Sensitivity: ${validation.sensitivity.score.toFixed(2)}
        - Coverage: ${validation.coverage.score.toFixed(2)}
        - Recommendations: ${validation.recommendations.length}`);
      
      return validation;
      
    } catch (error) {
      console.error('❌ Threshold validation failed:', error.message);
      throw error;
    }
  }

  validateEffectiveness(config, metrics, alerts) {
    // Measure how well thresholds catch actual issues
    const falsePositives = alerts.filter(a => a.severity === 'false_positive').length;
    const truePositives = alerts.filter(a => a.severity === 'true_positive').length;
    const totalAlerts = alerts.length;
    
    const effectiveness = totalAlerts > 0 ? truePositives / totalAlerts : 1;
    
    return {
      score: effectiveness,
      falsePositives,
      truePositives,
      totalAlerts
    };
  }

  validateSensitivity(config, metrics, alerts) {
    // Measure how quickly thresholds detect issues
    const avgDetectionTime = alerts.reduce((sum, alert) => {
      return sum + (alert.detectionTime || 0);
    }, 0) / alerts.length;
    
    const sensitivity = Math.max(0, 1 - (avgDetectionTime / 3600000)); // Normalize to hours
    
    return {
      score: sensitivity,
      avgDetectionTime
    };
  }

  validateCoverage(config, metrics) {
    // Measure how well thresholds cover different scenarios
    const scenarios = ['high_load', 'memory_pressure', 'cache_miss', 'error_spike'];
    const coveredScenarios = scenarios.filter(scenario => 
      this.isScenarioCovered(scenario, config, metrics)
    );
    
    const coverage = coveredScenarios.length / scenarios.length;
    
    return {
      score: coverage,
      coveredScenarios,
      totalScenarios: scenarios.length
    };
  }

  isScenarioCovered(scenario, config, metrics) {
    // Simplified scenario coverage check
    switch (scenario) {
      case 'high_load':
        return config.alertThresholds.performanceThreshold > 0;
      case 'memory_pressure':
        return config.alertThresholds.memoryThreshold > 0;
      case 'cache_miss':
        return config.alertThresholds.cacheHitRateThreshold > 0;
      case 'error_spike':
        return config.alertThresholds.errorThreshold > 0;
      default:
        return false;
    }
  }

  generateRecommendations(validation) {
    const recommendations = [];
    
    if (validation.effectiveness.score < 0.8) {
      recommendations.push({
        type: 'effectiveness',
        message: 'Consider adjusting thresholds to reduce false positives',
        priority: 'high'
      });
    }
    
    if (validation.sensitivity.score < 0.7) {
      recommendations.push({
        type: 'sensitivity',
        message: 'Consider lowering thresholds for faster issue detection',
        priority: 'medium'
      });
    }
    
    if (validation.coverage.score < 0.9) {
      recommendations.push({
        type: 'coverage',
        message: 'Consider adding thresholds for uncovered scenarios',
        priority: 'low'
      });
    }
    
    return recommendations;
  }

  async loadConfiguration() {
    const configData = await fs.readFile(this.configPath, 'utf8');
    return JSON.parse(configData);
  }

  async loadMetrics() {
    try {
      const metricsData = await fs.readFile(this.metricsPath, 'utf8');
      return JSON.parse(metricsData);
    } catch (error) {
      return [];
    }
  }

  async loadAlerts() {
    try {
      const alertsData = await fs.readFile(this.alertsPath, 'utf8');
      return JSON.parse(alertsData);
    } catch (error) {
      return [];
    }
  }

  async saveValidationReport(validation) {
    const report = {
      timestamp: new Date().toISOString(),
      validation,
      version: '1.0.0'
    };
    
    await fs.writeFile(
      '.typescript-monitoring/threshold-validation-report.json',
      JSON.stringify(report, null, 2)
    );
  }
}

// Run if called directly
if (require.main === module) {
  const validator = new ThresholdValidationSystem();
  validator.validateThresholds()
    .then(() => console.log('✅ Threshold validation completed'))
    .catch(error => console.error('❌ Threshold validation failed:', error));
}

module.exports = ThresholdValidationSystem;
