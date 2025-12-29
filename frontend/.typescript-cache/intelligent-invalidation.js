#!/usr/bin/env node

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
      
      console.log(`✅ Invalidated ${invalidatedCount} cache entries`);
      
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
    return path.join(this.cacheDir, `${hash}.cache`);
  }
}

// Run if called directly
if (require.main === module) {
  const invalidation = new IntelligentCacheInvalidation();
  const changedFiles = process.argv.slice(2);
  invalidation.invalidateCache(changedFiles);
}

module.exports = IntelligentCacheInvalidation;
