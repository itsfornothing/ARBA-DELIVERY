#!/usr/bin/env node

/**
 * Deployment Status Checker
 * Monitors Render deployment status and validates when ready
 * Requirements: 6.2, 6.3, 4.2
 */

const https = require('https');

class DeploymentStatusChecker {
  constructor(frontendUrl, backendUrl) {
    this.frontendUrl = frontendUrl;
    this.backendUrl = backendUrl;
    this.maxRetries = 30; // 30 attempts
    this.retryInterval = 30000; // 30 seconds between attempts
  }

  async checkDeploymentStatus() {
    console.log('🔍 Checking deployment status...\n');
    console.log(`Frontend URL: ${this.frontendUrl}`);
    console.log(`Backend URL: ${this.backendUrl}\n`);

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      console.log(`📡 Attempt ${attempt}/${this.maxRetries} - Checking deployment status...`);
      
      const frontendStatus = await this.checkServiceStatus(this.frontendUrl);
      const backendStatus = await this.checkServiceStatus(this.backendUrl);
      
      console.log(`Frontend: ${frontendStatus.status} (${frontendStatus.statusCode})`);
      console.log(`Backend: ${backendStatus.status} (${backendStatus.statusCode})`);
      
      if (frontendStatus.isReady && backendStatus.isReady) {
        console.log('\n✅ Both services are ready! Running full validation...\n');
        
        // Run the full deployment validation
        const DeploymentValidator = require('./validate-frontend-deployment.js');
        const validator = new DeploymentValidator(this.frontendUrl, this.backendUrl);
        await validator.validateDeployment();
        return;
      }
      
      if (frontendStatus.isError && backendStatus.isError) {
        console.log('\n❌ Both services are failing. Deployment may have issues.');
        console.log('Please check Render dashboard for build logs and errors.');
        process.exit(1);
      }
      
      if (attempt < this.maxRetries) {
        console.log(`⏳ Services not ready yet. Waiting ${this.retryInterval/1000} seconds before next check...\n`);
        await this.sleep(this.retryInterval);
      }
    }
    
    console.log('\n⏰ Timeout reached. Services may still be deploying.');
    console.log('Please check Render dashboard and run validation manually when deployment completes.');
    process.exit(1);
  }

  async checkServiceStatus(url) {
    try {
      const response = await this.makeRequest(url);
      
      if (response.statusCode === 200) {
        return { status: 'Ready', statusCode: 200, isReady: true, isError: false };
      } else if (response.statusCode === 404) {
        return { status: 'Not Found (Still Deploying?)', statusCode: 404, isReady: false, isError: false };
      } else if (response.statusCode >= 500) {
        return { status: 'Server Error', statusCode: response.statusCode, isReady: false, isError: true };
      } else {
        return { status: 'Unknown Status', statusCode: response.statusCode, isReady: false, isError: false };
      }
    } catch (error) {
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return { status: 'Service Unavailable (Deploying?)', statusCode: 'N/A', isReady: false, isError: false };
      }
      return { status: `Error: ${error.message}`, statusCode: 'N/A', isReady: false, isError: true };
    }
  }

  makeRequest(url) {
    return new Promise((resolve, reject) => {
      const request = https.get(url, (response) => {
        resolve({
          statusCode: response.statusCode,
          headers: response.headers
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

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  const frontendUrl = process.env.FRONTEND_URL || 'https://arba-delivery-frontend.onrender.com';
  const backendUrl = process.env.BACKEND_URL || 'https://arba-delivery-backend.onrender.com';
  
  const checker = new DeploymentStatusChecker(frontendUrl, backendUrl);
  await checker.checkDeploymentStatus();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = DeploymentStatusChecker;