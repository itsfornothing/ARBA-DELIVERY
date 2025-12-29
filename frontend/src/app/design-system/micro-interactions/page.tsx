'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Zap } from 'lucide-react';
import { InteractiveButton } from '@/components/atoms/InteractiveButton';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/atoms/Card';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';
import { 
  NotificationProvider, 
  useNotificationHelpers 
} from '@/components/molecules/NotificationSystem';
import {
  FloatingActionButton,
  InteractiveCard,
  MagneticButton,
  ProgressRing,
  PulseDot
} from '@/components/molecules/MicroInteractions';

const MicroInteractionsDemo: React.FC = () => {
  const [progress, setProgress] = useState(65);
  const [loading, setLoading] = useState(false);
  const { success, error, warning, info } = useNotificationHelpers();

  const handleProgressUpdate = () => {
    const newProgress = Math.min(100, progress + 10);
    setProgress(newProgress);
    
    if (newProgress === 100) {
      success('Progress completed!', { title: 'Success' });
    }
  };

  const handleLoadingDemo = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    success('Loading completed successfully!');
  };

  const handleNotificationDemo = (type: string) => {
    switch (type) {
      case 'success':
        success('Operation completed successfully!', {
          title: 'Success',
          actions: [
            { label: 'View Details', action: () => info('Details viewed') },
            { label: 'Dismiss', action: () => {}, variant: 'secondary' }
          ]
        });
        break;
      case 'error':
        error('Something went wrong. Please try again.', {
          title: 'Error',
          persistent: true,
          actions: [
            { label: 'Retry', action: () => success('Retrying...'), variant: 'primary' },
            { label: 'Report', action: () => info('Report sent'), variant: 'secondary' }
          ]
        });
        break;
      case 'warning':
        warning('This action cannot be undone.', {
          title: 'Warning',
          duration: 8000
        });
        break;
      case 'info':
        info('New features are available in the latest update.', {
          title: 'Information',
          actions: [
            { label: 'Learn More', action: () => success('Opening help...') }
          ]
        });
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-8">
      <ResponsiveContainer size="desktop">
        <div className="space-y-12">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <Typography variant="h1" className="mb-4">
              Micro-Interactions & Button Feedback Systems
            </Typography>
            <Typography variant="body1" color="muted">
              Explore enhanced elements with satisfying animations and visual feedback
            </Typography>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card variant="elevated">
              <CardContent>
                <Typography variant="h2" className="mb-2">
                  Interactive Buttons
                </Typography>
                <Typography variant="body1" color="muted" className="mb-6">
                  Enhanced buttons with ripple effects, haptic feedback, and success animations
                </Typography>
                
                <div className="flex flex-wrap gap-3 justify-center">
                  <InteractiveButton
                    variant="primary"
                    ripple={true}
                    onClick={() => success('Primary action completed!')}
                  >
                    Primary with Ripple
                  </InteractiveButton>
                  
                  <InteractiveButton
                    variant="secondary"
                    hapticFeedback={true}
                    onClick={() => info('Haptic feedback triggered!')}
                  >
                    Haptic Feedback
                  </InteractiveButton>
                  
                  <InteractiveButton
                    variant="success"
                    successAnimation={true}
                    onClick={() => success('Success animation triggered!')}
                  >
                    Success Animation
                  </InteractiveButton>
                  
                  <InteractiveButton
                    variant="outline"
                    loading={loading}
                    onClick={handleLoadingDemo}
                  >
                    {loading ? 'Loading...' : 'Loading Demo'}
                  </InteractiveButton>
                  
                  <InteractiveButton
                    variant="danger"
                    size="large"
                    onClick={() => error('Danger action triggered!')}
                  >
                    Large Danger
                  </InteractiveButton>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card variant="elevated">
              <CardContent>
                <Typography variant="h2" className="mb-2">
                  Notification System
                </Typography>
                <Typography variant="body1" color="muted" className="mb-6">
                  Smart notifications with smooth animations, progress indicators, and action buttons
                </Typography>
                
                <div className="flex flex-wrap gap-3 justify-center">
                  <InteractiveButton
                    variant="success"
                    onClick={() => handleNotificationDemo('success')}
                  >
                    Success Notification
                  </InteractiveButton>
                  
                  <InteractiveButton
                    variant="danger"
                    onClick={() => handleNotificationDemo('error')}
                  >
                    Error Notification
                  </InteractiveButton>
                  
                  <InteractiveButton
                    variant="secondary"
                    onClick={() => handleNotificationDemo('warning')}
                  >
                    Warning Notification
                  </InteractiveButton>
                  
                  <InteractiveButton
                    variant="outline"
                    onClick={() => handleNotificationDemo('info')}
                  >
                    Info Notification
                  </InteractiveButton>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card variant="elevated">
              <CardContent>
                <Typography variant="h2" className="mb-2">
                  Interactive Cards & Effects
                </Typography>
                <Typography variant="body1" color="muted" className="mb-6">
                  Cards with hover effects, tilt animations, and magnetic interactions
                </Typography>
                
                <ResponsiveGrid columns="double" gap="responsive">
                  <InteractiveCard
                    glowEffect={true}
                    onClick={() => success('Glow card clicked!')}
                  >
                    <Typography variant="h3" className="mb-2">Glow Effect Card</Typography>
                    <Typography variant="body1" color="muted">
                      Hover to see the glow effect and smooth animations
                    </Typography>
                  </InteractiveCard>
                  
                  <InteractiveCard
                    tiltEffect={true}
                    onClick={() => info('Tilt card clicked!')}
                  >
                    <Typography variant="h3" className="mb-2">3D Tilt Card</Typography>
                    <Typography variant="body1" color="muted">
                      Move your mouse to see the 3D tilt effect
                    </Typography>
                  </InteractiveCard>
                </ResponsiveGrid>
                
                <div className="text-center mt-8">
                  <MagneticButton
                    onClick={() => warning('Magnetic button clicked!')}
                    strength={0.4}
                  >
                    <InteractiveButton variant="primary">
                      <Zap size={16} className="mr-2" />
                      Magnetic Button
                    </InteractiveButton>
                  </MagneticButton>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card variant="elevated">
              <CardContent>
                <Typography variant="h2" className="mb-2">
                  Progress & Status Indicators
                </Typography>
                <Typography variant="body1" color="muted" className="mb-6">
                  Animated progress rings and status indicators with smooth transitions
                </Typography>
                
                <div className="flex items-center gap-8 justify-center mb-8">
                  <ProgressRing
                    progress={progress}
                    size={120}
                    strokeWidth={8}
                    color="#10b981"
                  />
                  
                  <div className="text-center">
                    <Typography variant="h3" className="mb-4">
                      Progress: {progress}%
                    </Typography>
                    <InteractiveButton
                      variant="primary"
                      size="small"
                      onClick={handleProgressUpdate}
                      disabled={progress >= 100}
                    >
                      {progress >= 100 ? 'Completed' : 'Update Progress'}
                    </InteractiveButton>
                  </div>
                </div>
                
                <div className="flex items-center gap-6 justify-center">
                  <div className="flex items-center gap-2">
                    <PulseDot color="#10b981" size="small" speed="fast" />
                    <Typography variant="caption" color="muted">Online</Typography>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <PulseDot color="#f59e0b" size="medium" speed="normal" />
                    <Typography variant="caption" color="muted">Processing</Typography>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <PulseDot color="#ef4444" size="large" speed="slow" />
                    <Typography variant="caption" color="muted">Error</Typography>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>
        </div>

        {/* Floating Action Button */}
        <FloatingActionButton
          icon={<Plus size={24} />}
          onClick={() => success('FAB clicked!', { title: 'Quick Action' })}
          variant="primary"
          tooltip="Add new item"
        />
      </ResponsiveContainer>
    </div>
  );
};

const MicroInteractionsPage: React.FC = () => {
  return (
    <NotificationProvider>
      <MicroInteractionsDemo />
    </NotificationProvider>
  );
};

export default MicroInteractionsPage;