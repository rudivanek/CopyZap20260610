# CopyZap Form Inputs

Complete list of every form field in the Copy Maker interface.

## Form State Structure Location
- **Hook**: `useFormState()` in `/src/hooks/useFormState.ts`
- **Type Definition**: `FormData` interface in `/src/types/index.ts`
- **Context**: `SessionContext` in `/src/context/SessionContext.tsx`

## Basic Information

| Label | Type | State Variable | Location | Pipeline | Notes |
|-------|------|---|---|---|---|
| Language | Select/Dropdown | `language` | useFormState | Both | Options: English, Spanish, French, German, Italian, Portuguese |
| Tone | Select/Dropdown | `tone` | useFormState | Both | Options: Professional, Friendly, Bold, Minimalist, Creative, Persuasive |
| Word Count | Select/Dropdown | `wordCount` | useFormState | Both | Options: Short (50-100), Medium (100-200), Long (200-400), Custom |
| Custom Word Count | Number Input | `customWordCount` | useFormState | Generation | Only visible if wordCount = 'Custom' |
| Business Description | Textarea | `businessDescription` | useFormState | Generation | Multi-line text input |
| Brief Description | Textarea | `briefDescription` | useFormState | Both | Summary of the project |
| Target Audience | Textarea | `targetAudience` | useFormState | Generation | Who is this copy for? |
| Key Message | Textarea | `keyMessage` | useFormState | Generation | Core message to convey |
| Desired Emotion | Textarea | `desiredEmotion` | useFormState | Generation | Emotional tone desired |

## URLs & Content

| Label | Type | State Variable | Location | Pipeline | Notes |
|-------|------|---|---|---|---|
| Competitor URLs | Tag Input | `competitorUrls` | useFormState | Generation | Multiple URLs for analysis |
| Original Copy | Textarea | `originalCopy` | useFormState | Improve mode | Input copy to improve |
| Original Copy Entered At | Hidden | `originalCopyEnteredAt` | useFormState | Internal | Timestamp when copy entered |

## Output Configuration

| Label | Type | State Variable | Location | Pipeline | Notes |
|-------|------|---|---|---|---|
| Output Type | Select | `outputType` | useFormState | Both | Type of output (Blog Post, Email, Social, etc.) |
| Output Structure | Draggable List | `outputStructure` | useFormState | Generation | Custom sections with word counts |
| Section Titles | Toggle | `includeSectionTitles` | useFormState | Generation | Include H2/H3 titles in output |

## Advanced Options

| Label | Type | State Variable | Location | Pipeline | Notes |
|-------|------|---|---|---|---|
| Generate Scores | Toggle | `generateScores` | useFormState | Generation | Auto-score the output |
| Generate Headlines | Toggle | `generateHeadlines` | useFormState | Generation | Generate headline variants |
| Number of Headlines | Number | `numberOfHeadlines` | useFormState | Generation | Default: 3 |
| Selected Persona | Select/Combobox | `selectedPersona` | useFormState | Generation | Voice for restyling |
| Brand Voice | Select | `brandVoiceId` | useFormState | Generation | Custom brand voice profile |
| Customer | Select | `customerId` | useFormState | Session | Multi-tenant customer selection |

## SEO & Geo Options

| Label | Type | State Variable | Location | Pipeline | Notes |
|-------|------|---|---|---|---|
| Generate SEO Metadata | Toggle | `generateSeoMetadata` | useFormState | Generation | Generate meta title, description |
| Enhance for GEO | Toggle | `enhanceForGEO` | useFormState | Generation | Geographic optimization |
| GEO Regions | Tag Input | `geoRegions` | useFormState | Generation | Target regions for GEO |
| Add TLDR Summary | Toggle | `addTldrSummary` | useFormState | Generation | Include TLDR summary |
| Location | Text Input | `location` | useFormState | Generation | Specific location target |

## Advanced Customization

| Label | Type | State Variable | Location | Pipeline | Notes |
|-------|------|---|---|---|---|
| Page Type | Select | `pageType` | useFormState | Generation | Homepage, About, Services, etc. |
| Section | Select | `section` | useFormState | Generation | Specific section of page |
| Industry Niche | Select | `industryNiche` | useFormState | Generation | Industry category |
| Reader Stage | Select | `readerFunnelStage` | useFormState | Generation | Customer journey stage |
| Reader Sophistication | Select | `readerSophistication` | useFormState | Generation | Beginner to Expert |
| Writing Style | Select | `preferredWritingStyle` | useFormState | Generation | Persuasive, Conversational, etc. |
| Language Constraints | Multi-select | `languageStyleConstraints` | useFormState | Generation | Avoid passive voice, jargon, etc. |
| Excluded Terms | Tag Input | `excludedTerms` | useFormState | Generation | Terms to avoid in output |
| Keywords to Use | Tag Input | `keywords` | useFormState | Generation | Keywords to integrate |
| Brand Values | Textarea | `brandValues` | useFormState | Generation | Brand principles |
| Brand Color Scheme | Text | `brandColorScheme` | useFormState | Generation | Color preferences |
| Product/Service Name | Text | `productServiceName` | useFormState | Generation | Name of product/service |
| Target Audience Pain Points | Textarea | `targetAudiencePainPoints` | useFormState | Generation | Problems to address |
| Competitor Copy Text | Textarea | `competitorCopyText` | useFormState | Generation | Example competitor copy |
| Call to Action | Text | `callToAction` | useFormState | Generation | CTA button text |
| Special Instructions | Textarea | `specialInstructions` | useFormState | Generation | Custom instructions for generation |

## Internal / Hidden Fields

| Label | Type | State Variable | Location | Pipeline | Notes |
|-------|------|---|---|---|---|
| Tab | Enum | `tab` | useFormState | Internal | 'create', 'improve', 'copyMaker' |
| AI Engine | String | `aiEngine` | useFormState | Generation | 'claude' or 'openai' |
| Model | String | `model` | useFormState | Generation | Specific model ID (deprecated, use aiEngine) |
| Is Loading | Boolean | `isLoading` | useFormState | Internal | Loading state flag |
| Session ID | String | `sessionId` | SessionContext | Internal | Current session UUID |
| Scope Key | String | `scope_key` | SessionContext | Internal | 'copy-maker', 'quick-polish', 'copy-snap' |

## Field Visibility Logic

### Conditional Visibility
- **Custom Word Count**: Only shown if `wordCount === 'Custom'`
- **Number of Headlines**: Only shown if `generateHeadlines === true`
- **GEO Fields**: Only shown if `enhanceForGEO === true`
- **Persona Selection**: Only shown if restyling feature is enabled
- **SEO Fields**: Only shown if `generateSeoMetadata === true`

### Form Modes
- **Create Mode**: Show all fields for new copy generation
- **Improve Mode**: Hide most fields, show only `originalCopy` and basic options
- **Copy Snap Mode**: Simplified form for scoring-only

## Form Persistence

**Saved via**:
1. Templates - Full form snapshot saved in `pmc_templates` table
2. Prefills - Quick-start form values in `pmc_prefills` table
3. Saved Outputs - Input snapshot in `pmc_saved_outputs.input_snapshot`
4. Session - Current state in `pmc_copy_sessions.input_data` JSONB

**Hydration**:
- On component mount, `useFormState()` loads from:
  1. URL params (if loading saved output)
  2. Template (if selected)
  3. Prefill (if selected)
  4. Session (if resuming session)
  5. Default form state

## Form Validation

Validation occurs in multiple places:
- **Client-side**: `useFormState()` hook validates required fields
- **Before Generation**: `checkUserAccess()` validates credits/subscription
- **LLM Validation**: Some fields validated by LLM during generation
- **Database-side**: Supabase RLS validates user ownership before saving

Key validation rules:
- At least one input field required for generation
- Word count must be positive
- URLs must be valid
- Custom word count must be within reasonable range (50-10000)
