'use client';

import React, { ReactNode } from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useReducedMotion } from '@/lib/accessibility';

interface MotionWrapperProps extends Omit<MotionProps, 'animate' | 'initial' | 'exit'> {
  children: ReactNode;
  animation?: 'fadeIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scaleIn' | 'custom';
  duration?: number;
  delay?: number;
  customAnimation?: {
    initial?: any;
    animate?: any;
    exit?: any;
  };
  fallbackComponent?: 'div' | 'span' | 'section' | 'article';
  className?: string;
}

const animationVariants = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 },
  },
  slideLeft: {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  },
  slideRight: {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  },
};

export const MotionWrapper: React.FC<MotionWrapperProps> = ({
  children,
  animation = 'fadeIn',
  duration = 0.3,
  delay = 0,
  customAnimation,
  fallbackComponent = 'div',
  className,
  ...motionProps
}) => {
  const prefersReducedMotion = useReducedMotion();

  // If user prefers reduced motion, render a static element
  if (prefersReducedMotion) {
    const StaticComponent = fallbackComponent;
    return (
      <StaticComponent className={className}>
        {children}
      </StaticComponent>
    );
  }

  // Get animation configuration
  const animationConfig = customAnimation || (animation === 'custom' ? {} : animationVariants[animation]);
  
  const transitionConfig = {
    duration,
    delay,
  };

  return (
    <motion.div
      initial={animationConfig.initial}
      animate={animationConfig.animate}
      exit={animationConfig.exit}
      transition={transitionConfig}
      className={className}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
};

// Specialized motion components for common use cases
export const FadeIn: React.FC<Omit<MotionWrapperProps, 'animation'>> = (props) => (
  <MotionWrapper animation="fadeIn" {...props} />
);

export const SlideUp: React.FC<Omit<MotionWrapperProps, 'animation'>> = (props) => (
  <MotionWrapper animation="slideUp" {...props} />
);

export const SlideDown: React.FC<Omit<MotionWrapperProps, 'animation'>> = (props) => (
  <MotionWrapper animation="slideDown" {...props} />
);

export const ScaleIn: React.FC<Omit<MotionWrapperProps, 'animation'>> = (props) => (
  <MotionWrapper animation="scaleIn" {...props} />
);

// Hook for getting motion-aware animation props
export const useMotionProps = (
  animationProps: any,
  fallbackProps?: Record<string, any>
) => {
  const prefersReducedMotion = useReducedMotion();
  
  if (prefersReducedMotion) {
    return fallbackProps || {};
  }
  
  return animationProps;
};

// Component for conditional animations
interface ConditionalMotionProps {
  children: ReactNode;
  condition: boolean;
  animatedProps: MotionProps;
  staticProps?: React.HTMLAttributes<HTMLDivElement>;
  component?: keyof React.JSX.IntrinsicElements;
}

export const ConditionalMotion: React.FC<ConditionalMotionProps> = ({
  children,
  condition,
  animatedProps,
  staticProps = {},
  component = 'div',
}) => {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = condition && !prefersReducedMotion;

  if (shouldAnimate) {
    return (
      <motion.div {...animatedProps}>
        {children}
      </motion.div>
    );
  }

  const StaticComponent = component as any;
  return (
    <StaticComponent {...staticProps}>
      {children}
    </StaticComponent>
  );
};