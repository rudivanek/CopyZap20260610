# LLM Evaluation Export Implementation

## Overview

The HTML export has been enhanced with machine-readable data attributes and a dedicated hidden section for external LLM evaluation. This allows tools like ChatGPT, Claude, or other LLMs to extract and evaluate raw copy versions without being confused by scores, rankings, or UI elements.

**NEW:** All copy versions are now normalized to consistent clean HTML format, eliminating format bias in external evaluations. See [LLM_CONTENT_NORMALIZATION.md](./LLM_CONTENT_NORMALIZATION.md) for details.

## Implementation Location

**File**: `src/utils/enhancedExports.ts`
**Functions Modified**:
- `exportAsFormattedHtml()` - Main export function (line 2185)
- `generateFullHtmlExportForCard()` - Individual card export (line 232)

## What Was Added

### 1. Hidden LLM Evaluation Context Section

A hidden section containing only configuration data relevant for evaluation:

```html
<section id="llm-evaluation-context" data-purpose="llm-context" style="display: none;">
  <div data-context-field="language">English</div>
  <div data-context-field="tone">Professional</div>
  <div data-context-field="word-count">Medium: 100-200</div>
  <div data-context-field="target-audience">Business professionals...</div>
  <div data-context-field="key-message">...</div>
  <div data-context-field="call-to-action">...</div>
  <div data-context-field="desired-emotion">...</div>
  <div data-context-field="brand-values">...</div>
</section>
```

### 2. Hidden LLM Evaluation Data Section

A hidden section containing only raw copy versions without any scoring or UI:

```html
<section id="llm-evaluation-data" data-purpose="llm-copy-extraction" data-evaluation-scope="copy-only" style="display: none;">

  <!-- Original Copy (if in improve mode) -->
  <article data-copy-id="__original__" data-copy="original" data-copy-kind="original" data-copy-label="Original Copy">
    <h2>Original Copy</h2>
    <div data-copy-body="true">
      [Raw original copy text without any scores or metadata]
    </div>
  </article>

  <!-- Generated Copy 1 -->
  <article data-copy-id="abc-123" data-copy="generated-1" data-copy-kind="generated" data-copy-label="Generated Copy 1">
    <h2>Generated Copy 1</h2>
    <div data-copy-body="true">
      [Raw generated copy text without any scores or metadata]
    </div>
  </article>

  <!-- Generated Copy 2 -->
  <article data-copy-id="def-456" data-copy="generated-2" data-copy-kind="voice" data-copy-label="CEO's Voice">
    <h2>CEO's Voice</h2>
    <div data-copy-body="true">
      [Raw generated copy text without any scores or metadata]
    </div>
  </article>

</section>
```

### 3. Visible Output Cards Enhanced with Data Attributes

All visible output cards now include data attributes for programmatic identification:

```html
<div id="output-abc-123"
     data-copy-id="abc-123"
     data-copy-kind="generated"
     data-copy-label="Generated Copy 1"
     style="...">

  <!-- Header with title, voice, metadata -->

  <!-- Main content section with data-copy-body attribute -->
  <div data-copy-body="true" style="...">
    [Actual copy content]
  </div>

  <!-- Scores, comparisons, SEO metadata, etc. -->

</div>
```

### 4. User-Visible Note

A small informational note is displayed to users:

```html
<div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 40px; text-align: center;">
  <p style="margin: 0; font-size: 13px; color: #6b7280;">
    📊 <em>This export includes structured data for independent external LLM evaluation.
    Hidden sections contain machine-readable copy versions without scores or UI elements.</em>
  </p>
</div>
```

### 5. HTML Comment for External LLMs

A clear instruction comment at the top of the evaluation section:

```html
<!-- LLM EVALUATION SECTION: Only use content inside #llm-evaluation-context and #llm-evaluation-data when independently evaluating copy outputs. Ignore all scoring and comparison UI elsewhere in this file. -->
```

## Data Attributes Reference

### Section-Level Attributes

| Attribute | Values | Purpose |
|-----------|--------|---------|
| `data-purpose` | `llm-context`, `llm-copy-extraction` | Identifies the section type |
| `data-evaluation-scope` | `copy-only` | Indicates this section contains only copy, no scores |

### Context Field Attributes

| Attribute | Values | Purpose |
|-----------|--------|---------|
| `data-context-field` | `language`, `tone`, `word-count`, `target-audience`, `key-message`, `call-to-action`, `desired-emotion`, `brand-values` | Identifies the configuration field |

### Copy Container Attributes

| Attribute | Values | Purpose |
|-----------|--------|---------|
| `data-copy-id` | UUID or `__original__` | Unique identifier for the copy version |
| `data-copy` | `original`, `generated-1`, `generated-2`, etc. | Sequential identifier |
| `data-copy-kind` | `original`, `generated`, `voice`, `modified` | Type of copy |
| `data-copy-label` | User-friendly name | Display name (e.g., "Original Copy", "CEO's Voice") |
| `data-copy-body` | `true` | Marks the element containing actual copy content |
| `data-copy-normalized` | `true` | Indicates content has been normalized to consistent HTML |

### Copy Kind Values

- **`original`**: The original input copy (only in improve mode)
- **`generated`**: Standard AI-generated copy
- **`voice`**: Copy with voice style applied (has `persona` property)
- **`modified`**: Copy that was modified with instructions

## How to Use (for External LLMs)

### Instruction Template for External LLMs

```
Please analyze the copy versions in this HTML export.

IMPORTANT: Only evaluate content inside the following sections:
1. #llm-evaluation-context - Contains configuration context
2. #llm-evaluation-data - Contains raw copy versions

Ignore all other sections including:
- Scores and rankings
- Comparison tables
- Winner explanations
- Trust/risk indicators
- Performance recommendations

For each copy version:
1. Extract the copy-label to identify it
2. Read the content from data-copy-body="true" element
3. Evaluate based on the context provided

Compare the versions and provide your independent assessment.
```

### JavaScript Example for Extraction

```javascript
// Extract context
const contextSection = document.getElementById('llm-evaluation-context');
const context = {};
contextSection.querySelectorAll('[data-context-field]').forEach(field => {
  const key = field.getAttribute('data-context-field');
  context[key] = field.textContent.trim();
});

// Extract copy versions
const dataSection = document.getElementById('llm-evaluation-data');
const versions = [];
dataSection.querySelectorAll('article[data-copy-id]').forEach(article => {
  versions.push({
    id: article.getAttribute('data-copy-id'),
    kind: article.getAttribute('data-copy-kind'),
    label: article.getAttribute('data-copy-label'),
    content: article.querySelector('[data-copy-body]').textContent.trim()
  });
});

console.log('Context:', context);
console.log('Versions:', versions);
```

## Content Normalization

### Purpose

All copy versions in the hidden LLM evaluation section are normalized to **consistent clean HTML** to eliminate format bias. This ensures external LLMs evaluate content quality, not presentation quality.

### Normalization Process

The `normalizeCopyForLLMExport()` function:

1. **Converts markdown → HTML**
   - `**bold**` → `<strong>bold</strong>`
   - `*italic*` → `<em>italic</em>`
   - `- list` → `<li>list</li>`
   - `## Heading` → `<h2>Heading</h2>`

2. **Removes UI labels**
   - `Hero:`, `CTA:`, `Benefits:`, `Section:` etc. → removed
   - 17+ common label patterns eliminated

3. **Normalizes spacing**
   - Max 2 consecutive line breaks
   - Removes excessive whitespace
   - Consistent paragraph separation

4. **Preserves meaning exactly**
   - No rewriting or shortening
   - Only formatting improved

### Result

**Before:** Mixed formats (markdown, plain text, UI labels)
**After:** Consistent clean HTML across all versions

See [LLM_CONTENT_NORMALIZATION.md](./LLM_CONTENT_NORMALIZATION.md) for complete details and examples.

## Content Extraction Logic

### Structured Content

For structured copy (headline + sections), the export extracts:
- Headline (stripped of markdown)
- Section titles (stripped of markdown)
- Section content (stripped of markdown)
- List items (prefixed with `-`)

### Plain Text Content

For plain text copy, the content is exported as-is without modification.

### Content Sanitization

All markdown formatting is stripped using the `stripMarkdown()` utility to ensure clean, readable text for LLM evaluation.

## What's Excluded from Hidden LLM Section

The hidden evaluation sections **DO NOT** include:

- ❌ Scores (overall, quality, conversion, trust, risk, GEO)
- ❌ Rankings and comparison tables
- ❌ Winner indicators and explanations
- ❌ Performance recommendations
- ❌ Optimization suggestions
- ❌ Decision layer guidance
- ❌ UI badges and labels (Hero:, CTA:, Benefits:, etc.)
- ❌ Timestamps
- ❌ SEO metadata
- ❌ FAQ schema
- ❌ Markdown artifacts (\*\*, \*, -, etc.)
- ❌ Any evaluation or analysis content

**Note:** The visible output cards in the export still include all scores, metadata, and evaluations for user reference. Only the hidden `#llm-evaluation-data` section is stripped down to raw normalized content.

## Dynamic Generation

The system dynamically handles:

- **Variable number of outputs**: Works with any number of generated versions
- **Different output types**: Original, generated, voice-applied, modified
- **Structured vs plain content**: Adapts to content format
- **Missing original**: Handles both create and improve modes
- **Comparison cards**: Automatically filters out analysis cards

## Backward Compatibility

✅ All existing export functionality remains intact
✅ Visible report sections unchanged
✅ PDF export not affected
✅ Markdown export not affected
✅ Print functionality works as before

## Testing Recommendations

1. **Export with original + generated copies** (improve mode)
2. **Export with only generated copies** (create mode)
3. **Export with voice-applied copies**
4. **Export with modified copies**
5. **Export with comparison results**
6. **Verify hidden sections are not visible to users**
7. **Test external LLM extraction with the JavaScript example**

## Example Use Cases

### Use Case 1: Independent LLM Evaluation

A user wants to get a second opinion from ChatGPT:

1. Export from CopyZap (includes hidden LLM sections)
2. Upload HTML to ChatGPT
3. Prompt: "Only evaluate content in #llm-evaluation-data. Compare the versions."
4. ChatGPT reads structured data, ignores UI scores

### Use Case 2: Automated Testing

A developer wants to benchmark CopyZap outputs:

1. Export multiple sessions
2. Use JavaScript to extract all versions programmatically
3. Feed to evaluation pipeline
4. Compare results without UI noise

### Use Case 3: Quality Auditing

A marketing team wants independent review:

1. Export campaign copy options
2. Share HTML with external consultant
3. Consultant uses preferred LLM tool
4. Gets clean copy versions without CopyZap's scoring bias

## File Location

The implementation is in:
```
src/utils/enhancedExports.ts
```

Key functions:
- `exportAsFormattedHtml()` - Lines 2185-2621
- `generateFullHtmlExportForCard()` - Lines 232-422

## Success Criteria ✅

- [x] Hidden context section with configuration data
- [x] Hidden data section with raw copy versions only
- [x] Data attributes on visible cards for identification
- [x] Clear HTML comments for external LLMs
- [x] No scores/rankings in hidden sections
- [x] Dynamic handling of all output types
- [x] Visible user note about structured data
- [x] **Content normalization to consistent HTML**
- [x] **UI labels removed (Hero:, CTA:, etc.)**
- [x] **Markdown converted to clean HTML**
- [x] **Spacing normalized across all versions**
- [x] **`data-copy-normalized="true"` attribute added**
- [x] Clean content extraction (markdown stripped)
- [x] Backward compatible with existing exports
- [x] Build completes successfully

## Notes

- Hidden sections use `style="display: none;"` to keep them in DOM but not visible
- **All content is normalized to consistent HTML format** (see normalization docs below)
- Markdown is converted to clean HTML tags
- UI labels are automatically removed
- The system automatically detects and categorizes copy types
- All special characters are properly escaped for HTML

## Related Documentation

- **[LLM_CONTENT_NORMALIZATION.md](./LLM_CONTENT_NORMALIZATION.md)** - Complete technical guide to content normalization
- **[LLM_NORMALIZATION_EXAMPLE.html](./LLM_NORMALIZATION_EXAMPLE.html)** - Visual before/after examples
- **[LLM_NORMALIZATION_SUMMARY.md](./LLM_NORMALIZATION_SUMMARY.md)** - Quick summary of normalization feature
