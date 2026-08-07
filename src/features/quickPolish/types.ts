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


