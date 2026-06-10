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

export function getInputClassName(
  fieldName: string,
  fieldsWithPlaceholders?: string[],
  baseClassName?: string,
  fieldValue?: string
): string {
  // ONLY apply orange background if field value contains bracket placeholders
  // Field must have actual text content with brackets like [placeholder text]
  const hasPlaceholder = hasBracketPlaceholder(fieldValue);

  if (hasPlaceholder) {
    console.log(`🎨 Applying orange highlight to input: ${fieldName} with value:`, fieldValue?.substring(0, 50));
  }

  // Default base className for inputs
  const defaultBase = 'border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5';

  // Use provided base or default
  const base = baseClassName || defaultBase;

  // Apply light orange background ONLY if field has bracket placeholders
  if (hasPlaceholder) {
    return `bg-orange-50 dark:bg-orange-950/30 ${base}`;
  }

  // Default white/black background for all other cases (including empty fields)
  return `bg-white dark:bg-black ${base}`;
}

/**
 * Get className for textarea fields with placeholder highlighting
 */
export function getTextareaClassName(
  fieldName: string,
  fieldsWithPlaceholders?: string[],
  baseClassName?: string,
  fieldValue?: string
): string {
  // ONLY apply orange background if field value contains bracket placeholders
  // Field must have actual text content with brackets like [placeholder text]
  const hasPlaceholder = hasBracketPlaceholder(fieldValue);

  if (hasPlaceholder) {
    console.log(`🎨 Applying orange highlight to textarea: ${fieldName} with value:`, fieldValue?.substring(0, 50));
  }

  // Default base className for textareas
  const defaultBase = 'border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5';

  // Use provided base or default
  const base = baseClassName || defaultBase;

  // Apply light orange background ONLY if field has bracket placeholders
  if (hasPlaceholder) {
    return `bg-orange-50 dark:bg-orange-950/30 ${base}`;
  }

  // Default white/black background for all other cases (including empty fields)
  return `bg-white dark:bg-black ${base}`;
}
