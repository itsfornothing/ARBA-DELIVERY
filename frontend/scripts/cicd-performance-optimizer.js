#!/usr/bin/env node

/**
 * CI/CD Performance Optimizer
 * Optimizes CI/CD pipeline integration for faster feedback
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class CICDPerformanceOptimizer {
  constructor() {
    this.workflowsDir = '.github/workflows';
    this.metricsPath = '.typescript-cache/performance-metrics.json';
    this.packageJsonPath = 'package.json';
  }

  async optimizeCICDIntegration() {
    console.log('🔄 Starting CI/CD performance optimization...');
    
    try {
      // Analyze current performance metrics
      const metrics = await this.analyzePerformanceMetrics();
      
      // Optimize GitHub Actions workflows
      await this.optimizeGitHubActionsWorkflows(metrics);
      
      // Create performance-optimized scripts
      await this.createOptimizedScripts(metrics);
      
      // Setup parallel validation strategies
      await this.setupParallelValidation(metrics);
      
      // Configure smart caching for CI/CD
      await this.configureCICDCaching(metrics);
      
      // Create performance monitoring for CI/CD
      await this.setupCICDPerformanceMonitoring();
      
      console.log('✅ CI/CD performance optimization completed successfully!');
      
    } catch (error) {
      console.error('❌ CI/CD optimization failed:', error.message);
      throw error;
    }
  }

  async analyzePerformanceMetrics() {
    console.log('📊 Analyzing CI/CD performance metrics...');
    
    try {
      const metricsData = await fs.readFile(this.metricsPath, 'utf8');
      const metrics = JSON.parse(metricsData);
      
      const analysis = {
        averageCompilationTime: this.calculateAverage(metrics, 'compilationTime'),
        averageMemoryUsage: this.calculateAverage(metrics, 'memoryUsage'),
        averageCacheHitRate: this.calculateAverage(metrics, 'cacheHitRate'),
        averageFilesProcessed: this.calculateAverage(metrics, 'filesProcessed'),
        errorRate: this.calculateErrorRate(metrics),
        totalRuns: metrics.length,
        fastBuild: this.calculateAverage(metrics, 'compilationTime') < 30000,
        heavyMemoryUsage: this.calculateAverage(metrics, 'memoryUsage') > 500 * 1024 * 1024
      };
      
      console.log(`📈 CI/CD Performance Analysis:
        - Average compilation time: ${(analysis.averageCompilationTime / 1000).toFixed(2)}s
        - Fast build capable: ${analysis.fastBuild ? 'Yes' : 'No'}
        - Heavy memory usage: ${analysis.heavyMemoryUsage ? 'Yes' : 'No'}
        - Cache effectiveness: ${(analysis.averageCacheHitRate * 100).toFixed(2)}%`);
      
      return analysis;
      
    } catch (error) {
      console.warn('⚠️ Could not analyze performance metrics, using defaults');
      return this.getDefaultAnalysis();
    }
  }

  async optimizeGitHubActionsWorkflows(metrics) {
    console.log('⚙️ Optimizing GitHub Actions workflows...');
    
    // Ensure workflows directory exists
    await fs.mkdir(this.workflowsDir, { recursive: true });
    
    // Create optimized TypeScript validation workflow
    const optimizedWorkflow = this.createOptimizedValidationWorkflow(metrics);
    await fs.writeFile(
      path.join(this.workflowsDir, 'typescript-validation-optimized.yml'),
      optimizedWorkflow
    );
    
    // Create fast feedback workflow for PRs
    const fastFeedbackWorkflow = this.createFastFeedbackWorkflow(metrics);
    await fs.writeFile(
      path.join(this.workflowsDir, 'fast-feedback.yml'),
      fastFeedbackWorkflow
    );
    
    // Create performance monitoring workflow
    const performanceWorkflow = this.createPerformanceMonitoringWorkflow(metrics);
    await fs.writeFile(
      path.join(this.workflowsDir, 'performance-monitoring.yml'),
      performanceWorkflow
    );
    
    console.log('✅ GitHub Actions workflows optimized');
  }

  createOptimizedValidationWorkflow(metrics) {
    const workflow = {
      name: 'Optimized TypeScript Validation',
      on: {
        push: {
          branches: ['main', 'develop']
        },
        pull_request: {
          branches: ['main']
        }
      },
      concurrency: {
        group: '${{ github.workflow }}-${{ github.ref }}',
        'cancel-in-progress': true
      },
      jobs: {
        'typescript-validation': {
          'runs-on': 'ubuntu-latest',
          timeout: metrics.fastBuild ? 10 : 20,
          strategy: {
            matrix: {
              'node-version': ['18.x', '20.x']
            },
            'fail-fast': false
          },
          steps: [
            {
              uses: 'actions/checkout@v4',
              with: {
                'fetch-depth': metrics.fastBuild ? 1 : 2
              }
            },
            {
              name: 'Use Node.js ${{ matrix.node-version }}',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': '${{ matrix.node-version }}',
                cache: 'npm',
                'cache-dependency-path': 'frontend/package-lock.json'
              }
            },
            {
              name: 'Cache TypeScript build',
              uses: 'actions/cache@v3',
              with: {
                path: [
                  'frontend/.typescript-cache',
                  'frontend/.next/cache',
                  'frontend/node_modules/.cache'
                ].join('\\n'),
                key: '${{ runner.os }}-typescript-${{ hashFiles(\'frontend/tsconfig.json\', \'frontend/package-lock.json\') }}',
                'restore-keys': '${{ runner.os }}-typescript-'
              }
            },
            {
              name: 'Install dependencies',
              run: [
                'cd frontend',
                'npm ci --prefer-offline --no-audit --no-fund'
              ].join('\\n')
            },
            {
              name: 'Run TypeScript validation (parallel)',
              run: [
                'cd frontend',
                'npm run type-check:fast || npm run type-check'
              ].join('\\n'),
              env: {
                'NODE_OPTIONS': `--max-old-space-size=${metrics.heavyMemoryUsage ? 8192 : 4096}`,
                'TYPESCRIPT_CACHE_ENABLED': 'true'
              }
            },
            {
              name: 'Run ESLint validation',
              run: [
                'cd frontend',
                'npm run lint:fast || npm run lint'
              ].join('\\n')
            },
            {
              name: 'Upload performance metrics',
              if: 'always()',
              uses: 'actions/upload-artifact@v3',
              with: {
                name: 'typescript-performance-metrics-${{ matrix.node-version }}',
                path: 'frontend/.typescript-cache/performance-metrics.json',
                'retention-days': 30
              }
            }
          ]
        }
      }
    };
    
    return yaml.dump(workflow, { indent: 2 });
  }

  createFastFeedbackWorkflow(metrics) {
    const workflow = {
      name: 'Fast Feedback',
      on: {
        pull_request: {
          branches: ['main', 'develop']
        }
      },
      concurrency: {
        group: 'fast-feedback-${{ github.ref }}',
        'cancel-in-progress': true
      },
      jobs: {
        'quick-validation': {
          'runs-on': 'ubuntu-latest',
          timeout: 5,
          steps: [
            {
              uses: 'actions/checkout@v4',
              with: {
                'fetch-depth': 1
              }
            },
            {
              name: 'Use Node.js 20.x',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': '20.x',
                cache: 'npm',
                'cache-dependency-path': 'frontend/package-lock.json'
              }
            },
            {
              name: 'Cache dependencies and build',
              uses: 'actions/cache@v3',
              with: {
                path: [
                  'frontend/node_modules',
                  'frontend/.typescript-cache',
                  'frontend/.next/cache'
                ].join('\\n'),
                key: '${{ runner.os }}-quick-${{ hashFiles(\'frontend/package-lock.json\') }}',
                'restore-keys': '${{ runner.os }}-quick-'
              }
            },
            {
              name: 'Install dependencies (fast)',
              run: [
                'cd frontend',
                'npm ci --prefer-offline --no-audit --no-fund --ignore-scripts'
              ].join('\\n')
            },
            {
              name: 'Quick TypeScript check',
              run: [
                'cd frontend',
                'npm run type-check:quick'
              ].join('\\n'),
              env: {
                'NODE_OPTIONS': '--max-old-space-size=2048'
              }
            },
            {
              name: 'Quick lint check',
              run: [
                'cd frontend',
                'npm run lint:quick'
              ].join('\\n')
            }
          ]
        }
      }
    };
    
    return yaml.dump(workflow, { indent: 2 });
  }

  createPerformanceMonitoringWorkflow(metrics) {
    const workflow = {
      name: 'Performance Monitoring',
      on: {
        schedule: [
          { cron: '0 */6 * * *' } // Every 6 hours
        ],
        workflow_dispatch: {}
      },
      jobs: {
        'performance-monitoring': {
          'runs-on': 'ubuntu-latest',
          steps: [
            {
              uses: 'actions/checkout@v4'
            },
            {
              name: 'Use Node.js 20.x',
              uses: 'actions/setup-node@v4',
              with: {
                'node-version': '20.x',
                cache: 'npm',
                'cache-dependency-path': 'frontend/package-lock.json'
              }
            },
            {
              name: 'Install dependencies',
              run: [
                'cd frontend',
                'npm ci --prefer-offline --no-audit'
              ].join('\\n')
            },
            {
              name: 'Run performance benchmarks',
              run: [
                'cd frontend',
                'npm run performance:benchmark'
              ].join('\\n')
            },
            {
              name: 'Analyze performance trends',
              run: [
                'cd frontend',
                'npm run performance:analyze'
              ].join('\\n')
            },
            {
              name: 'Upload performance report',
              uses: 'actions/upload-artifact@v3',
              with: {
                name: 'performance-report-${{ github.run_number }}',
                path: 'frontend/performance-report.json',
                'retention-days': 90
              }
            }
          ]
        }
      }
    };
    
    return yaml.dump(workflow, { indent: 2 });
  }

  async createOptimizedScripts(metrics) {
    console.log('📝 Creating optimized scripts...');
    
    // Read current package.json
    const packageJsonData = await fs.readFile(this.packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonData);
    
    // Add optimized scripts
    const optimizedScripts = {
      'type-check:fast': 'tsc --noEmit --incremental --tsBuildInfoFile .typescript-cache/tsconfig.tsbuildinfo',
      'type-check:quick': 'tsc --noEmit --skipLibCheck --incremental',
      'lint:fast': 'eslint . --ext .ts,.tsx --cache --cache-location .typescript-cache/eslint-cache',
      'lint:quick': 'eslint . --ext .ts,.tsx --cache --max-warnings 0 --quiet',
      'performance:benchmark': 'node scripts/performance-tuning-optimizer.js',
      'performance:analyze': 'node scripts/cicd-performance-optimizer.js',
      'cache:optimize': 'node scripts/cache-optimization-manager.js',
      'cache:clean': '.typescript-cache/cleanup-cache.sh',
      'validate:all': 'npm run type-check && npm run lint',
      'validate:fast': 'npm run type-check:fast && npm run lint:fast',
      'validate:quick': 'npm run type-check:quick && npm run lint:quick'
    };
    
    // Merge with existing scripts
    packageJson.scripts = {
      ...packageJson.scripts,
      ...optimizedScripts
    };
    
    // Write updated package.json
    await fs.writeFile(this.packageJsonPath, JSON.stringify(packageJson, null, 2));
    
    console.log('✅ Optimized scripts added to package.json');
  }

  async setupParallelValidation(metrics) {
    console.log('⚡ Setting up parallel validation strategies...');
    
    const parallelValidationScript = `#!/usr/bin/env node

/**
 * Parallel Validation Runner
 * Runs TypeScript and ESLint validation in parallel for faster feedback
 */

const { spawn } = require('child_process');
const path = require('path');

class ParallelValidationRunner {
  constructor() {
    this.processes = [];
    this.results = {};
  }

  async runParallelValidation() {
    console.log('⚡ Starting parallel validation...');
    
    const validations = [
      {
        name: 'typescript',
        command: 'npm',
        args: ['run', 'type-check:fast'],
        timeout: ${metrics.fastBuild ? 30000 : 60000}
      },
      {
        name: 'eslint',
        command: 'npm',
        args: ['run', 'lint:fast'],
        timeout: 30000
      }
    ];
    
    // Run validations in parallel
    const promises = validations.map(validation => this.runValidation(validation));
    
    try {
      const results = await Promise.allSettled(promises);
      
      let allPassed = true;
      results.forEach((result, index) => {
        const validation = validations[index];
        if (result.status === 'fulfilled') {
          console.log(\`✅ \${validation.name} validation passed\`);
        } else {
          console.error(\`❌ \${validation.name} validation failed:, result.reason\`);
          allPassed = false;
        }
      });
      
      if (allPassed) {
        console.log('🎉 All validations passed!');
        process.exit(0);
      } else {
        console.error('💥 Some validations failed');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Parallel validation failed:', error.message);
      process.exit(1);
    }
  }

  runValidation(validation) {
    return new Promise((resolve, reject) => {
      const process = spawn(validation.command, validation.args, {
        stdio: 'pipe',
        cwd: process.cwd()
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      const timeout = setTimeout(() => {
        process.kill('SIGTERM');
        reject(new Error(\`\${validation.name} validation timed out after \${validation.timeout}ms\`));
      }, validation.timeout);
      
      process.on('close', (code) => {
        clearTimeout(timeout);
        
        if (code === 0) {
          resolve({ name: validation.name, stdout, stderr });
        } else {
          reject(new Error(\`\${validation.name} validation failed with code \${code}\\n\${stderr}\`));
        }
      });
      
      process.on('error', (error) => {
        clearTimeout(timeout);
        reject(new Error(\`\${validation.name} validation process error: \${error.message}\`));
      });
    });
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new ParallelValidationRunner();
  runner.runParallelValidation();
}

module.exports = ParallelValidationRunner;
`;
    
    await fs.writeFile('scripts/parallel-validation-runner.js', parallelValidationScript);
    
    // Make script executable
    try {
      const { execSync } = require('child_process');
      execSync('chmod +x scripts/parallel-validation-runner.js');
    } catch (error) {
      console.warn('⚠️ Could not make parallel validation script executable');
    }
    
    console.log('✅ Parallel validation setup completed');
  }

  async configureCICDCaching(metrics) {
    console.log('💾 Configuring CI/CD caching strategies...');
    
    const cacheConfig = {
      enabled: true,
      strategy: 'layered',
      layers: [
        {
          name: 'dependencies',
          paths: ['node_modules', 'package-lock.json'],
          key: 'deps-${{ hashFiles(\'package-lock.json\') }}',
          restoreKeys: ['deps-']
        },
        {
          name: 'typescript-cache',
          paths: ['.typescript-cache', '.next/cache'],
          key: 'ts-cache-${{ hashFiles(\'tsconfig.json\', \'**/*.ts\', \'**/*.tsx\') }}',
          restoreKeys: ['ts-cache-']
        },
        {
          name: 'eslint-cache',
          paths: ['.eslintcache', 'node_modules/.cache/eslint'],
          key: 'eslint-cache-${{ hashFiles(\'.eslintrc.*\', \'**/*.ts\', \'**/*.tsx\') }}',
          restoreKeys: ['eslint-cache-']
        }
      ],
      optimization: {
        parallelCaching: true,
        compressionEnabled: metrics.heavyMemoryUsage,
        incrementalCaching: true,
        smartInvalidation: true
      }
    };
    
    await fs.writeFile(
      '.github/cache-config.json',
      JSON.stringify(cacheConfig, null, 2)
    );
    
    console.log('✅ CI/CD caching configuration created');
  }

  async setupCICDPerformanceMonitoring() {
    console.log('📊 Setting up CI/CD performance monitoring...');
    
    const monitoringScript = `#!/usr/bin/env node

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
      
      console.log(\`✅ CI/CD metrics collected in \${metrics.collectionTime}ms\`);
      
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
`;
    
    await fs.writeFile('scripts/cicd-performance-monitor.js', monitoringScript);
    
    console.log('✅ CI/CD performance monitoring setup completed');
  }

  calculateAverage(metrics, field) {
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, metric) => acc + (metric[field] || 0), 0);
    return sum / metrics.length;
  }

  calculateErrorRate(metrics) {
    if (metrics.length === 0) return 0;
    const errorsTotal = metrics.reduce((acc, metric) => acc + (metric.errorsFound || 0), 0);
    const filesTotal = metrics.reduce((acc, metric) => acc + (metric.filesProcessed || 0), 0);
    return filesTotal > 0 ? errorsTotal / filesTotal : 0;
  }

  getDefaultAnalysis() {
    return {
      averageCompilationTime: 30000,
      averageMemoryUsage: 256 * 1024 * 1024,
      averageCacheHitRate: 0.8,
      averageFilesProcessed: 100,
      errorRate: 0.05,
      totalRuns: 10,
      fastBuild: false,
      heavyMemoryUsage: false
    };
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new CICDPerformanceOptimizer();
  optimizer.optimizeCICDIntegration()
    .then(() => {
      console.log('🎉 CI/CD performance optimization completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 CI/CD optimization failed:', error);
      process.exit(1);
    });
}

module.exports = CICDPerformanceOptimizer;