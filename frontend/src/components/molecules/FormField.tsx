'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/atoms/Input';
import { FormValidator, ValidationRule, ValidationResult } from '@/lib/validation';

interface FormFieldProps {
  name: string;
  label?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (name: string, value: string) => void;
  onValidation?: (name: string, result: ValidationResult) => void;
  validationRules?: ValidationRule;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'filled' | 'outlined';
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
  realTimeValidation?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onValidation,
  validationRules,
  size = 'medium',
  variant = 'default',
  fullWidth = false,
  leftIcon,
  rightIcon,
  disabled = false,
  autoFocus = false,
  realTimeValidation = true,
}) => {
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  // Validate field value
  const validateField = (fieldValue: string, showError: boolean = true) => {
    if (!validationRules) return { isValid: true };

    setIsValidating(true);
    const result = FormValidator.validate(fieldValue, validationRules);
    
    if (showError && touched) {
      setError(result.error || '');
    }
    
    setIsValidating(false);
    onValidation?.(name, result);
    return result;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(name, newValue);

    // Real-time validation
    if (realTimeValidation && touched) {
      validateField(newValue);
    }
  };

  // Handle blur event
  const handleBlur = () => {
    setTouched(true);
    validateField(value);
  };

  // Validate when value changes externally
  useEffect(() => {
    if (touched) {
      validateField(value);
    }
  }, [value, validationRules, touched]);

  return (
    <Input
      name={name}
      type={type}
      label={label}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      error={error}
      size={size}
      variant={variant}
      fullWidth={fullWidth}
      leftIcon={leftIcon}
      rightIcon={rightIcon}
      disabled={disabled}
      autoFocus={autoFocus}
    />
  );
};