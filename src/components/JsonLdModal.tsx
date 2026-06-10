import React, { useState } from 'react';
import { X, Copy, Check, FileJson } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface JsonLdModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonLd: string;
}

const JsonLdModal: React.FC<JsonLdModalProps> = ({ isOpen, onClose, jsonLd }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonLd);
    setCopied(true);
    toast.success('JSON-LD copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <FileJson size={20} className="mr-2 text-primary-500" />
            Generated FAQPage Schema (JSON-LD)
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-grow overflow-auto p-4">
          {jsonLd ? (
            <pre className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-sm overflow-x-auto">
              <code>{jsonLd}</code>
            </pre>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 text-center">No JSON-LD content generated.</p>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-300 dark:border-gray-800 flex justify-end">
          <button
            onClick={handleCopy}
            className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-md text-sm flex items-center"
            disabled={!jsonLd}
          >
            {copied ? (
              <>
                <Check size={16} className="mr-1.5" />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} className="mr-1.5" />
                Copy JSON-LD
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export { JsonLdModal };