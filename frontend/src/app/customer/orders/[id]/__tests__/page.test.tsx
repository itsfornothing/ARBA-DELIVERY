import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import OrderTrackingPage from '../page';
import { apiClient, realTimeTracker } from '@/lib/api';

// Mock the API client and real-time tracker
jest.mock('@/lib/api', () => ({
  apiClient: {
    getOrderTracking: jest.fn(),
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
  useParams: () => ({
    id: '123',
  }),
}));

const mockTrackingData = {
  order: {
    id: 123,
    customer_name: 'John Doe',
    assigned_courier_name: 'Jane Smith',
    pickup_address: '123 Main St, City, State',
    delivery_address: '456 Oak Ave, City, State',
    distance_km: 5.2,
    price: 154.00,
    status: 'IN_TRANSIT',
    created_at: '2024-01-15T10:00:00Z',
    assigned_at: '2024-01-15T10:05:00Z',
    picked_up_at: '2024-01-15T10:30:00Z',
    in_transit_at: '2024-01-15T10:45:00Z',
  },
  progress_percentage: 75,
  status_timeline: {
    created_at: '2024-01-15T10:00:00Z',
    assigned_at: '2024-01-15T10:05:00Z',
    picked_up_at: '2024-01-15T10:30:00Z',
    in_transit_at: '2024-01-15T10:45:00Z',
  },
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
      label: 'Courier Assigned',
      completed: true,
      timestamp: '2024-01-15T10:05:00Z',
      progress: 25,
    },
    {
      status: 'PICKED_UP',
      label: 'Package Picked Up',
      completed: true,
      timestamp: '2024-01-15T10:30:00Z',
      progress: 50,
    },
    {
      status: 'IN_TRANSIT',
      label: 'In Transit',
      completed: true,
      timestamp: '2024-01-15T10:45:00Z',
      progress: 75,
    },
    {
      status: 'DELIVERED',
      label: 'Delivered',
      completed: false,
      progress: 100,
    },
  ],
  recent_notifications: [
    {
      id: 1,
      title: 'Package Picked Up',
      message: 'Your courier has picked up your package and is on the way.',
      is_read: false,
      created_at: '2024-01-15T10:30:00Z',
    },
  ],
  last_updated: '2024-01-15T10:45:00Z',
};

describe('OrderTrackingPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'CUSTOMER');
  });

  it('renders order tracking information correctly', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<OrderTrackingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Order #123 Tracking')).toBeInTheDocument();
      expect(screen.getByText('In Transit')).toBeInTheDocument();
      expect(screen.getByText('75% Complete')).toBeInTheDocument();
      expect(screen.getByText('123 Main St, City, State')).toBeInTheDocument();
      expect(screen.getByText('456 Oak Ave, City, State')).toBeInTheDocument();
      expect(screen.getByText('5.2 km')).toBeInTheDocument();
      expect(screen.getByText('$154')).toBeInTheDocument();
    });
  });

  it('displays courier information when assigned', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<OrderTrackingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Your Courier')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Professional Courier')).toBeInTheDocument();
    });
  });

  it('displays tracking timeline correctly', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<OrderTrackingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Tracking Timeline')).toBeInTheDocument();
      expect(screen.getByText('Order Created')).toBeInTheDocument();
      expect(screen.getByText('Courier Assigned')).toBeInTheDocument();
      expect(screen.getByText('Package Picked Up')).toBeInTheDocument();
      expect(screen.getByText('In Transit')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });
  });

  it('displays recent notifications', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<OrderTrackingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Recent Updates')).toBeInTheDocument();
      expect(screen.getByText('Package Picked Up')).toBeInTheDocument();
      expect(screen.getByText('Your courier has picked up your package and is on the way.')).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (apiClient.getOrderTracking as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<OrderTrackingPage />);
    
    expect(screen.getByText('Loading order tracking...')).toBeInTheDocument();
  });

  it('handles tracking data error', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: null,
      error: 'Order not found',
    });

    render(<OrderTrackingPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Order not found')).toBeInTheDocument();
    });
  });

  it('subscribes to real-time updates', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<OrderTrackingPage />);
    
    await waitFor(() => {
      expect(realTimeTracker.subscribe).toHaveBeenCalled();
    });
  });

  it('redirects unauthenticated users to login', () => {
    localStorage.removeItem('auth_token');
    
    render(<OrderTrackingPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects non-customer users to login', () => {
    localStorage.setItem('user_role', 'COURIER');
    
    render(<OrderTrackingPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('displays progress bar with correct percentage', async () => {
    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: mockTrackingData,
      error: null,
    });

    render(<OrderTrackingPage />);
    
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar', { hidden: true });
      expect(progressBar).toHaveStyle('width: 75%');
    });
  });

  it('handles order without courier assignment', async () => {
    const trackingDataWithoutCourier = {
      ...mockTrackingData,
      order: {
        ...mockTrackingData.order,
        assigned_courier_name: null,
        status: 'CREATED',
      },
    };

    (apiClient.getOrderTracking as jest.Mock).mockResolvedValue({
      data: trackingDataWithoutCourier,
      error: null,
    });

    render(<OrderTrackingPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Your Courier')).not.toBeInTheDocument();
      expect(screen.getByText('Created')).toBeInTheDocument();
    });
  });
});