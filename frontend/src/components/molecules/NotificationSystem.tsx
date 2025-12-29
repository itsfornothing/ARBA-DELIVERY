'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';
import { ThemeConfig } from '@/lib/theme';

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  actions?: Array<{
    label: string;
    action: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

interface NotificationContextType {
  notifications: NotificationData[];
  addNotification: (notification: Omit<NotificationData, 'id'>) => string;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Animations
const slideInRight = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOutRight = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

const progressBar = keyframes`
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
`;

const getNotificationStyles = (
  type: NotificationData['type'],
  theme: ThemeConfig
) => {
  const typeStyles = {
    success: css`
      background: linear-gradient(135deg, ${theme.colors.success}15, ${theme.colors.success}08);
      border-left: 4px solid ${theme.colors.success};
      color: ${theme.colors.success};
      
      .notification-icon {
        color: ${theme.colors.success};
      }
    `,
    error: css`
      background: linear-gradient(135deg, ${theme.colors.error}15, ${theme.colors.error}08);
      border-left: 4px solid ${theme.colors.error};
      color: ${theme.colors.error};
      
      .notification-icon {
        color: ${theme.colors.error};
      }
    `,
    warning: css`
      background: linear-gradient(135deg, ${theme.colors.warning}15, ${theme.colors.warning}08);
      border-left: 4px solid ${theme.colors.warning};
      color: ${theme.colors.warning};
      
      .notification-icon {
        color: ${theme.colors.warning};
      }
    `,
    info: css`
      background: linear-gradient(135deg, ${theme.colors.info}15, ${theme.colors.info}08);
      border-left: 4px solid ${theme.colors.info};
      color: ${theme.colors.info};
      
      .notification-icon {
        color: ${theme.colors.info};
      }
    `,
  };

  return typeStyles[type];
};

const NotificationContainer = styled(motion.div)`
  position: fixed;
  top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  right: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  max-width: 400px;
  width: 100%;
  
  @media (max-width: ${({ theme }) => theme.breakpoints.mobile}) {
    top: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
    right: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
    left: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
    max-width: none;
  }
`;

const NotificationCard = styled(motion.div)<{
  $type: NotificationData['type'];
}>`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  background-color: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  
  ${({ $type, theme }) => getNotificationStyles($type, theme)}
`;

const IconContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
`;

const Title = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamily.default};
  font-weight: 600;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text};
  line-height: 1.4;
`;

const Message = styled.div`
  font-family: ${({ theme }) => theme.typography.fontFamily.default};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.4;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  margin-top: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
`;

const ActionButton = styled(motion.button)<{ $variant: 'primary' | 'secondary' }>`
  background: ${({ $variant, theme }) => 
    $variant === 'primary' ? theme.colors.primary : 'transparent'};
  color: ${({ $variant, theme }) => 
    $variant === 'primary' ? 'white' : theme.colors.primary};
  border: 1px solid ${({ theme }) => theme.colors.primary};
  border-radius: ${({ theme }) => theme.borderRadius.small};
  padding: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast}ms;
  
  &:hover {
    background: ${({ $variant, theme }) => 
      $variant === 'primary' ? theme.colors.primary + 'dd' : theme.colors.primary + '10'};
    transform: translateY(-1px);
  }
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  right: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all ${({ theme }) => theme.animations.duration.fast}ms;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.surface};
  }
`;

const ProgressBar = styled.div<{ $duration: number }>`
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  background-color: currentColor;
  opacity: 0.3;
  animation: ${progressBar} ${({ $duration }) => $duration}ms linear;
`;

const getIcon = (type: NotificationData['type']) => {
  const iconProps = { size: 20, className: 'notification-icon' };
  
  switch (type) {
    case 'success':
      return <CheckCircle {...iconProps} />;
    case 'error':
      return <XCircle {...iconProps} />;
    case 'warning':
      return <AlertCircle {...iconProps} />;
    case 'info':
      return <Info {...iconProps} />;
    default:
      return <Info {...iconProps} />;
  }
};

const Notification: React.FC<{
  notification: NotificationData;
  onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
  const { id, type, title, message, duration = 5000, persistent = false, actions } = notification;

  React.useEffect(() => {
    if (!persistent && duration > 0) {
      const timer = setTimeout(() => {
        onRemove(id);
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, persistent, onRemove]);

  return (
    <NotificationCard
      $type={type}
      initial={{ x: 400, opacity: 0, scale: 0.9 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 400, opacity: 0, scale: 0.9 }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 30,
        opacity: { duration: 0.2 }
      }}
      whileHover={{ scale: 1.02 }}
      layout
    >
      <IconContainer>
        {getIcon(type)}
      </IconContainer>
      
      <ContentContainer>
        {title && <Title>{title}</Title>}
        <Message>{message}</Message>
        
        {actions && actions.length > 0 && (
          <ActionsContainer>
            {actions.map((action, index) => (
              <ActionButton
                key={index}
                $variant={action.variant || 'secondary'}
                onClick={action.action}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {action.label}
              </ActionButton>
            ))}
          </ActionsContainer>
        )}
      </ContentContainer>
      
      <CloseButton
        onClick={() => onRemove(id)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X size={16} />
      </CloseButton>
      
      {!persistent && duration > 0 && (
        <ProgressBar $duration={duration} />
      )}
    </NotificationCard>
  );
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [idCounter, setIdCounter] = useState(0);

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = `notification-${Date.now()}-${idCounter}`;
    setIdCounter(prev => prev + 1);
    const newNotification: NotificationData = { ...notification, id };
    
    setNotifications(prev => [...prev, newNotification]);
    
    return id;
  }, [idCounter]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications, 
      addNotification, 
      removeNotification, 
      clearAll 
    }}>
      {children}
      <NotificationContainer>
        <AnimatePresence>
          {notifications.map(notification => (
            <Notification
              key={notification.id}
              notification={notification}
              onRemove={removeNotification}
            />
          ))}
        </AnimatePresence>
      </NotificationContainer>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Convenience hooks for different notification types
export const useNotificationHelpers = () => {
  const { addNotification } = useNotifications();

  return {
    success: (message: string, options?: Partial<Omit<NotificationData, 'id' | 'type' | 'message'>>) =>
      addNotification({ type: 'success', message, ...options }),
    
    error: (message: string, options?: Partial<Omit<NotificationData, 'id' | 'type' | 'message'>>) =>
      addNotification({ type: 'error', message, ...options }),
    
    warning: (message: string, options?: Partial<Omit<NotificationData, 'id' | 'type' | 'message'>>) =>
      addNotification({ type: 'warning', message, ...options }),
    
    info: (message: string, options?: Partial<Omit<NotificationData, 'id' | 'type' | 'message'>>) =>
      addNotification({ type: 'info', message, ...options }),
  };
};