/**
 * TypeScript Monitoring System Types
 * 
 * Defines interfaces and types for the TypeScript maintenance monitoring system
 */

export interface ValidationResult {
  timestamp: Date;
  errors: TypeScriptError[];
  warnings: TypeScriptWarning[];
  performance: PerformanceMetrics;
  success: boolean;
}

export interface TypeScriptError {
  file: string;
  line: number;
  column: number;
  message: string;
  code: number;
  severity: 'error' | 'warning' | 'info';
  category: ErrorCategory;
}

export interface TypeScriptWarning {
  file: string;
  message: string;
  severity: 'warning' | 'info';
}

export type ErrorCategory = 'syntax' | 'type' | 'import' | 'unused' | 'strict';

export interface PerformanceMetrics {
  compilationTime: number;
  memoryUsage: number;
  fileCount: number;
  cacheHitRate: number;
}

export interface QualityMetrics {
  errorCount: number;
  warningCount: number;
  errorsByCategory: Record<ErrorCategory, number>;
  performance: PerformanceMetrics;
  timestamp: Date;
  codeComplexity?: number;
  typeAnnotationCoverage?: number;
  testCoverage?: number;
  performanceScore?: number;
}

export interface TrendReport {
  dataPoints: QualityMetrics[];
  totalErrors: number;
  totalWarnings: number;
  averageCompilationTime: number;
  trendDirection: 'improving' | 'declining' | 'stable';
  periodStart: Date;
  periodEnd: Date;
}

export interface PrioritizedIssues {
  categories: Record<ErrorCategory, {
    count: number;
    priority: 'high' | 'medium' | 'low';
    examples: TypeScriptError[];
  }>;
  totalIssues: number;
  criticalIssues: number;
}

export interface HealthDashboard {
  overallHealth: {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    lastUpdated: Date;
  };
  metrics: {
    current: QualityMetrics;
    previous: QualityMetrics;
    change: {
      errors: number;
      warnings: number;
      performance: number;
    };
  };
  trends: {
    daily: TrendReport;
    weekly: TrendReport;
    monthly: TrendReport;
  };
  recommendations: string[];
}

export interface AlertConfig {
  errorThreshold: number;
  warningThreshold: number;
  performanceThreshold: number;
}

export interface AlertResult {
  errorAlerts: Alert[];
  warningAlerts: Alert[];
  performanceAlerts: Alert[];
  timestamp: Date;
}

export interface Alert {
  type: 'error' | 'warning' | 'performance';
  severity: 'critical' | 'high' | 'medium' | 'low';
  message: string;
  threshold: number;
  actualValue: number;
  timestamp: Date;
  affectedFiles?: string[];
}

export interface MonitoringConfig {
  enableRealTimeMonitoring: boolean;
  aggregationPeriods: ('daily' | 'weekly' | 'monthly')[];
  alertThresholds: AlertConfig;
  retentionPeriod: number; // days
  enableTrendAnalysis: boolean;
}

export interface AggregatedMetrics {
  date: string;
  totalErrors: number;
  totalWarnings: number;
  averageCompilationTime: number;
  averageMemoryUsage: number;
  totalValidations: number;
}

export interface MonitoringOperation {
  operationId: string;
  success: boolean;
  timestamp: Date;
  data?: any;
}

export interface MonitoringState {
  operationCount: number;
  dataIntegrityCheck: boolean;
  lastOperation: Date;
  activeOperations: number;
}