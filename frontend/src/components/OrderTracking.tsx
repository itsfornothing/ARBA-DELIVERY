'use client';

import React, { useState, useEffect } from 'react';

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
  assigned_courier_name?: string;
}

interface TrackingStep {
  status: string;
  label: string;
  completed: boolean;
  timestamp?: string;
  progress: number;
}

interface TrackingData {
  order: Order;
  progress_percentage: number;
  status_timeline: {
    created_at: string;
    assigned_at?: string;
    picked_up_at?: string;
    in_transit_at?: string;
    delivered_at?: string;
  };
  estimated_delivery?: string;
  tracking_steps: TrackingStep[];
  last_updated: string;
}

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface OrderTrackingProps {
  orderId: number;
  apiBaseUrl?: string;
}

export default function OrderTracking({ orderId, apiBaseUrl = 'http://localhost:8000' }: OrderTrackingProps) {
  const [trackingData, setTrackingData] = useState<TrackingData | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  // Simulate API call for tracking data
  const fetchTrackingData = async () => {
    try {
      // In a real implementation, this would be an actual API call
      // For demo purposes, we'll simulate the response
      const mockTrackingData: TrackingData = {
        order: {
          id: orderId,
          status: 'IN_TRANSIT',
          pickup_address: '123 Main St, City A',
          delivery_address: '456 Oak Ave, City B',
          distance_km: 5.2,
          price: 154.00,
          created_at: new Date(Date.now() - 3600000).toISOString(),
          assigned_at: new Date(Date.now() - 3000000).toISOString(),
          picked_up_at: new Date(Date.now() - 1800000).toISOString(),
          in_transit_at: new Date(Date.now() - 900000).toISOString(),
          customer_name: 'John Doe',
          assigned_courier_name: 'Jane Smith'
        },
        progress_percentage: 75,
        status_timeline: {
          created_at: new Date(Date.now() - 3600000).toISOString(),
          assigned_at: new Date(Date.now() - 3000000).toISOString(),
          picked_up_at: new Date(Date.now() - 1800000).toISOString(),
          in_transit_at: new Date(Date.now() - 900000).toISOString(),
        },
        estimated_delivery: new Date(Date.now() + 600000).toISOString(),
        tracking_steps: [
          {
            status: 'CREATED',
            label: 'Order Created',
            completed: true,
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            progress: 0
          },
          {
            status: 'ASSIGNED',
            label: 'Courier Assigned',
            completed: true,
            timestamp: new Date(Date.now() - 3000000).toISOString(),
            progress: 25
          },
          {
            status: 'PICKED_UP',
            label: 'Order Picked Up',
            completed: true,
            timestamp: new Date(Date.now() - 1800000).toISOString(),
            progress: 50
          },
          {
            status: 'IN_TRANSIT',
            label: 'In Transit',
            completed: true,
            timestamp: new Date(Date.now() - 900000).toISOString(),
            progress: 75
          },
          {
            status: 'DELIVERED',
            label: 'Delivered',
            completed: false,
            progress: 100
          }
        ],
        last_updated: new Date().toISOString()
      };

      setTrackingData(mockTrackingData);
      setLastUpdate(new Date().toLocaleTimeString());
      setError(null);
    } catch (err) {
      setError('Failed to fetch tracking data');
      console.error('Error fetching tracking data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simulate real-time updates by polling every 30 seconds
  useEffect(() => {
    fetchTrackingData();
    
    const interval = setInterval(() => {
      fetchTrackingData();
    }, 30000); // Poll every 30 seconds

    return () => clearInterval(interval);
  }, [orderId]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    const colors = {
      'CREATED': 'bg-gray-500',
      'ASSIGNED': 'bg-blue-500',
      'PICKED_UP': 'bg-yellow-500',
      'IN_TRANSIT': 'bg-orange-500',
      'DELIVERED': 'bg-green-500',
      'CANCELLED': 'bg-red-500'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading tracking information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-red-800 font-medium">Error Loading Tracking Data</h3>
            <p className="text-red-600 text-sm mt-1">{error}</p>
          </div>
        </div>
        <button 
          onClick={fetchTrackingData}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!trackingData) {
    return (
      <div className="text-center p-8 text-gray-600">
        No tracking data available
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Order #{trackingData.order.id}</h1>
            <p className="text-gray-600">Track your delivery in real-time</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white ${getStatusColor(trackingData.order.status)}`}>
              {trackingData.order.status.replace('_', ' ')}
            </div>
            <p className="text-sm text-gray-500 mt-1">Last updated: {lastUpdate}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{trackingData.progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${trackingData.progress_percentage}%` }}
            ></div>
          </div>
        </div>

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Pickup Location</h3>
            <p className="text-gray-600">{trackingData.order.pickup_address}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Delivery Location</h3>
            <p className="text-gray-600">{trackingData.order.delivery_address}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Distance</h3>
            <p className="text-gray-600">{trackingData.order.distance_km} km</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Total Price</h3>
            <p className="text-gray-600 font-semibold">${trackingData.order.price}</p>
          </div>
        </div>

        {trackingData.order.assigned_courier_name && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Assigned Courier</h3>
            <p className="text-gray-600">{trackingData.order.assigned_courier_name}</p>
          </div>
        )}

        {trackingData.estimated_delivery && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2">Estimated Delivery</h3>
            <p className="text-gray-600">{formatTime(trackingData.estimated_delivery)}</p>
          </div>
        )}
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Delivery Timeline</h2>
        <div className="space-y-4">
          {trackingData.tracking_steps.map((step, index) => (
            <div key={step.status} className="flex items-start">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  step.completed ? 'bg-green-500' : 'bg-gray-300'
                }`}>
                  {step.completed ? (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <div className="w-3 h-3 bg-white rounded-full"></div>
                  )}
                </div>
                {index < trackingData.tracking_steps.length - 1 && (
                  <div className={`w-0.5 h-8 mx-auto mt-2 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`}></div>
                )}
              </div>
              <div className="ml-4 flex-1">
                <h3 className={`font-medium ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                  {step.label}
                </h3>
                {step.timestamp && (
                  <p className="text-sm text-gray-500 mt-1">
                    {formatTime(step.timestamp)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Update Indicator */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="animate-pulse w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
          <div>
            <h3 className="text-blue-800 font-medium">Real-time Tracking Active</h3>
            <p className="text-blue-600 text-sm">
              This page automatically updates every 30 seconds to show the latest delivery status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}