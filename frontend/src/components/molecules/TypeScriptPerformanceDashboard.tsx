/**
 * TypeScript Performance Dashboard
 * Displays real-time performance metrics and alerts for TypeScript validation
 */

import React, { useState, useEffect } from 'react';
import { Card } from '../atoms/Card';
import { Typography } from '../atoms/Typography';

interface PerformanceMetrics {
  timestamp: number;
  compilationTime: number;
  memoryUsage: number;
  filesProcessed: number;
  errorsFound: number;
  warningsFound: number;
  cacheHitRate: number;
  exitCode: number;
}

interface PerformanceAlert {
  type: string;
  message: string;
  current: number;
  average: number;
  threshold: number;
}

interface AlertRecord {
  timestamp: number;
  alerts: PerformanceAlert[];
}

interface PerformanceReport {
  summary: {
    totalValidations: number;
    averageCompilationTime: number;
    averageMemoryUsage: number;
    averageErrorsFound: number;
    averageWarningsFound: number;
  };
  latest: {
    timestamp: string;
    compilationTime: number;
    memoryUsage: number;
    errorsFound: number;
    warningsFound: number;
    cacheHitRate: number;
  };
  trends: {
    compilationTime?: { trend: string; change: number };
    memoryUsage?: { trend: string; change: number };
    errorRate?: { trend: string; change: number };
    insufficient_data?: boolean;
  };
  recommendations: string[];
}

export const TypeScriptPerformanceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformanceData();
    const interval = setInterval(loadPerformanceData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, these would be API calls
      // For now, we'll simulate loading from the cache files
      const [metricsData, alertsData, reportData] = await Promise.all([
        loadMetrics(),
        loadAlerts(),
        loadReport(),
      ]);

      setMetrics(metricsData);
      setAlerts(alertsData);
      setReport(reportData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async (): Promise<PerformanceMetrics[]> => {
    // Simulate API call - in real implementation, this would fetch from the backend
    // or read from the performance metrics file
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockMetrics: PerformanceMetrics[] = Array.from({ length: 10 }, (_, i) => ({
          timestamp: Date.now() - (9 - i) * 60000,
          compilationTime: 2000 + Math.random() * 3000,
          memoryUsage: 100 + Math.random() * 50,
          filesProcessed: 150 + Math.floor(Math.random() * 50),
          errorsFound: Math.floor(Math.random() * 3),
          warningsFound: Math.floor(Math.random() * 5),
          cacheHitRate: 0.6 + Math.random() * 0.3,
          exitCode: Math.random() > 0.1 ? 0 : 1,
        }));
        resolve(mockMetrics);
      }, 500);
    });
  };

  const loadAlerts = async (): Promise<AlertRecord[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockAlerts: AlertRecord[] = [
          {
            timestamp: Date.now() - 300000,
            alerts: [
              {
                type: 'compilation_time_increase',
                message: 'Compilation time increased by 65%',
                current: 4500,
                average: 2700,
                threshold: 50,
              },
            ],
          },
        ];
        resolve(mockAlerts);
      }, 300);
    });
  };

  const loadReport = async (): Promise<PerformanceReport> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockReport: PerformanceReport = {
          summary: {
            totalValidations: 45,
            averageCompilationTime: 2800,
            averageMemoryUsage: 125,
            averageErrorsFound: 1.2,
            averageWarningsFound: 2.8,
          },
          latest: {
            timestamp: new Date().toISOString(),
            compilationTime: 3200,
            memoryUsage: 140,
            errorsFound: 2,
            warningsFound: 3,
            cacheHitRate: 75,
          },
          trends: {
            compilationTime: { trend: 'increasing', change: 15 },
            memoryUsage: { trend: 'stable', change: 2 },
            errorRate: { trend: 'decreasing', change: -10 },
          },
          recommendations: [
            'Consider enabling incremental compilation to reduce compilation time',
            'Recent validations found errors - consider running error detection more frequently',
          ],
        };
        resolve(mockReport);
      }, 400);
    });
  };

  const formatTime = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatMemory = (mb: number): string => {
    return `${Math.round(mb)}MB`;
  };

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      case 'stable': return '➡️';
      default: return '❓';
    }
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'increasing': return 'text-red-600';
      case 'decreasing': return 'text-green-600';
      case 'stable': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <Typography variant="h2" className="mb-6">
          TypeScript Performance Dashboard
        </Typography>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Typography variant="h2" className="mb-6">
          TypeScript Performance Dashboard
        </Typography>
        <Card className="p-6 border-red-200 bg-red-50">
          <Typography variant="body1" className="text-red-800">
            Error loading performance data: {error}
          </Typography>
          <button
            onClick={loadPerformanceData}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Typography variant="h2">
          TypeScript Performance Dashboard
        </Typography>
        <button
          onClick={loadPerformanceData}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      {report && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <Typography variant="h3" className="text-sm font-medium text-gray-600">
              Total Validations
            </Typography>
            <Typography variant="h2" className="text-2xl font-bold text-gray-900">
              {report.summary.totalValidations}
            </Typography>
          </Card>

          <Card className="p-4">
            <Typography variant="h3" className="text-sm font-medium text-gray-600">
              Avg Compilation Time
            </Typography>
            <Typography variant="h2" className="text-2xl font-bold text-gray-900">
              {formatTime(report.summary.averageCompilationTime)}
            </Typography>
            {report.trends.compilationTime && (
              <div className={`flex items-center mt-1 ${getTrendColor(report.trends.compilationTime.trend)}`}>
                <span className="mr-1">{getTrendIcon(report.trends.compilationTime.trend)}</span>
                <Typography variant="caption">
                  {Math.abs(report.trends.compilationTime.change)}%
                </Typography>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <Typography variant="h3" className="text-sm font-medium text-gray-600">
              Avg Memory Usage
            </Typography>
            <Typography variant="h2" className="text-2xl font-bold text-gray-900">
              {formatMemory(report.summary.averageMemoryUsage)}
            </Typography>
            {report.trends.memoryUsage && (
              <div className={`flex items-center mt-1 ${getTrendColor(report.trends.memoryUsage.trend)}`}>
                <span className="mr-1">{getTrendIcon(report.trends.memoryUsage.trend)}</span>
                <Typography variant="caption">
                  {Math.abs(report.trends.memoryUsage.change)}%
                </Typography>
              </div>
            )}
          </Card>

          <Card className="p-4">
            <Typography variant="h3" className="text-sm font-medium text-gray-600">
              Cache Hit Rate
            </Typography>
            <Typography variant="h2" className="text-2xl font-bold text-gray-900">
              {report.latest.cacheHitRate}%
            </Typography>
          </Card>
        </div>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            Recent Performance Alerts
          </Typography>
          <div className="space-y-3">
            {alerts.slice(0, 5).map((alertRecord, index) => (
              <div key={index} className="border-l-4 border-yellow-400 bg-yellow-50 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Typography variant="caption" className="text-gray-600">
                    {formatTimestamp(alertRecord.timestamp)}
                  </Typography>
                </div>
                {alertRecord.alerts.map((alert, alertIndex) => (
                  <div key={alertIndex}>
                    <Typography variant="body2" className="text-yellow-800">
                      ⚠️ {alert.message}
                    </Typography>
                    <Typography variant="caption" className="text-yellow-700">
                      Current: {alert.current} | Average: {Math.round(alert.average)} | Threshold: {alert.threshold}%
                    </Typography>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Latest Metrics */}
      {report && (
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            Latest Validation Results
          </Typography>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Typography variant="body2" className="text-gray-600">
                Compilation Time
              </Typography>
              <Typography variant="h3" className="text-xl font-semibold">
                {formatTime(report.latest.compilationTime)}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" className="text-gray-600">
                Memory Usage
              </Typography>
              <Typography variant="h3" className="text-xl font-semibold">
                {formatMemory(report.latest.memoryUsage)}
              </Typography>
            </div>
            <div>
              <Typography variant="body2" className="text-gray-600">
                Errors Found
              </Typography>
              <Typography variant="h3" className={`text-xl font-semibold ${
                report.latest.errorsFound > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {report.latest.errorsFound}
              </Typography>
            </div>
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {report && report.recommendations.length > 0 && (
        <Card className="p-6">
          <Typography variant="h3" className="text-lg font-semibold mb-4">
            Performance Recommendations
          </Typography>
          <ul className="space-y-2">
            {report.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">💡</span>
                <Typography variant="body2" className="text-gray-700">
                  {recommendation}
                </Typography>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Recent Metrics Chart */}
      <Card className="p-6">
        <Typography variant="h3" className="text-lg font-semibold mb-4">
          Recent Performance Metrics
        </Typography>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Compilation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Memory
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Files
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cache Hit
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.slice(-10).map((metric, index) => (
                <tr key={index} className={metric.exitCode !== 0 ? 'bg-red-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(metric.timestamp)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(metric.compilationTime)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatMemory(metric.memoryUsage)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.filesProcessed}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={metric.errorsFound > 0 ? 'text-red-600' : 'text-green-600'}>
                      {metric.errorsFound}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round(metric.cacheHitRate * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default TypeScriptPerformanceDashboard;