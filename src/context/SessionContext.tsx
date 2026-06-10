import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { sessionManager } from '../services/sessionService';
import { shouldResetSession, type CopyMakerIntentContext } from '../utils/sessionContract';
import { SessionCreationError, isSessionCreationError } from '../utils/sessionErrors';
import { toast } from 'react-hot-toast';

console.log('SUPABASE_ENABLED:', import.meta.env.VITE_SUPABASE_ENABLED);

interface SessionContextType {
  currentSessionId: string | null;
  currentSessionName: string | null;
  intentContext: CopyMakerIntentContext | null;
  setCurrentSession: (sessionId: string, sessionName: string, context?: CopyMakerIntentContext) => void;
  clearCurrentSession: () => void;
  ensureActiveSession: (
    userId: string,
    outputType?: string,
    projectDescription?: string,
    customerId?: string,
    inputData?: any
  ) => Promise<string>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

// Stable scope key for Copy Maker context
const COPY_MAKER_SCOPE = 'copy-maker-context';

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [currentSessionName, setCurrentSessionName] = useState<string | null>(null);
  const [intentContext, setIntentContext] = useState<CopyMakerIntentContext | null>(null);

  const setCurrentSession = (sessionId: string, sessionName: string, context?: CopyMakerIntentContext) => {
    setCurrentSessionId(sessionId);
    setCurrentSessionName(sessionName);
    if (context) {
      setIntentContext(context);
    }
    sessionManager.setCurrentSession(sessionId, sessionName, COPY_MAKER_SCOPE);
  };

  const clearCurrentSession = () => {
    setCurrentSessionId(null);
    setCurrentSessionName(null);
    setIntentContext(null);
    sessionManager.clearCurrentSession(COPY_MAKER_SCOPE);
  };

  const ensureActiveSession = async (
    userId: string,
    outputType?: string,
    projectDescription?: string,
    customerId?: string,
    inputData?: any
  ): Promise<string> => {
    // Build current intent context
    const currentContext: CopyMakerIntentContext = {
      feature: 'copy-maker',
      outputType: outputType?.trim() || undefined,
      projectDescription: projectDescription?.trim() || undefined,
      customerId: customerId?.trim() || undefined
    };

    // Check if we need to reset session due to intent context change
    const needsReset = shouldResetSession(intentContext, currentContext);

    if (needsReset && currentSessionId) {
      console.log('Copy Maker: Intent context changed, creating new session');
      clearCurrentSession();
    }

    // If we already have a session and context hasn't changed, return it
    if (currentSessionId && !needsReset) {
      return currentSessionId;
    }

    // Create a new session
    try {
      const sessionId = await sessionManager.ensureActiveSession(
        userId,
        outputType,
        projectDescription,
        customerId,
        inputData,
        COPY_MAKER_SCOPE
      );

      // Update context state
      const sessionName = sessionManager.getCurrentSessionName(COPY_MAKER_SCOPE);
      setCurrentSessionId(sessionId);
      setCurrentSessionName(sessionName || 'Copy Session');
      setIntentContext(currentContext);

      return sessionId;
    } catch (error) {
      console.error('Failed to create session in SessionContext:', error);

      // Show user-friendly error message once
      if (isSessionCreationError(error)) {
        toast.error((error as SessionCreationError).userMessage);
      } else {
        toast.error('Failed to create session. Please try again.');
      }

      throw error;
    }
  };

  // Clear session on unmount
  useEffect(() => {
    return () => {
      sessionManager.clearCurrentSession(COPY_MAKER_SCOPE);
    };
  }, []);

  return (
    <SessionContext.Provider
      value={{
        currentSessionId,
        currentSessionName,
        intentContext,
        setCurrentSession,
        clearCurrentSession,
        ensureActiveSession,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};
