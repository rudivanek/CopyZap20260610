# LLM Export Content Normalization

## Overview

The HTML export now normalizes ALL copy versions into a consistent, clean HTML format in the hidden LLM evaluation section. This eliminates evaluation bias caused by format inconsistencies (markdown vs HTML vs plain text).

## Problem Solved

### Before Normalization

Different outputs were exported in inconsistent formats:

**Version 1 (with markdown):**
```
**Revolutionize Your Workflow**

Transform your business with AI solutions:

- Automate repetitive tasks
- Make data-driven decisions
- Scale efficiently
```

**Version 2 (plain text):**
```
Revolutionize Your Workflow

Transform your business with AI solutions. Automate repetitive tasks. Make data-driven decisions. Scale efficiently.
```

**Version 3 (with UI labels):**
```
Hero: Revolutionize Your Workflow

Benefits:
- Automate repetitive tasks
- Make data-driven decisions
```

This created **evaluation bias** because external LLMs saw:
- Different formatting styles
- Inconsistent structure
- UI noise vs clean copy
- Mixed markdown artifacts

### After Normalization

ALL versions now export as **consistent clean HTML:**

**Version 1:**
```html
<h1>Revolutionize Your Workflow</h1>
<p>Transform your business with AI solutions:</p>
<ul>
  <li>Automate repetitive tasks</li>
  <li>Make data-driven decisions</li>
  <li>Scale efficiently</li>
</ul>
```

**Version 2:**
```html
<h1>Revolutionize Your Workflow</h1>
<p>Transform your business with AI solutions. Automate repetitive tasks. Make data-driven decisions. Scale efficiently.</p>
```

**Version 3:**
```html
<h1>Revolutionize Your Workflow</h1>
<ul>
  <li>Automate repetitive tasks</li>
  <li>Make data-driven decisions</li>
</ul>
```

Result: **Fair comparison** with consistent structure, no format bias.

---

## Implementation

### Function: `normalizeCopyForLLMExport()`

Located in `src/utils/enhancedExports.ts` (line 26)

This function:

1. **Converts markdown → clean HTML**
   - `**bold**` → `<strong>bold</strong>`
   - `*italic*` → `<em>italic</em>`
   - `- list item` → `<li>list item</li>`
   - `## Heading` → `<h2>Heading</h2>`

2. **Removes UI labels**
   - `Hero:` → removed
   - `Benefits:` → removed
   - `CTA:` → removed
   - `Section 1:` → removed
   - `[Label]:` → removed
   - And 15+ other common patterns

3. **Normalizes spacing**
   - Max 2 consecutive line breaks
   - Removes excessive whitespace
   - Cleans tag spacing
   - Consistent paragraph separation

4. **Preserves meaning exactly**
   - No rewriting
   - No shortening
   - No optimization
   - Only formatting + cleaning

### Supporting Functions

**`convertMarkdownToCleanHtml(text: string)`** - Line 94
- Handles markdown conversion
- Processes headings, lists, bold, italic
- Wraps paragraphs in `<p>` tags
- Preserves inline formatting

**`removeUILabels(text: string)`** - Line 177
- Removes 17 common UI label patterns
- Includes Hero, Benefits, CTA, Section, etc.
- Case-insensitive matching
- Applied before and after conversion

**`normalizeSpacing(html: string)`** - Line 211
- Removes excessive whitespace
- Limits consecutive line breaks
- Cleans tag spacing
- Trims each line

**`escapeHtml(text: string)`** - Line 237
- Prevents HTML injection
- Escapes `&`, `<`, `>`, `"`, `'`
- Works in both browser and Node.js

---

## Where Applied

### Hidden LLM Evaluation Section Only

Normalization is **ONLY** applied to:
```html
<section id="llm-evaluation-data" data-evaluation-scope="copy-only">
  <article data-copy-id="..." data-copy-normalized="true">
    <div data-copy-body="true">
      <!-- NORMALIZED CONTENT HERE -->
    </div>
  </article>
</section>
```

### NOT Applied To

- ❌ Visible output cards (preserve user experience)
- ❌ Comparison UI
- ❌ Decision layer
- ❌ Preview rendering
- ❌ Editor display
- ❌ PDF exports

**Normalization is ONLY for the hidden LLM extraction section.**

---

## Code Changes

### 1. Original Copy Normalization

**Location:** Line 2633-2641

**Before:**
```typescript
htmlContent += `      ${formState.originalCopy.trim()}\n`;
```

**After:**
```typescript
const normalizedOriginal = normalizeCopyForLLMExport(formState.originalCopy);
htmlContent += `    <div data-copy-body="true" data-copy-normalized="true">\n`;
htmlContent += `${normalizedOriginal}\n`;
```

### 2. Generated Outputs Normalization

**Location:** Line 2664-2679

**Before:**
```typescript
// Complex logic with if/else for structured vs string vs fallback
if (typeof actualContent === 'object' && 'headline' in actualContent) {
  // Handle structured with stripMarkdown...
} else if (typeof actualContent === 'string') {
  // Handle string as-is...
} else {
  // Fallback to JSON.stringify...
}
```

**After:**
```typescript
// Single unified approach
const normalizedContent = normalizeCopyForLLMExport(actualContent);
htmlContent += `    <div data-copy-body="true" data-copy-normalized="true">\n`;
htmlContent += `${normalizedContent}\n`;
```

### 3. Added Data Attribute

All normalized content now includes:
```html
data-copy-normalized="true"
```

This signals that content has been processed through the normalization pipeline.

### 4. Updated User Note

**Before:**
> Hidden sections contain machine-readable copy versions...

**After:**
> Hidden sections contain **normalized**, machine-readable copy versions in **consistent HTML format**...

---

## Benefits

### 1. Eliminates Format Bias

External LLMs see identical HTML structure across all versions:
- No markdown artifacts to confuse parsing
- No inconsistent formatting to bias scoring
- No UI labels to distract from content

### 2. Fair Comparison

All versions on equal footing:
- Same HTML tags
- Same structure patterns
- Same spacing conventions
- Only content differs

### 3. Reduced Noise

Removes non-content elements:
- Section labels (`Hero:`, `CTA:`)
- UI markers (`[Section 1]:`)
- System labels not meant for end users

### 4. Consistent Parsing

External LLMs can reliably:
- Extract headings via `<h1>`, `<h2>`, `<h3>`
- Identify lists via `<ul>` and `<li>`
- Read paragraphs via `<p>`
- Process emphasis via `<strong>` and `<em>`

### 5. Cross-LLM Compatibility

Works consistently with:
- ChatGPT
- Claude
- Gemini
- Any HTML-aware LLM

---

## Examples

### Example 1: Markdown-Heavy Output

**Input:**
```markdown
## Revolutionize Your Workflow with AI

**Transform** your business with *cutting-edge* AI solutions that streamline workflows.

### Key Benefits

- **Automate** repetitive tasks
- Make data-driven decisions
- Scale efficiently

**CTA:** Start your free trial today
```

**Normalized Output:**
```html
<h2>Revolutionize Your Workflow with AI</h2>
<p><strong>Transform</strong> your business with <em>cutting-edge</em> AI solutions that streamline workflows.</p>
<h3>Key Benefits</h3>
<ul>
  <li><strong>Automate</strong> repetitive tasks</li>
  <li>Make data-driven decisions</li>
  <li>Scale efficiently</li>
</ul>
<p><strong>CTA:</strong> Start your free trial today</p>
```

### Example 2: Plain Text Output

**Input:**
```
Revolutionize Your Workflow with AI

Transform your business with cutting-edge AI solutions that streamline workflows.

Key Benefits

Automate repetitive tasks. Make data-driven decisions. Scale efficiently.

Start your free trial today
```

**Normalized Output:**
```html
<p>Revolutionize Your Workflow with AI</p>
<p>Transform your business with cutting-edge AI solutions that streamline workflows.</p>
<p>Key Benefits</p>
<p>Automate repetitive tasks. Make data-driven decisions. Scale efficiently.</p>
<p>Start your free trial today</p>
```

### Example 3: Mixed Format with UI Labels

**Input:**
```
Hero: Revolutionize Your Workflow with AI

Section 1: Transform your business with AI

Benefits:
- Automate repetitive tasks
- Make **data-driven** decisions

CTA: Start your free trial
```

**Normalized Output:**
```html
<p>Revolutionize Your Workflow with AI</p>
<p>Transform your business with AI</p>
<ul>
  <li>Automate repetitive tasks</li>
  <li>Make <strong>data-driven</strong> decisions</li>
</ul>
<p>Start your free trial</p>
```

**Note:** All UI labels (`Hero:`, `Section 1:`, `Benefits:`, `CTA:`) are removed.

### Example 4: Structured Content

**Input:**
```javascript
{
  headline: "Revolutionize Your Workflow with AI",
  sections: [
    {
      title: "Key Benefits",
      content: "Transform your business operations.",
      listItems: [
        "Automate repetitive tasks",
        "Make data-driven decisions",
        "Scale efficiently"
      ]
    }
  ]
}
```

**Normalized Output:**
```html
<h1>Revolutionize Your Workflow with AI</h1>
<h2>Key Benefits</h2>
<p>Transform your business operations.</p>
<ul>
  <li>Automate repetitive tasks</li>
  <li>Make data-driven decisions</li>
  <li>Scale efficiently</li>
</ul>
```

---

## Edge Cases Handled

### Empty Content
**Input:** `""` or `null`
**Output:** `""`

### Already HTML
**Input:** `<p>Hello <strong>world</strong></p>`
**Output:** Sanitized and spacing normalized

### Nested Content Object
**Input:** `{ content: { content: "text" } }`
**Output:** Recursively extracts and normalizes

### Special Characters
**Input:** `<script>alert('xss')</script>`
**Output:** `&lt;script&gt;alert('xss')&lt;/script&gt;` (escaped)

### Multiple List Formats
**Input:** Mix of `- item`, `* item`, `• item`
**Output:** Normalized to `<ul><li>item</li></ul>`

### Excessive Spacing
**Input:** `Text\n\n\n\n\nMore text`
**Output:** `<p>Text</p>\n<p>More text</p>`

---

## Testing Recommendations

### Test Scenarios

1. **Export with markdown-heavy copy**
   - Verify all `**bold**` → `<strong>`
   - Verify all lists → `<ul><li>`
   - Check heading conversions

2. **Export with plain text copy**
   - Verify paragraph wrapping
   - Check spacing normalization

3. **Export with UI labels**
   - Verify all labels removed
   - Check content preservation

4. **Export structured content**
   - Verify headline → `<h1>`
   - Verify sections → `<h2>`
   - Check list items

5. **Export mixed formats**
   - All versions have same structure
   - No markdown artifacts remain

### Validation Checklist

- [ ] All versions have `data-copy-normalized="true"`
- [ ] No markdown artifacts (`**`, `*`, `-` at start of line)
- [ ] No UI labels (Hero:, CTA:, etc.)
- [ ] Consistent HTML tags across versions
- [ ] No excessive whitespace
- [ ] Proper HTML escaping
- [ ] Same structure for similar content

---

## Success Criteria

✅ **All versions use clean HTML**
✅ **No markdown artifacts remain**
✅ **No UI labels in output**
✅ **Consistent structure across versions**
✅ **Proper spacing normalization**
✅ **HTML special characters escaped**
✅ **Meaning preserved exactly**
✅ **No content rewriting or shortening**

---

## Files Modified

**Primary:**
- `src/utils/enhancedExports.ts` - Lines 18-244, 2633-2691

**Functions Added:**
- `normalizeCopyForLLMExport()` - Main normalization function
- `convertMarkdownToCleanHtml()` - Markdown conversion
- `removeUILabels()` - Label removal
- `normalizeSpacing()` - Spacing cleanup
- `escapeHtml()` - Security escaping

**Changes:**
- Original copy normalization (line 2634)
- Generated outputs normalization (line 2675)
- Data attribute addition (`data-copy-normalized="true"`)
- User note update (line 2690)

---

## External LLM Usage

### Instruction Template

```
Please evaluate the copy versions in this HTML export.

IMPORTANT: Only read content from:
- #llm-evaluation-data section

Each version is normalized to consistent HTML format:
- All use <h1>, <h2>, <p>, <ul>, <li> tags
- No markdown artifacts
- No UI labels
- Same structure for fair comparison

Extract each version by:
1. Finding article[data-copy-id]
2. Reading from div[data-copy-body][data-copy-normalized="true"]
3. Comparing based on content only, not format

Provide your independent assessment.
```

### JavaScript Extraction

```javascript
const versions = [];
document.querySelectorAll('#llm-evaluation-data article[data-copy-id]')
  .forEach(article => {
    const bodyDiv = article.querySelector('[data-copy-body][data-copy-normalized="true"]');
    versions.push({
      id: article.dataset.copyId,
      label: article.dataset.copyLabel,
      kind: article.dataset.copyKind,
      normalized: true,
      htmlContent: bodyDiv.innerHTML.trim()
    });
  });

console.log('Normalized versions:', versions);
```

---

## Why This Matters

**We are not improving copy.**
**We are removing evaluation noise.**

This ensures:
- ✅ Fair comparison across versions
- ✅ Reduced format bias in external LLM scoring
- ✅ Consistent structure for automated analysis
- ✅ Cleaner extraction for tooling
- ✅ More reliable cross-LLM results

The goal is **unbiased evaluation** of content quality, not presentation quality.
