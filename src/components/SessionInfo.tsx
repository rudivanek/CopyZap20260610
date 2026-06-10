import React from 'react';
import { Link2 } from 'lucide-react';

interface SessionInfoProps {
  sessionId: string | null;
  sessionName: string | null;
}

export const SessionInfo: React.FC<SessionInfoProps> = ({ sessionId, sessionName }) => {
  if (!sessionId || !sessionName) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md text-xs">
      <Link2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
      <span className="text-blue-700 dark:text-blue-300 font-medium">
        Session:
      </span>
      <span className="text-blue-600 dark:text-blue-400 truncate max-w-md" title={sessionName}>
        {sessionName}
      </span>
    </div>
  );
};
