import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, Menu, X } from 'lucide-react';
import PublicFooter from '../PublicFooter';
import TopNavigation from '../pages/TopNavigation';
import BetaRegistrationModal from '../BetaRegistrationModal';
import HelpSearch from './HelpSearch';
import HelpSidebar from './HelpSidebar';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface HelpLayoutProps {
  title: string;
  breadcrumbs: BreadcrumbItem[];
  children: React.ReactNode;
  sidebar?: React.ReactNode;
  hideSearch?: boolean;
  hideSidebar?: boolean;
}

const HelpLayout: React.FC<HelpLayoutProps> = ({ title, breadcrumbs, children, sidebar, hideSearch = false, hideSidebar = false }) => {
  const [isBetaModalOpen, setIsBetaModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="help-center-root min-h-screen bg-white dark:bg-black" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Top Navigation */}
      <TopNavigation onOpenBetaModal={() => setIsBetaModalOpen(true)} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
        {/* Mobile Sidebar Toggle Button - Only shown when sidebar is not hidden */}
        {!hideSidebar && (
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="lg:hidden mb-4 flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
          >
            <Menu size={20} />
            <span className="font-medium">Browse Help Topics</span>
          </button>
        )}

        {/* Search Bar - appears on all help pages except Help Center landing */}
        {!hideSearch && (
          <div className="mb-6 max-w-2xl mx-auto">
            <HelpSearch compact />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Desktop Sidebar - Always visible on desktop */}
          {!hideSidebar && (
            <aside className="hidden lg:block lg:w-72 flex-shrink-0">
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
                <HelpSidebar />
              </div>
            </aside>
          )}

          {/* Mobile Sidebar Drawer */}
          {!hideSidebar && isMobileSidebarOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                onClick={() => setIsMobileSidebarOpen(false)}
              />
              {/* Drawer */}
              <aside className="fixed inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 z-50 lg:hidden overflow-y-auto shadow-2xl">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Help Topics</h2>
                    <button
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      aria-label="Close sidebar"
                    >
                      <X size={20} className="text-gray-500" />
                    </button>
                  </div>
                  <HelpSidebar />
                </div>
              </aside>
            </>
          )}

          {/* Custom Sidebar (legacy support) */}
          {sidebar && (
            <aside className="lg:w-64 flex-shrink-0">
              <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 sticky top-4">
                {sidebar}
              </div>
            </aside>
          )}

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <article className="help-center-content bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-8">
              <h1 className="text-3xl font-semibold text-gray-900 dark:text-white mb-4" style={{ fontSize: '32px', lineHeight: '1.2' }}>
                {title}
              </h1>
              <div className="help-center-body prose prose-gray dark:prose-invert max-w-none">
                {children}
              </div>
            </article>

            {/* Footer Navigation */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-800 mb-8">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <Link
                  to="/help"
                  className="hover:text-primary-500 dark:hover:text-primary-400 font-medium"
                >
                  ← Back to Help Center
                </Link>
                <a
                  href="mailto:privacy@copyzap.com?subject=Documentation Feedback"
                  className="hover:text-primary-500 dark:hover:text-primary-400 font-medium"
                >
                  Suggest Edit
                </a>
              </div>
            </div>
          </main>
        </div>

        <div className="mt-12">
          <PublicFooter />
        </div>
      </div>

      {/* Beta Registration Modal */}
      <BetaRegistrationModal
        isOpen={isBetaModalOpen}
        onClose={() => setIsBetaModalOpen(false)}
      />

      {/* Fixed Bottom Breadcrumb */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-3 px-4 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <Link to="/help" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            Help
          </Link>
          {breadcrumbs.map((item, index) => (
            <React.Fragment key={index}>
              <span className="text-gray-300 dark:text-gray-600">/</span>
              {item.path ? (
                <Link to={item.path} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {item.label}
                </Link>
              ) : (
                <span className="text-gray-900 dark:text-gray-100 font-medium">{item.label}</span>
              )}
            </React.Fragment>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default HelpLayout;
