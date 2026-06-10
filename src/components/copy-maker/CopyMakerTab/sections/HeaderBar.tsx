import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Download, Upload } from 'lucide-react';

interface HeaderBarProps {
  isExporting: boolean;
  onExport: () => void;
  isImporting: boolean;
  onImport: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  isExporting,
  onExport,
  isImporting,
  onImport,
}) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleExport = () => {
    setOpen(false);
    onExport();
  };

  const handleImport = () => {
    setOpen(false);
    onImport();
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-[22px] font-semibold leading-[1.3] mb-3 text-gray-900 dark:text-white">Copy Maker</h1>

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={isExporting || isImporting}
          className="flex items-center justify-center bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 w-8 h-8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="More options"
        >
          <MoreHorizontal size={16} />
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 py-1 overflow-hidden">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Download size={14} className="shrink-0" />
              {isExporting ? 'Exporting...' : 'Export JSON'}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={isImporting}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Upload size={14} className="shrink-0" />
              {isImporting ? 'Importing...' : 'Import JSON'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderBar;
