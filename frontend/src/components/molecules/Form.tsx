'use client';

import React, { useState, useCallback, FormHTMLAttributes } from 'react';
import styled, { css } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FormValidator, ValidationRule, ValidationResult } from '@/lib/validation';

interface FormField {
  name: string;
  value: string;
  error?: string;
  touched?: boolean;
}

interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'onSubmit'> {
  initialValues?: Record<string, string>;
  validationRules?: Record<string, ValidationRule>;
  onSubmit: (values: Record<string, string>, isValid: boolean) => void;
  onFieldChange?: (name: string, value: string, isValid: boolean) => void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  showSuccessMessage?: boolean;
  successMessage?: string;
  children: React.ReactNode;
}

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.scale[4] * theme.spacing.unit}px;
`;

const SuccessMessage = styled(motion.div)`
  padding: ${({ theme }) => theme.spacing.scale[3] * theme.spacing.unit}px;
  background-color: ${({ theme }) => theme.colors.success}10;
  border: 1px solid ${({ theme }) => theme.colors.success}30;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  color: ${({ theme }) => theme.colors.success};
  font-family: ${({ theme }) => theme.typography.fontFamily.default};
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.scale[2] * theme.spacing.unit}px;
`;

export const Form: React.FC<FormProps> = ({
  initialValues = {},
  validationRules = {},
  onSubmit,
  onFieldChange,
  validateOnChange = true,
  validateOnBlur = true,
  showSuccessMessage = false,
  successMessage = 'Form submitted successfully!',
  children,
  ...props
}) => {
  const [fields, setFields] = useState<Record<string, FormField>>(() => {
    const initialFields: Record<string, FormField> = {};
    Object.keys(initialValues).forEach(name => {
      initialFields[name] = {
        name,
        value: initialValues[name] || '',
        touched: false,
      };
    });
    return initialFields;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Update field value and validation
  const updateField = useCallback((name: string, value: string, shouldValidate: boolean = false) => {
    setFields(prev => {
      const field = prev[name] || { name, value: '', touched: false };
      let error = field.error;

      // Validate if requested and rules exist
      if (shouldValidate && validationRules[name]) {
        const result = FormValidator.validate(value, validationRules[name]);
        error = result.error;
      }

      const updatedField = {
        ...field,
        value,
        error,
      };

      const newFields = {
        ...prev,
        [name]: updatedField,
      };

      // Notify parent of field change
      if (onFieldChange) {
        const isValid = !error;
        onFieldChange(name, value, isValid);
      }

      return newFields;
    });
  }, [validationRules, onFieldChange]);

  // Handle field change
  const handleFieldChange = useCallback((name: string, value: string) => {
    updateField(name, value, validateOnChange);
  }, [updateField, validateOnChange]);

  // Handle field blur
  const handleFieldBlur = useCallback((name: string) => {
    setFields(prev => {
      const field = prev[name];
      if (!field) return prev;

      let error = field.error;

      // Validate on blur if enabled and rules exist
      if (validateOnBlur && validationRules[name]) {
        const result = FormValidator.validate(field.value, validationRules[name]);
        error = result.error;
      }

      return {
        ...prev,
        [name]: {
          ...field,
          touched: true,
          error,
        },
      };
    });
  }, [validationRules, validateOnBlur]);

  // Handle field validation
  const handleFieldValidation = useCallback((name: string, result: ValidationResult) => {
    setFields(prev => ({
      ...prev,
      [name]: {
        ...prev[name],
        error: result.error,
      },
    }));
  }, []);

  // Get current form values
  const getFormValues = useCallback(() => {
    const values: Record<string, string> = {};
    Object.keys(fields).forEach(name => {
      values[name] = fields[name].value;
    });
    return values;
  }, [fields]);

  // Validate entire form
  const validateForm = useCallback(() => {
    const values = getFormValues();
    const result = FormValidator.validateForm(values, validationRules);
    
    // Update field errors
    setFields(prev => {
      const newFields = { ...prev };
      Object.keys(result.errors).forEach(name => {
        if (newFields[name]) {
          newFields[name] = {
            ...newFields[name],
            error: result.errors[name],
            touched: true,
          };
        }
      });
      return newFields;
    });

    return result;
  }, [getFormValues, validationRules]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitSuccess(false);

    const validation = validateForm();
    const values = getFormValues();

    try {
      await onSubmit(values, validation.isValid);
      
      if (validation.isValid && showSuccessMessage) {
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      // Use setTimeout to ensure state update happens in next tick
      setTimeout(() => setIsSubmitting(false), 0);
    }
  };

  // Clone children and inject form context
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      // Check if child has form-related props
      const childProps = child.props as any;
      
      if (childProps.name && typeof childProps.name === 'string') {
        const fieldName = childProps.name;
        const field = fields[fieldName] || { name: fieldName, value: '', touched: false };
        
        return React.cloneElement(child, {
          ...childProps,
          value: field.value,
          error: field.touched ? field.error : undefined,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.type === 'checkbox' ? e.target.checked.toString() : e.target.value;
            handleFieldChange(fieldName, value);
            childProps.onChange?.(e);
          },
          onBlur: (e: React.FocusEvent) => {
            handleFieldBlur(fieldName);
            childProps.onBlur?.(e);
          },
          onValidation: handleFieldValidation,
        } as any);
      }
    }
    return child;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <StyledForm
        onSubmit={handleSubmit}
        {...props}
      >
      {enhancedChildren}
      
      <AnimatePresence>
        {submitSuccess && showSuccessMessage && (
          <SuccessMessage
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            ✓ {successMessage}
          </SuccessMessage>
        )}
      </AnimatePresence>
      </StyledForm>
    </motion.div>
  );
};

// Hook for accessing form context
export const useFormField = (name: string) => {
  return {
    onChange: (value: string) => {
      // This will be overridden by the Form component
    },
    onBlur: () => {
      // This will be overridden by the Form component
    },
    onValidation: (result: ValidationResult) => {
      // This will be overridden by the Form component
    },
  };
};