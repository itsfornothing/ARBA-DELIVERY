'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { OnboardingFlow, OnboardingStep } from './OnboardingFlow';
import { GuidedTour, TourStep } from './GuidedTour';
import { FeatureTooltip } from './FeatureTooltip';

export interface OnboardingConfig {
  id: string;
  name: string;
  version: string;
  triggers: {
    firstVisit?: boolean;
    userRole?: string[];
    pageRoute?: string[];
    featureFlag?: string;
    customCondition?: () => boolean;
  };
  onboardingSteps?: OnboardingStep[];
  tourSteps?: TourStep[];
  tooltips?: Array<{
    id: string;
    target: string;
    title: string;
    content: string;
    type?: 'info' | 'tip' | 'warning' | 'success' | 'feature';
    delay?: number;
  }>;
  priority?: number;
  autoStart?: boolean;
  showOnce?: boolean;
}

export interface OnboardingManagerProps {
  configs: OnboardingConfig[];
  userRole?: string;
  currentRoute?: string;
  featureFlags?: Record<string, boolean>;
  onComplete?: (configId: string) => void;
  onSkip?: (configId: string) => void;
}

interface OnboardingState {
  activeConfig: OnboardingConfig | null;
  showOnboarding: boolean;
  showTour: boolean;
  completedOnboardings: Set<string>;
  skippedOnboardings: Set<string>;
  firstVisitDetected: boolean;
}

export const OnboardingManager = React.forwardRef<
  {
    manuallyStartOnboarding: (configId: string) => void;
    manuallyStartTour: (configId: string) => void;
    resetOnboarding: (configId: string) => void;
    isOnboardingCompleted: (configId: string) => boolean;
    isOnboardingSkipped: (configId: string) => boolean;
  },
  OnboardingManagerProps
>(({
  configs,
  userRole,
  currentRoute,
  featureFlags = {},
  onComplete,
  onSkip,
}, ref) => {
  const [state, setState] = useState<OnboardingState>({
    activeConfig: null,
    showOnboarding: false,
    showTour: false,
    completedOnboardings: new Set(),
    skippedOnboardings: new Set(),
    firstVisitDetected: false,
  });

  // Initialize state from localStorage
  const [initialized, setInitialized] = useState(false);
  const configProcessedRef = useRef(false);

  useEffect(() => {
    if (initialized) return;

    const completed = new Set<string>();
    const skipped = new Set<string>();
    
    configs.forEach(config => {
      if (localStorage.getItem(`onboarding_completed_${config.id}`) === 'true') {
        completed.add(config.id);
      }
      if (localStorage.getItem(`onboarding_skipped_${config.id}`) === 'true') {
        skipped.add(config.id);
      }
    });

    // Detect first visit
    const hasVisitedBefore = localStorage.getItem('has_visited_before') === 'true';
    const firstVisit = !hasVisitedBefore;
    
    if (firstVisit) {
      localStorage.setItem('has_visited_before', 'true');
    }

    setState(prev => ({
      ...prev,
      completedOnboardings: completed,
      skippedOnboardings: skipped,
      firstVisitDetected: firstVisit,
    }));

    setInitialized(true);
  }, [configs, initialized]);

  // Check if a config should be triggered
  const shouldTriggerConfig = useCallback((config: OnboardingConfig): boolean => {
    const { triggers } = config;
    
    // Skip if already completed or skipped (and showOnce is true)
    if (config.showOnce !== false) {
      if (state.completedOnboardings.has(config.id) || state.skippedOnboardings.has(config.id)) {
        return false;
      }
    }

    // Check first visit trigger
    if (triggers.firstVisit && !state.firstVisitDetected) {
      return false;
    }

    // Check user role trigger
    if (triggers.userRole && userRole && !triggers.userRole.includes(userRole)) {
      return false;
    }

    // Check page route trigger
    if (triggers.pageRoute && currentRoute && !triggers.pageRoute.some(route => 
      currentRoute.includes(route) || new RegExp(route).test(currentRoute)
    )) {
      return false;
    }

    // Check feature flag trigger
    if (triggers.featureFlag && !featureFlags[triggers.featureFlag]) {
      return false;
    }

    // Check custom condition
    if (triggers.customCondition && !triggers.customCondition()) {
      return false;
    }

    return true;
  }, [state.completedOnboardings, state.skippedOnboardings, state.firstVisitDetected, userRole, currentRoute, featureFlags]);

  // Find the highest priority config that should be triggered
  useEffect(() => {
    if (!initialized || state.activeConfig || configProcessedRef.current) {
      return; // Wait for initialization or already have active config or already processed
    }

    const eligibleConfigs = configs
      .filter(config => {
        const { triggers } = config;
        
        // Skip if already completed or skipped (and showOnce is true)
        if (config.showOnce !== false) {
          if (state.completedOnboardings.has(config.id) || state.skippedOnboardings.has(config.id)) {
            return false;
          }
        }

        // Check first visit trigger
        if (triggers.firstVisit && !state.firstVisitDetected) {
          return false;
        }

        // Check user role trigger
        if (triggers.userRole && userRole && !triggers.userRole.includes(userRole)) {
          return false;
        }

        // Check page route trigger
        if (triggers.pageRoute && currentRoute && !triggers.pageRoute.some(route => 
          currentRoute.includes(route) || new RegExp(route).test(currentRoute)
        )) {
          return false;
        }

        // Check feature flag trigger
        if (triggers.featureFlag && !featureFlags[triggers.featureFlag]) {
          return false;
        }

        // Check custom condition
        if (triggers.customCondition && !triggers.customCondition()) {
          return false;
        }

        return true;
      })
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));

    if (eligibleConfigs.length > 0) {
      const configToActivate = eligibleConfigs[0];
      
      setState(prev => ({
        ...prev,
        activeConfig: configToActivate,
      }));

      // Auto-start if configured
      if (configToActivate.autoStart !== false) {
        setTimeout(() => {
          startOnboarding(configToActivate);
        }, 1000); // Small delay to ensure DOM is ready
      }
    }

    configProcessedRef.current = true;
  }, [initialized, configs, userRole, currentRoute, featureFlags]);

  const startOnboarding = (config: OnboardingConfig) => {
    setState(prev => ({
      ...prev,
      activeConfig: config,
      showOnboarding: !!config.onboardingSteps?.length,
      showTour: false,
    }));
  };

  const startTour = (config: OnboardingConfig) => {
    setState(prev => ({
      ...prev,
      activeConfig: config,
      showOnboarding: false,
      showTour: !!config.tourSteps?.length,
    }));
  };

  const handleOnboardingComplete = () => {
    if (!state.activeConfig) return;

    const configId = state.activeConfig.id;
    
    // Mark as completed
    localStorage.setItem(`onboarding_completed_${configId}`, 'true');
    setState(prev => ({
      ...prev,
      completedOnboardings: new Set(prev.completedOnboardings).add(configId),
      showOnboarding: false,
    }));

    // Start tour if available
    if (state.activeConfig.tourSteps?.length) {
      setTimeout(() => {
        startTour(state.activeConfig!);
      }, 500);
    } else {
      // Complete entirely
      setState(prev => ({
        ...prev,
        activeConfig: null,
      }));
      // Allow reprocessing for next config
      configProcessedRef.current = false;
    }

    if (onComplete) {
      onComplete(configId);
    }
  };

  const handleTourComplete = () => {
    if (!state.activeConfig) return;

    const configId = state.activeConfig.id;
    
    // Mark tour as completed
    localStorage.setItem(`tour_completed_${configId}`, 'true');
    setState(prev => ({
      ...prev,
      showTour: false,
      activeConfig: null,
    }));

    // Allow reprocessing for next config
    configProcessedRef.current = false;

    if (onComplete) {
      onComplete(configId);
    }
  };

  const handleOnboardingSkip = () => {
    if (!state.activeConfig) return;

    const configId = state.activeConfig.id;
    
    // Mark as skipped
    localStorage.setItem(`onboarding_skipped_${configId}`, 'true');
    setState(prev => ({
      ...prev,
      skippedOnboardings: new Set(prev.skippedOnboardings).add(configId),
      showOnboarding: false,
      activeConfig: null,
    }));

    // Allow reprocessing for next config
    configProcessedRef.current = false;

    if (onSkip) {
      onSkip(configId);
    }
  };

  const handleTourSkip = () => {
    if (!state.activeConfig) return;

    const configId = state.activeConfig.id;
    
    // Mark tour as skipped
    localStorage.setItem(`tour_skipped_${configId}`, 'true');
    setState(prev => ({
      ...prev,
      showTour: false,
      activeConfig: null,
    }));

    // Allow reprocessing for next config
    configProcessedRef.current = false;

    if (onSkip) {
      onSkip(configId);
    }
  };

  // Public API for manual control
  const manuallyStartOnboarding = (configId: string) => {
    const config = configs.find(c => c.id === configId);
    if (config) {
      startOnboarding(config);
    }
  };

  const manuallyStartTour = (configId: string) => {
    const config = configs.find(c => c.id === configId);
    if (config) {
      startTour(config);
    }
  };

  const resetOnboarding = (configId: string) => {
    localStorage.removeItem(`onboarding_completed_${configId}`);
    localStorage.removeItem(`onboarding_skipped_${configId}`);
    localStorage.removeItem(`tour_completed_${configId}`);
    localStorage.removeItem(`tour_skipped_${configId}`);
    
    setState(prev => {
      const newCompleted = new Set(prev.completedOnboardings);
      const newSkipped = new Set(prev.skippedOnboardings);
      newCompleted.delete(configId);
      newSkipped.delete(configId);
      
      return {
        ...prev,
        completedOnboardings: newCompleted,
        skippedOnboardings: newSkipped,
      };
    });
  };

  const isOnboardingCompleted = (configId: string) => {
    return state.completedOnboardings.has(configId);
  };

  const isOnboardingSkipped = (configId: string) => {
    return state.skippedOnboardings.has(configId);
  };

  // Expose methods via ref
  React.useImperativeHandle(ref, () => ({
    manuallyStartOnboarding,
    manuallyStartTour,
    resetOnboarding,
    isOnboardingCompleted,
    isOnboardingSkipped,
  }));

  return (
    <>
      {/* Onboarding Flow */}
      {state.activeConfig?.onboardingSteps && (
        <OnboardingFlow
          steps={state.activeConfig.onboardingSteps}
          isVisible={state.showOnboarding}
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
          showProgress={true}
          celebrateCompletion={true}
        />
      )}

      {/* Guided Tour */}
      {state.activeConfig?.tourSteps && (
        <GuidedTour
          steps={state.activeConfig.tourSteps}
          isActive={state.showTour}
          onComplete={handleTourComplete}
          onSkip={handleTourSkip}
          tourId={state.activeConfig.id}
          showProgress={true}
          showSkipAll={true}
        />
      )}

      {/* Feature Tooltips */}
      {state.activeConfig?.tooltips?.map(tooltip => (
        <FeatureTooltip
          key={tooltip.id}
          id={tooltip.id}
          target={tooltip.target}
          title={tooltip.title}
          content={tooltip.content}
          type={tooltip.type}
          delay={tooltip.delay}
          showOnce={true}
          trigger="manual"
        />
      ))}
    </>
  );
});

// Hook for using onboarding manager
export const useOnboardingManager = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [userRole, setUserRole] = useState<string | undefined>();
  const [currentRoute, setCurrentRoute] = useState<string | undefined>();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Only run on client side and only once
    if (typeof window === 'undefined' || initialized) return;

    // Detect first visit
    const hasVisited = localStorage.getItem('has_visited_before') === 'true';
    setIsFirstVisit(!hasVisited);

    // Get current route
    setCurrentRoute(window.location.pathname);

    // Listen for route changes
    const handleRouteChange = () => {
      setCurrentRoute(window.location.pathname);
    };

    window.addEventListener('popstate', handleRouteChange);
    setInitialized(true);

    return () => window.removeEventListener('popstate', handleRouteChange);
  }, [initialized]);

  const memoizedSetUserRole = useCallback((role: string) => {
    setUserRole(role);
  }, []);

  return useMemo(() => ({
    isFirstVisit,
    userRole,
    currentRoute,
    setUserRole: memoizedSetUserRole,
  }), [isFirstVisit, userRole, currentRoute, memoizedSetUserRole]);
};

// Predefined onboarding configurations - memoized to prevent recreation
const defaultOnboardingConfigs: OnboardingConfig[] = [
  {
    id: 'first-time-user',
    name: 'First Time User Onboarding',
    version: '1.0.0',
    triggers: {
      firstVisit: true,
    },
    priority: 100,
    autoStart: true,
    showOnce: true,
    onboardingSteps: [
      {
        id: 'welcome',
        title: 'Welcome to Arba Delivery!',
        description: 'We\'re excited to have you join our delivery platform. Let\'s get you started with a quick tour.',
        icon: <span>👋</span>,
      },
      {
        id: 'features',
        title: 'Key Features',
        description: 'Discover fast delivery, real-time tracking, and our network of professional couriers.',
        icon: <span>⚡</span>,
      },
      {
        id: 'get-started',
        title: 'Ready to Order?',
        description: 'Create your account to start placing orders and tracking deliveries.',
        icon: <span>🚀</span>,
        action: {
          label: 'Create Account',
          onClick: () => {
            window.location.href = '/auth/register';
          },
        },
      },
    ],
    tourSteps: [
      {
        id: 'navigation',
        target: '[data-tour="navigation"]',
        title: 'Navigation',
        content: 'Use the navigation menu to access different sections of the platform.',
        placement: 'bottom',
      },
      {
        id: 'start-ordering',
        target: '[data-tour="start-ordering"]',
        title: 'Start Ordering',
        content: 'Click here to create your account and start placing orders.',
        placement: 'top',
      },
      {
        id: 'become-courier',
        target: '[data-tour="become-courier"]',
        title: 'Become a Courier',
        content: 'Interested in earning money? Join our courier network.',
        placement: 'top',
      },
    ],
  },
  {
    id: 'customer-dashboard',
    name: 'Customer Dashboard Tour',
    version: '1.0.0',
    triggers: {
      userRole: ['customer'],
      pageRoute: ['/customer/dashboard'],
    },
    priority: 80,
    autoStart: true,
    showOnce: true,
    tourSteps: [
      {
        id: 'create-order',
        target: '[data-tour="create-order"]',
        title: 'Create New Order',
        content: 'Click here to start creating a new delivery order.',
        placement: 'bottom',
      },
      {
        id: 'order-history',
        target: '[data-tour="order-history"]',
        title: 'Order History',
        content: 'View all your past and current orders here.',
        placement: 'left',
      },
      {
        id: 'notifications',
        target: '[data-tour="notifications"]',
        title: 'Notifications',
        content: 'Stay updated with order status and important messages.',
        placement: 'bottom',
      },
    ],
  },
  {
    id: 'courier-dashboard',
    name: 'Courier Dashboard Tour',
    version: '1.0.0',
    triggers: {
      userRole: ['courier'],
      pageRoute: ['/courier/dashboard'],
    },
    priority: 80,
    autoStart: true,
    showOnce: true,
    tourSteps: [
      {
        id: 'available-orders',
        target: '[data-tour="available-orders"]',
        title: 'Available Orders',
        content: 'Browse and accept delivery orders in your area.',
        placement: 'bottom',
      },
      {
        id: 'earnings',
        target: '[data-tour="earnings"]',
        title: 'Earnings Overview',
        content: 'Track your daily and weekly earnings here.',
        placement: 'left',
      },
      {
        id: 'status-toggle',
        target: '[data-tour="status-toggle"]',
        title: 'Online Status',
        content: 'Toggle your availability to receive new orders.',
        placement: 'bottom',
      },
    ],
  },
];

export const createDefaultOnboardingConfigs = (): OnboardingConfig[] => defaultOnboardingConfigs;