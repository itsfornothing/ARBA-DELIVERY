'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';

interface CourierStats {
  activeOrders: number;
  completedOrders: number;
  totalEarnings: number;
  todayEarnings: number;
  averageRating: number;
  totalDeliveries: number;
}

interface CourierDashboardProps {
  stats: CourierStats;
  isAvailable: boolean;
  onToggleAvailability: () => void;
  courierName: string;
}

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  margin-bottom: ${({ theme }) => theme.spacing.scale[8] * theme.spacing.unit}px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  margin-bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

const StatCard = styled(Card)`
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.secondary});
  }
`;

const StatContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const StatIcon = styled.div<{ $color: string }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background: ${({ $color }) => $color}20;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
`;

const StatValue = styled.div`
  text-align: right;
`;

const StatusIndicator = styled.div<{ $isAvailable: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  
  &::before {
    content: '';
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ $isAvailable, theme }) => 
      $isAvailable ? theme.colors.success : theme.colors.error};
    animation: ${({ $isAvailable }) => $isAvailable ? 'pulse 2s infinite' : 'none'};
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;

const EarningsChart = styled.div`
  height: 120px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.success}10, ${({ theme }) => theme.colors.primary}10);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  display: flex;
  align-items: end;
  justify-content: space-around;
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  margin-top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const ChartBar = styled(motion.div)<{ $height: number; $color: string }>`
  width: 24px;
  background: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius.small} ${({ theme }) => theme.borderRadius.small} 0 0;
  height: ${({ $height }) => $height}%;
  min-height: 8px;
`;

const ActionButton = styled(Button)<{ $variant: 'online' | 'offline' }>`
  background: ${({ $variant, theme }) => 
    $variant === 'online' ? theme.colors.success : theme.colors.error};
  
  &:hover {
    background: ${({ $variant, theme }) => 
      $variant === 'online' ? theme.colors.success + 'dd' : theme.colors.error + 'dd'};
  }
`;

export const EnhancedCourierDashboard: React.FC<CourierDashboardProps> = ({
  stats,
  isAvailable,
  onToggleAvailability,
  courierName,
}) => {
  const chartData = [65, 45, 80, 55, 90, 70, 85]; // Mock weekly data

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Card */}
      <Card variant="elevated" padding="large" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Typography variant="h2" color="text">
              Welcome back, {courierName}!
            </Typography>
            <Typography variant="body" color="muted">
              Ready to make some deliveries today?
            </Typography>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <StatusIndicator $isAvailable={isAvailable}>
              <Typography variant="body" weight="medium">
                {isAvailable ? 'Available' : 'Offline'}
              </Typography>
            </StatusIndicator>
            
            <ActionButton
              $variant={isAvailable ? 'offline' : 'online'}
              onClick={onToggleAvailability}
            >
              {isAvailable ? 'Go Offline' : 'Go Online'}
            </ActionButton>
          </div>
        </div>
      </Card>

      {/* Statistics Grid */}
      <StatsGrid>
        <StatCard variant="default" padding="medium" interactive>
          <StatContent>
            <div>
              <Typography variant="caption" color="muted">
                Active Orders
              </Typography>
              <StatValue>
                <Typography variant="h3" color="primary" weight="bold">
                  {stats.activeOrders}
                </Typography>
              </StatValue>
            </div>
            <StatIcon $color="#3B82F6">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </StatIcon>
          </StatContent>
        </StatCard>

        <StatCard variant="default" padding="medium" interactive>
          <StatContent>
            <div>
              <Typography variant="caption" color="muted">
                Completed Today
              </Typography>
              <StatValue>
                <Typography variant="h3" color="success" weight="bold">
                  {stats.completedOrders}
                </Typography>
              </StatValue>
            </div>
            <StatIcon $color="#10B981">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M5 13l4 4L19 7" />
              </svg>
            </StatIcon>
          </StatContent>
        </StatCard>

        <StatCard variant="default" padding="medium" interactive>
          <StatContent>
            <div>
              <Typography variant="caption" color="muted">
                Today's Earnings
              </Typography>
              <StatValue>
                <Typography variant="h3" color="warning" weight="bold">
                  ${stats.todayEarnings.toFixed(2)}
                </Typography>
              </StatValue>
            </div>
            <StatIcon $color="#F59E0B">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </StatIcon>
          </StatContent>
        </StatCard>

        <StatCard variant="default" padding="medium" interactive>
          <StatContent>
            <div>
              <Typography variant="caption" color="muted">
                Average Rating
              </Typography>
              <StatValue>
                <Typography variant="h3" color="secondary" weight="bold">
                  {stats.averageRating.toFixed(1)} ⭐
                </Typography>
              </StatValue>
            </div>
            <StatIcon $color="#6366F1">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </StatIcon>
          </StatContent>
        </StatCard>
      </StatsGrid>

      {/* Performance Chart */}
      <Card variant="elevated" padding="large">
        <Typography variant="h4" color="text" weight="semibold">
          Weekly Performance
        </Typography>
        <Typography variant="body" color="muted">
          Your delivery performance over the last 7 days
        </Typography>
        
        <EarningsChart>
          {chartData.map((height, index) => (
            <ChartBar
              key={index}
              $height={height}
              $color={index === chartData.length - 1 ? '#10B981' : '#3B82F6'}
              initial={{ height: 0 }}
              animate={{ height: `${height}%` }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
            />
          ))}
        </EarningsChart>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid #E2E8F0'
        }}>
          <div>
            <Typography variant="caption" color="muted">
              Total Earnings
            </Typography>
            <Typography variant="h4" color="success" weight="bold">
              ${stats.totalEarnings.toFixed(2)}
            </Typography>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Typography variant="caption" color="muted">
              Total Deliveries
            </Typography>
            <Typography variant="h4" color="primary" weight="bold">
              {stats.totalDeliveries}
            </Typography>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};