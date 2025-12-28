import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CreateOrderPage from '../page';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the API client module
jest.mock('@/lib/api', () => ({
  apiClient: {
    createOrder: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

// Import the mocked API client after mocking
const { apiClient } = require('@/lib/api');

describe('CreateOrderPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'CUSTOMER');
  });

  it('renders create order form correctly', () => {
    render(<CreateOrderPage />);
    
    expect(screen.getByText('Create New Order')).toBeInTheDocument();
    expect(screen.getByLabelText(/Pickup Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Delivery Address/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Distance/)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CreateOrderPage />);
    
    const submitButton = screen.getByRole('button', { name: /Place Order/ });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Pickup address must be at least 5 characters')).toBeInTheDocument();
      expect(screen.getByText('Delivery address must be at least 5 characters')).toBeInTheDocument();
    });
  });

  it('calculates price correctly when distance changes', () => {
    render(<CreateOrderPage />);
    
    const distanceInput = screen.getByRole('spinbutton');
    fireEvent.change(distanceInput, { target: { value: '5' } });
    
    // Base fee (50) + (5 km * 20 per km) = 150
    expect(screen.getByText('$150.00')).toBeInTheDocument();
  });

  it('handles successful order creation', async () => {
    const mockCreateOrderResponse = {
      data: {
        id: 123,
        pickup_address: '123 Main St',
        delivery_address: '456 Oak Ave',
        distance_km: 5,
        price: 150,
        status: 'CREATED',
      },
      error: null,
    };

    apiClient.createOrder.mockResolvedValue(mockCreateOrderResponse);

    render(<CreateOrderPage />);
    
    fireEvent.change(screen.getByLabelText(/Pickup Address/), {
      target: { value: '123 Main St, City, State' },
    });
    fireEvent.change(screen.getByLabelText(/Delivery Address/), {
      target: { value: '456 Oak Ave, City, State' },
    });
    fireEvent.change(screen.getByRole('spinbutton'), {
      target: { value: '5' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: /Place Order/ }));
    
    await waitFor(() => {
      expect(apiClient.createOrder).toHaveBeenCalledWith({
        pickup_address: '123 Main St, City, State',
        delivery_address: '456 Oak Ave, City, State',
        distance_km: 5,
      });
      expect(mockPush).toHaveBeenCalledWith('/customer/orders/123');
    });
  });

  it('redirects unauthenticated users to login', () => {
    localStorage.removeItem('auth_token');
    
    render(<CreateOrderPage />);
    
    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });
});