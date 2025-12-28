'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/atoms/Button';
import { Typography } from '@/components/atoms/Typography';
import { Card } from '@/components/atoms/Card';
import { Input } from '@/components/atoms/Input';
import { Textarea } from '@/components/atoms/Textarea';
import { fadeIn, slideUp } from '@/lib/theme';

interface ErrorRecoveryFlowProps {
  errorType: 'network' | 'validation' | 'permission' | 'notFound' | 'server' | 'timeout';
  context?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  onContactSupport?: (details: { email: string; description: string }) => void;
  onReportBug?: (details: { description: string; steps: string }) => void;
}

const FlowContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  max-width: 600px;
  margin: 0 auto;
`;

const StepCard = styled(Card)`
  border-left: 4px solid ${({ theme }) => theme.colors.primary};
`;

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  margin-top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const ActionCard = styled(Card)<{ $variant: 'primary' | 'secondary' | 'tertiary' }>`
  cursor: pointer;
  transition: all ${({ theme }) => theme.animations.duration.fast}ms ${({ theme }) => theme.animations.easing.easeOut};
  border: 2px solid ${({ theme, $variant }) => 
    $variant === 'primary' ? theme.colors.primary : 
    $variant === 'secondary' ? theme.colors.secondary : 
    theme.colors.border};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.medium};
    border-color: ${({ theme, $variant }) => 
      $variant === 'primary' ? theme.colors.primary : 
      $variant === 'secondary' ? theme.colors.secondary : 
      theme.colors.primary};
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  margin-top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const ProgressIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  margin-bottom: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const ProgressStep = styled.div<{ $active: boolean; $completed: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  background-color: ${({ theme, $active, $completed }) => 
    $completed ? theme.colors.success : 
    $active ? theme.colors.primary : 
    theme.colors.border};
  color: ${({ theme, $active, $completed }) => 
    ($completed || $active) ? 'white' : theme.colors.muted};
  transition: all ${({ theme }) => theme.animations.duration.fast}ms;
`;

const ProgressLine = styled.div<{ $completed: boolean }>`
  flex: 1;
  height: 2px;
  background-color: ${({ theme, $completed }) => 
    $completed ? theme.colors.success : theme.colors.border};
  transition: all ${({ theme }) => theme.animations.duration.normal}ms;
`;

type FlowStep = 'initial' | 'troubleshooting' | 'contact' | 'report' | 'success';

export const ErrorRecoveryFlow: React.FC<ErrorRecoveryFlowProps> = ({
  errorType,
  context,
  onRetry,
  onGoBack,
  onContactSupport,
  onReportBug
}) => {
  const [currentStep, setCurrentStep] = useState<FlowStep>('initial');
  const [contactForm, setContactForm] = useState({ email: '', description: '' });
  const [reportForm, setReportForm] = useState({ description: '', steps: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps = [
    { id: 'initial', label: '1', title: 'Error Detected' },
    { id: 'troubleshooting', label: '2', title: 'Troubleshooting' },
    { id: 'contact', label: '3', title: 'Get Help' },
    { id: 'success', label: '✓', title: 'Resolved' }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.id === currentStep);
  };

  const getTroubleshootingSteps = () => {
    switch (errorType) {
      case 'network':
        return [
          'Check your internet connection',
          'Try refreshing the page',
          'Disable any VPN or proxy',
          'Clear your browser cache',
          'Try a different browser'
        ];
      case 'validation':
        return [
          'Review all required fields',
          'Check for any error messages',
          'Ensure data formats are correct',
          'Remove any special characters',
          'Try submitting again'
        ];
      case 'permission':
        return [
          'Verify you\'re logged in',
          'Check your account permissions',
          'Try logging out and back in',
          'Contact your administrator',
          'Request access if needed'
        ];
      case 'notFound':
        return [
          'Check the URL for typos',
          'Use the navigation menu',
          'Try the search function',
          'Go back to the homepage',
          'Contact support if the link should work'
        ];
      case 'server':
        return [
          'Wait a few minutes and try again',
          'Check our status page',
          'Try a different browser',
          'Clear your browser data',
          'Contact support if it persists'
        ];
      case 'timeout':
        return [
          'Check your internet speed',
          'Try again with a better connection',
          'Reduce the amount of data',
          'Try during off-peak hours',
          'Contact support for assistance'
        ];
      default:
        return [
          'Refresh the page',
          'Try again in a few minutes',
          'Check your internet connection',
          'Contact support if needed'
        ];
    }
  };

  const handleContactSubmit = async () => {
    if (!contactForm.email || !contactForm.description) return;
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      if (onContactSupport) {
        onContactSupport(contactForm);
      }
      setCurrentStep('success');
    } catch (error) {
      console.error('Failed to submit contact form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSubmit = async () => {
    if (!reportForm.description || !reportForm.steps) return;
    
    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      if (onReportBug) {
        onReportBug(reportForm);
      }
      setCurrentStep('success');
    } catch (error) {
      console.error('Failed to submit bug report:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'initial':
        return (
          <StepCard>
            <Typography variant="h4" color="text" style={{ marginBottom: '16px' }}>
              Let's fix this together
            </Typography>
            <Typography variant="body" color="muted" style={{ marginBottom: '24px' }}>
              We've detected an issue. Choose how you'd like to proceed:
            </Typography>
            
            <ActionGrid>
              <ActionCard 
                $variant="primary" 
                interactive 
                onClick={() => setCurrentStep('troubleshooting')}
              >
                <Typography variant="h6" color="text" style={{ marginBottom: '8px' }}>
                  🔧 Troubleshoot
                </Typography>
                <Typography variant="body" color="muted">
                  Try some quick fixes first
                </Typography>
              </ActionCard>
              
              {onRetry && (
                <ActionCard $variant="secondary" interactive onClick={onRetry}>
                  <Typography variant="h6" color="text" style={{ marginBottom: '8px' }}>
                    🔄 Try Again
                  </Typography>
                  <Typography variant="body" color="muted">
                    Retry the action immediately
                  </Typography>
                </ActionCard>
              )}
              
              <ActionCard 
                $variant="tertiary" 
                interactive 
                onClick={() => setCurrentStep('contact')}
              >
                <Typography variant="h6" color="text" style={{ marginBottom: '8px' }}>
                  💬 Get Help
                </Typography>
                <Typography variant="body" color="muted">
                  Contact our support team
                </Typography>
              </ActionCard>
            </ActionGrid>
          </StepCard>
        );

      case 'troubleshooting':
        return (
          <StepCard>
            <Typography variant="h4" color="text" style={{ marginBottom: '16px' }}>
              Troubleshooting Steps
            </Typography>
            <Typography variant="body" color="muted" style={{ marginBottom: '24px' }}>
              Try these steps in order:
            </Typography>
            
            <ol style={{ paddingLeft: '20px', marginBottom: '24px' }}>
              {getTroubleshootingSteps().map((step, index) => (
                <li key={index} style={{ marginBottom: '8px' }}>
                  <Typography variant="body" color="text">{step}</Typography>
                </li>
              ))}
            </ol>
            
            <ActionGrid>
              {onRetry && (
                <Button variant="primary" onClick={onRetry}>
                  Try Again Now
                </Button>
              )}
              <Button variant="outline" onClick={() => setCurrentStep('contact')}>
                Still Need Help
              </Button>
              {onGoBack && (
                <Button variant="ghost" onClick={onGoBack}>
                  Go Back
                </Button>
              )}
            </ActionGrid>
          </StepCard>
        );

      case 'contact':
        return (
          <StepCard>
            <Typography variant="h4" color="text" style={{ marginBottom: '16px' }}>
              Contact Support
            </Typography>
            <Typography variant="body" color="muted" style={{ marginBottom: '24px' }}>
              Our support team is here to help. Please provide some details:
            </Typography>
            
            <FormContainer>
              <Input
                label="Your Email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your.email@example.com"
                required
              />
              
              <Textarea
                label="Describe the Issue"
                rows={4}
                value={contactForm.description}
                onChange={(e) => setContactForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please describe what you were trying to do and what happened..."
                required
              />
              
              <ActionGrid>
                <Button 
                  variant="primary" 
                  onClick={handleContactSubmit}
                  loading={isSubmitting}
                  disabled={!contactForm.email || !contactForm.description}
                >
                  Send to Support
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('report')}
                >
                  Report Bug Instead
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep('initial')}
                >
                  Back
                </Button>
              </ActionGrid>
            </FormContainer>
          </StepCard>
        );

      case 'report':
        return (
          <StepCard>
            <Typography variant="h4" color="text" style={{ marginBottom: '16px' }}>
              Report a Bug
            </Typography>
            <Typography variant="body" color="muted" style={{ marginBottom: '24px' }}>
              Help us improve by reporting this issue:
            </Typography>
            
            <FormContainer>
              <Textarea
                label="Bug Description"
                rows={3}
                value={reportForm.description}
                onChange={(e) => setReportForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what went wrong..."
                required
              />
              
              <Textarea
                label="Steps to Reproduce"
                rows={4}
                value={reportForm.steps}
                onChange={(e) => setReportForm(prev => ({ ...prev, steps: e.target.value }))}
                placeholder="1. I clicked on...&#10;2. Then I tried to...&#10;3. The error occurred when..."
                required
              />
              
              <ActionGrid>
                <Button 
                  variant="primary" 
                  onClick={handleReportSubmit}
                  loading={isSubmitting}
                  disabled={!reportForm.description || !reportForm.steps}
                >
                  Submit Bug Report
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setCurrentStep('contact')}
                >
                  Contact Support Instead
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep('initial')}
                >
                  Back
                </Button>
              </ActionGrid>
            </FormContainer>
          </StepCard>
        );

      case 'success':
        return (
          <StepCard>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
              <Typography variant="h4" color="text" style={{ marginBottom: '16px' }}>
                Thank You!
              </Typography>
              <Typography variant="body" color="muted" style={{ marginBottom: '24px' }}>
                We've received your request and will get back to you soon.
              </Typography>
              
              <ActionGrid>
                {onRetry && (
                  <Button variant="primary" onClick={onRetry}>
                    Try Again
                  </Button>
                )}
                {onGoBack && (
                  <Button variant="outline" onClick={onGoBack}>
                    Go Back
                  </Button>
                )}
              </ActionGrid>
            </div>
          </StepCard>
        );

      default:
        return null;
    }
  };

  return (
    <FlowContainer {...fadeIn()}>
      <ProgressIndicator>
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            <ProgressStep 
              $active={step.id === currentStep}
              $completed={index < getCurrentStepIndex()}
            >
              {step.label}
            </ProgressStep>
            {index < steps.length - 1 && (
              <ProgressLine $completed={index < getCurrentStepIndex()} />
            )}
          </React.Fragment>
        ))}
      </ProgressIndicator>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          {...slideUp()}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </FlowContainer>
  );
};