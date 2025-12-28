'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '@/lib/api';

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

const availabilitySchema = z.object({
  is_available: z.boolean(),
  location_description: z.string().max(200, 'Location description must be less than 200 characters'),
});

type AvailabilityFormData = z.infer<typeof availabilitySchema>;

export default function CourierProfile() {
  const [isUpdatingAvailability, setIsUpdatingAvailability] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch courier profile
  const { data: courierProfile, isLoading, refetch } = useQuery<CourierProfile>({
    queryKey: ['courier-profile'],
    queryFn: async () => {
      const response = await apiClient.request<CourierProfile>('/api/orders/courier-status/my_profile/');
      if (response.error) throw new Error(response.error);
      return response.data!;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AvailabilityFormData>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      is_available: courierProfile?.courier_status.is_available || false,
      location_description: courierProfile?.courier_status.location_description || '',
    },
  });

  // Update form when data loads
  React.useEffect(() => {
    if (courierProfile) {
      reset({
        is_available: courierProfile.courier_status.is_available,
        location_description: courierProfile.courier_status.location_description || '',
      });
    }
  }, [courierProfile, reset]);

  const onSubmit = async (data: AvailabilityFormData) => {
    setIsUpdatingAvailability(true);
    setSuccessMessage(null);
    
    try {
      const response = await apiClient.request('/api/orders/courier-status/update_availability/', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      
      if (response.error) {
        alert(`Error updating availability: ${response.error}`);
        return;
      }
      
      // Refresh profile data
      refetch();
      setSuccessMessage('Availability settings updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability. Please try again.');
    } finally {
      setIsUpdatingAvailability(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!courierProfile) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Profile not found</h3>
        <p className="text-gray-600 mt-2">Unable to load your courier profile.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Courier Profile</h1>
        <p className="text-gray-600 mt-1">Manage your profile and availability settings</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {courierProfile.profile.username}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {courierProfile.profile.first_name || 'Not set'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {courierProfile.profile.last_name || 'Not set'}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {courierProfile.profile.email}
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {courierProfile.profile.phone_number || 'Not set'}
              </p>
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              To update your personal information, please contact support.
            </p>
          </div>
        </div>

        {/* Availability Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Availability Settings</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <div className="flex items-center space-x-3">
                <input
                  {...register('is_available')}
                  type="checkbox"
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label className="text-sm font-medium text-gray-700">
                  Available for new orders
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, you'll be eligible for automatic order assignments
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Current Location Description
              </label>
              <textarea
                {...register('location_description')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Downtown area, near Main Street..."
              />
              {errors.location_description && (
                <p className="mt-1 text-sm text-red-600">{errors.location_description.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Help customers and admins know your general location
              </p>
            </div>
            
            <button
              type="submit"
              disabled={isUpdatingAvailability}
              className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdatingAvailability ? 'Updating...' : 'Update Availability'}
            </button>
          </form>
        </div>
      </div>

      {/* Statistics */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Statistics</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {courierProfile.statistics.total_completed_orders}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Completed Orders</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {courierProfile.statistics.current_active_orders}
            </div>
            <div className="text-sm text-gray-600 mt-1">Current Active Orders</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {courierProfile.statistics.total_completed_orders > 0 
                ? ((courierProfile.statistics.total_completed_orders / (courierProfile.statistics.total_completed_orders + courierProfile.statistics.current_active_orders)) * 100).toFixed(1)
                : '0.0'
              }%
            </div>
            <div className="text-sm text-gray-600 mt-1">Completion Rate</div>
          </div>
        </div>
      </div>

      {/* Current Status */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Status</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-4 h-4 rounded-full ${
                courierProfile.courier_status.is_available ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className={`font-medium ${
                courierProfile.courier_status.is_available ? 'text-green-600' : 'text-red-600'
              }`}>
                {courierProfile.courier_status.is_available ? 'Available' : 'Unavailable'}
              </span>
            </div>
            
            <p className="text-sm text-gray-600 mb-2">
              <strong>Active Orders:</strong> {courierProfile.courier_status.current_orders_count}
            </p>
            
            <p className="text-sm text-gray-600">
              <strong>Last Activity:</strong> {new Date(courierProfile.courier_status.last_activity).toLocaleString()}
            </p>
          </div>
          
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Location Description</p>
            <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
              {courierProfile.courier_status.location_description || 'No location description set'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}