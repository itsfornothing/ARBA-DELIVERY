'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card, CardContent } from '@/components/atoms/Card';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';
import { useOnboarding } from '@/components/providers/OnboardingProvider';
import { 
  Play, 
  RotateCcw, 
  Users, 
  Truck, 
  Settings,
  HelpCircle,
  Star,
  Target
} from 'lucide-react';

export default function OnboardingDemoPage() {
  const { 
    startOnboarding, 
    startTour, 
    resetOnboarding,
    isOnboardingCompleted,
    isOnboardingSkipped,
    setUserRole,
    userRole,
    isFirstVisit
  } = useOnboarding();

  const handleStartFirstTimeOnboarding = () => {
    resetOnboarding('first-time-user');
    startOnboarding('first-time-user');
  };

  const handleStartCustomerTour = () => {
    setUserRole('customer');
    resetOnboarding('customer-dashboard');
    startTour('customer-dashboard');
  };

  const handleStartCourierTour = () => {
    setUserRole('courier');
    resetOnboarding('courier-dashboard');
    startTour('courier-dashboard');
  };

  const demoFeatures = [
    {
      id: 'create-order',
      title: 'Create Order',
      description: 'Start a new delivery order',
      icon: <Target size={24} />,
    },
    {
      id: 'order-history',
      title: 'Order History',
      description: 'View past orders',
      icon: <Settings size={24} />,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Stay updated',
      icon: <HelpCircle size={24} />,
    },
    {
      id: 'available-orders',
      title: 'Available Orders',
      description: 'Browse delivery jobs',
      icon: <Star size={24} />,
    },
    {
      id: 'earnings',
      title: 'Earnings',
      description: 'Track your income',
      icon: <Users size={24} />,
    },
    {
      id: 'status-toggle',
      title: 'Status Toggle',
      description: 'Go online/offline',
      icon: <Truck size={24} />,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 py-12">
      <ResponsiveContainer size="desktop">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Typography variant="h1" className="mb-4">
              Onboarding & Guided Tours
            </Typography>
            <Typography variant="body1" color="muted" className="text-lg">
              Experience our comprehensive onboarding system with guided tours and contextual help
            </Typography>
          </motion.div>
        </div>

        <ResponsiveGrid columns="responsive" gap="responsive">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <Card variant="elevated" className="text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Play size={32} />
                </div>
                <Typography variant="h4" className="mb-3">
                  First-Time User Onboarding
                </Typography>
                <Typography variant="body1" color="muted" className="mb-6">
                  Welcome new users with an engaging onboarding flow that introduces key features and guides them to their first action.
                </Typography>
                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    onClick={handleStartFirstTimeOnboarding}
                    fullWidth
                    leftIcon={<Play size={16} />}
                  >
                    Start Onboarding
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => resetOnboarding('first-time-user')}
                    size="sm"
                    fullWidth
                    leftIcon={<RotateCcw size={16} />}
                  >
                    Reset
                  </Button>
                </div>
                <div className="mt-4 text-sm text-neutral-600">
                  Status: {isOnboardingCompleted('first-time-user') ? 'Completed' : 
                          isOnboardingSkipped('first-time-user') ? 'Skipped' : 'Not Started'}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card variant="elevated" className="text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Users size={32} />
                </div>
                <Typography variant="h4" className="mb-3">
                  Customer Dashboard Tour
                </Typography>
                <Typography variant="body1" color="muted" className="mb-6">
                  Guide customers through their dashboard with tooltips highlighting key features and actions.
                </Typography>
                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    onClick={handleStartCustomerTour}
                    fullWidth
                    leftIcon={<Target size={16} />}
                  >
                    Start Customer Tour
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => resetOnboarding('customer-dashboard')}
                    size="sm"
                    fullWidth
                    leftIcon={<RotateCcw size={16} />}
                  >
                    Reset
                  </Button>
                </div>
                <div className="mt-4 text-sm text-neutral-600">
                  Current Role: {userRole || 'None'}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Card variant="elevated" className="text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <CardContent>
                <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                  <Truck size={32} />
                </div>
                <Typography variant="h4" className="mb-3">
                  Courier Dashboard Tour
                </Typography>
                <Typography variant="body1" color="muted" className="mb-6">
                  Help couriers understand their dashboard with step-by-step guidance through earnings, orders, and status controls.
                </Typography>
                <div className="space-y-3">
                  <Button 
                    variant="primary" 
                    onClick={handleStartCourierTour}
                    fullWidth
                    leftIcon={<Truck size={16} />}
                  >
                    Start Courier Tour
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => resetOnboarding('courier-dashboard')}
                    size="sm"
                    fullWidth
                    leftIcon={<RotateCcw size={16} />}
                  >
                    Reset
                  </Button>
                </div>
                <div className="mt-4 text-sm text-neutral-600">
                  First Visit: {isFirstVisit ? 'Yes' : 'No'}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </ResponsiveGrid>

        <div className="mt-16">
          <Typography variant="h2" className="text-center mb-8">
            Interactive Demo Elements
          </Typography>
          <Typography variant="body1" color="muted" className="text-center mb-12">
            These elements have tour data attributes and can be targeted by guided tours
          </Typography>
          
          <ResponsiveGrid columns="responsive" gap="responsive">
            {demoFeatures.map((feature, index) => (
              <motion.div
                key={feature.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <div 
                  data-tour={feature.id}
                  className="p-4 border-2 border-neutral-200 rounded-lg text-center transition-all duration-200 hover:border-primary-500 hover:bg-primary-50"
                >
                  <div className="mb-3 text-neutral-600">
                    {feature.icon}
                  </div>
                  <Typography variant="h6" className="mb-2">
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="muted">
                    {feature.description}
                  </Typography>
                </div>
              </motion.div>
            ))}
          </ResponsiveGrid>
        </div>

        <div className="text-center mt-16">
          <Typography variant="body1" color="muted">
            The onboarding system automatically detects first-time visitors and shows appropriate guidance based on user roles and current page context.
          </Typography>
        </div>
      </ResponsiveContainer>
    </div>
  );
}