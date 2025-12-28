'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient, TrackingData } from '@/lib/api';

export default function CourierOrderDetail() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Fetch order tracking information
  const { data: trackingData, isLoading, refetch } = useQuery<TrackingData>({
    queryKey: ['order-tracking', orderId],
    queryFn: async () => {
      const response = await apiClient.getOrderTracking(orderId);
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    try {
      const response = await apiClient.updateOrderStatus(orderId, newStatus);
      
      if (response.error) {
        alert(`Error updating status: ${response.error}`);
        return;
      }
      
      // Refresh tracking data
      refetch();
      alert('Order status updated successfully!');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Order not found</h3>
        <p className="text-gray-600 mt-2">The order you're looking for doesn't exist or you don't have access to it.</p>
        <Link
          href="/courier/orders"
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
        >
          Back to Orders
        </Link>
      </div>
    );
  }

  const order = trackingData.order;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <Link
              href="/courier/orders"
              className="text-green-600 hover:text-green-700"
            >
              ← Back to Orders
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            Order #{order.id}
          </h1>
          <div className="flex items-center space-x-2 mt-1">
            <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(order.status)}`}>
              {order.status.replace('_', ' ')}
            </span>
            <span className="text-gray-500">•</span>
            <span className="text-sm text-gray-600">
              Progress: {trackingData.progress_percentage}%
            </span>
          </div>
        </div>
        
        {getNextStatus(order.status) && (
          <button
            onClick={() => handleStatusUpdate(getNextStatus(order.status)!)}
            disabled={isUpdatingStatus}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUpdatingStatus ? 'Updating...' : getNextStatusLabel(order.status)}
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Progress</h2>
        
        <div className="relative">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm font-medium text-gray-700">{trackingData.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${trackingData.progress_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Timeline */}
        <div className="mt-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {trackingData.tracking_steps.map((step, stepIdx) => (
                <li key={step.status}>
                  <div className="relative pb-8">
                    {stepIdx !== trackingData.tracking_steps.length - 1 ? (
                      <span
                        className={`absolute top-4 left-4 -ml-px h-full w-0.5 ${
                          step.completed ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                        aria-hidden="true"
                      />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span
                          className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                            step.completed
                              ? 'bg-green-600'
                              : order.status === step.status
                              ? 'bg-blue-600'
                              : 'bg-gray-200'
                          }`}
                        >
                          {step.completed ? (
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          ) : (
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              order.status === step.status ? 'bg-white' : 'bg-gray-400'
                            }`} />
                          )}
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5">
                        <div>
                          <p className={`text-sm font-medium ${
                            step.completed || order.status === step.status ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {step.label}
                          </p>
                          {step.timestamp && (
                            <p className="text-sm text-gray-500">
                              {new Date(step.timestamp).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
              <p className="text-sm text-gray-900">{order.customer_name}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
              <p className="text-sm text-gray-900">{order.pickup_address}</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
              <p className="text-sm text-gray-900">{order.delivery_address}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Distance</label>
                <p className="text-sm text-gray-900">{order.distance_km} km</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <p className="text-sm text-gray-900 font-medium">${order.price}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Timeline</h2>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Created</span>
              <span className="text-sm text-gray-900">
                {new Date(order.created_at).toLocaleString()}
              </span>
            </div>
            
            {order.assigned_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Assigned</span>
                <span className="text-sm text-gray-900">
                  {new Date(order.assigned_at).toLocaleString()}
                </span>
              </div>
            )}
            
            {order.picked_up_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Picked Up</span>
                <span className="text-sm text-gray-900">
                  {new Date(order.picked_up_at).toLocaleString()}
                </span>
              </div>
            )}
            
            {order.in_transit_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">In Transit</span>
                <span className="text-sm text-gray-900">
                  {new Date(order.in_transit_at).toLocaleString()}
                </span>
              </div>
            )}
            
            {order.delivered_at && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Delivered</span>
                <span className="text-sm text-gray-900">
                  {new Date(order.delivered_at).toLocaleString()}
                </span>
              </div>
            )}
            
            {trackingData.estimated_delivery && order.status !== 'DELIVERED' && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-sm font-medium text-gray-700">Estimated Delivery</span>
                <span className="text-sm text-green-600 font-medium">
                  {new Date(trackingData.estimated_delivery).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      {trackingData.recent_notifications && trackingData.recent_notifications.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h2>
          
          <div className="space-y-3">
            {trackingData.recent_notifications.map((notification) => (
              <div key={notification.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <Link
          href="/courier/orders"
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Back to Orders
        </Link>
        
        <div className="text-xs text-gray-500">
          Last updated: {new Date(trackingData.last_updated).toLocaleString()}
        </div>
      </div>
    </div>
  );
}