'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { 
  OnboardingManager, 
  OnboardingConfig, 
  useOnboardingManager,
  createDefaultOnboardingConfigs 
} from '@/components/molecules/OnboardingManager';

interface OnboardingContextType {
  startOnboarding: (configId: string) => void;
  startTour: (configId: string) => void;
  resetOnboarding: (configId: string) => void;
  isOnboardingCompleted: (configId: string) => boolean;
  isOnboardingSkipped: (configId: string) => boolean;
  addOnboardingConfig: (config: OnboardingConfig) => void;
  removeOnboardingConfig: (configId: string) => void;
  setUserRole: (role: string) => void;
  userRole?: string;
  isFirstVisit: boolean;
  currentRoute?: string;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};

interface OnboardingProviderProps {
  children: React.ReactNode;
  customConfigs?: OnboardingConfig[];
  featureFlags?: Record<string, boolean>;
}

export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
  customConfigs = [],
  featureFlags = {},
}) => {
  const { isFirstVisit, userRole, currentRoute, setUserRole } = useOnboardingManager();
  const managerRef = React.useRef<any>(null);

  // Memoize the configs to prevent infinite re-renders
  const configs = useMemo(() => {
    const defaultConfigs = createDefaultOnboardingConfigs();
    return [...defaultConfigs, ...customConfigs];
  }, [customConfigs]);

  const startOnboarding = (configId: string) => {
    if (managerRef.current) {
      managerRef.current.manuallyStartOnboarding(configId);
    }
  };

  const startTour = (configId: string) => {
    if (managerRef.current) {
      managerRef.current.manuallyStartTour(configId);
    }
  };

  const resetOnboarding = (configId: string) => {
    if (managerRef.current) {
      managerRef.current.resetOnboarding(configId);
    }
  };

  const isOnboardingCompleted = (configId: string): boolean => {
    if (managerRef.current) {
      return managerRef.current.isOnboardingCompleted(configId);
    }
    return false;
  };

  const isOnboardingSkipped = (configId: string): boolean => {
    if (managerRef.current) {
      return managerRef.current.isOnboardingSkipped(configId);
    }
    return false;
  };

  const [dynamicConfigs, setDynamicConfigs] = useState<OnboardingConfig[]>([]);

  // Combine static configs with dynamic configs
  const allConfigs = useMemo(() => {
    return [...configs, ...dynamicConfigs];
  }, [configs, dynamicConfigs]);

  const addOnboardingConfig = (config: OnboardingConfig) => {
    setDynamicConfigs(prev => [...prev, config]);
  };

  const removeOnboardingConfig = (configId: string) => {
    setDynamicConfigs(prev => prev.filter(config => config.id !== configId));
  };

  const handleComplete = (configId: string) => {
    console.log(`Onboarding completed: ${configId}`);
  };

  const handleSkip = (configId: string) => {
    console.log(`Onboarding skipped: ${configId}`);
  };

  const contextValue: OnboardingContextType = {
    startOnboarding,
    startTour,
    resetOnboarding,
    isOnboardingCompleted,
    isOnboardingSkipped,
    addOnboardingConfig,
    removeOnboardingConfig,
    setUserRole,
    userRole,
    isFirstVisit,
    currentRoute,
  };

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      <OnboardingManager
        ref={managerRef}
        configs={allConfigs}
        userRole={userRole}
        currentRoute={currentRoute}
        featureFlags={featureFlags}
        onComplete={handleComplete}
        onSkip={handleSkip}
      />
    </OnboardingContext.Provider>
  );
};