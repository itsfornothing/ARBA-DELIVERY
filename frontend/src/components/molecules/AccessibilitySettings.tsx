'use client';

import React, { useState } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { useAccessibility } from '@/components/providers/AccessibilityProvider';
import { AccessibleButton } from '@/components/atoms/AccessibleButton';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { MotionWrapper } from './MotionWrapper';

const SettingsContainer = styled(Card)`
  max-width: 600px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
`;

const SettingGroup = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.scale[6] * theme.spacing.unit}px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingLabel = styled(Typography)`
  margin-bottom: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  font-weight: 600;
`;

const SettingDescription = styled(Typography)`
  margin-bottom: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  color: ${({ theme }) => theme.colors.muted};
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  flex-wrap: wrap;
`;

const ToggleButton = styled(AccessibleButton)<{ $active: boolean }>`
  background-color: ${({ $active, theme }) => 
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => 
    $active ? theme.colors.background : theme.colors.text};
  border: 2px solid ${({ theme }) => theme.colors.primary};
  
  &:hover:not(:disabled) {
    background-color: ${({ $active, theme }) => 
      $active ? theme.colors.primary : `${theme.colors.primary}10`};
  }
`;

const StatusIndicator = styled.div<{ $status: 'enabled' | 'disabled' | 'system' }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px;
  padding: ${({ theme }) => theme.spacing.scale[1] * theme.spacing.unit}px 
           ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
  border-radius: ${({ theme }) => theme.borderRadius.small};
  font-size: 0.875rem;
  font-weight: 500;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'enabled':
        return `
          background-color: ${theme.colors.success}20;
          color: ${theme.colors.success};
        `;
      case 'disabled':
        return `
          background-color: ${theme.colors.muted}20;
          color: ${theme.colors.muted};
        `;
      case 'system':
        return `
          background-color: ${theme.colors.info}20;
          color: ${theme.colors.info};
        `;
      default:
        return '';
    }
  }}
`;

const StatusDot = styled.div<{ $status: 'enabled' | 'disabled' | 'system' }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  
  ${({ $status, theme }) => {
    switch ($status) {
      case 'enabled':
        return `background-color: ${theme.colors.success};`;
      case 'disabled':
        return `background-color: ${theme.colors.muted};`;
      case 'system':
        return `background-color: ${theme.colors.info};`;
      default:
        return '';
    }
  }}
`;

const TestArea = styled.div`
  padding: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  border: 2px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  margin-top: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
  text-align: center;
`;

export const AccessibilitySettings: React.FC = () => {
  const {
    prefersReducedMotion,
    prefersHighContrast,
    fontSize,
    setFontSize,
    announceToScreenReader,
  } = useAccessibility();

  const [testAnimation, setTestAnimation] = useState(false);

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    setFontSize(size);
    announceToScreenReader(`Font size changed to ${size}`);
  };

  const testAnimations = () => {
    setTestAnimation(true);
    announceToScreenReader('Testing animations');
    setTimeout(() => setTestAnimation(false), 2000);
  };

  const testScreenReader = () => {
    announceToScreenReader('This is a test announcement for screen readers. Accessibility settings are working correctly.');
  };

  return (
    <MotionWrapper animation="fadeIn" duration={0.5}>
      <SettingsContainer>
        <Typography variant="h2" style={{ marginBottom: '24px', textAlign: 'center' }}>
          Accessibility Settings
        </Typography>

        <SettingGroup>
          <SettingLabel variant="h4">Motion Preferences</SettingLabel>
          <SettingDescription variant="body">
            Control animations and transitions based on your preferences or system settings.
          </SettingDescription>
          
          <StatusIndicator $status={prefersReducedMotion ? 'enabled' : 'disabled'}>
            <StatusDot $status={prefersReducedMotion ? 'enabled' : 'disabled'} />
            Reduced Motion: {prefersReducedMotion ? 'Enabled' : 'Disabled'}
          </StatusIndicator>
          
          <TestArea>
            <Typography variant="body" style={{ marginBottom: '16px' }}>
              Test animations with your current settings:
            </Typography>
            <AccessibleButton onClick={testAnimations}>
              Test Animation
            </AccessibleButton>
            {testAnimation && (
              <MotionWrapper 
                animation="scaleIn" 
                duration={0.5}
                style={{ marginTop: '16px' }}
              >
                <Typography variant="body" color="success">
                  ✓ Animation test complete
                </Typography>
              </MotionWrapper>
            )}
          </TestArea>
        </SettingGroup>

        <SettingGroup>
          <SettingLabel variant="h4">Contrast Preferences</SettingLabel>
          <SettingDescription variant="body">
            High contrast mode improves visibility by using stronger color differences.
          </SettingDescription>
          
          <StatusIndicator $status={prefersHighContrast ? 'enabled' : 'disabled'}>
            <StatusDot $status={prefersHighContrast ? 'enabled' : 'disabled'} />
            High Contrast: {prefersHighContrast ? 'Enabled' : 'Disabled'}
          </StatusIndicator>
        </SettingGroup>

        <SettingGroup>
          <SettingLabel variant="h4">Font Size</SettingLabel>
          <SettingDescription variant="body">
            Adjust the text size for better readability.
          </SettingDescription>
          
          <ButtonGroup>
            <ToggleButton
              $active={fontSize === 'small'}
              onClick={() => handleFontSizeChange('small')}
              aria-pressed={fontSize === 'small'}
            >
              Small
            </ToggleButton>
            <ToggleButton
              $active={fontSize === 'medium'}
              onClick={() => handleFontSizeChange('medium')}
              aria-pressed={fontSize === 'medium'}
            >
              Medium
            </ToggleButton>
            <ToggleButton
              $active={fontSize === 'large'}
              onClick={() => handleFontSizeChange('large')}
              aria-pressed={fontSize === 'large'}
            >
              Large
            </ToggleButton>
          </ButtonGroup>
        </SettingGroup>

        <SettingGroup>
          <SettingLabel variant="h4">Screen Reader Support</SettingLabel>
          <SettingDescription variant="body">
            Test screen reader announcements and accessibility features.
          </SettingDescription>
          
          <AccessibleButton onClick={testScreenReader}>
            Test Screen Reader Announcement
          </AccessibleButton>
        </SettingGroup>

        <TestArea>
          <Typography variant="h5" style={{ marginBottom: '16px' }}>
            Accessibility Features Summary
          </Typography>
          <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
            <li>✓ WCAG AA compliant color contrast</li>
            <li>✓ Keyboard navigation support</li>
            <li>✓ Screen reader compatibility</li>
            <li>✓ Reduced motion preferences</li>
            <li>✓ High contrast mode support</li>
            <li>✓ Adjustable font sizes</li>
            <li>✓ Focus indicators</li>
            <li>✓ Touch-friendly targets (44px minimum)</li>
          </ul>
        </TestArea>
      </SettingsContainer>
    </MotionWrapper>
  );
};