'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/atoms/Card';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';
import { 
  SuccessCelebration, 
  CelebrationProvider, 
  useCelebrationHelpers,
  CelebrationData 
} from '@/components/molecules/SuccessCelebration';

export default function CelebrationsPage() {
  const [showCelebration, setShowCelebration] = useState(false);
  const { celebrateOrderCompletion } = useCelebrationHelpers();

  const mockCelebrationData: CelebrationData = {
    id: 'demo-celebration',
    type: 'order_completion',
    title: 'Order Completed!',
    message: 'Great job! You successfully completed another delivery.',
    celebrationLevel: 'medium',
    duration: 3000,
    showConfetti: true,
    showParticles: true,
  };

  const handleTriggerCelebration = () => {
    setShowCelebration(true);
    celebrateOrderCompletion(
      'Order Completed!',
      'Great job! You successfully completed another delivery.'
    );
  };

  return (
    <CelebrationProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 py-8">
        <ResponsiveContainer size="desktop">
          <div className="text-center mb-8">
            <Typography variant="h1" className="mb-4">
              Celebration System
            </Typography>
            <Typography variant="body1" color="muted">
              Interactive celebration components for user achievements
            </Typography>
          </div>

          <ResponsiveGrid columns="single" gap="responsive">
            <Card variant="elevated">
              <CardContent>
                <Typography variant="h4" className="mb-4">
                  Success Celebrations
                </Typography>
                <Typography variant="body2" color="muted" className="mb-6">
                  Trigger celebration animations for user achievements and milestones.
                </Typography>
                
                <div className="space-y-4">
                  <Button
                    variant="primary"
                    onClick={handleTriggerCelebration}
                    fullWidth
                  >
                    Trigger Celebration
                  </Button>
                  
                  <Button
                    variant="secondary"
                    onClick={() => setShowCelebration(false)}
                    fullWidth
                  >
                    Hide Celebration
                  </Button>
                </div>
              </CardContent>
            </Card>
          </ResponsiveGrid>

          {showCelebration && (
            <SuccessCelebration
              celebration={mockCelebrationData}
              onDismiss={() => setShowCelebration(false)}
            />
          )}
        </ResponsiveContainer>
      </div>
    </CelebrationProvider>
  );
}