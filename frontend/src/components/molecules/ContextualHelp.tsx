'use client';

import React, { useState } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';
import { fadeIn, slideUp } from '@/lib/theme';

interface ContextualHelpProps {
  context: 'order-creation' | 'user-login' | 'data-loading' | 'file-upload' | 'payment-processing' | 'dashboard' | 'tracking';
  trigger?: 'hover' | 'click' | 'focus' | 'always';
  position?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  helpContent?: {
    title: string;
    description: string;
    steps?: string[];
    tips?: string[];
  };
}

const HelpContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const HelpTrigger = styled.div<{ $trigger: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  cursor: ${({ $trigger }) => $trigger === 'click' ? 'pointer' : 'default'};
`;

const HelpIcon = styled(motion.div)`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: ${({ theme }) => theme.colors.info};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.info}dd;
    transform: scale(1.1);
  }
`;

const HelpPopover = styled(motion.div)<{ $position: string }>`
  position: absolute;
  z-index: 1000;
  width: 300px;
  max-width: 90vw;
  
  ${({ $position }) => {
    switch ($position) {
      case 'top':
        return css`
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
        `;
      case 'bottom':
        return css`
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        `;
      case 'left':
        return css`
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
        `;
      case 'right':
        return css`
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
        `;
      default:
        return css`
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        `;
    }
  }}
`;

const HelpContent = styled.div`
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const StepsList = styled.ol`
  margin: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px 0;
  padding-left: ${({ theme }) => theme.spacing.scale[5] * theme.spacing.unit}px;
  
  li {
    margin-bottom: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
    line-height: 1.5;
  }
`;

const TipsList = styled.ul`
  margin: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px 0;
  padding-left: ${({ theme }) => theme.spacing.scale[5] * theme.spacing.unit}px;
  
  li {
    margin-bottom: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
    line-height: 1.5;
    
    &::marker {
      content: '💡 ';
    }
  }
`;

const CloseButton = styled(Button)`
  position: absolute;
  top: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  right: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  width: 24px;
  height: 24px;
  min-height: 24px;
  padding: 0;
  border-radius: 50%;
`;

const getDefaultHelpContent = (context: string) => {
  const helpMap = {
    'order-creation': {
      title: 'Creating Your Order',
      description: 'Follow these steps to place your delivery order successfully.',
      steps: [
        'Enter your pickup and delivery addresses',
        'Select the type of items you\'re sending',
        'Choose your preferred delivery time',
        'Review and confirm your order details',
        'Complete payment to place your order'
      ],
      tips: [
        'Double-check addresses to avoid delivery delays',
        'Add special instructions for the courier if needed',
        'Save frequently used addresses for faster ordering'
      ]
    },
    'user-login': {
      title: 'Logging In',
      description: 'Access your account to manage orders and track deliveries.',
      steps: [
        'Enter your registered email address',
        'Type your password',
        'Click "Sign In" to access your account'
      ],
      tips: [
        'Use "Remember Me" on trusted devices',
        'Reset your password if you\'ve forgotten it',
        'Enable two-factor authentication for better security'
      ]
    },
    'payment-processing': {
      title: 'Payment Processing',
      description: 'Complete your payment securely to confirm your order.',
      steps: [
        'Review your order total and fees',
        'Select your preferred payment method',
        'Enter payment details if using a new card',
        'Confirm the payment to place your order'
      ],
      tips: [
        'Your payment information is encrypted and secure',
        'Save payment methods for faster checkout',
        'Contact support if payment fails repeatedly'
      ]
    },
    'dashboard': {
      title: 'Dashboard Overview',
      description: 'Your dashboard shows all important information at a glance.',
      steps: [
        'View your recent orders and their status',
        'Check notifications for updates',
        'Access quick actions for common tasks',
        'Review your account settings and preferences'
      ],
      tips: [
        'Bookmark your dashboard for quick access',
        'Enable notifications to stay updated',
        'Use the search function to find specific orders'
      ]
    },
    'tracking': {
      title: 'Order Tracking',
      description: 'Monitor your delivery in real-time from pickup to delivery.',
      steps: [
        'Find your order in the orders list',
        'Click on the order to view tracking details',
        'See the courier\'s location on the map',
        'Get notified when your order is delivered'
      ],
      tips: [
        'Share tracking links with recipients',
        'Contact the courier directly if needed',
        'Rate your delivery experience after completion'
      ]
    },
    'file-upload': {
      title: 'File Upload',
      description: 'Upload files securely for your delivery or account.',
      steps: [
        'Click the upload area or drag files to it',
        'Select files from your device',
        'Wait for the upload to complete',
        'Verify the files were uploaded correctly'
      ],
      tips: [
        'Supported formats: PDF, JPG, PNG, DOC',
        'Maximum file size is 10MB per file',
        'Upload multiple files at once if needed'
      ]
    },
    'data-loading': {
      title: 'Loading Data',
      description: 'Your information is being loaded from our servers.',
      steps: [
        'Wait for the loading process to complete',
        'Refresh the page if loading takes too long',
        'Check your internet connection if issues persist'
      ],
      tips: [
        'Loading times may vary based on your connection',
        'Large amounts of data may take longer to load',
        'Contact support if loading fails repeatedly'
      ]
    }
  };
  
  return helpMap[context as keyof typeof helpMap] || {
    title: 'Help',
    description: 'Get assistance with using this feature.',
    steps: ['Follow the on-screen instructions', 'Contact support if you need help'],
    tips: ['Take your time to read all information carefully']
  };
};

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  context,
  trigger = 'click',
  position = 'bottom',
  children,
  helpContent
}) => {
  const [isVisible, setIsVisible] = useState(trigger === 'always');
  const defaultContent = getDefaultHelpContent(context);
  const content = helpContent || defaultContent;

  const handleTrigger = () => {
    if (trigger === 'click') {
      setIsVisible(!isVisible);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      setIsVisible(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      setIsVisible(false);
    }
  };

  const handleFocus = () => {
    if (trigger === 'focus') {
      setIsVisible(true);
    }
  };

  const handleBlur = () => {
    if (trigger === 'focus') {
      setIsVisible(false);
    }
  };

  return (
    <HelpContainer
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
    >
      <HelpTrigger $trigger={trigger} onClick={handleTrigger}>
        {children}
        <HelpIcon
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          ?
        </HelpIcon>
      </HelpTrigger>

      <AnimatePresence>
        {isVisible && (
          <HelpPopover
            $position={position}
            {...fadeIn()}
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 10 : -10 }}
          >
            <Card variant="elevated" padding="none">
              <HelpContent>
                {trigger !== 'always' && (
                  <CloseButton
                    variant="ghost"
                    size="small"
                    onClick={() => setIsVisible(false)}
                    aria-label="Close help"
                  >
                    ×
                  </CloseButton>
                )}
                
                <Typography variant="h5" color="text" style={{ marginBottom: '8px' }}>
                  {content.title}
                </Typography>
                
                <Typography variant="body" color="muted" style={{ marginBottom: '16px' }}>
                  {content.description}
                </Typography>

                {content.steps && content.steps.length > 0 && (
                  <>
                    <Typography variant="h6" color="text" style={{ marginBottom: '8px' }}>
                      Steps:
                    </Typography>
                    <StepsList>
                      {content.steps.map((step, index) => (
                        <li key={index}>
                          <Typography variant="body" color="text">
                            {step}
                          </Typography>
                        </li>
                      ))}
                    </StepsList>
                  </>
                )}

                {content.tips && content.tips.length > 0 && (
                  <>
                    <Typography variant="h6" color="text" style={{ marginBottom: '8px' }}>
                      Tips:
                    </Typography>
                    <TipsList>
                      {content.tips.map((tip, index) => (
                        <li key={index}>
                          <Typography variant="body" color="text">
                            {tip}
                          </Typography>
                        </li>
                      ))}
                    </TipsList>
                  </>
                )}
              </HelpContent>
            </Card>
          </HelpPopover>
        )}
      </AnimatePresence>
    </HelpContainer>
  );
};