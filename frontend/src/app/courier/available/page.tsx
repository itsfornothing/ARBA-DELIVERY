'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiClient } from '@/lib/api';

interface AvailableOrder {
  id: number;
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  price: number;
  created_at: string;
  customer_name: string;
}

export default function AvailableOrders() {
  const [isAcceptingOrder, setIsAcceptingOrder] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'created_at' | 'distance_km' | 'price'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch available orders
  const { data: orders, isLoading, refetch } = useQuery<AvailableOrder[]>({
    queryKey: ['available-orders'],
    queryFn: async () => {
      const response = await apiClient.request<AvailableOrder[]>('/api/orders/orders/available_orders/');
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for new orders
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
      
      // Refresh available orders
      refetch();
      alert('Order accepted successfully! You can now manage it from your orders page.');
    } catch (error) {
      console.error('Error accepting order:', error);
      alert('Failed to accept order. Please try again.');
    } finally {
      setIsAcceptingOrder(null);
    }
  };

  const handleSort = (field: 'created_at' | 'distance_km' | 'price') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const sortedOrders = orders ? [...orders].sort((a, b) => {
    let aValue: any = a[sortBy];
    let bValue: any = b[sortBy];
    
    if (sortBy === 'created_at') {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else {
      aValue = parseFloat(aValue);
      bValue = parseFloat(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  }) : [];

  const getSortIcon = (field: string) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Available Orders</h1>
          <p className="text-gray-600 mt-1">
            {orders?.length || 0} orders available for pickup
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => refetch()}
            className="px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Refresh
          </button>
          <Link
            href="/courier/orders"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            My Orders
          </Link>
        </div>
      </div>

      {/* Sorting Controls */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          
          <button
            onClick={() => handleSort('created_at')}
            className="flex items-center space-x-1 px-3 py-1 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span>Date</span>
            {getSortIcon('created_at')}
          </button>
          
          <button
            onClick={() => handleSort('distance_km')}
            className="flex items-center space-x-1 px-3 py-1 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span>Distance</span>
            {getSortIcon('distance_km')}
          </button>
          
          <button
            onClick={() => handleSort('price')}
            className="flex items-center space-x-1 px-3 py-1 text-sm rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span>Price</span>
            {getSortIcon('price')}
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white shadow rounded-lg">
        {sortedOrders.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {sortedOrders.map((order) => (
              <div key={order.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        Order #{order.id}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        Available
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString()}
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
                        <p className="text-lg font-bold text-green-600">
                          ${order.price}
                        </p>
                        <p className="text-xs text-gray-500">
                          ~${(parseFloat(order.price.toString()) / parseFloat(order.distance_km.toString())).toFixed(2)} per km
                        </p>
                      </div>
                    </div>

                    {/* Quick Info */}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Est. {Math.round(parseFloat(order.distance_km.toString()) * 5 + 10)} min</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{order.distance_km} km route</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <span>Good rate</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-6">
                    <button
                      onClick={() => handleAcceptOrder(order.id)}
                      disabled={isAcceptingOrder === order.id}
                      className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isAcceptingOrder === order.id ? 'Accepting...' : 'Accept Order'}
                    </button>
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No available orders</h3>
            <p className="mt-1 text-sm text-gray-500">
              There are currently no orders available for pickup. Check back later or refresh the page.
            </p>
            <div className="mt-6">
              <button
                onClick={() => refetch()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh Orders
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <div className="text-center text-xs text-gray-500">
        <p>This page automatically refreshes every 30 seconds to show new orders</p>
      </div>
    </div>
  );
}