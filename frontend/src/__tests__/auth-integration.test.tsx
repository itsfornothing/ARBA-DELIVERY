import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/app/auth/login/page';
import RegisterPage from '@/app/auth/register/page';
import { apiClient } from '@/lib/api';

// Mock Next.js router
const mockPush = jest.fn();
const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

// Mock the API client
jest.mock('@/lib/api', () => ({
  apiClient: {
    login: jest.fn(),
    register: jest.fn(),
    setAuthToken: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear.mockClear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    mockPush.mockClear();
    mockReplace.mockClear();
  });

  describe('Authentication Flow Functionality', () => {
    describe('Login Page', () => {
      it('should complete successful customer login flow', async () => {
        const mockLoginResponse = {
          data: {
            access: 'test-access-token',
            user: {
              id: 1,
              role: 'CUSTOMER',
              username: 'testcustomer',
              email: 'customer@test.com',
            },
          },
          error: null,
        };

        (apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

        render(<LoginPage />);

        // Fill in login form
        fireEvent.change(screen.getByLabelText(/username/i), {
          target: { value: 'testcustomer' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
          target: { value: 'password123' },
        });

        // Submit form
        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          // Verify API call
          expect(apiClient.login).toHaveBeenCalledWith({
            username: 'testcustomer',
            password: 'password123',
          });

          // Verify token storage
          expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-access-token');
          expect(localStorageMock.setItem).toHaveBeenCalledWith('user_role', 'CUSTOMER');
          expect(localStorageMock.setItem).toHaveBeenCalledWith('user_id', '1');

          // Verify API client token setting
          expect(apiClient.setAuthToken).toHaveBeenCalledWith('test-access-token');

          // Verify navigation
          expect(mockPush).toHaveBeenCalledWith('/customer/dashboard');
        });
      });

      it('should complete successful courier login flow', async () => {
        const mockLoginResponse = {
          data: {
            access: 'courier-token',
            user: {
              id: 2,
              role: 'COURIER',
              username: 'testcourier',
            },
          },
          error: null,
        };

        (apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/username/i), {
          target: { value: 'testcourier' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
          target: { value: 'courierpass' },
        });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/courier/dashboard');
        });
      });

      it('should complete successful admin login flow', async () => {
        const mockLoginResponse = {
          data: {
            access: 'admin-token',
            user: {
              id: 3,
              role: 'ADMIN',
              username: 'testadmin',
            },
          },
          error: null,
        };

        (apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/username/i), {
          target: { value: 'testadmin' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
          target: { value: 'adminpass' },
        });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
        });
      });

      it('should handle login errors gracefully', async () => {
        const mockLoginResponse = {
          data: null,
          error: 'Invalid username or password',
        };

        (apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/username/i), {
          target: { value: 'wronguser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
          target: { value: 'wrongpass' },
        });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(screen.getByText('Invalid username or password')).toBeInTheDocument();
          expect(mockPush).not.toHaveBeenCalled();
          expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });
      });

      it('should handle network errors', async () => {
        (apiClient.login as jest.Mock).mockRejectedValue(new Error('Network error'));

        render(<LoginPage />);

        fireEvent.change(screen.getByLabelText(/username/i), {
          target: { value: 'testuser' },
        });
        fireEvent.change(screen.getByLabelText(/password/i), {
          target: { value: 'password' },
        });

        fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

        await waitFor(() => {
          expect(screen.getByText('Login failed. Please try again.')).toBeInTheDocument();
        });
      });
    });

    describe('Registration Page', () => {
      it('should complete successful customer registration flow', async () => {
        const mockRegisterResponse = {
          data: {
            id: 1,
            username: 'newcustomer',
            email: 'newcustomer@test.com',
            role: 'CUSTOMER',
          },
          error: null,
        };

        (apiClient.register as jest.Mock).mockResolvedValue(mockRegisterResponse);

        render(<RegisterPage />);

        // Fill in registration form
        fireEvent.change(screen.getByLabelText(/first name/i), {
          target: { value: 'John' },
        });
        fireEvent.change(screen.getByLabelText(/last name/i), {
          target: { value: 'Doe' },
        });
        fireEvent.change(screen.getByLabelText(/username/i), {
          target: { value: 'newcustomer' },
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
          target: { value: 'newcustomer@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/phone number/i), {
          target: { value: '1234567890' },
        });
        fireEvent.change(screen.getByLabelText(/^password$/i), {
          target: { value: 'password123' },
        });
        fireEvent.change(screen.getByLabelText(/confirm password/i), {
          target: { value: 'password123' },
        });

        // Select customer role
        fireEvent.change(screen.getByDisplayValue(/order deliveries/i), {
          target: { value: 'CUSTOMER' },
        });

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(apiClient.register).toHaveBeenCalledWith({
            username: 'newcustomer',
            email: 'newcustomer@test.com',
            first_name: 'John',
            last_name: 'Doe',
            password: 'password123',
            password_confirm: 'password123',
            phone_number: '1234567890',
            role: 'CUSTOMER',
          });
        });

        // Wait for success state and redirect
        await waitFor(() => {
          expect(screen.getByText(/welcome to arba delivery!/i)).toBeInTheDocument();
        }, { timeout: 3000 });
      });

      it('should complete successful courier registration flow', async () => {
        const mockRegisterResponse = {
          data: {
            id: 2,
            username: 'newcourier',
            email: 'courier@test.com',
            role: 'COURIER',
          },
          error: null,
        };

        (apiClient.register as jest.Mock).mockResolvedValue(mockRegisterResponse);

        render(<RegisterPage />);

        // Fill in form for courier
        fireEvent.change(screen.getByLabelText(/first name/i), {
          target: { value: 'Jane' },
        });
        fireEvent.change(screen.getByLabelText(/last name/i), {
          target: { value: 'Smith' },
        });
        fireEvent.change(screen.getByLabelText(/username/i), {
          target: { value: 'newcourier' },
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
          target: { value: 'courier@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/phone number/i), {
          target: { value: '0987654321' },
        });
        fireEvent.change(screen.getByLabelText(/^password$/i), {
          target: { value: 'courierpass123' },
        });
        fireEvent.change(screen.getByLabelText(/confirm password/i), {
          target: { value: 'courierpass123' },
        });

        // Select courier role
        fireEvent.change(screen.getByDisplayValue(/order deliveries/i), {
          target: { value: 'COURIER' },
        });

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(apiClient.register).toHaveBeenCalledWith(
            expect.objectContaining({
              role: 'COURIER',
              username: 'newcourier',
              email: 'courier@test.com',
            })
          );
        });
      });

      it('should handle registration validation errors', async () => {
        render(<RegisterPage />);

        // Try to submit empty form
        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
          expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
          expect(screen.getByText(/username must be at least 3 characters/i)).toBeInTheDocument();
        });
      });

      it('should handle password mismatch validation', async () => {
        render(<RegisterPage />);

        fireEvent.change(screen.getByLabelText(/^password$/i), {
          target: { value: 'password123' },
        });
        fireEvent.change(screen.getByLabelText(/confirm password/i), {
          target: { value: 'differentpassword' },
        });

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
        });
      });

      it('should handle registration server errors', async () => {
        const mockRegisterResponse = {
          data: null,
          error: 'Username already exists',
        };

        (apiClient.register as jest.Mock).mockResolvedValue(mockRegisterResponse);

        render(<RegisterPage />);

        // Fill in valid form data
        fireEvent.change(screen.getByLabelText(/first name/i), {
          target: { value: 'Test' },
        });
        fireEvent.change(screen.getByLabelText(/last name/i), {
          target: { value: 'User' },
        });
        fireEvent.change(screen.getByLabelText(/username/i), {
          target: { value: 'existinguser' },
        });
        fireEvent.change(screen.getByLabelText(/email/i), {
          target: { value: 'test@test.com' },
        });
        fireEvent.change(screen.getByLabelText(/phone number/i), {
          target: { value: '1234567890' },
        });
        fireEvent.change(screen.getByLabelText(/^password$/i), {
          target: { value: 'password123' },
        });
        fireEvent.change(screen.getByLabelText(/confirm password/i), {
          target: { value: 'password123' },
        });

        fireEvent.click(screen.getByRole('button', { name: /create account/i }));

        await waitFor(() => {
          expect(screen.getByText('Username already exists')).toBeInTheDocument();
        });
      });
    });
  });

  describe('Visual Consistency Tests', () => {
    it('should maintain consistent visual hierarchy across auth pages', () => {
      const { rerender } = render(<LoginPage />);

      // Test login page visual elements
      expect(screen.getByText(/welcome to arba delivery/i)).toBeInTheDocument();
      expect(screen.getByText(/sign in to continue/i)).toBeInTheDocument();
      
      // Check for consistent button styling
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      expect(loginButton).toHaveClass('bg-primary-600'); // Primary button styling
      
      // Check for consistent card styling
      const loginCard = loginButton.closest('[class*="shadow"]');
      expect(loginCard).toBeInTheDocument();

      // Switch to registration page
      rerender(<RegisterPage />);

      // Test registration page visual elements
      expect(screen.getByText(/join arba delivery/i)).toBeInTheDocument();
      expect(screen.getByText(/create your account/i)).toBeInTheDocument();
      
      // Check for consistent button styling
      const registerButton = screen.getByRole('button', { name: /create account/i });
      expect(registerButton).toHaveClass('bg-primary-600'); // Same primary button styling
      
      // Check for consistent card styling
      const registerCard = registerButton.closest('[class*="shadow"]');
      expect(registerCard).toBeInTheDocument();
    });

    it('should use consistent enhanced components across auth pages', () => {
      const { rerender } = render(<LoginPage />);

      // Check login page uses enhanced components
      const loginUsernameInput = screen.getByLabelText(/username/i);
      const loginPasswordInput = screen.getByLabelText(/password/i);
      const loginSubmitButton = screen.getByRole('button', { name: /sign in/i });

      // Verify enhanced Input component styling
      expect(loginUsernameInput).toHaveClass('border-2');
      expect(loginPasswordInput).toHaveClass('border-2');
      
      // Verify enhanced Button component styling
      expect(loginSubmitButton).toHaveClass('bg-primary-600');

      // Switch to registration page
      rerender(<RegisterPage />);

      // Check registration page uses same enhanced components
      const registerUsernameInput = screen.getByLabelText(/username/i);
      const registerPasswordInput = screen.getByLabelText(/^password$/i);
      const registerSubmitButton = screen.getByRole('button', { name: /create account/i });

      // Verify consistent enhanced Input component styling
      expect(registerUsernameInput).toHaveClass('border-2');
      expect(registerPasswordInput).toHaveClass('border-2');
      
      // Verify consistent enhanced Button component styling
      expect(registerSubmitButton).toHaveClass('bg-primary-600');
    });

    it('should maintain consistent color scheme and contrast', () => {
      const { rerender } = render(<LoginPage />);

      // Check login page color consistency
      const loginTitle = screen.getByText(/welcome to arba delivery/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });
      
      // Verify primary color usage
      expect(loginTitle).toHaveClass('text-primary-700');
      expect(loginButton).toHaveClass('bg-primary-600');

      // Switch to registration page
      rerender(<RegisterPage />);

      // Check registration page color consistency
      const registerTitle = screen.getByText(/join arba delivery/i);
      const registerButton = screen.getByRole('button', { name: /create account/i });
      
      // Verify same primary color usage
      expect(registerTitle).toHaveClass('text-primary-700');
      expect(registerButton).toHaveClass('bg-primary-600');
    });

    it('should maintain consistent spacing and layout patterns', () => {
      const { rerender } = render(<LoginPage />);

      // Check login page layout
      const loginForm = screen.getByRole('button', { name: /sign in/i }).closest('form');
      expect(loginForm).toHaveClass('space-y-5', 'sm:space-y-6');

      // Switch to registration page
      rerender(<RegisterPage />);

      // Check registration page layout consistency
      const registerForm = screen.getByRole('button', { name: /create account/i }).closest('form');
      expect(registerForm).toHaveClass('space-y-6');
    });

    it('should maintain consistent responsive behavior', () => {
      const { rerender } = render(<LoginPage />);

      // Check login page responsive classes
      const loginContainer = screen.getByText(/welcome to arba delivery/i).closest('.max-w-md');
      expect(loginContainer).toBeInTheDocument();
      
      const loginWrapper = loginContainer?.parentElement;
      expect(loginWrapper).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');

      // Switch to registration page
      rerender(<RegisterPage />);

      // Check registration page responsive classes
      const registerContainer = screen.getByText(/join arba delivery/i).closest('.max-w-md');
      expect(registerContainer).toBeInTheDocument();
      
      const registerWrapper = registerContainer?.parentElement;
      expect(registerWrapper).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
    });

    it('should maintain consistent error state styling', async () => {
      const mockLoginResponse = {
        data: null,
        error: 'Test error message',
      };

      (apiClient.login as jest.Mock).mockResolvedValue(mockLoginResponse);

      const { rerender } = render(<LoginPage />);

      // Trigger error on login page
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'test' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'test' },
      });
      fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

      await waitFor(() => {
        const loginError = screen.getByText('Test error message');
        expect(loginError).toBeInTheDocument();
        expect(loginError.closest('div')).toHaveClass('bg-error-50', 'border-error-500', 'text-error-700');
      });

      // Switch to registration page and test error styling
      const mockRegisterResponse = {
        data: null,
        error: 'Registration error message',
      };

      (apiClient.register as jest.Mock).mockResolvedValue(mockRegisterResponse);

      rerender(<RegisterPage />);

      // Fill minimal form and trigger error
      fireEvent.change(screen.getByLabelText(/first name/i), {
        target: { value: 'Test' },
      });
      fireEvent.change(screen.getByLabelText(/last name/i), {
        target: { value: 'User' },
      });
      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'testuser' },
      });
      fireEvent.change(screen.getByLabelText(/email/i), {
        target: { value: 'test@test.com' },
      });
      fireEvent.change(screen.getByLabelText(/phone number/i), {
        target: { value: '1234567890' },
      });
      fireEvent.change(screen.getByLabelText(/^password$/i), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByLabelText(/confirm password/i), {
        target: { value: 'password123' },
      });

      fireEvent.click(screen.getByRole('button', { name: /create account/i }));

      await waitFor(() => {
        const registerError = screen.getByText('Registration error message');
        expect(registerError).toBeInTheDocument();
        expect(registerError.closest('div')).toHaveClass('bg-error-50', 'border-error-500', 'text-error-700');
      });
    });

    it('should maintain consistent loading state styling', async () => {
      // Mock slow API responses
      (apiClient.login as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ data: null, error: 'Test' }), 100))
      );

      render(<LoginPage />);

      fireEvent.change(screen.getByLabelText(/username/i), {
        target: { value: 'test' },
      });
      fireEvent.change(screen.getByLabelText(/password/i), {
        target: { value: 'test' },
      });

      const loginButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(loginButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/signing in.../i)).toBeInTheDocument();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/sign in/i)).toBeInTheDocument();
      });
    });
  });

  describe('Navigation and Links', () => {
    it('should provide consistent navigation between auth pages', () => {
      const { rerender } = render(<LoginPage />);

      // Check login page navigation
      const registerLink = screen.getByText(/don't have an account\? create one/i);
      expect(registerLink.closest('a')).toHaveAttribute('href', '/auth/register');

      const homeLink = screen.getByText(/back to home/i);
      expect(homeLink.closest('a')).toHaveAttribute('href', '/');

      // Switch to registration page
      rerender(<RegisterPage />);

      // Check registration page navigation
      const loginLink = screen.getByText(/already have an account\? sign in/i);
      expect(loginLink.closest('a')).toHaveAttribute('href', '/auth/login');

      const homeFromRegister = screen.getByText(/back to home/i);
      expect(homeFromRegister.closest('a')).toHaveAttribute('href', '/');
    });
  });
});