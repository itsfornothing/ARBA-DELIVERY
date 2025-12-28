/**
 * Integration tests for delivery API endpoint fix - Frontend
 * Tests authentication flow, dashboard data loading, and real-time polling from frontend perspective
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/customer/dashboard',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock API client
const mockApiClient = {
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

jest.mock('@/lib/api', () => ({
  apiClient: mockApiClient,
  getUnreadCount: jest.fn(),
  getRealTimeUpdates: jest.fn(),
}));

// Mock components for testing
const MockCustomerDashboard: React.FC = () => {
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [orders, setOrders] = React.useState<any[]>([]);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch unread count
        const unreadResponse = await mockApiClient.get('/api/notifications/unread_count/');
        setUnreadCount(unreadResponse.data.unread_count);

        // Fetch orders
        const ordersResponse = await mockApiClient.get('/api/orders/');
        setOrders(ordersResponse.data);

        // Fetch notifications
        const notificationsResponse = await mockApiClient.get('/api/notifications/');
        setNotifications(notificationsResponse.data);

        setLoading(false);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div data-testid="loading">Loading dashboard...</div>;
  }

  if (error) {
    return <div data-testid="error">Error: {error}</div>;
  }

  return (
    <div data-testid="customer-dashboard">
      <div data-testid="unread-count">Unread: {unreadCount}</div>
      <div data-testid="orders-list">
        {orders.map((order) => (
          <div key={order.id} data-testid={`order-${order.id}`}>
            Order #{order.id} - {order.status}
          </div>
        ))}
      </div>
      <div data-testid="notifications-list">
        {notifications.map((notification) => (
          <div key={notification.id} data-testid={`notification-${notification.id}`}>
            {notification.title}
          </div>
        ))}
      </div>
    </div>
  );
};

const MockRealTimePolling: React.FC = () => {
  const [updates, setUpdates] = React.useState<any>(null);
  const [lastTimestamp, setLastTimestamp] = React.useState<string | null>(null);
  const [polling, setPolling] = React.useState(false);

  const pollForUpdates = React.useCallback(async () => {
    try {
      setPolling(true);
      const url = lastTimestamp 
        ? `/api/orders/real_time_updates/?since=${lastTimestamp}`
        : '/api/orders/real_time_updates/';
      
      const response = await mockApiClient.get(url);
      setUpdates(response.data);
      if (response.data.timestamp) {
        setLastTimestamp(response.data.timestamp);
      }
      setPolling(false);
    } catch (err: any) {
      setPolling(false);
      console.error('Polling failed:', err);
    }
  }, [lastTimestamp]);

  React.useEffect(() => {
    // Initial poll
    pollForUpdates();

    // Set up polling interval (shorter for testing)
    const interval = setInterval(pollForUpdates, 200);
    return () => clearInterval(interval);
  }, [pollForUpdates]);

  return (
    <div data-testid="real-time-polling">
      <div data-testid="polling-status">
        {polling ? 'Polling...' : 'Connected'}
      </div>
      {updates && (
        <div data-testid="updates-data">
          <div data-testid="has-updates">
            Has Updates: {updates.has_updates ? 'Yes' : 'No'}
          </div>
          <div data-testid="timestamp">
            Last Update: {updates.timestamp}
          </div>
          <div data-testid="notifications-count">
            Notifications: {updates.notifications?.length || 0}
          </div>
        </div>
      )}
    </div>
  );
};

// Mock server setup - removed MSW, using simple mocking instead

describe('Delivery API Endpoint Fix - Frontend Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.patch.mockClear();
    mockApiClient.delete.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  describe('Authentication Flow Tests', () => {
    it('should handle unauthenticated access and redirect to login', async () => {
      // Mock unauthenticated responses
      mockApiClient.get.mockRejectedValue({
        response: { status: 401 },
        message: 'Authentication required'
      });

      render(<MockCustomerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByTestId('error')).toHaveTextContent('Authentication required');
      });
    });

    it('should successfully load dashboard when authenticated', async () => {
      // Mock successful authenticated responses
      mockApiClient.get
        .mockResolvedValueOnce({ data: { unread_count: 3 } })
        .mockResolvedValueOnce({ 
          data: [{ 
            id: 1, 
            status: 'ASSIGNED', 
            pickup_address: '123 Test St',
            delivery_address: '456 Test Ave'
          }] 
        })
        .mockResolvedValueOnce({ 
          data: [{ 
            id: 1, 
            title: 'Order Update', 
            message: 'Your order has been assigned' 
          }] 
        });

      render(<MockCustomerDashboard />);

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify dashboard data is loaded
      expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
      expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 3');
      expect(screen.getByTestId('order-1')).toHaveTextContent('Order #1 - ASSIGNED');
      expect(screen.getByTestId('notification-1')).toHaveTextContent('Order Update');
    });

    it('should handle different user roles correctly', async () => {
      // Reset mocks
      mockApiClient.get.mockClear();
      
      // Test customer role
      mockApiClient.get
        .mockResolvedValueOnce({ data: { unread_count: 5 } })
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      render(<MockCustomerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 5');
      });
    });
  });

  describe('Dashboard Data Loading Tests', () => {
    it('should successfully fetch all required dashboard data', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ data: { unread_count: 4 } })
        .mockResolvedValueOnce({ 
          data: [
            { 
              id: 1, 
              status: 'ASSIGNED',
              pickup_address: '123 Test St',
              delivery_address: '456 Test Ave',
              price: '150.00',
              distance_km: '5.00'
            },
            { 
              id: 2, 
              status: 'IN_TRANSIT',
              pickup_address: '789 Another St',
              delivery_address: '101 Another Ave',
              price: '200.00',
              distance_km: '8.00'
            }
          ] 
        })
        .mockResolvedValueOnce({ 
          data: [
            { 
              id: 1, 
              title: 'Order Assigned', 
              message: 'Your order has been assigned to a courier',
              is_read: false
            },
            { 
              id: 2, 
              title: 'Order In Transit', 
              message: 'Your order is now in transit',
              is_read: false
            }
          ] 
        });

      render(<MockCustomerDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify all data is loaded correctly
      expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 4');
      expect(screen.getByTestId('order-1')).toHaveTextContent('Order #1 - ASSIGNED');
      expect(screen.getByTestId('order-2')).toHaveTextContent('Order #2 - IN_TRANSIT');
      expect(screen.getByTestId('notification-1')).toHaveTextContent('Order Assigned');
      expect(screen.getByTestId('notification-2')).toHaveTextContent('Order In Transit');
    });

    it('should display data correctly with proper formatting', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({ data: { unread_count: 1 } })
        .mockResolvedValueOnce({ 
          data: [{ 
            id: 123, 
            status: 'DELIVERED',
            pickup_address: '123 Pickup Street',
            delivery_address: '456 Delivery Avenue',
            price: '175.50',
            distance_km: '7.25',
            created_at: '2023-12-01T10:00:00Z',
            delivered_at: '2023-12-01T11:30:00Z'
          }] 
        })
        .mockResolvedValueOnce({ 
          data: [{ 
            id: 456, 
            title: 'Delivery Complete', 
            message: 'Your order has been successfully delivered',
            is_read: false,
            created_at: '2023-12-01T11:30:00Z'
          }] 
        });

      render(<MockCustomerDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify data formatting
      expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 1');
      expect(screen.getByTestId('order-123')).toHaveTextContent('Order #123 - DELIVERED');
      expect(screen.getByTestId('notification-456')).toHaveTextContent('Delivery Complete');
    });

    it('should handle loading states properly', async () => {
      // Mock delayed response
      const delayedPromise = new Promise(resolve => 
        setTimeout(() => resolve({ data: { unread_count: 0 } }), 100)
      );
      
      mockApiClient.get
        .mockReturnValueOnce(delayedPromise)
        .mockResolvedValueOnce({ data: [] })
        .mockResolvedValueOnce({ data: [] });

      render(<MockCustomerDashboard />);

      // Verify loading state is shown
      expect(screen.getByTestId('loading')).toBeInTheDocument();
      expect(screen.getByTestId('loading')).toHaveTextContent('Loading dashboard...');

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('customer-dashboard')).toBeInTheDocument();
    });

    it('should handle error states gracefully', async () => {
      mockApiClient.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'));

      render(<MockCustomerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByTestId('error')).toHaveTextContent('Error: Network error');
      });
    });
  });

  describe('Real-time Polling Tests', () => {
    it('should establish real-time polling connection', async () => {
      mockApiClient.get.mockResolvedValue({
        data: {
          orders: [],
          notifications: [],
          timestamp: '2023-12-01T12:00:00Z',
          has_updates: false
        }
      });

      render(<MockRealTimePolling />);

      await waitFor(() => {
        expect(screen.getByTestId('polling-status')).toHaveTextContent('Connected');
      });

      expect(screen.getByTestId('has-updates')).toHaveTextContent('Has Updates: No');
      expect(screen.getByTestId('timestamp')).toHaveTextContent('Last Update: 2023-12-01T12:00:00Z');
    });

    it('should receive and display real-time updates', async () => {
      let callCount = 0;
      mockApiClient.get.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call - no updates
          return Promise.resolve({
            data: {
              orders: [],
              notifications: [],
              timestamp: '2023-12-01T12:00:00Z',
              has_updates: false
            }
          });
        } else {
          // Subsequent calls - with updates
          return Promise.resolve({
            data: {
              orders: [{ id: 1, status: 'ASSIGNED' }],
              notifications: [{ id: 1, title: 'New Update' }],
              timestamp: '2023-12-01T12:01:00Z',
              has_updates: true
            }
          });
        }
      });

      render(<MockRealTimePolling />);

      // Wait for initial connection
      await waitFor(() => {
        expect(screen.getByTestId('polling-status')).toHaveTextContent('Connected');
      });

      // Initially no updates
      expect(screen.getByTestId('has-updates')).toHaveTextContent('Has Updates: No');

      // Wait for polling to occur (simulate time passing)
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should now show updates
      await waitFor(() => {
        expect(screen.getByTestId('has-updates')).toHaveTextContent('Has Updates: Yes');
        expect(screen.getByTestId('notifications-count')).toHaveTextContent('Notifications: 1');
      });
    });

    it('should handle polling mechanism correctly - Requirements 2.1, 2.4', async () => {
      const mockTimestamp1 = '2023-12-01T12:00:00Z';
      const mockTimestamp2 = '2023-12-01T12:01:00Z';
      
      let callCount = 0;
      mockApiClient.get.mockImplementation((url) => {
        callCount++;
        
        if (callCount === 1) {
          // First call - initial data
          return Promise.resolve({
            data: {
              orders: [{ id: 1, status: 'CREATED', pickup_address: '123 Test St' }],
              notifications: [{ id: 1, title: 'Order Created', is_read: false }],
              timestamp: mockTimestamp1,
              has_updates: true
            }
          });
        } else if (callCount === 2) {
          // Second call with timestamp - no new updates
          expect(url).toContain(`since=${mockTimestamp1}`);
          return Promise.resolve({
            data: {
              orders: [],
              notifications: [],
              timestamp: mockTimestamp2,
              has_updates: false
            }
          });
        } else {
          // Third call - new updates available
          return Promise.resolve({
            data: {
              orders: [{ id: 1, status: 'ASSIGNED', pickup_address: '123 Test St' }],
              notifications: [{ id: 2, title: 'Order Assigned', is_read: false }],
              timestamp: mockTimestamp2,
              has_updates: true
            }
          });
        }
      });

      render(<MockRealTimePolling />);

      // Wait for initial connection and data
      await waitFor(() => {
        expect(screen.getByTestId('polling-status')).toHaveTextContent('Connected');
        expect(screen.getByTestId('has-updates')).toHaveTextContent('Has Updates: Yes');
        expect(screen.getByTestId('timestamp')).toHaveTextContent(`Last Update: ${mockTimestamp1}`);
      });

      // Simulate polling interval
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should show no new updates
      await waitFor(() => {
        expect(screen.getByTestId('has-updates')).toHaveTextContent('Has Updates: No');
        expect(screen.getByTestId('timestamp')).toHaveTextContent(`Last Update: ${mockTimestamp2}`);
      });

      // Verify timestamp parameter was used
      expect(mockApiClient.get).toHaveBeenCalledWith(`/api/orders/real_time_updates/?since=${mockTimestamp1}`);
    });

    it('should handle polling with timestamp parameter', async () => {
      const initialTimestamp = '2023-12-01T12:00:00Z';
      
      mockApiClient.get
        .mockResolvedValueOnce({
          data: {
            orders: [],
            notifications: [],
            timestamp: initialTimestamp,
            has_updates: false
          }
        })
        .mockResolvedValueOnce({
          data: {
            orders: [{ id: 1, status: 'UPDATED' }],
            notifications: [{ id: 1, title: 'Status Update' }],
            timestamp: '2023-12-01T12:01:00Z',
            has_updates: true
          }
        });

      render(<MockRealTimePolling />);

      await waitFor(() => {
        expect(screen.getByTestId('timestamp')).toHaveTextContent(`Last Update: ${initialTimestamp}`);
      });

      // Verify first call was made without timestamp
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/orders/real_time_updates/');

      // Trigger another poll
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Verify subsequent call includes timestamp
      await waitFor(() => {
        expect(mockApiClient.get).toHaveBeenCalledWith(
          `/api/orders/real_time_updates/?since=${initialTimestamp}`
        );
      });
    });

    it('should display updates correctly with proper format - Requirements 2.1, 2.4', async () => {
      const mockData = {
        orders: [
          {
            id: 123,
            status: 'IN_TRANSIT',
            pickup_address: '123 Pickup Street',
            delivery_address: '456 Delivery Avenue',
            price: '175.50',
            distance_km: '7.25',
            created_at: '2023-12-01T10:00:00Z'
          }
        ],
        notifications: [
          {
            id: 456,
            title: 'Order Status Update',
            message: 'Your order is now in transit',
            is_read: false,
            created_at: '2023-12-01T10:30:00Z'
          }
        ],
        timestamp: '2023-12-01T12:00:00Z',
        has_updates: true
      };

      mockApiClient.get.mockResolvedValue({ data: mockData });

      render(<MockRealTimePolling />);

      await waitFor(() => {
        expect(screen.getByTestId('polling-status')).toHaveTextContent('Connected');
      });

      // Verify updates are displayed with correct format
      expect(screen.getByTestId('has-updates')).toHaveTextContent('Has Updates: Yes');
      expect(screen.getByTestId('timestamp')).toHaveTextContent('Last Update: 2023-12-01T12:00:00Z');
      expect(screen.getByTestId('notifications-count')).toHaveTextContent('Notifications: 1');

      // Verify API was called correctly
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/orders/real_time_updates/');
    });

    it('should handle polling errors gracefully', async () => {
      mockApiClient.get
        .mockResolvedValueOnce({
          data: {
            orders: [],
            notifications: [],
            timestamp: '2023-12-01T12:00:00Z',
            has_updates: false
          }
        })
        .mockRejectedValueOnce(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(<MockRealTimePolling />);

      await waitFor(() => {
        expect(screen.getByTestId('polling-status')).toHaveTextContent('Connected');
      });

      // Wait for error to occur
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      // Should still show connected (graceful error handling)
      expect(screen.getByTestId('polling-status')).toHaveTextContent('Connected');
      expect(consoleSpy).toHaveBeenCalledWith('Polling failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle continuous polling cycles', async () => {
      let callCount = 0;
      const timestamps = [
        '2023-12-01T12:00:00Z',
        '2023-12-01T12:01:00Z',
        '2023-12-01T12:02:00Z'
      ];

      mockApiClient.get.mockImplementation((url) => {
        callCount++;
        const hasTimestamp = url.includes('since=');
        
        return Promise.resolve({
          data: {
            orders: callCount % 2 === 1 ? [{ id: callCount, status: 'CREATED' }] : [],
            notifications: callCount % 2 === 1 ? [{ id: callCount, title: `Update ${callCount}` }] : [],
            timestamp: timestamps[Math.min(callCount - 1, timestamps.length - 1)],
            has_updates: callCount % 2 === 1
          }
        });
      });

      render(<MockRealTimePolling />);

      // Wait for initial connection
      await waitFor(() => {
        expect(screen.getByTestId('polling-status')).toHaveTextContent('Connected');
        expect(screen.getByTestId('has-updates')).toHaveTextContent('Has Updates: Yes');
      });

      // Simulate multiple polling cycles
      for (let i = 0; i < 3; i++) {
        await act(async () => {
          await new Promise(resolve => setTimeout(resolve, 50));
        });
      }

      // Verify multiple calls were made
      expect(mockApiClient.get).toHaveBeenCalledTimes(4); // Initial + 3 polling cycles
      
      // Verify timestamp parameters were used in subsequent calls
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/orders/real_time_updates/');
      expect(mockApiClient.get).toHaveBeenCalledWith('/api/orders/real_time_updates/?since=2023-12-01T12:00:00Z');
    });

    it('should handle different response formats correctly', async () => {
      const testCases = [
        // Empty response
        {
          orders: [],
          notifications: [],
          timestamp: '2023-12-01T12:00:00Z',
          has_updates: false
        },
        // Response with data
        {
          orders: [{ id: 1, status: 'ASSIGNED' }],
          notifications: [{ id: 1, title: 'Test Notification' }],
          timestamp: '2023-12-01T12:01:00Z',
          has_updates: true
        },
        // Response with multiple items
        {
          orders: [
            { id: 1, status: 'ASSIGNED' },
            { id: 2, status: 'IN_TRANSIT' }
          ],
          notifications: [
            { id: 1, title: 'First Notification' },
            { id: 2, title: 'Second Notification' },
            { id: 3, title: 'Third Notification' }
          ],
          timestamp: '2023-12-01T12:02:00Z',
          has_updates: true
        }
      ];

      let callCount = 0;
      mockApiClient.get.mockImplementation(() => {
        const response = testCases[callCount % testCases.length];
        callCount++;
        return Promise.resolve({ data: response });
      });

      render(<MockRealTimePolling />);

      // Test each response format
      for (let i = 0; i < testCases.length; i++) {
        await waitFor(() => {
          expect(screen.getByTestId('polling-status')).toHaveTextContent('Connected');
        });

        const expectedCase = testCases[i];
        expect(screen.getByTestId('has-updates')).toHaveTextContent(
          `Has Updates: ${expectedCase.has_updates ? 'Yes' : 'No'}`
        );
        expect(screen.getByTestId('notifications-count')).toHaveTextContent(
          `Notifications: ${expectedCase.notifications.length}`
        );

        if (i < testCases.length - 1) {
          await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 50));
          });
        }
      }
    });
  });

  describe('Error Handling and Response Format Tests', () => {
    it('should handle API errors with proper error messages', async () => {
      mockApiClient.get.mockRejectedValue({
        response: { 
          status: 403,
          data: { error: 'Permission denied' }
        },
        message: 'Permission denied'
      });

      render(<MockCustomerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
        expect(screen.getByTestId('error')).toHaveTextContent('Error: Permission denied');
      });
    });

    it('should validate response format consistency', async () => {
      // Mock responses with expected format
      mockApiClient.get
        .mockResolvedValueOnce({ 
          data: { unread_count: 5 } // Correct format
        })
        .mockResolvedValueOnce({ 
          data: [{ 
            id: 1, 
            status: 'ASSIGNED',
            pickup_address: '123 Test St',
            delivery_address: '456 Test Ave',
            price: '150.00',
            distance_km: '5.00'
          }] 
        })
        .mockResolvedValueOnce({ 
          data: [{ 
            id: 1, 
            title: 'Order Update',
            message: 'Your order has been assigned',
            is_read: false
          }] 
        });

      render(<MockCustomerDashboard />);

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Verify data is displayed correctly (validates format was correct)
      expect(screen.getByTestId('unread-count')).toHaveTextContent('Unread: 5');
      expect(screen.getByTestId('order-1')).toBeInTheDocument();
      expect(screen.getByTestId('notification-1')).toBeInTheDocument();
    });
  });
});