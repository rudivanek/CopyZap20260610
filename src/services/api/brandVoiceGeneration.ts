import { makeApiRequestWithFallback, cleanJsonResponse } from './utils';
import { AdvancedBrandVoiceStyle } from '../../types';

interface GeneratedBrandVoice {
  description: string;
  personality_traits: string[];
  tone_style: string;
  sentence_style: string;
  preferred_vocabulary: string[];
  forbidden_terms: string[];
  cta_style: string;
  punctuation_rules: {
    use_oxford_comma?: boolean;
    prefer_short_sentences?: boolean;
    max_sentence_length?: number;
    use_contractions?: boolean;
    exclamation_frequency?: 'rare' | 'moderate' | 'frequent';
  };
  advanced_style?: AdvancedBrandVoiceStyle;
}

export async function analyzePastedBrandVoice(
  pastedContent: string,
  userId?: string,
  sessionId?: string | null
): Promise<GeneratedBrandVoice> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const apiUrl = `${supabaseUrl}/functions/v1/analyze-brand-voice`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pastedContent,
        user_id: userId,
        session_id: sessionId || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to analyze' }));
      throw new Error(errorData.error || 'Failed to analyze pasted content');
    }

    const parsed = await response.json();

    return {
      description: parsed.description || '',
      personality_traits: parsed.personality_traits || [],
      tone_style: parsed.tone_style || '',
      sentence_style: parsed.sentence_style || '',
      preferred_vocabulary: parsed.preferred_vocabulary || [],
      forbidden_terms: parsed.forbidden_terms || [],
      cta_style: parsed.cta_style || 'direct-action',
      punctuation_rules: {
        use_oxford_comma: parsed.punctuation_rules?.use_oxford_comma ?? true,
        prefer_short_sentences: parsed.punctuation_rules?.prefer_short_sentences ?? false,
        max_sentence_length: parsed.punctuation_rules?.max_sentence_length ?? 25,
        use_contractions: parsed.punctuation_rules?.use_contractions ?? true,
        exclamation_frequency: parsed.punctuation_rules?.exclamation_frequency ?? 'moderate'
      },
      advanced_style: parsed.advanced_style || undefined
    };
  } catch (error: any) {
    console.error('Error analyzing pasted brand voice:', error);
    throw new Error(error.message || 'Failed to analyze pasted content');
  }
}

export async function generateBrandVoice(
  brandDescription: string,
  sampleText?: string,
  userId?: string,
  sessionId?: string | null
): Promise<GeneratedBrandVoice> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    const apiUrl = `${supabaseUrl}/functions/v1/analyze-brand-voice`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brandDescription,
        sampleText: sampleText || undefined,
        user_id: userId,
        session_id: sessionId || null
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to generate' }));
      throw new Error(errorData.error || 'Failed to generate brand voice');
    }

    const parsed = await response.json();

    return {
      description: parsed.description || '',
      personality_traits: parsed.personality_traits || [],
      tone_style: parsed.tone_style || '',
      sentence_style: parsed.sentence_style || '',
      preferred_vocabulary: parsed.preferred_vocabulary || [],
      forbidden_terms: parsed.forbidden_terms || [],
      cta_style: parsed.cta_style || 'direct-action',
      punctuation_rules: {
        use_oxford_comma: parsed.punctuation_rules?.use_oxford_comma ?? true,
        prefer_short_sentences: parsed.punctuation_rules?.prefer_short_sentences ?? false,
        max_sentence_length: parsed.punctuation_rules?.max_sentence_length ?? 25,
        use_contractions: parsed.punctuation_rules?.use_contractions ?? true,
        exclamation_frequency: parsed.punctuation_rules?.exclamation_frequency ?? 'moderate'
      },
      advanced_style: parsed.advanced_style || undefined
    };
  } catch (error: any) {
    console.error('Error generating brand voice:', error);
    throw new Error(error.message || 'Failed to generate brand voice');
  }
}
