'use client';

import React, { useState, useEffect, useRef } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  X, 
  Info, 
  Star, 
  Zap, 
  Target,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';

export interface FeatureTooltipProps {
  id: string;
  target: string; // CSS selector for the element to attach to
  title: string;
  content: string;
  type?: 'info' | 'tip' | 'warning' | 'success' | 'feature';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  showOnce?: boolean;
  delay?: number;
  persistent?: boolean;
  showCloseButton?: boolean;
  onShow?: () => void;
  onHide?: () => void;
  onDismiss?: () => void;
  children?: React.ReactNode;
}

const TooltipContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const TooltipOverlay = styled(motion.div)<{ 
  $placement: string;
  $targetRect: DOMRect | null;
}>`
  position: fixed;
  z-index: 9998;
  pointer-events: auto;
  max-width: 320px;
  min-width: 250px;
  
  ${({ $placement, $targetRect }) => {
    if (!$targetRect) return '';
    
    const { left, top, right, bottom, width, height } = $targetRect;
    const margin = 12;
    
    switch ($placement) {
      case 'top':
        return css`
          left: ${left + width / 2}px;
          bottom: ${window.innerHeight - top + margin}px;
          transform: translateX(-50%);
        `;
      case 'bottom':
        return css`
          left: ${left + width / 2}px;
          top: ${bottom + margin}px;
          transform: translateX(-50%);
        `;
      case 'left':
        return css`
          right: ${window.innerWidth - left + margin}px;
          top: ${top + height / 2}px;
          transform: translateY(-50%);
        `;
      case 'right':
        return css`
          left: ${right + margin}px;
          top: ${top + height / 2}px;
          transform: translateY(-50%);
        `;
      default:
        return css`
          left: ${left + width / 2}px;
          top: ${bottom + margin}px;
          transform: translateX(-50%);
        `;
    }
  }}
`;

const TooltipArrow = styled.div<{ $placement: string; $type: string }>`
  position: absolute;
  width: 0;
  height: 0;
  border-style: solid;
  
  ${({ $placement, $type, theme }) => {
    const getColor = () => {
      switch ($type) {
        case 'tip': return theme.colors.info;
        case 'warning': return theme.colors.warning;
        case 'success': return theme.colors.success;
        case 'feature': return theme.colors.primary;
        default: return theme.colors.surface;
      }
    };
    
    const color = getColor();
    const size = 8;
    
    switch ($placement) {
      case 'top':
        return css`
          bottom: -${size}px;
          left: 50%;
          transform: translateX(-50%);
          border-left: ${size}px solid transparent;
          border-right: ${size}px solid transparent;
          border-top: ${size}px solid ${color};
        `;
      case 'bottom':
        return css`
          top: -${size}px;
          left: 50%;
          transform: translateX(-50%);
          border-left: ${size}px solid transparent;
          border-right: ${size}px solid transparent;
          border-bottom: ${size}px solid ${color};
        `;
      case 'left':
        return css`
          right: -${size}px;
          top: 50%;
          transform: translateY(-50%);
          border-top: ${size}px solid transparent;
          border-bottom: ${size}px solid transparent;
          border-left: ${size}px solid ${color};
        `;
      case 'right':
        return css`
          left: -${size}px;
          top: 50%;
          transform: translateY(-50%);
          border-top: ${size}px solid transparent;
          border-bottom: ${size}px solid transparent;
          border-right: ${size}px solid ${color};
        `;
      default:
        return css`
          top: -${size}px;
          left: 50%;
          transform: translateX(-50%);
          border-left: ${size}px solid transparent;
          border-right: ${size}px solid transparent;
          border-bottom: ${size}px solid ${color};
        `;
    }
  }}
`;

const TooltipContent = styled.div<{ $type: string }>`
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'tip': return `linear-gradient(135deg, ${theme.colors.info}15, ${theme.colors.info}05)`;
      case 'warning': return `linear-gradient(135deg, ${theme.colors.warning}15, ${theme.colors.warning}05)`;
      case 'success': return `linear-gradient(135deg, ${theme.colors.success}15, ${theme.colors.success}05)`;
      case 'feature': return `linear-gradient(135deg, ${theme.colors.primary}15, ${theme.colors.primary}05)`;
      default: return theme.colors.surface;
    }
  }};
  border: 1px solid ${({ $type, theme }) => {
    switch ($type) {
      case 'tip': return `${theme.colors.info}30`;
      case 'warning': return `${theme.colors.warning}30`;
      case 'success': return `${theme.colors.success}30`;
      case 'feature': return `${theme.colors.primary}30`;
      default: return theme.colors.border;
    }
  }};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: ${({ theme }) => theme.shadows.large};
  backdrop-filter: blur(8px);
  position: relative;
`;

const TooltipHeader = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  margin-bottom: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
`;

const TooltipIcon = styled.div<{ $type: string }>`
  width: 32px;
  height: 32px;
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: ${({ $type, theme }) => {
    switch ($type) {
      case 'tip': return theme.colors.info;
      case 'warning': return theme.colors.warning;
      case 'success': return theme.colors.success;
      case 'feature': return theme.colors.primary;
      default: return theme.colors.muted;
    }
  }};
  color: white;
`;

const TooltipTitle = styled(Typography)`
  flex: 1;
  margin: 0;
  font-weight: 600;
`;

const CloseButton = styled(motion.button)`
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all ${({ theme }) => theme.animations.duration.fast}ms;
  flex-shrink: 0;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.surface};
  }
`;

const TooltipBody = styled.div`
  line-height: 1.5;
`;

const getTooltipIcon = (type: string) => {
  switch (type) {
    case 'tip': return Lightbulb;
    case 'warning': return AlertCircle;
    case 'success': return CheckCircle;
    case 'feature': return Star;
    default: return Info;
  }
};

export const FeatureTooltip: React.FC<FeatureTooltipProps> = ({
  id,
  target,
  title,
  content,
  type = 'info',
  placement = 'auto',
  trigger = 'hover',
  showOnce = false,
  delay = 0,
  persistent = false,
  showCloseButton = true,
  onShow,
  onHide,
  onDismiss,
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [actualPlacement, setActualPlacement] = useState(placement);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownRef = useRef(false);

  // Check if tooltip has been shown before
  useEffect(() => {
    if (showOnce) {
      const hasShown = localStorage.getItem(`tooltip_shown_${id}`) === 'true';
      hasShownRef.current = hasShown;
    }
  }, [id, showOnce]);

  // Find target element and set up event listeners
  useEffect(() => {
    const element = document.querySelector(target);
    if (!element) return;

    setTargetElement(element);
    updateTargetRect(element);

    const handleMouseEnter = () => {
      if (trigger === 'hover' && !hasShownRef.current) {
        showTooltip();
      }
    };

    const handleMouseLeave = () => {
      if (trigger === 'hover' && !persistent) {
        hideTooltip();
      }
    };

    const handleClick = () => {
      if (trigger === 'click' && !hasShownRef.current) {
        showTooltip();
      }
    };

    const handleFocus = () => {
      if (trigger === 'focus' && !hasShownRef.current) {
        showTooltip();
      }
    };

    const handleBlur = () => {
      if (trigger === 'focus' && !persistent) {
        hideTooltip();
      }
    };

    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('click', handleClick);
    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);

    return () => {
      element.removeEventListener('mouseenter', handleMouseEnter);
      element.removeEventListener('mouseleave', handleMouseLeave);
      element.removeEventListener('click', handleClick);
      element.removeEventListener('focus', handleFocus);
      element.removeEventListener('blur', handleBlur);
    };
  }, [target, trigger, persistent]);

  // Update target rect on resize
  useEffect(() => {
    const handleResize = () => {
      if (targetElement) {
        updateTargetRect(targetElement);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [targetElement]);

  const updateTargetRect = (element: Element) => {
    const rect = element.getBoundingClientRect();
    setTargetRect(rect);
    
    // Auto-calculate best placement
    if (placement === 'auto') {
      const spaceTop = rect.top;
      const spaceBottom = window.innerHeight - rect.bottom;
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      
      const maxSpace = Math.max(spaceTop, spaceBottom, spaceLeft, spaceRight);
      
      if (maxSpace === spaceBottom) setActualPlacement('bottom');
      else if (maxSpace === spaceTop) setActualPlacement('top');
      else if (maxSpace === spaceRight) setActualPlacement('right');
      else setActualPlacement('left');
    } else {
      setActualPlacement(placement);
    }
  };

  const showTooltip = () => {
    if (showOnce && hasShownRef.current) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
      if (onShow) onShow();
      
      if (showOnce) {
        hasShownRef.current = true;
        localStorage.setItem(`tooltip_shown_${id}`, 'true');
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    setIsVisible(false);
    if (onHide) onHide();
  };

  const handleDismiss = () => {
    hideTooltip();
    if (onDismiss) onDismiss();
    
    if (showOnce) {
      hasShownRef.current = true;
      localStorage.setItem(`tooltip_shown_${id}`, 'true');
    }
  };

  // Manual show method for programmatic control
  const show = () => showTooltip();
  const hide = () => hideTooltip();

  const IconComponent = getTooltipIcon(type);

  return (
    <>
      {children}
      <AnimatePresence>
        {isVisible && targetRect && (
          <TooltipOverlay
            $placement={actualPlacement}
            $targetRect={targetRect}
            initial={{ opacity: 0, scale: 0.95, y: actualPlacement === 'top' ? 10 : -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: actualPlacement === 'top' ? 10 : -10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <TooltipContent $type={type}>
              <TooltipArrow $placement={actualPlacement} $type={type} />
              
              <TooltipHeader>
                <TooltipIcon $type={type}>
                  <IconComponent size={16} />
                </TooltipIcon>
                
                <TooltipTitle variant="body1" color="primary">
                  {title}
                </TooltipTitle>
                
                {showCloseButton && (
                  <CloseButton
                    onClick={handleDismiss}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X size={14} />
                  </CloseButton>
                )}
              </TooltipHeader>

              <TooltipBody>
                <Typography variant="body1" color="muted" style={{ fontSize: '0.875rem' }}>
                  {content}
                </Typography>
              </TooltipBody>
            </TooltipContent>
          </TooltipOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

// Hook for managing multiple feature tooltips
export const useFeatureTooltips = () => {
  const [activeTooltips, setActiveTooltips] = useState<Set<string>>(new Set());

  const showTooltip = (id: string) => {
    setActiveTooltips(prev => new Set(prev).add(id));
  };

  const hideTooltip = (id: string) => {
    setActiveTooltips(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  };

  const hideAllTooltips = () => {
    setActiveTooltips(new Set());
  };

  const isTooltipActive = (id: string) => {
    return activeTooltips.has(id);
  };

  return {
    activeTooltips,
    showTooltip,
    hideTooltip,
    hideAllTooltips,
    isTooltipActive,
  };
};