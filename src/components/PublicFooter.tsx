import React from 'react';
import { Link } from 'react-router-dom';

const PublicFooter: React.FC = () => {
  return (
    <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
      <a href="/help" target="_blank" rel="noopener noreferrer" className="hover:text-primary-500 transition">Help Center</a>
      <span className="mx-2">•</span>
      <Link to="/help/getting-started" className="hover:text-primary-500 transition">Getting Started</Link>
      <span className="mx-2">•</span>
      <Link to="/help/troubleshooting-faqs" className="hover:text-primary-500 transition">Troubleshooting</Link>
      <span className="mx-2">•</span>
      <a href="/sitemap.xml" className="hover:text-primary-500 transition">Sitemap</a>

      <div className="mt-4 text-xs text-gray-400">
        Powered by{' '}
        <a
          href="https://sharpen.studio/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary-500 transition"
        >
          Sharpen.Studio
        </a>
      </div>
      <div className="mt-1 text-xs" style={{ color: '#ff6b35' }}>
  <span>CopyZap</span>
  <span className="text-[8px] sm:text-[10px] font-normal ml-1">v.34.0</span>
</div>
    </footer>
  );
};

export default PublicFooter;
