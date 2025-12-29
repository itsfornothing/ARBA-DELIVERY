# TypeScript Best Practices Guide

This guide outlines the TypeScript coding standards and best practices for the Mohamedo frontend project. Following these practices ensures code quality, maintainability, and team consistency.

## 🎯 Core Principles

1. **Type Safety First**: Leverage TypeScript's type system to catch errors at compile time
2. **Explicit Over Implicit**: Be explicit about types when it improves code clarity
3. **Consistency**: Follow established patterns and naming conventions
4. **Performance**: Write efficient TypeScript that compiles to optimal JavaScript
5. **Maintainability**: Code should be easy to read, understand, and modify

## 📝 Naming Conventions

### Variables and Functions
```typescript
// ✅ Good: camelCase for variables and functions
const userAge = 25;
const userName = 'john_doe';

function calculateTotalPrice(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Bad: Inconsistent naming
const user_age = 25;
const UserName = 'john_doe';

function Calculate_Total_Price(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### Types and Interfaces
```typescript
// ✅ Good: PascalCase for types and interfaces
interface UserProfile {
  id: string;
  name: string;
  email: string;
  preferences: UserPreferences;
}

type OrderStatus = 'pending' | 'confirmed' | 'delivered' | 'cancelled';

// ❌ Bad: Inconsistent type naming
interface userProfile {
  id: string;
  name: string;
}

type orderStatus = 'pending' | 'confirmed';
```

### Constants and Enums
```typescript
// ✅ Good: UPPER_CASE for constants, PascalCase for enums
const MAX_RETRY_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled'
}

// ❌ Bad: Inconsistent constant naming
const maxRetryAttempts = 3;
const apiBaseUrl = 'https://api.example.com';

enum orderStatus {
  pending = 'pending',
  confirmed = 'confirmed'
}
```

### React Components
```typescript
// ✅ Good: PascalCase for components, descriptive names
interface OrderSummaryProps {
  order: Order;
  onUpdate: (order: Order) => void;
}

export function OrderSummary({ order, onUpdate }: OrderSummaryProps): JSX.Element {
  return (
    <div className="order-summary">
      {/* Component content */}
    </div>
  );
}

// ❌ Bad: Inconsistent component naming
interface orderSummaryProps {
  order: Order;
}

export function orderSummary({ order }: orderSummaryProps) {
  return <div>{/* content */}</div>;
}
```

## 🔧 Type Definitions

### Interface vs Type Aliases
```typescript
// ✅ Good: Use interfaces for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Use type aliases for unions, primitives, and computed types
type Status = 'loading' | 'success' | 'error';
type UserWithStatus = User & { status: Status };

// ❌ Bad: Using type for simple object shapes when interface is clearer
type User = {
  id: string;
  name: string;
  email: string;
};
```

### Explicit Return Types
```typescript
// ✅ Good: Explicit return types for public functions
export function fetchUserData(userId: string): Promise<User> {
  return api.get(`/users/${userId}`);
}

export function calculateDiscount(price: number, percentage: number): number {
  return price * (percentage / 100);
}

// ✅ Acceptable: Implicit return types for simple, obvious cases
const isValidEmail = (email: string) => email.includes('@');

// ❌ Bad: Missing return types for complex functions
export function processOrderData(orders) {
  return orders.map(order => ({
    ...order,
    total: order.items.reduce((sum, item) => sum + item.price, 0)
  }));
}
```

### Generic Constraints
```typescript
// ✅ Good: Use generic constraints for type safety
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

function updateEntity<T extends { id: string; updatedAt?: Date }>(
  entity: T,
  updates: Partial<Omit<T, 'id'>>
): T {
  return {
    ...entity,
    ...updates,
    updatedAt: new Date()
  };
}

// ❌ Bad: Overly generic without constraints
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}
```

## 🚫 Avoiding Common Pitfalls

### The `any` Type
```typescript
// ✅ Good: Use specific types or unknown
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

function processApiResponse<T>(response: unknown): ApiResponse<T> {
  if (isApiResponse(response)) {
    return response as ApiResponse<T>;
  }
  throw new Error('Invalid API response');
}

// ❌ Bad: Using any defeats the purpose of TypeScript
function processApiResponse(response: any): any {
  return response.data;
}
```

### Non-null Assertions
```typescript
// ✅ Good: Proper null checking
function getUserName(user: User | null): string {
  if (!user) {
    return 'Anonymous';
  }
  return user.name;
}

// ✅ Good: Using optional chaining
const userName = user?.name ?? 'Anonymous';

// ❌ Bad: Non-null assertion without proper checking
function getUserName(user: User | null): string {
  return user!.name; // Dangerous!
}
```

### Type Assertions
```typescript
// ✅ Good: Type guards for safe type assertions
function isUser(obj: unknown): obj is User {
  return typeof obj === 'object' && 
         obj !== null && 
         'id' in obj && 
         'name' in obj;
}

function processUser(data: unknown): void {
  if (isUser(data)) {
    console.log(data.name); // Safe to access
  }
}

// ❌ Bad: Unsafe type assertions
function processUser(data: unknown): void {
  const user = data as User; // Dangerous!
  console.log(user.name);
}
```

## 🏗️ Code Organization

### Import/Export Patterns
```typescript
// ✅ Good: Organized imports with type imports
import type { User, Order } from '@/types';
import type { ComponentProps } from 'react';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

// ✅ Good: Named exports for utilities
export function calculateTax(amount: number, rate: number): number {
  return amount * rate;
}

export function formatOrderDate(date: Date): string {
  return date.toLocaleDateString();
}

// ✅ Good: Default export for main component
export default function OrderPage(): JSX.Element {
  // Component implementation
}

// ❌ Bad: Mixed import styles
import React, { useState } from 'react';
import { User } from '@/types';
import type { Order } from '@/types';
```

### File Structure
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   ├── forms/           # Form-specific components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions and configurations
├── types/               # Type definitions
├── services/            # API and external service integrations
└── __tests__/           # Test files
```

## 🧪 Testing Best Practices

### Unit Tests
```typescript
// ✅ Good: Well-typed test with clear assertions
describe('calculateDiscount', () => {
  it('should calculate percentage discount correctly', () => {
    const result = calculateDiscount(100, 10);
    expect(result).toBe(10);
  });

  it('should handle zero discount', () => {
    const result = calculateDiscount(100, 0);
    expect(result).toBe(0);
  });
});
```

### Property-Based Tests
```typescript
// ✅ Good: Property test with proper generators
import fc from 'fast-check';

describe('calculateDiscount property tests', () => {
  it('should never return negative discount', () => {
    fc.assert(fc.property(
      fc.float({ min: 0, max: 1000 }),
      fc.float({ min: 0, max: 100 }),
      (price, percentage) => {
        const discount = calculateDiscount(price, percentage);
        expect(discount).toBeGreaterThanOrEqual(0);
      }
    ));
  });
});
```

## 🎨 React Component Patterns

### Props Interface Design
```typescript
// ✅ Good: Well-defined props with optional properties
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'medium',
  disabled = false,
  onClick,
  className 
}: ButtonProps): JSX.Element {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${className || ''}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Custom Hooks
```typescript
// ✅ Good: Well-typed custom hook
interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(url: string): UseApiResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<T>(url);
      setData(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

## 🔧 Utility Functions

### Type Guards
```typescript
// ✅ Good: Comprehensive type guards
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNonEmptyArray<T>(value: T[]): value is [T, ...T[]] {
  return Array.isArray(value) && value.length > 0;
}

export function hasProperty<K extends string>(
  obj: unknown,
  key: K
): obj is Record<K, unknown> {
  return typeof obj === 'object' && obj !== null && key in obj;
}
```

### Error Handling
```typescript
// ✅ Good: Typed error handling
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function fetchWithErrorHandling<T>(
  url: string
): Promise<T> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        await response.json().catch(() => null)
      );
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0, error);
  }
}
```

## 📊 Performance Considerations

### Lazy Loading
```typescript
// ✅ Good: Lazy loading with proper types
import { lazy, Suspense } from 'react';
import type { ComponentType } from 'react';

const LazyOrderDetails = lazy(() => import('./OrderDetails'));

interface LazyComponentWrapperProps {
  component: ComponentType<any>;
  fallback?: React.ReactNode;
}

export function LazyComponentWrapper({ 
  component: Component, 
  fallback = <div>Loading...</div> 
}: LazyComponentWrapperProps): JSX.Element {
  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
}
```

### Memoization
```typescript
// ✅ Good: Proper memoization with dependencies
import { useMemo, useCallback } from 'react';

interface ExpensiveCalculationProps {
  data: number[];
  multiplier: number;
}

export function ExpensiveCalculation({ 
  data, 
  multiplier 
}: ExpensiveCalculationProps): JSX.Element {
  const processedData = useMemo(() => {
    return data.map(value => value * multiplier);
  }, [data, multiplier]);

  const handleClick = useCallback(() => {
    console.log('Processed data:', processedData);
  }, [processedData]);

  return (
    <div>
      <button onClick={handleClick}>Show Data</button>
      {/* Render processed data */}
    </div>
  );
}
```

## 🔍 Code Review Guidelines

### What to Look For
1. **Type Safety**: Are all types properly defined and used?
2. **Naming**: Do names follow our conventions?
3. **Error Handling**: Are errors properly typed and handled?
4. **Performance**: Are there unnecessary re-renders or computations?
5. **Testing**: Are there appropriate tests for the functionality?

### Common Review Comments
```typescript
// 🔍 Review: Consider using a more specific type
// Instead of: data: any
// Suggest: data: User[] | null

// 🔍 Review: Add error handling
// Instead of: const user = await fetchUser(id);
// Suggest: 
try {
  const user = await fetchUser(id);
  // handle success
} catch (error) {
  // handle error
}

// 🔍 Review: Extract this to a custom hook
// Instead of: Duplicated useEffect logic
// Suggest: Create useApi hook
```

## 📚 Additional Resources

### TypeScript Documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Do's and Don'ts](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)

### React + TypeScript
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript React Patterns](https://github.com/typescript-cheatsheets/react)

### Testing
- [Jest with TypeScript](https://jestjs.io/docs/getting-started#using-typescript)
- [Property-Based Testing](https://github.com/dubzzz/fast-check)

## ✅ Best Practices Checklist

Before submitting code, ensure:

- [ ] All functions have explicit return types
- [ ] No use of `any` without justification
- [ ] Proper error handling with typed errors
- [ ] Consistent naming conventions followed
- [ ] Type guards used for runtime type checking
- [ ] Interfaces used for object shapes
- [ ] Type aliases used for unions and computed types
- [ ] Generic constraints applied where appropriate
- [ ] Imports organized with type imports separated
- [ ] Tests written with proper type annotations

---

*Best practices guide last updated: December 2024*