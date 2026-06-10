import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from '../HelpLayout';
import { Wand2, CreditCard as Edit, Zap, Settings, FileDown, Mic2, GitCompare, FileText, RefreshCw, Briefcase } from 'lucide-react';

const RealCaseWorkflowsIndex: React.FC = () => {
  const workflows = [
    {
      title: 'Quick Wizard: Create New Copy',
      icon: <Wand2 size={20} />,
      description: 'Use the wizard to generate fresh copy in under 60 seconds',
      link: '/help/real-case-workflows/quick-wizard-new-copy',
      difficulty: 'Beginner'
    },
    {
      title: 'Wizard: Improve Existing Copy',
      icon: <Edit size={20} />,
      description: 'Polish and enhance existing content with the wizard',
      link: '/help/real-case-workflows/wizard-improve-existing',
      difficulty: 'Beginner'
    },
    {
      title: 'Manual Setup: Core Fields',
      icon: <Zap size={20} />,
      description: 'Create copy manually by filling key form fields for targeted results',
      link: '/help/real-case-workflows/smart-mode-manual',
      difficulty: 'Intermediate'
    },
    {
      title: 'Full Field Configuration',
      icon: <Settings size={20} />,
      description: 'Leverage all available fields and advanced features for complex projects',
      link: '/help/real-case-workflows/expert-mode-deep-dive',
      difficulty: 'Advanced'
    },
    {
      title: 'Export Full Copy Package',
      icon: <FileDown size={20} />,
      description: 'Generate and export complete content with metadata',
      link: '/help/real-case-workflows/export-full-copy',
      difficulty: 'Intermediate'
    },
    {
      title: 'Generate Voice Variations',
      icon: <Mic2 size={20} />,
      description: 'Create multiple voice style versions of your copy',
      link: '/help/real-case-workflows/voice-variations',
      difficulty: 'Intermediate'
    },
    {
      title: 'Blending and Comparison',
      icon: <GitCompare size={20} />,
      description: 'Blend voices and compare outputs side-by-side',
      link: '/help/real-case-workflows/blending-and-comparison',
      difficulty: 'Advanced'
    },
    {
      title: 'Template Reuse Workflow',
      icon: <FileText size={20} />,
      description: 'Save and reuse successful configurations',
      link: '/help/real-case-workflows/template-reuse',
      difficulty: 'Beginner'
    },
    {
      title: 'Iterative Improvement',
      icon: <RefreshCw size={20} />,
      description: 'Refine copy through multiple generation cycles',
      link: '/help/real-case-workflows/iterative-improvement',
      difficulty: 'Intermediate'
    },
    {
      title: 'Full Production Example',
      icon: <Briefcase size={20} />,
      description: 'Complete end-to-end project from concept to export',
      link: '/help/real-case-workflows/full-production-example',
      difficulty: 'Advanced'
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200';
      case 'Intermediate':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200';
      case 'Advanced':
        return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <HelpLayout
      title="Real-Case Workflows"
      breadcrumbs={[{ label: 'Real-Case Workflows' }]}
    >
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-blue-800 dark:text-blue-200">
            Learn CopyZap through 10 complete, real-world workflows. Each example walks you through a full project from start to finish.
          </p>
        </div>

        <div className="space-y-4">
          {workflows.map((workflow, index) => (
            <Link
              key={index}
              to={workflow.link}
              className="group block bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 hover:border-primary-500 dark:hover:border-primary-400 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start flex-1">
                  <div className="text-primary-500 dark:text-primary-400 mr-4 mt-1">
                    {workflow.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary-500 dark:group-hover:text-primary-400 mb-2">
                      {workflow.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {workflow.description}
                    </p>
                  </div>
                </div>
                <span className={`ml-4 px-3 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(workflow.difficulty)}`}>
                  {workflow.difficulty}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </HelpLayout>
  );
};

export default RealCaseWorkflowsIndex;
