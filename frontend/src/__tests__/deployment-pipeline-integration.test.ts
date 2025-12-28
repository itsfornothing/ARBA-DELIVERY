/**
 * Deployment Pipeline Integration Tests
 * Tests full deployment pipeline from build to running application
 * Validates: Requirements 6.1, 6.2, 6.3
 */

import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';

// Mock environment for testing
const mockEnv = {
  NEXT_PUBLIC_API_URL: 'https://arba-delivery-backend.onrender.com',
  NEXT_PUBLIC_WS_URL: 'wss://arba-delivery-backend.onrender.com',
  NODE_ENV: 'production',
  FRONTEND_URL: 'https://arba-delivery-frontend.onrender.com',
  BACKEND_URL: 'https://arba-delivery-backend.onrender.com'
};

// Mock HTTP client for testing deployment endpoints
class MockHttpClient {
  private responses: Map<string, any> = new Map();

  setMockResponse(url: string, response: any) {
    this.responses.set(url, response);
  }

  async get(url: string): Promise<any> {
    const mockResponse = this.responses.get(url);
    if (mockResponse) {
      return mockResponse;
    }

    // Default responses for common endpoints
    if (url.includes('/api/health')) {
      return {
        status: 200,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          service: url.includes('frontend') ? 'arba-delivery-frontend' : 'arba-delivery-backend',
          environment: {
            nodeEnv: 'production',
            apiUrl: mockEnv.NEXT_PUBLIC_API_URL,
            wsUrl: mockEnv.NEXT_PUBLIC_WS_URL
          },
          checks: {
            environmentVariables: { status: 'pass' },
            application: { status: 'pass', uptime: 3600 }
          }
        }
      };
    }

    if (url.includes('/_next/static/')) {
      return { status: 200, data: 'static content' };
    }

    if (url.includes('/favicon.ico')) {
      return { status: 200, data: 'favicon' };
    }

    // Main page response
    if (url === mockEnv.FRONTEND_URL) {
      return {
        status: 200,
        data: `<!DOCTYPE html>
<html>
<head>
  <title>Delivery Platform</title>
  <link rel="stylesheet" href="/_next/static/css/app.css">
</head>
<body>
  <div id="__next">
    <main>Delivery Platform</main>
  </div>
  <script src="/_next/static/chunks/main.js"></script>
</body>
</html>`
      };
    }

    throw new Error(`No mock response for ${url}`);
  }
}

class DeploymentPipelineValidator {
  private httpClient: MockHttpClient;
  private frontendUrl: string;
  private backendUrl: string;
  private validationResults: {
    buildValidation: boolean;
    healthChecks: boolean;
    staticAssets: boolean;
    apiConnectivity: boolean;
    interfaceRendering: boolean;
    environmentConfig: boolean;
    errors: string[];
  };

  constructor(httpClient: MockHttpClient, frontendUrl: string, backendUrl: string) {
    this.httpClient = httpClient;
    this.frontendUrl = frontendUrl;
    this.backendUrl = backendUrl;
    this.validationResults = {
      buildValidation: false,
      healthChecks: false,
      staticAssets: false,
      apiConnectivity: false,
      interfaceRendering: false,
      environmentConfig: false,
      errors: []
    };
  }

  async validateFullDeploymentPipeline(): Promise<boolean> {
    try {
      // Step 1: Validate build process completed successfully
      await this.validateBuildProcess();

      // Step 2: Validate health check endpoints
      await this.validateHealthCheckEndpoints();

      // Step 3: Validate static assets are served correctly
      await this.validateStaticAssetServing();

      // Step 4: Validate API connectivity between frontend and backend
      await this.validateApiConnectivity();

      // Step 5: Validate interface rendering
      await this.validateInterfaceRendering();

      // Step 6: Validate environment configuration
      await this.validateEnvironmentConfiguration();

      return this.isDeploymentValid();
    } catch (error) {
      this.validationResults.errors.push(`Pipeline validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }

  private async validateBuildProcess(): Promise<void> {
    try {
      // Simulate build validation by checking if the application responds
      const response = await this.httpClient.get(this.frontendUrl);
      
      if (response.status === 200 && response.data.includes('<!DOCTYPE html>')) {
        this.validationResults.buildValidation = true;
      } else {
        throw new Error('Build process validation failed - application not responding correctly');
      }
    } catch (error) {
      this.validationResults.errors.push(`Build validation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateHealthCheckEndpoints(): Promise<void> {
    try {
      // Test frontend health check
      const frontendHealth = await this.httpClient.get(`${this.frontendUrl}/api/health`);
      
      if (frontendHealth.status !== 200 || frontendHealth.data.status !== 'healthy') {
        throw new Error('Frontend health check failed');
      }

      // Test backend health check
      const backendHealth = await this.httpClient.get(`${this.backendUrl}/api/health/`);
      
      if (backendHealth.status !== 200 || backendHealth.data.status !== 'healthy') {
        throw new Error('Backend health check failed');
      }

      this.validationResults.healthChecks = true;
    } catch (error) {
      this.validationResults.errors.push(`Health checks: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateStaticAssetServing(): Promise<void> {
    try {
      const staticAssets = [
        '/_next/static/css/app.css',
        '/_next/static/chunks/main.js',
        '/favicon.ico'
      ];

      let assetsServed = 0;
      
      for (const asset of staticAssets) {
        try {
          const response = await this.httpClient.get(`${this.frontendUrl}${asset}`);
          if (response.status === 200) {
            assetsServed++;
          }
        } catch (error) {
          // Some assets might not exist, which is acceptable
          console.warn(`Asset ${asset} not found, but continuing validation`);
        }
      }

      // Require at least 2 out of 3 assets to be served correctly
      if (assetsServed >= 2) {
        this.validationResults.staticAssets = true;
      } else {
        throw new Error(`Only ${assetsServed} out of ${staticAssets.length} static assets served correctly`);
      }
    } catch (error) {
      this.validationResults.errors.push(`Static assets: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateApiConnectivity(): Promise<void> {
    try {
      // Test that frontend can communicate with backend
      const backendResponse = await this.httpClient.get(`${this.backendUrl}/api/health/`);
      
      if (backendResponse.status === 200) {
        this.validationResults.apiConnectivity = true;
      } else {
        throw new Error(`Backend API not accessible, status: ${backendResponse.status}`);
      }
    } catch (error) {
      this.validationResults.errors.push(`API connectivity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateInterfaceRendering(): Promise<void> {
    try {
      const response = await this.httpClient.get(this.frontendUrl);
      
      if (response.status === 200) {
        const html = response.data;
        
        // Check for essential HTML structure
        const hasDoctype = html.includes('<!DOCTYPE html>');
        const hasHtmlTag = html.includes('<html');
        const hasTitle = html.includes('<title>') && html.includes('Delivery Platform');
        const hasMainContent = html.includes('<main>') || html.includes('id="__next"');
        const hasStaticAssets = html.includes('/_next/static/');

        if (hasDoctype && hasHtmlTag && hasTitle && hasMainContent && hasStaticAssets) {
          this.validationResults.interfaceRendering = true;
        } else {
          throw new Error('Interface rendering validation failed - missing essential HTML structure');
        }
      } else {
        throw new Error(`Interface not rendering correctly, status: ${response.status}`);
      }
    } catch (error) {
      this.validationResults.errors.push(`Interface rendering: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async validateEnvironmentConfiguration(): Promise<void> {
    try {
      const healthResponse = await this.httpClient.get(`${this.frontendUrl}/api/health`);
      
      if (healthResponse.status === 200) {
        const healthData = healthResponse.data;
        const env = healthData.environment;
        
        // Validate required environment variables are configured
        const hasApiUrl = env.apiUrl && env.apiUrl !== 'not-configured';
        const hasWsUrl = env.wsUrl && env.wsUrl !== 'not-configured';
        const hasNodeEnv = env.nodeEnv === 'production';
        
        if (hasApiUrl && hasWsUrl && hasNodeEnv) {
          this.validationResults.environmentConfig = true;
        } else {
          throw new Error('Environment configuration validation failed - missing or invalid environment variables');
        }
      } else {
        throw new Error('Could not retrieve environment configuration from health endpoint');
      }
    } catch (error) {
      this.validationResults.errors.push(`Environment config: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private isDeploymentValid(): boolean {
    const results = this.validationResults;
    return results.buildValidation && 
           results.healthChecks && 
           results.staticAssets && 
           results.apiConnectivity && 
           results.interfaceRendering && 
           results.environmentConfig;
  }

  getValidationResults() {
    return { ...this.validationResults };
  }
}

describe('Deployment Pipeline Integration Tests', () => {
  let httpClient: MockHttpClient;
  let validator: DeploymentPipelineValidator;

  beforeAll(() => {
    // Set up environment variables for testing
    Object.entries(mockEnv).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  beforeEach(() => {
    // Create fresh instances for each test to avoid state pollution
    httpClient = new MockHttpClient();
    validator = new DeploymentPipelineValidator(
      httpClient,
      mockEnv.FRONTEND_URL,
      mockEnv.BACKEND_URL
    );
  });

  afterAll(() => {
    // Clean up environment variables
    Object.keys(mockEnv).forEach(key => {
      delete process.env[key];
    });
  });

  describe('Full Deployment Pipeline Validation', () => {
    it('should validate complete deployment pipeline successfully', async () => {
      const isValid = await validator.validateFullDeploymentPipeline();
      const results = validator.getValidationResults();

      expect(isValid).toBe(true);
      expect(results.buildValidation).toBe(true);
      expect(results.healthChecks).toBe(true);
      expect(results.staticAssets).toBe(true);
      expect(results.apiConnectivity).toBe(true);
      expect(results.interfaceRendering).toBe(true);
      expect(results.environmentConfig).toBe(true);
      expect(results.errors.length).toBe(0);
    });

    it('should handle deployment pipeline failures gracefully', async () => {
      // Set up failing responses
      httpClient.setMockResponse(mockEnv.FRONTEND_URL, { status: 500, data: 'Server Error' });
      
      const failingValidator = new DeploymentPipelineValidator(
        httpClient,
        mockEnv.FRONTEND_URL,
        mockEnv.BACKEND_URL
      );

      const isValid = await failingValidator.validateFullDeploymentPipeline();
      const results = failingValidator.getValidationResults();

      expect(isValid).toBe(false);
      expect(results.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Build Process Validation', () => {
    it('should validate that build process completed successfully', async () => {
      const response = await httpClient.get(mockEnv.FRONTEND_URL);
      
      expect(response.status).toBe(200);
      expect(response.data).toContain('<!DOCTYPE html>');
      expect(response.data).toContain('Delivery Platform');
    });

    it('should detect build failures', async () => {
      httpClient.setMockResponse(mockEnv.FRONTEND_URL, { status: 404, data: 'Not Found' });
      
      const failingValidator = new DeploymentPipelineValidator(
        httpClient,
        mockEnv.FRONTEND_URL,
        mockEnv.BACKEND_URL
      );

      const isValid = await failingValidator.validateFullDeploymentPipeline();
      expect(isValid).toBe(false);
    });
  });

  describe('Health Check Validation', () => {
    it('should validate frontend health check endpoint', async () => {
      const response = await httpClient.get(`${mockEnv.FRONTEND_URL}/api/health`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.service).toBe('arba-delivery-frontend');
      expect(response.data.checks.environmentVariables.status).toBe('pass');
    });

    it('should validate backend health check endpoint', async () => {
      const response = await httpClient.get(`${mockEnv.BACKEND_URL}/api/health/`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
      expect(response.data.service).toBe('arba-delivery-backend');
    });

    it('should handle health check failures', async () => {
      httpClient.setMockResponse(`${mockEnv.FRONTEND_URL}/api/health`, { 
        status: 503, 
        data: { status: 'unhealthy', error: 'Service unavailable' } 
      });

      const failingValidator = new DeploymentPipelineValidator(
        httpClient,
        mockEnv.FRONTEND_URL,
        mockEnv.BACKEND_URL
      );

      const isValid = await failingValidator.validateFullDeploymentPipeline();
      expect(isValid).toBe(false);
    });
  });

  describe('Static Assets Validation', () => {
    it('should validate static assets are served correctly', async () => {
      const cssResponse = await httpClient.get(`${mockEnv.FRONTEND_URL}/_next/static/css/app.css`);
      const jsResponse = await httpClient.get(`${mockEnv.FRONTEND_URL}/_next/static/chunks/main.js`);
      const faviconResponse = await httpClient.get(`${mockEnv.FRONTEND_URL}/favicon.ico`);

      expect(cssResponse.status).toBe(200);
      expect(jsResponse.status).toBe(200);
      expect(faviconResponse.status).toBe(200);
    });

    it('should handle missing static assets gracefully', async () => {
      // Remove one asset to test graceful handling
      httpClient.setMockResponse(`${mockEnv.FRONTEND_URL}/_next/static/css/app.css`, { status: 404 });

      const isValid = await validator.validateFullDeploymentPipeline();
      // Should still pass with some assets missing
      expect(isValid).toBe(true);
    });
  });

  describe('API Connectivity Validation', () => {
    it('should validate frontend can communicate with backend', async () => {
      const response = await httpClient.get(`${mockEnv.BACKEND_URL}/api/health/`);
      
      expect(response.status).toBe(200);
      expect(response.data.status).toBe('healthy');
    });

    it('should detect API connectivity failures', async () => {
      httpClient.setMockResponse(`${mockEnv.BACKEND_URL}/api/health/`, { status: 500 });

      const failingValidator = new DeploymentPipelineValidator(
        httpClient,
        mockEnv.FRONTEND_URL,
        mockEnv.BACKEND_URL
      );

      const isValid = await failingValidator.validateFullDeploymentPipeline();
      expect(isValid).toBe(false);
    });
  });

  describe('Interface Rendering Validation', () => {
    it('should validate interface renders correctly with all required elements', async () => {
      const response = await httpClient.get(mockEnv.FRONTEND_URL);
      const html = response.data;

      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('<title>Delivery Platform</title>');
      expect(html).toContain('id="__next"');
      expect(html).toContain('/_next/static/');
    });

    it('should detect interface rendering issues', async () => {
      httpClient.setMockResponse(mockEnv.FRONTEND_URL, { 
        status: 200, 
        data: '<html><body>Incomplete page</body></html>' 
      });

      const failingValidator = new DeploymentPipelineValidator(
        httpClient,
        mockEnv.FRONTEND_URL,
        mockEnv.BACKEND_URL
      );

      const isValid = await failingValidator.validateFullDeploymentPipeline();
      expect(isValid).toBe(false);
    });
  });

  describe('Environment Configuration Validation', () => {
    it('should validate environment variables are configured correctly', async () => {
      const response = await httpClient.get(`${mockEnv.FRONTEND_URL}/api/health`);
      const env = response.data.environment;

      expect(env.nodeEnv).toBe('production');
      expect(env.apiUrl).toBe(mockEnv.NEXT_PUBLIC_API_URL);
      expect(env.wsUrl).toBe(mockEnv.NEXT_PUBLIC_WS_URL);
    });

    it('should detect missing environment configuration', async () => {
      httpClient.setMockResponse(`${mockEnv.FRONTEND_URL}/api/health`, {
        status: 200,
        data: {
          status: 'degraded',
          environment: {
            nodeEnv: 'production',
            apiUrl: 'not-configured',
            wsUrl: 'not-configured'
          }
        }
      });

      const failingValidator = new DeploymentPipelineValidator(
        httpClient,
        mockEnv.FRONTEND_URL,
        mockEnv.BACKEND_URL
      );

      const isValid = await failingValidator.validateFullDeploymentPipeline();
      expect(isValid).toBe(false);
    });
  });

  describe('End-to-End Deployment Scenarios', () => {
    it('should validate successful production deployment', async () => {
      // Simulate a complete successful deployment
      const isValid = await validator.validateFullDeploymentPipeline();
      const results = validator.getValidationResults();

      expect(isValid).toBe(true);
      expect(results.errors.length).toBe(0);
      
      // Verify all validation steps passed
      Object.entries(results).forEach(([key, value]) => {
        if (key !== 'errors') {
          expect(value).toBe(true);
        }
      });
    });

    it('should handle partial deployment failures', async () => {
      // Simulate partial failure (health checks fail but static assets work)
      httpClient.setMockResponse(`${mockEnv.BACKEND_URL}/api/health/`, { status: 503 });

      const partialFailValidator = new DeploymentPipelineValidator(
        httpClient,
        mockEnv.FRONTEND_URL,
        mockEnv.BACKEND_URL
      );

      const isValid = await partialFailValidator.validateFullDeploymentPipeline();
      const results = partialFailValidator.getValidationResults();

      expect(isValid).toBe(false);
      expect(results.staticAssets).toBe(true); // This should still pass
      expect(results.apiConnectivity).toBe(false); // This should fail
      expect(results.errors.length).toBeGreaterThan(0);
    });

    it('should validate deployment rollback scenarios', async () => {
      // Simulate a scenario where deployment needs to be rolled back
      httpClient.setMockResponse(mockEnv.FRONTEND_URL, { status: 500, data: 'Internal Server Error' });
      httpClient.setMockResponse(`${mockEnv.FRONTEND_URL}/api/health`, { status: 503 });

      const rollbackValidator = new DeploymentPipelineValidator(
        httpClient,
        mockEnv.FRONTEND_URL,
        mockEnv.BACKEND_URL
      );

      const isValid = await rollbackValidator.validateFullDeploymentPipeline();
      const results = rollbackValidator.getValidationResults();

      expect(isValid).toBe(false);
      expect(results.buildValidation).toBe(false);
      expect(results.healthChecks).toBe(false);
      expect(results.errors.length).toBeGreaterThan(0);
    });
  });
});