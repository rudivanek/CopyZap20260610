interface ExtractedBrandVoice {
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
}

/**
 * Fetch brand voice from URL via edge function (bypasses CORS and does AI analysis)
 */
async function fetchBrandVoiceFromUrl(url: string, scanAbout: boolean, userId?: string, sessionId?: string | null): Promise<ExtractedBrandVoice> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase configuration is missing');
  }

  const edgeFunctionUrl = `${supabaseUrl}/functions/v1/extract-brand-voice-from-url`;

  try {
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        url,
        scanAbout,
        user_id: userId,
        session_id: sessionId || null
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `Failed to fetch URL: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to extract brand voice from URL');
    }

    return data.brandVoice;
  } catch (error: any) {
    console.error('Error fetching brand voice from URL:', error);
    throw new Error(error.message || 'Failed to fetch brand voice from URL');
  }
}

/**
 * Extract brand voice from website URL
 */
export async function extractBrandVoiceFromUrl(
  url: string,
  scanAbout: boolean = false,
  userId?: string,
  sessionId?: string | null
): Promise<ExtractedBrandVoice> {
  // Validate URL
  if (!url || !url.trim()) {
    throw new Error('URL is required');
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl.match(/^https?:\/\//i)) {
    throw new Error('URL must start with http:// or https://');
  }

  try {
    // Fetch and analyze brand voice via edge function (bypasses CORS and does AI analysis)
    const brandVoice = await fetchBrandVoiceFromUrl(trimmedUrl, scanAbout, userId, sessionId);

    return {
      description: brandVoice.description || '',
      personality_traits: brandVoice.personality_traits || [],
      tone_style: brandVoice.tone_style || '',
      sentence_style: brandVoice.sentence_style || '',
      preferred_vocabulary: brandVoice.preferred_vocabulary || [],
      forbidden_terms: brandVoice.forbidden_terms || [],
      cta_style: brandVoice.cta_style || 'direct-action',
      punctuation_rules: {
        use_oxford_comma: brandVoice.punctuation_rules?.use_oxford_comma ?? true,
        prefer_short_sentences: brandVoice.punctuation_rules?.prefer_short_sentences ?? false,
        max_sentence_length: brandVoice.punctuation_rules?.max_sentence_length ?? 25,
        use_contractions: brandVoice.punctuation_rules?.use_contractions ?? true,
        exclamation_frequency: brandVoice.punctuation_rules?.exclamation_frequency ?? 'moderate'
      }
    };
  } catch (error: any) {
    console.error('Error extracting brand voice from URL:', error);
    throw new Error(error.message || 'Failed to extract brand voice from URL');
  }
}
