import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Trash2, Bug } from 'lucide-react';
import { debugCompare } from '../../utils/debugLogger';

interface DebugInfoModalProps {
  onClose: () => void;
}

export const DebugInfoModal: React.FC<DebugInfoModalProps> = ({ onClose }) => {
  const [logs, setLogs] = useState(() => debugCompare.getLogs());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLogs(debugCompare.getLogs());
  }, []);

  const handleCopy = async () => {
    const text = logs
      .map(entry => `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`)
      .join('\n');
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    debugCompare.clearLogs();
    setLogs([]);
  };

  const levelColor = (level: string) => {
    if (level === 'error') return 'text-red-400';
    if (level === 'warn') return 'text-yellow-400';
    return 'text-emerald-400';
  };

  const formattedText = logs
    .map(entry => `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`)
    .join('\n');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl bg-gray-950 border border-gray-700 rounded-xl shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <Bug className="w-4 h-4 text-orange-400" />
            <h2 className="text-base font-semibold text-white">Debug Compare Logs</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
              {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClear}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-400 hover:text-red-400 border border-gray-700 hover:border-red-700 rounded-lg transition-colors"
              title="Clear all logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
            <button
              onClick={handleCopy}
              disabled={logs.length === 0}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-300 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              title="Copy all logs to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy All
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 text-gray-500 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log Body */}
        <div className="flex-1 overflow-y-auto p-4 font-mono text-xs">
          {logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-600">
              <Bug className="w-8 h-8 mb-3 opacity-30" />
              <p className="text-sm">No debug logs captured yet.</p>
              <p className="text-xs mt-1 text-gray-700">Logs will appear here after the next comparison run.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {logs.map((entry, idx) => (
                <div key={idx} className="flex gap-3 leading-relaxed group">
                  <span className="text-gray-600 shrink-0 select-none pt-px">{entry.timestamp}</span>
                  <span className={`shrink-0 font-bold pt-px ${levelColor(entry.level)}`}>
                    [{entry.level.toUpperCase()}]
                  </span>
                  <pre className="text-gray-300 whitespace-pre-wrap break-all m-0 flex-1 font-mono text-xs">
                    {entry.message}
                  </pre>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {logs.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-800 text-xs text-gray-600">
            Logs are cleared when you reload the page or click Clear.
          </div>
        )}
      </div>
    </div>
  );
};
