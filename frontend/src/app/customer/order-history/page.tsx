'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, type Order } from '@/lib/api';
import { ArrowLeft, MapPin, Clock, Package, Search, Filter } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
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
    loadOrders();
  }, [router]);

  useEffect(() => {
    // Filter orders based on search term and status
    let filtered = orders;
    
    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.pickup_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.id.toString().includes(searchTerm)
      );
    }
    
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    setFilteredOrders(filtered);
  }, [orders, searchTerm, statusFilter]);

  const loadOrders = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.getOrders();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Handle paginated response - extract results array
      const ordersData = (response.data as any)?.results || response.data || [];
      
      // Ensure we have an array before sorting
      if (!Array.isArray(ordersData)) {
        console.error('Expected orders data to be an array, got:', typeof ordersData, ordersData);
        throw new Error('Invalid response format from server');
      }
      
      // Sort orders by creation date (newest first)
      const sortedOrders = ordersData.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setOrders(sortedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'ASSIGNED': return 'bg-info-100 text-info-800 border-info-200';
      case 'PICKED_UP': return 'bg-secondary-100 text-secondary-800 border-secondary-200';
      case 'IN_TRANSIT': return 'bg-primary-100 text-primary-800 border-primary-200';
      case 'DELIVERED': return 'bg-success-100 text-success-800 border-success-200';
      case 'CANCELLED': return 'bg-error-100 text-error-800 border-error-200';
      default: return 'bg-neutral-100 text-neutral-800 border-neutral-200';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const getStatusCounts = () => {
    const counts = {
      ALL: orders.length,
      CREATED: 0,
      ASSIGNED: 0,
      PICKED_UP: 0,
      IN_TRANSIT: 0,
      DELIVERED: 0,
      CANCELLED: 0,
    };
    
    orders.forEach(order => {
      counts[order.status as keyof typeof counts]++;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <Card className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <Typography variant="body1" color="muted" className="mb-0">
            Loading your order history...
          </Typography>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-soft border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
              Order History
            </Typography>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6">
            <Card variant="outlined" className="border-error-200 bg-error-50">
              <Typography variant="body1" color="error" className="mb-0">
                {error}
              </Typography>
            </Card>
          </div>
        )}

        {/* Filters and Search */}
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <Input
                leftIcon={<Search className="h-5 w-5" />}
                placeholder="Search by order ID or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Status Filter */}
            <div className="sm:w-48">
              <div className="relative">
                <Filter className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 pointer-events-none z-10" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border-2 border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white text-neutral-900"
                >
                  <option value="ALL">All Orders ({statusCounts.ALL})</option>
                  <option value="CREATED">Created ({statusCounts.CREATED})</option>
                  <option value="ASSIGNED">Assigned ({statusCounts.ASSIGNED})</option>
                  <option value="PICKED_UP">Picked Up ({statusCounts.PICKED_UP})</option>
                  <option value="IN_TRANSIT">In Transit ({statusCounts.IN_TRANSIT})</option>
                  <option value="DELIVERED">Delivered ({statusCounts.DELIVERED})</option>
                  <option value="CANCELLED">Cancelled ({statusCounts.CANCELLED})</option>
                </select>
              </div>
            </div>
          </div>
        </Card>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <Card className="text-center py-12">
            <Package className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
            <Typography variant="h5" className="mb-2">
              {orders.length === 0 ? 'No Orders Yet' : 'No Orders Found'}
            </Typography>
            <Typography variant="body1" color="muted" className="mb-4">
              {orders.length === 0 
                ? "You haven't placed any orders yet." 
                : "Try adjusting your search or filter criteria."
              }
            </Typography>
            {orders.length === 0 && (
              <Button
                as={Link}
                href="/customer/create-order"
                variant="primary"
              >
                Create Your First Order
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} variant="default">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Order #{order.id}</CardTitle>
                      <div className="flex items-center mt-1 text-neutral-600">
                        <Clock className="h-4 w-4 mr-1" />
                        <Typography variant="caption" color="muted">
                          {new Date(order.created_at).toLocaleDateString()} at{' '}
                          {new Date(order.created_at).toLocaleTimeString()}
                        </Typography>
                      </div>
                    </div>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full border ${getStatusColor(order.status)}`}>
                      {formatStatus(order.status)}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <Typography variant="body2" weight="medium" className="mb-1">
                        Pickup
                      </Typography>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-success-600 mt-0.5 mr-2 flex-shrink-0" />
                        <Typography variant="body2" color="muted">
                          {order.pickup_address}
                        </Typography>
                      </div>
                    </div>
                    
                    <div>
                      <Typography variant="body2" weight="medium" className="mb-1">
                        Delivery
                      </Typography>
                      <div className="flex items-start">
                        <MapPin className="h-4 w-4 text-error-600 mt-0.5 mr-2 flex-shrink-0" />
                        <Typography variant="body2" color="muted">
                          {order.delivery_address}
                        </Typography>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter>
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center space-x-4">
                      <Typography variant="body2" color="muted">
                        {order.distance_km} km
                      </Typography>
                      <Typography variant="body2" weight="medium">
                        ${order.price}
                      </Typography>
                      {order.assigned_courier_name && (
                        <Typography variant="body2" color="muted">
                          Courier: {order.assigned_courier_name}
                        </Typography>
                      )}
                    </div>
                    
                    <div className="flex space-x-2">
                      {(order.status !== 'DELIVERED' && order.status !== 'CANCELLED') && (
                        <Button
                          as={Link}
                          href={`/customer/orders/${order.id}`}
                          variant="outline"
                          size="sm"
                        >
                          Track Order
                        </Button>
                      )}
                      <Button
                        as={Link}
                        href={`/customer/orders/${order.id}`}
                        variant="ghost"
                        size="sm"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}