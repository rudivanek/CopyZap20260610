# CopyZap Export System

Complete documentation of all export formats and triggers.

## Export Types

### 1. Markdown Export
**Trigger**: "Export as Markdown" button in results section
**Location**: `/src/components/results/ResultsSection.tsx`
**Handler**: `/src/utils/enhancedExports.ts` → `exportAsMarkdown()`

**File Output**: `.md` file
**Size**: 50-200 KB typical

**Template Structure**:
```markdown
# Copy Generation Session
Date: 2026-05-13
Session ID: uuid-123
Language: English
Tone: Professional

## Input Parameters
- Target Audience: [audience]
- Business Description: [description]
- Word Count Target: [count]

## Generated Copy

### Version 1: Improved
**Score: 82/100**

[Full copy text here]

| Dimension | Score | Notes |
|-----------|-------|-------|
| Clarity | 85 | Clear structure |
| Persuasiveness | 80 | Strong CTA |

### Version 2: Alternative
**Score: 78/100**

[Alternative copy text]

## Comparison Data
- Winner: Version 1
- Performance Gap: 4 points
- Recommendation: Version 1 has better persuasiveness

## Metadata
- Model Used: Claude Opus
- Total Tokens: 4500
- Cost: $0.045
- Export Date: 2026-05-13T14:30:00Z
```

**Data Injected**:
- All generated copy content
- All scores (if scored)
- Metadata (model, tokens, cost, date)
- Comparison results (if compared)
- Input parameters snapshot

### 2. HTML Export
**Trigger**: "Export as HTML" button
**Location**: `/src/components/results/ResultsSection.tsx`
**Handler**: `/src/utils/enhancedExports.ts` → `exportAsHTML()`

**File Output**: `.html` file (self-contained, no external dependencies)
**Size**: 200-800 KB typical
**Features**:
- Styled with inline CSS
- Charts/visualizations (score radial charts)
- Print-friendly styling
- Color-coded scores
- Table of contents

**Template Structure**:
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    /* Inline CSS: fonts, colors, layout */
    body { font-family: Inter, sans-serif; }
    .score-card { background: linear-gradient(...); }
    .winner { border: 3px solid gold; }
    @media print { /* Print styles */ }
  </style>
</head>
<body>
  <h1>Copy Generation Report</h1>
  <section class="metadata">
    <p>Session: uuid-123</p>
    <p>Date: 2026-05-13</p>
  </section>
  
  <section class="generated-copies">
    <h2>Generated Versions</h2>
    <div class="copy-card winner">
      <h3>Version 1: Improved</h3>
      <div class="score-display">85/100</div>
      <p>[Full copy]</p>
      <table class="scores">
        <tr><td>Clarity</td><td>85</td></tr>
        ...
      </table>
    </div>
  </section>
  
  <section class="comparison">
    <h2>Comparison Analysis</h2>
    <canvas id="scoreChart"></canvas>
    <table class="comparison-matrix">
      ...
    </table>
  </section>
</body>
</html>
```

**Special Features**:
- Canvas-based score charts
- Responsive grid layout
- Dark mode compatible
- Print optimized

### 3. EVAL Markdown Export
**Trigger**: "Export with Evaluation" button (admin/advanced only)
**Location**: `/src/components/results/ResultsSection.tsx`
**Handler**: `/src/utils/enhancedExports.ts` → `exportEvalMarkdown()`

**File Output**: `.md` file with hidden evaluation context
**Size**: 100-300 KB

**Template Structure**:
```markdown
# Copy Generation Session - Evaluation Report

## Hidden Evaluation Context
<!-- This section is hidden in normal views but available for analysis -->
[LLM's detailed reasoning for each score]
[Model name and version]
[Scoring timestamp]
[Version hash for audit trail]

## Public Copy Section
[Normal markdown export content]

## Evaluation Details
[Scored on which dimensions]
[Why scores were assigned]
[Risk factors identified]
[Re-scoring recommended: yes/no]
```

**Used For**: 
- Advanced re-scoring
- Model comparison analysis
- Audit trails
- Machine learning training data

### 4. PDF Export (if enabled)
**Trigger**: "Export as PDF" button (optional feature)
**Handler**: Uses `jspdf` library

**Features**:
- Converts HTML to PDF
- Embeds fonts
- Optimized for print
- Can include images/charts

## Export Trigger Locations

| Button Location | Component | Handler | Output Format |
|---|---|---|---|
| Results header | ResultsSection.tsx | exportAsMarkdown() | .md |
| Results header | ResultsSection.tsx | exportAsHTML() | .html |
| Results header | ResultsSection.tsx | exportEvalMarkdown() | .md |
| Dashboard row | Dashboard.tsx | getSavedOutputDetail() | Various |
| Saved output view | CopyOutput.tsx | exportAsMarkdown() | .md |

## Export Handler Process

**File**: `/src/utils/enhancedExports.ts` (~50-100 KB)

```typescript
async function exportAsMarkdown(
  outputCards: GeneratedCopyOutput[],
  metadata: ExportMetadata,
  comparisonResult?: ComparisonResult
): Promise<string>

// 1. Collect all data
const allContent = outputCards.map(card => ({
  content: card.content,
  scores: card.scores,
  metadata: card.metadata,
  wordCount: card.wordCount
}))

// 2. Format as markdown
const md = formatMarkdown(allContent, metadata)

// 3. Return string (can be downloaded)
return md
```

## Data Flow for Export

```
User clicks "Export as [Format]"
  ↓
Collect all data:
  - Generated copy content
  - Scores (if available)
  - Comparison result (if available)
  - Input parameters
  - Session metadata
  ↓
Format according to template
  ↓
Generate file content (string)
  ↓
Trigger download via browser:
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'export.md'
  link.click()
```

## Saved Output Persistence

When user saves output:
- Input snapshot → `/pmc_saved_outputs.input_snapshot`
- Output data → `/pmc_saved_outputs.output_data` (includes scores, comparison)
- Can re-export anytime from Dashboard

## Credits Cost for Export

Exports are **free** - no additional cost to user:
- Markdown: 0 credits
- HTML: 0 credits  
- PDF: 0 credits (if enabled)

Cost already paid during generation/scoring phase.

## File Naming Convention

```
Copy-Generation-[Date]-[RandomID].md
Copy-Generation-2026-05-13-a8f3d2.html
Session-uuid-123-evaluation.md
```

## Storage Locations

**Browser Download**: User's default Downloads folder

**Optional Cloud Storage** (if enabled):
- Could be saved to cloud storage API
- Currently not implemented

**Database Storage**:
- Saved outputs stored in Supabase
- Can be retrieved and re-exported anytime

## Export Limits

- **Single export**: No limit
- **Batch export**: Limited by browser memory (typically 100+ exports OK)
- **File size**: Most browsers support 100+ MB files

## Content Normalization

**Before Export**:
1. Strip any console debug output
2. Normalize line endings (CRLF → LF)
3. Sanitize HTML (remove scripts)
4. Remove internal IDs from display
5. Format dates consistently

**Quality Checks**:
- Verify all copy present
- Check scores data integrity
- Validate metadata completeness

## Accessibility

- HTML exports are keyboard navigable
- Markdown exports are screen-reader compatible
- PDF exports include proper text encoding
- All exports avoid relying on color alone for meaning
