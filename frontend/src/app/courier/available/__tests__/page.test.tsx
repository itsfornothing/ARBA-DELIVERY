import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultTheme } from '@/lib/theme';
import AvailableOrders from '../page';
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

const mockAvailableOrders = [
  {
    id: 1,
    pickup_address: '123 Main St',
    delivery_address: '456 Oak Ave',
    distance_km: 5.2,
    price: 154.00,
    created_at: '2024-01-15T10:00:00Z',
    customer_name: 'John Doe',
  },
  {
    id: 2,
    pickup_address: '789 Pine St',
    delivery_address: '321 Elm St',
    distance_km: 3.1,
    price: 112.00,
    created_at: '2024-01-15T09:30:00Z',
    customer_name: 'Jane Smith',
  },
  {
    id: 3,
    pickup_address: '555 Cedar St',
    delivery_address: '777 Maple Ave',
    distance_km: 2.8,
    price: 106.00,
    created_at: '2024-01-15T11:00:00Z',
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
    <ThemeProvider defaultTheme={defaultTheme}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );
};

describe('AvailableOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');
    localStorage.setItem('user_id', '1');
  });

  it('renders available orders page correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Available Orders')).toBeInTheDocument();
      expect(screen.getByText('3 orders available for pickup')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
      expect(screen.getByText('My Orders')).toBeInTheDocument();
    });
  });

  it('displays all available orders with correct information', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
      expect(screen.getByText('Order #3')).toBeInTheDocument();
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('5.2 km')).toBeInTheDocument();
      expect(screen.getByText('$154')).toBeInTheDocument();
    });
  });

  it('handles order acceptance correctly', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      })
      .mockResolvedValueOnce({
        data: mockAvailableOrders.slice(1), // Return orders without the accepted one
        error: null,
      });

    // Mock window.alert
    window.alert = jest.fn();

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const acceptButtons = screen.getAllByText('Accept Order');
      fireEvent.click(acceptButtons[0]);
    });

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith(
        '/api/orders/orders/1/accept_order/',
        {
          method: 'POST',
        }
      );
      expect(window.alert).toHaveBeenCalledWith('Order accepted successfully! You can now manage it from your orders page.');
    });
  });

  it('shows accepting state during order acceptance', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockAvailableOrders,
        error: null,
      })
      .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const acceptButtons = screen.getAllByText('Accept Order');
      fireEvent.click(acceptButtons[0]);
    });

    await waitFor(() => {
      expect(screen.getByText('Accepting...')).toBeInTheDocument();
      expect(screen.getByText('Accepting...')).toBeDisabled();
    });
  });

  it('sorts orders by date correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    // Wait for initial render
    await waitFor(() => {
      expect(screen.getByText('Available Orders')).toBeInTheDocument();
    });

    // Click sort by date button
    const sortByDateButton = screen.getByText('Date');
    fireEvent.click(sortByDateButton);

    // Orders should be sorted by date (ascending after first click)
    await waitFor(() => {
      const orderElements = screen.getAllByText(/Order #/);
      expect(orderElements[0]).toHaveTextContent('Order #2'); // 09:30:00Z (oldest)
      expect(orderElements[1]).toHaveTextContent('Order #1'); // 10:00:00Z
      expect(orderElements[2]).toHaveTextContent('Order #3'); // 11:00:00Z (newest)
    });
  });

  it('sorts orders by distance correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const sortByDistanceButton = screen.getByText('Distance');
      fireEvent.click(sortByDistanceButton);
    });

    // Orders should be sorted by distance (ascending)
    await waitFor(() => {
      const orderElements = screen.getAllByText(/Order #/);
      expect(orderElements[0]).toHaveTextContent('Order #3'); // 2.8 km
      expect(orderElements[1]).toHaveTextContent('Order #2'); // 3.1 km
      expect(orderElements[2]).toHaveTextContent('Order #1'); // 5.2 km
    });
  });

  it('sorts orders by price correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const sortByPriceButton = screen.getByText('Price');
      fireEvent.click(sortByPriceButton);
    });

    // Orders should be sorted by price (ascending)
    await waitFor(() => {
      const orderElements = screen.getAllByText(/Order #/);
      expect(orderElements[0]).toHaveTextContent('Order #3'); // $106
      expect(orderElements[1]).toHaveTextContent('Order #2'); // $112
      expect(orderElements[2]).toHaveTextContent('Order #1'); // $154
    });
  });

  it('toggles sort order when clicking same sort button', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const sortByPriceButton = screen.getByText('Price');
      // First click - ascending
      fireEvent.click(sortByPriceButton);
    });

    await waitFor(() => {
      // Second click - descending
      fireEvent.click(screen.getByText('Price'));
    });

    // Orders should be sorted by price (descending)
    await waitFor(() => {
      const orderElements = screen.getAllByText(/Order #/);
      expect(orderElements[0]).toHaveTextContent('Order #1'); // $154
      expect(orderElements[1]).toHaveTextContent('Order #2'); // $112
      expect(orderElements[2]).toHaveTextContent('Order #3'); // $106
    });
  });

  it('displays order quick info correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check for estimated time, distance, and rate info
      expect(screen.getByText('Est. 36 min')).toBeInTheDocument(); // 5.2 * 5 + 10
      expect(screen.getByText('5.2 km route')).toBeInTheDocument();
      expect(screen.getAllByText('Good rate')).toHaveLength(3); // One for each order
      
      // Check per km rate calculation
      expect(screen.getByText('~$29.62 per km')).toBeInTheDocument(); // 154 / 5.2
    });
  });

  it('shows empty state when no orders available', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No available orders')).toBeInTheDocument();
      expect(screen.getByText('There are currently no orders available for pickup. Check back later or refresh the page.')).toBeInTheDocument();
      expect(screen.getByText('Refresh Orders')).toBeInTheDocument();
    });
  });

  it('handles refresh functionality', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);
    });

    // Should call the API again
    expect(apiClient.request).toHaveBeenCalledTimes(2);
  });

  it('handles order acceptance error', async () => {
    (apiClient.request as jest.Mock)
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

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const acceptButtons = screen.getAllByText('Accept Order');
      fireEvent.click(acceptButtons[0]);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error accepting order: Order already assigned');
    });
  });

  it('shows loading state initially', () => {
    (apiClient.request as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<AvailableOrders />, { wrapper: createWrapper() });

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (apiClient.request as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Component should handle error gracefully and not crash
      expect(screen.queryByText('Available Orders')).toBeInTheDocument();
    });
  });

  it('shows auto-refresh indicator', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('This page automatically refreshes every 30 seconds to show new orders')).toBeInTheDocument();
    });
  });

  it('navigates to my orders page', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const myOrdersLink = screen.getByText('My Orders');
      expect(myOrdersLink.closest('a')).toHaveAttribute('href', '/courier/orders');
    });
  });

  it('displays order status as Available', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockAvailableOrders,
      error: null,
    });

    render(<AvailableOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const availableStatuses = screen.getAllByText('Available');
      expect(availableStatuses).toHaveLength(3); // One for each order
    });
  });
});