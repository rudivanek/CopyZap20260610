/**
 * Helper function to check if content is empty
 */
export function isContentEmpty(content: any): boolean {
  // Null or undefined
  if (!content) return true;
  
  // Empty string
  if (typeof content === 'string' && content.trim().length === 0) return true;
  
  // For objects, check various possible structures
  if (typeof content === 'object' && content !== null) {
    // Nested structure: { content: actualContent, ... }
    if ('content' in content) {
      return isContentEmpty(content.content);
    }
    
    // Direct structured content: { headline: "...", sections: [...] }
    if (content.headline && Array.isArray(content.sections)) {
      return content.headline.trim().length === 0 && content.sections.length === 0;
    }
    
    // Array content (like headlines)
    if (Array.isArray(content)) {
      return content.length === 0 || content.every(item => 
        typeof item === 'string' ? item.trim().length === 0 : !item
      );
    }
    
    // Other object formats - check for common text properties
    if (content.text || content.message || content.output) {
      const textValue = content.text || content.message || content.output;
      return typeof textValue === 'string' ? textValue.trim().length === 0 : !textValue;
    }
    
    // If no recognized structure, consider it empty if it has no meaningful properties
    return Object.keys(content).length === 0;
  }
  
  return false;
}