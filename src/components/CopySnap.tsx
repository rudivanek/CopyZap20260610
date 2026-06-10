import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import NavSidebar from './NavSidebar';
import { Zap, Copy, Check, RefreshCw, Replace, X, AlertCircle, Save, BookmarkPlus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { User, Model, SavedOutput } from '../types';
import { makeApiRequestWithFallback } from '../services/api/utils';
import { trackTokenUsage } from '../services/api/tokenTracking';
import { detectLanguage, getLanguageName } from '../utils/languageDetection';
import { saveSavedOutput, getSavedOutput } from '../services/supabaseClient';
import { sessionManager } from '../services/sessionService';
import { sanitizeSessionName, type CopySnapIntentContext, shouldResetSession } from '../utils/sessionContract';
import { SessionCreationError, isSessionCreationError } from '../utils/sessionErrors';
import {
  buildImprovePrompt,
  validateImprovedOutput,
  generateFallbackOutput,
  type ImproveOptions,
  type ImproveContext
} from '../utils/copySnapImproveEngine';
import {
  buildAnswerPrompt,
  validateAnswerOutput,
  generateFallbackAnswer,
  type AnswerOptions,
  type AnswerContext
} from '../utils/copySnapAnswerEngine';
import { playSuccessSound } from '../utils/soundEffects';
import { useMode } from '../context/ModeContext';

interface CopySnapProps {
  currentUser?: User;
}

type CopySnapMode = 'improve' | 'answer' | 'question';

type ImproveGoal = 'clearer' | 'persuasive' | 'shorter' | 'punchier';
type ImprovePlatform = 'general' | 'x' | 'linkedin' | 'email';
type ImproveLength = 'short' | 'same' | 'longer';

type AnswerStyle = 'helpful' | 'friendly' | 'confident' | 'witty' | 'direct';
type AnswerStance = 'neutral' | 'agree' | 'disagree';
type AnswerLength = 'short' | 'medium' | 'long';

type QuestionType = 'clarify' | 'challenge' | 'explore' | 'convert';
type QuestionCount = 1 | 3 | 5;
type QuestionDirectness = 'soft' | 'direct';

interface ImproveOutput {
  best: string;
  alternatives: string[];
  notes: string[];
}

interface AnswerOutput {
  best: string;
  alternatives: string[];
}

interface QuestionOutput {
  questions: string[];
}

const CopySnap: React.FC<CopySnapProps> = ({ currentUser }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { mode: formMode } = useMode(); // Get current form mode (Quick/Standard/Advanced) for saving outputs

  // Input state
  const [input, setInput] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [mode, setMode] = useState<CopySnapMode>('improve');

  // Improve mode controls
  const [improveGoal, setImproveGoal] = useState<ImproveGoal>('clearer');
  const [improvePlatform, setImprovePlatform] = useState<ImprovePlatform>('general');
  const [improveLength, setImproveLength] = useState<ImproveLength>('same');

  // Answer mode controls
  const [answerStyle, setAnswerStyle] = useState<AnswerStyle>('helpful');
  const [answerStance, setAnswerStance] = useState<AnswerStance>('neutral');
  const [answerLength, setAnswerLength] = useState<AnswerLength>('short');

  // Question mode controls
  const [questionType, setQuestionType] = useState<QuestionType>('clarify');
  const [questionCount, setQuestionCount] = useState<QuestionCount>(3);
  const [questionDirectness, setQuestionDirectness] = useState<QuestionDirectness>('soft');

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [output, setOutput] = useState<ImproveOutput | AnswerOutput | QuestionOutput | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [usedFallback, setUsedFallback] = useState(false);
  const [modelUsed, setModelUsed] = useState<string>('');
  const [rawOutput, setRawOutput] = useState<string>('');
  const [parseError, setParseError] = useState(false);
  const [showFallbackBanner, setShowFallbackBanner] = useState(false);

  // Human tone toggle
  const [humanTone, setHumanTone] = useState(false);

  // Save output modal
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Save session modal
  const [showSaveSessionModal, setShowSaveSessionModal] = useState(false);
  const [saveSessionName, setSaveSessionName] = useState('');
  const [saveSessionDescription, setSaveSessionDescription] = useState('');
  const [isSavingSession, setIsSavingSession] = useState(false);

  // Session tracking with stable scope key
  const scopeKey = `copysnap-${currentUser?.id || 'anonymous'}`;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionName, setSessionName] = useState<string | null>(null);
  const [intentContext, setIntentContext] = useState<CopySnapIntentContext | null>(null);

  // Modify content
  const [modifyInstruction, setModifyInstruction] = useState('');
  const [isModifying, setIsModifying] = useState(false);

  // Character count
  const charCount = input.length;
  const maxChars = 2000;

  // Disable generate if empty or over limit
  const canGenerate = input.trim().length > 0 && charCount <= maxChars && !isGenerating;

  // Build prompt based on mode
  const buildPrompt = (detectedLang: string): { system: string; user: string } => {
    const langName = getLanguageName(detectedLang);
    const baseContext = `You are CopySnap, an AI assistant that helps improve, answer, or ask questions about text. CRITICAL: The user's input is in ${langName}. You MUST respond in ${langName} (language code: ${detectedLang}). All sections of your JSON output must be in ${langName}.`;

    // Human Tone Instructions (append when enabled)
    const humanToneInstructions = humanTone ? `

Human Tone Instructions (apply only if enabled):

Write in a natural, human-sounding voice appropriate for real social media usage.

Follow these rules strictly:
- Use natural sentence rhythm: mix short and medium sentences.
- Prefer concrete, specific language over abstract or generic phrases.
- Avoid buzzwords, clichés, and overly formal or corporate language.
- Write conversationally, as a real person would in casual professional contexts.
- Allow natural phrasing variations (don't over-polish).
- Avoid exaggerated enthusiasm or hype.
- Avoid phrases such as:
  "In today's fast-paced world"
  "It's important to note"
  "Unlock the power of"
  "Leverage", "synergy", "game-changing" (unless clearly natural in context)

Platform behavior:
- For X (Twitter): concise, conversational, scroll-stopping, natural.
- For LinkedIn: professional but personal, clear opinions, no fluff.
- For Email: natural, direct, written like a real person would write.

Language rules:
- Write in the same language as the input text.
- Do NOT translate unless the input is mixed-language; follow the dominant language.
- Use natural expressions for that language (no literal translations).

Goal:
The output should feel natural and conversational, with a clear human writing style that prioritizes readability and authenticity.` : '';

    if (mode === 'improve') {
      // Use enhanced IMPROVE engine with conflict resolution
      const improveOptions: ImproveOptions = {
        goal: improveGoal,
        platform: improvePlatform,
        length: improveLength,
        humanTone: humanTone,
        specialInstructions: specialInstructions
      };

      const improveContext: ImproveContext = {
        inputText: input,
        detectedLang: detectedLang,
        langName: langName
      };

      return buildImprovePrompt(improveContext, improveOptions);
    }

    if (mode === 'answer') {
      // Use enhanced ANSWER engine with guardrails
      const answerOptions: AnswerOptions = {
        replyStyle: answerStyle,
        stance: answerStance,
        length: answerLength,
        humanTone: humanTone,
        specialInstructions: specialInstructions
      };

      const answerContext: AnswerContext = {
        originalText: input,
        detectedLang: detectedLang,
        langName: langName
      };

      return buildAnswerPrompt(answerContext, answerOptions);
    }

    // Question mode
    const typeMap: Record<QuestionType, string> = {
      clarify: 'clarifying questions to better understand the text',
      challenge: 'challenging questions that push back or probe deeper',
      explore: 'exploratory questions that open up new angles',
      convert: 'conversion-focused questions that drive action or decisions'
    };

    const directnessMap: Record<QuestionDirectness, string> = {
      soft: 'Ask in a soft, gentle way',
      direct: 'Ask in a direct, straightforward way'
    };

    // Special Instructions section for Question mode
    const questionSpecialInstructions = specialInstructions ? `
═══════════════════════════════════════════════════════════════
SPECIAL INSTRUCTIONS (HIGHEST PRIORITY - MANDATORY)
═══════════════════════════════════════════════════════════════

User's Special Instructions:
"${specialInstructions}"

CRITICAL ENFORCEMENT RULES:
1. These Special Instructions have ABSOLUTE PRIORITY over all other settings
2. The questions MUST follow these instructions EXACTLY, even if they conflict with:
   - Question type (${questionType})
   - Directness (${questionDirectness})
   - Count (${questionCount})
   - Default question styles

3. If Special Instructions specify a particular tone, angle, or focus:
   → Questions MUST reflect that explicitly
   → Override the selected question type and directness

CONFLICT RESOLUTION:
If there is ANY conflict between Special Instructions and other settings:
→ Special Instructions ALWAYS WIN
→ Follow the user's explicit intent

═══════════════════════════════════════════════════════════════
` : '';

    const system = `${baseContext}

${questionSpecialInstructions}

Your task: Generate ${questionCount} ${typeMap[questionType]}. ${directnessMap[questionDirectness]}.

Return ONLY valid JSON with this exact structure:
{
  "questions": ["question 1", "question 2", ...]
}

Return exactly ${questionCount} question(s). Do NOT add markdown formatting, code blocks, or explanations. Just raw JSON. Remember: ALL text in the JSON must be in ${langName}.${specialInstructions ? '\n\nREMINDER: Follow the Special Instructions above with absolute priority.' : ''}${humanToneInstructions}`;

    const user = `Text:\n\n${input}`;
    return { system, user };
  };

  // Generate intent context for session contract
  const getCurrentIntentContext = (): CopySnapIntentContext => {
    let preset: string;
    let platform: string | undefined;

    if (mode === 'improve') {
      const goalMap: Record<ImproveGoal, string> = {
        clearer: 'Clarity',
        persuasive: 'Persuasion',
        shorter: 'Brevity',
        punchier: 'Impact'
      };
      preset = goalMap[improveGoal];
      platform = improvePlatform;
    } else if (mode === 'answer') {
      const styleMap: Record<AnswerStyle, string> = {
        helpful: 'Helpful',
        friendly: 'Friendly',
        confident: 'Confident',
        witty: 'Witty',
        direct: 'Direct'
      };
      preset = styleMap[answerStyle];
    } else {
      const typeMap: Record<QuestionType, string> = {
        clarify: 'Clarifying',
        challenge: 'Challenging',
        explore: 'Exploratory',
        convert: 'Converting'
      };
      preset = typeMap[questionType];
    }

    return {
      feature: 'copysnap',
      mode,
      platform,
      preset
    };
  };

  // Generate meaningful session name based on mode and settings
  const generateSessionName = (): string => {
    const context = getCurrentIntentContext();
    let rawName: string;

    if (mode === 'improve') {
      const platformMap: Record<ImprovePlatform, string> = {
        general: 'General',
        x: 'X/Twitter',
        linkedin: 'LinkedIn',
        email: 'Email'
      };
      rawName = `CopySnap: ${context.preset} (${platformMap[improvePlatform]})`;
    } else if (mode === 'answer') {
      rawName = `CopySnap: Reply (${context.preset})`;
    } else {
      rawName = `CopySnap: Questions (${context.preset})`;
    }

    return sanitizeSessionName(rawName, 100);
  };

  // Get session ID for tracking (returns existing session or null)
  const getSessionId = (): string | null => {
    // Check if we need to reset session due to intent context change
    const currentContext = getCurrentIntentContext();
    const needsReset = shouldResetSession(intentContext, currentContext);

    if (needsReset && sessionId) {
      console.log('CopySnap: Intent context changed, clearing session reference');
      setSessionId(null);
      setSessionName(null);
      setIntentContext(null);
      sessionManager.clearCurrentSession(scopeKey);
      return null;
    }

    // Return existing session ID or null
    return sessionId;
  };

  // Parse JSON safely with multiple extraction attempts
  const parseOutput = (text: string): ImproveOutput | AnswerOutput | QuestionOutput | null => {
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : text;

      // Try direct parse
      const parsed = JSON.parse(jsonText.trim());
      return parsed;
    } catch (error) {
      // Try to find JSON object boundaries
      try {
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          const parsed = JSON.parse(objectMatch[0]);
          return parsed;
        }
      } catch (e) {
        // Still failed
      }

      console.error('Failed to parse JSON:', error);
      return null;
    }
  };

  // Make API request with fallback
  const makeRequestWithFallback = async (
    primaryModel: Model,
    fallbackModel: Model,
    messages: { role: string; content: string }[]
  ): Promise<{
    content: string;
    modelUsed: Model;
    usedFallback: boolean;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  }> => {
    // Try primary model (DeepSeek)
    try {
      console.log(`Attempting primary model: ${primaryModel}`);
      const response = await makeApiRequestWithFallback(
        primaryModel,
        messages,
        0.7,
        4000,
        undefined,
        currentUser?.email
      );

      const content = response.choices[0]?.message?.content || '';

      // Check if response can be parsed
      const parsed = parseOutput(content);
      if (!parsed) {
        console.error('DeepSeek returned invalid JSON, falling back to GPT');
        throw new Error('Invalid JSON from DeepSeek');
      }

      return {
        content,
        modelUsed: response.model_used || primaryModel,
        usedFallback: false,
        usage: response.usage
      };
    } catch (primaryError) {
      console.error('Primary model failed:', primaryError);

      // Try fallback model (GPT)
      try {
        console.log(`Attempting fallback model: ${fallbackModel}`);
        const response = await makeApiRequestWithFallback(
          fallbackModel,
          messages,
          0.7,
          4000,
          undefined,
          currentUser?.email
        );

        const content = response.choices[0]?.message?.content || '';

        return {
          content,
          modelUsed: response.model_used || fallbackModel,
          usedFallback: true,
          usage: response.usage
        };
      } catch (fallbackError) {
        console.error('Fallback model also failed:', fallbackError);
        throw fallbackError;
      }
    }
  };

  // Generate handler with validation and retry logic
  const handleGenerate = async () => {
    if (!canGenerate) return;

    setIsGenerating(true);
    setOutput(null);
    setUsedFallback(false);
    setModelUsed('');
    setRawOutput('');
    setParseError(false);
    setShowFallbackBanner(false);

    try {
      // Get session ID if one exists (no automatic creation)
      const activeSessionId = getSessionId();

      // Detect language
      const detectedLang = detectLanguage(input);
      console.log('Detected language:', detectedLang, '(' + getLanguageName(detectedLang) + ')');

      const { system, user } = buildPrompt(detectedLang);

      const messages = [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ];

      // Use selected model with Claude fallback
      const result = await makeRequestWithFallback(
        selectedModel || 'claude-sonnet-4-5',
        'claude-sonnet-4-5',
        messages
      );

      setUsedFallback(result.usedFallback);
      setModelUsed(result.modelUsed);
      setRawOutput(result.content);
      setShowFallbackBanner(result.usedFallback);

      // Track tokens for the actual model used
      if (currentUser?.id && result.usage) {
        try {
          const totalTokens = (result.usage.prompt_tokens || 0) + (result.usage.completion_tokens || 0);
          await trackTokenUsage(
            currentUser,
            totalTokens,
            result.modelUsed,
            'copy-snap',
            activeSessionId,
            0, // retryCount
            undefined, // trackingId
            {
              inputTokens: result.usage.prompt_tokens || 0,
              outputTokens: result.usage.completion_tokens || 0,
              reasoningTokens: result.usage.reasoning_tokens || 0
            }
          );
        } catch (error) {
          console.error('Token tracking failed:', error);
        }
      }

      // Parse output
      const parsed = parseOutput(result.content);

      if (!parsed) {
        setParseError(true);
        toast.error('Could not parse AI response. See raw output below.');
        return;
      }

      // Validate IMPROVE mode outputs
      if (mode === 'improve' && 'best' in parsed) {
        const improveOptions: ImproveOptions = {
          goal: improveGoal,
          platform: improvePlatform,
          length: improveLength,
          humanTone: humanTone,
          specialInstructions: specialInstructions
        };

        const validation = validateImprovedOutput(input, parsed.best, improveOptions);

        // Log validation results
        if (validation.warnings.length > 0) {
          console.warn('Output validation warnings:', validation.warnings);
        }

        if (!validation.valid) {
          console.error('Output validation failed:', validation.errors);

          // Try fallback generation once
          console.log('Attempting fallback generation with stricter constraints...');

          try {
            const fallbackPrompt = generateFallbackOutput(
              input,
              detectedLang,
              getLanguageName(detectedLang)
            );

            const fallbackMessages = [
              { role: 'system', content: fallbackPrompt.system },
              { role: 'user', content: fallbackPrompt.user }
            ];

            const fallbackResult = await makeRequestWithFallback(
              'gpt-4o', // Use GPT for fallback
              'gpt-4o',
              fallbackMessages
            );

            const fallbackParsed = parseOutput(fallbackResult.content);

            if (fallbackParsed) {
              setOutput(fallbackParsed);
              toast.success('Generated with fallback mode');
              playSuccessSound();
              return;
            }
          } catch (fallbackError) {
            console.error('Fallback generation failed:', fallbackError);
          }

          // If fallback also failed, show warning but display original output
          toast.error('Output quality issues detected. Consider regenerating.', {
            duration: 4000
          });
        }
      }

      // Validate ANSWER mode outputs
      if (mode === 'answer' && 'best' in parsed) {
        const answerOptions: AnswerOptions = {
          replyStyle: answerStyle,
          stance: answerStance,
          length: answerLength,
          humanTone: humanTone,
          specialInstructions: specialInstructions
        };

        const validation = validateAnswerOutput(input, parsed.best, answerOptions);

        // Log validation results
        if (validation.warnings.length > 0) {
          console.warn('ANSWER validation warnings:', validation.warnings);
        }

        if (!validation.valid) {
          console.error('ANSWER validation failed:', validation.errors);

          // Try fallback generation once
          console.log('Attempting ANSWER fallback generation with stricter constraints...');

          try {
            const fallbackPrompt = generateFallbackAnswer(
              input,
              detectedLang,
              getLanguageName(detectedLang)
            );

            const fallbackMessages = [
              { role: 'system', content: fallbackPrompt.system },
              { role: 'user', content: fallbackPrompt.user }
            ];

            const fallbackResult = await makeRequestWithFallback(
              'gpt-4o', // Use GPT for fallback
              'gpt-4o',
              fallbackMessages
            );

            const fallbackParsed = parseOutput(fallbackResult.content);

            if (fallbackParsed) {
              setOutput(fallbackParsed);
              toast.success('Generated with fallback mode');
              playSuccessSound();
              return;
            }
          } catch (fallbackError) {
            console.error('ANSWER fallback generation failed:', fallbackError);
          }

          // If fallback also failed, show warning but display original output
          toast.error('Reply quality issues detected. Consider regenerating.', {
            duration: 4000
          });
        }
      }

      setOutput(parsed);
      toast.success('Generated successfully!');
      playSuccessSound();
    } catch (error: any) {
      console.error('Generation error:', error);
      toast.error(error.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle modify content
  const handleModify = async () => {
    if (!modifyInstruction.trim() || !output || isModifying) return;

    setIsModifying(true);

    try {
      // Get session ID if one exists (should already exist if session was saved)
      const activeSessionId = getSessionId();

      // Get the current best output
      const currentContent = mode === 'question'
        ? (output as QuestionOutput).questions.join('\n\n')
        : 'best' in output ? output.best : '';

      // Detect language
      const detectedLang = detectLanguage(currentContent);
      const langName = getLanguageName(detectedLang);

      // Build modification prompt
      const systemPrompt = `You are CopySnap, an AI assistant that modifies text based on user instructions. CRITICAL: The content is in ${langName}. You MUST respond in ${langName} (language code: ${detectedLang}). All sections of your JSON output must be in ${langName}.

Your task: Modify the provided text according to the user's instruction while maintaining the overall quality and style.

Return ONLY valid JSON with the same structure as the original output.${humanTone ? `

Apply Human Tone: Write in a natural, human-sounding voice. Sound like a real person writing, not marketing copy or AI-generated text. Use natural sentence rhythm, concrete language, and avoid buzzwords or AI-style filler.` : ''}`;

      const userPrompt = `Original text:
"""
${currentContent}
"""

Modification instruction: ${modifyInstruction}

Please modify the text according to the instruction above and return it in the same JSON format as the original output.${mode === 'improve' ? `

Return JSON format:
{
  "best": "modified version",
  "alternatives": ["alternative 1", "alternative 2"],
  "notes": ["tip 1", "tip 2", "tip 3"]
}` : mode === 'answer' ? `

Return JSON format:
{
  "best": "modified reply",
  "alternatives": ["alternative reply 1", "alternative reply 2"]
}` : `

Return JSON format:
{
  "questions": ["question 1", "question 2", ...]
}`}

Do NOT add markdown formatting, code blocks, or explanations. Just raw JSON. Remember: ALL text in the JSON must be in ${langName}.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      // Use selected model with Claude fallback
      const result = await makeRequestWithFallback(
        selectedModel || 'claude-sonnet-4-5',
        'claude-sonnet-4-5',
        messages
      );

      setUsedFallback(result.usedFallback);
      setModelUsed(result.modelUsed);
      setRawOutput(result.content);
      setShowFallbackBanner(result.usedFallback);

      // Track tokens for the actual model used
      if (currentUser?.id && result.usage) {
        try {
          const totalTokens = (result.usage.prompt_tokens || 0) + (result.usage.completion_tokens || 0);
          await trackTokenUsage(
            currentUser,
            totalTokens,
            result.modelUsed,
            'copy-snap-modify',
            activeSessionId,
            0,
            undefined,
            {
              inputTokens: result.usage.prompt_tokens || 0,
              outputTokens: result.usage.completion_tokens || 0,
              reasoningTokens: result.usage.reasoning_tokens || 0
            }
          );
        } catch (error) {
          console.error('Token tracking failed:', error);
        }
      }

      // Parse output
      const parsed = parseOutput(result.content);

      if (!parsed) {
        setParseError(true);
        toast.error('Could not parse AI response. See raw output below.');
        return;
      }

      setOutput(parsed);
      setModifyInstruction(''); // Clear the instruction after successful modification
      toast.success('Content modified successfully!');
    } catch (error: any) {
      console.error('Modification error:', error);
      toast.error(error.message || 'Modification failed');
    } finally {
      setIsModifying(false);
    }
  };

  // Copy to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      toast.success('Copied ✅');
      setTimeout(() => setCopySuccess(false), 2000);
    }).catch(() => {
      toast.error('Failed to copy');
    });
  };

  // Regenerate
  const handleRegenerate = () => {
    handleGenerate();
  };

  // Replace input with output
  const handleReplaceInput = (text: string) => {
    setInput(text);
    setOutput(null);
    setUsedFallback(false);
    setParseError(false);
    toast.success('Input replaced');
  };

  // Clear input
  const handleClear = () => {
    setInput('');
    setSpecialInstructions('');
    setOutput(null);
    setUsedFallback(false);
    setParseError(false);
    setRawOutput('');
    setShowFallbackBanner(false);
    setModifyInstruction('');

    // Clear session to start fresh
    setSessionId(null);
    setSessionName(null);
    setIntentContext(null);
    sessionManager.clearCurrentSession(scopeKey);

    // Reset to defaults
    setImproveGoal('clearer');
    setImprovePlatform('general');
    setImproveLength('same');
    setAnswerStyle('helpful');
    setAnswerStance('neutral');
    setAnswerLength('short');
    setQuestionType('clarify');
    setQuestionCount(3);
    setQuestionDirectness('soft');
    setHumanTone(false);
  };

  // Keep input when switching modes but clear output and session
  useEffect(() => {
    setOutput(null);
    setUsedFallback(false);
    setParseError(false);
    setShowFallbackBanner(false);
    setModifyInstruction('');

    // Clear session when mode changes to create a new session with appropriate name
    setSessionId(null);
    setSessionName(null);
    setIntentContext(null);
    sessionManager.clearCurrentSession(scopeKey);
  }, [mode, scopeKey]);

  // Watch for platform/preset changes that should reset session
  useEffect(() => {
    // Only check if we have an existing session
    if (!sessionId || !intentContext) {
      return;
    }

    const currentContext = getCurrentIntentContext();
    const needsReset = shouldResetSession(intentContext, currentContext);

    if (needsReset) {
      console.log('CopySnap: Platform/preset changed, will create new session on next generation');
      // Don't clear immediately - let ensureSession handle it on next generation
      // This prevents premature session clearing when users are just adjusting settings
    }
  }, [improveGoal, improvePlatform, answerStyle, questionType, sessionId, intentContext]);

  // Clear session on unmount
  useEffect(() => {
    return () => {
      sessionManager.clearCurrentSession(scopeKey);
    };
  }, [scopeKey]);

  // Load saved output from URL param
  useEffect(() => {
    const savedOutputId = searchParams.get('savedOutputId');

    const loadSavedOutput = async () => {
      if (!savedOutputId || !currentUser) return;

      console.log('CopySnap: Loading saved output:', savedOutputId);

      try {
        const { data, error } = await getSavedOutput(savedOutputId);

        if (error) {
          console.error('CopySnap: Error loading saved output:', error);
          toast.error('Failed to load saved output');
          setSearchParams({});
          return;
        }

        if (data && data.input_data) {
          console.log('CopySnap: Loaded data:', data);
          const inputData = data.input_data as any;

          // Restore input and mode
          if (inputData.input_text) {
            console.log('CopySnap: Restoring input text');
            setInput(inputData.input_text);
          }
          if (inputData.mode) {
            console.log('CopySnap: Restoring mode:', inputData.mode);
            setMode(inputData.mode as CopySnapMode);
          }
          if (inputData.special_instructions) setSpecialInstructions(inputData.special_instructions);
          if (typeof inputData.human_tone === 'boolean') setHumanTone(inputData.human_tone);

          // Restore mode-specific settings
          if (inputData.mode === 'improve') {
            if (inputData.goal) setImproveGoal(inputData.goal as ImproveGoal);
            if (inputData.platform) setImprovePlatform(inputData.platform as ImprovePlatform);
            if (inputData.length) setImproveLength(inputData.length as ImproveLength);
          } else if (inputData.mode === 'answer') {
            if (inputData.style) setAnswerStyle(inputData.style as AnswerStyle);
            if (inputData.stance) setAnswerStance(inputData.stance as AnswerStance);
            if (inputData.length) setAnswerLength(inputData.length as AnswerLength);
          } else if (inputData.mode === 'question') {
            if (inputData.type) setQuestionType(inputData.type as QuestionType);
            if (inputData.count) setQuestionCount(inputData.count as QuestionCount);
            if (inputData.directness) setQuestionDirectness(inputData.directness as QuestionDirectness);
          }

          // Restore output if available
          if (data.output_data) {
            console.log('CopySnap: Restoring output');
            setOutput(data.output_data as ImproveOutput | AnswerOutput | QuestionOutput);
          }

          toast.success('Saved output loaded successfully!');
          setSearchParams({}); // Clear URL params after loading
        } else {
          console.warn('CopySnap: No data or input_data found');
          setSearchParams({}); // Clear invalid state
        }
      } catch (error: any) {
        console.error('CopySnap: Exception loading saved output:', error);
        toast.error('Failed to load saved output');
        setSearchParams({}); // Clear on error
      }
    };

    if (savedOutputId) {
      loadSavedOutput();
    }
  }, [searchParams, currentUser]);

  // Load session from URL param
  useEffect(() => {
    const urlSessionId = searchParams.get('sessionId');

    const loadSession = async () => {
      if (!urlSessionId || !currentUser) return;

      console.log('CopySnap: Loading session:', urlSessionId);

      try {
        const { getCopySession } = await import('../services/supabaseClient');
        const { data, error } = await getCopySession(urlSessionId);

        if (error) {
          console.error('CopySnap: Error loading session:', error);
          toast.error('Failed to load session');
          setSearchParams({});
          return;
        }

        if (data && data.output_type === 'copy-snap') {
          console.log('CopySnap: Loaded session data:', data);
          const inputData = (data.input_data || {}) as any;

          // Restore input text (NEW)
          if (inputData.input) setInput(inputData.input);
          if (inputData.specialInstructions) setSpecialInstructions(inputData.specialInstructions);
          if (typeof inputData.humanTone === 'boolean') setHumanTone(inputData.humanTone);

          // Restore mode from input_data
          if (inputData.mode) {
            console.log('CopySnap: Restoring mode:', inputData.mode);
            setMode(inputData.mode as CopySnapMode);
          }

          // Restore mode-specific settings from input_data
          // For improve mode
          if (inputData.improveGoal) setImproveGoal(inputData.improveGoal as ImproveGoal);
          if (inputData.improvePlatform) setImprovePlatform(inputData.improvePlatform as ImprovePlatform);
          if (inputData.improveLength) setImproveLength(inputData.improveLength as ImproveLength);

          // For answer mode
          if (inputData.answerStyle) setAnswerStyle(inputData.answerStyle as AnswerStyle);
          if (inputData.answerStance) setAnswerStance(inputData.answerStance as AnswerStance);
          if (inputData.answerLength) setAnswerLength(inputData.answerLength as AnswerLength);

          // For question mode
          if (inputData.questionType) setQuestionType(inputData.questionType as QuestionType);
          if (inputData.questionCount) setQuestionCount(inputData.questionCount as QuestionCount);
          if (inputData.questionDirectness) setQuestionDirectness(inputData.questionDirectness as QuestionDirectness);

          // Set session ID and name so new generations continue in the same session
          setSessionId(data.id);
          if (data.session_name) {
            setSessionName(data.session_name);
          }

          // Set intent context from session data
          const loadedContext: CopySnapIntentContext = {
            mode: inputData.mode || 'improve',
            improveGoal: inputData.improveGoal,
            improvePlatform: inputData.improvePlatform,
            answerStyle: inputData.answerStyle,
            questionType: inputData.questionType
          };
          setIntentContext(loadedContext);

          toast.success('Session settings restored! Enter your text to continue.');
          setSearchParams({}); // Clear URL params after loading
        } else if (data) {
          toast.error('This is not a CopySnap session');
          setSearchParams({}); // Clear invalid session type
        }
      } catch (error: any) {
        console.error('CopySnap: Error loading session:', error);
        toast.error('Failed to load session');
        setSearchParams({}); // Clear on error
      }
    };

    if (urlSessionId) {
      loadSession();
    }
  }, [searchParams, currentUser]);


  // Handle save output
  const handleSaveOutput = async () => {
    if (!currentUser) {
      toast.error('Please log in to save outputs');
      return;
    }

    if (!output) {
      toast.error('No output to save');
      return;
    }

    if (!saveTitle.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsSaving(true);
    try {
      const savedOutput: Partial<SavedOutput> = {
        user_id: currentUser.id,
        title: saveTitle.trim(),
        description: saveDescription.trim() || undefined,
        input_data: {
          input_text: input,
          mode: mode,
          special_instructions: specialInstructions,
          human_tone: humanTone,
          // Mode-specific settings
          ...(mode === 'improve' && {
            goal: improveGoal,
            platform: improvePlatform,
            length: improveLength
          }),
          ...(mode === 'answer' && {
            style: answerStyle,
            stance: answerStance,
            length: answerLength
          }),
          ...(mode === 'question' && {
            type: questionType,
            count: questionCount,
            directness: questionDirectness
          })
        },
        output_data: output,
        tags: [mode, modelUsed].filter(Boolean),
        saved_mode: formMode // Save the current form mode (Quick/Standard/Advanced)
        // Note: created_at is automatically set by database DEFAULT now()
      };

      const result = await saveSavedOutput(savedOutput as SavedOutput);

      if (result.error) {
        throw new Error(result.error.message);
      }

      toast.success('Output saved successfully!');
      setShowSaveModal(false);
      setSaveTitle('');
      setSaveDescription('');
    } catch (error: any) {
      console.error('Error saving output:', error);
      toast.error(error.message || 'Failed to save output');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle save session
  const handleSaveSessionClick = () => {
    if (!currentUser) {
      toast.error('Please log in to save sessions');
      return;
    }

    // Generate default session name with "Copy Snap: " prefix
    const modeLabel = mode.charAt(0).toUpperCase() + mode.slice(1);
    let presetLabel = '';

    if (mode === 'improve') {
      presetLabel = improveGoal.charAt(0).toUpperCase() + improveGoal.slice(1);
    } else if (mode === 'answer') {
      presetLabel = answerStyle.charAt(0).toUpperCase() + answerStyle.slice(1);
    } else {
      presetLabel = questionType.charAt(0).toUpperCase() + questionType.slice(1);
    }

    const suggestedName = `Copy Snap: ${modeLabel} - ${presetLabel}`;
    setSaveSessionName(suggestedName);

    // Pre-fill description with context
    const descParts: string[] = [];
    descParts.push(`Mode: ${modeLabel}`);

    if (mode === 'improve') {
      descParts.push(`Goal: ${improveGoal}`);
      if (improvePlatform !== 'general') descParts.push(`Platform: ${improvePlatform}`);
    } else if (mode === 'answer') {
      descParts.push(`Style: ${answerStyle}`);
      if (answerStance !== 'neutral') descParts.push(`Stance: ${answerStance}`);
    } else {
      descParts.push(`Type: ${questionType}`);
      descParts.push(`Count: ${questionCount}`);
    }

    if (humanTone) descParts.push('Human tone enabled');

    setSaveSessionDescription(descParts.join(' • '));
    setShowSaveSessionModal(true);
  };

  const handleSaveSession = async () => {
    if (!currentUser) {
      toast.error('Please log in to save sessions');
      return;
    }

    if (!saveSessionName.trim()) {
      toast.error('Please enter a session name');
      return;
    }

    setIsSavingSession(true);
    try {
      let actualSessionId = sessionId;

      // If no session exists yet, create one
      if (!actualSessionId) {
        const session = await sessionManager.getOrCreateSessionId(
          currentUser.id,
          'copy-snap',
          saveSessionName.trim(),
          undefined,
          {
            mode,
            improveGoal: mode === 'improve' ? improveGoal : undefined,
            improvePlatform: mode === 'improve' ? improvePlatform : undefined,
            answerStyle: mode === 'answer' ? answerStyle : undefined,
            questionType: mode === 'question' ? questionType : undefined
          },
          scopeKey,
          'copy-snap'
        );
        actualSessionId = session.id;
        setSessionId(actualSessionId);
        setSessionName(saveSessionName.trim());
      }

      // Update the session with the custom name and ALL data
      await sessionManager.updateSession(
        actualSessionId,
        saveSessionName.trim(),
        {
          input: input, // SAVE INPUT TEXT
          mode,
          specialInstructions,
          humanTone,
          // Improve mode settings
          improveGoal: mode === 'improve' ? improveGoal : undefined,
          improvePlatform: mode === 'improve' ? improvePlatform : undefined,
          improveLength: mode === 'improve' ? improveLength : undefined,
          // Answer mode settings
          answerStyle: mode === 'answer' ? answerStyle : undefined,
          answerStance: mode === 'answer' ? answerStance : undefined,
          answerLength: mode === 'answer' ? answerLength : undefined,
          // Question mode settings
          questionType: mode === 'question' ? questionType : undefined,
          questionCount: mode === 'question' ? questionCount : undefined,
          questionDirectness: mode === 'question' ? questionDirectness : undefined
        }
      );

      toast.success('Session saved successfully!');
      setShowSaveSessionModal(false);
      setSaveSessionName('');
      setSaveSessionDescription('');
    } catch (error: any) {
      console.error('Error saving session:', error);
      toast.error(error.message || 'Failed to save session');
    } finally {
      setIsSavingSession(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex">
      <NavSidebar />
      <div className="flex-1 min-w-0">
      {/* Header */}
      <div className="bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
        <div className="px-4 py-3 max-w-4xl mx-auto text-center">
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
            <Zap size={20} className="text-yellow-500" />
            Copy Snap
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">Improve, answer, or ask — without the fluff."</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-4 space-y-6 pb-32">
        {/* Input Card */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Your Text
            </label>
            {input && (
              <button
                onClick={handleClear}
                className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
              >
                <X size={14} />
                Clear
              </button>
            )}
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Paste a tweet, message, or idea…"
            className="w-full min-h-[160px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-base focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-y"
            style={{ lineHeight: '1.5' }}
            maxLength={maxChars}
          />
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs ${charCount > maxChars * 0.9 ? 'text-orange-500' : 'text-gray-500 dark:text-gray-400'}`}>
              {charCount} / {maxChars} characters
            </span>
            {charCount > maxChars * 0.9 && (
              <span className="text-xs text-orange-500">
                {charCount >= maxChars ? 'Character limit reached' : 'Approaching limit'}
              </span>
            )}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-2 shadow-sm">
          <div className="grid grid-cols-3 gap-2">
            {(['improve', 'answer', 'question'] as CopySnapMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-3 px-4 rounded-md text-sm font-medium transition-colors ${
                  mode === m
                    ? 'bg-gray-900 dark:bg-gray-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {m.charAt(0).toUpperCase() + m.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Controls */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm space-y-4">
          {mode === 'improve' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Goal</label>
                <div className="flex flex-wrap gap-2">
                  {(['clearer', 'persuasive', 'shorter', 'punchier'] as ImproveGoal[]).map((goal) => (
                    <button
                      key={goal}
                      onClick={() => setImproveGoal(goal)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                        improveGoal === goal
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {goal.charAt(0).toUpperCase() + goal.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {(['general', 'x', 'linkedin', 'email'] as ImprovePlatform[]).map((platform) => (
                    <button
                      key={platform}
                      onClick={() => setImprovePlatform(platform)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                        improvePlatform === platform
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {platform === 'x' ? 'X' : platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Length</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['short', 'same', 'longer'] as ImproveLength[]).map((length) => (
                    <button
                      key={length}
                      onClick={() => setImproveLength(length)}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        improveLength === length
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'answer' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reply Style</label>
                <div className="flex flex-wrap gap-2">
                  {(['helpful', 'friendly', 'confident', 'witty', 'direct'] as AnswerStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setAnswerStyle(style)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                        answerStyle === style
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Stance</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['neutral', 'agree', 'disagree'] as AnswerStance[]).map((stance) => (
                    <button
                      key={stance}
                      onClick={() => setAnswerStance(stance)}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        answerStance === stance
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {stance.charAt(0).toUpperCase() + stance.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Length</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['short', 'medium', 'long'] as AnswerLength[]).map((length) => (
                    <button
                      key={length}
                      onClick={() => setAnswerLength(length)}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        answerLength === length
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {length.charAt(0).toUpperCase() + length.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {mode === 'question' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question Type</label>
                <div className="flex flex-wrap gap-2">
                  {(['clarify', 'challenge', 'explore', 'convert'] as QuestionType[]).map((type) => (
                    <button
                      key={type}
                      onClick={() => setQuestionType(type)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                        questionType === type
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Count</label>
                <div className="flex gap-2">
                  {([1, 3, 5] as QuestionCount[]).map((count) => (
                    <button
                      key={count}
                      onClick={() => setQuestionCount(count)}
                      className={`py-2 px-4 rounded-full text-sm font-medium transition-colors ${
                        questionCount === count
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Directness</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['soft', 'direct'] as QuestionDirectness[]).map((directness) => (
                    <button
                      key={directness}
                      onClick={() => setQuestionDirectness(directness)}
                      className={`py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                        questionDirectness === directness
                          ? 'bg-gray-900 dark:bg-gray-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      }`}
                    >
                      {directness.charAt(0).toUpperCase() + directness.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Special Instructions */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Special Instructions <span className="text-gray-500 dark:text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={specialInstructions}
            onChange={(e) => setSpecialInstructions(e.target.value)}
            placeholder="Add any specific requirements or preferences..."
            className="w-full min-h-[80px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-y"
            style={{ lineHeight: '1.5' }}
          />
        </div>

        {/* Human Tone Toggle */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={humanTone}
              onChange={(e) => setHumanTone(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-0 cursor-pointer"
            />
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Human tone</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Make output sound more natural and social-native (less AI-polished)
              </p>
            </div>
          </label>
        </div>

        {/* Fallback Indicator */}
        {showFallbackBanner && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1">
              <AlertCircle size={16} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200">Used GPT-4o (fallback)</h4>
                <p className="text-sm text-blue-800 dark:text-blue-300 mt-0.5">
                  DeepSeek was unavailable, so we generated this with GPT-4o.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowFallbackBanner(false)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 flex-shrink-0"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Output Card */}
        {output && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Best Output</h3>
              <button
                onClick={() => handleCopy('best' in output ? output.best : (output as QuestionOutput).questions.join('\n\n'))}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                {copySuccess ? (
                  <>
                    <Check size={16} className="text-green-500" />
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              {mode === 'question' ? (
                <>
                  <div className="space-y-3 mb-3">
                    {(output as QuestionOutput).questions.map((q, idx) => (
                      <div key={idx} className="text-gray-900 dark:text-gray-100 text-base leading-relaxed">
                        <span className="font-medium">{idx + 1}.</span> {q}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => handleCopy((output as QuestionOutput).questions.join('\n\n'))}
                    className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    <Copy size={14} />
                    Copy all questions
                  </button>
                </>
              ) : (
                <p className="text-gray-900 dark:text-gray-100 text-base leading-relaxed whitespace-pre-wrap">
                  {'best' in output && output.best}
                </p>
              )}
            </div>

            {/* Alternatives */}
            {'alternatives' in output && output.alternatives.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white list-none flex items-center gap-2">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  Alternatives ({output.alternatives.length})
                </summary>
                <div className="mt-3 space-y-3">
                  {output.alternatives.map((alt, idx) => (
                    <div key={idx} className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Alternative {idx + 1}</span>
                        <button
                          onClick={() => handleCopy(alt)}
                          className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors flex-shrink-0"
                          aria-label={`Copy alternative ${idx + 1}`}
                        >
                          <Copy size={14} />
                        </button>
                      </div>
                      <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed whitespace-pre-wrap">
                        {alt}
                      </p>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Notes (Improve mode only) */}
            {mode === 'improve' && 'notes' in output && output.notes.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white list-none flex items-center gap-2">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  Tips ({output.notes.length})
                </summary>
                <div className="mt-3 space-y-2">
                  {output.notes.map((note, idx) => (
                    <div key={idx} className="text-gray-700 dark:text-gray-300 text-sm flex gap-2">
                      <span>•</span>
                      <span>{note}</span>
                    </div>
                  ))}
                </div>
              </details>
            )}

            {/* Secondary Actions */}
            <div className="flex gap-2 pt-2 flex-wrap">
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <RefreshCw size={14} />
                Regenerate
              </button>
              <button
                onClick={() => handleReplaceInput('best' in output ? output.best : (output as QuestionOutput).questions.join('\n\n'))}
                className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <Replace size={14} />
                Replace Input
              </button>
              {currentUser && (
                  <button
                    onClick={() => {
                      // Auto-fill title from input text
                      setSaveTitle(input.trim().substring(0, 100));

                      // Auto-generate description with context
                      let descParts: string[] = [];
                      descParts.push(`Mode: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`);

                      if (mode === 'improve') {
                        if (improveGoal) descParts.push(`Goal: ${improveGoal.charAt(0).toUpperCase() + improveGoal.slice(1)}`);
                        if (improvePlatform) descParts.push(`Platform: ${improvePlatform.charAt(0).toUpperCase() + improvePlatform.slice(1)}`);
                        if (improveLength) descParts.push(`Length: ${improveLength.charAt(0).toUpperCase() + improveLength.slice(1)}`);
                      } else if (mode === 'answer') {
                        if (answerStyle) descParts.push(`Style: ${answerStyle.charAt(0).toUpperCase() + answerStyle.slice(1)}`);
                        if (answerStance) descParts.push(`Stance: ${answerStance.charAt(0).toUpperCase() + answerStance.slice(1)}`);
                        if (answerLength) descParts.push(`Length: ${answerLength.charAt(0).toUpperCase() + answerLength.slice(1)}`);
                      } else if (mode === 'question') {
                        if (questionType) descParts.push(`Type: ${questionType.charAt(0).toUpperCase() + questionType.slice(1)}`);
                        if (questionCount) descParts.push(`Count: ${questionCount}`);
                        if (questionDirectness) descParts.push(`Directness: ${questionDirectness.charAt(0).toUpperCase() + questionDirectness.slice(1)}`);
                      }

                      if (humanTone) descParts.push('Human tone: Yes');
                      if (specialInstructions) descParts.push(`Instructions: ${specialInstructions.substring(0, 100)}${specialInstructions.length > 100 ? '...' : ''}`);

                      setSaveDescription(descParts.join(' • '));
                      setShowSaveModal(true);
                    }}
                    className="flex items-center gap-2 text-sm text-yellow-600 dark:text-yellow-500 hover:text-yellow-700 dark:hover:text-yellow-400 transition-colors font-medium"
                  >
                    <Save size={14} />
                    Save Output
                  </button>
              )}
            </div>
          </div>
        )}

        {/* Modify Content Section */}
        {output && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Modify Output <span className="text-gray-500 dark:text-gray-400 font-normal">(optional)</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Refine the output with instructions like "make it shorter", "add more emotion", or "remove the emoji"
            </p>
            <textarea
              value={modifyInstruction}
              onChange={(e) => setModifyInstruction(e.target.value)}
              placeholder='e.g., "make it more casual" or "shorten to 100 words"'
              className="w-full min-h-[80px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-y"
              style={{ lineHeight: '1.5' }}
              disabled={isModifying}
            />
            <div className="mt-3">
              <button
                onClick={handleModify}
                disabled={!modifyInstruction.trim() || isModifying}
                className="w-full bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium text-sm py-3 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isModifying ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Modifying...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Apply Modification
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Parse Error - Show Raw Output */}
        {parseError && rawOutput && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-medium text-amber-900 dark:text-amber-200">Parse recovery</h3>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                  Could not parse the AI response. Here's the raw output:
                </p>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-700 rounded p-3">
              <pre className="text-xs text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                {rawOutput}
              </pre>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(rawOutput)}
                className="text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 flex items-center gap-1"
              >
                <Copy size={14} />
                Copy raw output
              </button>
              <button
                onClick={handleRegenerate}
                className="text-sm text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 flex items-center gap-1"
              >
                <RefreshCw size={14} />
                Retry
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Generate Button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 p-4 safe-area-inset-bottom">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-semibold text-base py-4 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            style={{ minHeight: '44px' }}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={20} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap size={20} />
                Generate
              </>
            )}
          </button>
        </div>
      </div>

      {/* Floating Action Bar - Left Side - Save Session */}
      {(input.trim() || output) && (
        <div className="fixed left-2 sm:left-4 top-1/2 transform -translate-y-1/2 z-40">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-1.5 sm:p-2">
            <button
              onClick={handleSaveSessionClick}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Save Session"
            >
              <BookmarkPlus size={14} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Bar - Right Side - Save Output */}
      {output && (
        <div className="fixed right-2 sm:right-4 top-1/2 transform -translate-y-1/2 z-40">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-1.5 sm:p-2">
            <button
              onClick={handleSaveSessionClick}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors"
              title="Save Output"
            >
              <Save size={14} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </div>
      )}

      {/* Save Output Modal */}
      {showSaveModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !isSaving && setShowSaveModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save Output</h3>
              <button
                onClick={() => setShowSaveModal(false)}
                disabled={isSaving}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={saveTitle}
                  onChange={(e) => setSaveTitle(e.target.value)}
                  placeholder="e.g., Twitter post improvement"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  disabled={isSaving}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {saveTitle.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={saveDescription}
                  onChange={(e) => setSaveDescription(e.target.value)}
                  placeholder="Add notes about this output..."
                  className="w-full min-h-[100px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 resize-y"
                  disabled={isSaving}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {saveDescription.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveModal(false)}
                  disabled={isSaving}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveOutput}
                  disabled={isSaving || !saveTitle.trim()}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Session Modal */}
      {showSaveSessionModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => !isSavingSession && setShowSaveSessionModal(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Save Session</h3>
              <button
                onClick={() => setShowSaveSessionModal(false)}
                disabled={isSavingSession}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Session Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={saveSessionName}
                  onChange={(e) => setSaveSessionName(e.target.value)}
                  placeholder="e.g., Copy Snap: Improve - Clearer"
                  className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={isSavingSession}
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {saveSessionName.length}/100 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description <span className="text-gray-500">(optional)</span>
                </label>
                <textarea
                  value={saveSessionDescription}
                  onChange={(e) => setSaveSessionDescription(e.target.value)}
                  placeholder="Add notes about this session..."
                  className="w-full min-h-[100px] bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg p-3 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
                  disabled={isSavingSession}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {saveSessionDescription.length}/500 characters
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowSaveSessionModal(false)}
                  disabled={isSavingSession}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-medium py-2.5 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSession}
                  disabled={isSavingSession || !saveSessionName.trim()}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSavingSession ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default CopySnap;
