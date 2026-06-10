# CopyZap - URL Extraction & Structure Detection

## Overview

The URL Extraction system allows users to analyze any webpage and automatically extract marketing copy, context, or full content structure. This feature dramatically speeds up the "improve existing copy" workflow by eliminating manual copy-pasting and preserving original content architecture.

---

## Two Extraction Modes

### 1. Analyze Context (Quick Analysis)

**Purpose:** Extract key information from a webpage to populate wizard fields

**Available In:**
- Create New mode
- Improve Copy mode

**What It Extracts:**
- `whatCreating`: Product/service description (1-2 sentences)
- `targetAudience`: Who the target audience is (specific)
- `tone`: Detected tone (Professional, Friendly, Bold, etc.)
- `painPoints`: Problems/pain points addressed (comma-separated)
- `features`: List of key features (max 5)
- `benefits`: List of main benefits (max 5)
- `language`: Primary language detected (full name in English)

**Use Cases:**
- Quick competitive analysis
- Research similar websites
- Gather context for new content creation
- Learn from successful competitors

**Performance:**
- Uses GPT-4o-mini for speed and cost-effectiveness
- Processes first 8,000 characters of cleaned content
- Results are cached for 7 days
- Average response time: 2-4 seconds

### 2. Extract Copy (Full Extraction)

**Purpose:** Extract ALL marketing copy from a webpage while preserving structure

**Available In:**
- Improve Copy mode only

**What It Extracts:**
- `structuredCopy`: Full marketing copy formatted as clean Markdown
- `language`: Primary language detected
- `targetAudience`: Detected target audience
- `painPoints`: Problems addressed
- `tone`: Voice/tone detected
- `outputStructure`: **NEW** - Array of section names (Hero, Features, Benefits, etc.)

**Content Processing:**
- Removes navigation, headers, footers, scripts, styles
- Preserves original order and hierarchy
- Formats as clean Markdown (# ## ### for headers)
- No HTML tags in output
- Maintains natural page flow

**Structure Detection:**
The AI analyzes the page architecture and identifies major sections:
- Common sections: "Hero", "Features", "Benefits", "Pricing", "Testimonials", "FAQ", "Call to Action"
- Returns max 8 sections
- Section names are concise (1-3 words)
- Based on ## headers in extracted Markdown

**Use Cases:**
- Improving existing webpage copy
- Redesigning landing pages
- A/B testing variations
- Refreshing outdated content

**Performance:**
- Uses GPT-4o-mini for extraction
- Processes first 100,000 characters of HTML
- No caching (always fresh extraction)
- Average response time: 4-8 seconds

---

## Structure Confirmation Modal

### Purpose

When extracting copy from a URL, users need to decide whether to use the detected page structure or a default structure. This modal provides that choice with clear visual comparison.

### When It Appears

**Triggers:**
- User clicks "Extract Copy" button in Step 1 of wizard
- Analysis completes successfully
- `outputStructure` array is returned with >0 sections
- Only in "Improve" mode (not "Create" mode)

**Does NOT Appear When:**
- Using "Analyze Context" mode
- No structure detected (empty array)
- Analysis fails or is cancelled
- In "Create New" mode

### Visual Design

**Layout:**
- Modal overlay with semi-transparent background
- Centered dialog box (max-width: 600px)
- Two side-by-side cards showing structure options
- Clear title: "Page structure extracted!"
- Subtitle showing detected sections

**Structure Cards:**

**Left Card - Extracted Structure:**
- Green accent color
- Shows detected sections as bullet points
- Label: "Use extracted structure"
- Radio button for selection
- Example: "Hero", "Features", "Benefits", "FAQ", "CTA"

**Right Card - Default Structure:**
- Blue accent color
- Shows generic sections
- Label: "Use default structure (Overview, Key Points, Call to Action)"
- Radio button for selection
- Always shows same 3 sections

**Buttons:**
- **Confirm Button:** Large, primary, applies selected choice
- Button states:
  - Default: "Confirm"
  - Active: Highlights based on selection
  - Hover: Slight scale effect

### User Interaction Flow

1. **Modal Opens:**
   - Extracted structure is pre-selected by default
   - User sees both options side-by-side
   - Can click either radio button to change selection

2. **User Selects:**
   - Click radio button or card to select
   - Selected card shows checkmark icon
   - Visual feedback with accent color

3. **User Confirms:**
   - Click "Confirm" button
   - Modal closes with fade animation
   - Selected structure is applied to wizard data

4. **Data Application:**
   - Structure array is converted to `StructuredOutputElement[]`
   - Each section gets unique ID, value, and label
   - Applied to `outputStructure` field in form state
   - Toast notification confirms success

### Technical Implementation

**Component:** `StructureConfirmationModal.tsx`

**Props:**
```typescript
interface StructureConfirmationModalProps {
  isOpen: boolean;
  extractedStructure: string[]; // e.g., ["Hero", "Features", "Benefits"]
  onUseExtracted: () => void;
  onUseDefault: () => void;
  onClose: () => void;
}
```

**State Management:**
```typescript
const [selectedOption, setSelectedOption] = useState<'extracted' | 'default'>('extracted');
```

**Data Conversion:**
When user confirms, the selected structure is converted using `createOutputStructure()`:

```typescript
// From wizard handler
const structuredElements = createOutputStructure(extractedStructure);
updateAnswer('outputStructure', structuredElements);
```

**Result Format:**
```typescript
[
  {
    id: "prefill-hero-1234567890-abc123",
    value: "hero",
    label: "Hero",
    wordCount: null
  },
  {
    id: "prefill-features-1234567890-def456",
    value: "features",
    label: "Features",
    wordCount: null
  },
  // ... more sections
]
```

### Default vs Extracted Structure

**Default Structure (Fallback):**
- Always available as safe option
- Generic but functional
- Three sections: "Overview", "Key Points", "Call to Action"
- Good for simple pages or unclear structure

**Extracted Structure (Recommended):**
- Page-specific architecture
- Preserves original flow
- Better for complex pages
- Matches user's existing content structure

**When to Use Each:**

**Use Extracted When:**
- Page has clear, logical structure
- You want to maintain original architecture
- Improving existing web content
- Structure makes sense for your goals

**Use Default When:**
- Detected structure seems incorrect
- Page structure is confusing or illogical
- You want to simplify content organization
- Starting fresh with new structure

---

## Edge Function: analyze-url

### Endpoint

```
POST /functions/v1/analyze-url
```

### Request Format

```typescript
{
  url: string;
  user_id: string;
  extractMode?: 'context' | 'fullCopy'; // Default: 'context'
}
```

### Response Format

**Context Mode:**
```json
{
  "success": true,
  "cached": false,
  "mode": "context",
  "data": {
    "whatCreating": "Cloud-based project management...",
    "targetAudience": "Small business owners...",
    "tone": "Professional",
    "painPoints": "Team coordination, missed deadlines...",
    "features": ["Task tracking", "Team collaboration", ...],
    "benefits": ["Save time", "Improve efficiency", ...],
    "language": "English"
  },
  "title": "TaskFlow - Project Management",
  "description": "Manage your team's projects...",
  "tokensUsed": 1234
}
```

**Full Copy Mode:**
```json
{
  "success": true,
  "mode": "fullCopy",
  "data": {
    "structuredCopy": "# Get organized in minutes\n\nManage...",
    "language": "English",
    "targetAudience": "Small business owners...",
    "painPoints": "Team coordination chaos...",
    "tone": "Friendly",
    "outputStructure": ["Hero", "Features", "Benefits", "FAQ", "Call to Action"]
  },
  "title": "TaskFlow - Project Management",
  "description": "Manage your team's projects...",
  "tokensUsed": 2345
}
```

### Caching Strategy

**Context Mode Only:**
- Results cached in `pmc_url_analysis_cache` table
- Cache duration: 7 days (configurable)
- Cache key: URL (normalized)
- Tracks access count and last accessed time

**Full Copy Mode:**
- No caching (always fresh extraction)
- Ensures latest content is extracted
- Better for dynamic pages

### AI Processing

**Model:** GPT-4o-mini (cost-effective, fast)

**Context Mode Prompt:**
- Analyzes cleaned text content (8,000 chars max)
- Focuses on marketing information extraction
- Preserves original language
- Returns structured JSON

**Full Copy Mode Prompt:**
- Processes HTML structure (100,000 chars max)
- Preserves original order and hierarchy
- Converts to clean Markdown format
- Detects section structure from headers
- Removes all HTML tags and styles
- Returns structured JSON with outputStructure array

**Token Tracking:**
Both modes track token usage in `pmc_user_tokens_used` table:
- Operation type: 'url_analysis' or 'url_copy_extraction'
- Model: 'gpt-4o-mini'
- Tokens used and cost (USD)

---

## User Workflows

### Workflow 1: Quick Context Research

1. Open Quick Setup Wizard
2. Select "Create New" mode
3. Click "Analyze URL" button
4. Paste competitor URL
5. Click "Analyze Context"
6. Wait 2-4 seconds
7. Wizard fields auto-populate
8. Continue with wizard or fine-tune

**Result:** Fast competitive research without manual analysis

### Workflow 2: Extract & Improve Copy

1. Open Quick Setup Wizard
2. Select "Improve Copy" mode
3. Click "Analyze URL" button
4. Paste your website URL
5. Click "Extract Copy"
6. Wait 4-8 seconds
7. **Structure modal appears**
8. Review extracted vs default structure
9. Select preferred option
10. Click "Confirm"
11. All fields populate including structure
12. Continue with generation

**Result:** Complete content improvement workflow with preserved structure

### Workflow 3: Structure Comparison

1. Extract copy from URL (as above)
2. Structure modal shows detected sections
3. Compare:
   - Extracted: ["Hero", "Features", "Benefits", "Pricing", "FAQ", "CTA"]
   - Default: ["Overview", "Key Points", "Call to Action"]
4. Choose based on:
   - Does extracted structure make sense?
   - Is original structure worth preserving?
   - Do I want to simplify?
5. Apply choice

**Result:** Informed decision about content architecture

---

## Best Practices

### URL Selection

**Good URLs to Analyze:**
- Direct product/service pages
- Landing pages with clear structure
- Competitor marketing pages
- Pages with substantial content

**Poor URLs to Analyze:**
- Home pages with minimal copy
- Navigation-heavy pages
- JavaScript-rendered SPAs (may extract incorrectly)
- Pages with heavy multimedia, minimal text

### Structure Decision Guide

**Choose Extracted Structure When:**
- ✅ Page has 4+ clear sections
- ✅ Structure is logical and intuitive
- ✅ Sections have descriptive names
- ✅ Architecture matches your goals
- ✅ Improving existing content

**Choose Default Structure When:**
- ✅ Detected structure has <3 sections
- ✅ Section names are vague or unclear
- ✅ Page structure is complex/confusing
- ✅ You want to simplify organization
- ✅ Creating new content from scratch

### Performance Tips

**For Faster Extraction:**
- Use "Analyze Context" when you only need key info
- Cache is your friend (re-analyzing same URL = instant)
- Extract during low-traffic times for better speed

**For Better Results:**
- Analyze pages with clear, marketing-focused content
- Avoid pages with heavy navigation/footers
- Choose pages with good content structure
- Use recent, well-designed pages

---

## Error Handling

### Common Errors

**"Failed to fetch URL":**
- URL doesn't exist or is down
- Network connectivity issues
- URL requires authentication
- Site blocks automated requests

**"Invalid URL format":**
- Missing http:// or https://
- Malformed URL
- Contains invalid characters

**"No content extracted":**
- Page has no marketing copy
- Content is JavaScript-rendered only
- Page structure incompatible

### User Feedback

**Loading States:**
- Modal with spinner during extraction
- Different messages per mode
- Cancel button available
- Progress indication

**Success States:**
- Toast notification with word count
- Fields visibly populate
- Smooth animation
- Clear confirmation

**Error States:**
- Toast notification with clear error
- Suggestions for resolution
- Ability to retry
- Manual input fallback

---

## Future Enhancements

### Potential Improvements

1. **JavaScript Rendering:**
   - Support for SPAs and JS-heavy sites
   - Headless browser rendering
   - Better content extraction

2. **Multi-page Analysis:**
   - Extract from multiple pages
   - Combine insights
   - Site-wide analysis

3. **Structure Editing:**
   - Custom structure selection
   - Merge/split sections
   - Reorder sections in modal

4. **Visual Preview:**
   - Show extracted copy in modal
   - Preview before applying
   - Edit in place

5. **Batch Analysis:**
   - Analyze multiple competitor URLs
   - Compare structures
   - Generate combined insights

6. **Structure Templates:**
   - Save custom structures
   - Share structures
   - Industry-specific templates

---

## Integration with Main Form

### Data Flow

```
URL Input → Edge Function → AI Analysis → Structure Detection →
Modal Choice → createOutputStructure() → StructuredOutputElement[] →
Form State → DraggableStructuredInput → User Editing → Generation
```

### Form Fields Populated

**Always:**
- `originalCopy` (Improve mode) or `businessDescription` (Create mode)
- `language`
- `tone`
- `wordCount` (auto-calculated from word count)

**Conditionally:**
- `targetAudience` (if detected)
- `painPoints` (if detected)
- `outputStructure` (if detected and user confirms)

### Structure Field Integration

The `outputStructure` field in the main form:
- Displays as drag-and-drop list
- Shows section names
- Allows reordering
- Supports word count per section
- Can be edited after wizard application

**Component:** `DraggableStructuredInput.tsx`
- Allows dragging sections to reorder
- Delete individual sections
- Add new sections
- Set word count per section

---

## Conclusion

The URL Extraction and Structure Detection system transforms the "improve existing copy" workflow from a manual, time-consuming process into an automated, intelligent experience. The structure confirmation modal gives users control while preserving valuable page architecture, making it easy to maintain content hierarchy while improving quality.

**Key Benefits:**
- Saves 10-15 minutes per project
- Preserves original content structure
- Reduces copy-paste errors
- Enables competitive analysis
- Lowers barrier to content improvement
- Provides intelligent structure suggestions
- Offers user control with smart defaults
