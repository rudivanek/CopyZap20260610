import React from 'react';
import { Activity } from 'lucide-react';

interface UsageAuditPanelProps {
  dateRange: { start: string; end: string };
  userId?: string;
}

export function UsageAuditPanel({ dateRange, userId }: UsageAuditPanelProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Usage Audit (Admin Only)
        </h2>
      </div>
    </div>
  );
}
