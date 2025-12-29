'use client';

import React from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeConfig } from '@/lib/theme';
import { Typography } from '../atoms/Typography';

interface ToastProps {
  id: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

const getToastStyles = (
  type: ToastProps['type'] = 'info',
  theme: ThemeConfig
) => {
  const typeStyles = {
    success: css`
      background-color: ${theme.colors.success}10;
      border-left: 4px solid ${theme.colors.success};
      color: ${theme.colors.success};
    `,
    error: css`
      background-color: ${theme.colors.error}10;
      border-left: 4px solid ${theme.colors.error};
      color: ${theme.colors.error};
    `,
    warning: css`
      background-color: ${theme.colors.warning}10;
      border-left: 4px solid ${theme.colors.warning};
      color: ${theme.colors.warning};
    `,
    info: css`
      background-color: ${theme.colors.info}10;
      border-left: 4px solid ${theme.colors.info};
      color: ${theme.colors.info};
    `,
  };

  return typeStyles[type];
};

const ToastWrapper = styled(motion.div)<{
  $type: ToastProps['type'];
}>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  min-width: 300px;
  max-width: 500px;
  
  ${({ $type, theme }) => getToastStyles($type, theme)}
`;

const IconContainer = styled.div<{
  $type: ToastProps['type'];
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 2px;
  
  ${({ $type, theme }) => {
    const iconStyles = {
      success: css`background-color: ${theme.colors.success};`,
      error: css`background-color: ${theme.colors.error};`,
      warning: css`background-color: ${theme.colors.warning};`,
      info: css`background-color: ${theme.colors.info};`,
    };
    return iconStyles[$type || 'info'];
  }}
  
  &::after {
    content: '';
    width: 8px;
    height: 8px;
    background-color: white;
    border-radius: 50%;
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  margin-top: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
`;

const ActionButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: background-color ${({ theme }) => theme.animations.duration.fast}ms;
  
  &:hover {
    background-color: currentColor;
    opacity: 0.1;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: color ${({ theme }) => theme.animations.duration.fast}ms;
  flex-shrink: 0;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
  
  &::after {
    content: '×';
    font-size: 18px;
    font-weight: bold;
  }
`;

export const Toast: React.FC<ToastProps> = ({
  id,
  type = 'info',
  title,
  message,
  duration = 5000,
  onClose,
  actions,
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onClose]);

  return (
    <ToastWrapper
      $type={type}
      initial={{ opacity: 0, y: 50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      layout
    >
      <IconContainer $type={type} />
      
      <ContentContainer>
        {title && (
          <Typography variant="caption" weight="semibold" color="primary">
            {title}
          </Typography>
        )}
        
        <Typography variant="caption" color="primary">
          {message}
        </Typography>
        
        {actions && actions.length > 0 && (
          <ActionsContainer>
            {actions.map((action, index) => (
              <ActionButton
                key={index}
                onClick={action.action}
              >
                {action.label}
              </ActionButton>
            ))}
          </ActionsContainer>
        )}
      </ContentContainer>
      
      <CloseButton onClick={() => onClose(id)} />
    </ToastWrapper>
  );
};

// Toast Provider and Hook
interface ToastContextType {
  addToast: (toast: Omit<ToastProps, 'id' | 'onClose'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = React.useCallback((toast: Omit<ToastProps, 'id' | 'onClose'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id, onClose: removeToast }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <ToastPortal>
        <AnimatePresence>
          {toasts.map(toast => (
            <Toast key={toast.id} {...toast} />
          ))}
        </AnimatePresence>
      </ToastPortal>
    </ToastContext.Provider>
  );
};

const ToastPortal = styled.div`
  position: fixed;
  top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  right: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
`;

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export { ToastProvider };