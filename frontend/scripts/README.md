# Frontend Monitoring and Validation Scripts

This directory contains comprehensive monitoring and validation scripts for the Mohamedo frontend application. These scripts ensure reliable builds, deployments, and ongoing application health.

## Scripts Overview

### 1. Pre-build Validation (`pre-build-validation.js`)

Validates the frontend environment and configuration before starting the build process.

**Purpose:**
- Ensures all dependencies are properly installed
- Validates TypeScript and Next.js configurations
- Checks utility files exist and are accessible
- Tests import statement consistency
- Performs TypeScript compilation test

**Usage:**
```bash
# Run pre-build validation
npm run validate:pre-build

# Or run directly
node scripts/pre-build-validation.js
```

**Validates:**
- TypeScript configuration (tsconfig.json)
- Next.js configuration (next.config.js)
- Package dependencies (clsx, tailwind-merge)
- Utility files (src/lib/utils.ts, src/lib/validation.ts)
- Import statement consistency
- TypeScript compilation success

**Output:**
- Console logs with validation progress
- `pre-build-validation-report.json` with detailed results

### 2. Deployment Health Check (`deployment-health-check.js`)

Performs comprehensive health checks on the deployed frontend application.

**Purpose:**
- Validates deployment success
- Checks application accessibility
- Tests static asset loading
- Verifies API endpoint availability
- Monitors response times and performance

**Usage:**
```bash
# Run health check (uses DEPLOYMENT_URL env var)
npm run validate:health

# Or run with custom URL
node scripts/deployment-health-check.js https://your-app.com

# Or run with custom timeout
node scripts/deployment-health-check.js https://your-app.com 15000
```

**Checks:**
- Application load and HTML structure
- Static assets accessibility
- API endpoints functionality
- Build artifacts presence
- Environment configuration

**Output:**
- Console logs with health check progress
- `deployment-health-report.json` with comprehensive results
- Recommendations for fixing issues

### 3. Continuous Validation (`continuous-validation.js`)

Provides ongoing monitoring and validation of the frontend application.

**Purpose:**
- Continuous monitoring of application health
- File change detection and automatic validation
- Performance monitoring
- Alert system for failures
- Historical validation tracking

**Usage:**
```bash
# Run continuous validation (5-minute intervals)
npm run validate:continuous

# Or run with custom interval (in milliseconds)
node scripts/continuous-validation.js 180000

# Or run with custom failure thresholds
node scripts/continuous-validation.js 300000 5 3
```

**Parameters:**
1. Interval (ms) - Time between validation cycles (default: 300000 = 5 minutes)
2. Max failures - Maximum failures before stopping (default: 3)
3. Alert threshold - Failures before sending alerts (default: 2)

**Features:**
- Periodic validation cycles
- File watching for critical configuration files
- Build testing
- Deployment health monitoring
- Performance metrics tracking
- Alert system for failures
- Historical data collection

**Output:**
- Real-time console logs
- `validation-results/` directory with cycle results
- `continuous-validation-report.json` with final summary
- Alert files for failures

## Integration with Package.json

The following npm scripts are available:

```json
{
  "scripts": {
    "validate:pre-build": "node scripts/pre-build-validation.js",
    "validate:health": "node scripts/deployment-health-check.js",
    "validate:continuous": "node scripts/continuous-validation.js",
    "validate:all": "npm run validate:pre-build && npm run build && npm run validate:health"
  }
}
```

## Environment Variables

### Required
- `NODE_ENV` - Application environment (development, production)

### Optional
- `DEPLOYMENT_URL` - URL for deployment health checks
- `NEXT_PUBLIC_API_URL` - API base URL for the application

## File Monitoring

The continuous validation script monitors these critical files:
- `tsconfig.json` - TypeScript configuration
- `next.config.js` - Next.js configuration
- `package.json` - Dependencies and scripts
- `src/lib/utils.ts` - Utility functions
- `src/lib/validation.ts` - Validation functions

When any of these files change, an immediate validation cycle is triggered.

## Error Handling and Alerts

### Error Types
- **Configuration Errors**: Invalid or missing configuration files
- **Dependency Errors**: Missing or incompatible dependencies
- **Build Errors**: TypeScript compilation or build process failures
- **Deployment Errors**: Application accessibility or performance issues

### Alert System
The continuous validation script includes an alert system that:
- Tracks consecutive failures
- Sends alerts when failure threshold is reached
- Saves alert data to JSON files
- Can be extended to send notifications via email, Slack, etc.

## Performance Monitoring

### Metrics Tracked
- Build times
- Bundle sizes
- Memory usage
- Response times
- Asset loading times

### Performance Thresholds
- Response time > 10 seconds: Warning
- Bundle size > 50MB: Warning
- Build time tracking for trend analysis

## Troubleshooting

### Common Issues

1. **Module Resolution Errors**
   - Check tsconfig.json baseUrl and paths
   - Verify utility files exist
   - Run `npm install` to ensure dependencies

2. **Build Failures**
   - Check TypeScript compilation errors
   - Verify all imports are correct
   - Ensure all dependencies are installed

3. **Deployment Health Check Failures**
   - Verify DEPLOYMENT_URL is correct
   - Check if application is actually deployed
   - Ensure network connectivity

4. **Continuous Validation Issues**
   - Check file permissions for watched files
   - Verify sufficient disk space for logs
   - Monitor memory usage for long-running processes

### Debug Mode

For detailed debugging, you can modify the scripts to include more verbose logging:

```javascript
// Add to any script for debug mode
const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) {
  console.log('Debug information...');
}
```

## Best Practices

1. **Pre-deployment**: Always run `npm run validate:all` before deploying
2. **Continuous Monitoring**: Use continuous validation in production environments
3. **Regular Health Checks**: Schedule periodic health checks for deployed applications
4. **Alert Configuration**: Set up proper alert thresholds based on your requirements
5. **Log Retention**: Regularly clean up old validation logs and reports

## Requirements Mapping

These scripts fulfill the following requirements:

- **5.1**: Deployment pipeline completion without errors
- **5.2**: Build phase completion and static asset generation
- **5.3**: Module dependency resolution
- **5.4**: Working frontend application deployment
- **5.5**: Component serving without module errors

## Future Enhancements

Potential improvements for these scripts:
- Integration with CI/CD pipelines
- Real-time dashboard for monitoring
- Advanced alerting (email, Slack, SMS)
- Performance regression detection
- Automated issue resolution
- Integration with monitoring services (DataDog, New Relic, etc.)