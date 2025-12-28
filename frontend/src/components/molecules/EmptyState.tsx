'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';
import { fadeIn, slideUp } from '@/lib/theme';

interface EmptyStateProps {
  type?: 'no-orders' | 'no-notifications' | 'no-search-results' | 'no-couriers' | 'no-data';
  title?: string;
  description?: string;
  illustration?: React.ReactNode;
  primaryAction?: {
    text: string;
    onClick: () => void;
  };
  secondaryAction?: {
    text: string;
    onClick: () => void;
  };
  showIllustration?: boolean;
}

const EmptyContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: ${({ theme }) => theme.spacing.scale[8] * theme.spacing.unit}px;
  min-height: 300px;
  max-width: 500px;
  margin: 0 auto;
`;

const IllustrationContainer = styled(motion.div)`
  width: 120px;
  height: 120px;
  margin-bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 4rem;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}10, ${({ theme }) => theme.colors.secondary}10);
  border-radius: 50%;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    inset: -2px;
    border-radius: 50%;
    background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}20, ${({ theme }) => theme.colors.secondary}20);
    z-index: -1;
  }
`;

const ContentContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

const ActionContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  flex-wrap: wrap;
  justify-content: center;
`;

const getDefaultIllustration = (type: string): string => {
  switch (type) {
    case 'no-orders':
      return '📦';
    case 'no-notifications':
      return '🔔';
    case 'no-search-results':
      return '🔍';
    case 'no-couriers':
      return '🚚';
    case 'no-data':
      return '📊';
    default:
      return '📋';
  }
};

const getDefaultTitle = (type: string): string => {
  switch (type) {
    case 'no-orders':
      return 'No orders yet';
    case 'no-notifications':
      return 'No notifications';
    case 'no-search-results':
      return 'No results found';
    case 'no-couriers':
      return 'No couriers available';
    case 'no-data':
      return 'No data available';
    default:
      return 'Nothing here yet';
  }
};

const getDefaultDescription = (type: string): string => {
  switch (type) {
    case 'no-orders':
      return 'When you place your first order, it will appear here. Start by creating a new delivery order.';
    case 'no-notifications':
      return 'You\'re all caught up! New notifications about your orders and account will appear here.';
    case 'no-search-results':
      return 'We couldn\'t find anything matching your search. Try different keywords or check your spelling.';
    case 'no-couriers':
      return 'No couriers are currently available in your area. Please try again later or contact support.';
    case 'no-data':
      return 'There\'s no data to display right now. This could be because you haven\'t started using this feature yet.';
    default:
      return 'This area is empty right now. Check back later or take an action to get started.';
  }
};

const getDefaultPrimaryAction = (type: string): { text: string; action: string } => {
  switch (type) {
    case 'no-orders':
      return { text: 'Create Order', action: 'create-order' };
    case 'no-notifications':
      return { text: 'Refresh', action: 'refresh' };
    case 'no-search-results':
      return { text: 'Clear Search', action: 'clear-search' };
    case 'no-couriers':
      return { text: 'Refresh', action: 'refresh' };
    case 'no-data':
      return { text: 'Get Started', action: 'get-started' };
    default:
      return { text: 'Get Started', action: 'get-started' };
  }
};

const getDefaultSecondaryAction = (type: string): { text: string; action: string } | null => {
  switch (type) {
    case 'no-orders':
      return { text: 'Learn More', action: 'learn-more' };
    case 'no-search-results':
      return { text: 'Browse All', action: 'browse-all' };
    case 'no-couriers':
      return { text: 'Contact Support', action: 'contact-support' };
    case 'no-data':
      return { text: 'Help', action: 'help' };
    default:
      return null;
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'no-data',
  title,
  description,
  illustration,
  primaryAction,
  secondaryAction,
  showIllustration = true
}) => {
  const defaultTitle = getDefaultTitle(type);
  const defaultDescription = getDefaultDescription(type);
  const defaultPrimaryAction = getDefaultPrimaryAction(type);
  const defaultSecondaryAction = getDefaultSecondaryAction(type);
  
  const displayTitle = title || defaultTitle;
  const displayDescription = description || defaultDescription;
  const displayIllustration = illustration || getDefaultIllustration(type);

  return (
    <Card variant="default" padding="none">
      <EmptyContainer
        data-testid="empty-state"
        {...fadeIn()}
      >
        {showIllustration && (
          <IllustrationContainer
            data-testid="empty-illustration"
            {...slideUp(200)}
          >
            {displayIllustration}
          </IllustrationContainer>
        )}
        
        <ContentContainer>
          <Typography 
            variant="h3" 
            color="text" 
            style={{ marginBottom: '16px' }}
            data-testid="empty-title"
          >
            {displayTitle}
          </Typography>
          <Typography 
            variant="body" 
            color="muted"
            data-testid="empty-description"
          >
            {displayDescription}
          </Typography>
        </ContentContainer>

        <ActionContainer>
          <Button
            data-testid="empty-cta"
            variant="primary"
            onClick={primaryAction?.onClick || (() => {})}
          >
            {primaryAction?.text || defaultPrimaryAction.text}
          </Button>
          
          {(secondaryAction || defaultSecondaryAction) && (
            <Button
              variant="outline"
              onClick={secondaryAction?.onClick || (() => {})}
            >
              {secondaryAction?.text || defaultSecondaryAction?.text}
            </Button>
          )}
        </ActionContainer>
      </EmptyContainer>
    </Card>
  );
};