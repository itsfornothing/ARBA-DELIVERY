import React from 'react';
import { render, screen } from '@testing-library/react';
import { OnboardingProvider, useOnboarding } from '../OnboardingProvider';

// Mock the OnboardingManager components
jest.mock('@/components/molecules/OnboardingManager', () => ({
  OnboardingManager: React.forwardRef(({ configs }: any, ref: any) => {
    React.useImperativeHandle(ref, () => ({
      manuallyStartOnboarding: jest.fn(),
      manuallyStartTour: jest.fn(),
      resetOnboarding: jest.fn(),
      isOnboardingCompleted: jest.fn(() => false),
      isOnboardingSkipped: jest.fn(() => false),
    }));
    return <div data-testid="onboarding-manager">Manager with {configs.length} configs</div>;
  }),
  useOnboardingManager: () => ({
    isFirstVisit: true,
    userRole: undefined,
    currentRoute: '/',
    setUserRole: jest.fn(),
  }),
  createDefaultOnboardingConfigs: () => [
    { id: 'test-config', name: 'Test Config', version: '1.0.0', triggers: {} }
  ],
}));

// Test component that uses the onboarding context
const TestComponent = () => {
  const { startOnboarding, addOnboardingConfig } = useOnboarding();
  
  return (
    <div>
      <button onClick={() => startOnboarding('test')}>Start Onboarding</button>
      <button onClick={() => addOnboardingConfig({ 
        id: 'new-config', 
        name: 'New Config', 
        version: '1.0.0', 
        triggers: {} 
      })}>
        Add Config
      </button>
    </div>
  );
};

describe('OnboardingProvider', () => {
  it('should render without infinite re-renders', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <OnboardingProvider>
        <TestComponent />
      </OnboardingProvider>
    );

    // Check that the provider renders successfully
    expect(screen.getByText('Start Onboarding')).toBeInTheDocument();
    expect(screen.getByText('Add Config')).toBeInTheDocument();
    expect(screen.getByTestId('onboarding-manager')).toBeInTheDocument();

    // Verify no console errors about maximum update depth
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Maximum update depth exceeded')
    );

    consoleSpy.mockRestore();
  });

  it('should handle custom configs without re-renders', () => {
    const customConfigs = [
      { id: 'custom-1', name: 'Custom 1', version: '1.0.0', triggers: {} },
      { id: 'custom-2', name: 'Custom 2', version: '1.0.0', triggers: {} }
    ];

    render(
      <OnboardingProvider customConfigs={customConfigs}>
        <TestComponent />
      </OnboardingProvider>
    );

    // Should render with both default and custom configs
    expect(screen.getByText(/Manager with \d+ configs/)).toBeInTheDocument();
  });

  it('should provide stable context value', () => {
    let renderCount = 0;
    
    const TestStabilityComponent = () => {
      renderCount++;
      const context = useOnboarding();
      
      // This should not cause infinite re-renders
      React.useEffect(() => {
        // Just accessing the context should not trigger re-renders
      }, [context]);
      
      return <div>Render count: {renderCount}</div>;
    };

    render(
      <OnboardingProvider>
        <TestStabilityComponent />
      </OnboardingProvider>
    );

    // Should render only once initially
    expect(screen.getByText('Render count: 1')).toBeInTheDocument();
  });
});