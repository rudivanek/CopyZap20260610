import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Home } from 'lucide-react';

interface HelpTopic {
  slug: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  section: string;
  url: string;
  group?: string;
  order?: number;
}

interface GroupedTopics {
  [key: string]: HelpTopic[];
}

const groupDisplayNames: Record<string, string> = {
  'getting-started': 'Getting Started',
  'core': 'Core Features',
  'advanced': 'Advanced',
  'account': 'Account & System',
  'tutorials': 'Tutorials',
  'reference': 'Reference',
  'support': 'Support'
};

const groupOrder = ['getting-started', 'core', 'advanced', 'account', 'tutorials', 'reference', 'support'];

const HelpSidebar: React.FC = () => {
  const location = useLocation();
  const [topics, setTopics] = useState<HelpTopic[]>([]);
  const [groupedTopics, setGroupedTopics] = useState<GroupedTopics>({});
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopics = async () => {
      try {
        const response = await fetch('/docs/help-index.json');
        const data: HelpTopic[] = await response.json();
        setTopics(data);

        // Group topics by group field
        const grouped: GroupedTopics = {};
        data.forEach(topic => {
          const group = topic.group || 'other';
          if (!grouped[group]) {
            grouped[group] = [];
          }
          grouped[group].push(topic);
        });

        // Sort topics within each group by order then title
        Object.keys(grouped).forEach(group => {
          grouped[group].sort((a, b) => {
            if (a.order !== undefined && b.order !== undefined) {
              if (a.order !== b.order) return a.order - b.order;
            }
            return a.title.localeCompare(b.title);
          });
        });

        setGroupedTopics(grouped);
      } catch (error) {
        console.error('Failed to load help topics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  const toggleGroup = (group: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(group)) {
        newSet.delete(group);
      } else {
        newSet.add(group);
      }
      return newSet;
    });
  };

  const isActive = (url: string): boolean => {
    return location.pathname === url;
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
        Loading navigation...
      </div>
    );
  }

  return (
    <nav className="help-sidebar">
      {/* Help Home Link */}
      <Link
        to="/help"
        className={`flex items-center gap-2 px-3 py-2 mb-4 rounded-lg text-sm font-medium transition-colors ${
          location.pathname === '/help'
            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
        }`}
      >
        <Home size={16} />
        <span>Help Home</span>
      </Link>

      {/* Grouped Navigation */}
      <div className="space-y-1">
        {groupOrder.map(groupKey => {
          if (!groupedTopics[groupKey] || groupedTopics[groupKey].length === 0) {
            return null;
          }

          const isCollapsed = collapsedGroups.has(groupKey);
          const groupTopics = groupedTopics[groupKey];

          return (
            <div key={groupKey} className="mb-3">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-900 dark:text-gray-100 uppercase tracking-wider hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              >
                <span>{groupDisplayNames[groupKey] || groupKey}</span>
                {isCollapsed ? (
                  <ChevronRight size={14} className="text-gray-500" />
                ) : (
                  <ChevronDown size={14} className="text-gray-500" />
                )}
              </button>

              {/* Group Items */}
              {!isCollapsed && (
                <div className="mt-1 space-y-0.5">
                  {groupTopics.map(topic => {
                    const active = isActive(topic.url);

                    return (
                      <Link
                        key={topic.slug}
                        to={topic.url}
                        title={topic.description}
                        className={`block px-3 py-2 pl-6 text-sm rounded-lg transition-colors ${
                          active
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {topic.title}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </nav>
  );
};

export default HelpSidebar;
