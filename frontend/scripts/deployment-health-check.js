#!/usr/bin/env node

/**
 * Deployment Health Check Script
 * 
 * Performs comprehensive health checks on the deployed frontend application.
 * Validates that the deployment is successful and the application is functioning correctly.
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

class DeploymentHealthChecker {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.DEPLOYMENT_URL || 'http://localhost:3000';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 5000;
    this.checks = [];
    this.results = [];
    this.projectRoot = path.resolve(__dirname, '..');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'warning' ? '⚠️' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  // Make HTTP request with retry logic
  async makeRequest(url, options = {}) {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      timeout: this.timeout,
      headers: {
        'User-Agent': 'DeploymentHealthChecker/1.0',
        ...options.headers
      }
    };

    for (let attempt = 1; attempt <= this.retries; attempt++) {
      try {
        const result = await new Promise((resolve, reject) => {
          const req = client.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
              resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                body: data,
                responseTime: Date.now() - startTime
              });
            });
          });

          req.on('error', reject);
          req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
          });

          const startTime = Date.now();
          req.end();
        });

        return result;
      } catch (error) {
        if (attempt === this.retries) {
          throw error;
        }
        this.log(`Request failed (attempt ${attempt}/${this.retries}): ${error.message}`, 'warning');
        await this.sleep(this.retryDelay);
      }
    }
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Check if the main application loads
  async checkApplicationLoad() {
    this.log('Checking application load...');
    
    try {
      const response = await this.makeRequest(this.baseUrl);
      
      const result = {
        name: 'Application Load',
        status: 'PASSED',
        details: {
          statusCode: response.statusCode,
          responseTime: response.responseTime,
          contentLength: response.body.length
        }
      };

      if (response.statusCode !== 200) {
        result.status = 'FAILED';
        result.error = `Expected status 200, got ${response.statusCode}`;
      } else if (response.responseTime > 10000) {
        result.status = 'WARNING';
        result.warning = `Slow response time: ${response.responseTime}ms`;
      }

      // Check for basic HTML structure
      if (response.body.includes('<html') && response.body.includes('</html>')) {
        result.details.hasValidHtml = true;
      } else {
        result.status = 'FAILED';
        result.error = 'Response does not contain valid HTML structure';
      }

      this.results.push(result);
      this.log(`Application load check: ${result.status}`);
      return result.status !== 'FAILED';
    } catch (error) {
      const result = {
        name: 'Application Load',
        status: 'FAILED',
        error: error.message
      };
      this.results.push(result);
      this.log(`Application load check failed: ${error.message}`, 'error');
      return false;
    }
  }

  // Check static assets loading
  async checkStaticAssets() {
    this.log('Checking static assets...');
    
    const assetPaths = [
      '/_next/static/css',
      '/_next/static/chunks',
      '/favicon.ico'
    ];

    let passedChecks = 0;
    const assetResults = [];

    for (const assetPath of assetPaths) {
      try {
        const url = `${this.baseUrl}${assetPath}`;
        const response = await this.makeRequest(url);
        
        const assetResult = {
          path: assetPath,
          status: response.statusCode < 400 ? 'PASSED' : 'FAILED',
          statusCode: response.statusCode,
          responseTime: response.responseTime
        };

        if (assetResult.status === 'PASSED') {
          passedChecks++;
        }

        assetResults.push(assetResult);
      } catch (error) {
        assetResults.push({
          path: assetPath,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    const result = {
      name: 'Static Assets',
      status: passedChecks === assetPaths.length ? 'PASSED' : 
              passedChecks > 0 ? 'WARNING' : 'FAILED',
      details: {
        totalAssets: assetPaths.length,
        passedAssets: passedChecks,
        assets: assetResults
      }
    };

    this.results.push(result);
    this.log(`Static assets check: ${result.status} (${passedChecks}/${assetPaths.length})`);
    return result.status !== 'FAILED';
  }

  // Check API endpoints
  async checkApiEndpoints() {
    this.log('Checking API endpoints...');
    
    const apiEndpoints = [
      '/api/health',
      '/api/status'
    ];

    let passedChecks = 0;
    const apiResults = [];

    for (const endpoint of apiEndpoints) {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await this.makeRequest(url);
        
        const apiResult = {
          endpoint: endpoint,
          status: response.statusCode === 200 ? 'PASSED' : 'FAILED',
          statusCode: response.statusCode,
          responseTime: response.responseTime
        };

        // Try to parse JSON response
        try {
          const jsonData = JSON.parse(response.body);
          apiResult.hasValidJson = true;
          apiResult.responseData = jsonData;
        } catch {
          apiResult.hasValidJson = false;
        }

        if (apiResult.status === 'PASSED') {
          passedChecks++;
        }

        apiResults.push(apiResult);
      } catch (error) {
        apiResults.push({
          endpoint: endpoint,
          status: 'FAILED',
          error: error.message
        });
      }
    }

    const result = {
      name: 'API Endpoints',
      status: passedChecks > 0 ? 'PASSED' : 'WARNING',
      details: {
        totalEndpoints: apiEndpoints.length,
        passedEndpoints: passedChecks,
        endpoints: apiResults
      }
    };

    this.results.push(result);
    this.log(`API endpoints check: ${result.status} (${passedChecks}/${apiEndpoints.length})`);
    return true; // API endpoints are optional, so don't fail the entire check
  }

  // Check build artifacts
  async checkBuildArtifacts() {
    this.log('Checking build artifacts...');
    
    const buildDir = path.join(this.projectRoot, '.next');
    const requiredArtifacts = [
      '.next/BUILD_ID',
      '.next/static',
      '.next/server'
    ];

    let passedChecks = 0;
    const artifactResults = [];

    for (const artifact of requiredArtifacts) {
      const artifactPath = path.join(this.projectRoot, artifact);
      const exists = fs.existsSync(artifactPath);
      
      const artifactResult = {
        path: artifact,
        status: exists ? 'PASSED' : 'FAILED',
        exists: exists
      };

      if (exists) {
        passedChecks++;
        const stats = fs.statSync(artifactPath);
        artifactResult.isDirectory = stats.isDirectory();
        artifactResult.size = stats.isFile() ? stats.size : null;
        artifactResult.modified = stats.mtime;
      }

      artifactResults.push(artifactResult);
    }

    const result = {
      name: 'Build Artifacts',
      status: passedChecks === requiredArtifacts.length ? 'PASSED' : 'FAILED',
      details: {
        totalArtifacts: requiredArtifacts.length,
        passedArtifacts: passedChecks,
        artifacts: artifactResults
      }
    };

    this.results.push(result);
    this.log(`Build artifacts check: ${result.status} (${passedChecks}/${requiredArtifacts.length})`);
    return result.status !== 'FAILED';
  }

  // Check environment configuration
  async checkEnvironmentConfig() {
    this.log('Checking environment configuration...');
    
    const envChecks = [];
    
    // Check if environment variables are properly set
    const requiredEnvVars = ['NODE_ENV'];
    const optionalEnvVars = ['NEXT_PUBLIC_API_URL', 'DEPLOYMENT_URL'];
    
    for (const envVar of requiredEnvVars) {
      envChecks.push({
        variable: envVar,
        required: true,
        present: !!process.env[envVar],
        value: process.env[envVar] ? '[SET]' : '[NOT SET]'
      });
    }

    for (const envVar of optionalEnvVars) {
      envChecks.push({
        variable: envVar,
        required: false,
        present: !!process.env[envVar],
        value: process.env[envVar] ? '[SET]' : '[NOT SET]'
      });
    }

    const requiredPresent = envChecks.filter(check => check.required && check.present).length;
    const totalRequired = envChecks.filter(check => check.required).length;

    const result = {
      name: 'Environment Configuration',
      status: requiredPresent === totalRequired ? 'PASSED' : 'FAILED',
      details: {
        requiredVariables: totalRequired,
        presentRequired: requiredPresent,
        checks: envChecks
      }
    };

    this.results.push(result);
    this.log(`Environment configuration check: ${result.status} (${requiredPresent}/${totalRequired} required vars)`);
    return result.status !== 'FAILED';
  }

  // Generate comprehensive health report
  generateHealthReport() {
    const passedChecks = this.results.filter(r => r.status === 'PASSED').length;
    const failedChecks = this.results.filter(r => r.status === 'FAILED').length;
    const warningChecks = this.results.filter(r => r.status === 'WARNING').length;

    const overallStatus = failedChecks === 0 ? 
      (warningChecks === 0 ? 'HEALTHY' : 'HEALTHY_WITH_WARNINGS') : 
      'UNHEALTHY';

    const report = {
      timestamp: new Date().toISOString(),
      deploymentUrl: this.baseUrl,
      overallStatus: overallStatus,
      summary: {
        totalChecks: this.results.length,
        passed: passedChecks,
        failed: failedChecks,
        warnings: warningChecks
      },
      checks: this.results,
      recommendations: this.generateRecommendations()
    };

    const reportPath = path.join(this.projectRoot, 'deployment-health-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Health report saved to: ${reportPath}`);
    return report;
  }

  // Generate recommendations based on check results
  generateRecommendations() {
    const recommendations = [];
    
    for (const result of this.results) {
      if (result.status === 'FAILED') {
        switch (result.name) {
          case 'Application Load':
            recommendations.push('Check server logs and ensure the application is properly deployed');
            break;
          case 'Static Assets':
            recommendations.push('Verify build process completed successfully and static files are accessible');
            break;
          case 'Build Artifacts':
            recommendations.push('Run a fresh build and ensure all build artifacts are generated');
            break;
          case 'Environment Configuration':
            recommendations.push('Set all required environment variables before deployment');
            break;
        }
      } else if (result.status === 'WARNING') {
        if (result.warning) {
          recommendations.push(`Address warning: ${result.warning}`);
        }
      }
    }

    return recommendations;
  }

  // Run all health checks
  async runHealthCheck() {
    this.log(`Starting deployment health check for: ${this.baseUrl}`);
    
    const healthChecks = [
      () => this.checkEnvironmentConfig(),
      () => this.checkBuildArtifacts(),
      () => this.checkApplicationLoad(),
      () => this.checkStaticAssets(),
      () => this.checkApiEndpoints()
    ];

    for (const healthCheck of healthChecks) {
      try {
        await healthCheck();
      } catch (error) {
        this.log(`Health check failed: ${error.message}`, 'error');
      }
    }

    const report = this.generateHealthReport();
    
    if (report.overallStatus === 'HEALTHY') {
      this.log('✅ Deployment health check completed successfully!', 'success');
      process.exit(0);
    } else if (report.overallStatus === 'HEALTHY_WITH_WARNINGS') {
      this.log('⚠️ Deployment health check completed with warnings.', 'warning');
      process.exit(0);
    } else {
      this.log('❌ Deployment health check failed. Please address the issues.', 'error');
      process.exit(1);
    }
  }
}

// Run health check if called directly
if (require.main === module) {
  const options = {
    baseUrl: process.argv[2] || process.env.DEPLOYMENT_URL,
    timeout: parseInt(process.argv[3]) || 30000
  };

  const healthChecker = new DeploymentHealthChecker(options);
  healthChecker.runHealthCheck().catch(error => {
    console.error('Deployment health check crashed:', error);
    process.exit(1);
  });
}

module.exports = DeploymentHealthChecker;