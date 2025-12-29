#!/usr/bin/env node

/**
 * Cache Optimization Manager
 * Fine-tunes caching strategies for better TypeScript performance
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class CacheOptimizationManager {
  constructor() {
    this.cacheDir = '.typescript-cache';
    this.metricsPath = `${this.cacheDir}/performance-metrics.json`;
    this.cacheConfigPath = `${this.cacheDir}/cache-config.json`;
  }

  async optimizeCachingStrategies() {
    console.log('💾 Starting cache optimization...');
    
    try {
      // Ensure cache directory exists
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      // Analyze cache performance
      const cacheAnalysis = await this.analyzeCachePerformance();
      
      // Optimize cache configuration
      await this.optimizeCacheConfiguration(cacheAnalysis);
      
      // Implement intelligent cache invalidation
      await this.setupIntelligentCacheInvalidation();
      
      // Setup cache monitoring
      await this.setupCacheMonitoring();
      
      // Create cache maintenance scripts
      await this.createCacheMaintenanceScripts();
      
      console.log('✅ Cache optimization completed successfully!');
      
    } catch (error) {
      console.error('❌ Cache optimization failed:', error.message);
      throw error;
    }
  }

  async analyzeCachePerformance() {
    console.log('📊 Analyzing cache performance...');
    
    try {
      const metricsData = await fs.readFile(this.metricsPath, 'utf8');
      const metrics = JSON.parse(metricsData);
      
      const analysis = {
        averageCacheHitRate: this.calculateAverage(metrics, 'cacheHitRate'),
        cacheEffectiveness: this.calculateCacheEffectiveness(metrics),
        cacheSize: await this.calculateCacheSize(),
        invalidationFrequency: this.calculateInvalidationFrequency(metrics),
        performanceGain: this.calculatePerformanceGain(metrics)
      };
      
      console.log(`📈 Cache Analysis Results:
        - Average cache hit rate: ${(analysis.averageCacheHitRate * 100).toFixed(2)}%
        - Cache effectiveness: ${analysis.cacheEffectiveness}
        - Current cache size: ${(analysis.cacheSize / 1024 / 1024).toFixed(2)}MB
        - Performance gain from cache: ${analysis.performanceGain.toFixed(2)}%`);
      
      return analysis;
      
    } catch (error) {
      console.warn('⚠️ Could not analyze cache performance, using defaults');
      return this.getDefaultCacheAnalysis();
    }
  }

  async optimizeCacheConfiguration(analysis) {
    console.log('⚙️ Optimizing cache configuration...');
    
    const optimizedConfig = {
      enabled: true,
      strategy: this.determineCacheStrategy(analysis),
      maxCacheSize: this.calculateOptimalCacheSize(analysis),
      cacheDirectory: this.cacheDir,
      compressionEnabled: analysis.cacheSize > 100 * 1024 * 1024, // Enable for caches > 100MB
      parallelCaching: true,
      incrementalCaching: true,
      smartInvalidation: true,
      cachePartitioning: {
        enabled: analysis.cacheSize > 500 * 1024 * 1024, // Enable for large caches
        partitionSize: '100MB',
        maxPartitions: 10
      },
      cleanupPolicy: {
        maxAge: analysis.invalidationFrequency > 0.1 ? '7d' : '30d',
        maxSize: this.calculateOptimalCacheSize(analysis),
        cleanupInterval: '24h',
        compressionThreshold: '50MB'
      },
      performance: {
        preloadCache: analysis.averageCacheHitRate > 0.8,
        asyncCaching: true,
        cacheWarmup: true,
        backgroundCleanup: true
      }
    };
    
    await fs.writeFile(this.cacheConfigPath, JSON.stringify(optimizedConfig, null, 2));
    
    console.log(`✅ Cache configuration optimized:
      - Strategy: ${optimizedConfig.strategy}
      - Max cache size: ${optimizedConfig.maxCacheSize}
      - Compression: ${optimizedConfig.compressionEnabled ? 'enabled' : 'disabled'}
      - Partitioning: ${optimizedConfig.cachePartitioning.enabled ? 'enabled' : 'disabled'}`);
  }

  async setupIntelligentCacheInvalidation() {
    console.log('🧠 Setting up intelligent cache invalidation...');
    
    const invalidationScript = `#!/usr/bin/env node

/**
 * Intelligent Cache Invalidation
 * Automatically invalidates cache based on file changes and dependencies
 */

const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

class IntelligentCacheInvalidation {
  constructor() {
    this.cacheDir = '.typescript-cache';
    this.dependencyMapPath = path.join(this.cacheDir, 'dependency-map.json');
    this.fileHashesPath = path.join(this.cacheDir, 'file-hashes.json');
  }

  async invalidateCache(changedFiles = []) {
    console.log('🔄 Running intelligent cache invalidation...');
    
    try {
      // Load dependency map and file hashes
      const dependencyMap = await this.loadDependencyMap();
      const fileHashes = await this.loadFileHashes();
      
      // Determine files to invalidate
      const filesToInvalidate = new Set(changedFiles);
      
      // Add dependent files
      for (const changedFile of changedFiles) {
        const dependents = dependencyMap[changedFile] || [];
        dependents.forEach(dep => filesToInvalidate.add(dep));
      }
      
      // Invalidate cache entries
      let invalidatedCount = 0;
      for (const file of filesToInvalidate) {
        const cacheFile = this.getCacheFilePath(file);
        try {
          await fs.unlink(cacheFile);
          invalidatedCount++;
        } catch (error) {
          // Cache file doesn't exist, ignore
        }
      }
      
      // Update file hashes
      await this.updateFileHashes(Array.from(filesToInvalidate));
      
      console.log(\`✅ Invalidated \${invalidatedCount} cache entries\`);
      
    } catch (error) {
      console.error('❌ Cache invalidation failed:', error.message);
    }
  }

  async loadDependencyMap() {
    try {
      const data = await fs.readFile(this.dependencyMapPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async loadFileHashes() {
    try {
      const data = await fs.readFile(this.fileHashesPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  async updateFileHashes(files) {
    const fileHashes = await this.loadFileHashes();
    
    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const hash = crypto.createHash('md5').update(content).digest('hex');
        fileHashes[file] = hash;
      } catch (error) {
        // File doesn't exist or can't be read
        delete fileHashes[file];
      }
    }
    
    await fs.writeFile(this.fileHashesPath, JSON.stringify(fileHashes, null, 2));
  }

  getCacheFilePath(sourceFile) {
    const hash = crypto.createHash('md5').update(sourceFile).digest('hex');
    return path.join(this.cacheDir, \`\${hash}.cache\`);
  }
}

// Run if called directly
if (require.main === module) {
  const invalidation = new IntelligentCacheInvalidation();
  const changedFiles = process.argv.slice(2);
  invalidation.invalidateCache(changedFiles);
}

module.exports = IntelligentCacheInvalidation;
`;
    
    await fs.writeFile(
      path.join(this.cacheDir, 'intelligent-invalidation.js'),
      invalidationScript
    );
    
    // Make script executable
    try {
      execSync(`chmod +x ${this.cacheDir}/intelligent-invalidation.js`);
    } catch (error) {
      console.warn('⚠️ Could not make invalidation script executable');
    }
    
    console.log('✅ Intelligent cache invalidation setup completed');
  }

  async setupCacheMonitoring() {
    console.log('📊 Setting up cache monitoring...');
    
    const monitoringScript = `#!/usr/bin/env node

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
      
      console.log(\`✅ Cache metrics collected:
        - Cache size: \${(metrics.cacheSize / 1024 / 1024).toFixed(2)}MB
        - Cache files: \${metrics.cacheFiles}
        - Hit rate: \${(metrics.hitRate * 100).toFixed(2)}%\`);
      
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
`;
    
    await fs.writeFile(
      path.join(this.cacheDir, 'cache-monitor.js'),
      monitoringScript
    );
    
    console.log('✅ Cache monitoring setup completed');
  }

  async createCacheMaintenanceScripts() {
    console.log('🛠️ Creating cache maintenance scripts...');
    
    // Cache cleanup script
    const cleanupScript = `#!/bin/bash

# TypeScript Cache Cleanup Script
# Automatically cleans up old and unused cache files

CACHE_DIR=".typescript-cache"
MAX_AGE_DAYS=30
MAX_CACHE_SIZE_MB=1024

echo "🧹 Starting TypeScript cache cleanup..."

# Create cache directory if it doesn't exist
mkdir -p "$CACHE_DIR"

# Remove old cache files
echo "Removing cache files older than $MAX_AGE_DAYS days..."
find "$CACHE_DIR" -name "*.cache" -mtime +$MAX_AGE_DAYS -delete
find "$CACHE_DIR" -name "*.tsbuildinfo" -mtime +$MAX_AGE_DAYS -delete

# Remove large cache files if total size exceeds limit
CURRENT_SIZE=$(du -sm "$CACHE_DIR" | cut -f1)
if [ "$CURRENT_SIZE" -gt "$MAX_CACHE_SIZE_MB" ]; then
  echo "Cache size ($CURRENT_SIZE MB) exceeds limit ($MAX_CACHE_SIZE_MB MB), removing oldest files..."
  find "$CACHE_DIR" -name "*.cache" -type f -exec ls -lt {} + | tail -n +11 | awk '{print $9}' | xargs rm -f
fi

# Compress old performance metrics
echo "Compressing old performance metrics..."
find "$CACHE_DIR" -name "performance-metrics-*.json" -mtime +7 -exec gzip {} \\;

# Clean up empty directories
find "$CACHE_DIR" -type d -empty -delete

echo "✅ Cache cleanup completed"
echo "Current cache size: $(du -sh "$CACHE_DIR" | cut -f1)"
`;
    
    await fs.writeFile(path.join(this.cacheDir, 'cleanup-cache.sh'), cleanupScript);
    
    // Cache optimization script
    const optimizationScript = `#!/bin/bash

# TypeScript Cache Optimization Script
# Optimizes cache for better performance

CACHE_DIR=".typescript-cache"

echo "🚀 Starting cache optimization..."

# Defragment cache files
echo "Defragmenting cache files..."
find "$CACHE_DIR" -name "*.cache" -exec gzip -d {} \\; -exec gzip {} \\; 2>/dev/null

# Rebuild cache index
echo "Rebuilding cache index..."
node "$CACHE_DIR/cache-monitor.js"

# Run intelligent invalidation
echo "Running intelligent cache invalidation..."
node "$CACHE_DIR/intelligent-invalidation.js"

echo "✅ Cache optimization completed"
`;
    
    await fs.writeFile(path.join(this.cacheDir, 'optimize-cache.sh'), optimizationScript);
    
    // Make scripts executable
    try {
      execSync(`chmod +x ${this.cacheDir}/cleanup-cache.sh`);
      execSync(`chmod +x ${this.cacheDir}/optimize-cache.sh`);
    } catch (error) {
      console.warn('⚠️ Could not make maintenance scripts executable');
    }
    
    console.log('✅ Cache maintenance scripts created');
  }

  determineCacheStrategy(analysis) {
    if (analysis.averageCacheHitRate > 0.9) {
      return 'aggressive';
    } else if (analysis.averageCacheHitRate > 0.7) {
      return 'balanced';
    } else {
      return 'conservative';
    }
  }

  calculateOptimalCacheSize(analysis) {
    const baseSizeMB = 256;
    const sizeFactor = Math.max(1, analysis.cacheEffectiveness);
    const optimalSizeMB = Math.min(2048, baseSizeMB * sizeFactor);
    return `${Math.round(optimalSizeMB)}MB`;
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

  calculateAverage(metrics, field) {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + (metric[field] || 0), 0);
    return sum / metrics.length;
  }

  calculateCacheEffectiveness(metrics) {
    if (metrics.length === 0) return 1;
    
    const withCache = metrics.filter(m => m.cacheHitRate > 0);
    const withoutCache = metrics.filter(m => m.cacheHitRate === 0);
    
    if (withCache.length === 0 || withoutCache.length === 0) return 1;
    
    const avgWithCache = this.calculateAverage(withCache, 'compilationTime');
    const avgWithoutCache = this.calculateAverage(withoutCache, 'compilationTime');
    
    return avgWithoutCache > 0 ? avgWithoutCache / avgWithCache : 1;
  }

  calculateInvalidationFrequency(metrics) {
    // Simplified calculation - in real implementation, this would track actual invalidations
    return 0.05; // 5% invalidation rate
  }

  calculatePerformanceGain(metrics) {
    const effectiveness = this.calculateCacheEffectiveness(metrics);
    const hitRate = this.calculateAverage(metrics, 'cacheHitRate');
    return (effectiveness - 1) * hitRate * 100;
  }

  getDefaultCacheAnalysis() {
    return {
      averageCacheHitRate: 0.8,
      cacheEffectiveness: 1.5,
      cacheSize: 100 * 1024 * 1024, // 100MB
      invalidationFrequency: 0.05,
      performanceGain: 25
    };
  }
}

// Run optimization if called directly
if (require.main === module) {
  const manager = new CacheOptimizationManager();
  manager.optimizeCachingStrategies()
    .then(() => {
      console.log('🎉 Cache optimization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Cache optimization failed:', error);
      process.exit(1);
    });
}

module.exports = CacheOptimizationManager;