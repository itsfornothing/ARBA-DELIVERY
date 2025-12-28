/**
 * Unit Tests for Order Creation and Tracking Interfaces
 * Tests the enhanced order creation wizard and tracking components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider } from 'styled-components';
import { defaultTheme } from '@/lib/theme';
import { OrderCreationWizard } from '@/components/molecules/OrderCreationWizard';
import { EnhancedOrderTracking } from '@/components/molecules/EnhancedOrderTracking';
import { Package, CheckCircle, Truck } from 'lucide-react';

// Test wrapper with theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={defaultTheme}>
    {children}
  </ThemeProvider>
);

// Mock data
const mockOrder = {
  id: 123,
  status: 'IN_TRANSIT',
  pickup_address: '123 Main St, City A',
  delivery_address: '456 Oak Ave, City B',
  distance_km: 5.2,
  price: 154,
  created_at: new Date().toISOString(),
  assigned_courier_name: 'John Doe',
  estimated_delivery: new Date(Date.now() + 1800000).toISOString() // 30 minutes from now
};

const mockTrackingSteps = [
  {
    id: 'created',
    label: 'Order Created',
    description: 'Your order has been created and is waiting for courier assignment.',
    completed: true,
    current: false,
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    icon: Package
  },
  {
    id: 'assigned',
    label: 'Courier Assigned',
    description: 'A courier has been assigned and is heading to the pickup location.',
    completed: true,
    current: false,
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    icon: CheckCircle
  },
  {
    id: 'in_transit',
    label: 'In Transit',
    description: 'Your order is on the way to the delivery location.',
    completed: false,
    current: true,
    icon: Truck
  }
];

describe('Order Creation Wizard', () => {
  it('renders the wizard with initial step', () => {
    const mockSubmit = jest.fn();
    
    render(
      <TestWrapper>
        <OrderCreationWizard onSubmit={mockSubmit} />
      </TestWrapper>
    );

    // Check that the first step is displayed
    expect(screen.getByText('Pickup & Delivery Addresses')).toBeInTheDocument();
    expect(screen.getByText('Pickup Address')).toBeInTheDocument();
    expect(screen.getByText('Delivery Address')).toBeInTheDocument();
  });

  it('shows progress indicators for all steps', () => {
    const mockSubmit = jest.fn();
    
    render(
      <TestWrapper>
        <OrderCreationWizard onSubmit={mockSubmit} />
      </TestWrapper>
    );

    // Check that all step labels are present
    expect(screen.getByText('Addresses')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
    expect(screen.getByText('Payment')).toBeInTheDocument();
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('validates form inputs before allowing navigation', () => {
    const mockSubmit = jest.fn();
    
    render(
      <TestWrapper>
        <OrderCreationWizard onSubmit={mockSubmit} />
      </TestWrapper>
    );

    const nextButton = screen.getByText('Next');
    
    // Next button should be disabled initially (empty addresses)
    expect(nextButton).toBeDisabled();
  });

  it('enables next button when addresses are filled', async () => {
    const mockSubmit = jest.fn();
    
    render(
      <TestWrapper>
        <OrderCreationWizard onSubmit={mockSubmit} />
      </TestWrapper>
    );

    // Fill in addresses
    const pickupInput = screen.getByPlaceholderText(/pickup address/i);
    const deliveryInput = screen.getByPlaceholderText(/delivery address/i);
    
    fireEvent.change(pickupInput, { target: { value: '123 Main Street, City A' } });
    fireEvent.change(deliveryInput, { target: { value: '456 Oak Avenue, City B' } });

    await waitFor(() => {
      const nextButton = screen.getByText('Next');
      expect(nextButton).not.toBeDisabled();
    });
  });

  it('shows pricing calculation', () => {
    const mockSubmit = jest.fn();
    const pricingConfig = { base_fee: 50, per_km_rate: 20 };
    
    render(
      <TestWrapper>
        <OrderCreationWizard onSubmit={mockSubmit} pricingConfig={pricingConfig} />
      </TestWrapper>
    );

    // Navigate to details step first by filling addresses
    const pickupInput = screen.getByPlaceholderText(/pickup address/i);
    const deliveryInput = screen.getByPlaceholderText(/delivery address/i);
    
    fireEvent.change(pickupInput, { target: { value: '123 Main Street, City A' } });
    fireEvent.change(deliveryInput, { target: { value: '456 Oak Avenue, City B' } });
    
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    // Check that pricing is displayed
    expect(screen.getByText('Price Breakdown')).toBeInTheDocument();
    expect(screen.getByText('Base fee:')).toBeInTheDocument();
  });
});

describe('Enhanced Order Tracking', () => {
  it('renders order information correctly', () => {
    render(
      <TestWrapper>
        <EnhancedOrderTracking
          order={mockOrder}
          progress_percentage={75}
          tracking_steps={mockTrackingSteps}
        />
      </TestWrapper>
    );

    // Check order details
    expect(screen.getByText(`Order #${mockOrder.id}`)).toBeInTheDocument();
    expect(screen.getByText('In Transit')).toBeInTheDocument();
    expect(screen.getByText(mockOrder.pickup_address)).toBeInTheDocument();
    expect(screen.getByText(mockOrder.delivery_address)).toBeInTheDocument();
  });

  it('displays progress bar with correct percentage', () => {
    render(
      <TestWrapper>
        <EnhancedOrderTracking
          order={mockOrder}
          progress_percentage={75}
          tracking_steps={mockTrackingSteps}
        />
      </TestWrapper>
    );

    // Check progress percentage is displayed
    expect(screen.getByText('75% Complete')).toBeInTheDocument();
  });

  it('shows courier information when available', () => {
    render(
      <TestWrapper>
        <EnhancedOrderTracking
          order={mockOrder}
          progress_percentage={75}
          tracking_steps={mockTrackingSteps}
        />
      </TestWrapper>
    );

    // Check courier information
    expect(screen.getByText('Your Courier')).toBeInTheDocument();
    expect(screen.getByText(mockOrder.assigned_courier_name!)).toBeInTheDocument();
  });

  it('displays tracking timeline with steps', () => {
    render(
      <TestWrapper>
        <EnhancedOrderTracking
          order={mockOrder}
          progress_percentage={75}
          tracking_steps={mockTrackingSteps}
        />
      </TestWrapper>
    );

    // Check timeline steps
    expect(screen.getByText('Delivery Timeline')).toBeInTheDocument();
    expect(screen.getByText('Order Created')).toBeInTheDocument();
    expect(screen.getByText('Courier Assigned')).toBeInTheDocument();
    expect(screen.getByText('In Transit')).toBeInTheDocument();
  });

  it('shows estimated delivery time when available', () => {
    render(
      <TestWrapper>
        <EnhancedOrderTracking
          order={mockOrder}
          progress_percentage={75}
          tracking_steps={mockTrackingSteps}
        />
      </TestWrapper>
    );

    // Check estimated delivery
    expect(screen.getByText('Estimated Delivery')).toBeInTheDocument();
  });

  it('displays real-time updates indicator', () => {
    render(
      <TestWrapper>
        <EnhancedOrderTracking
          order={mockOrder}
          progress_percentage={75}
          tracking_steps={mockTrackingSteps}
          realTimeUpdates={true}
        />
      </TestWrapper>
    );

    // Check real-time indicator
    expect(screen.getByText('Real-time Tracking Active')).toBeInTheDocument();
  });

  it('shows order summary with key metrics', () => {
    render(
      <TestWrapper>
        <EnhancedOrderTracking
          order={mockOrder}
          progress_percentage={75}
          tracking_steps={mockTrackingSteps}
        />
      </TestWrapper>
    );

    // Check order summary
    expect(screen.getByText('Order Summary')).toBeInTheDocument();
    expect(screen.getByText(`${mockOrder.distance_km} km`)).toBeInTheDocument();
    expect(screen.getByText(`$${mockOrder.price}`)).toBeInTheDocument();
  });
});