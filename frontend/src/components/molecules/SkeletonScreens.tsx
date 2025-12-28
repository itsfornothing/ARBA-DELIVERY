'use client';

import React from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/atoms/Skeleton';

interface SkeletonScreenProps {
  className?: string;
}

const SkeletonContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const SkeletonRow = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
`;

const SkeletonGrid = styled.div<{ columns?: number }>`
  display: grid;
  grid-template-columns: repeat(${({ columns = 3 }) => columns}, 1fr);
  gap: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.tablet}) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    grid-template-columns: 1fr;
  }
`;

const SkeletonCard = styled.div`
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  background-color: ${({ theme }) => theme.colors.surface};
`;

// Order Card Skeleton
export const OrderCardSkeleton: React.FC<SkeletonScreenProps> = ({ className }) => (
  <SkeletonCard className={className}>
    <SkeletonRow>
      <Skeleton variant="circular" width={48} height={48} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="40%" height={16} />
      </div>
      <Skeleton variant="rectangular" width={80} height={32} />
    </SkeletonRow>
    <div style={{ marginTop: '16px' }}>
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="80%" height={16} />
    </div>
    <SkeletonRow style={{ marginTop: '16px' }}>
      <Skeleton variant="rectangular" width={100} height={24} />
      <Skeleton variant="rectangular" width={120} height={24} />
    </SkeletonRow>
  </SkeletonCard>
);

// Dashboard Stats Skeleton
export const DashboardStatsSkeleton: React.FC<SkeletonScreenProps> = ({ className }) => (
  <SkeletonGrid columns={4} className={className}>
    {[...Array(4)].map((_, index) => (
      <SkeletonCard key={index}>
        <SkeletonRow>
          <Skeleton variant="circular" width={40} height={40} />
          <div style={{ flex: 1 }}>
            <Skeleton variant="text" width="70%" height={16} />
            <Skeleton variant="text" width="50%" height={24} />
          </div>
        </SkeletonRow>
      </SkeletonCard>
    ))}
  </SkeletonGrid>
);

// Order List Skeleton
export const OrderListSkeleton: React.FC<SkeletonScreenProps> = ({ className }) => (
  <SkeletonContainer className={className}>
    {[...Array(5)].map((_, index) => (
      <OrderCardSkeleton key={index} />
    ))}
  </SkeletonContainer>
);

// Form Skeleton
export const FormSkeleton: React.FC<SkeletonScreenProps> = ({ className }) => (
  <SkeletonContainer className={className}>
    <Skeleton variant="text" width="30%" height={24} />
    <Skeleton variant="rectangular" width="100%" height={48} />
    
    <Skeleton variant="text" width="25%" height={24} />
    <Skeleton variant="rectangular" width="100%" height={48} />
    
    <Skeleton variant="text" width="35%" height={24} />
    <Skeleton variant="rectangular" width="100%" height={120} />
    
    <SkeletonRow style={{ marginTop: '24px' }}>
      <Skeleton variant="rectangular" width={120} height={48} />
      <Skeleton variant="rectangular" width={100} height={48} />
    </SkeletonRow>
  </SkeletonContainer>
);

// Table Skeleton
export const TableSkeleton: React.FC<SkeletonScreenProps & { rows?: number; columns?: number }> = ({ 
  className, 
  rows = 5, 
  columns = 4 
}) => (
  <SkeletonContainer className={className}>
    {/* Table Header */}
    <SkeletonRow>
      {[...Array(columns)].map((_, index) => (
        <Skeleton key={index} variant="text" width="100%" height={20} />
      ))}
    </SkeletonRow>
    
    {/* Table Rows */}
    {[...Array(rows)].map((_, rowIndex) => (
      <SkeletonRow key={rowIndex}>
        {[...Array(columns)].map((_, colIndex) => (
          <Skeleton key={colIndex} variant="text" width="100%" height={16} />
        ))}
      </SkeletonRow>
    ))}
  </SkeletonContainer>
);

// Profile Skeleton
export const ProfileSkeleton: React.FC<SkeletonScreenProps> = ({ className }) => (
  <SkeletonContainer className={className}>
    <SkeletonRow>
      <Skeleton variant="circular" width={80} height={80} />
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="40%" height={28} />
        <Skeleton variant="text" width="60%" height={20} />
        <Skeleton variant="text" width="30%" height={16} />
      </div>
    </SkeletonRow>
    
    <div style={{ marginTop: '24px' }}>
      <Skeleton variant="text" width="100%" height={16} />
      <Skeleton variant="text" width="90%" height={16} />
      <Skeleton variant="text" width="70%" height={16} />
    </div>
    
    <SkeletonGrid columns={3} style={{ marginTop: '24px' }}>
      {[...Array(3)].map((_, index) => (
        <SkeletonCard key={index}>
          <Skeleton variant="text" width="60%" height={20} />
          <Skeleton variant="text" width="40%" height={32} />
        </SkeletonCard>
      ))}
    </SkeletonGrid>
  </SkeletonContainer>
);

// Chart Skeleton
export const ChartSkeleton: React.FC<SkeletonScreenProps> = ({ className }) => (
  <SkeletonCard className={className}>
    <Skeleton variant="text" width="30%" height={24} />
    <div style={{ marginTop: '16px' }}>
      <Skeleton variant="rectangular" width="100%" height={200} />
    </div>
    <SkeletonRow style={{ marginTop: '16px' }}>
      <Skeleton variant="rectangular" width={60} height={20} />
      <Skeleton variant="rectangular" width={80} height={20} />
      <Skeleton variant="rectangular" width={70} height={20} />
    </SkeletonRow>
  </SkeletonCard>
);

// Page Skeleton (combines multiple elements)
export const PageSkeleton: React.FC<SkeletonScreenProps> = ({ className }) => (
  <SkeletonContainer 
    className={className}
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.3 }}
  >
    {/* Page Header */}
    <SkeletonRow>
      <div style={{ flex: 1 }}>
        <Skeleton variant="text" width="40%" height={32} />
        <Skeleton variant="text" width="60%" height={20} />
      </div>
      <Skeleton variant="rectangular" width={120} height={40} />
    </SkeletonRow>
    
    {/* Stats Cards */}
    <DashboardStatsSkeleton />
    
    {/* Main Content */}
    <SkeletonGrid columns={2}>
      <ChartSkeleton />
      <OrderListSkeleton />
    </SkeletonGrid>
  </SkeletonContainer>
);