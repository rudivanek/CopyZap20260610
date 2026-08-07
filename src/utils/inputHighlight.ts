/**
 * Utility to determine if an input field should be highlighted with light orange background
 * due to containing placeholder values (e.g., [placeholder text])
 */

// Regex pattern to detect bracket placeholders like [xxx]
const BRACKET_PLACEHOLDER_PATTERN = /\[[^\]]{3,}\]/;

/**
 * Check if a value contains bracket placeholders
 */
function hasBracketPlaceholder(value?: string): boolean {
  // Must be a string
  if (typeof value !== 'string') return false;

  // Must have content (not empty, not just whitespace)
  const trimmedValue = value.trim();
  if (trimmedValue.length === 0) return false;

  // Must match bracket pattern
  return BRACKET_PLACEHOLDER_PATTERN.test(trimmedValue);
}

// Highlight when EITHER condition holds:
//   1. value contains a [bracket] placeholder (legacy template/prefill behavior), OR
//   2. this fieldName is flagged in fieldsWithPlaceholders AND the field is empty
//      (the wizard hand-off uses #2 to draw attention to required fields it can't fill).
// The empty check means the highlight self-clears the moment the user types.
export function getInputClassName(
  fieldName: string,
  fieldsWithPlaceholders?: string[],
  baseClassName?: string,
  fieldValue?: string
): string {
  const hasPlaceholder = hasBracketPlaceholder(fieldValue);
  const isEmpty = fieldValue === undefined || fieldValue.trim().length === 0;
  const isFlaggedEmpty = Boolean(fieldsWithPlaceholders?.includes(fieldName)) && isEmpty;
  const shouldHighlight = hasPlaceholder || isFlaggedEmpty;

  if (shouldHighlight) {
    console.log(`🎨 Applying orange highlight to input: ${fieldName} with value:`, fieldValue?.substring(0, 50));
  }

  const defaultBase = 'border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5';
  const base = baseClassName || defaultBase;

  if (shouldHighlight) {
    // Bracket placeholders (template/prefill) get only a background tint; flagged-empty
    // required fields get a ring too so the highlight is visible at a glance. The two
    // cases are intentionally distinct: "replace this placeholder" vs "fill this required
    // field that's blocking you" deserve different urgency.
    if (isFlaggedEmpty) {
      return `bg-orange-50 dark:bg-orange-950/30 ring-2 ring-primary-500 dark:ring-primary-400 ${base}`;
    }
    return `bg-orange-50 dark:bg-orange-950/30 ${base}`;
  }
  return `bg-white dark:bg-black ${base}`;
}

/**
 * Get className for textarea fields with placeholder highlighting
 */
// Highlight when EITHER condition holds:
//   1. value contains a [bracket] placeholder (legacy template/prefill behavior), OR
//   2. this fieldName is flagged in fieldsWithPlaceholders AND the field is empty
//      (the wizard hand-off uses #2 to draw attention to required fields it can't fill).
// The empty check means the highlight self-clears the moment the user types.
export function getTextareaClassName(
  fieldName: string,
  fieldsWithPlaceholders?: string[],
  baseClassName?: string,
  fieldValue?: string
): string {
  const hasPlaceholder = hasBracketPlaceholder(fieldValue);
  const isEmpty = fieldValue === undefined || fieldValue.trim().length === 0;
  const isFlaggedEmpty = Boolean(fieldsWithPlaceholders?.includes(fieldName)) && isEmpty;
  const shouldHighlight = hasPlaceholder || isFlaggedEmpty;

  if (shouldHighlight) {
    console.log(`🎨 Applying orange highlight to textarea: ${fieldName} with value:`, fieldValue?.substring(0, 50));
  }

  const defaultBase = 'border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5';
  const base = baseClassName || defaultBase;

  if (shouldHighlight) {
    // See getInputClassName: bracket placeholders tint only, flagged-empty required
    // fields also get a visible ring.
    if (isFlaggedEmpty) {
      return `bg-orange-50 dark:bg-orange-950/30 ring-2 ring-primary-500 dark:ring-primary-400 ${base}`;
    }
    return `bg-orange-50 dark:bg-orange-950/30 ${base}`;
  }
  return `bg-white dark:bg-black ${base}`;
}
