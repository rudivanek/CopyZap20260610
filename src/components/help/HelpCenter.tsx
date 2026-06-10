import React from 'react';
import { Link } from 'react-router-dom';
import HelpLayout from './HelpLayout';
import HelpSearch from './HelpSearch';
import {
  Rocket, Wand2, Globe, GitCompare, Zap, LifeBuoy,
  ArrowRight, ChevronRight
} from 'lucide-react';

interface Article {
  title: string;
  path: string;
  badge?: string;
}

interface Category {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  articles: Article[];
  seeAllPath?: string;
}

const primaryCategories: Category[] = [
  {
    icon: <Wand2 size={18} />,
    title: 'Generate new copy',
    description: 'Start from scratch.',
    color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30',
    seeAllPath: '/help/core-workflows',
    articles: [
      { title: 'Set up your project correctly', path: '/help/setup-and-inputs' },
      { title: 'Apply a voice style (Ogilvy, Hormozi, etc.)', path: '/help/voice-styles-and-blending' },
      { title: 'Set up and use Brand Voice', path: '/help/setup-and-inputs' },
      { title: 'Save a template and reuse it', path: '/help/setup-and-inputs' },
      { title: 'See all 5 core workflows', path: '/help/core-workflows' },
    ],
  },
  {
    icon: <Globe size={18} />,
    title: 'Improve existing copy',
    description: 'Rewrite, polish, or upgrade what you have.',
    color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
    seeAllPath: '/help/how-scoring-works',
    articles: [
      { title: 'Improve copy using a website URL', path: '/help/core-workflows', badge: 'Tutorial' },
      { title: 'Turn on optional output features', path: '/help/optional-features' },
      { title: 'Read and act on your output', path: '/help/how-scoring-works' },
      { title: 'Find the right settings for your content type', path: '/help/recommended-settings' },
    ],
  },
  {
    icon: <GitCompare size={18} />,
    title: 'Compare & pick a winner',
    description: 'Score versions and decide with confidence.',
    color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30',
    seeAllPath: '/help/how-scoring-works',
    articles: [
      { title: 'Compare versions and select the best one', path: '/help/core-workflows', badge: 'Tutorial' },
      { title: 'Understand Conversion, Trust, and Risk scores', path: '/help/how-scoring-works' },
      { title: 'Use the evaluation tools', path: '/help/how-scoring-works' },
      { title: 'See how features interact', path: '/help/how-scoring-works' },
    ],
  },
];

const secondaryCategories: Category[] = [
  {
    icon: <Rocket size={18} />,
    title: 'Get up and running',
    description: 'First time here? Do these first.',
    color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
    seeAllPath: '/help/getting-started',
    articles: [
      { title: 'Generate your first output in 2 min', path: '/help/core-workflows', badge: 'Start here' },
      { title: 'Use the Quick Prompt Wizard', path: '/help/getting-started' },
      { title: 'Choose where to start (Start Hub)', path: '/help/getting-started' },
      { title: 'Understand what CopyZap does', path: '/help/getting-started' },
    ],
  },
  {
    icon: <Zap size={18} />,
    title: 'Do more with CopyZap',
    description: 'Automate, export, and scale.',
    color: 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
    seeAllPath: '/help/export-and-file-management',
    articles: [
      { title: 'Build a multi-step workflow', path: '/help/workflow-builder' },
      { title: 'Export copy as HTML or Markdown', path: '/help/export-and-file-management' },
      { title: 'Find and manage past outputs', path: '/help/dashboard-and-history' },
      { title: 'Understand your credits', path: '/help/credits-and-billing' },
    ],
  },
  {
    icon: <LifeBuoy size={18} />,
    title: 'Fix an issue',
    description: 'Something not working? Find it here.',
    color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30',
    articles: [
      { title: 'Look up a common error or FAQ', path: '/help/troubleshooting' },
      { title: 'Look up a term in the glossary', path: '/help/glossary' },
      { title: 'Contact support', path: '/help/contact' },
    ],
  },
];

const featuredTutorials = [
  {
    number: '01',
    title: 'Generate your first output',
    outcome: 'Get professional copy in under 2 minutes.',
    path: '/help/getting-started',
    time: '2 min',
  },
  {
    number: '02',
    title: 'Core workflows',
    outcome: 'Create, improve, compare, and apply brand voice.',
    path: '/help/core-workflows',
    time: '5 min',
  },
  {
    number: '03',
    title: 'Score & compare versions',
    outcome: 'Use AI scoring to pick the best output.',
    path: '/help/how-scoring-works',
    time: '3 min',
  },
];

const PREVIEW_LIMIT = 3;

function CategoryCard({ cat }: { cat: Category }) {
  const preview = cat.articles.slice(0, PREVIEW_LIMIT);
  const hasMore = cat.articles.length > PREVIEW_LIMIT;

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${cat.color}`}>
          {cat.icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{cat.title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight mt-0.5">{cat.description}</p>
        </div>
      </div>
      <ul className="space-y-0.5">
        {preview.map((article) => (
          <li key={`${cat.title}-${article.path}-${article.title}`}>
            <Link
              to={article.path}
              className="group flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {article.title}
              </span>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {article.badge && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 whitespace-nowrap">
                    {article.badge}
                  </span>
                )}
                <ArrowRight size={11} className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 dark:group-hover:text-gray-400 transition-colors" />
              </div>
            </Link>
          </li>
        ))}
        {hasMore && cat.seeAllPath && (
          <li>
            <Link
              to={cat.seeAllPath}
              className="group flex items-center gap-1 py-1.5 px-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="text-xs font-medium text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                See all
              </span>
              <ArrowRight size={10} className="text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            </Link>
          </li>
        )}
      </ul>
    </div>
  );
}

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{children}</p>
);

const HelpCenter: React.FC = () => {
  return (
    <HelpLayout
      title="Help Center"
      breadcrumbs={[{ label: 'Help Center' }]}
      hideSearch
      hideSidebar
    >
      {/* ── Header ──────────────────────────────────────── */}
      <div className="mb-12">
        
        <p className="text-base text-gray-500 dark:text-gray-400 mb-7">
          Find what you need. Get results fast.
        </p>
        <div className="max-w-xl">
          <HelpSearch placeholder="Search articles and tutorials..." />
        </div>
      </div>

      {/* ── Start Here ──────────────────────────────────── */}
      <section className="mb-14">
        <div className="mb-4">
          <SectionLabel>Start here</SectionLabel>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">New to CopyZap? Start here.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {featuredTutorials.map((t) => (
            <Link
              key={t.path}
              to={t.path}
              className="group flex flex-col justify-between border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-400 dark:hover:border-gray-500 hover:shadow-sm transition-all duration-150 bg-white dark:bg-gray-900"
            >
              <div>
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 mb-3 block">{t.number}</span>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {t.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{t.outcome}</p>
              </div>
              <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 dark:border-gray-800">
                <span className="text-[11px] text-gray-400">{t.time} read</span>
                <ChevronRight size={13} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Primary Categories ──────────────────────────── */}
      <section className="mb-10">
        <div className="mb-4">
          <SectionLabel>What do you want to do?</SectionLabel>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Most users start with one of these.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {primaryCategories.map((cat) => (
            <CategoryCard key={cat.title} cat={cat} />
          ))}
        </div>
      </section>

      {/* ── Secondary Categories ────────────────────────── */}
      <section className="mb-14">
        <div className="mb-4">
          <SectionLabel>More topics</SectionLabel>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {secondaryCategories.map((cat) => (
            <CategoryCard key={cat.title} cat={cat} />
          ))}
        </div>
      </section>

      {/* ── Footer CTA ──────────────────────────────────── */}
      <div className="border border-gray-300 dark:border-gray-600 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gray-50 dark:bg-gray-800/60">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Need help?</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">We'll help you get unstuck.</p>
        </div>
        <Link
          to="/help/contact"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 hover:bg-white dark:hover:bg-gray-800 hover:border-gray-400 transition-all whitespace-nowrap"
        >
          Contact support
          <ArrowRight size={13} />
        </Link>
      </div>
    </HelpLayout>
  );
};

export default HelpCenter;
