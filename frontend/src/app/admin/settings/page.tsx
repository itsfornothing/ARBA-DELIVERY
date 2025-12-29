'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

interface PricingConfig {
  id: number;
  base_fee: number;
  per_km_rate: number;
  is_active: boolean;
  created_at: string;
  created_by: {
    id: number;
    username: string;
    name: string;
  };
}

interface PricingHistory {
  id: number;
  base_fee: number;
  per_km_rate: number;
  created_at: string;
  created_by_name: string;
  is_active: boolean;
}

export default function AdminSettings() {
  const [currentConfig, setCurrentConfig] = useState<PricingConfig | null>(null);
  const [pricingHistory, setPricingHistory] = useState<PricingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [baseFee, setBaseFee] = useState<string>('');
  const [perKmRate, setPerKmRate] = useState<string>('');
  const [updateLoading, setUpdateLoading] = useState(false);
  const [previewDistance, setPreviewDistance] = useState<string>('5');
  const [pricePreview, setPricePreview] = useState<any>(null);

  useEffect(() => {
    fetchCurrentConfig();
    fetchPricingHistory();
  }, []);

  useEffect(() => {
    if (baseFee && perKmRate && previewDistance) {
      calculatePricePreview();
    }
  }, [baseFee, perKmRate, previewDistance]);

  const fetchCurrentConfig = async () => {
    try {
      setLoading(true);
      const response = await apiClient.request<{ data: PricingConfig }>('/api/orders/config/pricing/');
      if (response.data) {
        const config = response.data.data;
        setCurrentConfig(config);
        setBaseFee(config.base_fee.toString());
        setPerKmRate(config.per_km_rate.toString());
      }
    } catch (error) {
      console.error('Error fetching pricing config:', error);
      setError('Failed to load pricing configuration');
    } finally {
      setLoading(false);
    }
  };

  const fetchPricingHistory = async () => {
    try {
      const response = await apiClient.request<{ data: { history: PricingHistory[] } }>('/api/orders/config/pricing/history/');
      if (response.data) {
        setPricingHistory(response.data.data.history);
      }
    } catch (error) {
      console.error('Error fetching pricing history:', error);
    }
  };

  const calculatePricePreview = async () => {
    try {
      const response = await apiClient.request<any>('/api/orders/config/pricing/preview/', {
        method: 'POST',
        body: JSON.stringify({
          distance_km: parseFloat(previewDistance),
          base_fee: parseFloat(baseFee),
          per_km_rate: parseFloat(perKmRate)
        })
      });
      if (response.data) {
        setPricePreview(response.data.data);
      }
    } catch (error) {
      console.error('Error calculating price preview:', error);
    }
  };

  const handleUpdatePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdateLoading(true);

    try {
      const response = await apiClient.request<any>('/api/orders/config/pricing/update/', {
        method: 'POST',
        body: JSON.stringify({
          base_fee: parseFloat(baseFee),
          per_km_rate: parseFloat(perKmRate)
        })
      });

      if (response.data && response.data.success) {
        setCurrentConfig(response.data.data);
        fetchPricingHistory(); // Refresh history
        alert('Pricing configuration updated successfully!');
      } else {
        alert('Failed to update pricing configuration');
      }
    } catch (error) {
      console.error('Error updating pricing config:', error);
      alert('Failed to update pricing configuration');
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
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
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="text-gray-600 mt-2">Configure pricing and system parameters</p>
      </div>
      {/* Current Configuration */}
      {currentConfig && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Pricing Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Base Fee</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(currentConfig.base_fee)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Per KM Rate</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(currentConfig.per_km_rate)}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Last Updated</p>
              <p className="text-sm font-medium text-purple-600">
                {new Date(currentConfig.created_at).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500">by {currentConfig.created_by.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Update Pricing Configuration */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Pricing Configuration</h3>
        
        <form onSubmit={handleUpdatePricing} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Base Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={baseFee}
                onChange={(e) => setBaseFee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="50.00"
              />
              <p className="text-xs text-gray-500 mt-1">Fixed fee charged for every delivery</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Per KM Rate ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={perKmRate}
                onChange={(e) => setPerKmRate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="20.00"
              />
              <p className="text-xs text-gray-500 mt-1">Rate charged per kilometer of distance</p>
            </div>
          </div>

          {/* Price Preview */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Price Preview</h4>
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Distance (km)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={previewDistance}
                  onChange={(e) => setPreviewDistance(e.target.value)}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
              
              {pricePreview && (
                <div className="flex-1">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Current Price</p>
                      <p className="font-semibold">{formatCurrency(pricePreview.current_price)}</p>
                    </div>
                    {pricePreview.proposed_price && (
                      <>
                        <div>
                          <p className="text-gray-600">New Price</p>
                          <p className="font-semibold">{formatCurrency(pricePreview.proposed_price)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Difference</p>
                          <p className={`font-semibold ${pricePreview.price_difference >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pricePreview.price_difference >= 0 ? '+' : ''}{formatCurrency(pricePreview.price_difference)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">Change %</p>
                          <p className={`font-semibold ${pricePreview.price_change_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {pricePreview.price_change_percent >= 0 ? '+' : ''}{pricePreview.price_change_percent.toFixed(1)}%
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={updateLoading || !baseFee || !perKmRate}
              className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {updateLoading ? 'Updating...' : 'Update Configuration'}
            </button>
          </div>
        </form>
      </div>

      {/* Pricing History */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing History</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Base Fee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Per KM Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pricingHistory.map((config) => (
                <tr key={config.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(config.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(config.base_fee)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(config.per_km_rate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {config.created_by_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      config.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {config.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}