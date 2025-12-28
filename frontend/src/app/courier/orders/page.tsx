'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface Order {
  id: number;
  status: string;
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  price: number;
  created_at: string;
  assigned_at?: string;
  picked_up_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
  customer_name: string;
}

export default function CourierOrders() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch courier's orders
  const { data: orders, isLoading, refetch } = useQuery<Order[]>({
    queryKey: ['courier-orders'],
    queryFn: async () => {
      const response = await apiClient.getOrders();
      if (response.error) throw new Error(response.error);
      
      // Handle paginated response - extract results array if present
      const ordersData = (response.data as any)?.results || response.data || [];
      
      // Ensure we have an array
      if (!Array.isArray(ordersData)) {
        console.error('Expected orders data to be an array, got:', typeof ordersData, ordersData);
        throw new Error('Invalid response format from server');
      }
      
      return ordersData;
    },
  });

  const handleStatusUpdate = async (orderId: number, newStatus: string) => {
    try {
      const response = await apiClient.updateOrderStatus(orderId, newStatus);
      
      if (response.error) {
        alert(`Error updating status: ${response.error}`);
        return;
      }
      
      // Refresh orders
      refetch();
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status. Please try again.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ASSIGNED':
        return 'bg-blue-100 text-blue-800';
      case 'PICKED_UP':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_TRANSIT':
        return 'bg-purple-100 text-purple-800';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'ASSIGNED':
        return 'PICKED_UP';
      case 'PICKED_UP':
        return 'IN_TRANSIT';
      case 'IN_TRANSIT':
        return 'DELIVERED';
      default:
        return null;
    }
  };

  const getNextStatusLabel = (currentStatus: string) => {
    switch (currentStatus) {
      case 'ASSIGNED':
        return 'Mark as Picked Up';
      case 'PICKED_UP':
        return 'Start Transit';
      case 'IN_TRANSIT':
        return 'Mark as Delivered';
      default:
        return null;
    }
  };

  const filteredOrders = orders?.filter(order => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'active') return ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(order.status);
    return order.status === statusFilter;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-1">Manage your assigned delivery orders</p>
        </div>
        
        <Link
          href="/courier/available"
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Find New Orders
        </Link>
      </div>

      {/* Status Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'all'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Orders ({orders?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'active'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Active ({orders?.filter(o => ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(o.status)).length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('ASSIGNED')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'ASSIGNED'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Assigned ({orders?.filter(o => o.status === 'ASSIGNED').length || 0})
          </button>
          <button
            onClick={() => setStatusFilter('DELIVERED')}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === 'DELIVERED'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Delivered ({orders?.filter(o => o.status === 'DELIVERED').length || 0})
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow rounded-lg">
        {filteredOrders.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order.id}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Customer:</strong> {order.customer_name}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Pickup:</strong> {order.pickup_address}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Delivery:</strong> {order.delivery_address}
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Distance:</strong> {order.distance_km} km
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          <strong>Price:</strong> ${order.price}
                        </p>
                        <p className="text-sm text-gray-600">
                          <strong>Created:</strong> {new Date(order.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {/* Timeline */}
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className={`flex items-center space-x-1 ${order.created_at ? 'text-green-600' : ''}`}>
                        <div className={`w-2 h-2 rounded-full ${order.created_at ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                        <span>Created</span>
                      </div>
                      <div className="w-8 h-px bg-gray-300"></div>
                      <div className={`flex items-center space-x-1 ${order.assigned_at ? 'text-green-600' : ''}`}>
                        <div className={`w-2 h-2 rounded-full ${order.assigned_at ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                        <span>Assigned</span>
                      </div>
                      <div className="w-8 h-px bg-gray-300"></div>
                      <div className={`flex items-center space-x-1 ${order.picked_up_at ? 'text-green-600' : ''}`}>
                        <div className={`w-2 h-2 rounded-full ${order.picked_up_at ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                        <span>Picked Up</span>
                      </div>
                      <div className="w-8 h-px bg-gray-300"></div>
                      <div className={`flex items-center space-x-1 ${order.in_transit_at ? 'text-green-600' : ''}`}>
                        <div className={`w-2 h-2 rounded-full ${order.in_transit_at ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                        <span>In Transit</span>
                      </div>
                      <div className="w-8 h-px bg-gray-300"></div>
                      <div className={`flex items-center space-x-1 ${order.delivered_at ? 'text-green-600' : ''}`}>
                        <div className={`w-2 h-2 rounded-full ${order.delivered_at ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                        <span>Delivered</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6 flex flex-col space-y-2">
                    <Link
                      href={`/courier/orders/${order.id}`}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors text-center"
                    >
                      View Details
                    </Link>
                    
                    {getNextStatus(order.status) && (
                      <button
                        onClick={() => handleStatusUpdate(order.id, getNextStatus(order.status)!)}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        {getNextStatusLabel(order.status)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter === 'all' 
                ? "You don't have any orders yet. Check available orders to get started."
                : `No orders with status "${statusFilter.replace('_', ' ').toLowerCase()}".`
              }
            </p>
            <div className="mt-6">
              <Link
                href="/courier/available"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Find Available Orders
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}