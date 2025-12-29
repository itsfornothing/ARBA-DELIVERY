/**
 * TypeScript Monitoring Dashboard Page
 * 
 * Provides a comprehensive view of TypeScript code quality metrics,
 * trends, and alerts for the maintenance system.
 */

import React from 'react';
import { TypeScriptMonitoringDashboard } from '@/components/molecules/TypeScriptMonitoringDashboard';

export default function MonitoringPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <TypeScriptMonitoringDashboard 
          autoRefresh={true}
          refreshInterval={30000}
          showAlerts={true}
          alertConfig={{
            errorThreshold: 10,
            warningThreshold: 20,
            performanceThreshold: 60.0
          }}
        />
      </div>
    </div>
  );
}
