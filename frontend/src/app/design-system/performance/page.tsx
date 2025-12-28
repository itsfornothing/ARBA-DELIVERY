'use client';

import React, { useRef, useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { usePageTransition } from '@/lib/pageTransitions';
import { useGestures } from '@/lib/gestureSupport';
import { initializeOptimizations, useLazyComponent } from '@/lib/bundleOptimization';
import { PerformanceDashboard } from '@/components/molecules/PerformanceDashboard';
import { Card } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Container } from '@/components/atoms/Container';

const PageContainer = styled(Container)`
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const DemoSection = styled(Card)`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const GestureArea = styled(motion.div)`
  width: 100%;
  height: 200px;
  background: linear-gradient(135deg, #3b82f6, #6366f1);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
  user-select: none;
  touch-action: manipulation;
`;

const TransitionDemo = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const TransitionCard = styled(motion.div)`
  padding: 1.5rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  text-align: center;
  
  &:hover {
    border-color: #3b82f6;
  }
`;

const LazyComponentDemo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
`;

const PerformanceMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin: 1rem 0;
`;

const MetricBox = styled.div`
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  text-align: center;
`;

// Lazy loaded component for demonstration
const LazyHeavyComponent = React.lazy(() => 
  new Promise<{ default: React.ComponentType<any> }>(resolve => {
    // Simulate heavy component loading
    setTimeout(() => {
      resolve({
        default: () => (
          <Card style={{ padding: '2rem', textAlign: 'center' }}>
            <Typography variant="h3">Heavy Component Loaded!</Typography>
            <Typography>This component was loaded lazily to improve performance.</Typography>
          </Card>
        )
      });
    }, 2000);
  })
);

export default function PerformancePage() {
  const gestureAreaRef = useRef<HTMLDivElement>(null);
  const [gestureInfo, setGestureInfo] = useState<string>('Try swiping, pinching, or long-pressing!');
  const [lazyComponentVisible, setLazyComponentVisible] = useState(false);
  const [transitionType, setTransitionType] = useState<string>('fade');
  
  const { navigateWithTransition } = usePageTransition();

  // Initialize optimizations on mount
  React.useEffect(() => {
    initializeOptimizations();
  }, []);

  // Setup gesture recognition
  const { on } = useGestures(gestureAreaRef as React.RefObject<HTMLElement>, {
    swipe: { threshold: 50, velocity: 0.3 },
    pinch: { threshold: 0.1 },
    longpress: { duration: 500 },
    tap: { maxTime: 300 },
    doubletap: { maxTime: 300 },
  });

  React.useEffect(() => {
    const unsubscribers = [
      on('swipe', (event) => {
        setGestureInfo(`Swiped ${event.direction}! Distance: ${event.distance?.toFixed(0)}px`);
      }),
      on('pinch', (event) => {
        setGestureInfo(`Pinched! Scale: ${event.scale?.toFixed(2)}`);
      }),
      on('longpress', () => {
        setGestureInfo('Long press detected!');
      }),
      on('tap', () => {
        setGestureInfo('Tapped!');
      }),
      on('doubletap', () => {
        setGestureInfo('Double tapped!');
      }),
    ];

    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [on]);

  const handleTransitionDemo = (type: string) => {
    setTransitionType(type);
    // In a real app, this would navigate to a different page
    console.log(`Transition demo: ${type}`);
  };

  const transitionVariants = {
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
    },
    slide: {
      initial: { opacity: 0, x: -50 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 50 },
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 },
      exit: { opacity: 0, scale: 1.2 },
    },
    flip: {
      initial: { opacity: 0, rotateY: -90 },
      animate: { opacity: 1, rotateY: 0 },
      exit: { opacity: 0, rotateY: 90 },
    },
  };

  return (
    <PageContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h1" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          Performance & Advanced Animations
        </Typography>
        <Typography variant="body1" style={{ textAlign: 'center', marginBottom: '3rem' }}>
          Demonstration of performance monitoring, advanced page transitions, gesture support, and bundle optimization.
        </Typography>
      </motion.div>

      {/* Performance Dashboard */}
      <DemoSection>
        <Typography variant="h2">Performance Dashboard</Typography>
        <Typography variant="body1">
          Real-time monitoring of frame rates, animation performance, and optimization metrics.
        </Typography>
        <PerformanceDashboard />
      </DemoSection>

      {/* Gesture Recognition Demo */}
      <DemoSection>
        <Typography variant="h2">Gesture Recognition</Typography>
        <Typography variant="body1">
          Touch and mouse gesture support for mobile and desktop interactions.
        </Typography>
        
        <GestureArea
          ref={gestureAreaRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={{ 
            background: gestureInfo.includes('Swiped') ? 
              'linear-gradient(135deg, #10B981, #059669)' : 
              'linear-gradient(135deg, #3B82F6, #6366F1)'
          }}
          transition={{ duration: 0.3 }}
        >
          {gestureInfo}
        </GestureArea>
        
        <Typography variant="caption" style={{ textAlign: 'center' }}>
          Try different gestures: swipe, pinch (two fingers), long press, tap, or double tap
        </Typography>
      </DemoSection>

      {/* Page Transitions Demo */}
      <DemoSection>
        <Typography variant="h2">Advanced Page Transitions</Typography>
        <Typography variant="body1">
          Smooth transitions with shared elements and performance monitoring.
        </Typography>
        
        <TransitionDemo>
          {Object.keys(transitionVariants).map((type) => (
            <TransitionCard
              key={type}
              variants={transitionVariants[type as keyof typeof transitionVariants]}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.5 }}
              onClick={() => handleTransitionDemo(type)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Typography variant="h4" style={{ textTransform: 'capitalize' }}>
                {type}
              </Typography>
              <Typography variant="body2">
                Click to demo {type} transition
              </Typography>
            </TransitionCard>
          ))}
        </TransitionDemo>
      </DemoSection>

      {/* Bundle Optimization Demo */}
      <DemoSection>
        <Typography variant="h2">Bundle Optimization</Typography>
        <Typography variant="body1">
          Code splitting, lazy loading, and resource optimization demonstrations.
        </Typography>
        
        <LazyComponentDemo>
          <Button
            onClick={() => setLazyComponentVisible(!lazyComponentVisible)}
            variant="primary"
          >
            {lazyComponentVisible ? 'Hide' : 'Load'} Lazy Component
          </Button>
          
          {lazyComponentVisible && (
            <React.Suspense 
              fallback={
                <Card style={{ padding: '2rem', textAlign: 'center' }}>
                  <Typography>Loading heavy component...</Typography>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ 
                      width: '40px', 
                      height: '40px', 
                      border: '4px solid #e2e8f0', 
                      borderTop: '4px solid #3b82f6',
                      borderRadius: '50%',
                      margin: '1rem auto'
                    }}
                  />
                </Card>
              }
            >
              <LazyHeavyComponent />
            </React.Suspense>
          )}
        </LazyComponentDemo>
      </DemoSection>

      {/* Advanced Animation Examples */}
      <DemoSection>
        <Typography variant="h2">Advanced Animation Examples</Typography>
        <Typography variant="body1">
          Complex animations with performance optimization and reduced motion support.
        </Typography>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <motion.div
            style={{
              height: '150px',
              background: 'linear-gradient(45deg, #ff6b6b, #feca57)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
            }}
            animate={{
              rotateY: [0, 180, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            3D Rotation
          </motion.div>
          
          <motion.div
            style={{
              height: '150px',
              background: 'linear-gradient(45deg, #a8e6cf, #88d8c0)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
            }}
            animate={{
              y: [0, -20, 0],
              boxShadow: [
                '0 5px 15px rgba(0,0,0,0.1)',
                '0 15px 30px rgba(0,0,0,0.2)',
                '0 5px 15px rgba(0,0,0,0.1)',
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Floating Effect
          </motion.div>
          
          <motion.div
            style={{
              height: '150px',
              background: 'linear-gradient(45deg, #ff9a9e, #fecfef)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
            }}
            animate={{
              background: [
                'linear-gradient(45deg, #ff9a9e, #fecfef)',
                'linear-gradient(45deg, #a8edea, #fed6e3)',
                'linear-gradient(45deg, #ff9a9e, #fecfef)',
              ],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            Color Morphing
          </motion.div>
        </div>
      </DemoSection>
    </PageContainer>
  );
}