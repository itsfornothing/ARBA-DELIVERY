import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import CustomerDashboard from '../page';
import { apiClient, realTimeTracker } from '@/lib/api';

// Mock the API client and real-time tracker
jest.mock('@/lib/api', () => ({
  apiClient: {
    getOrders: jest.fn(),
    getNotifications: jest.fn(),
    getUnreadCount: jest.fn(),
    logout: jest.fn(),
    setAuthToken: jest.fn(),
  },
  realTimeTracker: {
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
  },
}));

// Mock the router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const mockOrders = [
  {
    id: 1,
    pickup_address: '123 Main St',
    delivery_address: '456 Oak Ave',
    distance_km: 5.2,
    price: 154.00,
    status: 'IN_TRANSIT',
    created_at: '2024-01-15T10:00:00Z',
    customer_name: 'John Doe',
    assigned_courier_name: 'Jane Smith',
  },
  {
    id: 2,
    pickup_address: '789 Pine St',
    delivery_address: '321 Elm St',
    distance_km: 3.1,
    price: 112.00,
    status: 'DELIVERED',
    created_at: '2024-01-14T14:30:00Z',
    customer_name: 'John Doe',
    assigned_courier_name: 'Bob Wilson',
  },
];

const mockNotifications = [
  {
    id: 1,
    title: 'Order Update',
    message: 'Your order #1 is now in transit',
    is_read: false,
    created_at: '2024-01-15T10:45:00Z',
  },
  {
    id: 2,
    title: 'Order Delivered',
    message: 'Your order #2 has been delivered',
    is_read: true,
    created_at: '2024-01-14T16:00:00Z',
  },
];

describe('CustomerDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'CUSTOMER');
    localStorage.setItem('user_id', '1');
  });

  it('renders dashboard correctly with data', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });
    (apiClient.getNotifications as jest.Mock).mockResolvedValue({
      data: mockNotifications,
      error: null,
    });
    (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({
      data: { unread_count: 1 },
      error: null,
    });

    render(<CustomerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Customer Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Quick Actions')).toBeInTheDocument();
      expect(screen.getByText('Create New Order')).toBeInTheDocument();
      expect(screen.getByText('Order History')).toBeInTheDocument();
      expect(screen.getByText('Active Orders')).toBeInTheDocument();
      expect(screen.getByText('Recent Notifications')).toBeInTheDocument();
    });
  });

  it('displays active orders correctly', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: mockOrders,
      error: null,
    });
    (apiClient.getNotifications as jest.Mock).mockResolvedValue({
      data: mockNotifications,
      error: null,
    });
    (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({
      data: { unread_count: 1 },
      error: null,
    });

    render(<CustomerDashboard />);
    
    await waitFor(() => {
      // Should show only active orders (not DELIVERED or CANCELLED)
      expect(screen.getByText('Order #1')).toBeInTheDocument();
      expect(screen.getByText('In Transit')).toBeInTheDocument();
      expect(screen.getByText('123 Main St')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave')).toBeInTheDocument();
      expect(screen.getByText('5.2 km')).toBeInTheDocument();
      expect(screen.getByText('$154')).toBeInTheDocument();
      
      // Should not show delivered orders in active section
      expect(screen.queryByText('Order #2')).not.toBeInTheDocument();
    });
  });

  it('shows empty state when no active orders', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: [mockOrders[1]], // Only delivered order
      error: null,
    });
    (apiClient.getNotifications as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({
      data: { unread_count: 0 },
      error: null,
    });

    render(<CustomerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('No Active Orders')).toBeInTheDocument();
      expect(screen.getByText("You don't have any active orders at the moment.")).toBeInTheDocument();
      expect(screen.getByText('Create Your First Order')).toBeInTheDocument();
    });
  });

  it('displays notifications with unread indicator', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    (apiClient.getNotifications as jest.Mock).mockResolvedValue({
      data: mockNotifications,
      error: null,
    });
    (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({
      data: { unread_count: 1 },
      error: null,
    });

    render(<CustomerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Order Update')).toBeInTheDocument();
      expect(screen.getByText('Your order #1 is now in transit')).toBeInTheDocument();
      expect(screen.getByText('Order Delivered')).toBeInTheDocument();
      
      // Check for unread count badge
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('handles logout correctly', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    (apiClient.getNotifications as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({
      data: { unread_count: 0 },
      error: null,
    });
    (apiClient.logout as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });

    render(<CustomerDashboard />);
    
    await waitFor(() => {
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
    });
    
    await waitFor(() => {
      expect(apiClient.logout).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_role');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_id');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('shows loading state initially', () => {
    (apiClient.getOrders as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    (apiClient.getNotifications as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    (apiClient.getUnreadCount as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<CustomerDashboard />);
    
    expect(screen.getByText('Loading your dashboard...')).toBeInTheDocument();
  });

  it('handles API errors gracefully', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: null,
      error: 'Failed to load orders',
    });
    (apiClient.getNotifications as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({
      data: { unread_count: 0 },
      error: null,
    });

    render(<CustomerDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load orders')).toBeInTheDocument();
    });
  });

  it('redirects unauthenticated users to login', () => {
    localStorage.removeItem('auth_token');
    
    render(<CustomerDashboard />);
    
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects non-customer users to login', () => {
    localStorage.setItem('user_role', 'COURIER');
    
    render(<CustomerDashboard />);
    
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('subscribes to real-time updates', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    (apiClient.getNotifications as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({
      data: { unread_count: 0 },
      error: null,
    });

    render(<CustomerDashboard />);
    
    await waitFor(() => {
      expect(realTimeTracker.subscribe).toHaveBeenCalled();
    });
  });

  it('navigates to create order page', async () => {
    (apiClient.getOrders as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    (apiClient.getNotifications as jest.Mock).mockResolvedValue({
      data: [],
      error: null,
    });
    (apiClient.getUnreadCount as jest.Mock).mockResolvedValue({
      data: { unread_count: 0 },
      error: null,
    });

    render(<CustomerDashboard />);
    
    await waitFor(() => {
      const createOrderLink = screen.getByText('Create New Order');
      expect(createOrderLink.closest('a')).toHaveAttribute('href', '/customer/create-order');
    });
  });
});