'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface DataVisualizationProps {
  title: string;
  subtitle?: string;
  data: ChartData[];
  type: 'bar' | 'line' | 'donut' | 'area';
  height?: number;
  showLegend?: boolean;
  animated?: boolean;
}

const ChartContainer = styled.div<{ $height: number }>`
  height: ${({ $height }) => $height}px;
  position: relative;
  margin: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px 0;
`;

const BarChart = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-around;
  height: 100%;
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.surface}, transparent);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
`;

const Bar = styled(motion.div)<{ $height: number; $color: string }>`
  flex: 1;
  max-width: 40px;
  margin: 0 ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
  background: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius.small} ${({ theme }) => theme.borderRadius.small} 0 0;
  height: ${({ $height }) => $height}%;
  min-height: 8px;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: 8px;
    height: 8px;
    background: ${({ $color }) => $color};
    border-radius: 50%;
    opacity: 0.8;
  }
`;

const LineChart = styled.svg`
  width: 100%;
  height: 100%;
`;

const DonutChart = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
`;

const DonutSvg = styled.svg`
  transform: rotate(-90deg);
`;

const DonutSegment = styled(motion.circle)<{ $color: string }>`
  fill: none;
  stroke: ${({ $color }) => $color};
  stroke-width: 20;
  stroke-linecap: round;
`;

const DonutCenter = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
`;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  margin-top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  padding-top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
`;

const LegendColor = styled.div<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
`;

const AreaChart = styled.div`
  height: 100%;
  position: relative;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.surface}, transparent);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  overflow: hidden;
`;

const AreaPath = styled(motion.path)<{ $color: string }>`
  fill: ${({ $color }) => $color}30;
  stroke: ${({ $color }) => $color};
  stroke-width: 3;
`;

const defaultColors = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', 
  '#6366F1', '#8B5CF6', '#EC4899', '#06B6D4'
];

export const DataVisualization: React.FC<DataVisualizationProps> = ({
  title,
  subtitle,
  data,
  type,
  height = 300,
  showLegend = true,
  animated = true,
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);
  
  // Assign colors if not provided
  const coloredData = data.map((item, index) => ({
    ...item,
    color: item.color || defaultColors[index % defaultColors.length],
  }));

  const renderBarChart = () => (
    <BarChart>
      {coloredData.map((item, index) => (
        <Bar
          key={`${item.label}-${index}`}
          $height={(item.value / maxValue) * 100}
          $color={item.color!}
          initial={animated ? { height: 0 } : undefined}
          animate={animated ? { height: `${(item.value / maxValue) * 100}%` } : undefined}
          transition={animated ? { delay: index * 0.1, duration: 0.6 } : undefined}
        />
      ))}
    </BarChart>
  );

  const renderLineChart = () => {
    const width = 400;
    const chartHeight = height - 40;
    const points = coloredData.map((item, index) => ({
      x: (index / (coloredData.length - 1)) * (width - 40) + 20,
      y: chartHeight - (item.value / maxValue) * (chartHeight - 40) + 20,
    }));

    const pathData = points.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '');

    return (
      <LineChart viewBox={`0 0 ${width} ${height}`}>
        <motion.path
          d={pathData}
          fill="none"
          stroke={coloredData[0]?.color || defaultColors[0]}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={animated ? { pathLength: 0 } : undefined}
          animate={animated ? { pathLength: 1 } : undefined}
          transition={animated ? { duration: 1.5, ease: "easeInOut" } : undefined}
        />
        {points.map((point, index) => (
          <motion.circle
            key={index}
            cx={point.x}
            cy={point.y}
            r="4"
            fill={coloredData[index]?.color || defaultColors[0]}
            initial={animated ? { scale: 0 } : undefined}
            animate={animated ? { scale: 1 } : undefined}
            transition={animated ? { delay: index * 0.1 + 0.5, duration: 0.3 } : undefined}
          />
        ))}
      </LineChart>
    );
  };

  const renderDonutChart = () => {
    const radius = 80;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercentage = 0;

    return (
      <DonutChart>
        <DonutSvg width="200" height="200">
          {coloredData.map((item, index) => {
            const percentage = (item.value / total) * 100;
            const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -cumulativePercentage * (circumference / 100);
            
            cumulativePercentage += percentage;

            return (
              <DonutSegment
                key={`${item.label}-${index}`}
                cx="100"
                cy="100"
                r={radius}
                $color={item.color!}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                initial={animated ? { strokeDasharray: `0 ${circumference}` } : undefined}
                animate={animated ? { strokeDasharray } : undefined}
                transition={animated ? { delay: index * 0.2, duration: 0.8 } : undefined}
              />
            );
          })}
        </DonutSvg>
        <DonutCenter>
          <Typography variant="h4" color="primary" weight="bold">
            {total.toLocaleString()}
          </Typography>
          <Typography variant="caption" color="muted">
            Total
          </Typography>
        </DonutCenter>
      </DonutChart>
    );
  };

  const renderAreaChart = () => {
    const width = 400;
    const chartHeight = height - 40;
    const points = coloredData.map((item, index) => ({
      x: (index / (coloredData.length - 1)) * (width - 40) + 20,
      y: chartHeight - (item.value / maxValue) * (chartHeight - 40) + 20,
    }));

    const pathData = points.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`);
    }, '') + ` L ${points[points.length - 1].x} ${chartHeight + 20} L ${points[0].x} ${chartHeight + 20} Z`;

    return (
      <AreaChart>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
          <AreaPath
            d={pathData}
            $color={coloredData[0]?.color || defaultColors[0]}
            initial={animated ? { pathLength: 0, opacity: 0 } : undefined}
            animate={animated ? { pathLength: 1, opacity: 1 } : undefined}
            transition={animated ? { duration: 1.2, ease: "easeInOut" } : undefined}
          />
        </svg>
      </AreaChart>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'donut':
        return renderDonutChart();
      case 'area':
        return renderAreaChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <Card variant="default" padding="lg">
      <Typography variant="h4" color="primary" weight="semibold">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="muted">
          {subtitle}
        </Typography>
      )}
      
      <ChartContainer $height={height}>
        {renderChart()}
      </ChartContainer>

      {showLegend && (
        <Legend>
          {coloredData.map((item, index) => (
            <LegendItem key={`${item.label}-${index}`}>
              <LegendColor $color={item.color!} />
              <Typography variant="caption" color="primary">
                {item.label}: {item.value.toLocaleString()}
              </Typography>
            </LegendItem>
          ))}
        </Legend>
      )}
    </Card>
  );
};