import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultTheme } from '@/lib/theme';
import CourierOrders from '../page';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    getOrders: jest.fn(),
    updateOrderStatus: jest.fn(),
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

const mockOrders = [
  {
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
  {
    id: 2,
    status: 'PICKED_UP',
    pickup_address: '789 Pine St',
    delivery_address: '321 Elm St',
    distance_km: 3.1,
    price: 112.00,
    created_at: '2024-01-14T14:30:00Z',
    assigned_at: '2024-01-14T15:00:00Z',
    picked_up_at: '2024-01-14T15:30:00Z',
    customer_name: 'Jane Smith',
  },
  {
    id: 3,
    status: 'DELIVERED',
    pickup_address: '555 Cedar St',
    delivery_address: '777 Maple Ave',
    distance_km: 4.5,
    price: 140.00,
    created_at: '2024-01-13T09:00:00Z',
    assigned_at: '2024-01-13T09:30:00Z',
    picked_up_at: '2024-01-13T10:00:00Z',
    in_transit_at: '2024-01-13T10:15:00Z',
    delivered_at: '2024-01-13T10:45:00Z',
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

describe('CourierOrders', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');
    localStorage.setItem('user_id', '1');
  });

  it('renders orders page correctly with orders data', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('My Orders')).toBeInTheDocument();
      expect(screen.getByText('Manage your assigned delivery orders')).toBeInTheDocument();
      expect(screen.getByText('Find New Orders')).toBeInTheDocument();
    });
  });

  it('displays all orders with correct information', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
      expect(screen.getByText('Order #3')).toBeInTheDocument();
      
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
      
      expect(screen.getByText('ASSIGNED')).toBeInTheDocument();
      expect(screen.getByText('PICKED UP')).toBeInTheDocument();
      expect(screen.getByText('DELIVERED')).toBeInTheDocument();
    });
  });

  it('filters orders correctly by status', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Click on "Active" filter
      const activeFilter = screen.getByText('Active (2)');
      fireEvent.click(activeFilter);
    });

    await waitFor(() => {
      // Should show only ASSIGNED and PICKED_UP orders
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('Order #2')).toBeInTheDocument();
      expect(screen.queryByText('Order #3')).not.toBeInTheDocument();
    });
  });

  it('filters orders by specific status', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Click on "Assigned" filter
      const assignedFilter = screen.getByText('Assigned (1)');
      fireEvent.click(assignedFilter);
    });

    await waitFor(() => {
      // Should show only ASSIGNED orders
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.queryByText('Order #2')).not.toBeInTheDocument();
      expect(screen.queryByText('Order #3')).not.toBeInTheDocument();
    });
  });

  it('handles status update correctly', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });
    (apiClient.updateOrderStatus as jest.Mock).mockResolvedValue({
      data: { ...mockOrders[0], status: 'PICKED_UP' },
      error: null,
    });

    // Mock window.alert
    window.alert = jest.fn();

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const markPickedUpButton = screen.getByText('Mark as Picked Up');
      fireEvent.click(markPickedUpButton);
    });

    await waitFor(() => {
      expect(apiClient.updateOrderStatus).toHaveBeenCalledWith(1, 'PICKED_UP');
      expect(window.alert).toHaveBeenCalledWith('Order status updated successfully!');
    });
  });

  it('shows correct next status buttons', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      // ASSIGNED order should show "Mark as Picked Up"
      expect(screen.getByText('Mark as Picked Up')).toBeInTheDocument();
      
      // PICKED_UP order should show "Start Transit"
      expect(screen.getByText('Start Transit')).toBeInTheDocument();
      
      // DELIVERED order should not show any status update button
      const deliveredOrderSection = screen.getByText('Order #3').closest('div');
      expect(deliveredOrderSection).not.toHaveTextContent('Mark as');
      expect(deliveredOrderSection).not.toHaveTextContent('Start Transit');
    });
  });

  it('displays order timeline correctly', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check timeline elements are present
      expect(screen.getAllByText('Created')).toHaveLength(3);
      expect(screen.getAllByText('Assigned')).toHaveLength(3);
      expect(screen.getAllByText('Picked Up')).toHaveLength(3);
      expect(screen.getAllByText('In Transit')).toHaveLength(3);
      expect(screen.getAllByText('Delivered')).toHaveLength(3);
    });
  });

  it('shows empty state when no orders', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('No orders found')).toBeInTheDocument();
      expect(screen.getByText("You don't have any orders yet. Check available orders to get started.")).toBeInTheDocument();
      expect(screen.getByText('Find Available Orders')).toBeInTheDocument();
    });
  });

  it('shows filtered empty state', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Filter by a status that has no orders
      const deliveredFilter = screen.getByText('Delivered (1)');
      fireEvent.click(deliveredFilter);
    });

    // Now change to a filter with no results by mocking empty data
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });

    // Simulate clicking on assigned filter when there are no assigned orders
    await waitFor(() => {
      const assignedFilter = screen.getByText('Assigned (1)');
      fireEvent.click(assignedFilter);
    });
  });

  it('handles status update error', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });
    (apiClient.updateOrderStatus as jest.Mock).mockResolvedValue({
      data: null,
      error: 'Order cannot be updated',
    });

    // Mock window.alert
    window.alert = jest.fn();

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const markPickedUpButton = screen.getByText('Mark as Picked Up');
      fireEvent.click(markPickedUpButton);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error updating status: Order cannot be updated');
    });
  });

  it('shows loading state initially', () => {
    (apiClient.getOrders as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<CourierOrders />, { wrapper: createWrapper() });

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (apiClient.getOrders as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Component should handle error gracefully and not crash
      expect(screen.queryByText('My Orders')).toBeInTheDocument();
    });
  });

  it('displays order counts in filter buttons correctly', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('All Orders (3)')).toBeInTheDocument();
      expect(screen.getByText('Active (2)')).toBeInTheDocument(); // ASSIGNED + PICKED_UP
      expect(screen.getByText('Assigned (1)')).toBeInTheDocument();
      expect(screen.getByText('Delivered (1)')).toBeInTheDocument();
    });
  });

  it('navigates to order detail page', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });

    render(<CourierOrders />, { wrapper: createWrapper() });

    await waitFor(() => {
      const viewDetailsLinks = screen.getAllByText('View Details');
      expect(viewDetailsLinks[0].closest('a')).toHaveAttribute('href', '/courier/orders/1');
      expect(viewDetailsLinks[1].closest('a')).toHaveAttribute('href', '/courier/orders/2');
      expect(viewDetailsLinks[2].closest('a')).toHaveAttribute('href', '/courier/orders/3');
    });
  });
});