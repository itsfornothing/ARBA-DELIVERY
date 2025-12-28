'use client';

import React, { Suspense } from 'react';
import { LoadingOverlay } from './LoadingOverlay';
import { 
  OrderListSkeleton, 
  DashboardStatsSkeleton, 
  FormSkeleton, 
  TableSkeleton, 
  ProfileSkeleton, 
  ChartSkeleton, 
  PageSkeleton 
} from './SkeletonScreens';

interface LoadingBoundaryProps {
  children: React.ReactNode;
  fallback?: 'spinner' | 'skeleton' | 'custom';
  skeletonType?: 'order-list' | 'dashboard-stats' | 'form' | 'table' | 'profile' | 'chart' | 'page';
  loadingMessage?: string;
  customFallback?: React.ReactNode;
  className?: string;
}

const getSkeletonComponent = (type: LoadingBoundaryProps['skeletonType']) => {
  switch (type) {
    case 'order-list':
      return <OrderListSkeleton />;
    case 'dashboard-stats':
      return <DashboardStatsSkeleton />;
    case 'form':
      return <FormSkeleton />;
    case 'table':
      return <TableSkeleton />;
    case 'profile':
      return <ProfileSkeleton />;
    case 'chart':
      return <ChartSkeleton />;
    case 'page':
      return <PageSkeleton />;
    default:
      return <PageSkeleton />;
  }
};

const LoadingFallback: React.FC<{
  fallback: LoadingBoundaryProps['fallback'];
  skeletonType: LoadingBoundaryProps['skeletonType'];
  loadingMessage?: string;
  customFallback?: React.ReactNode;
}> = ({ fallback, skeletonType, loadingMessage, customFallback }) => {
  if (fallback === 'custom' && customFallback) {
    return <>{customFallback}</>;
  }
  
  if (fallback === 'skeleton') {
    return getSkeletonComponent(skeletonType);
  }
  
  // Default to spinner
  return (
    <LoadingOverlay
      loading={true}
      message={loadingMessage}
      variant="inline"
      size="medium"
    />
  );
};

export const LoadingBoundary: React.FC<LoadingBoundaryProps> = ({
  children,
  fallback = 'spinner',
  skeletonType = 'page',
  loadingMessage,
  customFallback,
  className,
}) => {
  return (
    <div className={className}>
      <Suspense
        fallback={
          <LoadingFallback
            fallback={fallback}
            skeletonType={skeletonType}
            loadingMessage={loadingMessage}
            customFallback={customFallback}
          />
        }
      >
        {children}
      </Suspense>
    </div>
  );
};

// Higher-order component for wrapping components with loading boundaries
export const withLoadingBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<LoadingBoundaryProps, 'children'> = {}
) => {
  const WrappedComponent = (props: P) => (
    <LoadingBoundary {...options}>
      <Component {...props} />
    </LoadingBoundary>
  );
  
  WrappedComponent.displayName = `withLoadingBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};