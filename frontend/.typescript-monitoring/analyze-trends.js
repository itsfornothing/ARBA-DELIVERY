#!/usr/bin/env node

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
    console.log(`- Error trend: ${trends.errorTrend}`);
    console.log(`- Warning trend: ${trends.warningTrend}`);
    console.log(`- Performance trend: ${trends.performanceTrend}`);
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
