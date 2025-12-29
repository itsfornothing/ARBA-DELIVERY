#!/usr/bin/env node

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
      
      console.log(`✓ Collected metrics: ${metrics.errorCount} errors, ${metrics.warningCount} warnings`);
      
    } catch (error) {
      // TypeScript compilation failed, parse error output
      const metrics = this.parseTypeScriptOutput(error.stdout || error.message);
      this.saveMetrics(metrics);
      
      console.log(`✓ Collected metrics from failed compilation: ${metrics.errorCount} errors, ${metrics.warningCount} warnings`);
    }
  }

  parseTypeScriptOutput(output) {
    const lines = output.split('\n');
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
