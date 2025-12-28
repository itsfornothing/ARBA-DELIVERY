'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, realTimeTracker, type TrackingData, type RealTimeUpdates } from '@/lib/api';
import { ArrowLeft, Package, CheckCircle, Truck, Clock } from 'lucide-react';
import { EnhancedOrderTracking } from '@/components/molecules/EnhancedOrderTracking';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';

export default function OrderTrackingPage() {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    
    if (!token || userRole !== 'CUSTOMER') {
      router.push('/auth/login');
      return;
    }
    
    apiClient.setAuthToken(token);
    loadTrackingData();
    
    // Subscribe to real-time updates
    const handleRealTimeUpdate = (updates: RealTimeUpdates) => {
      // Reload tracking data if this order was updated
      const updatedOrder = updates.orders.find(order => order.id.toString() === orderId);
      if (updatedOrder) {
        loadTrackingData();
      }
    };
    
    realTimeTracker.subscribe(handleRealTimeUpdate);
    
    return () => {
      realTimeTracker.unsubscribe(handleRealTimeUpdate);
    };
  }, [router, orderId]);

  const loadTrackingData = async () => {
    if (!orderId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getOrderTracking(parseInt(orderId));
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setTrackingData(response.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tracking data');
    } finally {
      setIsLoading(false);
    }
  };

  // Transform tracking data for enhanced component
  const transformTrackingSteps = (steps: any[]) => {
    const iconMap = {
      'CREATED': Package,
      'ASSIGNED': CheckCircle,
      'PICKED_UP': Package,
      'IN_TRANSIT': Truck,
      'DELIVERED': CheckCircle
    };

    return steps.map(step => ({
      ...step,
      icon: iconMap[step.status as keyof typeof iconMap] || Package,
      description: getStepDescription(step.status)
    }));
  };

  const getStepDescription = (status: string) => {
    switch (status) {
      case 'CREATED':
        return 'Your order has been created and is waiting for courier assignment.';
      case 'ASSIGNED':
        return 'A courier has been assigned and is heading to the pickup location.';
      case 'PICKED_UP':
        return 'Your order has been picked up and is ready for delivery.';
      case 'IN_TRANSIT':
        return 'Your order is on the way to the delivery location.';
      case 'DELIVERED':
        return 'Your order has been successfully delivered!';
      default:
        return 'Order status is being updated.';
    }
  };

  if (isLoading) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
          <Card className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <Typography variant="body1" color="muted" className="mb-0">
              Loading order tracking...
            </Typography>
          </Card>
        </div>
      </ThemeProvider>
    );
  }

  if (error || !trackingData) {
    return (
      <ThemeProvider>
        <div className="min-h-screen bg-neutral-50">
          <header className="bg-white shadow-soft border-b border-neutral-200">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center h-16">
                <Button
                  as={Link}
                  href="/customer/dashboard"
                  variant="ghost"
                  size="sm"
                  leftIcon={<ArrowLeft className="h-5 w-5" />}
                >
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </header>
          
          <main className="max-w-4xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            <Card variant="outlined" className="border-error-200 bg-error-50">
              <Typography variant="body1" color="error" className="mb-0">
                {error || 'Order not found'}
              </Typography>
            </Card>
          </main>
        </div>
      </ThemeProvider>
    );
  }

  const { order, progress_percentage, tracking_steps } = trackingData;
  const enhancedTrackingSteps = transformTrackingSteps(tracking_steps);

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-white shadow-soft border-b border-neutral-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Button
                as={Link}
                href="/customer/dashboard"
                variant="ghost"
                size="sm"
                leftIcon={<ArrowLeft className="h-5 w-5" />}
                className="mr-4"
              >
                Back to Dashboard
              </Button>
              <Typography variant="h4" className="mb-0">
                Order #{order.id} Tracking
              </Typography>
            </div>
          </div>
        </header>

        <main>
          <EnhancedOrderTracking
            order={order}
            progress_percentage={progress_percentage}
            tracking_steps={enhancedTrackingSteps}
            onRefresh={loadTrackingData}
            realTimeUpdates={true}
          />
        </main>
      </div>
    </ThemeProvider>
  );
}