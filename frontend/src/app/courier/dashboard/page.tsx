'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api';
import { EnhancedCourierDashboard } from '@/components/molecules/EnhancedCourierDashboard';
import { DataVisualization } from '@/components/molecules/DataVisualization';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';

interface CourierProfile {
  profile: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
  };
  courier_status: {
    is_available: boolean;
    current_orders_count: number;
    location_description: string;
    last_activity: string;
  };
  statistics: {
    total_completed_orders: number;
    current_active_orders: number;
    current_orders: any[];
  };
}

interface AvailableOrder {
  id: number;
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  price: number;
  created_at: string;
  customer_name: string;
}

export default function CourierDashboard() {
  const [isAcceptingOrder, setIsAcceptingOrder] = useState<number | null>(null);

  // Fetch courier profile and statistics
  const { data: courierProfile, isLoading: profileLoading, refetch: refetchProfile } = useQuery<CourierProfile>({
    queryKey: ['courier-profile'],
    queryFn: async () => {
      const response = await apiClient.request<CourierProfile>('/api/orders/courier-status/my_profile/');
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });

  // Fetch available orders
  const { data: availableOrders, isLoading: ordersLoading, refetch: refetchOrders } = useQuery<AvailableOrder[]>({
    queryKey: ['available-orders'],
    queryFn: async () => {
      const response = await apiClient.request<AvailableOrder[]>('/api/orders/orders/available_orders/');
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });

  const handleAcceptOrder = async (orderId: number) => {
    setIsAcceptingOrder(orderId);
    try {
      const response = await apiClient.request(`/api/orders/orders/${orderId}/accept_order/`, {
        method: 'POST',
      });
      
      if (response.error) {
        alert(`Error accepting order: ${response.error}`);
        return;
      }
      
      // Refresh data
      await Promise.all([refetchProfile(), refetchOrders()]);
      alert('Order accepted successfully!');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    } finally {
      setIsAcceptingOrder(null);
    }
  };

  const toggleAvailability = async () => {
    if (!courierProfile) return;
    
    try {
      const response = await apiClient.request('/api/orders/courier-status/update_availability/', {
        method: 'PATCH',
        body: JSON.stringify({
          is_available: !courierProfile.courier_status.is_available
        }),
      });
      
      if (response.error) {
        alert(`Error updating availability: ${response.error}`);
        return;
      }
      
      refetchProfile();
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-secondary-600"></div>
      </div>
    );
  }

  // Enhanced dashboard stats
  const enhancedStats = {
    activeOrders: courierProfile?.statistics?.current_active_orders || 0,
    completedOrders: courierProfile?.statistics?.total_completed_orders || 0,
    totalEarnings: 2450.75, // Mock data - would come from API
    todayEarnings: 125.50, // Mock data - would come from API
    averageRating: 4.8, // Mock data - would come from API
    totalDeliveries: courierProfile?.statistics?.total_completed_orders || 0,
  };

  // Mock performance data for visualization
  const performanceData = [
    { label: 'Mon', value: 8 },
    { label: 'Tue', value: 12 },
    { label: 'Wed', value: 6 },
    { label: 'Thu', value: 15 },
    { label: 'Fri', value: 10 },
    { label: 'Sat', value: 18 },
    { label: 'Sun', value: 14 },
  ];

  const earningsData = [
    { label: 'Week 1', value: 450 },
    { label: 'Week 2', value: 520 },
    { label: 'Week 3', value: 380 },
    { label: 'Week 4', value: 680 },
  ];

  return (
    <div className="space-y-6">
      {/* Enhanced Dashboard */}
      <EnhancedCourierDashboard
        stats={enhancedStats}
        isAvailable={courierProfile?.courier_status.is_available || false}
        onToggleAvailability={toggleAvailability}
        courierName={courierProfile?.profile.first_name || courierProfile?.profile.username || 'Courier'}
      />

      {/* Data Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Weekly Deliveries</CardTitle>
            <Typography variant="body2" color="muted">
              Number of deliveries completed each day this week
            </Typography>
          </CardHeader>
          <CardContent>
            <DataVisualization
              title=""
              subtitle=""
              data={performanceData}
              type="bar"
              height={250}
            />
          </CardContent>
        </Card>
        
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <Typography variant="body2" color="muted">
              Earnings breakdown by week
            </Typography>
          </CardHeader>
          <CardContent>
            <DataVisualization
              title=""
              subtitle=""
              data={earningsData}
              type="area"
              height={250}
            />
          </CardContent>
        </Card>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 bg-info-100 rounded-lg">
                <svg className="w-6 h-6 text-info-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <Typography variant="caption" color="muted">Active Orders</Typography>
                <Typography variant="h4" className="mb-0">
                  {courierProfile?.statistics.current_active_orders || 0}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-lg">
                <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <Typography variant="caption" color="muted">Completed Orders</Typography>
                <Typography variant="h4" className="mb-0">
                  {courierProfile?.statistics.total_completed_orders || 0}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-lg">
                <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <Typography variant="caption" color="muted">Available Orders</Typography>
                <Typography variant="h4" className="mb-0">
                  {availableOrders?.length || 0}
                </Typography>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Active Orders */}
      {courierProfile?.statistics.current_orders && courierProfile.statistics.current_orders.length > 0 && (
        <Card variant="elevated">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Current Active Orders</CardTitle>
              <Button
                as={Link}
                href="/courier/orders"
                variant="ghost"
                size="sm"
              >
                View All →
              </Button>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {courierProfile.statistics.current_orders.slice(0, 3).map((order: any) => (
                <Card key={order.id} variant="outlined" className="border-neutral-200">
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Typography variant="body2" weight="medium">Order #{order.id}</Typography>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            order.status === 'ASSIGNED' ? 'bg-info-100 text-info-800' :
                            order.status === 'PICKED_UP' ? 'bg-warning-100 text-warning-800' :
                            order.status === 'IN_TRANSIT' ? 'bg-secondary-100 text-secondary-800' :
                            'bg-neutral-100 text-neutral-800'
                          }`}>
                            {order.status.replace('_', ' ')}
                          </span>
                        </div>
                        <Typography variant="body2" color="muted" className="mb-1">
                          <strong>From:</strong> {order.pickup_address}
                        </Typography>
                        <Typography variant="body2" color="muted" className="mb-1">
                          <strong>To:</strong> {order.delivery_address}
                        </Typography>
                        <Typography variant="body2" color="muted">
                          <strong>Distance:</strong> {order.distance_km} km • <strong>Price:</strong> ${order.price}
                        </Typography>
                      </div>
                      
                      <Button
                        as={Link}
                        href={`/courier/orders/${order.id}`}
                        variant="primary"
                        size="sm"
                      >
                        Manage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Orders */}
      <Card variant="elevated">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Available Orders</CardTitle>
            <Button
              as={Link}
              href="/courier/available"
              variant="ghost"
              size="sm"
            >
              View All →
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {ordersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary-600"></div>
            </div>
          ) : availableOrders && availableOrders.length > 0 ? (
            <div className="space-y-4">
              {availableOrders.slice(0, 3).map((order) => (
                <Card key={order.id} variant="outlined" className="border-neutral-200">
                  <CardContent>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Typography variant="body2" weight="medium">Order #{order.id}</Typography>
                          <Typography variant="caption" color="muted">
                            {new Date(order.created_at).toLocaleString()}
                          </Typography>
                        </div>
                        <Typography variant="body2" color="muted" className="mb-1">
                          <strong>From:</strong> {order.pickup_address}
                        </Typography>
                        <Typography variant="body2" color="muted" className="mb-1">
                          <strong>To:</strong> {order.delivery_address}
                        </Typography>
                        <Typography variant="body2" color="muted" className="mb-2">
                          <strong>Customer:</strong> {order.customer_name}
                        </Typography>
                        <Typography variant="body2" weight="medium">
                          Distance: {order.distance_km} km • Price: ${order.price}
                        </Typography>
                      </div>
                      
                      <Button
                        onClick={() => handleAcceptOrder(order.id)}
                        disabled={isAcceptingOrder === order.id || !courierProfile?.courier_status.is_available}
                        variant="primary"
                        size="sm"
                        loading={isAcceptingOrder === order.id}
                      >
                        {isAcceptingOrder === order.id ? 'Accepting...' : 'Accept Order'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <Typography variant="h6" className="mt-2">No available orders</Typography>
              <Typography variant="body2" color="muted" className="mt-1">
                Check back later for new delivery opportunities.
              </Typography>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}