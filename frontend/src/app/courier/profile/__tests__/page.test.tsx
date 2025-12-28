import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultTheme } from '@/lib/theme';
import CourierProfile from '../page';
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
    current_orders: [],
  },
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

describe('CourierProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');
    localStorage.setItem('user_id', '1');
  });

  it('renders profile page correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockCourierProfile,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Courier Profile')).toBeInTheDocument();
      expect(screen.getByText('Manage your profile and availability settings')).toBeInTheDocument();
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
      expect(screen.getByText('Availability Settings')).toBeInTheDocument();
    });
  });

  it('displays profile information correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockCourierProfile,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('courier1')).toBeInTheDocument();
      expect(screen.getByText('John')).toBeInTheDocument();
      expect(screen.getByText('Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });
  });

  it('displays availability settings correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockCourierProfile,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      const availabilityCheckbox = screen.getByRole('checkbox');
      expect(availabilityCheckbox).toBeChecked();
      
      const locationTextarea = screen.getByDisplayValue('Downtown area');
      expect(locationTextarea).toBeInTheDocument();
    });
  });

  it('handles availability update correctly', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      const availabilityCheckbox = screen.getByRole('checkbox');
      fireEvent.click(availabilityCheckbox);
      
      const locationTextarea = screen.getByDisplayValue('Downtown area');
      fireEvent.change(locationTextarea, { target: { value: 'Uptown area' } });
      
      const updateButton = screen.getByText('Update Availability');
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(apiClient.request).toHaveBeenCalledWith(
        '/api/orders/courier-status/update_availability/',
        {
          method: 'PATCH',
          body: JSON.stringify({
            is_available: false,
            location_description: 'Uptown area',
          }),
        }
      );
    });
  });

  it('shows success message after successful update', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: { success: true },
        error: null,
      });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      const updateButton = screen.getByText('Update Availability');
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Availability settings updated successfully!')).toBeInTheDocument();
    });
  });

  it('validates location description length', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockCourierProfile,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      const locationTextarea = screen.getByDisplayValue('Downtown area');
      fireEvent.change(locationTextarea, { 
        target: { value: 'A'.repeat(201) } // Exceeds 200 character limit
      });
      
      const updateButton = screen.getByText('Update Availability');
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Location description must be less than 200 characters')).toBeInTheDocument();
    });
  });

  it('displays performance statistics correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockCourierProfile,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Performance Statistics')).toBeInTheDocument();
      expect(screen.getByText('25')).toBeInTheDocument(); // Total completed orders
      expect(screen.getByText('2')).toBeInTheDocument(); // Current active orders
      expect(screen.getByText('92.6%')).toBeInTheDocument(); // Completion rate: 25/(25+2)*100
    });
  });

  it('displays current status correctly', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockCourierProfile,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Current Status')).toBeInTheDocument();
      expect(screen.getByText('Available')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // Active orders count
      expect(screen.getByText('Downtown area')).toBeInTheDocument();
      expect(screen.getByText(new Date('2024-01-15T10:00:00Z').toLocaleString())).toBeInTheDocument();
    });
  });

  it('shows unavailable status correctly', async () => {
    const unavailableProfile = {
      ...mockCourierProfile,
      courier_status: {
        ...mockCourierProfile.courier_status,
        is_available: false,
      },
    };

    (apiClient.request as jest.Mock).mockResolvedValue({
      data: unavailableProfile,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Unavailable')).toBeInTheDocument();
      const availabilityCheckbox = screen.getByRole('checkbox');
      expect(availabilityCheckbox).not.toBeChecked();
    });
  });

  it('handles missing profile data gracefully', async () => {
    const profileWithMissingData = {
      ...mockCourierProfile,
      profile: {
        ...mockCourierProfile.profile,
        first_name: '',
        last_name: '',
        phone_number: '',
      },
      courier_status: {
        ...mockCourierProfile.courier_status,
        location_description: '',
      },
    };

    (apiClient.request as jest.Mock).mockResolvedValue({
      data: profileWithMissingData,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getAllByText('Not set')).toHaveLength(3); // first_name, last_name, phone_number
      expect(screen.getByText('No location description set')).toBeInTheDocument();
    });
  });

  it('shows updating state during form submission', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      const updateButton = screen.getByText('Update Availability');
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Updating...')).toBeInTheDocument();
      expect(screen.getByText('Updating...')).toBeDisabled();
    });
  });

  it('handles update error correctly', async () => {
    (apiClient.request as jest.Mock)
      .mockResolvedValueOnce({
        data: mockCourierProfile,
        error: null,
      })
      .mockResolvedValueOnce({
        data: null,
        error: 'Update failed',
      });

    // Mock window.alert
    window.alert = jest.fn();

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      const updateButton = screen.getByText('Update Availability');
      fireEvent.click(updateButton);
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Error updating availability: Update failed');
    });
  });

  it('shows loading state initially', () => {
    (apiClient.request as jest.Mock).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<CourierProfile />, { wrapper: createWrapper() });

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles profile not found', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: null,
      error: 'Profile not found',
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Profile not found')).toBeInTheDocument();
      expect(screen.getByText('Unable to load your courier profile.')).toBeInTheDocument();
    });
  });

  it('calculates completion rate correctly with zero orders', async () => {
    const profileWithZeroOrders = {
      ...mockCourierProfile,
      statistics: {
        total_completed_orders: 0,
        current_active_orders: 0,
        current_orders: [],
      },
    };

    (apiClient.request as jest.Mock).mockResolvedValue({
      data: profileWithZeroOrders,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('0.0%')).toBeInTheDocument(); // Completion rate with zero orders
    });
  });

  it('provides helpful text for form fields', async () => {
    (apiClient.request as jest.Mock).mockResolvedValue({
      data: mockCourierProfile,
      error: null,
    });

    render(<CourierProfile />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText("When enabled, you'll be eligible for automatic order assignments")).toBeInTheDocument();
      expect(screen.getByText('Help customers and admins know your general location')).toBeInTheDocument();
      expect(screen.getByText('To update your personal information, please contact support.')).toBeInTheDocument();
    });
  });
});