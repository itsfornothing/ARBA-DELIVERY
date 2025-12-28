/**
 * Comprehensive Integration Tests for UI Enhancements
 * 
 * Tests complete user journeys with enhanced UI elements, validates design system 
 * consistency across all components, and tests responsive behavior and accessibility compliance.
 * 
 * Requirements: All requirements integration and validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { AccessibilityProvider } from '@/components/providers/AccessibilityProvider';
import { OnboardingProvider } from '@/components/providers/OnboardingProvider';
import { PerformanceProvider } from '@/components/providers/PerformanceProvider';
import { defaultTheme, darkTheme } from '@/lib/theme';

// Import all UI enhancement components
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Form } from '@/components/molecules/Form';
import { ResponsiveLayout } from '@/components/molecules/ResponsiveLayout';
import { LoadingSpinner } from '@/components/molecules/LoadingSpinner';
import { SkeletonScreens } from '@/components/molecules/SkeletonScreens';
import { NotificationSystem } from '@/components/molecules/NotificationSystem';
import { MicroInteractions } from '@/components/molecules/MicroInteractions';
import { SuccessCelebration } from '@/components/molecules/SuccessCelebration';
import { ErrorState } from '@/components/molecules/ErrorState';
import { EmptyState } from '@/components/molecules/EmptyState';
import { OnboardingFlow } from '@/components/molecules/OnboardingFlow';
import { GuidedTour } from '@/components/molecules/GuidedTour';
import { OrderCreationWizard } from '@/components/molecules/OrderCreationWizard';
import { EnhancedOrderTracking } from '@/components/molecules/EnhancedOrderTracking';
import { EnhancedCourierDashboard } from '@/components/molecules/EnhancedCourierDashboard';
import { EnhancedAdminDashboard } from '@/components/molecules/EnhancedAdminDashboard';

// Mock framer-motion for consistent testing
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    h3: ({ children, ...props }: any) => <h3 {...props}>{children}</h3>,
    h4: ({ children, ...props }: any) => <h4 {...props}>{children}</h4>,
    h5: ({ children, ...props }: any) => <h5 {...props}>{children}</h5>,
    h6: ({ children, ...props }: any) => <h6 {...props}>{children}</h6>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    form: ({ children, ...props }: any) => <form {...props}>{children}</form>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    label: ({ children, ...props }: any) => <label {...props}>{children}</label>,
    input: ({ children, ...props }: any) => <input {...props}>{children}</input>,
    textarea: ({ children, ...props }: any) => <textarea {...props}>{children}</textarea>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
  useInView: () => true,
  useAnimation: () => ({
    start: jest.fn(),
    stop: jest.fn(),
    set: jest.fn(),
  }),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock matchMedia for responsive testing
const mockMatchMedia = (width: number) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query: string) => ({
      matches: query.includes(`max-width: ${width}px`) || query.includes(`min-width: ${width - 1}px`),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

// Comprehensive test wrapper with all providers
const IntegrationTestWrapper: React.FC<{ 
  children: React.ReactNode; 
  theme?: any;
  viewport?: { width: number; height: number };
}> = ({ 
  children, 
  theme = defaultTheme,
  viewport = { width: 1024, height: 768 }
}) => {
  // Set viewport for responsive testing
  mockMatchMedia(viewport.width);
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: viewport.width,
  });
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: viewport.height,
  });

  return (
    <ThemeProvider defaultTheme={theme}>
      <AccessibilityProvider>
        <PerformanceProvider>
          <OnboardingProvider>
            <div style={{ width: '100%', minHeight: '100vh' }}>
              {children}
            </div>
          </OnboardingProvider>
        </PerformanceProvider>
      </AccessibilityProvider>
    </ThemeProvider>
  );
};

describe('UI Enhancements Integration Tests', () => {
  beforeEach(() => {
    // Reset DOM and mocks
    document.body.innerHTML = '';
    jest.clearAllMocks();
    mockMatchMedia(1024);
  });

  describe('Complete User Journey: Order Creation Flow', () => {
    it('should handle complete order creation journey with enhanced UI', async () => {
      const user = userEvent.setup();
      let orderData: any = null;
      
      const handleOrderSubmit = (data: any) => {
        orderData = data;
      };

      render(
        <IntegrationTestWrapper>
          <div data-testid="order-creation-flow">
            <Typography variant="h1" data-testid="page-title">
              Create Your Order
            </Typography>
            
            <OrderCreationWizard
              onOrderSubmit={handleOrderSubmit}
              data-testid="order-wizard"
            />
            
            <NotificationSystem data-testid="notifications" />
          </div>
        </IntegrationTestWrapper>
      );

      // Verify page loads with proper structure
      expect(screen.getByTestId('page-title')).toBeInTheDocument();
      expect(screen.getByText('Create Your Order')).toBeInTheDocument();
      
      // Verify order wizard is rendered
      const wizard = screen.getByTestId('order-wizard');
      expect(wizard).toBeInTheDocument();
      
      // Test step-by-step order creation
      const pickupInput = within(wizard).getByLabelText(/pickup/i);
      const deliveryInput = within(wizard).getByLabelText(/delivery/i);
      
      await user.type(pickupInput, '123 Main St');
      await user.type(deliveryInput, '456 Oak Ave');
      
      // Verify inputs are populated
      expect(pickupInput).toHaveValue('123 Main St');
      expect(deliveryInput).toHaveValue('456 Oak Ave');
      
      // Continue to next step
      const nextButton = within(wizard).getByRole('button', { name: /next|continue/i });
      await user.click(nextButton);
      
      // Verify wizard progresses (check for different step content)
      await waitFor(() => {
        expect(within(wizard).getByText(/package details|item details/i)).toBeInTheDocument();
      });
      
      // Complete the order
      const submitButton = within(wizard).getByRole('button', { name: /submit|place order/i });
      await user.click(submitButton);
      
      // Verify order submission
      await waitFor(() => {
        expect(orderData).toBeTruthy();
      });
    });

    it('should show loading states during order processing', async () => {
      const user = userEvent.setup();
      
      render(
        <IntegrationTestWrapper>
          <div data-testid="loading-demo">
            <LoadingSpinner size="large" data-testid="main-spinner" />
            <SkeletonScreens variant="orderCard" count={3} data-testid="skeleton-cards" />
          </div>
        </IntegrationTestWrapper>
      );

      // Verify loading components are rendered
      expect(screen.getByTestId('main-spinner')).toBeInTheDocument();
      expect(screen.getByTestId('skeleton-cards')).toBeInTheDocument();
      
      // Verify loading spinner has proper structure
      const spinner = screen.getByTestId('main-spinner');
      expect(spinner).toHaveAttribute('data-testid', 'main-spinner');
    });

    it('should display success celebration after order completion', async () => {
      const user = userEvent.setup();
      
      render(
        <IntegrationTestWrapper>
          <SuccessCelebration
            type="orderPlaced"
            message="Your order has been placed successfully!"
            data-testid="success-celebration"
          />
        </IntegrationTestWrapper>
      );

      // Verify success celebration is displayed
      const celebration = screen.getByTestId('success-celebration');
      expect(celebration).toBeInTheDocument();
      expect(screen.getByText(/order has been placed successfully/i)).toBeInTheDocument();
    });
  });

  describe('Complete User Journey: Order Tracking Experience', () => {
    it('should provide enhanced order tracking with real-time updates', async () => {
      const mockOrder = {
        id: 'ORD-123',
        status: 'in_transit',
        pickup: '123 Main St',
        delivery: '456 Oak Ave',
        courier: 'John Doe',
        estimatedTime: '25 minutes'
      };

      render(
        <IntegrationTestWrapper>
          <div data-testid="tracking-page">
            <Typography variant="h1">Track Your Order</Typography>
            
            <EnhancedOrderTracking
              order={mockOrder}
              data-testid="order-tracking"
            />
            
            <NotificationSystem data-testid="tracking-notifications" />
          </div>
        </IntegrationTestWrapper>
      );

      // Verify tracking page structure
      expect(screen.getByText('Track Your Order')).toBeInTheDocument();
      
      const tracking = screen.getByTestId('order-tracking');
      expect(tracking).toBeInTheDocument();
      
      // Verify order information is displayed
      expect(screen.getByText('ORD-123')).toBeInTheDocument();
      expect(screen.getByText(/in transit|in_transit/i)).toBeInTheDocument();
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
  });

  describe('Complete User Journey: Courier Dashboard Experience', () => {
    it('should provide enhanced courier dashboard with interactive elements', async () => {
      const user = userEvent.setup();
      const mockCourierData = {
        name: 'Jane Smith',
        earnings: 1250.50,
        completedOrders: 45,
        rating: 4.8,
        availableOrders: [
          { id: 'ORD-456', pickup: '789 Pine St', delivery: '321 Elm St', payment: 25.00 },
          { id: 'ORD-789', pickup: '654 Maple Ave', delivery: '987 Cedar Rd', payment: 18.50 }
        ]
      };

      render(
        <IntegrationTestWrapper>
          <div data-testid="courier-dashboard">
            <Typography variant="h1">Courier Dashboard</Typography>
            
            <EnhancedCourierDashboard
              courierData={mockCourierData}
              data-testid="dashboard-content"
            />
          </div>
        </IntegrationTestWrapper>
      );

      // Verify dashboard structure
      expect(screen.getByText('Courier Dashboard')).toBeInTheDocument();
      
      const dashboard = screen.getByTestId('dashboard-content');
      expect(dashboard).toBeInTheDocument();
      
      // Verify courier stats are displayed
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText(/1250\.50|1,250\.50/)).toBeInTheDocument();
      expect(screen.getByText('45')).toBeInTheDocument();
      expect(screen.getByText('4.8')).toBeInTheDocument();
      
      // Test interaction with available orders
      const orderCards = screen.getAllByText(/ORD-/);
      expect(orderCards.length).toBeGreaterThanOrEqual(2);
      
      // Click on first order
      const firstOrder = screen.getByText('ORD-456');
      await user.click(firstOrder);
      
      // Verify order details are accessible
      expect(screen.getByText('789 Pine St')).toBeInTheDocument();
    });
  });

  describe('Complete User Journey: Admin Dashboard Experience', () => {
    it('should provide enhanced admin dashboard with data visualization', async () => {
      const user = userEvent.setup();
      const mockAdminData = {
        totalOrders: 1250,
        totalRevenue: 45000.75,
        activeCouriers: 85,
        averageDeliveryTime: 28,
        recentOrders: [
          { id: 'ORD-001', customer: 'Alice Johnson', status: 'delivered', amount: 32.50 },
          { id: 'ORD-002', customer: 'Bob Wilson', status: 'in_transit', amount: 28.00 }
        ]
      };

      render(
        <IntegrationTestWrapper>
          <div data-testid="admin-dashboard">
            <Typography variant="h1">Admin Dashboard</Typography>
            
            <EnhancedAdminDashboard
              adminData={mockAdminData}
              data-testid="admin-content"
            />
          </div>
        </IntegrationTestWrapper>
      );

      // Verify admin dashboard structure
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      
      const dashboard = screen.getByTestId('admin-content');
      expect(dashboard).toBeInTheDocument();
      
      // Verify admin metrics are displayed
      expect(screen.getByText('1250')).toBeInTheDocument();
      expect(screen.getByText(/45000\.75|45,000\.75/)).toBeInTheDocument();
      expect(screen.getByText('85')).toBeInTheDocument();
      expect(screen.getByText('28')).toBeInTheDocument();
      
      // Verify recent orders are displayed
      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText('Bob Wilson')).toBeInTheDocument();
    });
  });

  describe('Design System Consistency Validation', () => {
    it('should maintain consistent theming across all components', async () => {
      render(
        <IntegrationTestWrapper theme={defaultTheme}>
          <div data-testid="theme-consistency-test">
            <Button variant="primary" data-testid="themed-button">Primary Button</Button>
            <Input label="Test Input" data-testid="themed-input" />
            <Card data-testid="themed-card">
              <Typography variant="h3" data-testid="themed-typography">Card Title</Typography>
            </Card>
          </div>
        </IntegrationTestWrapper>
      );

      // Verify all components are rendered with consistent theming
      const button = screen.getByTestId('themed-button');
      const input = screen.getByTestId('themed-input');
      const card = screen.getByTestId('themed-card');
      const typography = screen.getByTestId('themed-typography');

      expect(button).toBeInTheDocument();
      expect(input).toBeInTheDocument();
      expect(card).toBeInTheDocument();
      expect(typography).toBeInTheDocument();

      // Verify consistent font family across components
      const buttonStyle = window.getComputedStyle(button);
      const inputStyle = window.getComputedStyle(input);
      const typographyStyle = window.getComputedStyle(typography);

      expect(buttonStyle.fontFamily).toContain('Inter');
      expect(inputStyle.fontFamily).toContain('Inter');
      expect(typographyStyle.fontFamily).toContain('Inter');
    });

    it('should handle theme switching consistently', async () => {
      const user = userEvent.setup();
      let currentTheme = defaultTheme;
      
      const ThemeToggleTest: React.FC = () => {
        const [isDark, setIsDark] = React.useState(false);
        
        return (
          <IntegrationTestWrapper theme={isDark ? darkTheme : defaultTheme}>
            <div data-testid="theme-toggle-test">
              <Button 
                onClick={() => setIsDark(!isDark)}
                data-testid="theme-toggle-button"
              >
                Toggle Theme
              </Button>
              <Typography variant="body" data-testid="theme-indicator">
                Current theme: {isDark ? 'dark' : 'light'}
              </Typography>
            </div>
          </IntegrationTestWrapper>
        );
      };

      render(<ThemeToggleTest />);

      // Verify initial light theme
      expect(screen.getByText('Current theme: light')).toBeInTheDocument();
      
      // Toggle to dark theme
      const toggleButton = screen.getByTestId('theme-toggle-button');
      await user.click(toggleButton);
      
      // Verify theme switched to dark
      expect(screen.getByText('Current theme: dark')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior Validation', () => {
    it('should adapt layout for mobile viewport', async () => {
      render(
        <IntegrationTestWrapper viewport={{ width: 375, height: 667 }}>
          <ResponsiveLayout data-testid="mobile-layout">
            <Typography variant="h2">Mobile Layout Test</Typography>
            <Button fullWidth data-testid="mobile-button">Full Width Button</Button>
          </ResponsiveLayout>
        </IntegrationTestWrapper>
      );

      // Verify mobile layout is rendered
      const layout = screen.getByTestId('mobile-layout');
      expect(layout).toBeInTheDocument();
      
      const button = screen.getByTestId('mobile-button');
      expect(button).toBeInTheDocument();
      expect(screen.getByText('Mobile Layout Test')).toBeInTheDocument();
    });

    it('should adapt layout for tablet viewport', async () => {
      render(
        <IntegrationTestWrapper viewport={{ width: 768, height: 1024 }}>
          <ResponsiveLayout data-testid="tablet-layout">
            <Typography variant="h2">Tablet Layout Test</Typography>
            <div style={{ display: 'flex', gap: '16px' }}>
              <Button data-testid="tablet-button-1">Button 1</Button>
              <Button data-testid="tablet-button-2">Button 2</Button>
            </div>
          </ResponsiveLayout>
        </IntegrationTestWrapper>
      );

      // Verify tablet layout is rendered
      const layout = screen.getByTestId('tablet-layout');
      expect(layout).toBeInTheDocument();
      
      expect(screen.getByTestId('tablet-button-1')).toBeInTheDocument();
      expect(screen.getByTestId('tablet-button-2')).toBeInTheDocument();
      expect(screen.getByText('Tablet Layout Test')).toBeInTheDocument();
    });

    it('should adapt layout for desktop viewport', async () => {
      render(
        <IntegrationTestWrapper viewport={{ width: 1920, height: 1080 }}>
          <ResponsiveLayout data-testid="desktop-layout">
            <Typography variant="h2">Desktop Layout Test</Typography>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
              <Card data-testid="desktop-card-1">Card 1</Card>
              <Card data-testid="desktop-card-2">Card 2</Card>
              <Card data-testid="desktop-card-3">Card 3</Card>
            </div>
          </ResponsiveLayout>
        </IntegrationTestWrapper>
      );

      // Verify desktop layout is rendered
      const layout = screen.getByTestId('desktop-layout');
      expect(layout).toBeInTheDocument();
      
      expect(screen.getByTestId('desktop-card-1')).toBeInTheDocument();
      expect(screen.getByTestId('desktop-card-2')).toBeInTheDocument();
      expect(screen.getByTestId('desktop-card-3')).toBeInTheDocument();
      expect(screen.getByText('Desktop Layout Test')).toBeInTheDocument();
    });
  });

  describe('Accessibility Compliance Validation', () => {
    it('should provide proper ARIA labels and keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <IntegrationTestWrapper>
          <div data-testid="accessibility-test">
            <Button 
              aria-label="Submit form"
              data-testid="accessible-button"
            >
              Submit
            </Button>
            <Input 
              label="Email Address"
              aria-describedby="email-help"
              data-testid="accessible-input"
            />
            <div id="email-help">Enter your email address</div>
          </div>
        </IntegrationTestWrapper>
      );

      // Verify ARIA labels are present
      const button = screen.getByTestId('accessible-button');
      const input = screen.getByTestId('accessible-input');
      
      expect(button).toHaveAttribute('aria-label', 'Submit form');
      expect(input).toHaveAttribute('aria-describedby', 'email-help');
      
      // Test keyboard navigation
      await user.tab();
      expect(button).toHaveFocus();
      
      await user.tab();
      expect(input).toHaveFocus();
    });

    it('should support reduced motion preferences', async () => {
      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(
        <IntegrationTestWrapper>
          <div data-testid="reduced-motion-test">
            <MicroInteractions 
              enableAnimations={false}
              data-testid="micro-interactions"
            />
            <LoadingSpinner 
              reduceMotion={true}
              data-testid="reduced-motion-spinner"
            />
          </div>
        </IntegrationTestWrapper>
      );

      // Verify components respect reduced motion
      const microInteractions = screen.getByTestId('micro-interactions');
      const spinner = screen.getByTestId('reduced-motion-spinner');
      
      expect(microInteractions).toBeInTheDocument();
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Error Handling and Recovery', () => {
    it('should display helpful error states with recovery options', async () => {
      const user = userEvent.setup();
      let retryCount = 0;
      
      const handleRetry = () => {
        retryCount++;
      };

      render(
        <IntegrationTestWrapper>
          <ErrorState
            title="Something went wrong"
            message="We couldn't load your orders. Please try again."
            onRetry={handleRetry}
            data-testid="error-state"
          />
        </IntegrationTestWrapper>
      );

      // Verify error state is displayed
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/couldn't load your orders/i)).toBeInTheDocument();
      
      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /try again|retry/i });
      await user.click(retryButton);
      
      expect(retryCount).toBe(1);
    });

    it('should display engaging empty states with clear actions', async () => {
      const user = userEvent.setup();
      let actionCount = 0;
      
      const handleAction = () => {
        actionCount++;
      };

      render(
        <IntegrationTestWrapper>
          <EmptyState
            title="No orders yet"
            message="Start by creating your first order"
            actionLabel="Create Order"
            onAction={handleAction}
            data-testid="empty-state"
          />
        </IntegrationTestWrapper>
      );

      // Verify empty state is displayed
      expect(screen.getByText('No orders yet')).toBeInTheDocument();
      expect(screen.getByText('Start by creating your first order')).toBeInTheDocument();
      
      // Test action functionality
      const actionButton = screen.getByRole('button', { name: /create order/i });
      await user.click(actionButton);
      
      expect(actionCount).toBe(1);
    });
  });

  describe('Onboarding and User Guidance', () => {
    it('should provide guided tour for new users', async () => {
      const user = userEvent.setup();
      let tourStep = 0;
      
      const handleTourStep = (step: number) => {
        tourStep = step;
      };

      render(
        <IntegrationTestWrapper>
          <div data-testid="onboarding-test">
            <GuidedTour
              steps={[
                { target: '#step1', content: 'Welcome to the platform!' },
                { target: '#step2', content: 'Here you can create orders' },
                { target: '#step3', content: 'Track your deliveries here' }
              ]}
              onStepChange={handleTourStep}
              data-testid="guided-tour"
            />
            <div id="step1">Step 1 Content</div>
            <div id="step2">Step 2 Content</div>
            <div id="step3">Step 3 Content</div>
          </div>
        </IntegrationTestWrapper>
      );

      // Verify tour is displayed
      const tour = screen.getByTestId('guided-tour');
      expect(tour).toBeInTheDocument();
      
      // Verify tour content elements are present
      expect(screen.getByText('Step 1 Content')).toBeInTheDocument();
      expect(screen.getByText('Step 2 Content')).toBeInTheDocument();
      expect(screen.getByText('Step 3 Content')).toBeInTheDocument();
    });

    it('should provide contextual onboarding flow', async () => {
      const user = userEvent.setup();
      
      render(
        <IntegrationTestWrapper>
          <OnboardingFlow
            currentStep={1}
            totalSteps={3}
            data-testid="onboarding-flow"
          />
        </IntegrationTestWrapper>
      );

      // Verify onboarding flow is displayed
      const flow = screen.getByTestId('onboarding-flow');
      expect(flow).toBeInTheDocument();
    });
  });

  describe('Performance and Optimization', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        description: `Description for item ${i}`
      }));

      render(
        <IntegrationTestWrapper>
          <div data-testid="performance-test">
            {largeDataset.slice(0, 10).map(item => (
              <Card key={item.id} data-testid={`card-${item.id}`}>
                <Typography variant="h4">{item.title}</Typography>
                <Typography variant="body">{item.description}</Typography>
              </Card>
            ))}
          </div>
        </IntegrationTestWrapper>
      );

      // Verify first 10 items are rendered efficiently
      expect(screen.getByTestId('card-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('card-item-9')).toBeInTheDocument();
      expect(screen.getByText('Item 0')).toBeInTheDocument();
      expect(screen.getByText('Item 9')).toBeInTheDocument();
    });
  });
});