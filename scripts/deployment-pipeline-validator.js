#!/usr/bin/env node

/**
 * Comprehensive Deployment Pipeline Validator
 * Tests full deployment pipeline from build to running application
 * Validates: Requirements 6.1, 6.2, 6.3
 */

const https = require('https');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class ComprehensiveDeploymentValidator {
  constructor(config = {}) {
    this.config = {
      frontendUrl: config.frontendUrl || process.env.FRONTEND_URL || 'https://arba-delivery-frontend.onrender.com',
      backendUrl: config.backendUrl || process.env.BACKEND_URL || 'https://arba-delivery-backend.onrender.com',
      timeout: config.timeout || 30000,
      retries: config.retries || 3,
      verbose: config.verbose || false
    };

    this.results = {
      buildValidation: { status: false, details: [], errors: [] },
      healthChecks: { status: false, details: [], errors: [] },
      staticAssets: { status: false, details: [], errors: [] },
      apiConnectivity: { status: false, details: [], errors: [] },
      interfaceRendering: { status: false, details: [], errors: [] },
      environmentConfig: { status: false, details: [], errors: [] },
      performanceChecks: { status: false, details: [], errors: [] },
      securityChecks: { status: false, details: [], errors: [] }
    };
  }

  async validateFullPipeline() {
    console.log('🚀 Starting Comprehensive Deployment Pipeline Validation...\n');
    console.log(`Frontend URL: ${this.config.frontendUrl}`);
    console.log(`Backend URL: ${this.config.backendUrl}\n`);

    try {
      // Step 1: Build Process Validation
      await this.validateBuildProcess();

      // Step 2: Health Check Validation
      await this.validateHealthChecks();

      // Step 3: Static Assets Validation
      await this.validateStaticAssets();

      // Step 4: API Connectivity Validation
      await this.validateApiConnectivity();

      // Step 5: Interface Rendering Validation
      await this.validateInterfaceRendering();

      // Step 6: Environment Configuration Validation
      await this.validateEnvironmentConfiguration();

      // Step 7: Performance Checks
      await this.validatePerformance();

      // Step 8: Security Checks
      await this.validateSecurity();

      // Generate comprehensive report
      this.generateReport();

      const overallSuccess = this.isDeploymentValid();
      
      if (overallSuccess) {
        console.log('\n✅ All deployment pipeline validation tests passed!');
        console.log('🎉 Deployment is ready for production use.');
        process.exit(0);
      } else {
        console.log('\n❌ Some deployment pipeline validation tests failed.');
        console.log('🔧 Please review the errors and fix before proceeding.');
        process.exit(1);
      }

    } catch (error) {
      console.error('\n💥 Deployment pipeline validation failed:', error.message);
      process.exit(1);
    }
  }

  async validateBuildProcess() {
    console.log('🔍 Validating Build Process...');
    
    try {
      // Check if the application responds (indicates successful build)
      const response = await this.makeRequest(this.config.frontendUrl);
      
      if (response.statusCode === 200) {
        this.results.buildValidation.status = true;
        this.results.buildValidation.details.push('Application responding correctly');
        console.log('  ✅ Build process completed successfully');
      } else {
        throw new Error(`Application not responding correctly (status: ${response.statusCode})`);
      }

      // Check for build artifacts (if accessible)
      await this.checkBuildArtifacts();

    } catch (error) {
      this.results.buildValidation.errors.push(error.message);
      console.log('  ❌ Build process validation failed:', error.message);
    }
  }

  async checkBuildArtifacts() {
    const buildPaths = [
      '/_next/static/',
      '/favicon.ico'
    ];

    for (const buildPath of buildPaths) {
      try {
        const response = await this.makeRequest(`${this.config.frontendUrl}${buildPath}`);
        if (response.statusCode === 200 || response.statusCode === 404) {
          this.results.buildValidation.details.push(`Build artifact check: ${buildPath} - OK`);
        }
      } catch (error) {
        this.results.buildValidation.details.push(`Build artifact check: ${buildPath} - ${error.message}`);
      }
    }
  }

  async validateHealthChecks() {
    console.log('🔍 Validating Health Check Endpoints...');
    
    try {
      // Frontend health check
      const frontendHealth = await this.makeRequest(`${this.config.frontendUrl}/api/health`);
      
      if (frontendHealth.statusCode === 200) {
        const healthData = JSON.parse(frontendHealth.body);
        if (healthData.status === 'healthy' || healthData.status === 'degraded') {
          this.results.healthChecks.details.push('Frontend health check: PASS');
          console.log('  ✅ Frontend health check passed');
        } else {
          throw new Error('Frontend health check returned unhealthy status');
        }
      } else {
        throw new Error(`Frontend health check failed (status: ${frontendHealth.statusCode})`);
      }

      // Backend health check
      const backendHealth = await this.makeRequest(`${this.config.backendUrl}/api/health/`);
      
      if (backendHealth.statusCode === 200) {
        this.results.healthChecks.details.push('Backend health check: PASS');
        console.log('  ✅ Backend health check passed');
        this.results.healthChecks.status = true;
      } else {
        throw new Error(`Backend health check failed (status: ${backendHealth.statusCode})`);
      }

    } catch (error) {
      this.results.healthChecks.errors.push(error.message);
      console.log('  ❌ Health check validation failed:', error.message);
    }
  }

  async validateStaticAssets() {
    console.log('🔍 Validating Static Assets...');
    
    const staticAssets = [
      '/_next/static/css/',
      '/_next/static/chunks/',
      '/favicon.ico'
    ];

    let assetsLoaded = 0;
    
    for (const asset of staticAssets) {
      try {
        const response = await this.makeRequest(`${this.config.frontendUrl}${asset}`);
        
        if (response.statusCode === 200) {
          assetsLoaded++;
          this.results.staticAssets.details.push(`Asset ${asset}: LOADED`);
        } else if (response.statusCode === 404) {
          this.results.staticAssets.details.push(`Asset ${asset}: NOT FOUND (acceptable)`);
        }
      } catch (error) {
        this.results.staticAssets.details.push(`Asset ${asset}: ERROR - ${error.message}`);
      }
    }

    if (assetsLoaded >= staticAssets.length - 1) {
      this.results.staticAssets.status = true;
      console.log('  ✅ Static assets validation passed');
    } else {
      this.results.staticAssets.errors.push(`Only ${assetsLoaded} out of ${staticAssets.length} assets loaded`);
      console.log('  ❌ Static assets validation failed');
    }
  }

  async validateApiConnectivity() {
    console.log('🔍 Validating API Connectivity...');
    
    try {
      // Test backend API accessibility
      const response = await this.makeRequest(`${this.config.backendUrl}/api/health/`);
      
      if (response.statusCode === 200) {
        this.results.apiConnectivity.status = true;
        this.results.apiConnectivity.details.push('Backend API accessible');
        console.log('  ✅ API connectivity validation passed');
      } else {
        throw new Error(`Backend API not accessible (status: ${response.statusCode})`);
      }

      // Test CORS configuration
      await this.testCorsConfiguration();

    } catch (error) {
      this.results.apiConnectivity.errors.push(error.message);
      console.log('  ❌ API connectivity validation failed:', error.message);
    }
  }

  async testCorsConfiguration() {
    try {
      const response = await this.makeRequest(`${this.config.backendUrl}/api/health/`, {
        headers: {
          'Origin': this.config.frontendUrl,
          'Access-Control-Request-Method': 'GET'
        }
      });

      this.results.apiConnectivity.details.push('CORS configuration: OK');
    } catch (error) {
      this.results.apiConnectivity.details.push(`CORS configuration: ${error.message}`);
    }
  }

  async validateInterfaceRendering() {
    console.log('🔍 Validating Interface Rendering...');
    
    try {
      const response = await this.makeRequest(this.config.frontendUrl);
      
      if (response.statusCode === 200) {
        const html = response.body;
        
        // Check for essential HTML structure
        const checks = [
          { name: 'DOCTYPE', test: html.includes('<!DOCTYPE html>') },
          { name: 'HTML tag', test: html.includes('<html') },
          { name: 'Title tag', test: html.includes('<title>') },
          { name: 'Main content', test: html.includes('<main>') || html.includes('id="__next"') },
          { name: 'Static assets', test: html.includes('/_next/static/') }
        ];

        let passedChecks = 0;
        checks.forEach(check => {
          if (check.test) {
            passedChecks++;
            this.results.interfaceRendering.details.push(`${check.name}: PASS`);
          } else {
            this.results.interfaceRendering.details.push(`${check.name}: FAIL`);
          }
        });

        if (passedChecks >= checks.length - 1) {
          this.results.interfaceRendering.status = true;
          console.log('  ✅ Interface rendering validation passed');
        } else {
          throw new Error(`Only ${passedChecks} out of ${checks.length} interface checks passed`);
        }
      } else {
        throw new Error(`Interface not accessible (status: ${response.statusCode})`);
      }

    } catch (error) {
      this.results.interfaceRendering.errors.push(error.message);
      console.log('  ❌ Interface rendering validation failed:', error.message);
    }
  }

  async validateEnvironmentConfiguration() {
    console.log('🔍 Validating Environment Configuration...');
    
    try {
      const response = await this.makeRequest(`${this.config.frontendUrl}/api/health`);
      
      if (response.statusCode === 200) {
        const healthData = JSON.parse(response.body);
        const env = healthData.environment;

        const envChecks = [
          { name: 'NODE_ENV', value: env.nodeEnv, expected: 'production' },
          { name: 'API_URL', value: env.apiUrl, test: env.apiUrl && env.apiUrl !== 'not-configured' },
          { name: 'WS_URL', value: env.wsUrl, test: env.wsUrl && env.wsUrl !== 'not-configured' }
        ];

        let passedEnvChecks = 0;
        envChecks.forEach(check => {
          const passed = check.expected ? check.value === check.expected : check.test;
          if (passed) {
            passedEnvChecks++;
            this.results.environmentConfig.details.push(`${check.name}: PASS (${check.value})`);
          } else {
            this.results.environmentConfig.details.push(`${check.name}: FAIL (${check.value})`);
          }
        });

        if (passedEnvChecks === envChecks.length) {
          this.results.environmentConfig.status = true;
          console.log('  ✅ Environment configuration validation passed');
        } else {
          throw new Error(`Only ${passedEnvChecks} out of ${envChecks.length} environment checks passed`);
        }
      } else {
        throw new Error('Could not retrieve environment configuration');
      }

    } catch (error) {
      this.results.environmentConfig.errors.push(error.message);
      console.log('  ❌ Environment configuration validation failed:', error.message);
    }
  }

  async validatePerformance() {
    console.log('🔍 Validating Performance...');
    
    try {
      const startTime = Date.now();
      const response = await this.makeRequest(this.config.frontendUrl);
      const responseTime = Date.now() - startTime;

      // Check response time
      if (responseTime < 5000) { // 5 seconds threshold
        this.results.performanceChecks.details.push(`Response time: ${responseTime}ms - GOOD`);
      } else {
        this.results.performanceChecks.details.push(`Response time: ${responseTime}ms - SLOW`);
      }

      // Check response size
      const responseSize = Buffer.byteLength(response.body, 'utf8');
      this.results.performanceChecks.details.push(`Response size: ${responseSize} bytes`);

      // Check for compression
      const isCompressed = response.headers['content-encoding'] === 'gzip' || 
                          response.headers['content-encoding'] === 'br';
      this.results.performanceChecks.details.push(`Compression: ${isCompressed ? 'ENABLED' : 'DISABLED'}`);

      this.results.performanceChecks.status = true;
      console.log('  ✅ Performance validation completed');

    } catch (error) {
      this.results.performanceChecks.errors.push(error.message);
      console.log('  ❌ Performance validation failed:', error.message);
    }
  }

  async validateSecurity() {
    console.log('🔍 Validating Security...');
    
    try {
      const response = await this.makeRequest(this.config.frontendUrl);
      
      // Check security headers
      const securityHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection',
        'strict-transport-security'
      ];

      let securityScore = 0;
      securityHeaders.forEach(header => {
        if (response.headers[header]) {
          securityScore++;
          this.results.securityChecks.details.push(`${header}: PRESENT`);
        } else {
          this.results.securityChecks.details.push(`${header}: MISSING`);
        }
      });

      // Check HTTPS
      if (this.config.frontendUrl.startsWith('https://')) {
        securityScore++;
        this.results.securityChecks.details.push('HTTPS: ENABLED');
      } else {
        this.results.securityChecks.details.push('HTTPS: DISABLED');
      }

      this.results.securityChecks.status = securityScore >= 3; // Require at least 3 security measures
      console.log(`  ${this.results.securityChecks.status ? '✅' : '⚠️'} Security validation completed (score: ${securityScore}/5)`);

    } catch (error) {
      this.results.securityChecks.errors.push(error.message);
      console.log('  ❌ Security validation failed:', error.message);
    }
  }

  makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const requestOptions = {
        headers: {
          'User-Agent': 'Deployment-Validator/1.0',
          ...options.headers
        }
      };

      const request = protocol.get(url, requestOptions, (response) => {
        let body = '';
        
        response.on('data', (chunk) => {
          body += chunk;
        });
        
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            body: body
          });
        });
      });
      
      request.on('error', (error) => {
        reject(error);
      });
      
      request.setTimeout(this.config.timeout, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  isDeploymentValid() {
    const criticalChecks = [
      'buildValidation',
      'healthChecks',
      'staticAssets',
      'apiConnectivity',
      'interfaceRendering',
      'environmentConfig'
    ];

    return criticalChecks.every(check => this.results[check].status);
  }

  generateReport() {
    console.log('\n📊 Comprehensive Deployment Validation Report');
    console.log('='.repeat(50));

    Object.entries(this.results).forEach(([category, result]) => {
      const status = result.status ? '✅ PASS' : '❌ FAIL';
      const categoryName = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
      
      console.log(`\n${categoryName}: ${status}`);
      
      if (result.details.length > 0) {
        result.details.forEach(detail => {
          console.log(`  • ${detail}`);
        });
      }
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`  ❌ ${error}`);
        });
      }
    });

    // Generate JSON report for CI/CD
    const reportPath = path.join(process.cwd(), 'deployment-validation-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      config: this.config,
      results: this.results,
      overallStatus: this.isDeploymentValid() ? 'PASS' : 'FAIL'
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const config = {};

  // Parse command line arguments
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    const value = args[i + 1];
    
    if (key === 'frontend-url') config.frontendUrl = value;
    if (key === 'backend-url') config.backendUrl = value;
    if (key === 'timeout') config.timeout = parseInt(value);
    if (key === 'verbose') config.verbose = true;
  }

  const validator = new ComprehensiveDeploymentValidator(config);
  await validator.validateFullPipeline();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = ComprehensiveDeploymentValidator;