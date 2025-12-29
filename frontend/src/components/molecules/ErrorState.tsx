'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';
import { fadeIn, slideUp } from '@/lib/theme';

interface ErrorStateProps {
  type?: 'network' | 'validation' | 'permission' | 'notFound' | 'server' | 'timeout';
  code?: string;
  context?: 'order-creation' | 'user-login' | 'data-loading' | 'file-upload' | 'payment-processing';
  message?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: () => void;
}

const ErrorContainer = styled(motion.div)`
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

const ErrorIcon = styled(motion.div)<{ $errorType: string }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  font-size: 2.5rem;
  
  ${({ $errorType, theme }) => {
    switch ($errorType) {
      case 'network':
        return css`
          background-color: ${theme.colors.warning}20;
          color: ${theme.colors.warning};
        `;
      case 'validation':
        return css`
          background-color: ${theme.colors.error}20;
          color: ${theme.colors.error};
        `;
      case 'permission':
        return css`
          background-color: ${theme.colors.error}20;
          color: ${theme.colors.error};
        `;
      case 'notFound':
        return css`
          background-color: ${theme.colors.info}20;
          color: ${theme.colors.info};
        `;
      case 'server':
        return css`
          background-color: ${theme.colors.error}20;
          color: ${theme.colors.error};
        `;
      case 'timeout':
        return css`
          background-color: ${theme.colors.warning}20;
          color: ${theme.colors.warning};
        `;
      default:
        return css`
          background-color: ${theme.colors.error}20;
          color: ${theme.colors.error};
        `;
    }
  }}
`;

const MessageContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

const RecoveryContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

const HelpContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  background-color: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  border-left: 4px solid ${({ theme }) => theme.colors.info};
`;

const ActionContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  flex-wrap: wrap;
  justify-content: center;
`;

const getErrorIcon = (type: string): string => {
  switch (type) {
    case 'network':
      return '📡';
    case 'validation':
      return '⚠️';
    case 'permission':
      return '🔒';
    case 'notFound':
      return '🔍';
    case 'server':
      return '🔧';
    case 'timeout':
      return '⏱️';
    default:
      return '❌';
  }
};

const getErrorMessage = (type: string, code?: string, context?: string, customMessage?: string): string => {
  if (customMessage) return customMessage;
  
  const contextMessages = {
    'order-creation': 'creating your order',
    'user-login': 'logging you in',
    'data-loading': 'loading your data',
    'file-upload': 'uploading your file',
    'payment-processing': 'processing your payment'
  };
  
  const contextText = context ? ` while ${contextMessages[context as keyof typeof contextMessages] || 'processing your request'}` : '';
  
  switch (type) {
    case 'network':
      return `We're having trouble connecting to our servers${contextText}. Please check your internet connection and try again.`;
    case 'validation':
      return `There's an issue with the information provided${contextText}. Please check the required fields and try again.`;
    case 'permission':
      return `You don't have permission to access this resource${contextText}. Please contact support if you believe this is an error.`;
    case 'notFound':
      return `The page or resource you're looking for couldn't be found${contextText}. It may have been moved or deleted.`;
    case 'server':
      return `Our servers are experiencing issues${contextText}. Our team has been notified and is working on a fix.`;
    case 'timeout':
      return `The request took too long to complete${contextText}. Please try again in a moment.`;
    default:
      return `Something went wrong${contextText}. Please try again or contact support if the problem persists.`;
  }
};

const getRecoveryInstructions = (type: string, context?: string): string => {
  switch (type) {
    case 'network':
      return 'Check your internet connection and refresh the page. If the problem persists, try again in a few minutes.';
    case 'validation':
      return 'Please check all required fields are filled correctly and meet the specified requirements.';
    case 'permission':
      return 'Contact your administrator or our support team to request access to this resource.';
    case 'notFound':
      return 'Use the search function or navigation menu to find what you\'re looking for, or go back to the previous page.';
    case 'server':
      return 'Our team is working on fixing this issue. Please try again in a few minutes or contact support.';
    case 'timeout':
      return 'The request timed out. Please try again with a stable internet connection.';
    default:
      return 'Try refreshing the page or contact our support team if the issue continues.';
  }
};

const getContextualHelp = (type: string, context?: string): string => {
  if (!context) return '';
  
  const helpMap = {
    'order-creation': {
      network: 'Make sure your delivery address and payment information are saved before retrying.',
      validation: 'Check that your delivery address is complete and your payment method is valid.',
      permission: 'Ensure you\'re logged in and have permission to place orders in this area.',
      default: 'Double-check your order details before submitting again.'
    },
    'user-login': {
      network: 'Your login credentials are secure. Try logging in again when your connection is stable.',
      validation: 'Check your email address and password. Use "Forgot Password" if needed.',
      permission: 'Your account may be temporarily locked. Contact support for assistance.',
      default: 'Make sure you\'re using the correct email and password combination.'
    },
    'file-upload': {
      network: 'Large files may take longer to upload. Ensure you have a stable connection.',
      validation: 'Check that your file is in the correct format and under the size limit.',
      permission: 'You may not have permission to upload files. Contact your administrator.',
      default: 'Try uploading a smaller file or a different format if the issue persists.'
    },
    'payment-processing': {
      network: 'Your payment information is secure. No charges were made during this error.',
      validation: 'Check your payment details including card number, expiry date, and CVV.',
      permission: 'Your payment method may need verification. Contact your bank if needed.',
      default: 'Verify your payment information and try processing the payment again.'
    },
    'data-loading': {
      network: 'Your data is safe. Refresh the page to try loading it again.',
      validation: 'There may be an issue with the data format. Contact support if this continues.',
      permission: 'You may not have access to this data. Check with your administrator.',
      default: 'Try refreshing the page or clearing your browser cache.'
    }
  };
  
  const contextHelp = helpMap[context as keyof typeof helpMap];
  if (contextHelp) {
    return contextHelp[type as keyof typeof contextHelp] || contextHelp.default;
  }
  
  return '';
};

const getActionButtonText = (type: string, context?: string): string => {
  switch (type) {
    case 'network':
      return 'Try Again';
    case 'validation':
      return 'Fix Issues';
    case 'permission':
      return 'Contact Support';
    case 'notFound':
      return 'Go Back';
    case 'server':
      return 'Retry';
    case 'timeout':
      return 'Retry';
    default:
      return 'Try Again';
  }
};

export const ErrorState: React.FC<ErrorStateProps> = ({
  type = 'server',
  code,
  context,
  message,
  onRetry,
  onGoBack,
  onContactSupport
}) => {
  const errorMessage = getErrorMessage(type, code, context, message);
  const recoveryInstructions = getRecoveryInstructions(type, context);
  const contextualHelp = getContextualHelp(type, context);
  const actionButtonText = getActionButtonText(type, context);
  
  const handlePrimaryAction = () => {
    if (type === 'permission' && onContactSupport) {
      onContactSupport();
    } else if (type === 'notFound' && onGoBack) {
      onGoBack();
    } else if (onRetry) {
      onRetry();
    }
  };

  return (
    <Card variant="default" padding="none">
      <ErrorContainer
        data-testid="error-state"
        role="alert"
        aria-live="polite"
        {...fadeIn()}
      >
        <ErrorIcon
          data-testid="error-icon"
          $errorType={type}
          {...slideUp(200)}
        >
          {getErrorIcon(type)}
        </ErrorIcon>
        
        <MessageContainer data-testid="error-message">
          <Typography variant="h3" color="primary" style={{ marginBottom: '16px' }}>
            Oops! Something went wrong
          </Typography>
          <Typography variant="body1" color="muted">
            {errorMessage}
          </Typography>
          {code && (
            <Typography variant="caption" color="muted" style={{ marginTop: '8px', display: 'block' }}>
              Error Code: {code}
            </Typography>
          )}
        </MessageContainer>

        <RecoveryContainer data-testid="error-recovery">
          <Typography variant="body1" color="primary">
            {recoveryInstructions}
          </Typography>
        </RecoveryContainer>

        {contextualHelp && (
          <HelpContainer data-testid="error-help">
            <Typography variant="body1" color="primary">
              💡 {contextualHelp}
            </Typography>
          </HelpContainer>
        )}

        <ActionContainer>
          <Button
            data-testid="error-action"
            variant="primary"
            onClick={handlePrimaryAction}
          >
            {actionButtonText}
          </Button>
          
          {type !== 'notFound' && onGoBack && (
            <Button
              variant="outline"
              onClick={onGoBack}
            >
              Go Back
            </Button>
          )}
          
          {type !== 'permission' && onContactSupport && (
            <Button
              variant="ghost"
              onClick={onContactSupport}
            >
              Contact Support
            </Button>
          )}
        </ActionContainer>
      </ErrorContainer>
    </Card>
  );
};