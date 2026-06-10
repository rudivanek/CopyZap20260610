import React, { useState } from 'react';
import { X, Copy, Check, Code } from 'lucide-react';

interface PromptDisplayProps {
  systemPrompt: string;
  userPrompt: string;
  onClose: () => void;
}

const PromptDisplay: React.FC<PromptDisplayProps> = ({
  systemPrompt,
  userPrompt,
  onClose
}) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyBoth = () => {
    const combinedText = `SYSTEM PROMPT:\n${systemPrompt}\n\nUSER PROMPT:\n${userPrompt}`;
    navigator.clipboard.writeText(combinedText);
    setCopied('both');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-300 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
            <Code size={20} className="mr-2 text-primary-500" />
            Prompt Output
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-grow overflow-auto p-4 space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">System Prompt</h4>
              <button
                onClick={() => handleCopy(systemPrompt, 'system')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center text-sm"
                disabled={!systemPrompt}
              >
                {copied === 'system' ? (
                  <>
                    <Check size={16} className="mr-1 text-green-500 dark:text-green-400" />
                    <span className="text-green-500 dark:text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-1" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-40">
              {systemPrompt || "No system prompt available. Generate copy to see the prompt."}
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-md font-medium text-gray-700 dark:text-gray-300">User Prompt</h4>
              <button
                onClick={() => handleCopy(userPrompt, 'user')}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white flex items-center text-sm"
                disabled={!userPrompt}
              >
                {copied === 'user' ? (
                  <>
                    <Check size={16} className="mr-1 text-green-500 dark:text-green-400" />
                    <span className="text-green-500 dark:text-green-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} className="mr-1" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap overflow-auto max-h-60">
              {userPrompt || "No user prompt available. Generate copy to see the prompt."}
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-300 dark:border-gray-800">
          <button
            onClick={copyBoth}
            disabled={!systemPrompt || !userPrompt}
            className={`w-full font-medium rounded-lg py-2 flex items-center justify-center ${
              !systemPrompt || !userPrompt 
                ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white'
            }`}
          >
            {copied === 'both' ? (
              <>
                <Check size={18} className="mr-2 text-white" />
                <span>Copied Both Prompts!</span>
              </>
            ) : (
              <>
                <Copy size={18} className="mr-2" />
                <span>Copy Both Prompts</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(PromptDisplay);