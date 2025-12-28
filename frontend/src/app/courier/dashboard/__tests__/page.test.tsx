import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'styled-components';
import { enhancedTheme } from '@/lib/theme';
import CourierDashboard from '../page';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    request: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockCourierProfile = {
  profile: {
    id: 1,
    username: 'courier1',
    first_name: 'John',
    last_name: 'Doe',
    email: 'john@example.com',
    phone_number: '+1234567890',
  },
  courier_status: {
    is_available: true,
    current_orders_count: 2,
    location_description: 'Downtown area',
    last_activity: '2024-01-15T10:00:00Z',
  },
  statistics: {
    total_completed_orders: 25,
    current_active_orders: 2,
    current_orders: [
      {
        id: 1,
        status: 'ASSIGNED',
        pickup_address: '123 Main St',
        delivery_address: '456 Oak Ave',
        distance_km: 5.2,
        price: 154.00,
      },
      {
        id: 2,
        status: 'IN_TRANSIT',
        pickup_address: '789 Pine St',
        delivery_address: '321 Elm St',
        distance_km: 3.1,
        price: 112.00,
      },
    ],
  },
};

const mockAvailableOrders = [
  {
    id: 3,
    pickup_address: '555 Cedar St',
    delivery_address: '777 Maple Ave',
    distance_km: 4.5,
    price: 140.00,
    created_at: '2024-01-15T11:00:00Z',
    customer_name: 'Jane Smith',
  },
  {
    id: 4,
    pickup_address: '999 Birch Rd',
    delivery_address: '111 Willow Dr',
    distance_km: 2.8,
    price: 106.00,
    created_at: '2024-01-15T11:15:00Z',
    customer_name: 'Bob Johnson',
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <ThemeProvider theme={enhancedTheme}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
};

describe('CourierDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');
    localStorage.setItem('user_id', '1');
  });

  it('renders dashboard correctly with courier profile data', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      });

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Welcome back, John!')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getAllByText('2')).toHaveLength(3); // Active orders appears multiple times
      expect(screen.getAllByText('25')).toHaveLength(3); // Completed orders appears multiple times
    });
  });

  it('displays availability status correctly', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          ...mockCourierProfile,
          courier_status: {
            ...mockCourierProfile.courier_status,
            is_available: false,
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      });

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Offline')).toBeInTheDocument();
      expect(screen.getByText('Go Online')).toBeInTheDocument();
    });
  });

  it('handles availability toggle correctly', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      const toggleButton = screen.getByText('Go Offline');
      fireEvent.click(toggleButton);
    });

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith(
        '/api/orders/courier-status/update_availability/',
        {
          method: 'PATCH',
          body: JSON.stringify({
            is_available: false,
          }),
        }
      );
    });
  });

  it('displays current active orders correctly', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      });

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Current Active Orders')).toBeInTheDocument();
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('ASSIGNED')).toBeInTheDocument();
      expect(screen.getByText('IN TRANSIT')).toBeInTheDocument();
    });
  });

  it('displays available orders for acceptance', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      });

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('Available Orders')).toHaveLength(2); // Header and section title
      expect(screen.getByText('Order #3')).toBeInTheDocument();
      expect(screen.getByText('Order #4')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      expect(screen.getAllByRole('button', { name: /Accept Order/i })).toHaveLength(2);
    });
  });

  it('handles order acceptance correctly', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

    // Mock window.alert
    window.alert = jest.fn();

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      const acceptButtons = screen.getAllByRole('button', { name: /Accept Order/i });
      fireEvent.click(acceptButtons[0]);
    });

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith(
        '/api/orders/orders/3/accept_order/',
        {
          method: 'POST',
        }
      );
      expect(window.alert).toHaveBeenCalledWith('Order accepted successfully!');
    });
  });

  it('disables order acceptance when courier is unavailable', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: {
          ...mockCourierProfile,
          courier_status: {
            ...mockCourierProfile.courier_status,
            is_available: false,
          },
        },
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      });

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      const acceptButtons = screen.getAllByRole('button', { name: /Accept Order/i });
      acceptButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });

  it('shows loading state initially', () => {
    (apiClient.request as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<CourierDashboard />, { wrapper: createWrapper() });

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (apiClient.request as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      });

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Component should handle error gracefully and not crash
      expect(screen.queryByText('Welcome, John!')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no available orders', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: [],
        error: null,
      });

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No available orders')).toBeInTheDocument();
      expect(screen.getByText('Check back later for new delivery opportunities.')).toBeInTheDocument();
    });
  });

  it('handles order acceptance error', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: 'Order already assigned',
      });

    // Mock window.alert
    window.alert = jest.fn();

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      const acceptButtons = screen.getAllByRole('button', { name: /Accept Order/i });
      fireEvent.click(acceptButtons[0]);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error accepting order: Order already assigned');
    });
  });

  it('displays workload statistics correctly', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      });

    render(<CourierDashboard />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check that the statistics cards contain the expected values
      expect(screen.getAllByText('2')).toHaveLength(3); // Active orders appears multiple times
      expect(screen.getAllByText('25')).toHaveLength(3); // Completed orders appears multiple times
    });
  });
});