'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, 
  ChevronLeft, 
  X, 
  Target, 
  Lightbulb,
  CheckCircle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';

export interface TourStep {
  id: string;
  target: string; // CSS selector for the element to highlight
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
  beforeShow?: () => void;
  afterShow?: () => void;
  skipable?: boolean;
  highlightPadding?: number;
}

export interface GuidedTourProps {
  steps: TourStep[];
  isActive: boolean;
  onComplete: () => void;
  onSkip?: () => void;
  onStepChange?: (stepIndex: number) => void;
  showProgress?: boolean;
  showSkipAll?: boolean;
  tourId: string;
}

// Animations
const pulseAnimation = keyframes`
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
  }
`;

const spotlightAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
  }
`;

const TourOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  pointer-events: none;
`;

const TourBackdrop = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
`;

const TourSpotlight = styled(motion.div)<{ 
  $x: number; 
  $y: number; 
  $width: number; 
  $height: number; 
  $padding: number;
}>`
  position: absolute;
  left: ${({ $x, $padding }) => $x - $padding}px;
  top: ${({ $y, $padding }) => $y - $padding}px;
  width: ${({ $width, $padding }) => $width + ($padding * 2)}px;
  height: ${({ $height, $padding }) => $height + ($padding * 2)}px;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.7);
  animation: ${spotlightAnimation} 2s infinite;
  pointer-events: none;
`;

const TourTooltip = styled(motion.div)<{ 
  $x: number; 
  $y: number; 
  $placement: string;
}>`
  position: absolute;
  pointer-events: auto;
  z-index: 10000;
  max-width: 400px;
  min-width: 300px;
  
  ${({ $placement, $x, $y }) => {
    switch ($placement) {
      case 'top':
        return `
          left: ${$x}px;
          bottom: calc(100vh - ${$y}px + 20px);
          transform: translateX(-50%);
        `;
      case 'bottom':
        return `
          left: ${$x}px;
          top: ${$y + 20}px;
          transform: translateX(-50%);
        `;
      case 'left':
        return `
          right: calc(100vw - ${$x}px + 20px);
          top: ${$y}px;
          transform: translateY(-50%);
        `;
      case 'right':
        return `
          left: ${$x + 20}px;
          top: ${$y}px;
          transform: translateY(-50%);
        `;
      case 'center':
        return `
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        `;
      default:
        return `
          left: ${$x}px;
          top: ${$y + 20}px;
          transform: translateX(-50%);
        `;
    }
  }}
`;

const TooltipContent = styled.div`
  padding: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

const TooltipHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const TooltipIcon = styled.div`
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.secondary});
  border-radius: ${({ theme }) => theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-right: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  flex-shrink: 0;
`;

const TooltipTitle = styled(Typography)`
  flex: 1;
  margin: 0;
  line-height: 1.3;
`;

const CloseButton = styled(motion.button)`
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

const TooltipBody = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

const TooltipFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  color: ${({ theme }) => theme.colors.muted};
  font-size: 0.875rem;
`;

const ProgressDots = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
`;

const ProgressDot = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $active, $completed, theme }) => {
    if ($completed) return theme.colors.success;
    if ($active) return theme.colors.primary;
    return theme.colors.border;
  }};
  transition: all ${({ theme }) => theme.animations.duration.fast}ms;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
`;

export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  isActive,
  onComplete,
  onSkip,
  onStepChange,
  showProgress = true,
  showSkipAll = true,
  tourId,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetElement, setTargetElement] = useState<Element | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const observerRef = useRef<MutationObserver | null>(null);

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;

  // Find and observe target element
  const updateTargetElement = useCallback(() => {
    if (!currentStep || !isActive) return;

    const element = document.querySelector(currentStep.target);
    if (element) {
      setTargetElement(element);
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Calculate tooltip position based on placement
      let x = 0, y = 0;
      const padding = currentStep.highlightPadding || 8;

      switch (currentStep.placement) {
        case 'top':
          x = rect.left + rect.width / 2;
          y = rect.top - padding;
          break;
        case 'bottom':
          x = rect.left + rect.width / 2;
          y = rect.bottom + padding;
          break;
        case 'left':
          x = rect.left - padding;
          y = rect.top + rect.height / 2;
          break;
        case 'right':
          x = rect.right + padding;
          y = rect.top + rect.height / 2;
          break;
        case 'center':
          x = window.innerWidth / 2;
          y = window.innerHeight / 2;
          break;
        default:
          x = rect.left + rect.width / 2;
          y = rect.bottom + padding;
      }

      setTooltipPosition({ x, y });

      // Scroll element into view if needed
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center'
      });
    } else {
      setTargetElement(null);
      setTargetRect(null);
    }
  }, [currentStep, isActive]);

  // Set up mutation observer to watch for DOM changes
  useEffect(() => {
    if (!isActive) return;

    updateTargetElement();

    // Create observer to watch for DOM changes
    observerRef.current = new MutationObserver(() => {
      updateTargetElement();
    });

    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Also listen for resize events
    const handleResize = () => updateTargetElement();
    window.addEventListener('resize', handleResize);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [updateTargetElement, isActive]);

  // Execute step lifecycle hooks
  useEffect(() => {
    if (!currentStep || !isActive) return;

    if (currentStep.beforeShow) {
      currentStep.beforeShow();
    }

    const timer = setTimeout(() => {
      if (currentStep.afterShow) {
        currentStep.afterShow();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [currentStep, isActive]);

  // Handle step change
  useEffect(() => {
    if (onStepChange) {
      onStepChange(currentStepIndex);
    }
  }, [currentStepIndex, onStepChange]);

  const handleNext = () => {
    if (currentStep?.action) {
      currentStep.action.onClick();
    }

    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      onComplete();
    }
  };

  const handleClose = () => {
    onComplete();
  };

  if (!isActive || !currentStep) return null;

  return (
    <TourOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <TourBackdrop />
      
      {targetRect && currentStep.placement !== 'center' && (
        <TourSpotlight
          $x={targetRect.left}
          $y={targetRect.top}
          $width={targetRect.width}
          $height={targetRect.height}
          $padding={currentStep.highlightPadding || 8}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      )}

      <TourTooltip
        $x={tooltipPosition.x}
        $y={tooltipPosition.y}
        $placement={currentStep.placement || 'bottom'}
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <Card variant="elevated" padding="none">
          <TooltipContent>
            <TooltipHeader>
              <TooltipIcon>
                <Target size={20} />
              </TooltipIcon>
              <TooltipTitle variant="h5" color="text">
                {currentStep.title}
              </TooltipTitle>
              <CloseButton
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={18} />
              </CloseButton>
            </TooltipHeader>

            <TooltipBody>
              <Typography variant="body" color="muted">
                {currentStep.content}
              </Typography>
            </TooltipBody>

            <TooltipFooter>
              <div>
                {showProgress && (
                  <ProgressIndicator>
                    <ProgressDots>
                      {steps.map((_, index) => (
                        <ProgressDot
                          key={index}
                          $active={index === currentStepIndex}
                          $completed={index < currentStepIndex}
                        />
                      ))}
                    </ProgressDots>
                    <span>{currentStepIndex + 1} of {steps.length}</span>
                  </ProgressIndicator>
                )}
              </div>

              <ActionButtons>
                {!isFirstStep && (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </Button>
                )}

                {showSkipAll && currentStep.skipable && (
                  <Button
                    variant="outline"
                    size="small"
                    onClick={handleSkip}
                  >
                    Skip Tour
                  </Button>
                )}

                <Button
                  variant="primary"
                  size="small"
                  onClick={handleNext}
                >
                  {currentStep.action?.label || (isLastStep ? 'Finish' : 'Next')}
                  {!isLastStep && <ChevronRight size={16} />}
                  {isLastStep && <CheckCircle size={16} />}
                </Button>
              </ActionButtons>
            </TooltipFooter>
          </TooltipContent>
        </Card>
      </TourTooltip>
    </TourOverlay>
  );
};

// Hook for managing guided tour state
export const useGuidedTour = (tourId: string) => {
  const [isActive, setIsActive] = useState(false);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);

  useEffect(() => {
    // Check if user has completed this specific tour
    const completed = localStorage.getItem(`tour_completed_${tourId}`) === 'true';
    setHasCompletedTour(completed);
  }, [tourId]);

  const startTour = () => {
    setIsActive(true);
  };

  const completeTour = () => {
    setIsActive(false);
    setHasCompletedTour(true);
    localStorage.setItem(`tour_completed_${tourId}`, 'true');
  };

  const skipTour = () => {
    setIsActive(false);
    setHasCompletedTour(true);
    localStorage.setItem(`tour_completed_${tourId}`, 'true');
  };

  const resetTour = () => {
    setHasCompletedTour(false);
    localStorage.removeItem(`tour_completed_${tourId}`);
  };

  return {
    isActive,
    hasCompletedTour,
    startTour,
    completeTour,
    skipTour,
    resetTour,
  };
};