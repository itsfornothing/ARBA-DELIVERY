'use client';

import React, { useState, useRef, useEffect } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { ThemeConfig } from '@/lib/theme';

// Floating Action Button with micro-interactions
interface FloatingActionButtonProps {
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  size?: 'small' | 'medium' | 'large';
  tooltip?: string;
}

const fabPulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
`;

const FABContainer = styled(motion.button)<{
  $variant: string;
  $size: string;
}>`
  position: fixed;
  bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  right: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: ${({ theme }) => theme.shadows.large};
  z-index: 100;
  
  ${({ $size, theme }) => {
    const sizes = {
      small: css`width: 48px; height: 48px;`,
      medium: css`width: 56px; height: 56px;`,
      large: css`width: 64px; height: 64px;`,
    };
    return sizes[$size as keyof typeof sizes];
  }}
  
  ${({ $variant, theme }) => {
    const variants = {
      primary: css`background: linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.primary}dd);`,
      secondary: css`background: linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.secondary}dd);`,
      success: css`background: linear-gradient(135deg, ${theme.colors.success}, ${theme.colors.success}dd);`,
      danger: css`background: linear-gradient(135deg, ${theme.colors.error}, ${theme.colors.error}dd);`,
    };
    return variants[$variant as keyof typeof variants];
  }}
  
  color: white;
  transition: all ${({ theme }) => theme.animations.duration.normal}ms ${({ theme }) => theme.animations.easing.easeOut};
  
  &:hover {
    transform: scale(1.1);
    box-shadow: ${({ theme }) => theme.shadows.xl};
    animation: ${fabPulse} 1s infinite;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const Tooltip = styled(motion.div)`
  position: absolute;
  right: 100%;
  top: 50%;
  transform: translateY(-50%);
  margin-right: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  background-color: ${({ theme }) => theme.colors.text};
  color: ${({ theme }) => theme.colors.background};
  padding: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
  white-space: nowrap;
  pointer-events: none;
`;

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  icon,
  onClick,
  variant = 'primary',
  size = 'medium',
  tooltip
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <FABContainer
      $variant={variant}
      $size={size}
      onClick={onClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {icon}
      {tooltip && showTooltip && (
        <Tooltip
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 10 }}
        >
          {tooltip}
        </Tooltip>
      )}
    </FABContainer>
  );
};

// Interactive Card with hover effects
interface InteractiveCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  glowEffect?: boolean;
  tiltEffect?: boolean;
}

const CardContainer = styled(motion.div)<{
  $interactive: boolean;
  $glowEffect: boolean;
}>`
  background: ${({ theme }) => theme.colors.background};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.large};
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  cursor: ${({ $interactive }) => $interactive ? 'pointer' : 'default'};
  position: relative;
  overflow: hidden;
  
  ${({ $interactive, theme }) => $interactive && css`
    transition: all ${theme.animations.duration.normal}ms ${theme.animations.easing.easeOut};
    
    &:hover {
      transform: translateY(-4px);
      box-shadow: ${theme.shadows.xl};
      border-color: ${theme.colors.primary}40;
    }
  `}
  
  ${({ $glowEffect, theme }) => $glowEffect && css`
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(45deg, ${theme.colors.primary}20, ${theme.colors.secondary}20);
      opacity: 0;
      transition: opacity ${theme.animations.duration.normal}ms;
      pointer-events: none;
    }
    
    &:hover::before {
      opacity: 1;
    }
  `}
`;

export const InteractiveCard: React.FC<InteractiveCardProps> = ({
  children,
  onClick,
  className,
  glowEffect = false,
  tiltEffect = true
}) => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-100, 100], [30, -30]);
  const rotateY = useTransform(x, [-100, 100], [-30, 30]);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!tiltEffect) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((event.clientX - centerX) / 5);
    y.set((event.clientY - centerY) / 5);
  };

  const handleMouseLeave = () => {
    if (!tiltEffect) return;
    
    x.set(0);
    y.set(0);
  };

  return (
    <CardContainer
      $interactive={Boolean(onClick)}
      $glowEffect={glowEffect}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={tiltEffect ? { rotateX, rotateY } : {}}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {children}
    </CardContainer>
  );
};

// Magnetic Button Effect
interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  strength?: number;
  className?: string;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  onClick,
  strength = 0.3,
  className
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = (e.clientX - centerX) * strength;
    const deltaY = (e.clientY - centerY) * strength;
    
    setPosition({ x: deltaX, y: deltaY });
  };

  const handleMouseLeave = () => {
    setPosition({ x: 0, y: 0 });
  };

  return (
    <motion.button
      ref={ref}
      className={className}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      animate={{ x: position.x, y: position.y }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
      }}
    >
      {children}
    </motion.button>
  );
};

// Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
}

const ProgressContainer = styled.div<{ $size: number }>`
  position: relative;
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
`;

const ProgressText = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: 600;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.text};
`;

export const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 100,
  strokeWidth = 8,
  color,
  backgroundColor,
  showPercentage = true
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <ProgressContainer $size={size}>
      <svg width={size} height={size}>
        <circle
          stroke={backgroundColor || '#e5e7eb'}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <motion.circle
          stroke={color || '#3b82f6'}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          style={{
            transformOrigin: '50% 50%',
            transform: 'rotate(-90deg)',
          }}
        />
      </svg>
      {showPercentage && (
        <ProgressText>
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {Math.round(progress)}%
          </motion.span>
        </ProgressText>
      )}
    </ProgressContainer>
  );
};

// Pulse Dot Indicator
interface PulseDotProps {
  color?: string;
  size?: 'small' | 'medium' | 'large';
  speed?: 'slow' | 'normal' | 'fast';
}

const pulseAnimation = keyframes`
  0% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 currentColor;
  }
  70% {
    transform: scale(1);
    box-shadow: 0 0 0 10px transparent;
  }
  100% {
    transform: scale(0.95);
    box-shadow: 0 0 0 0 transparent;
  }
`;

const PulseDotContainer = styled.div<{
  $color: string;
  $size: string;
  $speed: string;
}>`
  ${({ $size }) => {
    const sizes = {
      small: css`width: 8px; height: 8px;`,
      medium: css`width: 12px; height: 12px;`,
      large: css`width: 16px; height: 16px;`,
    };
    return sizes[$size as keyof typeof sizes];
  }}
  
  background-color: ${({ $color }) => $color};
  border-radius: 50%;
  color: ${({ $color }) => $color};
  
  ${({ $speed }) => {
    const speeds = {
      slow: css`animation: ${pulseAnimation} 3s infinite;`,
      normal: css`animation: ${pulseAnimation} 2s infinite;`,
      fast: css`animation: ${pulseAnimation} 1s infinite;`,
    };
    return speeds[$speed as keyof typeof speeds];
  }}
`;

export const PulseDot: React.FC<PulseDotProps> = ({
  color = '#10b981',
  size = 'medium',
  speed = 'normal'
}) => {
  return (
    <PulseDotContainer
      $color={color}
      $size={size}
      $speed={speed}
    />
  );
};