#!/usr/bin/env node

/**
 * CI/CD Performance Monitor
 * Monitors CI/CD pipeline performance and provides insights
 */

const fs = require('fs').promises;
const path = require('path');

class CICDPerformanceMonitor {
  constructor() {
    this.metricsPath = '.typescript-cache/cicd-performance-metrics.json';
  }

  async collectCICDMetrics() {
    console.log('📊 Collecting CI/CD performance metrics...');
    
    const startTime = Date.now();
    
    try {
      // Collect system metrics
      const systemMetrics = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      };
      
      // Collect build metrics
      const buildMetrics = await this.collectBuildMetrics();
      
      // Collect cache metrics
      const cacheMetrics = await this.collectCacheMetrics();
      
      const metrics = {
        ...systemMetrics,
        build: buildMetrics,
        cache: cacheMetrics,
        collectionTime: Date.now() - startTime
      };
      
      // Save metrics
      await this.saveMetrics(metrics);
      
      console.log(`✅ CI/CD metrics collected in ${metrics.collectionTime}ms`);
      
      return metrics;
      
    } catch (error) {
      console.error('❌ Failed to collect CI/CD metrics:', error.message);
      throw error;
    }
  }

  async collectBuildMetrics() {
    // This would collect actual build metrics in a real implementation
    return {
      compilationTime: 0,
      lintTime: 0,
      testTime: 0,
      totalTime: 0
    };
  }

  async collectCacheMetrics() {
    try {
      const cacheDir = '.typescript-cache';
      const files = await fs.readdir(cacheDir);
      
      let totalSize = 0;
      let fileCount = 0;
      
      for (const file of files) {
        const filePath = path.join(cacheDir, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
          fileCount++;
        }
      }
      
      return {
        totalSize,
        fileCount,
        hitRate: 0.85 // Placeholder
      };
      
    } catch (error) {
      return {
        totalSize: 0,
        fileCount: 0,
        hitRate: 0
      };
    }
  }

  async saveMetrics(metrics) {
    let allMetrics = [];
    
    try {
      const existingData = await fs.readFile(this.metricsPath, 'utf8');
      allMetrics = JSON.parse(existingData);
    } catch (error) {
      // File doesn't exist, start fresh
    }
    
    allMetrics.push(metrics);
    
    // Keep only last 100 entries
    if (allMetrics.length > 100) {
      allMetrics = allMetrics.slice(-100);
    }
    
    await fs.writeFile(this.metricsPath, JSON.stringify(allMetrics, null, 2));
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new CICDPerformanceMonitor();
  monitor.collectCICDMetrics()
    .then(() => console.log('📊 CI/CD performance monitoring completed'))
    .catch(error => console.error('❌ CI/CD monitoring failed:', error));
}

module.exports = CICDPerformanceMonitor;
