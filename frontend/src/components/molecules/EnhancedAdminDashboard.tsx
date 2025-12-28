'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  activeCouriers: number;
  totalCouriers: number;
  averageDeliveryTime: number;
  customerSatisfaction: number;
}

interface AdminDashboardProps {
  stats: AdminStats;
  recentActivity: Array<{
    id: string;
    type: 'order' | 'user' | 'courier';
    message: string;
    timestamp: string;
  }>;
}

const DashboardContainer = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled(Card)<{ $accentColor: string }>`
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${({ $accentColor }) => $accentColor};
  }
`;

const MetricContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const MetricIcon = styled.div<{ $bgColor: string; $iconColor: string }>`
  width: 56px;
  height: 56px;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  background: ${({ $bgColor }) => $bgColor};
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $iconColor }) => $iconColor};
`;

const MetricDetails = styled.div`
  text-align: right;
  flex: 1;
  margin-left: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const ProgressBar = styled.div<{ $progress: number; $color: string }>`
  width: 100%;
  height: 8px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
  margin-top: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $progress }) => $progress}%;
    background: ${({ $color }) => $color};
    border-radius: inherit;
    transition: width 0.5s ease;
  }
`;

const ActivityList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const ActivityItem = styled(motion.div)<{ $type: 'order' | 'user' | 'courier' }>`
  display: flex;
  align-items: center;
  padding: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-bottom: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  background: ${({ theme }) => theme.colors.surface};
  border-left: 4px solid ${({ $type, theme }) => 
    $type === 'order' ? theme.colors.primary :
    $type === 'user' ? theme.colors.success :
    theme.colors.warning
  };
`;

const ActivityIcon = styled.div<{ $type: 'order' | 'user' | 'courier' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${({ $type, theme }) => 
    $type === 'order' ? theme.colors.primary + '20' :
    $type === 'user' ? theme.colors.success + '20' :
    theme.colors.warning + '20'
  };
  color: ${({ $type, theme }) => 
    $type === 'order' ? theme.colors.primary :
    $type === 'user' ? theme.colors.success :
    theme.colors.warning
  };
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
`;

const RevenueChart = styled.div`
  height: 200px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}10, ${({ theme }) => theme.colors.secondary}10);
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  display: flex;
  align-items: end;
  justify-content: space-around;
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  margin-top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const ChartBar = styled(motion.div)<{ $height: number }>`
  width: 32px;
  background: linear-gradient(to top, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.secondary});
  border-radius: ${({ theme }) => theme.borderRadius.small} ${({ theme }) => theme.borderRadius.small} 0 0;
  height: ${({ $height }) => $height}%;
  min-height: 12px;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  margin-top: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

const ActionCard = styled(Card)`
  text-align: center;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast}ms ${({ theme }) => theme.animations.easing.easeOut};
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: ${({ theme }) => theme.shadows.large};
  }
`;

export const EnhancedAdminDashboard: React.FC<AdminDashboardProps> = ({
  stats,
  recentActivity,
}) => {
  const revenueData = [85, 92, 78, 96, 88, 94, 100]; // Mock monthly data
  
  const getActivityIcon = (type: 'order' | 'user' | 'courier') => {
    switch (type) {
      case 'order':
        return (
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'user':
        return (
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'courier':
        return (
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  return (
    <DashboardContainer>
      {/* Header */}
      <Card variant="elevated" padding="large">
        <Typography variant="h1" color="text">
          Admin Dashboard
        </Typography>
        <Typography variant="body" color="muted">
          Monitor your delivery platform's performance and key metrics
        </Typography>
      </Card>

      {/* Key Metrics */}
      <MetricsGrid>
        <MetricCard variant="default" padding="medium" $accentColor="#3B82F6" interactive>
          <MetricContent>
            <MetricIcon $bgColor="#3B82F620" $iconColor="#3B82F6">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </MetricIcon>
            <MetricDetails>
              <Typography variant="caption" color="muted">
                Total Users
              </Typography>
              <Typography variant="h3" color="primary" weight="bold">
                {stats.totalUsers.toLocaleString()}
              </Typography>
              <ProgressBar $progress={85} $color="#3B82F6" />
            </MetricDetails>
          </MetricContent>
        </MetricCard>

        <MetricCard variant="default" padding="medium" $accentColor="#10B981" interactive>
          <MetricContent>
            <MetricIcon $bgColor="#10B98120" $iconColor="#10B981">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </MetricIcon>
            <MetricDetails>
              <Typography variant="caption" color="muted">
                Total Orders
              </Typography>
              <Typography variant="h3" color="success" weight="bold">
                {stats.totalOrders.toLocaleString()}
              </Typography>
              <ProgressBar $progress={92} $color="#10B981" />
            </MetricDetails>
          </MetricContent>
        </MetricCard>

        <MetricCard variant="default" padding="medium" $accentColor="#F59E0B" interactive>
          <MetricContent>
            <MetricIcon $bgColor="#F59E0B20" $iconColor="#F59E0B">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
              </svg>
            </MetricIcon>
            <MetricDetails>
              <Typography variant="caption" color="muted">
                Total Revenue
              </Typography>
              <Typography variant="h3" color="warning" weight="bold">
                ${stats.totalRevenue.toLocaleString()}
              </Typography>
              <ProgressBar $progress={78} $color="#F59E0B" />
            </MetricDetails>
          </MetricContent>
        </MetricCard>

        <MetricCard variant="default" padding="medium" $accentColor="#6366F1" interactive>
          <MetricContent>
            <MetricIcon $bgColor="#6366F120" $iconColor="#6366F1">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </MetricIcon>
            <MetricDetails>
              <Typography variant="caption" color="muted">
                Active Couriers
              </Typography>
              <Typography variant="h3" color="secondary" weight="bold">
                {stats.activeCouriers}/{stats.totalCouriers}
              </Typography>
              <ProgressBar 
                $progress={(stats.activeCouriers / stats.totalCouriers) * 100} 
                $color="#6366F1" 
              />
            </MetricDetails>
          </MetricContent>
        </MetricCard>
      </MetricsGrid>

      {/* Charts and Activity */}
      <ChartsGrid>
        {/* Revenue Chart */}
        <Card variant="elevated" padding="large">
          <Typography variant="h4" color="text" weight="semibold">
            Revenue Analytics
          </Typography>
          <Typography variant="body" color="muted">
            Monthly revenue performance over the last 7 months
          </Typography>
          
          <RevenueChart>
            {revenueData.map((height, index) => (
              <ChartBar
                key={index}
                $height={height}
                initial={{ height: 0 }}
                animate={{ height: `${height}%` }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              />
            ))}
          </RevenueChart>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #E2E8F0'
          }}>
            <div>
              <Typography variant="caption" color="muted">
                Avg. Delivery Time
              </Typography>
              <Typography variant="h4" color="primary" weight="bold">
                {stats.averageDeliveryTime} min
              </Typography>
            </div>
            <div>
              <Typography variant="caption" color="muted">
                Customer Satisfaction
              </Typography>
              <Typography variant="h4" color="success" weight="bold">
                {stats.customerSatisfaction}%
              </Typography>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card variant="default" padding="large">
          <Typography variant="h4" color="text" weight="semibold">
            Recent Activity
          </Typography>
          <Typography variant="body" color="muted">
            Latest system events and updates
          </Typography>
          
          <ActivityList style={{ marginTop: '16px' }}>
            {recentActivity.map((activity, index) => (
              <ActivityItem
                key={activity.id}
                $type={activity.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ActivityIcon $type={activity.type}>
                  {getActivityIcon(activity.type)}
                </ActivityIcon>
                <div style={{ flex: 1 }}>
                  <Typography variant="caption" color="text" weight="medium">
                    {activity.message}
                  </Typography>
                  <Typography variant="caption" color="muted" style={{ display: 'block', marginTop: '4px' }}>
                    {activity.timestamp}
                  </Typography>
                </div>
              </ActivityItem>
            ))}
          </ActivityList>
        </Card>
      </ChartsGrid>

      {/* Quick Actions */}
      <Card variant="default" padding="large">
        <Typography variant="h4" color="text" weight="semibold">
          Quick Actions
        </Typography>
        
        <QuickActions>
          <ActionCard variant="outlined" padding="medium" interactive>
            <Typography variant="h6" color="primary" weight="semibold">
              📊 View Reports
            </Typography>
            <Typography variant="caption" color="muted">
              Detailed analytics and insights
            </Typography>
          </ActionCard>
          
          <ActionCard variant="outlined" padding="medium" interactive>
            <Typography variant="h6" color="success" weight="semibold">
              👥 Manage Users
            </Typography>
            <Typography variant="caption" color="muted">
              Add, edit, or remove users
            </Typography>
          </ActionCard>
          
          <ActionCard variant="outlined" padding="medium" interactive>
            <Typography variant="h6" color="warning" weight="semibold">
              🚚 Monitor Orders
            </Typography>
            <Typography variant="caption" color="muted">
              Track and manage deliveries
            </Typography>
          </ActionCard>
          
          <ActionCard variant="outlined" padding="medium" interactive>
            <Typography variant="h6" color="secondary" weight="semibold">
              ⚙️ System Settings
            </Typography>
            <Typography variant="caption" color="muted">
              Configure platform settings
            </Typography>
          </ActionCard>
        </QuickActions>
      </Card>
    </DashboardContainer>
  );
};