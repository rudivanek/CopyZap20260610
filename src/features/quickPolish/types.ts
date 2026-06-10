export type ContentType = 'plain' | 'html';

export interface QuickPolishInput {
  inputText: string;
  contentType: ContentType;
  intentId: string;
  audience?: string;
  goal?: string;
  tone?: string;
  cta?: string;
  specialInstructions?: string;
  variantsCount: 1 | 2 | 3;
}

export interface QuickPolishResult {
  variants: string[];
}

export interface PolishResultItem {
  text: string;
  sourceText?: string; // Source text used to generate this result (for evidence analysis)
  intentId: string;
  tone: string;
  contentType: ContentType;
  isRefined: boolean;
}

// Prefill payload for handoff from Intent Polish to Copy Maker
export interface PrefillToCopyMaker {
  source: 'intent_polish';
  original_input: string;       // raw user input (text or html)
  selected_output: string;      // the chosen polished output
  selected_output_word_count?: number; // word count of the selected output
  language?: string;            // e.g. "en" | "es" if known
  intent?: {
    id?: string;
    label?: string;
    audience?: string;
    goal?: string;
    tone?: string;
    cta?: string;
  };
  content_type?: ContentType;   // 'plain' | 'html'
  special_instructions?: string; // Special instructions from Intent Polish
  created_at: string;           // ISO string
}
