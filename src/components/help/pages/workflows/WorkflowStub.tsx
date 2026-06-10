import React from 'react';
import HelpLayout from '../../HelpLayout';

interface WorkflowStubProps {
  title: string;
  breadcrumb: string;
}

const WorkflowStub: React.FC<WorkflowStubProps> = ({ title, breadcrumb }) => {
  return (
    <HelpLayout
      title={title}
      breadcrumbs={[
        { label: 'Real-Case Workflows', path: '/help/real-case-workflows' },
        { label: breadcrumb }
      ]}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200">
            This workflow guide is coming soon. Check back later for detailed step-by-step instructions.
          </p>
        </div>
        <p className="text-gray-700 dark:text-gray-300">
          In the meantime, explore other workflows or visit the main <a href="/help" className="text-primary-600 dark:text-primary-400 hover:underline">Help Center</a>.
        </p>
      </div>
    </HelpLayout>
  );
};

export default WorkflowStub;
