'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface Order {
  id: number;
  customer: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  assigned_courier?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  price: number;
  status: 'CREATED' | 'ASSIGNED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  created_at: string;
  assigned_at?: string;
  picked_up_at?: string;
  in_transit_at?: string;
  delivered_at?: string;
}

interface Courier {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
}

export default function OrderManagement() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [availableCouriers, setAvailableCouriers] = useState<Courier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [selectedCourier, setSelectedCourier] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchAvailableCouriers();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const response = await apiClient.request<Order[]>(`/api/orders/orders/${params}`);
      if (response.data) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCouriers = async () => {
    try {
      const response = await apiClient.request<Courier[]>('/accounts/admin/couriers/available/');
      if (response.data) {
        setAvailableCouriers(response.data);
      }
    } catch (error) {
      console.error('Error fetching couriers:', error);
    }
  };

  const handleAssignCourier = async () => {
    if (!selectedOrder || !selectedCourier) return;

    setAssignLoading(true);
    try {
      const response = await apiClient.request<Order>(
        `/api/orders/orders/${selectedOrder.id}/assign_courier/`,
        {
          method: 'POST',
          body: JSON.stringify({ courier_id: parseInt(selectedCourier) })
        }
      );

      if (response.data) {
        // Update order in local state
        setOrders(orders.map(order => 
          order.id === selectedOrder.id ? response.data! : order
        ));
        setShowAssignModal(false);
        setSelectedOrder(null);
        setSelectedCourier('');
      }
    } catch (error) {
      console.error('Error assigning courier:', error);
      alert('Failed to assign courier');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleReassignCourier = async (orderId: number) => {
    if (!selectedCourier) return;

    setAssignLoading(true);
    try {
      const response = await apiClient.request<any>(
        `/api/orders/orders/${orderId}/reassign_courier/`,
        {
          method: 'POST',
          body: JSON.stringify({ courier_id: parseInt(selectedCourier) })
        }
      );

      if (response.data) {
        // Update order in local state
        setOrders(orders.map(order => 
          order.id === orderId ? response.data.order : order
        ));
        setShowAssignModal(false);
        setSelectedOrder(null);
        setSelectedCourier('');
      }
    } catch (error) {
      console.error('Error reassigning courier:', error);
      alert('Failed to reassign courier');
    } finally {
      setAssignLoading(false);
    }
  };

  const openAssignModal = (order: Order) => {
    setSelectedOrder(order);
    setSelectedCourier('');
    setShowAssignModal(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'CREATED': return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'PICKED_UP': return 'bg-orange-100 text-orange-800';
      case 'IN_TRANSIT': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-600 mt-2">Manage orders and courier assignments</p>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">All Orders</option>
              <option value="CREATED">Created</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="PICKED_UP">Picked Up</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="text-sm text-gray-600">
            Total Orders: {orders.length}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Addresses
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Distance & Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Courier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    #{order.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.customer.first_name} {order.customer.last_name}
                    </div>
                    <div className="text-sm text-gray-500">{order.customer.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      <div className="font-medium">From:</div>
                      <div className="text-gray-600 mb-1">{order.pickup_address}</div>
                      <div className="font-medium">To:</div>
                      <div className="text-gray-600">{order.delivery_address}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{order.distance_km} km</div>
                      <div className="font-medium">{formatCurrency(order.price)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.assigned_courier ? (
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          {order.assigned_courier.first_name} {order.assigned_courier.last_name}
                        </div>
                        <div className="text-gray-500">{order.assigned_courier.email}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {order.status === 'CREATED' && (
                      <button
                        onClick={() => openAssignModal(order)}
                        className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1 rounded text-xs font-medium"
                      >
                        Assign Courier
                      </button>
                    )}
                    {order.status === 'ASSIGNED' && order.assigned_courier && (
                      <button
                        onClick={() => openAssignModal(order)}
                        className="bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1 rounded text-xs font-medium"
                      >
                        Reassign
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Courier Modal */}
      {showAssignModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              {selectedOrder.assigned_courier ? 'Reassign' : 'Assign'} Courier
            </h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">Order #{selectedOrder.id}</p>
              <p className="text-sm text-gray-600">
                {selectedOrder.pickup_address} → {selectedOrder.delivery_address}
              </p>
              {selectedOrder.assigned_courier && (
                <p className="text-sm text-gray-600 mt-2">
                  Currently assigned to: {selectedOrder.assigned_courier.first_name} {selectedOrder.assigned_courier.last_name}
                </p>
              )}
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Courier
              </label>
              <select
                value={selectedCourier}
                onChange={(e) => setSelectedCourier(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Choose a courier...</option>
                {availableCouriers.map((courier) => (
                  <option key={courier.id} value={courier.id.toString()}>
                    {courier.first_name} {courier.last_name} ({courier.username})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (selectedOrder.assigned_courier) {
                    handleReassignCourier(selectedOrder.id);
                  } else {
                    handleAssignCourier();
                  }
                }}
                disabled={!selectedCourier || assignLoading}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
              >
                {assignLoading ? 'Assigning...' : (selectedOrder.assigned_courier ? 'Reassign' : 'Assign')}
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}