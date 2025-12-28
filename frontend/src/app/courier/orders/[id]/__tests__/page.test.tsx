import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultTheme } from '@/lib/theme';
import CourierOrderDetail from '../page';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getOrderTracking: jest.fn(),
    updateOrderStatus: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

// Mock Next.js router
const mockPush = jest.fn();
const mockParams = { id: '1' };
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
  useParams: () => mockParams,
}));

const mockTrackingData = {
  order: {
    id: 1,
    status: 'ASSIGNED',
    pickup_address: '123 Main St',
    delivery_address: '456 Oak Ave',
    distance_km: 5.2,
    price: 154.00,
    created_at: '2024-01-15T10:00:00Z',
    assigned_at: '2024-01-15T10:30:00Z',
    customer_name: 'John Doe',
  },
  progress_percentage: 25,
  tracking_steps: [
    {
      status: 'CREATED',
      label: 'Order Created',
      completed: true,
      timestamp: '2024-01-15T10:00:00Z',
      progress: 0,
    },
    {
      status: 'ASSIGNED',
      label: 'Assigned to Courier',
      completed: true,
      timestamp: '2024-01-15T10:30:00Z',
      progress: 25,
    },
    {
      status: 'PICKED_UP',
      label: 'Package Picked Up',
      completed: false,
      progress: 50,
    },
    {
      status: 'IN_TRANSIT',
      label: 'In Transit',
      completed: false,
      progress: 75,
    },
    {
      status: 'DELIVERED',
      label: 'Delivered',
      completed: false,
      progress: 100,
    },
  ],
  estimated_delivery: '2024-01-15T12:00:00Z',
  recent_notifications: [
    {
      id: 1,
      title: 'Order Assigned',
      message: 'You have been assigned to order #1',
      is_read: false,
      created_at: '2024-01-15T10:30:00Z',
    },
  ],
  last_updated: '2024-01-15T11:00:00Z',
};

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

describe('CourierOrderDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');
    localStorage.setItem('user_id', '1');
  });

  it('renders order detail page correctly', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('ASSIGNED')).toBeInTheDocument();
      expect(screen.getByText('Progress: 25%')).toBeInTheDocument();
      expect(screen.getByText('Delivery Progress')).toBeInTheDocument();
    });
  });

  it('displays order information correctly', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('5.2 km')).toBeInTheDocument();
      expect(screen.getByText('$154')).toBeInTheDocument();
    });
  });

  it('shows correct status update button', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Mark as Picked Up')).toBeInTheDocument();
    });
  });

  it('handles status update correctly', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });
    (apiClient.updateOrderStatus as jest.Mock).mockResolvedValue({
      data: { ...mockTrackingData.order, status: 'PICKED_UP' },
      error: null,
    });

    // Mock window.alert
    window.alert = jest.fn();

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      const updateButton = screen.getByText('Mark as Picked Up');
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(apiClient.updateOrderStatus).toHaveBeenCalledWith(1, 'PICKED_UP');
      expect(window.alert).toHaveBeenCalledWith('Order status updated successfully!');
    });
  });

  it('displays progress bar correctly', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument();
      // Check for progress bar element by more specific selector
      const progressBar = document.querySelector('.bg-green-600.h-2.rounded-full');
      expect(progressBar).toHaveStyle('width: 25%');
    });
  });

  it('displays tracking timeline correctly', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Order Created')).toBeInTheDocument();
      expect(screen.getByText('Assigned to Courier')).toBeInTheDocument();
      expect(screen.getByText('Package Picked Up')).toBeInTheDocument();
      expect(screen.getByText('In Transit')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });
  });

  it('shows different status update buttons for different statuses', async () => {
    // Test PICKED_UP status
    const pickedUpTrackingData = {
      ...mockTrackingData,
      order: {
        ...mockTrackingData.order,
        status: 'PICKED_UP',
      },
    };

    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: pickedUpTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Start Transit')).toBeInTheDocument();
    });
  });

  it('shows no status update button for delivered orders', async () => {
    const deliveredTrackingData = {
      ...mockTrackingData,
      order: {
        ...mockTrackingData.order,
        status: 'DELIVERED',
      },
    };

    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: deliveredTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.queryByText('Mark as')).not.toBeInTheDocument();
      expect(screen.queryByText('Start Transit')).not.toBeInTheDocument();
    });
  });

  it('displays order timeline with timestamps', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Created')).toBeInTheDocument();
      expect(screen.getByText('Assigned')).toBeInTheDocument();
      // Check for formatted timestamps (may appear multiple times)
      expect(screen.getAllByText(new Date('2024-01-15T10:00:00Z').toLocaleString())).toHaveLength(2);
      expect(screen.getAllByText(new Date('2024-01-15T10:30:00Z').toLocaleString())).toHaveLength(3);
    });
  });

  it('displays recent notifications', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
      expect(screen.getByText('Order Assigned')).toBeInTheDocument();
      expect(screen.getByText('You have been assigned to order #1')).toBeInTheDocument();
    });
  });

  it('shows estimated delivery time', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Estimated Delivery')).toBeInTheDocument();
      expect(screen.getByText(new Date('2024-01-15T12:00:00Z').toLocaleString())).toBeInTheDocument();
    });
  });

  it('handles order not found', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: null,
      error: 'Order not found',
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Order not found')).toBeInTheDocument();
      expect(screen.getByText("The order you're looking for doesn't exist or you don't have access to it.")).toBeInTheDocument();
      expect(screen.getByText('Back to Orders')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (apiClient.getOrderTracking as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles status update error', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });
    (apiClient.updateOrderStatus as jest.Mock).mockResolvedValue({
      data: null,
      error: 'Cannot update order status',
    });

    // Mock window.alert
    window.alert = jest.fn();

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      const updateButton = screen.getByText('Mark as Picked Up');
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error updating status: Cannot update order status');
    });
  });

  it('disables status update button while updating', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });
    (apiClient.updateOrderStatus as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      const updateButton = screen.getByText('Mark as Picked Up');
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument();
      expect(screen.getByText('Updating...')).toBeDisabled();
    });
  });

  it('navigates back to orders list', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      const backLink = screen.getByText('← Back to Orders');
      expect(backLink.closest('a')).toHaveAttribute('href', '/courier/orders');
    });
  });

  it('shows last updated timestamp', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<CourierOrderDetail />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(`Last updated: ${new Date(mockTrackingData.last_updated).toLocaleString()}`)).toBeInTheDocument();
    });
  });
});