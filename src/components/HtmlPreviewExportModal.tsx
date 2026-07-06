import React, { useState } from 'react';
import { X, Percent } from 'lucide-react';
import { Button } from './ui/button';

interface HtmlPreviewExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (percent: number) => void;
  defaultPercent?: number;
}

const HtmlPreviewExportModal: React.FC<HtmlPreviewExportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  defaultPercent = 25,
}) => {
  const [percent, setPercent] = useState<number>(defaultPercent);

  if (!isOpen) return null;

  const clamp = (value: number) => Math.max(5, Math.min(100, value));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(clamp(percent));
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-lg max-w-md w-full overflow-hidden animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <Percent size={24} className="text-primary-500 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">HTML Preview Export</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Choose what percentage of each output's word count to include in the preview export.
          </p>
          <div className="flex items-center gap-4 mb-2">
            <input
              type="range"
              min={5}
              max={100}
              step={5}
              value={percent}
              onChange={(e) => setPercent(clamp(parseInt(e.target.value) || 25))}
              className="flex-1 accent-primary-600"
            />
            <input
              type="number"
              min={5}
              max={100}
              value={percent}
              onChange={(e) => setPercent(clamp(parseInt(e.target.value) || 25))}
              className="w-20 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-lg text-center focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
            Each output is cut at the nearest sentence boundary, with a floor of ~40 words so very short copy isn't gutted.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" className="bg-primary-600 hover:bg-primary-700 text-white">
              Export Preview ({percent}%)
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HtmlPreviewExportModal;
