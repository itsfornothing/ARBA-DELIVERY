'use client';

import React, { useEffect, useState } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Trophy, Star, Gift, Sparkles, PartyPopper } from 'lucide-react';
import { ThemeConfig } from '@/lib/theme';

export interface CelebrationData {
  id: string;
  type: 'order_completion' | 'milestone' | 'achievement' | 'first_order' | 'level_up';
  title: string;
  message: string;
  icon?: React.ReactNode;
  duration?: number;
  showConfetti?: boolean;
  showParticles?: boolean;
  celebrationLevel?: 'small' | 'medium' | 'large';
  onComplete?: () => void;
}

interface SuccessCelebrationProps {
  celebration: CelebrationData;
  onDismiss: (id: string) => void;
}

// Confetti animation
const confettiPiece = keyframes`
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
`;

// Particle animation
const particleFloat = keyframes`
  0% {
    transform: translateY(0) scale(0);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100px) scale(1);
    opacity: 0;
  }
`;

// Celebration bounce animation
const celebrationBounce = keyframes`
  0%, 20%, 53%, 80%, 100% {
    transform: translate3d(0, 0, 0);
  }
  40%, 43% {
    transform: translate3d(0, -30px, 0);
  }
  70% {
    transform: translate3d(0, -15px, 0);
  }
  90% {
    transform: translate3d(0, -4px, 0);
  }
`;

// Pulse animation for icons
const iconPulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
`;

// Sparkle animation
const sparkle = keyframes`
  0%, 100% {
    transform: scale(0) rotate(0deg);
    opacity: 0;
  }
  50% {
    transform: scale(1) rotate(180deg);
    opacity: 1;
  }
`;

const CelebrationOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
`;

const CelebrationCard = styled(motion.div)<{ $level: 'small' | 'medium' | 'large' }>`
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.background}, ${({ theme }) => theme.colors.surface});
  border-radius: ${({ theme }) => theme.borderRadius.large};
  box-shadow: ${({ theme }) => theme.shadows.xl};
  border: 2px solid ${({ theme }) => theme.colors.success};
  padding: ${({ theme, $level }) => {
    const multiplier = $level === 'large' ? 8 : $level === 'medium' ? 6 : 4;
    return theme.spacing.scale[multiplier] * theme.spacing.unit;
  }}px;
  text-align: center;
  max-width: ${({ $level }) => $level === 'large' ? '500px' : $level === 'medium' ? '400px' : '300px'};
  width: 90%;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    animation: shimmer 2s infinite;
  }
  
  @keyframes shimmer {
    0% { left: -100%; }
    100% { left: 100%; }
  }
`;

const IconContainer = styled(motion.div)<{ $level: 'small' | 'medium' | 'large' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${({ $level }) => $level === 'large' ? '80px' : $level === 'medium' ? '64px' : '48px'};
  height: ${({ $level }) => $level === 'large' ? '80px' : $level === 'medium' ? '64px' : '48px'};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.success}, ${({ theme }) => theme.colors.success}dd);
  border-radius: ${({ theme }) => theme.borderRadius.full};
  margin: 0 auto ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  color: white;
  animation: ${iconPulse} 2s infinite;
  box-shadow: 0 0 20px ${({ theme }) => theme.colors.success}40;
`;

const Title = styled(motion.h2)<{ $level: 'small' | 'medium' | 'large' }>`
  font-family: ${({ theme }) => theme.typography.fontFamily.default};
  font-size: ${({ $level }) => $level === 'large' ? '2rem' : $level === 'medium' ? '1.5rem' : '1.25rem'};
  font-weight: 700;
  color: ${({ theme }) => theme.colors.text};
  margin: 0 0 ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  animation: ${celebrationBounce} 1s ease-in-out;
`;

const Message = styled(motion.p)`
  font-family: ${({ theme }) => theme.typography.fontFamily.default};
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.muted};
  margin: 0 0 ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  line-height: 1.5;
`;

const DismissButton = styled(motion.button)`
  background: ${({ theme }) => theme.colors.success};
  color: white;
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  padding: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  font-family: ${({ theme }) => theme.typography.fontFamily.default};
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast}ms;
  
  &:hover {
    background: ${({ theme }) => theme.colors.success}dd;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px ${({ theme }) => theme.colors.success}40;
  }
`;

const ConfettiContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  overflow: hidden;
`;

const ConfettiPiece = styled.div<{ $delay: number; $color: string; $left: number }>`
  position: absolute;
  width: 10px;
  height: 10px;
  background: ${({ $color }) => $color};
  left: ${({ $left }) => $left}%;
  animation: ${confettiPiece} 3s linear infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

const ParticleContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

const Particle = styled.div<{ $delay: number; $angle: number; $distance: number }>`
  position: absolute;
  width: 6px;
  height: 6px;
  background: ${({ theme }) => theme.colors.success};
  border-radius: 50%;
  animation: ${particleFloat} 2s ease-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
  transform: rotate(${({ $angle }) => $angle}deg) translateX(${({ $distance }) => $distance}px);
`;

const SparkleContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
`;

const SparkleElement = styled.div<{ $delay: number; $top: number; $left: number }>`
  position: absolute;
  top: ${({ $top }) => $top}%;
  left: ${({ $left }) => $left}%;
  color: ${({ theme }) => theme.colors.warning};
  animation: ${sparkle} 1.5s ease-in-out infinite;
  animation-delay: ${({ $delay }) => $delay}s;
`;

const getDefaultIcon = (type: CelebrationData['type']) => {
  const iconSize = 32;
  
  switch (type) {
    case 'order_completion':
      return <CheckCircle size={iconSize} />;
    case 'milestone':
      return <Trophy size={iconSize} />;
    case 'achievement':
      return <Star size={iconSize} />;
    case 'first_order':
      return <Gift size={iconSize} />;
    case 'level_up':
      return <PartyPopper size={iconSize} />;
    default:
      return <CheckCircle size={iconSize} />;
  }
};

const Confetti: React.FC<{ count?: number }> = ({ count = 50 }) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'];
  
  return (
    <ConfettiContainer>
      {Array.from({ length: count }, (_, i) => (
        <ConfettiPiece
          key={i}
          $delay={Math.random() * 3}
          $color={colors[Math.floor(Math.random() * colors.length)]}
          $left={Math.random() * 100}
        />
      ))}
    </ConfettiContainer>
  );
};

const Particles: React.FC<{ count?: number }> = ({ count = 12 }) => {
  return (
    <ParticleContainer>
      {Array.from({ length: count }, (_, i) => (
        <Particle
          key={i}
          $delay={i * 0.1}
          $angle={(360 / count) * i}
          $distance={60 + Math.random() * 40}
        />
      ))}
    </ParticleContainer>
  );
};

const SparkleEffect: React.FC<{ count?: number }> = ({ count = 8 }) => {
  return (
    <SparkleContainer>
      {Array.from({ length: count }, (_, i) => (
        <SparkleElement
          key={i}
          $delay={Math.random() * 2}
          $top={Math.random() * 100}
          $left={Math.random() * 100}
        >
          <Sparkles size={16} />
        </SparkleElement>
      ))}
    </SparkleContainer>
  );
};

export const SuccessCelebration: React.FC<SuccessCelebrationProps> = ({
  celebration,
  onDismiss,
}) => {
  const {
    id,
    type,
    title,
    message,
    icon,
    duration = 5000,
    showConfetti = true,
    showParticles = true,
    celebrationLevel = 'medium',
    onComplete,
  } = celebration;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onDismiss(id);
        onComplete?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [id, duration, onDismiss, onComplete]);

  const handleDismiss = () => {
    onDismiss(id);
    onComplete?.();
  };

  return (
    <CelebrationOverlay
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <CelebrationCard
        $level={celebrationLevel}
        initial={{ scale: 0.5, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.5, opacity: 0, y: -50 }}
        transition={{ 
          type: 'spring', 
          stiffness: 300, 
          damping: 25,
          opacity: { duration: 0.3 }
        }}
      >
        {showConfetti && <Confetti />}
        {showParticles && <Particles />}
        <SparkleEffect />
        
        <IconContainer
          $level={celebrationLevel}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 400, damping: 15 }}
        >
          {icon || getDefaultIcon(type)}
        </IconContainer>
        
        <Title
          $level={celebrationLevel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          {title}
        </Title>
        
        <Message
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          {message}
        </Message>
        
        <DismissButton
          onClick={handleDismiss}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Continue
        </DismissButton>
      </CelebrationCard>
    </CelebrationOverlay>
  );
};

// Context and Provider for managing celebrations
interface CelebrationContextType {
  celebrations: CelebrationData[];
  addCelebration: (celebration: Omit<CelebrationData, 'id'>) => string;
  removeCelebration: (id: string) => void;
  clearAll: () => void;
}

const CelebrationContext = React.createContext<CelebrationContextType | undefined>(undefined);

export const CelebrationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [celebrations, setCelebrations] = useState<CelebrationData[]>([]);

  const addCelebration = React.useCallback((celebration: Omit<CelebrationData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newCelebration: CelebrationData = { ...celebration, id };
    
    setCelebrations(prev => [...prev, newCelebration]);
    
    return id;
  }, []);

  const removeCelebration = React.useCallback((id: string) => {
    setCelebrations(prev => prev.filter(celebration => celebration.id !== id));
  }, []);

  const clearAll = React.useCallback(() => {
    setCelebrations([]);
  }, []);

  return (
    <CelebrationContext.Provider value={{ 
      celebrations, 
      addCelebration, 
      removeCelebration, 
      clearAll 
    }}>
      {children}
      <AnimatePresence>
        {celebrations.map(celebration => (
          <SuccessCelebration
            key={celebration.id}
            celebration={celebration}
            onDismiss={removeCelebration}
          />
        ))}
      </AnimatePresence>
    </CelebrationContext.Provider>
  );
};

export const useCelebrations = () => {
  const context = React.useContext(CelebrationContext);
  if (context === undefined) {
    throw new Error('useCelebrations must be used within a CelebrationProvider');
  }
  return context;
};

// Convenience hooks for different celebration types
export const useCelebrationHelpers = () => {
  const { addCelebration } = useCelebrations();

  return {
    celebrateOrderCompletion: (title: string, message: string, options?: Partial<Omit<CelebrationData, 'id' | 'type' | 'title' | 'message'>>) =>
      addCelebration({ type: 'order_completion', title, message, celebrationLevel: 'large', ...options }),
    
    celebrateMilestone: (title: string, message: string, options?: Partial<Omit<CelebrationData, 'id' | 'type' | 'title' | 'message'>>) =>
      addCelebration({ type: 'milestone', title, message, celebrationLevel: 'large', ...options }),
    
    celebrateAchievement: (title: string, message: string, options?: Partial<Omit<CelebrationData, 'id' | 'type' | 'title' | 'message'>>) =>
      addCelebration({ type: 'achievement', title, message, celebrationLevel: 'medium', ...options }),
    
    celebrateFirstOrder: (title: string, message: string, options?: Partial<Omit<CelebrationData, 'id' | 'type' | 'title' | 'message'>>) =>
      addCelebration({ type: 'first_order', title, message, celebrationLevel: 'large', showConfetti: true, ...options }),
    
    celebrateLevelUp: (title: string, message: string, options?: Partial<Omit<CelebrationData, 'id' | 'type' | 'title' | 'message'>>) =>
      addCelebration({ type: 'level_up', title, message, celebrationLevel: 'large', ...options }),
  };
};