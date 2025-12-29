/**
 * Performance Integration Tests
 * 
 * Integration tests that validate the complete performance optimization system
 * including component rendering, interactions, and code splitting working together.
 * 
 * Requirements: 8.3, 8.5
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from '@/components/providers/ThemeProvider';
import { defaultTheme } from '@/lib/theme';
import { PerformanceMonitor } from '@/lib/performanceOptimization';

// Import components for integration testing
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Card } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider defaultTheme={defaultTheme}>
    <div style={{ padding: '16px' }}>
      {children}
    </div>
  </ThemeProvider>
);

describe('Performance Integration Tests', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    jest.clearAllMocks();
    performanceMonitor = new PerformanceMonitor();
    
    // Mock performance APIs
    global.PerformanceObserver = jest.fn().mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: jest.fn(),
    })) as any;
    (global.PerformanceObserver as any).supportedEntryTypes = ['measure', 'navigation'];
  });

  afterEach(() => {
    performanceMonitor.destroy();
  });

  describe('End-to-End Performance Scenarios', () => {
    it('should handle a complete user workflow efficiently', async () => {
      const user = userEvent.setup();
      
      // Simulate a complete user workflow: form interaction, dynamic content, navigation
      const WorkflowComponent: React.FC = () => {
        const [formData, setFormData] = React.useState({ name: '', email: '' });
        const [items, setItems] = React.useState<string[]>([]);
        const [currentView, setCurrentView] = React.useState<'form' | 'list' | 'details'>('form');
        
        const handleFormSubmit = (e: React.FormEvent) => {
          e.preventDefault();
          setItems(prev => [...prev, `${formData.name} (${formData.email})`]);
          setCurrentView('list');
        };
        
        const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
          setFormData(prev => ({ ...prev, [field]: e.target.value }));
        };
        
        return (
          <TestWrapper>
            <div data-testid="workflow-container">
              {/* Navigation */}
              <div style={{ marginBottom: '16px' }}>
                <Button 
                  variant={currentView === 'form' ? 'primary' : 'outline'}
                  onClick={() => setCurrentView('form')}
                  data-testid="nav-form"
                >
                  Form
                </Button>
                <Button 
                  variant={currentView === 'list' ? 'primary' : 'outline'}
                  onClick={() => setCurrentView('list')}
                  data-testid="nav-list"
                  style={{ marginLeft: '8px' }}
                >
                  List ({items.length})
                </Button>
                <Button 
                  variant={currentView === 'details' ? 'primary' : 'outline'}
                  onClick={() => setCurrentView('details')}
                  data-testid="nav-details"
                  style={{ marginLeft: '8px' }}
                >
                  Details
                </Button>
              </div>
              
              {/* Form View */}
              {currentView === 'form' && (
                <Card variant="default" padding="md" data-testid="form-view">
                  <Typography variant="h3">Add New Item</Typography>
                  <form onSubmit={handleFormSubmit}>
                    <Input
                      label="Name"
                      value={formData.name}
                      onChange={handleInputChange('name')}
                      data-testid="name-input"
                      style={{ marginBottom: '16px' }}
                    />
                    <Input
                      label="Email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange('email')}
                      data-testid="email-input"
                      style={{ marginBottom: '16px' }}
                    />
                    <Button type="submit" variant="primary" data-testid="submit-button">
                      Add Item
                    </Button>
                  </form>
                </Card>
              )}
              
              {/* List View */}
              {currentView === 'list' && (
                <div data-testid="list-view">
                  <Typography variant="h3">Items ({items.length})</Typography>
                  {items.map((item, index) => (
                    <Card key={index} variant="default" padding="sm" style={{ marginBottom: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body1">{item}</Typography>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setItems(prev => prev.filter((_, i) => i !== index))}
                          data-testid={`remove-${index}`}
                        >
                          Remove
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              {/* Details View */}
              {currentView === 'details' && (
                <Card variant="default" padding="md" data-testid="details-view">
                  <Typography variant="h3">Statistics</Typography>
                  <Typography variant="body1">Total Items: {items.length}</Typography>
                  <Typography variant="body1">Form Data: {JSON.stringify(formData)}</Typography>
                </Card>
              )}
            </div>
          </TestWrapper>
        );
      };
      
      const startTime = performance.now();
      
      render(<WorkflowComponent />);
      
      // Step 1: Fill out form
      const nameInput = screen.getByTestId('name-input');
      const emailInput = screen.getByTestId('email-input');
      const submitButton = screen.getByTestId('submit-button');
      
      await user.type(nameInput, 'John Doe');
      await user.type(emailInput, 'john@example.com');
      await user.click(submitButton);
      
      // Step 2: Verify navigation to list view
      expect(screen.getByTestId('list-view')).toBeInTheDocument();
      expect(screen.getByText('John Doe (john@example.com)')).toBeInTheDocument();
      
      // Step 3: Add more items by navigating back to form
      await user.click(screen.getByTestId('nav-form'));
      
      const nameInput2 = screen.getByTestId('name-input');
      const emailInput2 = screen.getByTestId('email-input');
      
      await user.clear(nameInput2);
      await user.clear(emailInput2);
      await user.type(nameInput2, 'Jane Smith');
      await user.type(emailInput2, 'jane@example.com');
      await user.click(screen.getByTestId('submit-button'));
      
      // Step 4: Navigate between views
      await user.click(screen.getByTestId('nav-details'));
      expect(screen.getByTestId('details-view')).toBeInTheDocument();
      expect(screen.getByText('Total Items: 2')).toBeInTheDocument();
      
      await user.click(screen.getByTestId('nav-list'));
      expect(screen.getByTestId('list-view')).toBeInTheDocument();
      
      // Step 5: Remove an item
      await user.click(screen.getByTestId('remove-0'));
      expect(screen.queryByText('John Doe (john@example.com)')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith (jane@example.com)')).toBeInTheDocument();
      
      const endTime = performance.now();
      const totalWorkflowTime = endTime - startTime;
      
      // Complete workflow should finish within 2 seconds
      expect(totalWorkflowTime).toBeLessThan(2000);
    });

    it('should maintain performance with concurrent operations', async () => {
      const user = userEvent.setup();
      
      const ConcurrentOperationsComponent: React.FC = () => {
        const [counters, setCounters] = React.useState<number[]>([0, 0, 0]);
        const [text, setText] = React.useState('');
        const [items, setItems] = React.useState<string[]>([]);
        
        const incrementCounter = (index: number) => {
          setCounters(prev => prev.map((count, i) => i === index ? count + 1 : count));
        };
        
        const addItem = () => {
          if (text.trim()) {
            setItems(prev => [...prev, text.trim()]);
            setText('');
          }
        };
        
        return (
          <TestWrapper>
            <div data-testid="concurrent-operations">
              {/* Multiple counters */}
              <div style={{ marginBottom: '16px' }}>
                {counters.map((count, index) => (
                  <Card key={index} variant="default" padding="sm" style={{ display: 'inline-block', margin: '4px' }}>
                    <Typography variant="h4">Counter {index + 1}: {count}</Typography>
                    <Button 
                      onClick={() => incrementCounter(index)}
                      data-testid={`counter-${index}`}
                      size="sm"
                    >
                      +1
                    </Button>
                  </Card>
                ))}
              </div>
              
              {/* Text input and dynamic list */}
              <div style={{ marginBottom: '16px' }}>
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  label="Add Item"
                  data-testid="text-input"
                />
                <Button onClick={addItem} data-testid="add-item" style={{ marginLeft: '8px' }}>
                  Add
                </Button>
              </div>
              
              {/* Dynamic list */}
              <div>
                {items.map((item, index) => (
                  <Card key={index} variant="outlined" padding="sm" style={{ marginBottom: '4px' }}>
                    <Typography variant="body1">{item}</Typography>
                  </Card>
                ))}
              </div>
            </div>
          </TestWrapper>
        );
      };
      
      const startTime = performance.now();
      
      render(<ConcurrentOperationsComponent />);
      
      // Perform multiple concurrent operations
      const promises = [];
      
      // Increment counters rapidly
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 10; j++) {
          promises.push(user.click(screen.getByTestId(`counter-${i}`)));
        }
      }
      
      // Add items while counters are being incremented
      const textInput = screen.getByTestId('text-input');
      const addButton = screen.getByTestId('add-item');
      
      for (let i = 0; i < 5; i++) {
        await user.type(textInput, `Item ${i + 1}`);
        await user.click(addButton);
        await user.clear(textInput); // Clear input after each addition
      }
      
      // Wait for all operations to complete
      await Promise.all(promises);
      
      const endTime = performance.now();
      const concurrentOperationsTime = endTime - startTime;
      
      // Concurrent operations should complete within 3 seconds
      expect(concurrentOperationsTime).toBeLessThan(3000);
      
      // Verify final state
      expect(screen.getByText('Counter 1: 10')).toBeInTheDocument();
      expect(screen.getByText('Counter 2: 10')).toBeInTheDocument();
      expect(screen.getByText('Counter 3: 10')).toBeInTheDocument();
      expect(screen.getByText('Item 5')).toBeInTheDocument();
    });

    it('should handle performance monitoring during complex interactions', async () => {
      const user = userEvent.setup();
      
      const MonitoredComponent: React.FC = () => {
        const [data, setData] = React.useState<Array<{ id: number; name: string; active: boolean }>>([]);
        
        const generateData = () => {
          const newData = Array.from({ length: 50 }, (_, i) => ({
            id: i,
            name: `Item ${i + 1}`,
            active: Math.random() > 0.5,
          }));
          setData(newData);
        };
        
        const toggleItem = (id: number) => {
          setData(prev => prev.map(item => 
            item.id === id ? { ...item, active: !item.active } : item
          ));
        };
        
        return (
          <TestWrapper>
            <div data-testid="monitored-component">
              <Button onClick={generateData} data-testid="generate-data">
                Generate Data
              </Button>
              
              <div style={{ marginTop: '16px' }}>
                {data.map(item => (
                  <Card 
                    key={item.id} 
                    variant={item.active ? 'default' : 'outlined'} 
                    padding="sm"
                    style={{ marginBottom: '4px' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body1">{item.name}</Typography>
                      <Button
                        variant={item.active ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => toggleItem(item.id)}
                        data-testid={`toggle-${item.id}`}
                      >
                        {item.active ? 'Active' : 'Inactive'}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TestWrapper>
        );
      };
      
      render(<MonitoredComponent />);
      
      // Measure data generation performance
      const generateButton = screen.getByTestId('generate-data');
      
      const generateStartTime = performance.now();
      await user.click(generateButton);
      const generateEndTime = performance.now();
      
      const generateTime = generateEndTime - generateStartTime;
      expect(generateTime).toBeLessThan(200); // Data generation should be fast
      
      // Verify data was generated
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 50')).toBeInTheDocument();
      
      // Measure interaction performance with multiple items
      const interactionStartTime = performance.now();
      
      // Toggle multiple items
      for (let i = 0; i < 10; i++) {
        const toggleButton = screen.getByTestId(`toggle-${i}`);
        await user.click(toggleButton);
      }
      
      const interactionEndTime = performance.now();
      const interactionTime = interactionEndTime - interactionStartTime;
      
      // Multiple interactions should complete within 500ms
      expect(interactionTime).toBeLessThan(500);
    });
  });

  describe('Performance Monitoring Integration', () => {
    it('should provide accurate performance measurements for real workflows', () => {
      const ComplexComponent: React.FC = () => {
        const [state, setState] = React.useState({ count: 0, items: [] as string[] });
        
        return (
          <TestWrapper>
            <div data-testid="complex-component">
              <Typography variant="h2">Count: {state.count}</Typography>
              <Button 
                onClick={() => setState(prev => ({ ...prev, count: prev.count + 1 }))}
                data-testid="increment"
              >
                Increment
              </Button>
              {state.items.map((item, index) => (
                <Card key={index} variant="default" padding="sm">
                  <Typography variant="body1">{item}</Typography>
                </Card>
              ))}
            </div>
          </TestWrapper>
        );
      };
      
      // Measure component rendering with performance monitor
      const renderResult = performanceMonitor.measureComponentRender('ComplexComponent', () => {
        return render(<ComplexComponent />);
      });
      
      expect(renderResult).toBeTruthy();
      
      // Measure interaction with performance monitor
      const button = screen.getByTestId('increment');
      
      const interactionResult = performanceMonitor.measureInteraction('ButtonClick', () => {
        fireEvent.click(button);
      });
      
      expect(interactionResult).toBeUndefined(); // measureInteraction doesn't return the result
      
      // Verify metrics were recorded
      const metrics = performanceMonitor.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      
      const renderMetric = metrics.find(m => m.componentRenderTime !== undefined);
      const interactionMetric = metrics.find(m => m.interactionTime !== undefined);
      
      expect(renderMetric).toBeTruthy();
      expect(interactionMetric).toBeTruthy();
      
      // Verify performance is within acceptable bounds
      expect(renderMetric!.componentRenderTime).toBeLessThan(50);
      expect(interactionMetric!.interactionTime).toBeLessThan(20);
    });

    it('should validate performance thresholds in real-time', () => {
      // Mock some performance metrics
      performanceMonitor['metrics'] = [
        {
          fcp: 1200,
          lcp: 2000,
          fid: 50,
          cls: 0.05,
          componentRenderTime: 12,
          interactionTime: 8,
          timestamp: Date.now(),
        }
      ];
      
      const validation = performanceMonitor.validatePerformance();
      
      expect(validation.passed).toBe(true);
      expect(validation.failures).toHaveLength(0);
      expect(validation.metrics).toBeTruthy();
      expect(validation.metrics!.fcp).toBe(1200);
      expect(validation.metrics!.lcp).toBe(2000);
    });
  });

  describe('Code Splitting Integration', () => {
    it('should work seamlessly with lazy-loaded components in real scenarios', async () => {
      const LazyDashboard = React.lazy(() => 
        Promise.resolve({
          default: () => (
            <Card data-testid="lazy-dashboard">
              <Typography variant="h2">Dashboard</Typography>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                {Array.from({ length: 4 }, (_, i) => (
                  <Card key={i} variant="outlined" padding="md">
                    <Typography variant="h4">Widget {i + 1}</Typography>
                    <Typography variant="body1">Widget content {i + 1}</Typography>
                    <Button size="sm">Action</Button>
                  </Card>
                ))}
              </div>
            </Card>
          )
        })
      );
      
      const LazySettings = React.lazy(() => 
        Promise.resolve({
          default: () => (
            <Card data-testid="lazy-settings">
              <Typography variant="h2">Settings</Typography>
              <Input label="Setting 1" />
              <Input label="Setting 2" />
              <Button variant="primary">Save Settings</Button>
            </Card>
          )
        })
      );
      
      const AppWithLazyComponents: React.FC = () => {
        const [currentView, setCurrentView] = React.useState<'dashboard' | 'settings' | null>(null);
        
        return (
          <TestWrapper>
            <div data-testid="app-with-lazy">
              <div style={{ marginBottom: '16px' }}>
                <Button 
                  onClick={() => setCurrentView('dashboard')}
                  data-testid="load-dashboard"
                >
                  Load Dashboard
                </Button>
                <Button 
                  onClick={() => setCurrentView('settings')}
                  data-testid="load-settings"
                  style={{ marginLeft: '8px' }}
                >
                  Load Settings
                </Button>
              </div>
              
              <React.Suspense fallback={<div data-testid="loading">Loading...</div>}>
                {currentView === 'dashboard' && <LazyDashboard />}
                {currentView === 'settings' && <LazySettings />}
              </React.Suspense>
            </div>
          </TestWrapper>
        );
      };
      
      const user = userEvent.setup();
      render(<AppWithLazyComponents />);
      
      // Test lazy loading performance
      const dashboardButton = screen.getByTestId('load-dashboard');
      
      const loadStartTime = performance.now();
      await user.click(dashboardButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('lazy-dashboard')).toBeInTheDocument();
      });
      
      const loadEndTime = performance.now();
      const loadTime = loadEndTime - loadStartTime;
      
      // Lazy loading should be fast (adjusted for test environment)
      expect(loadTime).toBeLessThan(400);
      
      // Verify dashboard is fully functional
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Widget 1')).toBeInTheDocument();
      expect(screen.getByText('Widget 4')).toBeInTheDocument();
      
      // Test switching to another lazy component
      const settingsButton = screen.getByTestId('load-settings');
      
      const switchStartTime = performance.now();
      await user.click(settingsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('lazy-settings')).toBeInTheDocument();
      });
      
      const switchEndTime = performance.now();
      const switchTime = switchEndTime - switchStartTime;
      
      // Switching between lazy components should be fast (adjusted for test environment)
      expect(switchTime).toBeLessThan(400);
      
      // Verify settings is fully functional
      expect(screen.getByText('Settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Setting 1')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument();
    });
  });
});