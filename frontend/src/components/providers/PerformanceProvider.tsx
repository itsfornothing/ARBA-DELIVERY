'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PerformanceMonitor, PerformanceMetrics } from '@/lib/performanceOptimization';

interface PerformanceContextType {
  monitor: PerformanceMonitor;
  metrics: PerformanceMetrics | null;
  isMonitoring: boolean;
  startMonitoring: () => void;
  stopMonitoring: () => void;
  measureComponent: <T>(name: string, fn: () => T) => T;
  measureInteraction: <T>(name: string, fn: () => T) => T;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

interface PerformanceProviderProps {
  children: ReactNode;
  enableInProduction?: boolean;
}

/**
 * Performance Provider Component
 * 
 * Provides performance monitoring capabilities throughout the application.
 * Automatically tracks Core Web Vitals and provides utilities for measuring
 * component render times and user interactions.
 */
export function PerformanceProvider({ 
  children, 
  enableInProduction = false 
}: PerformanceProviderProps) {
  const [monitor] = useState(() => new PerformanceMonitor());
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Determine if monitoring should be enabled
  const shouldMonitor = process.env.NODE_ENV === 'development' || enableInProduction;

  useEffect(() => {
    if (!shouldMonitor) return;

    // Start monitoring automatically
    setIsMonitoring(true);

    // Update metrics periodically
    const interval = setInterval(() => {
      const latestMetrics = monitor.getLatestMetrics();
      setMetrics(latestMetrics);
    }, 1000);

    // Cleanup on unmount
    return () => {
      clearInterval(interval);
      monitor.destroy();
    };
  }, [monitor, shouldMonitor]);

  const startMonitoring = () => {
    if (shouldMonitor) {
      setIsMonitoring(true);
    }
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const measureComponent = <T,>(name: string, fn: () => T): T => {
    if (!shouldMonitor || !isMonitoring) {
      return fn();
    }
    return monitor.measureComponentRender(name, fn);
  };

  const measureInteraction = <T,>(name: string, fn: () => T): T => {
    if (!shouldMonitor || !isMonitoring) {
      return fn();
    }
    return monitor.measureInteraction(name, fn);
  };

  const contextValue: PerformanceContextType = {
    monitor,
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    measureComponent,
    measureInteraction,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
      {shouldMonitor && isMonitoring && <PerformanceDebugPanel />}
    </PerformanceContext.Provider>
  );
}

/**
 * Hook to use performance monitoring
 */
export function usePerformance(): PerformanceContextType {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error('usePerformance must be used within a PerformanceProvider');
  }
  return context;
}

/**
 * Debug panel for development
 */
function PerformanceDebugPanel() {
  const { metrics } = usePerformance();
  const [isVisible, setIsVisible] = useState(false);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-primary-600 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg hover:bg-primary-700 transition-colors"
        title="Toggle Performance Panel"
      >
        📊 Perf
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-neutral-200 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-neutral-900">Performance Metrics</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-neutral-500 hover:text-neutral-700"
            >
              ✕
            </button>
          </div>

          {metrics ? (
            <div className="space-y-2 text-sm">
              {metrics.fcp && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">FCP:</span>
                  <span className={metrics.fcp > 1500 ? 'text-error-600' : 'text-success-600'}>
                    {metrics.fcp.toFixed(0)}ms
                  </span>
                </div>
              )}
              
              {metrics.lcp && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">LCP:</span>
                  <span className={metrics.lcp > 2500 ? 'text-error-600' : 'text-success-600'}>
                    {metrics.lcp.toFixed(0)}ms
                  </span>
                </div>
              )}
              
              {metrics.fid && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">FID:</span>
                  <span className={metrics.fid > 100 ? 'text-error-600' : 'text-success-600'}>
                    {metrics.fid.toFixed(0)}ms
                  </span>
                </div>
              )}
              
              {metrics.cls && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">CLS:</span>
                  <span className={metrics.cls > 0.1 ? 'text-error-600' : 'text-success-600'}>
                    {metrics.cls.toFixed(3)}
                  </span>
                </div>
              )}
              
              {metrics.componentRenderTime && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Last Render:</span>
                  <span className={metrics.componentRenderTime > 16 ? 'text-warning-600' : 'text-success-600'}>
                    {metrics.componentRenderTime.toFixed(1)}ms
                  </span>
                </div>
              )}
              
              {metrics.interactionTime && (
                <div className="flex justify-between">
                  <span className="text-neutral-600">Last Interaction:</span>
                  <span className={metrics.interactionTime > 100 ? 'text-warning-600' : 'text-success-600'}>
                    {metrics.interactionTime.toFixed(1)}ms
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-neutral-500 text-sm">
              No metrics available yet...
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-neutral-200">
            <div className="text-xs text-neutral-500">
              Thresholds: FCP &lt;1.5s, LCP &lt;2.5s, FID &lt;100ms, CLS &lt;0.1
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * HOC for measuring component performance
 */
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName = componentName || WrappedComponent.displayName || WrappedComponent.name || 'Component';

  const MeasuredComponent = (props: P) => {
    const { measureComponent } = usePerformance();

    return measureComponent(displayName, () => (
      <WrappedComponent {...props} />
    ));
  };

  MeasuredComponent.displayName = `withPerformanceMonitoring(${displayName})`;
  
  return MeasuredComponent;
}