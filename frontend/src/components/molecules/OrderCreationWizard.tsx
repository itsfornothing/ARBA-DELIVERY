'use client';

import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Calculator, CreditCard, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { Textarea } from '@/components/atoms/Textarea';

// Animations
const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 10px rgba(59, 130, 246, 0);
  }
`;

const priceUpdate = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
    color: #10b981;
  }
  100% {
    transform: scale(1);
  }
`;

// Styled Components
const WizardContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const ProgressContainer = styled.div`
  margin-bottom: 3rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: ${props => props.theme.colors.background};
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 1rem;
`;

const ProgressFill = styled(motion.div)<{ progress: number }>`
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 4px;
  width: ${props => props.progress}%;
  transition: width 0.5s ease-out;
`;

const StepsContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const StepIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => !['completed', 'current'].includes(prop),
})<{ completed: boolean; current: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  
  &:not(:last-child)::after {
    content: '';
    position: absolute;
    top: 20px;
    left: 50%;
    width: 100px;
    height: 2px;
    background-color: ${props => props.completed ? props.theme.colors.primary : '#e5e7eb'};
    transform: translateX(-50%);
    z-index: -1;
    transition: background-color 0.3s ease;
  }
`;

const StepCircle = styled.div.withConfig({
  shouldForwardProp: (prop) => !['completed', 'current'].includes(prop),
})<{ completed: boolean; current: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  
  ${props => {
    if (props.completed) {
      return css`
        background-color: ${props.theme.colors.primary};
        color: white;
        animation: ${pulseGlow} 2s infinite;
      `;
    } else if (props.current) {
      return css`
        background-color: ${props.theme.colors.primary};
        color: white;
        transform: scale(1.1);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      `;
    } else {
      return css`
        background-color: #e5e7eb;
        color: #6b7280;
      `;
    }
  }}
`;

const StepLabel = styled.span.withConfig({
  shouldForwardProp: (prop) => !['completed', 'current'].includes(prop),
})<{ completed: boolean; current: boolean }>`
  font-size: 12px;
  font-weight: ${props => props.current ? '600' : '400'};
  color: ${props => props.completed || props.current ? props.theme.colors.primary : '#6b7280'};
  text-align: center;
  transition: all 0.3s ease;
`;

const StepContent = styled(motion.div)`
  animation: ${slideIn} 0.5s ease-out;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const FormLabel = styled.label`
  display: flex;
  align-items: center;
  font-weight: 600;
  color: ${props => props.theme.colors.text};
  margin-bottom: 0.5rem;
  
  svg {
    margin-right: 0.5rem;
    color: ${props => props.theme.colors.primary};
  }
`;

const PricingCard = styled(Card)`
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border: 2px solid ${props => props.theme.colors.primary};
  margin-top: 1rem;
`;

const PriceBreakdown = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &.total {
    border-top: 2px solid ${props => props.theme.colors.primary};
    padding-top: 0.75rem;
    font-weight: 700;
    font-size: 1.125rem;
  }
`;

const TotalPrice = styled.span`
  color: ${props => props.theme.colors.primary};
  font-size: 1.5rem;
  font-weight: 700;
  animation: ${priceUpdate} 0.5s ease-out;
`;

const DistanceSlider = styled.input`
  width: 100%;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #e5e7eb 0%, ${props => props.theme.colors.primary} 100%);
  outline: none;
  margin: 1rem 0;
  
  &::-webkit-slider-thumb {
    appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${props => props.theme.colors.primary};
    cursor: pointer;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
    transition: transform 0.2s ease;
    
    &:hover {
      transform: scale(1.2);
    }
  }
  
  &::-moz-range-thumb {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${props => props.theme.colors.primary};
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  gap: 1rem;
`;

const SuccessAnimation = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 3rem;
`;

const SuccessIcon = styled(motion.div)`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #10b981, #059669);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  
  svg {
    color: white;
    width: 40px;
    height: 40px;
  }
`;

// Interfaces
interface OrderData {
  pickup_address: string;
  delivery_address: string;
  distance_km: number;
  special_instructions?: string;
}

interface PricingConfig {
  base_fee: number;
  per_km_rate: number;
}

interface OrderCreationWizardProps {
  onSubmit: (data: OrderData) => Promise<void>;
  pricingConfig?: PricingConfig;
  isLoading?: boolean;
}

const steps = [
  { id: 'addresses', label: 'Addresses', icon: MapPin },
  { id: 'details', label: 'Details', icon: Calculator },
  { id: 'payment', label: 'Payment', icon: CreditCard },
  { id: 'confirmation', label: 'Confirm', icon: CheckCircle }
];

export const OrderCreationWizard: React.FC<OrderCreationWizardProps> = ({
  onSubmit,
  pricingConfig = { base_fee: 50, per_km_rate: 20 },
  isLoading = false
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState<OrderData>({
    pickup_address: '',
    delivery_address: '',
    distance_km: 1,
    special_instructions: ''
  });
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Calculate price when distance changes
  useEffect(() => {
    const price = pricingConfig.base_fee + (orderData.distance_km * pricingConfig.per_km_rate);
    setCalculatedPrice(price);
  }, [orderData.distance_km, pricingConfig]);

  const progress = (currentStep / (steps.length - 1)) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    // Final validation before submission
    const addressError = validateAddresses();
    if (addressError) {
      setValidationError(addressError);
      return;
    }

    try {
      await onSubmit(orderData);
      setIsSubmitted(true);
    } catch (error) {
      console.error('Order submission failed:', error);
    }
  };

  const updateOrderData = (field: keyof OrderData, value: string | number) => {
    setOrderData(prev => ({ ...prev, [field]: value }));
    // Clear validation error when user makes changes
    if (validationError) {
      setValidationError(null);
    }
  };

  const validateAddresses = () => {
    const pickup = orderData.pickup_address.trim().toLowerCase();
    const delivery = orderData.delivery_address.trim().toLowerCase();
    
    if (pickup && delivery && pickup === delivery) {
      return 'Pickup and delivery addresses cannot be the same';
    }
    return null;
  };

  // Use useEffect to handle validation without causing re-renders
  useEffect(() => {
    if (currentStep === 0) {
      const addressError = validateAddresses();
      setValidationError(addressError);
    } else {
      setValidationError(null);
    }
  }, [orderData.pickup_address, orderData.delivery_address, currentStep]);

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        const addressError = validateAddresses();
        if (addressError) {
          return false;
        }
        return orderData.pickup_address.length >= 5 && orderData.delivery_address.length >= 5;
      case 1:
        return orderData.distance_km > 0;
      case 2:
        return true; // Payment step - always valid for demo
      case 3:
        return true; // Confirmation step
      default:
        return false;
    }
  };

  if (isSubmitted) {
    return (
      <WizardContainer>
        <SuccessAnimation
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <SuccessIcon
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring", stiffness: 200 }}
          >
            <CheckCircle />
          </SuccessIcon>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Typography variant="h2" style={{ marginBottom: '1rem', color: '#10b981' }}>
              Order Created Successfully!
            </Typography>
            <Typography variant="body" style={{ color: '#6b7280', marginBottom: '2rem' }}>
              Your delivery order has been placed and a courier will be assigned shortly.
            </Typography>
            <Typography variant="h3" style={{ color: '#3b82f6' }}>
              Total: ${calculatedPrice.toFixed(2)}
            </Typography>
          </motion.div>
        </SuccessAnimation>
      </WizardContainer>
    );
  }

  return (
    <WizardContainer>
      {/* Progress Section */}
      <ProgressContainer>
        <ProgressBar>
          <ProgressFill
            progress={progress}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </ProgressBar>
        
        <StepsContainer>
          {steps.map((step, index) => (
            <StepIndicator
              key={step.id}
              completed={index < currentStep}
              current={index === currentStep}
            >
              <StepCircle completed={index < currentStep} current={index === currentStep}>
                {index < currentStep ? <CheckCircle size={20} /> : index + 1}
              </StepCircle>
              <StepLabel completed={index < currentStep} current={index === currentStep}>
                {step.label}
              </StepLabel>
            </StepIndicator>
          ))}
        </StepsContainer>
      </ProgressContainer>

      {/* Step Content */}
      <AnimatePresence mode="wait">
        <StepContent
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          {currentStep === 0 && (
            <Card>
              <Typography variant="h3" style={{ marginBottom: '1.5rem' }}>
                Pickup & Delivery Addresses
              </Typography>
              
              {validationError && (
                <div style={{ 
                  backgroundColor: '#fef2f2', 
                  border: '1px solid #fecaca', 
                  color: '#dc2626', 
                  padding: '0.75rem', 
                  borderRadius: '0.5rem', 
                  marginBottom: '1.5rem',
                  fontSize: '0.875rem'
                }}>
                  {validationError}
                </div>
              )}
              
              <FormSection>
                <FormLabel>
                  <MapPin size={20} />
                  Pickup Address
                </FormLabel>
                <Textarea
                  value={orderData.pickup_address}
                  onChange={(e) => updateOrderData('pickup_address', e.target.value)}
                  placeholder="Enter pickup address (e.g., 123 Main St, City, State)"
                  rows={3}
                />
              </FormSection>

              <FormSection>
                <FormLabel>
                  <MapPin size={20} />
                  Delivery Address
                </FormLabel>
                <Textarea
                  value={orderData.delivery_address}
                  onChange={(e) => updateOrderData('delivery_address', e.target.value)}
                  placeholder="Enter delivery address (e.g., 456 Oak Ave, City, State)"
                  rows={3}
                />
              </FormSection>
            </Card>
          )}

          {currentStep === 1 && (
            <Card>
              <Typography variant="h3" style={{ marginBottom: '1.5rem' }}>
                Order Details
              </Typography>
              
              <FormSection>
                <FormLabel>
                  <Calculator size={20} />
                  Distance (kilometers)
                </FormLabel>
                <DistanceSlider
                  type="range"
                  min="0.1"
                  max="100"
                  step="0.1"
                  value={orderData.distance_km}
                  onChange={(e) => updateOrderData('distance_km', parseFloat(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#6b7280' }}>
                  <span>0.1 km</span>
                  <span style={{ fontWeight: '600', color: '#374151' }}>
                    {orderData.distance_km.toFixed(1)} km
                  </span>
                  <span>100 km</span>
                </div>
              </FormSection>

              <FormSection>
                <FormLabel>Special Instructions (Optional)</FormLabel>
                <Textarea
                  value={orderData.special_instructions || ''}
                  onChange={(e) => updateOrderData('special_instructions', e.target.value)}
                  placeholder="Any special delivery instructions..."
                  
                  rows={3}
                />
              </FormSection>

              <PricingCard>
                <Typography variant="h4" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center' }}>
                  <CreditCard size={20} style={{ marginRight: '0.5rem' }} />
                  Price Breakdown
                </Typography>
                
                <PriceBreakdown>
                  <PriceRow>
                    <span>Base fee:</span>
                    <span>${pricingConfig.base_fee.toFixed(2)}</span>
                  </PriceRow>
                  <PriceRow>
                    <span>Distance ({orderData.distance_km.toFixed(1)} km × ${pricingConfig.per_km_rate}/km):</span>
                    <span>${(orderData.distance_km * pricingConfig.per_km_rate).toFixed(2)}</span>
                  </PriceRow>
                  <PriceRow className="total">
                    <span>Total:</span>
                    <TotalPrice>${calculatedPrice.toFixed(2)}</TotalPrice>
                  </PriceRow>
                </PriceBreakdown>
              </PricingCard>
            </Card>
          )}

          {currentStep === 2 && (
            <Card>
              <Typography variant="h3" style={{ marginBottom: '1.5rem' }}>
                Payment Information
              </Typography>
              
              <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
                <CreditCard size={48} style={{ color: '#3b82f6', marginBottom: '1rem' }} />
                <Typography variant="h4" style={{ marginBottom: '0.5rem' }}>
                  Payment on Delivery
                </Typography>
                <Typography variant="body" style={{ color: '#6b7280' }}>
                  You can pay the courier directly when your order is delivered.
                </Typography>
                <Typography variant="h3" style={{ marginTop: '1rem', color: '#3b82f6' }}>
                  Total: ${calculatedPrice.toFixed(2)}
                </Typography>
              </div>
            </Card>
          )}

          {currentStep === 3 && (
            <Card>
              <Typography variant="h3" style={{ marginBottom: '1.5rem' }}>
                Order Confirmation
              </Typography>
              
              <div style={{ display: 'grid', gap: '1.5rem' }}>
                <div>
                  <Typography variant="h4" style={{ marginBottom: '0.5rem' }}>
                    Pickup Address
                  </Typography>
                  <Typography variant="body" style={{ color: '#6b7280' }}>
                    {orderData.pickup_address}
                  </Typography>
                </div>
                
                <div>
                  <Typography variant="h4" style={{ marginBottom: '0.5rem' }}>
                    Delivery Address
                  </Typography>
                  <Typography variant="body" style={{ color: '#6b7280' }}>
                    {orderData.delivery_address}
                  </Typography>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <Typography variant="h4" style={{ marginBottom: '0.5rem' }}>
                      Distance
                    </Typography>
                    <Typography variant="body" style={{ color: '#6b7280' }}>
                      {orderData.distance_km.toFixed(1)} km
                    </Typography>
                  </div>
                  
                  <div>
                    <Typography variant="h4" style={{ marginBottom: '0.5rem' }}>
                      Total Price
                    </Typography>
                    <Typography variant="h3" style={{ color: '#3b82f6' }}>
                      ${calculatedPrice.toFixed(2)}
                    </Typography>
                  </div>
                </div>
                
                {orderData.special_instructions && (
                  <div>
                    <Typography variant="h4" style={{ marginBottom: '0.5rem' }}>
                      Special Instructions
                    </Typography>
                    <Typography variant="body" style={{ color: '#6b7280' }}>
                      {orderData.special_instructions}
                    </Typography>
                  </div>
                )}
              </div>
            </Card>
          )}
        </StepContent>
      </AnimatePresence>

      {/* Action Buttons */}
      <ActionButtons>
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <ArrowLeft size={16} />
          Previous
        </Button>
        
        {currentStep === steps.length - 1 ? (
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!isStepValid() || isLoading}
            loading={isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            Place Order - ${calculatedPrice.toFixed(2)}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={!isStepValid()}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            Next
            <ArrowRight size={16} />
          </Button>
        )}
      </ActionButtons>
    </WizardContainer>
  );
};