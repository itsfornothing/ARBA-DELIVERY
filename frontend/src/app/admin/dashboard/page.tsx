'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { EnhancedAdminDashboard } from '@/components/molecules/EnhancedAdminDashboard';
import { DataVisualization } from '@/components/molecules/DataVisualization';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';

interface DashboardMetrics {
  total_users: number;
  total_customers: number;
  total_couriers: number;
  active_users: number;
  total_orders: number;
  pending_orders: number;
}

interface OrderStats {
  total_orders: number;
  pending_orders: number;
  assigned_orders: number;
  in_progress_orders: number;
  completed_orders: number;
}

interface CourierStats {
  total_couriers: number;
  available_couriers: number;
  average_workload: number;
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardMetrics | null>(null);
  const [orderStats, setOrderStats] = useState<OrderStats | null>(null);
  const [courierStats, setCourierStats] = useState<CourierStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch admin dashboard data
        const dashboardResponse = await apiClient.request<any>('/accounts/dashboard/admin/');
        if (dashboardResponse.data) {
          setDashboardData(dashboardResponse.data.dashboard_data);
        }

        // Fetch dispatch statistics for more detailed order and courier info
        const statsResponse = await apiClient.request<any>('/api/orders/orders/dispatch_statistics/');
        if (statsResponse.data) {
          setOrderStats(statsResponse.data.order_statistics);
          setCourierStats(statsResponse.data.courier_statistics);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card variant="outlined" className="border-error-200 bg-error-50">
        <CardContent>
          <Typography variant="body1" color="error">{error}</Typography>
        </CardContent>
      </Card>
    );
  }

  // Enhanced admin stats
  const enhancedStats = {
    totalUsers: dashboardData?.total_users || 0,
    totalOrders: orderStats?.total_orders || 0,
    activeOrders: orderStats?.pending_orders || 0,
    totalRevenue: 125000, // Mock data - would come from API
    activeCouriers: courierStats?.available_couriers || 0,
    totalCouriers: courierStats?.total_couriers || 0,
    averageDeliveryTime: 28, // Mock data - would come from API
    customerSatisfaction: 94, // Mock data - would come from API
  };

  // Mock recent activity data
  const recentActivity = [
    {
      id: '1',
      type: 'order' as const,
      message: 'New order #1234 placed by John Doe',
      timestamp: '2 minutes ago',
    },
    {
      id: '2',
      type: 'courier' as const,
      message: 'Courier Sarah Johnson went online',
      timestamp: '5 minutes ago',
    },
    {
      id: '3',
      type: 'user' as const,
      message: 'New customer registration: Mike Wilson',
      timestamp: '8 minutes ago',
    },
    {
      id: '4',
      type: 'order' as const,
      message: 'Order #1230 completed successfully',
      timestamp: '12 minutes ago',
    },
    {
      id: '5',
      type: 'courier' as const,
      message: 'Courier Alex Brown completed 5 deliveries today',
      timestamp: '15 minutes ago',
    },
  ];

  // Mock data for additional visualizations
  const orderTrendsData = [
    { label: 'Jan', value: 450 },
    { label: 'Feb', value: 520 },
    { label: 'Mar', value: 380 },
    { label: 'Apr', value: 680 },
    { label: 'May', value: 750 },
    { label: 'Jun', value: 620 },
  ];

  const courierPerformanceData = [
    { label: 'Excellent', value: 45, color: '#10B981' },
    { label: 'Good', value: 35, color: '#3B82F6' },
    { label: 'Average', value: 15, color: '#F59E0B' },
    { label: 'Poor', value: 5, color: '#EF4444' },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Dashboard */}
      <EnhancedAdminDashboard
        stats={enhancedStats}
        recentActivity={recentActivity}
      />

      {/* Additional Data Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Order Trends</CardTitle>
            <Typography variant="body2" color="muted">
              Monthly order volume over the last 6 months
            </Typography>
          </CardHeader>
          <CardContent>
            <DataVisualization
              title=""
              subtitle=""
              data={orderTrendsData}
              type="line"
              height={300}
            />
          </CardContent>
        </Card>
        
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Courier Performance</CardTitle>
            <Typography variant="body2" color="muted">
              Distribution of courier ratings
            </Typography>
          </CardHeader>
          <CardContent>
            <DataVisualization
              title=""
              subtitle=""
              data={courierPerformanceData}
              type="donut"
              height={300}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}