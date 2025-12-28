/**
 * Responsive Table Component
 * Provides mobile-first table layouts with card fallback for small screens
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/atoms/Card';
import { Typography } from '@/components/atoms/Typography';
import { getResponsiveTableClasses } from '@/lib/responsive';

export interface TableColumn {
  key: string;
  label: string;
  className?: string;
  render?: (value: any, row: any) => React.ReactNode;
}

export interface ResponsiveTableProps {
  columns: TableColumn[];
  data: any[];
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
}

const ResponsiveTable: React.FC<ResponsiveTableProps> = ({
  columns,
  data,
  className,
  emptyMessage = 'No data available',
  loading = false,
}) => {
  const tableClasses = getResponsiveTableClasses();

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Mobile Loading Cards */}
        <div className={tableClasses.mobileCard}>
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent>
                <div className="space-y-3">
                  {columns.slice(0, 3).map((_, j) => (
                    <div key={j} className="flex justify-between">
                      <div className="h-4 bg-neutral-200 rounded w-1/3"></div>
                      <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop Loading Table */}
        <div className={tableClasses.desktopTable}>
          <div className={tableClasses.container}>
            <table className={tableClasses.table}>
              <thead className="bg-neutral-50">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
                    >
                      <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse"></div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutral-200">
                {[1, 2, 3].map((i) => (
                  <tr key={i}>
                    {columns.map((column) => (
                      <td key={column.key} className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 bg-neutral-200 rounded w-24 animate-pulse"></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <Typography variant="body1" color="muted">
            {emptyMessage}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mobile Card Layout */}
      <div className={tableClasses.mobileCard}>
        {data.map((row, index) => (
          <Card key={index} variant="outlined">
            <CardContent>
              <div className="space-y-3">
                {columns.map((column) => {
                  const value = row[column.key];
                  const displayValue = column.render ? column.render(value, row) : value;
                  
                  return (
                    <div key={column.key} className="flex justify-between items-start">
                      <Typography variant="caption" weight="medium" className="text-neutral-600 min-w-0 flex-shrink-0 mr-4">
                        {column.label}:
                      </Typography>
                      <div className="text-right min-w-0 flex-1">
                        {typeof displayValue === 'string' ? (
                          <Typography variant="body2" className="break-words">
                            {displayValue}
                          </Typography>
                        ) : (
                          displayValue
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className={tableClasses.desktopTable}>
        <div className={tableClasses.container}>
          <table className={tableClasses.table}>
            <thead className="bg-neutral-50">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider',
                      column.className
                    )}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutral-200">
              {data.map((row, index) => (
                <tr key={index} className="hover:bg-neutral-50 transition-colors">
                  {columns.map((column) => {
                    const value = row[column.key];
                    const displayValue = column.render ? column.render(value, row) : value;
                    
                    return (
                      <td
                        key={column.key}
                        className={cn(
                          'px-6 py-4 whitespace-nowrap text-sm text-neutral-900',
                          column.className
                        )}
                      >
                        {displayValue}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export { ResponsiveTable };