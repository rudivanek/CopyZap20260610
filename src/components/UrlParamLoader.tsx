import React, { useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getCopySession, getTemplate, getSavedOutput, touchSessionAccessed, touchOutputAccessed } from '../services/supabaseClient';
import { FormState, Template, CopySession, SavedOutput } from '../types';
import { logAutoApply } from '../utils/debugAutoApply';

interface UrlParamLoaderProps {
  currentUser: any;
  isInitialized: boolean;
  formState: FormState;
  setFormState: (state: FormState | ((prev: FormState) => FormState)) => void;
  loadFormStateFromTemplate: (template: Template) => void;
  loadFormStateFromSession: (session: CopySession) => void;
  loadFormStateFromSavedOutput: (savedOutput: SavedOutput) => void;
  addProgressMessage: (message: string) => void;
  setLoadedTemplateId: (id: string | null) => void;
  setLoadedTemplateName: (name: string) => void;
  onClearAll?: () => void;
}

const UrlParamLoader: React.FC<UrlParamLoaderProps> = ({
  currentUser,
  isInitialized,
  formState,
  setFormState,
  loadFormStateFromTemplate,
  loadFormStateFromSession,
  loadFormStateFromSavedOutput,
  addProgressMessage,
  setLoadedTemplateId,
  setLoadedTemplateName,
  onClearAll
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load session or template from URL params
  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    const templateId = searchParams.get('templateId');
    const savedOutputId = searchParams.get('savedOutputId');

    const loadData = async () => {
      if (!currentUser || !currentUser.id) return;

      if (sessionId) {
        // Validate sessionId is a proper string/UUID
        if (typeof sessionId !== 'string' || sessionId.trim() === '') {
          console.error('Invalid session ID in URL:', sessionId);
          toast.error('Invalid session ID in URL. Please check the link.');
          setSearchParams({}); // Clear invalid parameter
          return;
        }

        addProgressMessage('Loading session...');
        setFormState(prev => ({ ...prev, isLoading: true }));
        try {
          const { data, error } = await getCopySession(sessionId);
          if (error) {
            if (error.code === 'PGRST116') {
              console.warn('Session not found:', sessionId);
              toast.error('Session not found. The link may be invalid or the session may have been deleted.');
            } else {
              throw error;
            }
            return;
          }
          if (data) {
            // Clear all inputs first
            if (onClearAll) onClearAll();
            logAutoApply({
              ruleId: 'CM-AUTO-001',
              target: 'session',
              before: 'empty_form',
              after: 'session_loaded',
              source: 'url_param_sessionId',
              context: {
                sessionId: data.id,
                sessionName: data.session_name,
                hasInputData: !!data.input_data
              }
            });
            loadFormStateFromSession(data);
            touchSessionAccessed(data.id); // fire-and-forget — update last_accessed_at
            toast.success('Session loaded successfully!');
            setSearchParams({}); // Clear URL params after loading
          }
        } catch (error: any) {
          console.error('Error loading session:', error);
          toast.error(`Failed to load session: ${error.message}`);
        } finally {
          setFormState(prev => ({ ...prev, isLoading: false }));
          addProgressMessage('Session loading complete.');
        }
      } else if (templateId) {
        // Validate templateId is a proper string/UUID
        if (typeof templateId !== 'string' || templateId.trim() === '') {
          console.error('Invalid template ID in URL:', templateId);
          toast.error('Invalid template ID in URL. Please check the link.');
          setSearchParams({}); // Clear invalid parameter
          return;
        }

        addProgressMessage('Loading template...');
        setFormState(prev => ({ ...prev, isLoading: true }));
        try {
          const { data, error } = await getTemplate(templateId);
          if (error) {
            if (error.code === 'PGRST116') {
              console.warn('Template not found:', templateId);
              toast.error('Template not found. The link may be invalid or the template may have been deleted.');
            } else {
              throw error;
            }
            return;
          }
          if (data) {
            // Clear all inputs first
            if (onClearAll) onClearAll();
            logAutoApply({
              ruleId: 'CM-AUTO-002',
              target: 'template',
              before: 'empty_form',
              after: 'template_loaded',
              source: 'url_param_templateId',
              context: {
                templateId: data.id,
                templateName: data.template_name,
                category: data.category
              }
            });
            loadFormStateFromTemplate(data);
            setLoadedTemplateId(data.id || null);
            setLoadedTemplateName(data.template_name || '');
            toast.success('Template loaded successfully!');
            setSearchParams({}); // Clear URL params after loading
          }
        } catch (error: any) {
          console.error('Error loading template:', error);
          toast.error(`Failed to load template: ${error.message}`);
        } finally {
          setFormState(prev => ({ ...prev, isLoading: false }));
          addProgressMessage('Template loading complete.');
        }
      } else if (savedOutputId) {
        // Validate savedOutputId is a proper string/UUID
        if (typeof savedOutputId !== 'string' || savedOutputId.trim() === '') {
          console.error('Invalid saved output ID in URL:', savedOutputId);
          toast.error('Invalid saved output ID in URL. Please check the link.');
          setSearchParams({}); // Clear invalid parameter
          return;
        }

        addProgressMessage('Loading saved output...');
        setFormState(prev => ({ ...prev, isLoading: true }));
        let shouldRedirect = false;
        try {
          const { data, error } = await getSavedOutput(savedOutputId);
          if (error) {
            if (error.code === 'PGRST116') {
              console.warn('Saved output not found:', savedOutputId);
              toast.error('Saved output not found. The link may be invalid or the output may have been deleted.');
            } else {
              throw error;
            }
            return;
          }
          if (data) {
            // Check if this is a CopySnap output (has mode field)
            const isCopySnapOutput = data.input_data &&
              typeof data.input_data === 'object' &&
              'mode' in data.input_data &&
              ['improve', 'answer', 'question'].includes((data.input_data as any).mode);

            console.log('UrlParamLoader: Checking if CopySnap output:', {
              hasInputData: !!data.input_data,
              isObject: typeof data.input_data === 'object',
              hasMode: data.input_data && 'mode' in data.input_data,
              mode: (data.input_data as any)?.mode,
              isCopySnapOutput
            });

            if (isCopySnapOutput) {
              // Redirect to CopySnap with savedOutputId - don't clean up, let CopySnap handle it
              console.log('UrlParamLoader: Redirecting to CopySnap with savedOutputId:', savedOutputId);
              logAutoApply({
                ruleId: 'CM-AUTO-003',
                target: 'redirect',
                before: '/app/copy-maker',
                after: '/copy-snap',
                source: 'url_param_savedOutputId_copysnap',
                context: {
                  savedOutputId,
                  isCopySnapOutput: true,
                  mode: (data.input_data as any)?.mode
                }
              });
              shouldRedirect = true;
              setFormState(prev => ({ ...prev, isLoading: false }));
              navigate(`/copy-snap?savedOutputId=${savedOutputId}`);
              return;
            }

            // Clear all inputs first
            if (onClearAll) onClearAll();
            logAutoApply({
              ruleId: 'CM-AUTO-003',
              target: 'saved_output',
              before: 'empty_form',
              after: 'saved_output_loaded',
              source: 'url_param_savedOutputId',
              context: {
                savedOutputId: data.id,
                feature: data.feature,
                operation: data.operation,
                hasInputData: !!data.input_data
              }
            });
            loadFormStateFromSavedOutput(data);
            touchOutputAccessed(data.id); // fire-and-forget — update last_accessed_at
            toast.success('Saved output loaded successfully!');
            setSearchParams({}); // Clear URL params after loading
          }
        } catch (error: any) {
          console.error('Error loading saved output:', error);
          toast.error(`Failed to load saved output: ${error.message}`);
        } finally {
          if (!shouldRedirect) {
            setFormState(prev => ({ ...prev, isLoading: false }));
            addProgressMessage('Saved output loading complete.');
          }
        }
      }
    };

    if (isInitialized && currentUser) {
      loadData();
    }
  }, [searchParams, currentUser, isInitialized]);

  return null; // This component doesn't render anything
};

export default UrlParamLoader;