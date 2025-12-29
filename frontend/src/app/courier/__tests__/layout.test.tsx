import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CourierLayout from '../layout';
import { apiClient } from '@/lib/api';

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    logout: jest.fn(),
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

describe('CourierLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders layout correctly for authenticated courier', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');

    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    expect(screen.getByText('Mohamedo Courier')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Orders')).toBeInTheDocument();
    expect(screen.getByText('Available Orders')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('redirects to login when no auth token', () => {
    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects to login when user is not a courier', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'CUSTOMER');

    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    expect(mockPush).toHaveBeenCalledWith('/auth/login');
  });

  it('shows loading state initially', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');

    // Mock a delay to see loading state
    const { container } = render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    // Initially shows loading spinner
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('handles logout correctly', async () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');
    localStorage.setItem('user_id', '1');

    (apiClient.logout as jest.Mock).mockResolvedValue({
      data: {},
      error: null,
    });

    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

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

  it('handles logout error gracefully', async () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');
    localStorage.setItem('user_id', '1');

    (apiClient.logout as jest.Mock).mockRejectedValue(new Error('Logout failed'));

    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    await waitFor(() => {
      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);
    });

    await waitFor(() => {
      // Should still clear localStorage and redirect even if logout API fails
      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_role');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user_id');
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('sets auth token on mount', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');

    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    expect(apiClient.setAuthToken).toHaveBeenCalledWith('test-token');
  });

  it('has correct navigation links', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');

    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    expect(screen.getByText('Mohamedo Courier').closest('a')).toHaveAttribute('href', '/courier/dashboard');
    expect(screen.getByText('Dashboard').closest('a')).toHaveAttribute('href', '/courier/dashboard');
    expect(screen.getByText('My Orders').closest('a')).toHaveAttribute('href', '/courier/orders');
    expect(screen.getByText('Available Orders').closest('a')).toHaveAttribute('href', '/courier/available');
    expect(screen.getByText('Profile').closest('a')).toHaveAttribute('href', '/courier/profile');
  });

  it('applies correct styling to navigation', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');

    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveClass('bg-green-600');
    expect(nav).toHaveClass('text-white');
    expect(nav).toHaveClass('shadow-lg');

    const navLinks = screen.getAllByRole('link');
    navLinks.forEach(link => {
      if (link.textContent !== 'Mohamedo Courier') {
        expect(link).toHaveClass('hover:bg-green-700');
      }
    });
  });

  it('renders children in main content area', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');

    render(
      <CourierLayout>
        <div data-testid="child-content">Child Component</div>
      </CourierLayout>
    );

    const main = screen.getByRole('main');
    expect(main).toContainElement(screen.getByTestId('child-content'));
    expect(main).toHaveClass('max-w-7xl');
    expect(main).toHaveClass('mx-auto');
    expect(main).toHaveClass('py-6');
  });

  it('does not render content for unauthenticated users', () => {
    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Mohamedo Courier')).not.toBeInTheDocument();
  });

  it('does not render content for non-courier users', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'CUSTOMER');

    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    expect(screen.queryByText('Test Content')).not.toBeInTheDocument();
    expect(screen.queryByText('Mohamedo Courier')).not.toBeInTheDocument();
  });

  it('has proper responsive design classes', () => {
    localStorage.setItem('auth_token', 'test-token');
    localStorage.setItem('user_role', 'COURIER');

    render(
      <CourierLayout>
        <div>Test Content</div>
      </CourierLayout>
    );

    const container = screen.getByText('Test Content').closest('.max-w-7xl');
    expect(container).toHaveClass('px-4');
    expect(container).toHaveClass('sm:px-6');
    expect(container).toHaveClass('lg:px-8');
  });
});