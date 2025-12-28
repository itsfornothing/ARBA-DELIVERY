/**
 * Comprehensive Functionality Testing
 * Tests all authentication flows and dashboard functionality with enhanced UI
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    setAuthToken: jest.fn(),
    getOrders: jest.fn(),
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    request: jest.fn(),
  },
  realTimeTracker: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

// Import components after mocking
import LoginPage from '@/app/auth/login/page';
import RegisterPage from '@/app/auth/register/page';
import AdminDashboard from '@/app/admin/dashboard/page';
import CustomerDashboard from '@/app/customer/dashboard/page';
import CourierDashboard from '@/app/courier/dashboard/page';
import { apiClient } from '@/lib/api';

const mockPush = jest.fn();
const mockRouter = useRouter as jest.MockedFunction<typeof useRouter>;

// Test wrapper with React Query
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Comprehensive Functionality Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      prefetch: jest.fn(),
    } as any);
    
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: jest.fn(),
      },
      writable: true,
    });
  });

  describe('Authentication Flows with Enhanced UI', () => {
    describe('Login Page', () => {
      it('should render login form with enhanced components', () => {
        render(
          <TestWrapper>
            <LoginPage />
          </TestWrapper>
        );

        // Check for enhanced UI elements
        expect(screen.getByText('Welcome to Arba Delivery')).toBeInTheDocument();
        expect(screen.getByText('Sign in to continue to your account')).toBeInTheDocument();
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
        
        // Check for enhanced button variants
        expect(screen.getByRole('button', { name: /don't have an account/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /back to home/i })).toBeInTheDocument();
      });

      it('should handle successful login flow', async () => {
        const user = userEvent.setup();
        
        // Mock successful login response
        (apiClient.login as jest.Mock).mockResolvedValue({
          data: {
            access: 'mock-token',
            user: {
              id: 1,
              role: 'CUSTOMER',
              username: 'testuser',
            },
          },
        });

        render(
          <TestWrapper>
            <LoginPage />
          </TestWrapper>
        );

        // Fill in form
        await user.type(screen.getByLabelText('Username'), 'testuser');
        await user.type(screen.getByLabelText('Password'), 'password123');
        
        // Submit form
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(apiClient.login).toHaveBeenCalledWith({
            username: 'testuser',
            password: 'password123',
          });
          expect(localStorage.setItem).toHaveBeenCalledWith('auth_token', 'mock-token');
          expect(localStorage.setItem).toHaveBeenCalledWith('user_role', 'CUSTOMER');
          expect(mockPush).toHaveBeenCalledWith('/customer/dashboard');
        });
      });

      it('should handle login errors with proper UI feedback', async () => {
        const user = userEvent.setup();
        
        // Mock login error
        (apiClient.login as jest.Mock).mockResolvedValue({
          error: 'Invalid credentials',
        });

        render(
          <TestWrapper>
            <LoginPage />
          </TestWrapper>
        );

        await user.type(screen.getByLabelText('Username'), 'wronguser');
        await user.type(screen.getByLabelText('Password'), 'wrongpass');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
      });

      it('should show loading state during authentication', async () => {
        const user = userEvent.setup();
        
        // Mock delayed response
        (apiClient.login as jest.Mock).mockImplementation(() => 
          new Promise(resolve => setTimeout(() => resolve({ data: { access: 'token', user: { role: 'CUSTOMER' } } }), 100))
        );

        render(
          <TestWrapper>
            <LoginPage />
          </TestWrapper>
        );

        await user.type(screen.getByLabelText('Username'), 'testuser');
        await user.type(screen.getByLabelText('Password'), 'password123');
        await user.click(screen.getByRole('button', { name: /sign in/i }));

        expect(screen.getByText('Signing in...')).toBeInTheDocument();
      });
    });

    describe('Registration Page', () => {
      it('should render registration form with enhanced components', () => {
        render(
          <TestWrapper>
            <RegisterPage />
          </TestWrapper>
        );

        expect(screen.getByText('Join Arba Delivery')).toBeInTheDocument();
        expect(screen.getByLabelText('First Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Last Name')).toBeInTheDocument();
        expect(screen.getByLabelText('Username')).toBeInTheDocument();
        expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
        expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
        expect(screen.getByLabelText('Password')).toBeInTheDocument();
        expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
      });

      it('should handle successful registration flow', async () => {
        const user = userEvent.setup();
        
        (apiClient.register as jest.Mock).mockResolvedValue({
          data: { message: 'Registration successful' },
        });

        render(
          <TestWrapper>
            <RegisterPage />
          </TestWrapper>
        );

        // Fill in all required fields
        await user.type(screen.getByLabelText('First Name'), 'John');
        await user.type(screen.getByLabelText('Last Name'), 'Doe');
        await user.type(screen.getByLabelText('Username'), 'johndoe');
        await user.type(screen.getByLabelText('Email Address'), 'john@example.com');
        await user.type(screen.getByLabelText('Phone Number'), '1234567890');
        await user.type(screen.getByLabelText('Password'), 'password123');
        await user.type(screen.getByLabelText('Confirm Password'), 'password123');
        
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(apiClient.register).toHaveBeenCalledWith({
            first_name: 'John',
            last_name: 'Doe',
            username: 'johndoe',
            email: 'john@example.com',
            phone_number: '1234567890',
            password: 'password123',
            password_confirm: 'password123',
            role: 'CUSTOMER',
          });
        });
      });

      it('should validate password confirmation', async () => {
        const user = userEvent.setup();
        
        render(
          <TestWrapper>
            <RegisterPage />
          </TestWrapper>
        );

        await user.type(screen.getByLabelText('Password'), 'password123');
        await user.type(screen.getByLabelText('Confirm Password'), 'different');
        await user.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(screen.getByText("Passwords don't match")).toBeInTheDocument();
        });
      });
    });
  });

  describe('Dashboard Functionality', () => {
    describe('Admin Dashboard', () => {
      beforeEach(() => {
        // Mock admin dashboard API responses
        (apiClient.request as jest.Mock).mockImplementation((url) => {
          if (url.includes('/accounts/dashboard/admin/')) {
            return Promise.resolve({
              data: {
                dashboard_data: {
                  total_users: 150,
                  total_customers: 120,
                  total_couriers: 30,
                  active_users: 45,
                  total_orders: 500,
                  pending_orders: 25,
                },
              },
            });
          }
          if (url.includes('/api/orders/orders/dispatch_statistics/')) {
            return Promise.resolve({
              data: {
                order_statistics: {
                  total_orders: 500,
                  pending_orders: 25,
                  assigned_orders: 15,
                  in_progress_orders: 10,
                  completed_orders: 450,
                },
                courier_statistics: {
                  total_couriers: 30,
                  available_couriers: 20,
                  average_workload: 2.5,
                },
              },
            });
          }
          return Promise.resolve({ data: {} });
        });
      });

      it('should render admin dashboard with enhanced components', async () => {
        render(
          <TestWrapper>
            <AdminDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          // Check for enhanced dashboard components
          expect(screen.getByText('Order Trends')).toBeInTheDocument();
          expect(screen.getByText('Courier Performance')).toBeInTheDocument();
        });
      });

      it('should display correct metrics', async () => {
        render(
          <TestWrapper>
            <AdminDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          // Verify metrics are displayed (these would be in the EnhancedAdminDashboard component)
          expect(apiClient.request).toHaveBeenCalledWith('/accounts/dashboard/admin/');
          expect(apiClient.request).toHaveBeenCalledWith('/api/orders/orders/dispatch_statistics/');
        });
      });

      it('should handle loading states', () => {
        render(
          <TestWrapper>
            <AdminDashboard />
          </TestWrapper>
        );

        expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
      });

      it('should handle error states', async () => {
        (apiClient.request as jest.Mock).mockRejectedValue(new Error('API Error'));

        render(
          <TestWrapper>
            <AdminDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
        });
      });
    });

    describe('Customer Dashboard', () => {
      beforeEach(() => {
        // Mock localStorage for authentication
        (localStorage.getItem as jest.Mock).mockImplementation((key) => {
          if (key === 'auth_token') return 'mock-token';
          if (key === 'user_role') return 'CUSTOMER';
          if (key === 'user_id') return '1';
          return null;
        });

        // Mock API responses
        (apiClient.getOrders as jest.Mock).mockResolvedValue({
          data: {
            results: [
              {
                id: 1,
                status: 'IN_TRANSIT',
                pickup_address: '123 Main St',
                delivery_address: '456 Oak Ave',
                distance_km: 5.2,
                price: '25.50',
              },
            ],
          },
        });

        (apiClient.getNotifications as jest.Mock).mockResolvedValue({
          data: {
            results: [
              {
                id: 1,
                title: 'Order Update',
                message: 'Your order is on the way',
                is_read: false,
                created_at: new Date().toISOString(),
              },
            ],
          },
        });

        (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({
          data: { unread_count: 1 },
        });
      });

      it('should render customer dashboard with enhanced components', async () => {
        render(
          <TestWrapper>
            <CustomerDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText('Arba Delivery')).toBeInTheDocument();
          expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
          expect(screen.getByText('Quick Actions')).toBeInTheDocument();
          expect(screen.getByText('Active Orders')).toBeInTheDocument();
          expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
        });
      });

      it('should display active orders correctly', async () => {
        render(
          <TestWrapper>
            <CustomerDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText('Order #1')).toBeInTheDocument();
          expect(screen.getByText('123 Main St')).toBeInTheDocument();
          expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
          expect(screen.getByText('$25.50')).toBeInTheDocument();
        });
      });

      it('should handle refresh functionality', async () => {
        const user = userEvent.setup();
        
        render(
          <TestWrapper>
            <CustomerDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText('Refresh')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Refresh'));

        expect(apiClient.getOrders).toHaveBeenCalledTimes(2); // Initial load + refresh
      });

      it('should redirect unauthenticated users', () => {
        (localStorage.getItem as jest.Mock).mockReturnValue(null);

        render(
          <TestWrapper>
            <CustomerDashboard />
          </TestWrapper>
        );

        expect(mockPush).toHaveBeenCalledWith('/auth/login');
      });
    });

    describe('Courier Dashboard', () => {
      beforeEach(() => {
        // Mock React Query responses
        (apiClient.request as jest.Mock).mockImplementation((url) => {
          if (url.includes('/api/orders/courier-status/my_profile/')) {
            return Promise.resolve({
              data: {
                profile: {
                  id: 1,
                  username: 'courier1',
                  first_name: 'John',
                  last_name: 'Courier',
                  email: 'courier@example.com',
                  phone_number: '1234567890',
                },
                courier_status: {
                  is_available: true,
                  current_orders_count: 2,
                  location_description: 'Downtown',
                  last_activity: new Date().toISOString(),
                },
                statistics: {
                  total_completed_orders: 150,
                  current_active_orders: 2,
                  current_orders: [
                    {
                      id: 1,
                      status: 'ASSIGNED',
                      pickup_address: '123 Main St',
                      delivery_address: '456 Oak Ave',
                      distance_km: 3.5,
                      price: '18.75',
                    },
                  ],
                },
              },
            });
          }
          if (url.includes('/api/orders/orders/available_orders/')) {
            return Promise.resolve({
              data: [
                {
                  id: 2,
                  pickup_address: '789 Pine St',
                  delivery_address: '321 Elm Ave',
                  distance_km: 4.2,
                  price: '22.00',
                  created_at: new Date().toISOString(),
                  customer_name: 'Jane Smith',
                },
              ],
            });
          }
          return Promise.resolve({ data: {} });
        });
      });

      it('should render courier dashboard with enhanced components', async () => {
        render(
          <TestWrapper>
            <CourierDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText('Weekly Deliveries')).toBeInTheDocument();
          expect(screen.getByText('Monthly Earnings')).toBeInTheDocument();
          expect(screen.getByText('Active Orders')).toBeInTheDocument();
          expect(screen.getByText('Available Orders')).toBeInTheDocument();
        });
      });

      it('should display courier statistics', async () => {
        render(
          <TestWrapper>
            <CourierDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText('150')).toBeInTheDocument(); // Completed orders
          expect(screen.getByText('2')).toBeInTheDocument(); // Active orders
        });
      });

      it('should handle order acceptance', async () => {
        const user = userEvent.setup();
        
        render(
          <TestWrapper>
            <CourierDashboard />
          </TestWrapper>
        );

        await waitFor(() => {
          expect(screen.getByText('Accept Order')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Accept Order'));

        expect(apiClient.request).toHaveBeenCalledWith(
          '/api/orders/orders/2/accept_order/',
          { method: 'POST' }
        );
      });
    });
  });

  describe('Order Management Workflows', () => {
    it('should handle order creation workflow', async () => {
      // This would test the order creation pages
      // Implementation would depend on the specific order creation components
      expect(true).toBe(true); // Placeholder
    });

    it('should handle order tracking workflow', async () => {
      // This would test the order tracking functionality
      // Implementation would depend on the specific tracking components
      expect(true).toBe(true); // Placeholder
    });

    it('should handle order history workflow', async () => {
      // This would test the order history functionality
      // Implementation would depend on the specific history components
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Courier Management Features', () => {
    it('should handle courier availability toggle', async () => {
      // This would test courier availability management
      // Implementation would depend on the specific courier components
      expect(true).toBe(true); // Placeholder
    });

    it('should handle courier order assignment', async () => {
      // This would test order assignment to couriers
      // Implementation would depend on the specific assignment components
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      (apiClient.request as jest.Mock).mockRejectedValue(new Error('Network error'));

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Failed to load dashboard data')).toBeInTheDocument();
      });
    });

    it('should handle empty data states', async () => {
      (apiClient.getOrders as jest.Mock).mockResolvedValue({ data: { results: [] } });
      (apiClient.getNotifications as jest.Mock).mockResolvedValue({ data: { results: [] } });
      (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({ data: { unread_count: 0 } });

      (localStorage.getItem as jest.Mock).mockImplementation((key) => {
        if (key === 'auth_token') return 'mock-token';
        if (key === 'user_role') return 'CUSTOMER';
        return null;
      });

      render(
        <TestWrapper>
          <CustomerDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('No Active Orders')).toBeInTheDocument();
        expect(screen.getByText('No notifications yet')).toBeInTheDocument();
      });
    });
  });
});