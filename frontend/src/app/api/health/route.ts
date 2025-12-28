import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check environment variables
    const requiredEnvVars = {
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
      NODE_ENV: process.env.NODE_ENV
    }

    // Check if required environment variables are present
    const missingEnvVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)

    // Application status and environment information
    const healthStatus = {
      status: missingEnvVars.length === 0 ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      service: 'arba-delivery-frontend',
      version: process.env.npm_package_version || '1.0.0',
      environment: {
        nodeEnv: process.env.NODE_ENV || 'unknown',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'not-configured',
        wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'not-configured',
        buildTime: process.env.BUILD_TIME || new Date().toISOString()
      },
      checks: {
        environmentVariables: {
          status: missingEnvVars.length === 0 ? 'pass' : 'fail',
          missingVariables: missingEnvVars
        },
        application: {
          status: 'pass',
          uptime: process.uptime()
        }
      }
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 206
    return NextResponse.json(healthStatus, { status: statusCode })
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        service: 'arba-delivery-frontend'
      }, 
      { status: 503 }
    )
  }
}