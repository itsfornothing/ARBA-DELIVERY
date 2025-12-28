'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, X, Check, Sparkles } from 'lucide-react';
import { ThemeConfig } from '@/lib/theme';

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  skipable?: boolean;
}

export interface OnboardingFlowProps {
  steps: OnboardingStep[];
  isVisible: boolean;
  onComplete: () => void;
  onSkip?: () => void;
  showProgress?: boolean;
  celebrateCompletion?: boolean;
}

// Animations
const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(-100%);
    opacity: 0;
  }
`;

const progressFill = keyframes`
  from {
    width: 0%;
  }
  to {
    width: var(--progress-width);
  }
`;

const celebrationPulse = keyframes`
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
`;

const OnboardingOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const OnboardingCard = styled(motion.div)`
  background: ${({ theme }) => theme.colors.background};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  border: 1px solid ${({ theme }) => theme.colors.border};
  max-width: 500px;
  width: 100%;
  max-height: 80vh;
  overflow: hidden;
  position: relative;
`;

const OnboardingHeader = styled.div`
  padding: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  position: relative;
`;

const CloseButton = styled(motion.button)`
  position: absolute;
  top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  right: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  background: none;
  border: none;
  color: ${({ theme }) => theme.colors.muted};
  cursor: pointer;
  padding: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  transition: all ${({ theme }) => theme.animations.duration.fast}ms;
  
  &:hover {
    color: ${({ theme }) => theme.colors.text};
    background-color: ${({ theme }) => theme.colors.surface};
  }
`;

const ProgressContainer = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  margin-bottom: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const ProgressBar = styled.div`
  flex: 1;
  height: 4px;
  background: ${({ theme }) => theme.colors.surface};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  overflow: hidden;
  position: relative;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.secondary});
  border-radius: ${({ theme }) => theme.borderRadius.full};
  width: ${({ $progress }) => $progress}%;
  transition: width ${({ theme }) => theme.animations.duration.normal}ms ${({ theme }) => theme.animations.easing.easeOut};
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    right: 0;
    width: 20px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3));
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    0% { transform: translateX(-20px); }
    100% { transform: translateX(20px); }
  }
`;

const ProgressText = styled.span`
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.muted};
  font-weight: 500;
  min-width: 60px;
  text-align: right;
`;

const StepTitle = styled(motion.h2)`
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 1.5rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0;
  line-height: 1.3;
`;

const OnboardingContent = styled.div`
  padding: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  min-height: 200px;
  display: flex;
  flex-direction: column;
`;

const StepIconContainer = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.primary}, ${({ theme }) => theme.colors.secondary});
  border-radius: ${({ theme }) => theme.borderRadius.full};
  margin: 0 auto ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  color: white;
  box-shadow: 0 4px 20px ${({ theme }) => theme.colors.primary}40;
`;

const StepDescription = styled(motion.p)`
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.6;
  margin: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px 0;
  text-align: center;
`;

const StepContentContainer = styled(motion.div)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px 0;
`;

const OnboardingFooter = styled.div`
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
`;

const FooterButton = styled(motion.button)<{ $variant: 'primary' | 'secondary' | 'ghost' }>`
  background: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`;
      case 'secondary':
        return theme.colors.surface;
      case 'ghost':
        return 'transparent';
      default:
        return theme.colors.primary;
    }
  }};
  color: ${({ $variant, theme }) => {
    switch ($variant) {
      case 'primary':
        return 'white';
      case 'secondary':
        return theme.colors.text;
      case 'ghost':
        return theme.colors.muted;
      default:
        return 'white';
    }
  }};
  border: ${({ $variant, theme }) => 
    $variant === 'secondary' ? `1px solid ${theme.colors.border}` : 'none'};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast}ms;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: ${({ $variant, theme }) => 
      $variant === 'primary' ? `0 4px 12px ${theme.colors.primary}40` : theme.shadows.medium};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

const CompletionCelebration = styled(motion.div)`
  text-align: center;
  padding: ${({ theme }) => theme.spacing.scale[8] * theme.spacing.unit}px;
`;

const CelebrationIcon = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.success}, ${({ theme }) => theme.colors.success}dd);
  border-radius: ${({ theme }) => theme.borderRadius.full};
  margin: 0 auto ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  color: white;
  ${css`animation: ${celebrationPulse} 2s infinite;`}
  box-shadow: 0 0 30px ${({ theme }) => theme.colors.success}40;
`;

const CelebrationTitle = styled(motion.h2)`
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 1.75rem;
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
`;

const CelebrationMessage = styled(motion.p)`
  font-family: ${({ theme }) => theme.typography.fontFamily};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.muted};
  line-height: 1.6;
  margin: 0 0 ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  steps,
  isVisible,
  onComplete,
  onSkip,
  showProgress = true,
  celebrateCompletion = true,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');

  const currentStep = steps[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep?.action) {
      currentStep.action.onClick();
    }
    
    if (isLastStep) {
      if (celebrateCompletion) {
        setIsCompleted(true);
        setTimeout(() => {
          onComplete();
        }, 3000);
      } else {
        onComplete();
      }
    } else {
      setDirection('forward');
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setDirection('backward');
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

  if (!isVisible) return null;

  const slideVariants = {
    enter: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: 'forward' | 'backward') => ({
      x: direction === 'forward' ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <OnboardingOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <OnboardingCard
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        {!isCompleted ? (
          <>
            <OnboardingHeader>
              <CloseButton
                onClick={handleClose}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </CloseButton>
              
              {showProgress && (
                <ProgressContainer>
                  <ProgressBar>
                    <ProgressFill $progress={progress} />
                  </ProgressBar>
                  <ProgressText>
                    {currentStepIndex + 1} of {steps.length}
                  </ProgressText>
                </ProgressContainer>
              )}
              
              <StepTitle
                key={`title-${currentStepIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {currentStep?.title}
              </StepTitle>
            </OnboardingHeader>

            <OnboardingContent>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStepIndex}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {currentStep?.icon && (
                    <StepIconContainer
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      {currentStep.icon}
                    </StepIconContainer>
                  )}
                  
                  <StepDescription
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    {currentStep?.description}
                  </StepDescription>
                  
                  {currentStep?.content && (
                    <StepContentContainer
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                    >
                      {currentStep.content}
                    </StepContentContainer>
                  )}
                </motion.div>
              </AnimatePresence>
            </OnboardingContent>

            <OnboardingFooter>
              <div>
                {!isFirstStep && (
                  <FooterButton
                    $variant="ghost"
                    onClick={handlePrevious}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </FooterButton>
                )}
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                {currentStep?.skipable && (
                  <FooterButton
                    $variant="secondary"
                    onClick={handleSkip}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Skip
                  </FooterButton>
                )}
                
                <FooterButton
                  $variant="primary"
                  onClick={handleNext}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {currentStep?.action?.label || (isLastStep ? 'Complete' : 'Next')}
                  {!isLastStep && <ChevronRight size={16} />}
                </FooterButton>
              </div>
            </OnboardingFooter>
          </>
        ) : (
          <CompletionCelebration>
            <CelebrationIcon
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            >
              <Check size={40} />
            </CelebrationIcon>
            
            <CelebrationTitle
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              🎉 Welcome aboard!
            </CelebrationTitle>
            
            <CelebrationMessage
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              You're all set up and ready to start using our delivery platform. 
              Let's get your first order started!
            </CelebrationMessage>
            
            <FooterButton
              $variant="primary"
              onClick={onComplete}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Sparkles size={16} />
              Get Started
            </FooterButton>
          </CompletionCelebration>
        )}
      </OnboardingCard>
    </OnboardingOverlay>
  );
};

// Hook for managing onboarding state
export const useOnboarding = () => {
  const [isOnboardingVisible, setIsOnboardingVisible] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // Check if user has completed onboarding (from localStorage or API)
    const completed = localStorage.getItem('onboarding_completed') === 'true';
    setHasCompletedOnboarding(completed);
    
    // Show onboarding for new users
    if (!completed) {
      const timer = setTimeout(() => {
        setIsOnboardingVisible(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const startOnboarding = () => {
    setIsOnboardingVisible(true);
  };

  const completeOnboarding = () => {
    setIsOnboardingVisible(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboarding_completed', 'true');
  };

  const skipOnboarding = () => {
    setIsOnboardingVisible(false);
    setHasCompletedOnboarding(true);
    localStorage.setItem('onboarding_completed', 'true');
  };

  return {
    isOnboardingVisible,
    hasCompletedOnboarding,
    startOnboarding,
    completeOnboarding,
    skipOnboarding,
  };
};