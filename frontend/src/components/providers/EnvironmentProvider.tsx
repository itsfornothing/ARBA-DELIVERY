'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  EnvironmentConfig, 
  getEnvironmentConfig,
  validateEnvironment,
  EnvironmentValidationError
} from '@/lib/envValidation';

interface EnvironmentContextType {
  config: EnvironmentConfig | null;
  isValid: boolean;
  errors: string[];
  isLoading: boolean;
}

const EnvironmentContext = createContext<EnvironmentContextType | undefined>(undefined);

interface EnvironmentProviderProps {
  children: React.ReactNode;
}

/**
 * Environment Provider Component
 * 
 * Validates environment variables on application startup and provides
 * the configuration to child components through context.
 */
export function EnvironmentProvider({ children }: EnvironmentProviderProps) {
  const [state, setState] = useState<EnvironmentContextType>({
    config: null,
    isValid: false,
    errors: [],
    isLoading: true,
  });

  useEffect(() => {
    try {
      // Try to validate environment variables
      const config = validateEnvironment();
      
      // Log configuration for debugging (development only)
      if (process.env.NODE_ENV === 'development') {
        console.log('Environment configuration loaded:', {
          apiUrl: config.apiUrl,
          wsUrl: config.wsUrl,
          mediaUrl: config.mediaUrl,
          nodeEnv: config.nodeEnv,
        });
      }
      
      setState({
        config,
        isValid: true,
        errors: [],
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof EnvironmentValidationError) {
        // Try to get config with fallbacks (for development)
        try {
          const config = getEnvironmentConfig();
          setState({
            config,
            isValid: false,
            errors: [error.message],
            isLoading: false,
          });
        } catch (fallbackError) {
          setState({
            config: null,
            isValid: false,
            errors: [error.message],
            isLoading: false,
          });
        }
      } else {
        console.error('Environment validation error:', error);
        setState({
          config: null,
          isValid: false,
          errors: [error instanceof Error ? error.message : 'Unknown environment validation error'],
          isLoading: false,
        });
      }
    }
  }, []);

  // Show loading state
  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating environment configuration...</p>
        </div>
      </div>
    );
  }

  // Show error state for production or critical failures
  if (!state.config || (!state.isValid && process.env.NODE_ENV === 'production')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50">
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg border border-red-200">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                Configuration Error
              </h3>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-red-700 mb-3">
              The application cannot start due to environment configuration issues:
            </p>
            <ul className="text-sm text-red-600 space-y-1">
              {state.errors.map((error, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 mr-2">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="bg-red-100 border border-red-200 rounded p-3">
            <p className="text-xs text-red-700">
              Please contact your system administrator or check the deployment configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show warning for development with invalid config
  if (!state.isValid && process.env.NODE_ENV === 'development') {
    console.warn('Running with invalid environment configuration in development mode');
  }

  return (
    <EnvironmentContext.Provider value={state}>
      {children}
    </EnvironmentContext.Provider>
  );
}

/**
 * Hook to access environment configuration
 */
export function useEnvironment(): EnvironmentContextType {
  const context = useContext(EnvironmentContext);
  if (context === undefined) {
    throw new Error('useEnvironment must be used within an EnvironmentProvider');
  }
  return context;
}

/**
 * Hook to get validated environment config
 */
export function useEnvironmentConfig(): EnvironmentConfig {
  const { config } = useEnvironment();
  if (!config) {
    throw new Error('Environment configuration is not available');
  }
  return config;
}