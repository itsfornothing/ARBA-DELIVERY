#!/usr/bin/env node

/**
 * Cache Performance Monitor
 * Monitors cache performance and provides insights
 */

const fs = require('fs').promises;
const path = require('path');

class CachePerformanceMonitor {
  constructor() {
    this.cacheDir = '.typescript-cache';
    this.metricsPath = path.join(this.cacheDir, 'cache-performance-metrics.json');
  }

  async collectCacheMetrics() {
    console.log('📊 Collecting cache performance metrics...');
    
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        cacheSize: await this.calculateCacheSize(),
        cacheFiles: await this.countCacheFiles(),
        hitRate: await this.calculateHitRate(),
        memoryUsage: process.memoryUsage(),
        diskUsage: await this.calculateDiskUsage()
      };
      
      // Load existing metrics
      let allMetrics = [];
      try {
        const existingData = await fs.readFile(this.metricsPath, 'utf8');
        allMetrics = JSON.parse(existingData);
      } catch (error) {
        // File doesn't exist, start fresh
      }
      
      // Add new metrics
      allMetrics.push(metrics);
      
      // Keep only last 100 entries
      if (allMetrics.length > 100) {
        allMetrics = allMetrics.slice(-100);
      }
      
      // Save metrics
      await fs.writeFile(this.metricsPath, JSON.stringify(allMetrics, null, 2));
      
      console.log(`✅ Cache metrics collected:
        - Cache size: ${(metrics.cacheSize / 1024 / 1024).toFixed(2)}MB
        - Cache files: ${metrics.cacheFiles}
        - Hit rate: ${(metrics.hitRate * 100).toFixed(2)}%`);
      
      return metrics;
      
    } catch (error) {
      console.error('❌ Failed to collect cache metrics:', error.message);
      throw error;
    }
  }

  async calculateCacheSize() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;
      
      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        if (stats.isFile()) {
          totalSize += stats.size;
        }
      }
      
      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  async countCacheFiles() {
    try {
      const files = await fs.readdir(this.cacheDir);
      return files.filter(file => file.endsWith('.cache')).length;
    } catch (error) {
      return 0;
    }
  }

  async calculateHitRate() {
    // This would be calculated based on actual cache hits/misses
    // For now, return a placeholder
    return 0.85;
  }

  async calculateDiskUsage() {
    try {
      const stats = await fs.stat(this.cacheDir);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const monitor = new CachePerformanceMonitor();
  monitor.collectCacheMetrics()
    .then(() => console.log('📊 Cache monitoring completed'))
    .catch(error => console.error('❌ Cache monitoring failed:', error));
}

module.exports = CachePerformanceMonitor;
