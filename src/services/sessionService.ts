import { supabase } from './supabaseClient';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeSessionName } from '../utils/sessionContract';
import { SessionCreationError } from '../utils/sessionErrors';

export interface SessionInfo {
  id: string;
  sessionName: string;
  userId: string;
  customerId?: string;
  outputType?: string;
  briefDescription?: string;
  createdAt: string;
}

// Phase 4B-2: totalTokens removed (credits-only)
export interface SessionTokenSummary {
  sessionId: string;
  userId: string;
  customerId?: string;
  sessionName: string;
  outputType?: string;
  briefDescription?: string;
  inputData?: any;
  createdAt: string;
  apiCallsCount: number;
  totalCost: number;
  totalBillableUnits?: number; // Credits consumed
  estimatedInputTokens: number;
  estimatedOutputTokens: number;
  modelsUsed: string[];
  operationsPerformed: string[];
}

interface ScopedSession {
  id: string;
  name: string;
}

class SessionManager {
  // Scope-based caching to prevent cross-component leakage
  // Key: scopeKey (e.g., 'copy-maker-instance-1', 'copysnap-instance-1')
  private sessionCache: Map<string, ScopedSession> = new Map();

  generateSessionName(outputType?: string, projectDescription?: string): string {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    let rawName: string;

    // Priority 1: Use project description
    if (projectDescription && projectDescription.trim().length > 0) {
      const desc = projectDescription.trim();
      // Skip "Copy Maker" prefix for Purpose Rewrite and CopySnap sessions (they have their own prefixes)
      if (desc.startsWith('Purpose Rewrite:') || desc.startsWith('CopySnap:')) {
        rawName = desc;
      } else {
        rawName = `Copy Maker : ${desc}`;
      }
    }
    // Priority 2: Use output type with appropriate prefix
    else if (outputType && outputType.trim().length > 0) {
      if (outputType === 'quick-polish') {
        rawName = `Purpose Rewrite : ${dateStr} ${timeStr}`;
      } else if (outputType === 'copy-snap') {
        rawName = `CopySnap : ${dateStr} ${timeStr}`;
      } else {
        const contentType = this.formatContentType(outputType);
        rawName = `Copy Maker : ${contentType}`;
      }
    }
    // Fallback: ALWAYS ensure we return a non-empty session name
    else {
      rawName = `Copy Maker Session : ${dateStr} ${timeStr}`;
    }

    // Sanitize the name (max 100 chars)
    return sanitizeSessionName(rawName, 100);
  }

  private formatContentType(outputType: string): string {
    return outputType
      .split(/[-_\s]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  async createSession(
    userId: string,
    outputType?: string,
    projectDescription?: string,
    customerId?: string,
    inputData?: any,
    scopeKey?: string,
    dbScopeKey?: string
  ): Promise<SessionInfo> {
    const sessionId = uuidv4();
    const sessionName = this.generateSessionName(outputType, projectDescription);

    // Determine database scope_key from outputType or explicit dbScopeKey
    let determinedScopeKey = dbScopeKey || 'copy-maker';
    if (!dbScopeKey) {
      if (outputType === 'quick-polish') {
        determinedScopeKey = 'quick-polish';
      } else if (outputType === 'copy-snap') {
        determinedScopeKey = 'copy-snap';
      }
    }

    console.log('=== SESSION CREATION DEBUG ===');
    console.log('Creating session with userId:', userId);
    console.log('Session name:', sessionName);
    console.log('Output type:', outputType);
    console.log('Project description:', projectDescription);
    console.log('Cache scope key:', scopeKey);
    console.log('DB scope_key:', determinedScopeKey);

    // Clean input data by removing transient UI state
    const cleanInputData = inputData ? {
      ...inputData,
      // Remove transient UI state that shouldn't be persisted
      isLoading: undefined,
      isEvaluating: undefined,
      generationProgress: undefined,
      copyResult: undefined // Never save copyResult on initial session creation
    } : {};

    // Verify auth state before attempting insert
    const { data: { session: authSession } } = await supabase.auth.getSession();
    console.log('Auth session check before insert:', {
      hasSession: !!authSession,
      authUserId: authSession?.user?.id,
      providedUserId: userId,
      idsMatch: authSession?.user?.id === userId
    });

    if (!authSession) {
      console.error('❌ No auth session found when trying to create copy session');
      throw new SessionCreationError('User not authenticated');
    }

    if (authSession.user.id !== userId) {
      console.error('❌ User ID mismatch:', {
        authId: authSession.user.id,
        providedId: userId
      });
      throw new SessionCreationError('User ID mismatch');
    }

    const { data, error } = await supabase
      .from('pmc_copy_sessions')
      .insert({
        id: sessionId,
        user_id: userId,
        customer_id: customerId && customerId.trim() !== '' ? customerId : null, // Convert empty string to null
        output_type: outputType,
        brief_description: projectDescription,
        session_name: sessionName,
        input_data: cleanInputData,
        scope_key: determinedScopeKey, // Set scope_key based on outputType or explicit dbScopeKey
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('Session creation result:', { data, error });

    if (error) {
      console.error('❌ Error creating session:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw new SessionCreationError('Failed to create session in database', error);
    }

    // Cache the session if scope key provided
    if (scopeKey) {
      this.sessionCache.set(scopeKey, { id: sessionId, name: sessionName });
    }

    return {
      id: data.id,
      sessionName: data.session_name,
      userId: data.user_id,
      customerId: data.customer_id,
      outputType: data.output_type,
      briefDescription: data.brief_description,
      createdAt: data.created_at
    };
  }

  async updateSession(
    sessionId: string,
    sessionName: string,
    inputData?: any
  ): Promise<void> {
    // Sanitize the session name
    const sanitizedName = sanitizeSessionName(sessionName, 100);

    // Extract output type and project description from inputData
    const outputType = inputData?.outputType;
    const projectDescription = inputData?.projectDescription;

    // Ensure we're saving complete form state data
    // Filter out transient UI state that shouldn't be persisted
    const cleanInputData = inputData ? {
      ...inputData,
      // Remove transient UI state
      isLoading: undefined,
      isEvaluating: undefined,
      generationProgress: undefined,
      // Keep copyResult if present for recovery, but mark it as from previous session
      copyResult: inputData.copyResult ? {
        ...inputData.copyResult,
        _isPreviousResult: true
      } : undefined
    } : {};

    const updateData: any = {
      session_name: sanitizedName,
      input_data: cleanInputData
    };

    // Extract useful fields from inputData if available
    if (inputData) {
      if (inputData.outputType) {
        updateData.output_type = inputData.outputType;
      }
      if (projectDescription) {
        updateData.brief_description = projectDescription;
      }
      if (inputData.customerId && inputData.customerId !== 'none' && inputData.customerId !== '') {
        updateData.customer_id = inputData.customerId;
      } else if (inputData.hasOwnProperty('customerId')) {
        // Explicitly set to null if customerId is empty or 'none'
        updateData.customer_id = null;
      }
    }

    console.log('Updating session:', sessionId, 'with name:', sanitizedName);

    const { error } = await supabase
      .from('pmc_copy_sessions')
      .update(updateData)
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  getCurrentSessionId(scopeKey?: string): string | null {
    if (!scopeKey) return null;
    return this.sessionCache.get(scopeKey)?.id || null;
  }

  getCurrentSessionName(scopeKey?: string): string | null {
    if (!scopeKey) return null;
    return this.sessionCache.get(scopeKey)?.name || null;
  }

  setCurrentSession(sessionId: string, sessionName: string, scopeKey?: string): void {
    if (scopeKey) {
      this.sessionCache.set(scopeKey, { id: sessionId, name: sessionName });
    }
  }

  clearCurrentSession(scopeKey?: string): void {
    if (scopeKey) {
      this.sessionCache.delete(scopeKey);
    }
  }

  clearAllSessionsForScope(scopePrefix: string): void {
    const keysToDelete: string[] = [];
    for (const key of this.sessionCache.keys()) {
      if (key.startsWith(scopePrefix)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.sessionCache.delete(key));
  }

  async ensureActiveSession(
    userId: string,
    outputType?: string,
    projectDescription?: string,
    customerId?: string,
    inputData?: any,
    scopeKey?: string,
    dbScopeKey?: string
  ): Promise<string> {
    // If we already have an active session for this scope, return it
    const cachedSessionId = this.getCurrentSessionId(scopeKey);
    if (cachedSessionId) {
      return cachedSessionId;
    }

    // No active session, create a new one
    const session = await this.createSession(
      userId,
      outputType,
      projectDescription,
      customerId,
      inputData,
      scopeKey,
      dbScopeKey
    );

    return session.id;
  }

  /**
   * STRICT session creation - NEVER creates orphaned UUIDs
   * This is the single source of truth for obtaining a session_id for tracking
   * @throws SessionCreationError if session cannot be created
   */
  async getOrCreateSessionId(
    userId: string,
    outputType?: string,
    projectDescription?: string,
    customerId?: string,
    inputData?: any,
    scopeKey?: string,
    dbScopeKey?: string
  ): Promise<{ id: string; session_name: string }> {
    // If we already have an active session for this scope, return it with name
    const cachedSessionId = this.getCurrentSessionId(scopeKey);
    const cachedSessionName = this.getCurrentSessionName(scopeKey);

    if (cachedSessionId && cachedSessionName) {
      return {
        id: cachedSessionId,
        session_name: cachedSessionName
      };
    }

    // Must create a new session - NO FALLBACK
    try {
      const session = await this.createSession(
        userId,
        outputType,
        projectDescription,
        customerId,
        inputData,
        scopeKey,
        dbScopeKey
      );

      return {
        id: session.id,
        session_name: session.sessionName
      };
    } catch (error: any) {
      console.error('❌ CRITICAL: Session creation failed:', error);
      throw new SessionCreationError('Session creation failed', error);
    }
  }

  async getSessionById(sessionId: string): Promise<SessionInfo | null> {
    const { data, error } = await supabase
      .from('pmc_copy_sessions')
      .select('*')
      .eq('id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      sessionName: data.session_name,
      userId: data.user_id,
      customerId: data.customer_id,
      outputType: data.output_type,
      briefDescription: data.brief_description,
      createdAt: data.created_at
    };
  }

  async getSessionTokenSummary(sessionId: string): Promise<SessionTokenSummary | null> {
    const { data, error } = await supabase
      .from('pmc_session_token_summary')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching session token summary:', error);
      return null;
    }

    if (!data) return null;

    return {
      sessionId: data.session_id,
      userId: data.user_id,
      customerId: data.customer_id,
      sessionName: data.session_name,
      outputType: data.output_type,
      briefDescription: data.brief_description,
      inputData: data.input_data,
      createdAt: data.created_at,
      apiCallsCount: data.api_calls_count || 0,
      totalCost: parseFloat(data.total_cost || 0),
      totalBillableUnits: data.total_billable_units || 0, // Phase 4B-2: credits
      estimatedInputTokens: data.estimated_input_tokens || 0,
      estimatedOutputTokens: data.estimated_output_tokens || 0,
      modelsUsed: data.models_used || [],
      operationsPerformed: data.operations_performed || []
    };
  }

  async getAllSessionsForUser(userId: string, limit = 50): Promise<SessionTokenSummary[]> {
    const { data, error } = await supabase
      .from('pmc_session_token_summary')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching user sessions:', error);
      return [];
    }

    return data.map(row => ({
      sessionId: row.session_id,
      userId: row.user_id,
      customerId: row.customer_id,
      sessionName: row.session_name,
      outputType: row.output_type,
      briefDescription: row.brief_description,
      inputData: row.input_data,
      createdAt: row.created_at,
      apiCallsCount: row.api_calls_count || 0,
      totalCost: parseFloat(row.total_cost || 0),
      totalBillableUnits: row.total_billable_units || 0, // Phase 4B-2: credits
      estimatedInputTokens: row.estimated_input_tokens || 0,
      estimatedOutputTokens: row.estimated_output_tokens || 0,
      modelsUsed: row.models_used || [],
      operationsPerformed: row.operations_performed || []
    }));
  }

  async getAllSessions(limit = 100): Promise<SessionTokenSummary[]> {
    const { data, error } = await supabase
      .from('pmc_session_token_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching all sessions:', error);
      return [];
    }

    return data.map(row => ({
      sessionId: row.session_id,
      userId: row.user_id,
      customerId: row.customer_id,
      sessionName: row.session_name,
      outputType: row.output_type,
      briefDescription: row.brief_description,
      inputData: row.input_data,
      createdAt: row.created_at,
      apiCallsCount: row.api_calls_count || 0,
      totalCost: parseFloat(row.total_cost || 0),
      totalBillableUnits: row.total_billable_units || 0, // Phase 4B-2: credits
      estimatedInputTokens: row.estimated_input_tokens || 0,
      estimatedOutputTokens: row.estimated_output_tokens || 0,
      modelsUsed: row.models_used || [],
      operationsPerformed: row.operations_performed || []
    }));
  }

  async copySession(
    originalSessionId: string,
    newSessionName: string,
    userId: string,
    inputData?: any,
    scopeKey?: string,
    dbScopeKey?: string
  ): Promise<SessionInfo> {
    // First, get the original session to copy its data
    const originalSession = await this.getSessionById(originalSessionId);

    if (!originalSession) {
      throw new Error('Original session not found');
    }

    // Create a new session with the new name
    const newSessionId = uuidv4();
    const sanitizedName = sanitizeSessionName(newSessionName, 100);

    // Determine database scope_key from outputType or explicit dbScopeKey
    let determinedScopeKey = dbScopeKey || 'copy-maker';
    if (!dbScopeKey) {
      if (originalSession.outputType === 'quick-polish') {
        determinedScopeKey = 'quick-polish';
      } else if (originalSession.outputType === 'copy-snap') {
        determinedScopeKey = 'copy-snap';
      }
    }

    console.log('=== SESSION COPY DEBUG ===');
    console.log('Copying session:', originalSessionId);
    console.log('New session name:', sanitizedName);
    console.log('New session ID:', newSessionId);
    console.log('Cache scope key:', scopeKey);
    console.log('DB scope_key:', determinedScopeKey);

    // Clean input data by removing transient UI state
    const cleanInputData = inputData ? {
      ...inputData,
      // Remove transient UI state that shouldn't be persisted
      isLoading: undefined,
      isEvaluating: undefined,
      generationProgress: undefined,
      copyResult: inputData.copyResult ? {
        ...inputData.copyResult,
        _isPreviousResult: true
      } : undefined
    } : {};

    const { data, error } = await supabase
      .from('pmc_copy_sessions')
      .insert({
        id: newSessionId,
        user_id: userId,
        customer_id: originalSession.customerId,
        output_type: originalSession.outputType,
        brief_description: originalSession.briefDescription,
        session_name: sanitizedName,
        input_data: cleanInputData,
        scope_key: determinedScopeKey, // Set scope_key based on outputType or explicit dbScopeKey
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    console.log('Session copy result:', { data, error });

    if (error) {
      console.error('Error copying session:', error);
      throw new SessionCreationError('Failed to copy session', error);
    }

    // Cache the session if scope key provided
    if (scopeKey) {
      this.sessionCache.set(scopeKey, { id: newSessionId, name: sanitizedName });
    }

    return {
      id: data.id,
      sessionName: data.session_name,
      userId: data.user_id,
      customerId: data.customer_id,
      outputType: data.output_type,
      briefDescription: data.brief_description,
      createdAt: data.created_at
    };
  }
}

export const sessionManager = new SessionManager();
