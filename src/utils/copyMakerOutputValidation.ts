/**
 * LIGHT Copy Maker Output Validation Layer
 *
 * Purpose: Prevent broken/malformed AI outputs from silently reaching the UI
 * Scope: Minimal structural validation only - no heavy content analysis
 *
 * This validation runs after AI response parsing, before UI state update and session save.
 * If validation fails, one automatic retry with a repair prompt is attempted.
 * If retry fails, user sees a warning with options to view raw output or regenerate.
 */

import { FormState, CopyResult, StructuredCopyOutput } from '../types';

export interface ValidationError {
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validate Copy Maker generation result
 *
 * LIGHT validation rules:
 * - improvedCopy must exist (string OR structured object)
 * - If structured: must have non-empty sections array
 * - If alternatives requested: at least one alternative must exist
 * - If SEO requested: seoMetadata must exist with at least 1 item
 * - Placeholder sanity check (warning-level)
 */
export function validateCopyMakerResult(
  result: any,
  formState: FormState
): ValidationResult {
  const errors: ValidationError[] = [];

  // RULE A: improvedCopy must exist
  if (!result || !result.improvedCopy) {
    errors.push({
      code: 'MISSING_IMPROVED_COPY',
      message: 'Generated content is missing or empty',
      path: 'improvedCopy'
    });
    return { valid: false, errors };
  }

  // RULE A continued: Validate improvedCopy structure
  const improvedCopy = result.improvedCopy;

  if (typeof improvedCopy === 'string') {
    // String format: must not be empty/whitespace
    if (!improvedCopy.trim()) {
      errors.push({
        code: 'EMPTY_IMPROVED_COPY',
        message: 'Generated content is empty or whitespace only',
        path: 'improvedCopy'
      });
    }
  } else if (typeof improvedCopy === 'object') {
    // Structured output format: validate structure
    const structured = improvedCopy as StructuredCopyOutput;

    if (!structured.sections || !Array.isArray(structured.sections)) {
      errors.push({
        code: 'INVALID_STRUCTURED_OUTPUT',
        message: 'Structured output missing sections array',
        path: 'improvedCopy.sections'
      });
    } else if (structured.sections.length === 0) {
      errors.push({
        code: 'EMPTY_SECTIONS_ARRAY',
        message: 'Structured output has empty sections array',
        path: 'improvedCopy.sections'
      });
    } else {
      // Validate each section has label and content
      structured.sections.forEach((section, index) => {
        if (!section.title || typeof section.title !== 'string') {
          errors.push({
            code: 'MISSING_SECTION_TITLE',
            message: `Section ${index + 1} missing title`,
            path: `improvedCopy.sections[${index}].title`
          });
        }
        if (!section.content || typeof section.content !== 'string') {
          errors.push({
            code: 'MISSING_SECTION_CONTENT',
            message: `Section ${index + 1} missing content`,
            path: `improvedCopy.sections[${index}].content`
          });
        }
      });
    }
  } else {
    errors.push({
      code: 'INVALID_IMPROVED_COPY_TYPE',
      message: 'Generated content has invalid type (must be string or structured object)',
      path: 'improvedCopy'
    });
  }

  // RULE B: If alternatives requested, check they exist
  // Check multiple possible fields where alternatives might be stored
  const alternativesRequested =
    formState.generateAlternative ||
    (formState.numberOfAlternativeVersions && formState.numberOfAlternativeVersions > 0) ||
    (formState.createVariants && formState.numberOfVariants && formState.numberOfVariants > 1);

  if (alternativesRequested) {
    const hasAlternatives =
      result.alternativeCopy ||
      (result.generatedVersions && result.generatedVersions.length > 1) ||
      (result.alternatives && result.alternatives.length > 0) ||
      (result.variants && result.variants.length > 0);

    if (!hasAlternatives) {
      errors.push({
        code: 'MISSING_ALTERNATIVES',
        message: 'Alternatives were requested but none were generated',
        path: 'alternativeCopy'
      });
    }
  }

  // RULE C: If SEO metadata requested, check it exists
  if (formState.generateSeoMetadata) {
    if (!result.seoMetadata) {
      errors.push({
        code: 'MISSING_SEO_METADATA',
        message: 'SEO metadata was requested but not generated',
        path: 'seoMetadata'
      });
    } else if (typeof result.seoMetadata === 'object') {
      // Check that at least one SEO field has content
      const hasSeoContent = Object.values(result.seoMetadata).some(
        value => Array.isArray(value) && value.length > 0
      );

      if (!hasSeoContent) {
        errors.push({
          code: 'EMPTY_SEO_METADATA',
          message: 'SEO metadata exists but all fields are empty',
          path: 'seoMetadata'
        });
      }
    }
  }

  // RULE D: Placeholder sanity check (warning-level - still marks as invalid)
  const placeholderPatterns = [
    /\[[\w\s]+\]/g,        // [VARIABLE]
    /\{\{[\w\s]+\}\}/g,    // {{variable}}
    /\{[\w\s]+\}/g         // {variable}
  ];

  const checkForPlaceholders = (text: string): string[] => {
    const found: string[] = [];
    placeholderPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        found.push(...matches);
      }
    });
    return found;
  };

  // Check improvedCopy for placeholders
  let contentToCheck = '';
  if (typeof improvedCopy === 'string') {
    contentToCheck = improvedCopy;
  } else if (typeof improvedCopy === 'object') {
    const structured = improvedCopy as StructuredCopyOutput;
    if (structured.sections) {
      contentToCheck = structured.sections
        .map(s => s.content || '')
        .join(' ');
    }
  }

  const foundPlaceholders = checkForPlaceholders(contentToCheck);
  if (foundPlaceholders.length > 0) {
    errors.push({
      code: 'UNRESOLVED_PLACEHOLDERS',
      message: `Generated content contains unresolved placeholders: ${foundPlaceholders.slice(0, 3).join(', ')}${foundPlaceholders.length > 3 ? '...' : ''}`,
      path: 'improvedCopy'
    });
  }

  // RULE E: Language sanity (very light)
  // Only check that output is not empty/whitespace if explicit language set
  if (formState.language && contentToCheck && !contentToCheck.trim()) {
    errors.push({
      code: 'EMPTY_OUTPUT_WITH_LANGUAGE',
      message: 'Output language specified but content is empty',
      path: 'improvedCopy'
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ─── Narrow Service Validation (Quick Polish) ────────────────────────────────

export interface NarrowValidationError {
  code: string;
  message: string;
}

export interface NarrowValidationResult {
  valid: boolean;
  errors: NarrowValidationError[];
}

function extractWordCountLimit(specialInstructions: string): number | null {
  const patterns = [
    /under\s+(\d+)\s+words?/i,
    /max(?:imum)?\s+(\d+)\s+words?/i,
    /(\d+)\s+words?\s+or\s+(?:fewer|less)/i,
    /no\s+more\s+than\s+(\d+)\s+words?/i,
    /keep\s+(?:it\s+)?(?:to\s+)?(?:under|within|at\s+most)\s+(\d+)\s+words?/i,
    /(\d+)\s+words?\s+(?:max|limit)/i,
  ];

  for (const pattern of patterns) {
    const match = specialInstructions.match(pattern);
    if (match) {
      return parseInt(match[1], 10);
    }
  }
  return null;
}

export function validateNarrowServiceResult(
  result: { variants: string[] },
  requestedCount: number,
  specialInstructions?: string
): NarrowValidationResult {
  const errors: NarrowValidationError[] = [];

  if (result.variants.length !== requestedCount) {
    errors.push({
      code: 'WRONG_VARIANT_COUNT',
      message: `Expected ${requestedCount} variant${requestedCount > 1 ? 's' : ''} but got ${result.variants.length}`
    });
  }

  if (specialInstructions) {
    const wordCountLimit = extractWordCountLimit(specialInstructions);
    if (wordCountLimit) {
      result.variants.forEach((variant, index) => {
        const wordCount = variant.trim().split(/\s+/).filter(Boolean).length;
        if (wordCount > wordCountLimit) {
          errors.push({
            code: 'WORD_COUNT_EXCEEDED',
            message: `Variant ${index + 1} has ${wordCount} words but limit is ${wordCountLimit}`
          });
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function buildNarrowRepairReminder(
  errors: NarrowValidationError[],
  requestedCount: number,
  specialInstructions?: string
): string {
  const lines: string[] = [
    `REPAIR REQUIRED — The previous attempt failed these checks:`,
    ...errors.map(e => `- ${e.message} (${e.code})`),
    ``,
    `Fix ALL issues above and respond ONLY with valid JSON: { "variants": [...] }`,
  ];

  const countError = errors.find(e => e.code === 'WRONG_VARIANT_COUNT');
  if (countError) {
    lines.push(`The "variants" array MUST contain EXACTLY ${requestedCount} item${requestedCount > 1 ? 's' : ''}.`);
  }

  const wcError = errors.find(e => e.code === 'WORD_COUNT_EXCEEDED');
  if (wcError && specialInstructions) {
    const limit = extractWordCountLimit(specialInstructions);
    if (limit) {
      lines.push(`Every variant MUST be ${limit} words or fewer. Count carefully before responding.`);
    }
  }

  return lines.join('\n');
}

// ─── Full Copy Maker Repair Prompt ───────────────────────────────────────────

/**
 * Build a repair prompt for retry when validation fails
 *
 * Returns strict instructions to fix the output and return valid JSON
 */
export function buildRepairPrompt(args: {
  originalSystemPrompt: string;
  originalUserPrompt: string;
  failedOutput: string;
  validationErrors: ValidationError[];
}): { system: string; user: string } {
  const { originalSystemPrompt, originalUserPrompt, validationErrors } = args;

  // Build error summary
  const errorSummary = validationErrors
    .map(e => `- ${e.message} (${e.code})`)
    .join('\n');

  const systemPrompt = `${originalSystemPrompt}

CRITICAL REPAIR INSTRUCTIONS:
The previous generation attempt failed validation with these errors:
${errorSummary}

YOU MUST:
1. Return ONLY valid content matching the expected format
2. Do NOT add commentary or explanations
3. Fix ALL missing fields that caused validation errors
4. Preserve the intended content and quality
5. Ensure all required sections are present and complete
6. Remove any unresolved placeholders like [VARIABLE], {{variable}}, etc.

If structured output is required, ensure proper JSON structure with all required fields.
If alternatives were requested, include them in the response.
If SEO metadata was requested, include complete SEO fields.

FAILURE TO FIX THESE ERRORS WILL RESULT IN REJECTION.`;

  const userPrompt = `${originalUserPrompt}

NOTE: This is a repair attempt. The previous output had validation errors. Please regenerate with ALL required fields properly formatted.`;

  return {
    system: systemPrompt,
    user: userPrompt
  };
}
