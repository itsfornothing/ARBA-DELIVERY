import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from '../page';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock the API client module
jest.mock('../../../lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

// Import the mocked API client after mocking
const { apiClient } = require('../../../lib/api');

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('renders login form correctly', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Sign in to Mohamedo')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<LoginPage />);
    
    const submitButton = screen.getByRole('button', { name: 'Sign in' });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText('Username is required')).toBeInTheDocument();
      expect(screen.getByText('Password is required')).toBeInTheDocument();
    });
  });

  it('handles successful customer login', async () => {
    const mockLoginResponse = {
      data: {
        access_token: 'test-token',
        user: {
          id: 1,
          role: 'CUSTOMER',
          username: 'testuser',
        },
      },
      error: null,
    };

    apiClient.login.mockResolvedValue(mockLoginResponse);

    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'testuser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'password123' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      expect(apiClient.login).toHaveBeenCalledWith({
        username: 'testuser',
        password: 'password123',
      });
      expect(mockPush).toHaveBeenCalledWith('/customer/dashboard');
    });
  });

  it('handles login error', async () => {
    const mockLoginResponse = {
      data: null,
      error: 'Invalid credentials',
    };

    apiClient.login.mockResolvedValue(mockLoginResponse);

    render(<LoginPage />);
    
    fireEvent.change(screen.getByLabelText('Username'), {
      target: { value: 'wronguser' },
    });
    fireEvent.change(screen.getByLabelText('Password'), {
      target: { value: 'wrongpass' },
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});