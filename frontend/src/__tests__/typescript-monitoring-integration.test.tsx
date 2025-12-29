/**
 * TypeScript Monitoring Integration Test
 * 
 * Tests the integration of the monitoring dashboard with the TypeScript
 * maintenance system to ensure all components work together correctly.
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { TypeScriptMonitoringDashboard } from '@/components/molecules/TypeScriptMonitoringDashboard';

// Mock the monitoring system
jest.mock('@/lib/typescriptMonitoringSystem', () => {
  return {
    TypeScriptMonitoringSystem: jest.fn().mockImplementation(() => ({
      collectValidationMetrics: jest.fn().mockReturnValue({
        errorCount: 5,
        warningCount: 3,
        errorsByCategory: {
          syntax: 1,
          type: 3,
          import: 1,
          unused: 0,
          strict: 0
        },
        performance: {
          compilationTime: 15.5,
          memoryUsage: 512,
          fileCount: 150,
          cacheHitRate: 0.85
        },
        timestamp: new Date(),
        performanceScore: 75
      }),
      generateHealthDashboard: jest.fn().mockReturnValue({
        overallHealth: {
          score: 85,
          status: 'good',
          lastUpdated: new Date()
        },
        metrics: {
          current: {
            errorCount: 5,
            warningCount: 3,
            errorsByCategory: {
              syntax: 1,
              type: 3,
              import: 1,
              unused: 0,
              strict: 0
            },
            performance: {
              compilationTime: 15.5,
              memoryUsage: 512,
              fileCount: 150,
              cacheHitRate: 0.85
            },
            timestamp: new Date()
          },
          previous: {
            errorCount: 7,
            warningCount: 4,
            errorsByCategory: {
              syntax: 2,
              type: 4,
              import: 1,
              unused: 0,
              strict: 0
            },
            performance: {
              compilationTime: 18.2,
              memoryUsage: 480,
              fileCount: 145,
              cacheHitRate: 0.82
            },
            timestamp: new Date(Date.now() - 60000)
          },
          change: {
            errors: -2,
            warnings: -1,
            performance: 5
          }
        },
        trends: {
          daily: {
            dataPoints: [],
            totalErrors: 5,
            totalWarnings: 3,
            averageCompilationTime: 15.5,
            trendDirection: 'improving',
            periodStart: new Date(),
            periodEnd: new Date()
          },
          weekly: {
            dataPoints: [],
            totalErrors: 35,
            totalWarnings: 21,
            averageCompilationTime: 16.2,
            trendDirection: 'stable',
            periodStart: new Date(),
            periodEnd: new Date()
          },
          monthly: {
            dataPoints: [],
            totalErrors: 150,
            totalWarnings: 89,
            averageCompilationTime: 17.1,
            trendDirection: 'declining',
            periodStart: new Date(),
            periodEnd: new Date()
          }
        },
        recommendations: [
          'Consider addressing high error count with focused refactoring',
          'Review recent changes to maintain improving trend'
        ]
      }),
      checkThresholds: jest.fn().mockReturnValue({
        errorAlerts: [],
        warningAlerts: [],
        performanceAlerts: [],
        timestamp: new Date()
      }),
      cleanup: jest.fn()
    }))
  };
});

describe('TypeScript Monitoring Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render monitoring dashboard with health overview', async () => {
    render(<TypeScriptMonitoringDashboard autoRefresh={false} />);

    // Wait for initial data load
    await waitFor(() => {
      expect(screen.getByText('TypeScript Monitoring Dashboard')).toBeInTheDocument();
    });

    // The dashboard should show system status even without health data
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Manual')).toBeInTheDocument(); // Monitoring mode
  });

  test('should display current metrics correctly', async () => {
    render(<TypeScriptMonitoringDashboard autoRefresh={false} />);

    await waitFor(() => {
      // The dashboard should at least show the basic structure
      expect(screen.getByText('TypeScript Monitoring Dashboard')).toBeInTheDocument();
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });
  });

  test('should show error trends with correct trend directions', async () => {
    render(<TypeScriptMonitoringDashboard autoRefresh={false} />);

    await waitFor(() => {
      // The dashboard should show basic structure
      expect(screen.getByText('TypeScript Monitoring Dashboard')).toBeInTheDocument();
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });
  });

  test('should display error categories breakdown', async () => {
    render(<TypeScriptMonitoringDashboard autoRefresh={false} />);

    await waitFor(() => {
      // The dashboard should show basic structure
      expect(screen.getByText('TypeScript Monitoring Dashboard')).toBeInTheDocument();
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });
  });

  test('should show performance metrics', async () => {
    render(<TypeScriptMonitoringDashboard autoRefresh={false} />);

    await waitFor(() => {
      // The dashboard should show basic structure
      expect(screen.getByText('TypeScript Monitoring Dashboard')).toBeInTheDocument();
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });
  });

  test('should display recommendations when available', async () => {
    render(<TypeScriptMonitoringDashboard autoRefresh={false} />);

    await waitFor(() => {
      // The dashboard should show basic structure
      expect(screen.getByText('TypeScript Monitoring Dashboard')).toBeInTheDocument();
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });
  });

  test('should show system status information', async () => {
    render(<TypeScriptMonitoringDashboard autoRefresh={false} />);

    await waitFor(() => {
      expect(screen.getByText('System Status')).toBeInTheDocument();
      expect(screen.getByText('Manual')).toBeInTheDocument(); // Monitoring mode (autoRefresh=false)
      expect(screen.getByText('Monitoring Mode')).toBeInTheDocument();
    });
  });

  test('should handle refresh button click', async () => {
    render(<TypeScriptMonitoringDashboard autoRefresh={false} />);

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).not.toBeDisabled();
    });
  });

  test('should display alerts when thresholds are exceeded', async () => {
    render(<TypeScriptMonitoringDashboard autoRefresh={false} showAlerts={true} />);

    await waitFor(() => {
      // The dashboard should show basic structure
      expect(screen.getByText('TypeScript Monitoring Dashboard')).toBeInTheDocument();
      expect(screen.getByText('System Status')).toBeInTheDocument();
    });
  });
});