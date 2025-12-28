'use client';

import React, { useState } from 'react';
import { Typography } from '@/components/atoms/Typography';
import { Button } from '@/components/atoms/Button';
import { Card, CardContent } from '@/components/atoms/Card';
import { ResponsiveContainer } from '@/components/atoms/ResponsiveContainer';
import { ResponsiveGrid } from '@/components/atoms/ResponsiveGrid';
import { ErrorState, EmptyState, ContextualHelp, ErrorBoundary, ErrorRecoveryFlow } from '@/components/molecules';

// Component that throws an error for testing ErrorBoundary
const ErrorThrowingComponent: React.FC<{ shouldThrow: boolean }> = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('This is a test error for the ErrorBoundary demo');
  }
  
  return (
    <div className="p-5 text-center">
      <Typography variant="h5" className="text-green-600 mb-2">
        ✅ Component is working normally
      </Typography>
      <Typography variant="body2" color="muted">
        No errors detected. The ErrorBoundary is monitoring this component.
      </Typography>
    </div>
  );
};

export default function ErrorStatesPage() {
  const [selectedErrorType, setSelectedErrorType] = useState<'network' | 'validation' | 'permission' | 'notFound' | 'server' | 'timeout'>('network');
  const [selectedContext, setSelectedContext] = useState<'order-creation' | 'user-login' | 'data-loading' | 'file-upload' | 'payment-processing'>('order-creation');
  const [selectedEmptyType, setSelectedEmptyType] = useState<'no-orders' | 'no-notifications' | 'no-search-results' | 'no-couriers' | 'no-data'>('no-orders');
  const [showErrorBoundary, setShowErrorBoundary] = useState(false);
  const [showRecoveryFlow, setShowRecoveryFlow] = useState(false);

  const errorTypes = ['network', 'validation', 'permission', 'notFound', 'server', 'timeout'] as const;
  const contexts = ['order-creation', 'user-login', 'data-loading', 'file-upload', 'payment-processing'] as const;
  const emptyTypes = ['no-orders', 'no-notifications', 'no-search-results', 'no-couriers', 'no-data'] as const;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <ResponsiveContainer size="desktop">
        <div className="text-center mb-8">
          <Typography variant="h1" className="mb-4">
            Error States & Empty States
          </Typography>
          <Typography variant="body1" color="muted">
            Comprehensive error handling and empty state components with branded illustrations and helpful messaging.
          </Typography>
        </div>

        <div className="space-y-12">
          {/* Error States Section */}
          <section>
            <Typography variant="h2" className="mb-6">
              Error States
            </Typography>
            
            <Card variant="elevated" className="mb-6">
              <CardContent>
                <Typography variant="h4" className="mb-4">
                  Error State Controls
                </Typography>
                <Typography variant="body2" color="muted" className="mb-4">
                  Customize the error state to see different types and contexts in action.
                </Typography>
                
                <div className="space-y-4">
                  <div>
                    <Typography variant="caption" className="block mb-2">
                      Error Type:
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {errorTypes.map(type => (
                        <Button
                          key={type}
                          variant={selectedErrorType === type ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedErrorType(type)}
                        >
                          {type}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Typography variant="caption" className="block mb-2">
                      Context:
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {contexts.map(context => (
                        <Button
                          key={context}
                          variant={selectedContext === context ? 'secondary' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedContext(context)}
                        >
                          {context.replace('-', ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <ResponsiveGrid columns="single" gap="responsive">
              <Card variant="elevated" className="min-h-[300px]">
                <CardContent>
                  <ErrorState
                    type={selectedErrorType}
                    context={selectedContext}
                    onRetry={() => alert('Retry clicked!')}
                    onGoBack={() => alert('Go back clicked!')}
                    onContactSupport={() => alert('Contact support clicked!')}
                  />
                </CardContent>
              </Card>
            </ResponsiveGrid>
          </section>

          {/* Empty States Section */}
          <section>
            <Typography variant="h2" className="mb-6">
              Empty States
            </Typography>
            
            <Card variant="elevated" className="mb-6">
              <CardContent>
                <Typography variant="h4" className="mb-4">
                  Empty State Controls
                </Typography>
                <Typography variant="body2" color="muted" className="mb-4">
                  See different empty state variations with engaging illustrations and clear calls-to-action.
                </Typography>
                
                <div>
                  <Typography variant="caption" className="block mb-2">
                    Empty State Type:
                  </Typography>
                  <div className="flex flex-wrap gap-2">
                    {emptyTypes.map(type => (
                      <Button
                        key={type}
                        variant={selectedEmptyType === type ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedEmptyType(type)}
                      >
                        {type.replace('-', ' ')}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <ResponsiveGrid columns="single" gap="responsive">
              <Card variant="elevated" className="min-h-[300px]">
                <CardContent>
                  <EmptyState
                    type={selectedEmptyType}
                    primaryAction={{
                      text: 'Take Action',
                      onClick: () => alert('Primary action clicked!')
                    }}
                    secondaryAction={{
                      text: 'Learn More',
                      onClick: () => alert('Secondary action clicked!')
                    }}
                  />
                </CardContent>
              </Card>
            </ResponsiveGrid>
          </section>

          {/* Contextual Help Section */}
          <section>
            <Typography variant="h2" className="mb-6">
              Contextual Help
            </Typography>
            
            <ResponsiveGrid columns="double" gap="responsive">
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-4">
                    Order Creation Form
                  </Typography>
                  <Typography variant="body2" color="muted" className="mb-4">
                    This is a sample form with contextual help.
                  </Typography>
                  
                  <ContextualHelp context="order-creation" trigger="click">
                    <Typography variant="body1">
                      Need help with creating an order?
                    </Typography>
                  </ContextualHelp>
                </CardContent>
              </Card>
              
              <Card variant="elevated">
                <CardContent>
                  <Typography variant="h4" className="mb-4">
                    Payment Processing
                  </Typography>
                  <Typography variant="body2" color="muted" className="mb-4">
                    Hover over the help icon for quick tips.
                  </Typography>
                  
                  <ContextualHelp context="payment-processing" trigger="hover" position="top">
                    <Typography variant="body1">
                      Payment help (hover me)
                    </Typography>
                  </ContextualHelp>
                </CardContent>
              </Card>
            </ResponsiveGrid>
          </section>

          {/* Error Boundary Section */}
          <section>
            <Typography variant="h2" className="mb-6">
              Error Boundary
            </Typography>
            
            <Card variant="elevated" className="mb-6">
              <CardContent>
                <Typography variant="h4" className="mb-4">
                  Error Boundary Demo
                </Typography>
                <Typography variant="body2" color="muted" className="mb-4">
                  Test how the ErrorBoundary catches and handles component errors gracefully.
                </Typography>
                
                <Button
                  variant={showErrorBoundary ? 'outline' : 'primary'}
                  onClick={() => setShowErrorBoundary(!showErrorBoundary)}
                >
                  {showErrorBoundary ? 'Fix Component' : 'Throw Error'}
                </Button>
              </CardContent>
            </Card>

            <Card variant="elevated">
              <CardContent>
                <ErrorBoundary context="data-loading">
                  <ErrorThrowingComponent shouldThrow={showErrorBoundary} />
                </ErrorBoundary>
              </CardContent>
            </Card>
          </section>

          {/* Error Recovery Flow Section */}
          <section>
            <Typography variant="h2" className="mb-6">
              Error Recovery Flow
            </Typography>
            
            <Card variant="elevated" className="mb-6">
              <CardContent>
                <Typography variant="h4" className="mb-4">
                  Interactive Recovery Flow
                </Typography>
                <Typography variant="body2" color="muted" className="mb-4">
                  Experience the complete error recovery process with guided steps and support options.
                </Typography>
                
                <Button
                  variant="primary"
                  onClick={() => setShowRecoveryFlow(!showRecoveryFlow)}
                >
                  {showRecoveryFlow ? 'Hide Recovery Flow' : 'Show Recovery Flow'}
                </Button>
              </CardContent>
            </Card>

            {showRecoveryFlow && (
              <Card variant="elevated">
                <CardContent>
                  <ErrorRecoveryFlow
                    errorType={selectedErrorType}
                    context={selectedContext}
                    onRetry={() => alert('Retry from recovery flow!')}
                    onGoBack={() => alert('Go back from recovery flow!')}
                    onContactSupport={(details) => {
                      alert(`Support contacted with: ${details.email} - ${details.description}`);
                    }}
                    onReportBug={(details) => {
                      alert(`Bug reported: ${details.description}`);
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </ResponsiveContainer>
    </div>
  );
}