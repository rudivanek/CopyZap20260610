# Quick Prompt Wizard - Complete Feature Documentation

## Overview

The Quick Prompt Wizard is a comprehensive, AI-powered onboarding tool that guides users through creating optimized copy generation configurations in CopyZap. It transforms complex form filling into a simple 3-step conversation, with optional advanced fine-tuning capabilities.

---

## Architecture & Flow

### Main Components

1. **QuickSetupWizard** (Main Container)
   - Manages overall wizard state and navigation
   - Handles AI generation of configurations
   - Coordinates data flow between steps
   - Manages localStorage persistence

2. **WizardStep** (Steps 1-3)
   - Renders the three main wizard steps
   - Handles user input collection
   - Provides suggestion system integration
   - Manages output structure preferences

3. **WizardStep4** (Fine-Tune Interface)
   - Advanced settings editor
   - Field-by-field configuration
   - AI Model selection
   - Industry/niche customization

4. **WizardSummary** (Review & Apply)
   - Configuration review interface
   - AI-powered explanation feature
   - JSON preview capability
   - Multiple application modes

---

## Detailed Feature Breakdown

### Accessing the Wizard

**Button Design:**
- **Location:** AI Prompt Section at top of Copy Maker form
- **Icon:** Magic wand (Wand2 from lucide-react) displayed to the left
- **Text:** "Quick Prompt Wizard"
- **Style:** Full-width gradient button (primary blue colors)
- **Visual Elements:**
  - Icon size: 18px
  - Gap between icon and text: 8px (using `gap-2` class)
  - Hover effects for interactivity
  - Disabled state when user not logged in

**User Experience:**
- Single prominent button for easy discovery
- Icon provides visual metaphor for "AI magic"
- Clear, action-oriented text
- Accessible via keyboard and mouse

---

### Step 1: What Are You Creating?

**Purpose**: Capture the core project description and intent.

**Features**:

- **URL Analysis System** (NEW)
  - **Analyze URL Button**: Primary blue button with Globe icon
  - **Two Analysis Modes**:
    1. **Analyze Context**: Extracts key information to pre-fill wizard fields
    2. **Extract Copy**: (Improve mode only) Extracts all marketing copy
  - **Loading Modal**: Shows spinner with cancel button during analysis
    - Different messages based on mode:
      - "Analyzing URL..." for context analysis
      - "Extracting Copy..." for full copy extraction
    - Cancel button aborts the request using AbortController
    - Modal prevents accidental clicks outside
  - **Auto-Detection Features**:
    - URL protocol auto-prepending (adds https:// if missing)
    - Word count auto-detection when extracting copy
    - Automatic Target Length field population based on extracted content
  - **User Feedback**: Toast notifications for success/failure

- **Example Dropdown System**
  - Pulls public prefills from `pmc_prefills` table
  - Grouped by category for easy browsing
  - Click to auto-populate text area
  - Real-time loading state

- **Freeform Text Input**
  - Large textarea for detailed descriptions
  - Character count validation (warns if < 20 chars)
  - Placeholder guidance
  - Real-time feedback on specificity

- **Smart Tips Panel**
  - Contextual guidance on what to include
  - Encourages mentioning product, audience, and unique value

**Data Collected**:
- `whatAreYouCreating` (string) - Primary project description
- URL analysis results (when used)

**Validation**:
- Required field
- Minimum 1 character (warns at < 20)
- Cannot proceed without content

---

### Step 2: Target Audience & Pain Points

**Purpose**: Define who the copy is for and what problems it solves.

**Features**:

- **Target Audience Field** (Required)
  - Multi-line textarea
  - Examples provided in helper text
  - Real-time validation
  - Character counter and guidance

- **Pain Points Field** (Optional)
  - Multi-line textarea
  - Helps create empathetic, targeted copy
  - Not required but recommended
  - Examples: "scattered tools, missed deadlines"

- **Contextual Tips**
  - Explains importance of audience specificity
  - Provides example audience descriptions

**Data Collected**:
- `targetAudience` (string, required)
- `painPoints` (string, optional)

**Validation**:
- Target audience is required
- Minimum 1 character
- Cannot proceed without target audience

---

### Step 3: Length, Style & Features

**Purpose**: Define output parameters, tone, and enable advanced features.

**Features**:

#### Word Count Selection (Target Length)
- **Preset Options**:
  - Short & Punchy: 50-100 words
  - Medium: 100-200 words
  - Detailed: 200-400 words
  - Custom: User-defined count

- **Custom Word Count Input**:
  - Appears when "Custom" selected
  - Number input with min/max validation (50-4000)
  - Default: 300 words

- **Auto-Detection from URL** (NEW):
  - When using "Extract Copy" in Improve mode
  - System automatically counts words in extracted content
  - Sets Target Length field to match detected word count
  - Ensures improved copy maintains similar length to original
  - User can manually adjust after auto-population

#### Tone Selection
- **6 Visual Tone Cards**:
  1. Professional (Briefcase icon) - Formal and authoritative
  2. Friendly (Smile icon) - Warm and approachable
  3. Bold (Zap icon) - Confident and assertive
  4. Minimalist (Sparkles icon) - Clean and concise
  5. Creative (PenTool icon) - Imaginative and unique
  6. Persuasive (TrendingUp icon) - Compelling and benefit-focused

- **Interactive Selection**:
  - Grid layout (2 columns)
  - Visual feedback on selection
  - Icon + description for each tone
  - Primary color highlighting when selected

#### Special Instructions
- **Freeform Textarea**:
  - Optional additional requirements
  - Examples: "Use British English", "Focus on environmental benefits"
  - Suggestion button (lightbulb icon)

- **AI Suggestions Modal**:
  - Opens full-screen modal
  - Fetches suggestions from `pmc_extra_suggestions` table
  - Grouped by category
  - Real-time search/filter
  - Click to append to instructions

#### Output Structure Toggle
- **Checkbox Control**:
  - "Define output structure" option
  - When enabled:
    - Auto-expands Output Structure section
    - Allows selection of content sections
    - Enables industry/niche selection
    - Enables page type/section selection
  - When disabled:
    - Clears all output structure fields
    - Hides structure options

#### SEO & GEO Toggles
- **SEO Optimization** (Checkbox):
  - Generates meta descriptions
  - Creates URL slugs
  - Structures headings (H1, H2)
  - Keyword integration

- **GEO Optimization** (Checkbox):
  - Optimizes for AI search engines
  - ChatGPT, Perplexity, etc.
  - Different optimization approach than traditional SEO

#### Fine-Tune Button
- **Prominent CTA**:
  - Gradient styling
  - Settings icon
  - Takes user to Step 4 (advanced settings)
  - Generates AI configuration first if not already generated

**Data Collected**:
- `wordCount` (string) - Preset or "Custom"
- `customWordCount` (number) - If Custom selected
- `tone` (string) - One of 6 tones
- `specialInstructions` (string, optional)
- `enableSEO` (boolean)
- `enableGEO` (boolean)
- `wantsOutputStructure` (boolean)

**Validation**:
- All fields optional except word count (has default)
- Custom word count validated on Step 4

---

### Step 4: Fine-Tune Settings (Advanced)

**Purpose**: Detailed review and editing of all form fields before applying.

**Features**:

#### AI Model Selection
- **Model Dropdown**:
  - Lists all available AI models
  - Default: `deepseek-chat`
  - Options from `MODELS` constant
  - Allows user to change generation model

#### Essential Settings Section
- **Product/Service Name**:
  - Text input
  - Auto-populated from wizard answers
  - Can be edited

- **Project Description**:
  - Text input
  - Auto-populated from "what are you creating"
  - Can be edited

- **Target Audience**:
  - Multi-line textarea
  - Pre-filled from Step 2
  - Editable

- **Tone & Word Count**:
  - Side-by-side dropdowns
  - Pre-selected from Step 3
  - Can be changed

- **Custom Word Count**:
  - Appears if "Custom" selected
  - Number input
  - Validated (50-2000 range)

- **Keywords** (Conditional):
  - Only shows if SEO enabled
  - Text input
  - Comma-separated keywords
  - Pre-populated if AI generated them

- **Language & Industry**:
  - Language dropdown (from `LANGUAGES` constant)
  - Industry/Niche with categorized input
  - Uses `CategoryTagsInput` component

- **Preferred Writing Style**:
  - Tag input with suggestions
  - Uses `TagInput` component
  - Pre-populated from AI generation

**Data Collected**:
- All fields from FormState that were generated or pre-filled
- User can edit any field
- Changes saved to `advancedFields` state

**Validation**:
- No required fields at this stage
- Field-specific validation (e.g., number ranges)

---

### Summary View: Review & Apply

**Purpose**: Present generated configuration for final review before application.

**Features**:

#### Configuration Display
- **What You're Creating**:
  - Prominent display of project description
  - Sparkles icon for visual appeal

- **Key Settings Grid**:
  - Target audience
  - Length (word count)
  - Tone
  - Features (SEO/GEO badges)

- **Optional Fields Display**:
  - Pain points (if provided)
  - Special instructions (if provided)

- **Smart Settings Panel**:
  - Industry
  - Writing style
  - Funnel stage
  - Keywords (if provided)

#### AI Explanation Feature
- **"Explain My Setup" Button**:
  - Generates AI explanation using GPT-4o
  - Explains WHY settings were chosen
  - Shows how choices align with goals
  - 2-3 sentence concise explanation
  - Loading state during generation
  - Can be cancelled

- **Explanation Display**:
  - Expandable/collapsible
  - Blue-tinted panel
  - Easy-to-read formatting

#### JSON Configuration Viewer
- **View/Hide JSON Toggle**:
  - Small text button with Code icon
  - Shows/hides JSON representation
  - Useful for developers and debugging

- **JSON Display**:
  - Dark-themed code block
  - Syntax-highlighted
  - Pretty-printed (2-space indent)
  - Scrollable if long
  - Fixed max-height

#### Action Buttons
Three primary actions:

1. **Start Over**:
   - Gray button
   - Resets wizard to Step 1
   - Clears all generated data
   - Returns to beginning

2. **Apply**:
   - White button with primary border
   - Settings icon
   - Applies configuration to main form
   - Does NOT trigger generation
   - Closes wizard

3. **Apply & Generate** (Primary CTA):
   - Gradient primary button
   - Zap icon
   - Applies configuration to main form
   - Immediately triggers copy generation
   - Closes wizard
   - Shows success toast

**Helper Text**:
- Small text at bottom
- Explains sparkle icons
- Indicates auto-filled fields

---

## AI Generation Process

### Natural Language Instruction Building

When user clicks "Generate Setup" or "Fine-Tune" from Step 3, the wizard:

1. **Constructs Instruction String**:
   ```
   [whatAreYouCreating]
   , targeting [targetAudience]
   , addressing pain points: [painPoints]
   , [wordCount]
   , [tone] tone
   . [specialInstructions]
   . [SEO instructions]
   . [GEO instructions]
   . IMPORTANT: Always populate both projectDescription and productServiceName fields
   ```

2. **Calls AI Template API**:
   - Uses `generateTemplateJsonSuggestion()` from apiService
   - Sends constructed instruction
   - Receives JSON configuration
   - Model: typically uses GPT-4o or user-selected model

3. **Overrides with Explicit Values**:
   ```javascript
   {
     ...jsonSuggestion,
     model: jsonSuggestion.model || 'deepseek-chat',
     generateSeoMetadata: wizardState.answers.enableSEO,
     targetAudience: wizardState.answers.targetAudience || jsonSuggestion.targetAudience,
     targetAudiencePainPoints: wizardState.answers.painPoints || jsonSuggestion.targetAudiencePainPoints,
     tone: wizardState.answers.tone || jsonSuggestion.tone,
     wordCount: wizardState.answers.wordCount !== 'Custom' ? wizardState.answers.wordCount : jsonSuggestion.wordCount,
     customWordCount: wizardState.answers.wordCount === 'Custom' ? wizardState.answers.customWordCount : jsonSuggestion.customWordCount,
     specialInstructions: wizardState.answers.specialInstructions || jsonSuggestion.specialInstructions
   }
   ```

4. **Handles Output Structure**:
   - If user selected NO to output structure:
     - Clears `outputStructure`, `industryNiche`, `pageType`, `section`
   - If user selected YES:
     - Preserves AI-generated structure fields

5. **Stores Generated Data**:
   - Saves to `generatedData` state
   - Initializes `advancedFields` for editing
   - Shows success toast

### Generation Contexts

**From Step 3 (Generate Setup)**:
- User clicks "Generate Setup" button
- Validates required fields first
- Generates configuration
- Shows Summary view

**From Step 3 (Fine-Tune)**:
- User clicks "Fine-Tune" button
- Sets `cameFromStep3` flag
- Generates configuration if needed
- Goes to Step 4

**From Summary (Back to Fine-Tune)**:
- User clicks "Fine-Tune" in summary
- Goes to Step 4
- `cameFromStep3` is false
- Back button returns to Summary

---

## Data Flow & State Management

### State Hierarchy

```
QuickSetupWizard (Parent)
├── wizardState
│   ├── currentStep (1-4)
│   └── answers (Step 1-3 responses)
├── generatedData (AI-generated config)
├── advancedFields (Step 4 edits)
├── selectedExtraFields (Additional fields user added)
├── showSummary (boolean)
└── cameFromStep3 (navigation tracking)
```

### LocalStorage Persistence

**Keys Used**:
- `pmc_wizard_state` - Main wizard state
- `pmc_wizard_advanced_fields` - Fine-tune edits
- `pmc_wizard_selected_fields` - Extra fields selection

**Persistence Behavior**:
- Saves on every state change
- Loads on wizard open
- Cleared on wizard close
- Preserves data across page refreshes while wizard is open

### Navigation Flow

```
Step 1 → Step 2 → Step 3 → [Generate] → Summary
                      ↓                      ↓
                  Fine-Tune (Step 4)    Fine-Tune (Step 4)
                      ↓                      ↓
                  Back to Step 3        Back to Summary
```

**Key Navigation Rules**:
- Step 1 validates `whatAreYouCreating` before advancing
- Step 2 validates `targetAudience` before advancing
- Step 3 can generate OR go to fine-tune OR go to summary
- Step 4 tracks where it came from (Step 3 or Summary)
- Summary has 3 exit paths (start over, apply, apply & generate)

---

## Application Modes

### 1. Apply Only

**Triggered by**: "Apply" button in Summary

**Behavior**:
1. Uses `advancedFields` (with edits) or falls back to `generatedData`
2. Ensures `projectDescription` and `productServiceName` are populated
3. Tracks which fields were pre-filled (`templatePrefilledFields`)
4. Clears results (`copyResult`, `promptEvaluation`, etc.)
5. Applies wizard checkbox values (SEO/GEO)
6. Calls `onApplyToForm(data)`
7. Shows success toast
8. Closes wizard

**Output**: Form is populated, user can review and edit before generating

### 2. Apply & Generate

**Triggered by**: "Apply & Generate" button in Summary

**Behavior**:
1. Same data preparation as Apply Only
2. Applies to form via `onApplyToForm()`
3. Immediately calls `onGenerate(finalData)`
4. Passes data directly to avoid state race conditions
5. Shows "Generating..." toast
6. Closes wizard

**Output**: Form is populated AND generation begins immediately

### 3. Apply from Fine-Tune

**Triggered by**: "Apply & Close" button in Step 4

**Behavior**:
- If came from Step 3:
  - Merges `advancedFields` into `generatedData`
  - Returns to Step 3
  - Shows "Settings saved" toast
  - User can continue wizard flow

- If came from Summary:
  - Same behavior as "Apply Only"
  - Applies to form and closes wizard

**Output**: Context-dependent - either continues wizard or applies & closes

---

## Field Tracking System

### Template Pre-filled Fields

**Purpose**: Track which fields were populated by the wizard

**Implementation**:
```javascript
const prefilledFields = Object.keys(ensuredData).filter(key => {
  const runtimeFields = ['isLoading', 'isEvaluating', 'generationProgress', 'copyResult', 'promptEvaluation', 'templatePrefilledFields'];
  return !runtimeFields.includes(key) &&
         ensuredData[key as keyof FormState] !== undefined &&
         ensuredData[key as keyof FormState] !== '';
});

finalData.templatePrefilledFields = prefilledFields;
```

**Usage**:
- UI can show sparkle indicators on pre-filled fields
- Helps users understand what was auto-populated
- Distinguishes wizard-filled vs. user-filled fields

### Field Validation

**Fallback Logic** (ensures required fields are always populated):

```javascript
// If projectDescription is missing but productServiceName exists, use it
if (!ensuredData.projectDescription?.trim() && ensuredData.productServiceName?.trim()) {
  ensuredData.projectDescription = ensuredData.productServiceName;
}

// If productServiceName is missing but projectDescription exists, use it
if (!ensuredData.productServiceName?.trim() && ensuredData.projectDescription?.trim()) {
  ensuredData.productServiceName = ensuredData.projectDescription;
}

// If both are still missing, use wizard's "what are you creating"
if (!ensuredData.projectDescription?.trim()) {
  ensuredData.projectDescription = wizardState.answers.whatAreYouCreating;
}
if (!ensuredData.productServiceName?.trim()) {
  ensuredData.productServiceName = wizardState.answers.whatAreYouCreating;
}
```

---

## Integration Points

### Database Tables Used

1. **pmc_prefills**:
   - Purpose: Example templates for Step 1
   - Columns: `id`, `label`, `category`, `is_public`
   - Query: Public prefills, ordered by category and label

2. **pmc_extra_suggestions**:
   - Purpose: Special instruction suggestions
   - Columns: `id`, `category`, `instruction_text`, `active`, `tone_match`, `language_match`, `output_type_match`
   - Query: Active suggestions, ordered by category

3. **Form State (Not persisted directly)**:
   - Wizard generates `Partial<FormState>` object
   - Applied to main app form state
   - Eventually used for copy generation

### API Endpoints Used

1. **Template Generation**:
   - Function: `generateTemplateJsonSuggestion(instruction, user)`
   - Model: GPT-4o (or configurable)
   - Purpose: Convert natural language to form configuration

2. **Explanation Generation** (Summary view):
   - Direct OpenAI API call
   - Model: GPT-4o
   - Purpose: Explain why configuration was chosen
   - Token limit: 200
   - Temperature: 0.7

---

## UI/UX Features

### Visual Design

- **Progress Bar**: Shows 0-100% through steps 1-3
- **Step Indicators**: "Step X of 3"
- **Icons**: Context-appropriate icons for each section (Lightbulb, Target, Palette, etc.)
- **Color Coding**:
  - Primary (blue) for active states
  - Gray for inactive
  - Green for success
  - Amber for warnings

### Animations

- **Framer Motion**:
  - Page transitions between steps
  - Fade in/out effects
  - Slide up for modals
  - Expand/collapse for sections

- **Loading States**:
  - Spinner overlays during generation
  - Skeleton loaders for data fetching
  - Disabled states on buttons

### Responsive Design

- **Mobile First**: Works on all screen sizes
- **Grid Layouts**: Adapt from 1 to 2 columns
- **Max Width**: 2xl container (672px)
- **Max Height**: 90vh modal
- **Scrollable Content**: Step content scrolls independently

### Accessibility

- **Keyboard Navigation**: Full keyboard support
- **ARIA Labels**: Proper labeling on interactive elements
- **Focus Management**: Clear focus indicators
- **Screen Reader**: Semantic HTML structure

---

## Error Handling

### Validation Errors

- **Step 1**: Toast if "whatAreYouCreating" is empty
- **Step 2**: Toast if "targetAudience" is empty
- **Step 3**: No blocking errors (all optional)
- **Generation**: Try/catch with error toast and console logging

### Network Errors

- **API Failures**:
  - Shows error toast with message
  - Keeps wizard open
  - User can retry or adjust settings

- **Timeout Handling**:
  - Generation can be cancelled
  - Cancel button during loading
  - Resets loading state

### Edge Cases

- **Empty Generated Data**:
  - Fallback to wizard answers
  - Ensures required fields populated
  - Warning if unusual

- **Missing User**:
  - Checks for `currentUser` before generation
  - Shows auth error if missing

---

## Configuration Constants

### From Constants File

- `READER_FUNNEL_STAGES`: Awareness, Consideration, Decision, etc.
- `PREFERRED_WRITING_STYLES`: Story-driven, Data-driven, etc.
- `OUTPUT_STRUCTURE_OPTIONS`: Hero, Benefits, Features, etc.
- `CATEGORIZED_VOICE_STYLES`: Professional, Creative, Casual categories
- `INDUSTRY_NICHE_CATEGORIES`: Tech, Healthcare, Finance, etc.
- `LANGUAGES`: English, Spanish, French, etc.
- `TONES`: Professional, Friendly, Bold, etc.
- `WORD_COUNTS`: 50-100, 100-200, etc.
- `MODELS`: deepseek-chat, gpt-4o, etc.

---

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**: AI generation only when needed
2. **Debouncing**: Search in suggestions modal
3. **Memoization**: Could be added for complex calculations
4. **Conditional Rendering**: Only render visible step
5. **LocalStorage**: Prevents data loss, minimal overhead

### Loading States

- **Initial Load**: Fetches examples from DB
- **Suggestions Modal**: Fetches on first open
- **AI Generation**: Shows overlay with spinner and cancel option
- **Explanation**: Separate async operation with loading indicator

---

## Future Enhancement Opportunities

1. **Saved Wizard Presets**: Allow saving wizard configurations for reuse
2. **A/B Testing**: Generate multiple configurations and let user choose
3. **Undo/Redo**: Step history management
4. **Wizard Templates**: Pre-configured wizard paths for common use cases
5. **Collaborative Features**: Share wizard configurations with team
6. **Advanced Filters**: More sophisticated suggestion filtering
7. **Voice Input**: Allow voice dictation for text fields
8. **Template Marketplace**: Share and discover wizard configurations

---

## Summary

The Quick Prompt Wizard is a sophisticated, multi-step interface that:

1. **Simplifies onboarding** by breaking down complex form filling into conversational steps
2. **Leverages AI** to generate intelligent configuration suggestions
3. **Provides flexibility** through optional fine-tuning and advanced settings
4. **Ensures data quality** through validation, fallbacks, and smart defaults
5. **Enhances UX** with animations, responsive design, and helpful guidance
6. **Integrates seamlessly** with the main application's copy generation workflow

The wizard transforms what would be a daunting 30+ field form into a simple 3-step conversation, with the power to dive deep when needed. It's the perfect balance of simplicity and control.
