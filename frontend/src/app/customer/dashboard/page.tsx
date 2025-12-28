'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, realTimeTracker, type Order, type RealTimeUpdates } from '@/lib/api';
import { Package, Plus, Clock, MapPin, Bell, LogOut, RefreshCw } from 'lucide-react';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';

export default function CustomerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingStates, setLoadingStates] = useState({
    orders: false,
    notifications: false,
    unreadCount: false
  });
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const userRole = localStorage.getItem('user_role');
    
    if (!token || userRole !== 'CUSTOMER') {
      router.push('/auth/login');
      return;
    }
    
    apiClient.setAuthToken(token);
    loadDashboardData();
    
    // Subscribe to real-time updates
    const handleRealTimeUpdate = (updates: RealTimeUpdates) => {
      if (updates.orders && Array.isArray(updates.orders)) {
        setOrders(updates.orders);
      }
      if (updates.notifications && Array.isArray(updates.notifications)) {
        setNotifications(updates.notifications);
        const unread = updates.notifications.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    };
    
    realTimeTracker.subscribe(handleRealTimeUpdate);
    
    return () => {
      realTimeTracker.unsubscribe(handleRealTimeUpdate);
    };
  }, [router]);

  const loadDashboardData = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    
    // Set individual loading states
    setLoadingStates({
      orders: true,
      notifications: true,
      unreadCount: true
    });
    
    try {
      const [ordersResponse, notificationsResponse, unreadResponse] = await Promise.all([
        apiClient.getOrders(),
        apiClient.getNotifications(),
        apiClient.getUnreadCount(),
      ]);
      
      // Update loading states as each request completes
      setLoadingStates(prev => ({ ...prev, orders: false }));
      setLoadingStates(prev => ({ ...prev, notifications: false }));
      setLoadingStates(prev => ({ ...prev, unreadCount: false }));
      
      if (ordersResponse.error) {
        throw new Error(ordersResponse.error);
      }
      if (notificationsResponse.error) {
        throw new Error(notificationsResponse.error);
      }
      
      // Handle paginated responses - extract results array if present
      const ordersData = (ordersResponse.data as any)?.results || ordersResponse.data || [];
      const notificationsData = (notificationsResponse.data as any)?.results || notificationsResponse.data || [];
      
      // Ensure we have arrays
      const ordersArray = Array.isArray(ordersData) ? ordersData : [];
      const notificationsArray = Array.isArray(notificationsData) ? notificationsData : [];
      
      setOrders(ordersArray);
      setNotifications(notificationsArray);
      setUnreadCount(unreadResponse.data?.unread_count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      // Reset loading states on error
      setLoadingStates({
        orders: false,
        notifications: false,
        unreadCount: false
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    if (!isRefreshing && !isLoading) {
      loadDashboardData(true);
    }
  }, [isRefreshing, isLoading, loadDashboardData]);

  const handleLogout = async () => {
    await apiClient.logout();
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_id');
    router.push('/');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-warning-100 text-warning-800';
      case 'ASSIGNED': return 'bg-info-100 text-info-800';
      case 'PICKED_UP': return 'bg-secondary-100 text-secondary-800';
      case 'IN_TRANSIT': return 'bg-primary-100 text-primary-800';
      case 'DELIVERED': return 'bg-success-100 text-success-800';
      case 'CANCELLED': return 'bg-error-100 text-error-800';
      default: return 'bg-neutral-100 text-neutral-800';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <Typography variant="body1" color="muted" className="mt-4">
            Loading your dashboard...
          </Typography>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
        <header className="bg-white shadow-soft border-b border-neutral-200">
          <ResponsiveContainer size="desktop" spacing="container">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div className="flex items-center min-w-0">
                <Typography variant="h5" color="neutral" className="mb-0 truncate">
                  Arba Delivery
                </Typography>
                <Typography variant="caption" color="muted" className="ml-2 mb-0 hidden sm:block">
                  Customer Dashboard
                </Typography>
              </div>
              
              <div className="flex items-center space-x-2 sm:space-x-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  leftIcon={<RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />}
                  title="Refresh dashboard"
                  className="hidden sm:flex"
                >
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  title="Refresh dashboard"
                  className="sm:hidden p-2"
                >
                  <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                </Button>
                
                <Link
                  href="/customer/notifications"
                  className="relative p-2 text-neutral-600 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                  {loadingStates.unreadCount ? (
                    <div className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-neutral-300 rounded-full animate-pulse"></div>
                  ) : unreadCount > 0 ? (
                    <span className="absolute -top-1 -right-1 h-4 w-4 sm:h-5 sm:w-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  ) : null}
                </Link>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  leftIcon={<LogOut className="h-4 w-4" />}
                  className="hidden sm:flex"
                >
                  Logout
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  title="Logout"
                  className="sm:hidden p-2"
                >
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </ResponsiveContainer>
        </header>

        <main>
          <ResponsiveContainer size="desktop" spacing="section">
            {error && (
              <Card variant="outlined" className="mb-6 border-error-200 bg-error-50">
                <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <Typography variant="body1" color="error">{error}</Typography>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRefresh}
                    className="self-start sm:self-auto"
                  >
                    Try again
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <div className="mb-6 sm:mb-8">
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveGrid columns="double" gap="responsive">
                    <Link
                      href="/customer/create-order"
                      className="flex items-center p-4 border-2 border-dashed border-neutral-300 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition-colors min-h-[80px]"
                    >
                      <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-primary-600 mr-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <Typography variant="h6" className="mb-0 text-sm sm:text-base">Create New Order</Typography>
                        <Typography variant="body2" color="muted" className="text-xs sm:text-sm">Place a new delivery order</Typography>
                      </div>
                    </Link>
                    
                    <Link
                      href="/customer/order-history"
                      className="flex items-center p-4 border-2 border-dashed border-neutral-300 rounded-lg hover:border-secondary-500 hover:bg-secondary-50 transition-colors min-h-[80px]"
                    >
                      <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-secondary-600 mr-3 flex-shrink-0" />
                      <div className="min-w-0">
                        <Typography variant="h6" className="mb-0 text-sm sm:text-base">Order History</Typography>
                        <Typography variant="body2" color="muted" className="text-xs sm:text-sm">View all your past orders</Typography>
                      </div>
                    </Link>
                  </ResponsiveGrid>
                </CardContent>
              </Card>
            </div>

            {/* Active Orders */}
            <div className="mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <Typography variant="h5">Active Orders</Typography>
                {loadingStates.orders && (
                  <LoadingSpinner size="sm" text="Loading orders..." />
                )}
              </div>
              
              {loadingStates.orders ? (
                <ResponsiveGrid columns="responsive" gap="responsive">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} variant="elevated" className="animate-pulse">
                      <CardContent>
                        <div className="flex justify-between items-start mb-4">
                          <div className="h-5 sm:h-6 bg-neutral-200 rounded w-20 sm:w-24"></div>
                          <div className="h-5 sm:h-6 bg-neutral-200 rounded w-12 sm:w-16"></div>
                        </div>
                        <div className="space-y-2 mb-4">
                          <div className="h-3 sm:h-4 bg-neutral-200 rounded w-full"></div>
                          <div className="h-3 sm:h-4 bg-neutral-200 rounded w-3/4"></div>
                        </div>
                        <div className="h-8 sm:h-10 bg-neutral-200 rounded w-full"></div>
                      </CardContent>
                    </Card>
                  ))}
                </ResponsiveGrid>
              ) : (Array.isArray(orders) ? orders : []).filter(order => order.status !== 'DELIVERED' && order.status !== 'CANCELLED').length === 0 ? (
                <Card variant="elevated" className="text-center">
                  <CardContent>
                    <Package className="h-10 w-10 sm:h-12 sm:w-12 text-neutral-400 mx-auto mb-4" />
                    <Typography variant="h6" className="mb-2">No Active Orders</Typography>
                    <Typography variant="body2" color="muted" className="mb-4">
                      You don't have any active orders at the moment.
                    </Typography>
                    <Button
                      as={Link}
                      href="/customer/create-order"
                      variant="primary"
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Create Your First Order
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ResponsiveGrid columns="responsive" gap="responsive">
                  {(Array.isArray(orders) ? orders : [])
                    .filter(order => order.status !== 'DELIVERED' && order.status !== 'CANCELLED')
                    .map((order) => (
                      <Card key={order.id} variant="elevated">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-sm sm:text-base">Order #{order.id}</CardTitle>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                              {formatStatus(order.status)}
                            </span>
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex items-start">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-400 mt-0.5 mr-2 flex-shrink-0" />
                              <div className="text-xs sm:text-sm min-w-0">
                                <Typography variant="caption" weight="medium">From:</Typography>
                                <Typography variant="body2" color="muted" className="break-words">{order.pickup_address}</Typography>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-neutral-400 mt-0.5 mr-2 flex-shrink-0" />
                              <div className="text-xs sm:text-sm min-w-0">
                                <Typography variant="caption" weight="medium">To:</Typography>
                                <Typography variant="body2" color="muted" className="break-words">{order.delivery_address}</Typography>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-center mt-4 pt-4 border-t border-neutral-200">
                            <Typography variant="body2" color="muted" className="text-xs sm:text-sm">{order.distance_km} km</Typography>
                            <Typography variant="body1" weight="semibold" className="text-sm sm:text-base">${order.price}</Typography>
                          </div>
                        </CardContent>
                        
                        <CardFooter>
                          <Button
                            as={Link}
                            href={`/customer/orders/${order.id}`}
                            variant="outline"
                            fullWidth
                            size="sm"
                          >
                            Track Order
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </ResponsiveGrid>
              )}
            </div>

            {/* Recent Notifications */}
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <Typography variant="h5">Recent Notifications</Typography>
                <div className="flex items-center space-x-4">
                  {loadingStates.notifications && (
                    <LoadingSpinner size="sm" text="Loading notifications..." />
                  )}
                  <Button
                    as={Link}
                    href="/customer/notifications"
                    variant="ghost"
                    size="sm"
                  >
                    View all
                  </Button>
                </div>
              </div>
              
              <Card variant="elevated">
                {loadingStates.notifications ? (
                  <div className="divide-y divide-neutral-200">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="p-3 sm:p-4 animate-pulse">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="h-3 sm:h-4 bg-neutral-200 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-neutral-200 rounded w-full"></div>
                          </div>
                          <div className="h-2 w-2 bg-neutral-200 rounded-full ml-2 mt-2"></div>
                        </div>
                        <div className="h-3 bg-neutral-200 rounded w-20 sm:w-24 mt-2"></div>
                      </div>
                    ))}
                  </div>
                ) : (Array.isArray(notifications) ? notifications : []).slice(0, 5).length === 0 ? (
                  <CardContent className="text-center py-6 sm:py-8">
                    <Bell className="h-6 w-6 sm:h-8 sm:w-8 text-neutral-400 mx-auto mb-2" />
                    <Typography variant="body2" color="muted">No notifications yet</Typography>
                  </CardContent>
                ) : (
                  <div className="divide-y divide-neutral-200">
                    {(Array.isArray(notifications) ? notifications : []).slice(0, 5).map((notification) => (
                      <div key={notification.id} className={`p-3 sm:p-4 ${!notification.is_read ? 'bg-primary-50' : ''}`}>
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <Typography variant="body2" weight="medium" className="mb-1 text-sm">
                              {notification.title}
                            </Typography>
                            <Typography variant="body2" color="muted" className="text-xs sm:text-sm break-words">
                              {notification.message}
                            </Typography>
                          </div>
                          {!notification.is_read && (
                            <div className="h-2 w-2 bg-primary-600 rounded-full ml-2 mt-2 flex-shrink-0"></div>
                          )}
                        </div>
                        <Typography variant="caption" color="muted" className="mt-2 text-xs">
                          {new Date(notification.created_at).toLocaleString()}
                        </Typography>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          </ResponsiveContainer>
        </main>
      </div>
    </ErrorBoundary>
  );
}