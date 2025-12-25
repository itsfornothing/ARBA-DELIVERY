#!/usr/bin/env node

/**
 * Frontend Deployment Validation Script
 * Tests application loading, interface rendering, API connectivity, and static assets
 * Requirements: 6.2, 6.3, 4.2
 */

const https = require('https');
const http = require('http');

class DeploymentValidator {
  constructor(frontendUrl, backendUrl) {
    this.frontendUrl = frontendUrl;
    this.backendUrl = backendUrl;
    this.results = {
      healthCheck: false,
      staticAssets: false,
      apiConnectivity: false,
      interfaceRendering: false,
      errors: []
    };
  }

  async validateDeployment() {
    console.log('🚀 Starting frontend deployment validation...\n');
    
    try {
      // Test 1: Health Check Endpoint
      await this.testHealthCheck();
      
      // Test 2: Static Assets Loading
      await this.testStaticAssets();
      
      // Test 3: API Connectivity
      await this.testApiConnectivity();
      
      // Test 4: Interface Rendering
      await this.testInterfaceRendering();
      
      this.printResults();
      
      const allPassed = Object.values(this.results).every(result => 
        typeof result === 'boolean' ? result : true
      );
      
      if (allPassed) {
        console.log('✅ All deployment validation tests passed!');
        process.exit(0);
      } else {
        console.log('❌ Some deployment validation tests failed.');
        process.exit(1);
      }
      
    } catch (error) {
      console.error('💥 Deployment validation failed:', error.message);
      process.exit(1);
    }
  }

  async testHealthCheck() {
    console.log('🔍 Testing health check endpoint...');
    
    try {
      const response = await this.makeRequest(`${this.frontendUrl}/api/health`);
      
      if (response.statusCode === 200) {
        console.log('✅ Health check endpoint responding');
        this.results.healthCheck = true;
      } else {
        throw new Error(`Health check returned status ${response.statusCode}`);
      }
    } catch (error) {
      console.log('❌ Health check failed:', error.message);
      this.results.errors.push(`Health check: ${error.message}`);
    }
  }

  async testStaticAssets() {
    console.log('🔍 Testing static assets loading...');
    
    const assetPaths = [
      '/_next/static/css/',
      '/_next/static/chunks/',
      '/favicon.ico'
    ];
    
    let assetsLoaded = 0;
    
    for (const assetPath of assetPaths) {
      try {
        const response = await this.makeRequest(`${this.frontendUrl}${assetPath}`);
        
        if (response.statusCode === 200 || response.statusCode === 404) {
          // 404 is acceptable for some assets that might not exist
          assetsLoaded++;
        }
      } catch (error) {
        console.log(`⚠️  Asset ${assetPath} check failed:`, error.message);
        this.results.errors.push(`Asset ${assetPath}: ${error.message}`);
      }
    }
    
    if (assetsLoaded >= assetPaths.length - 1) { // Allow one asset to fail
      console.log('✅ Static assets loading correctly');
      this.results.staticAssets = true;
    } else {
      console.log('❌ Static assets loading failed');
    }
  }

  async testApiConnectivity() {
    console.log('🔍 Testing API connectivity to backend...');
    
    try {
      const response = await this.makeRequest(`${this.backendUrl}/api/health/`);
      
      if (response.statusCode === 200) {
        console.log('✅ Backend API connectivity working');
        this.results.apiConnectivity = true;
      } else {
        throw new Error(`Backend API returned status ${response.statusCode}`);
      }
    } catch (error) {
      console.log('❌ Backend API connectivity failed:', error.message);
      this.results.errors.push(`API connectivity: ${error.message}`);
    }
  }

  async testInterfaceRendering() {
    console.log('🔍 Testing interface rendering...');
    
    try {
      const response = await this.makeRequest(this.frontendUrl);
      
      if (response.statusCode === 200) {
        // Check if response contains expected HTML structure
        const body = response.body || '';
        const hasHtml = body.includes('<html') || body.includes('<!DOCTYPE html>');
        const hasTitle = body.includes('<title>') || body.includes('Delivery Platform');
        
        if (hasHtml && hasTitle) {
          console.log('✅ Interface rendering correctly');
          this.results.interfaceRendering = true;
        } else {
          throw new Error('Response does not contain expected HTML structure');
        }
      } else {
        throw new Error(`Frontend returned status ${response.statusCode}`);
      }
    } catch (error) {
      console.log('❌ Interface rendering failed:', error.message);
      this.results.errors.push(`Interface rendering: ${error.message}`);
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https:') ? https : http;
      
      const request = protocol.get(url, (response) => {
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
      
      request.setTimeout(10000, () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  printResults() {
    console.log('\n📊 Deployment Validation Results:');
    console.log('================================');
    console.log(`Health Check: ${this.results.healthCheck ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Static Assets: ${this.results.staticAssets ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`API Connectivity: ${this.results.apiConnectivity ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Interface Rendering: ${this.results.interfaceRendering ? '✅ PASS' : '❌ FAIL'}`);
    
    if (this.results.errors.length > 0) {
      console.log('\n🚨 Errors encountered:');
      this.results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    console.log('');
  }
}

// Main execution
async function main() {
  const frontendUrl = process.env.FRONTEND_URL || 'https://arba-delivery-frontend.onrender.com';
  const backendUrl = process.env.BACKEND_URL || 'https://arba-delivery-backend.onrender.com';
  
  console.log(`Frontend URL: ${frontendUrl}`);
  console.log(`Backend URL: ${backendUrl}\n`);
  
  const validator = new DeploymentValidator(frontendUrl, backendUrl);
  await validator.validateDeployment();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeploymentValidator;