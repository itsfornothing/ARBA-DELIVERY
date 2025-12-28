'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformanceMonitoring } from '@/lib/performanceMonitor';
import { BundleAnalyzer, CodeSplitter, ResourceLoader } from '@/lib/bundleOptimization';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';

const DashboardContainer = styled(motion.div)`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
`;

const MetricCard = styled(Card)`
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MetricValue = styled.div<{ status: 'good' | 'warning' | 'error' }>`
  font-size: 2rem;
  font-weight: bold;
  color: ${({ status, theme }) => {
    switch (status) {
      case 'good': return theme.colors.success;
      case 'warning': return theme.colors.warning;
      case 'error': return theme.colors.error;
      default: return theme.colors.text;
    }
  }};
`;

const MetricLabel = styled(Typography)`
  color: ${({ theme }) => theme.colors.muted};
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const ProgressBar = styled.div<{ progress: number; status: 'good' | 'warning' | 'error' }>`
  width: 100%;
  height: 8px;
  background-color: ${({ theme }) => theme.colors.border};
  border-radius: 4px;
  overflow: hidden;
  
  &::after {
    content: '';
    display: block;
    width: ${({ progress }) => Math.min(100, Math.max(0, progress))}%;
    height: 100%;
    background-color: ${({ status, theme }) => {
      switch (status) {
        case 'good': return theme.colors.success;
        case 'warning': return theme.colors.warning;
        case 'error': return theme.colors.error;
        default: return theme.colors.primary;
      }
    }};
    transition: width 0.3s ease;
  }
`;

const RecommendationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const RecommendationItem = styled.li`
  padding: 0.75rem;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border-left: 4px solid ${({ theme }) => theme.colors.warning};
  font-size: 0.875rem;
`;

const ControlsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const ChartContainer = styled.div`
  height: 200px;
  display: flex;
  align-items: end;
  gap: 2px;
  padding: 1rem 0;
`;

const ChartBar = styled.div<{ height: number; color: string }>`
  flex: 1;
  background-color: ${({ color }) => color};
  height: ${({ height }) => height}%;
  min-height: 2px;
  border-radius: 2px 2px 0 0;
  transition: height 0.3s ease;
`;

interface PerformanceDashboardProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  className,
  autoRefresh = true,
  refreshInterval = 5000,
}) => {
  const { isMonitoring, metrics, startMonitoring, stopMonitoring, getAverageMetrics, getOptimizationSuggestions } = usePerformanceMonitoring(false);
  const [bundleAnalysis, setBundleAnalysis] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && isMonitoring) {
      const interval = setInterval(() => {
        updateRecommendations();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, isMonitoring]);

  const updateRecommendations = () => {
    const suggestions = getOptimizationSuggestions();
    setRecommendations(suggestions);
  };

  const analyzeBundlePerformance = async () => {
    setIsAnalyzing(true);
    try {
      const analysis = await BundleAnalyzer.analyzeBundlePerformance();
      setBundleAnalysis(analysis);
      
      const bundleRecommendations = BundleAnalyzer.getOptimizationRecommendations(analysis);
      setRecommendations(prev => [...prev, ...bundleRecommendations]);
    } catch (error) {
      console.error('Bundle analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getMetricStatus = (value: number, thresholds: { good: number; warning: number }): 'good' | 'warning' | 'error' => {
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.warning) return 'warning';
    return 'error';
  };

  const avgMetrics = getAverageMetrics(30000); // Last 30 seconds
  const chunkStats = CodeSplitter.getStats();
  const cacheStats = ResourceLoader.getCacheStats();

  // FPS status
  const fpsStatus = avgMetrics.fps ? getMetricStatus(60 - avgMetrics.fps, { good: 10, warning: 20 }) : 'good';
  
  // Frame time status (target: <16.67ms for 60fps)
  const frameTimeStatus = avgMetrics.frameTime ? getMetricStatus(avgMetrics.frameTime, { good: 16.67, warning: 33.33 }) : 'good';
  
  // Interaction latency status (target: <100ms)
  const latencyStatus = avgMetrics.interactionLatency ? getMetricStatus(avgMetrics.interactionLatency, { good: 100, warning: 300 }) : 'good';

  return (
    <DashboardContainer
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <ControlsContainer>
        <Button
          onClick={isMonitoring ? stopMonitoring : startMonitoring}
          variant={isMonitoring ? 'secondary' : 'primary'}
        >
          {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
        </Button>
        
        <Button
          onClick={analyzeBundlePerformance}
          disabled={isAnalyzing}
          variant="outline"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Bundle'}
        </Button>
        
        <Button
          onClick={updateRecommendations}
          variant="outline"
        >
          Refresh Recommendations
        </Button>
      </ControlsContainer>

      {/* FPS Metrics */}
      <MetricCard>
        <MetricLabel>Frame Rate (FPS)</MetricLabel>
        <MetricValue status={fpsStatus}>
          {avgMetrics.fps ? Math.round(avgMetrics.fps) : '--'}
        </MetricValue>
        <ProgressBar 
          progress={avgMetrics.fps ? (avgMetrics.fps / 60) * 100 : 0} 
          status={fpsStatus}
        />
        <Typography variant="caption">
          Target: 60 FPS for smooth animations
        </Typography>
      </MetricCard>

      {/* Frame Time */}
      <MetricCard>
        <MetricLabel>Frame Time (ms)</MetricLabel>
        <MetricValue status={frameTimeStatus}>
          {avgMetrics.frameTime ? avgMetrics.frameTime.toFixed(1) : '--'}
        </MetricValue>
        <ProgressBar 
          progress={avgMetrics.frameTime ? Math.min(100, (avgMetrics.frameTime / 33.33) * 100) : 0} 
          status={frameTimeStatus}
        />
        <Typography variant="caption">
          Target: &lt;16.67ms for 60 FPS
        </Typography>
      </MetricCard>

      {/* Interaction Latency */}
      <MetricCard>
        <MetricLabel>Interaction Latency (ms)</MetricLabel>
        <MetricValue status={latencyStatus}>
          {avgMetrics.interactionLatency ? avgMetrics.interactionLatency.toFixed(1) : '--'}
        </MetricValue>
        <ProgressBar 
          progress={avgMetrics.interactionLatency ? Math.min(100, (avgMetrics.interactionLatency / 300) * 100) : 0} 
          status={latencyStatus}
        />
        <Typography variant="caption">
          Target: &lt;100ms for responsive feel
        </Typography>
      </MetricCard>

      {/* Memory Usage */}
      {avgMetrics.memoryUsage && (
        <MetricCard>
          <MetricLabel>Memory Usage (MB)</MetricLabel>
          <MetricValue status={avgMetrics.memoryUsage > 100 ? 'warning' : 'good'}>
            {avgMetrics.memoryUsage.toFixed(1)}
          </MetricValue>
          <ProgressBar 
            progress={Math.min(100, (avgMetrics.memoryUsage / 200) * 100)} 
            status={avgMetrics.memoryUsage > 100 ? 'warning' : 'good'}
          />
          <Typography variant="caption">
            JavaScript heap usage
          </Typography>
        </MetricCard>
      )}

      {/* Code Splitting Stats */}
      <MetricCard>
        <MetricLabel>Code Splitting</MetricLabel>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="body2">Loaded: {chunkStats.loaded}</Typography>
            <Typography variant="body2">Preloaded: {chunkStats.preloaded}</Typography>
            <Typography variant="body2">Loading: {chunkStats.loading}</Typography>
          </div>
          <MetricValue status="good">
            {chunkStats.loaded + chunkStats.preloaded}
          </MetricValue>
        </div>
      </MetricCard>

      {/* Cache Performance */}
      <MetricCard>
        <MetricLabel>Cache Performance</MetricLabel>
        <MetricValue status={cacheStats.hitRate > 0.8 ? 'good' : 'warning'}>
          {(cacheStats.hitRate * 100).toFixed(1)}%
        </MetricValue>
        <ProgressBar 
          progress={cacheStats.hitRate * 100} 
          status={cacheStats.hitRate > 0.8 ? 'good' : 'warning'}
        />
        <Typography variant="caption">
          Cache entries: {cacheStats.size}
        </Typography>
      </MetricCard>

      {/* Bundle Analysis */}
      {bundleAnalysis && (
        <MetricCard>
          <MetricLabel>Bundle Analysis</MetricLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Typography variant="body2">
              Total Size: {(bundleAnalysis.totalSize / 1024).toFixed(1)} KB
            </Typography>
            <Typography variant="body2">
              Gzipped: {(bundleAnalysis.gzippedSize / 1024).toFixed(1)} KB
            </Typography>
            <Typography variant="body2">
              Load Time: {bundleAnalysis.loadTime.toFixed(0)}ms
            </Typography>
            <Typography variant="body2">
              Chunks: {bundleAnalysis.chunks.length}
            </Typography>
          </div>
        </MetricCard>
      )}

      {/* Performance Chart */}
      {metrics.length > 0 && (
        <MetricCard style={{ gridColumn: '1 / -1' }}>
          <MetricLabel>FPS History (Last {metrics.length} samples)</MetricLabel>
          <ChartContainer>
            {metrics.slice(-20).map((metric, index) => (
              <ChartBar
                key={index}
                height={(metric.fps / 60) * 100}
                color={metric.fps >= 50 ? '#10B981' : metric.fps >= 30 ? '#F59E0B' : '#EF4444'}
              />
            ))}
          </ChartContainer>
        </MetricCard>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <MetricCard style={{ gridColumn: '1 / -1' }}>
          <MetricLabel>Performance Recommendations</MetricLabel>
          <RecommendationList>
            <AnimatePresence>
              {recommendations.map((recommendation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <RecommendationItem>
                    {recommendation}
                  </RecommendationItem>
                </motion.div>
              ))}
            </AnimatePresence>
          </RecommendationList>
        </MetricCard>
      )}
    </DashboardContainer>
  );
};

export default PerformanceDashboard;