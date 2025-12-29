'use client';

/**
 * TypeScript Monitoring Dashboard
 * 
 * Provides comprehensive monitoring and reporting capabilities for TypeScript
 * maintenance system, including metrics visualization, trend analysis, and alerting.
 * 
 * Requirements: 9.1, 9.2, 9.3, 9.4, 9.5
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { TypeScriptMonitoringSystem } from '@/lib/typescriptMonitoringSystem';
import { 
  QualityMetrics, 
  HealthDashboard, 
  TrendReport, 
  AlertResult,
  AlertConfig 
} from '@/types/monitoring';

interface TypeScriptMonitoringDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showAlerts?: boolean;
  alertConfig?: AlertConfig;
}

export const TypeScriptMonitoringDashboard: React.FC<TypeScriptMonitoringDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
  showAlerts = true,
  alertConfig = {
    errorThreshold: 10,
    warningThreshold: 20,
    performanceThreshold: 60.0
  }
}) => {
  const [monitoringSystem] = useState(() => new TypeScriptMonitoringSystem());
  const [healthDashboard, setHealthDashboard] = useState<HealthDashboard | null>(null);
  const [alerts, setAlerts] = useState<AlertResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [metricsHistory, setMetricsHistory] = useState<QualityMetrics[]>([]);

  // Requirement 9.1: Collect metrics on error types and frequencies
  const collectMetrics = useCallback(async () => {
    setIsLoading(true);
    try {
      // Simulate collecting validation metrics from TypeScript compilation
      const mockValidationResult = {
        timestamp: new Date(),
        errors: [],
        warnings: [],
        performance: {
          compilationTime: Math.random() * 30 + 5,
          memoryUsage: Math.floor(Math.random() * 1000) + 500,
          fileCount: Math.floor(Math.random() * 100) + 50,
          cacheHitRate: Math.random() * 0.5 + 0.5
        },
        success: true
      };

      const metrics = monitoringSystem.collectValidationMetrics(mockValidationResult);
      setMetricsHistory(prev => [...prev.slice(-99), metrics]); // Keep last 100 metrics

      // Requirement 9.4: Provide dashboards showing project health
      if (metricsHistory.length > 0) {
        const dashboard = monitoringSystem.generateHealthDashboard([...metricsHistory, metrics]);
        setHealthDashboard(dashboard);
      }

      // Requirement 9.5: Alert when error rates exceed thresholds
      if (showAlerts) {
        const alertResult = monitoringSystem.checkThresholds([...metricsHistory, metrics], alertConfig);
        setAlerts(alertResult);
      }

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to collect metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [monitoringSystem, metricsHistory, showAlerts, alertConfig]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(collectMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, collectMetrics]);

  // Initial load
  useEffect(() => {
    collectMetrics();
  }, []);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'fair': return 'text-yellow-600';
      case 'poor': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getAlertSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">TypeScript Monitoring Dashboard</h2>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={collectMetrics} 
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </Button>
          {lastUpdated && (
            <span className="text-sm text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Health Overview */}
      {healthDashboard && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Project Health Overview</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getHealthStatusColor(healthDashboard.overallHealth.status)}`}>
                {Math.round(healthDashboard.overallHealth.score)}
              </div>
              <div className="text-sm text-gray-600 mt-1">Health Score</div>
              <div className={`text-sm font-medium mt-1 ${getHealthStatusColor(healthDashboard.overallHealth.status)}`}>
                {healthDashboard.overallHealth.status.toUpperCase()}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {healthDashboard.metrics.current.errorCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Current Errors</div>
              <div className={`text-sm mt-1 ${
                healthDashboard.metrics.change.errors > 0 ? 'text-red-600' : 
                healthDashboard.metrics.change.errors < 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {healthDashboard.metrics.change.errors > 0 ? '+' : ''}{healthDashboard.metrics.change.errors} from last check
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {healthDashboard.metrics.current.warningCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Current Warnings</div>
              <div className={`text-sm mt-1 ${
                healthDashboard.metrics.change.warnings > 0 ? 'text-red-600' : 
                healthDashboard.metrics.change.warnings < 0 ? 'text-green-600' : 'text-gray-600'
              }`}>
                {healthDashboard.metrics.change.warnings > 0 ? '+' : ''}{healthDashboard.metrics.change.warnings} from last check
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Requirement 9.2: Show trends in TypeScript error rates over time */}
      {healthDashboard && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Error Trends</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">
                {healthDashboard.trends.daily.totalErrors}
              </div>
              <div className="text-sm text-gray-600 mt-1">Daily Errors</div>
              <div className={`text-sm mt-1 ${
                healthDashboard.trends.daily.trendDirection === 'improving' ? 'text-green-600' :
                healthDashboard.trends.daily.trendDirection === 'declining' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {healthDashboard.trends.daily.trendDirection}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">
                {healthDashboard.trends.weekly.totalErrors}
              </div>
              <div className="text-sm text-gray-600 mt-1">Weekly Errors</div>
              <div className={`text-sm mt-1 ${
                healthDashboard.trends.weekly.trendDirection === 'improving' ? 'text-green-600' :
                healthDashboard.trends.weekly.trendDirection === 'declining' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {healthDashboard.trends.weekly.trendDirection}
              </div>
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-xl font-bold text-gray-900">
                {Math.round(healthDashboard.trends.monthly.averageCompilationTime * 100) / 100}s
              </div>
              <div className="text-sm text-gray-600 mt-1">Avg Compilation Time</div>
              <div className="text-sm text-gray-600 mt-1">Monthly</div>
            </div>
          </div>
        </Card>
      )}

      {/* Requirement 9.3: Categorize and prioritize code quality issues */}
      {healthDashboard && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Error Categories</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(healthDashboard.metrics.current.errorsByCategory || {}).map(([category, count]) => (
              <div key={category} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-gray-900">{count}</div>
                <div className="text-sm text-gray-600 capitalize">{category}</div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Performance Metrics */}
      {healthDashboard && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(healthDashboard.metrics.current.performance.compilationTime * 100) / 100}s
              </div>
              <div className="text-sm text-gray-600 mt-1">Compilation Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {healthDashboard.metrics.current.performance.memoryUsage}MB
              </div>
              <div className="text-sm text-gray-600 mt-1">Memory Usage</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {healthDashboard.metrics.current.performance.fileCount}
              </div>
              <div className="text-sm text-gray-600 mt-1">Files Processed</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {Math.round(healthDashboard.metrics.current.performance.cacheHitRate * 100)}%
              </div>
              <div className="text-sm text-gray-600 mt-1">Cache Hit Rate</div>
            </div>
          </div>
        </Card>
      )}

      {/* Requirement 9.5: Alert when error rates exceed thresholds */}
      {showAlerts && alerts && (alerts.errorAlerts.length > 0 || alerts.warningAlerts.length > 0 || alerts.performanceAlerts.length > 0) && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">Active Alerts</h3>
          <div className="space-y-3">
            {[...alerts.errorAlerts, ...alerts.warningAlerts, ...alerts.performanceAlerts].map((alert, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg border ${getAlertSeverityColor(alert.severity)}`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm mt-1">
                      Threshold: {alert.threshold} | Actual: {alert.actualValue}
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {alert.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recommendations */}
      {healthDashboard && healthDashboard.recommendations.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recommendations</h3>
          <ul className="space-y-2">
            {healthDashboard.recommendations.map((recommendation, index) => (
              <li key={index} className="flex items-start">
                <span className="text-blue-600 mr-2">•</span>
                <span className="text-gray-700">{recommendation}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* System Status */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              {autoRefresh ? 'Active' : 'Manual'}
            </div>
            <div className="text-sm text-gray-600 mt-1">Monitoring Mode</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              {Math.round(refreshInterval / 1000)}s
            </div>
            <div className="text-sm text-gray-600 mt-1">Refresh Interval</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-purple-600">
              {metricsHistory.length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Metrics Collected</div>
          </div>
        </div>
      </Card>
    </div>
  );
};