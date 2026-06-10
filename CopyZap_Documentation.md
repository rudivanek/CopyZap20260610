# CopyZap - Canonical Technical Documentation

**Version:** 1.1
**Last Updated:** 2025-12-20 (Canonical Cleanup Pass)
**Status:** Based on Production Codebase Analysis

---

## 1. Product Overview

### What CopyZap Is

CopyZap is an AI-powered marketing copy generation platform that enables users to create and improve marketing content through structured prompts and AI models. The core module, **Copy Maker**, constructs detailed prompts based on user inputs and generates marketing copy optimized for specific use cases.

### Who It Is For

*Note: This section is guidance material describing target user segments, not core system behavior.*

- Marketing professionals who need to generate or improve marketing copy
- Agencies managing multiple client projects
- Content creators who need structured, optimized marketing content
- Businesses requiring consistent brand voice across copy

### Primary User Types & Use Cases

**Solo Creators / Freelancers**
- Typical Goals: Generate copy for personal projects, client deliverables, portfolio work
- Preferred Mode: Quick or Standard mode for speed
- Key Features: Templates for reusability, brand voice for client consistency, SEO metadata generation
- Common Workflow: Load template → adjust inputs → generate → export

**Marketing Teams (In-House)**
- Typical Goals: Maintain brand consistency across campaigns, produce high-volume content
- Preferred Mode: Standard mode with brand voice enabled
- Key Features: Customer/brand voice management, templates by campaign type, session organization
- Common Workflow: Select customer → apply brand voice → use templates → generate variants → compare outputs

**Agencies (Multi-Client)**
- Typical Goals: Manage multiple client brands, deliver on-brand copy at scale, organize by project
- Preferred Mode: Standard or Advanced mode
- Key Features: Customer management, multiple brand voices per customer, template library, session tracking
- Common Workflow: Select customer → choose appropriate brand voice → configure detailed inputs → generate → iterate with alternatives → export final version

**Advanced Power Users**
- Typical Goals: Maximum control over generation parameters, fine-tuned outputs, experimentation
- Preferred Mode: Advanced mode (all fields exposed)
- Key Features: All input fields, output structure configuration, special instructions, model selection, scoring/evaluation
- Common Workflow: Build complex prompts from scratch → test multiple models → compare scores → refine with modifications → save as template for future use

### Core Problems It Solves

*Note: This section is guidance material describing value propositions, not core system behavior.*

1. Eliminates blank-page syndrome through guided input collection
2. Ensures consistent brand voice and style across all generated content
3. Provides structured output formats for various marketing use cases
4. Manages copy generation projects and tracks token usage
5. Enables reuse of configurations through templates and prefills

### High-Level Capabilities

- Generate new marketing copy from business descriptions
- Improve existing marketing copy
- Apply brand voice guidelines to all generated content
- Generate multiple output variants and alternatives
- Create structured content with specific sections and word counts
- Generate SEO metadata (URL slugs, meta descriptions, headings, OG tags)
- Score and evaluate generated content
- Compare multiple output versions
- Export and import form configurations
- Save and reuse templates for recurring projects
- Track token usage across AI model providers

---

## 2. Core Product Concepts

### Create vs Improve Modes

Copy Maker operates in two fundamental modes selected via a radio button toggle:

**Create Mode**
- Generates entirely new marketing copy from a business description
- Requires: Project Description, Product/Service Name, Business Description
- Use case: Starting from scratch, launching new products, creating net-new content

**Improve Mode**
- Enhances and refines existing marketing copy
- Requires: Project Description, Product/Service Name, Original Copy
- Use case: Refining drafts, updating existing content, A/B testing variations

The system treats businessDescription and originalCopy as functionally equivalent inputs to the prompt construction system, differing only in the framing instruction sent to the AI.

### Content Generation Philosophy

Copy Maker follows a deterministic prompt construction approach:

1. Collects structured inputs through a form interface
2. Constructs system and user prompts programmatically from form state
3. Sends prompts to selected AI model via edge function
4. Processes response and applies post-generation operations
5. Stores results in a session-based structure

Generation is not conversational. Each generation is an independent API call with a freshly constructed prompt based on current form state. There is no chat history or iterative refinement within a single generation.

### How CopyZap Differs From Generic AI Chat Tools

*Note: This section is guidance material describing product positioning, not core system behavior.*

Key differentiators:

1. **Structured Input Collection:** Instead of free-form chat, users fill specific fields that map to prompt components
2. **Deterministic Prompt Construction:** Prompts are assembled programmatically from form inputs, not written manually by users
3. **Word Count Enforcement:** System automatically checks generated content against target word counts and triggers revision calls if needed
4. **Session Management:** All work is organized into sessions linked to projects, with input/output persistence
5. **Template Reusability:** Form configurations can be saved and reloaded as templates
6. **Brand Voice Integration:** Systematic application of brand voice rules to all generations
7. **Token Tracking:** Transparent tracking of API token usage across all operations
8. **On-Demand Extensions:** After initial generation, users can trigger alternative versions, scoring, SEO metadata, etc. without regenerating from scratch

### Deterministic vs Variable Outputs

**Deterministic Elements:**
- Prompt construction logic (same inputs always build same prompt)
- Word count validation and revision logic
- Session and template data persistence
- Token tracking calculations

**Variable Elements:**
- AI model responses (temperature settings: 0.5 for content ≤150 words, 0.7 for longer content)
- Alternative version generation (explicitly requested to differ from original)
- Scoring and evaluation results
- SEO metadata generation (multiple variants requested)

---

## 3. Application Modes

*Note: This describes the current UI implementation of Copy Maker and may change without affecting core behavior.*

Copy Maker has three form modes controlled via a toggle:

### Quick Mode

**Purpose:** Simplified interface with only essential fields for rapid copy generation

**Inputs Exposed:**
- Project Description (required)
- Product/Service Name (required)
- Business Description / Original Copy (required, based on create/improve selection)
- Section
- Target Audience
- Language
- Tone
- Word Count
- Custom Word Count
- Key Message
- Call to Action
- Special Instructions

**Inputs Hidden But Still Active:**
- All optional features (SEO, GEO, scoring, etc. are hidden but retain their stored values)
- Advanced audience controls (pain points, funnel stage, sophistication)
- Brand voice and customer selection
- Competitor analysis fields
- Output structure configuration
- Advanced styling controls

**Intended Usage:** First-time users, quick generation tasks, simple copy needs without advanced configuration

### Standard Mode

**Purpose:** Balanced interface showing essential fields plus mid-level controls and optional features

**Additional Inputs Exposed (beyond Quick):**
- Customer selection
- Brand Voice selection (if customer selected)
- Target Audience Pain Points
- Competitor URLs
- Preferred Writing Style
- Language Style Constraints
- Brand Values
- Keywords
- Context
- Excluded Terms
- Output Structure
- Include Section Titles toggle
- All Optional Features section fields (SEO, GEO, scoring, word count controls)

**Inputs Hidden But Still Active:**
- Industry/Niche
- Reader Funnel Stage
- Competitor Copy Text
- Reader Sophistication
- Tone Level slider
- Desired Emotion

**Intended Usage:** Regular users who need brand voice application, structured outputs, and optional feature controls

### Advanced Mode

**Purpose:** Full interface exposing every available field

**Additional Inputs Exposed (beyond Standard):**
- Industry/Niche
- Reader Funnel Stage
- Competitor Copy Text
- Reader Sophistication
- Tone Level (slider 0-100)
- Desired Emotion

**Inputs Hidden But Still Active:** None. All fields are visible.

**Intended Usage:** Power users, agencies, detailed configuration requirements, maximum control

### Mode Switching Behavior

*Note: This describes current UI implementation and may change without affecting core generation logic.*

- Mode selection persists in localStorage
- Changing mode does NOT clear form data
- Hidden fields retain their values when switching modes
- Templates can be loaded in any mode, but if template contains fields hidden in current mode, a warning displays with option to switch to Advanced mode

---

## 4. Input System

### 4.1 Required Inputs

#### Project Description
- **Type:** Text input (single line)
- **Why Required:** Internal organizational field to identify sessions in dashboard
- **How It Influences Generation:** Does NOT appear in AI prompts. Used only for session naming and project organization
- **Validation:** Must be non-empty string

#### Product/Service Name
- **Type:** Text input (single line)
- **Why Required:** Ensures AI references the offering consistently
- **How It Influences Generation:** Included in user prompt's "Key information" section. AI uses it to maintain consistent product/service references throughout copy
- **Validation:** Must be non-empty string

#### Business Description (Create Mode) / Original Copy (Improve Mode)
- **Type:** Textarea (multi-line)
- **Why Required:** Primary source material for generation
- **How It Influences Generation:**
  - In Create mode: Forms the main content block in user prompt with instruction "Create compelling marketing copy based on this business description"
  - In Improve mode: Forms the main content block with instruction "Improve this existing marketing copy"
- **Validation:** Must be non-empty string

### 4.2 Optional Inputs

#### Language
- **Type:** Dropdown
- **Options:** English, Spanish, French, German, Italian, Portuguese
- **Default:** English
- **Conditional Behavior:** Always applies
- **Influence:** Added to both system prompt ("The copy should be in {language} language") and user prompt's key information section

#### Tone
- **Type:** Dropdown
- **Options:** Professional, Friendly, Bold, Minimalist, Creative, Persuasive
- **Default:** Professional
- **Conditional Behavior:** Always applies
- **Influence:** Added to system prompt ("with a {tone} tone")

#### Word Count
- **Type:** Dropdown with Custom option
- **Options:** Short: 50-100, Medium: 100-200, Long: 200-400, Custom
- **Default:** Medium: 100-200
- **Conditional Behavior:** If Custom is selected, customWordCount field becomes active
- **Influence:** Determines target word count for generation. System calculates exact target and creates enforcement logic in prompts. See Word Count Enforcement section for detailed behavior.

#### Custom Word Count
- **Type:** Number input
- **Default:** 150
- **Conditional Behavior:** Only active when wordCount is set to 'Custom'
- **Influence:** Overrides dropdown selection, directly sets target word count for generation

#### Target Audience
- **Type:** Text input
- **Default:** Empty
- **Conditional Behavior:** Always applies if populated
- **Influence:** Added to user prompt's key information section

#### Key Message
- **Type:** Text input
- **Default:** Empty
- **Conditional Behavior:** Always applies if populated
- **Influence:** Added to user prompt's key information section

#### Call to Action
- **Type:** Text input
- **Default:** Empty
- **Conditional Behavior:** Always applies if populated
- **Influence:** Added to user prompt's key information section. System prompt includes "Include a compelling call to action where appropriate"

#### Brand Values
- **Type:** Text input
- **Default:** Empty
- **Conditional Behavior:** Always applies if populated
- **Influence:** Added to user prompt's key information section

#### Keywords
- **Type:** Text input (comma-separated)
- **Default:** Empty
- **Conditional Behavior:** Always applies if populated. Special behavior if forceKeywordIntegration is enabled
- **Influence:** Added to user prompt. If forceKeywordIntegration is true, system prompt includes: "You MUST naturally integrate all of these keywords throughout the copy"

#### Context
- **Type:** Textarea
- **Default:** Empty
- **Conditional Behavior:** Always applies if populated
- **Influence:** Added to user prompt's key information section

#### Section
- **Type:** Text input
- **Default:** Empty
- **Conditional Behavior:** Always applies if populated
- **Influence:** Added to system prompt with section-specific guidance. Known sections trigger specialized instructions:
  - Hero Section: Focus on attention-grabbing headline and value proposition
  - Benefits: Focus on benefit-driven headlines and evidence
  - Features: Explain "so what" for each feature
  - Services: Highlight differentiation and expertise
  - About: Create engaging narrative about mission and values
  - Testimonials: Frame for social proof and emotional impact
  - FAQ: Address concerns while reinforcing selling points
  - Full Copy: Comprehensive piece covering all key aspects

#### Excluded Terms
- **Type:** Textarea
- **Default:** Empty
- **Conditional Behavior:** Always applies if populated
- **Influence:** Not explicitly added to prompts (observed in codebase as field without prompt integration). Intended for UI filtering or post-processing, not AI instruction

#### AI Model
- **Type:** Dropdown
- **Options:** Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.5, DeepSeek V3, GPT-4o, ChatGPT-4o Latest, GPT-4 Turbo, GPT-3.5 Turbo, Grok 4 Latest, Gemini 2.0 Flash
- **Default:** Claude Sonnet 4.5
- **Conditional Behavior:** Always applies. Model validation runs before generation. If model unavailable, user is prompted to select alternative
- **Influence:** Determines which AI endpoint is called. Different models have different max token limits (Claude: 64K, GPT variants: 16K, DeepSeek: 8K, Gemini: 8K). Temperature varies by content length: 0.5 for ≤150 words, 0.7 for longer content

#### Customer
- **Type:** Dropdown with inline add capability
- **Default:** None selected
- **Conditional Behavior:** Hidden in Quick mode. When selected, enables Brand Voice selection
- **Influence:** Links generated session to customer record for organization. Does NOT directly influence prompt content

#### Brand Voice
- **Type:** Dropdown
- **Options:** Loaded from brand voices associated with selected customer
- **Default:** None selected
- **Conditional Behavior:** Hidden in Quick mode. Only visible when customer is selected. Only shows brand voices linked to selected customer
- **Influence:** When selected, fetches full brand voice record and injects extensive brand voice section into system prompt. See Brand Voice section for details

### 4.3 Advanced Inputs

#### Output Structure
- **Type:** Multi-select draggable list
- **Options:** Problem, Solution, Benefits, Features, Bullet Points, Numbered List, Q&A, FAQ (JSON), Call to Action, Testimonial, Comparison, Statistics, Case Study, Quote, Summary, Introduction, Conclusion, and others
- **Default:** Empty array
- **Conditional Behavior:** Hidden in Quick mode. When populated, changes output format expectations
- **Influence:**
  - Adds section structure requirements to both system and user prompts
  - System prompt includes: "You must format your response as plain text with markdown headings"
  - User prompt lists sections in exact order with optional word count allocations
  - If Q&A format is detected, adds special formatting requirements for question/answer pairs
  - Each section can have individual word count targets

#### Include Section Titles
- **Type:** Checkbox
- **Default:** true
- **Conditional Behavior:** Only relevant when outputStructure is populated
- **Influence:** When true, system prompt includes detailed instructions for generating compelling section titles in Title Case (3-8 words) that differ from section type names. When false, sections use their structural names as headings

#### Industry/Niche
- **Type:** Dropdown
- **Options:** E-commerce, Real Estate, Legal Services, Financial Services, Consulting & Coaching, Marketing & Advertising, Web Design & Development, SaaS/Tech, Healthcare/Medical, Mental Health/Therapy, Fitness/Personal Training, Nutrition/Diet Coaching, Spa & Beauty, Online Courses, Coaching & Mentorship, Hotels/Resorts, Restaurants/Cafés, Tourism/Tour Operators, Event Planning, Photography, Music/Bands, Fashion & Apparel, Jewelry & Accessories, Home Decor, Cosmetics & Skincare, NGOs/Charities, Religious Organizations, Community Projects
- **Default:** Empty
- **Conditional Behavior:** Hidden in Quick and Standard modes
- **Influence:** Added to user prompt's key information section if populated

#### Target Audience Pain Points
- **Type:** Textarea
- **Default:** Empty
- **Conditional Behavior:** Hidden in Quick mode
- **Influence:** Added to user prompt as dedicated section: "Target audience pain points to address"

#### Reader Funnel Stage
- **Type:** Dropdown
- **Options:** Awareness, Consideration, Decision, Retention, Advocacy
- **Default:** Empty
- **Conditional Behavior:** Hidden in Quick and Standard modes
- **Influence:** Added to user prompt's key information section as "Reader's Stage in Funnel"

#### Competitor URLs
- **Type:** Array of 3 text inputs
- **Default:** ['', '', '']
- **Conditional Behavior:** Hidden in Quick mode
- **Influence:** If any URL is populated, added to user prompt as "Competitor URLs to consider for differentiation"

#### Competitor Copy Text
- **Type:** Textarea
- **Default:** Empty
- **Conditional Behavior:** Hidden in Quick and Standard modes
- **Influence:** Added to user prompt as dedicated section: "Competitor copy to outperform"

#### Preferred Writing Style
- **Type:** Dropdown
- **Options:** Persuasive, Conversational, Informative, Storytelling, Educational, Authoritative, Humorous, Inspirational
- **Default:** Empty
- **Conditional Behavior:** Hidden in Quick mode
- **Influence:** Added to system prompt as "Preferred writing style: {style}"

#### Language Style Constraints
- **Type:** Multi-select checkboxes
- **Options:** Avoid passive voice, No idioms, Avoid jargon, Short sentences, Simple vocabulary, Avoid clichés, Gender-neutral language, Inclusive language
- **Default:** Empty array
- **Conditional Behavior:** Hidden in Quick mode
- **Influence:** Added to system prompt as bulleted list under "Language style constraints to follow"

#### Tone Level
- **Type:** Slider (0-100)
- **Default:** 50
- **Conditional Behavior:** Hidden in Quick and Standard modes
- **Influence:** Maps to formality guidance in system prompt:
  - <25: "Use a very formal tone appropriate for academic or corporate contexts"
  - 25-49: "Use a moderately formal tone that is professional but approachable"
  - 50-74: "Use a conversational tone that balances professionalism with approachability"
  - ≥75: "Use a casual, friendly tone that feels like a conversation with a trusted friend"

#### Desired Emotion
- **Type:** Text input
- **Default:** Empty
- **Conditional Behavior:** Hidden in Quick and Standard modes. Always applies if populated
- **Influence:** Added to user prompt's key information section

#### Special Instructions
- **Type:** Textarea
- **Default:** Empty
- **Conditional Behavior:** Always visible (all modes)
- **Influence:** Appended to system prompt as final section: "ADDITIONAL SPECIAL INSTRUCTIONS: {instructions}. These special instructions must be followed in addition to all other requirements."

### 4.4 Optional Features (Toggle-Based)

#### Generate SEO Metadata
- **Type:** Checkbox
- **Default:** false
- **Conditional Behavior:** Hidden in Quick mode. When enabled, shows variant count controls
- **Influence:** After primary content generation, triggers separate API call to generate SEO metadata (URL slugs, meta descriptions, H1-H3 variants, OG titles/descriptions). Does NOT affect primary prompt

#### Variant Count Controls (SEO)
- **Inputs:** numUrlSlugs (1-5), numMetaDescriptions (1-5), numH1Variants (1-5), numH2Variants (1-10), numH3Variants (1-10), numOgTitles (1-5), numOgDescriptions (1-5)
- **Defaults:** All default to 1-2
- **Conditional Behavior:** Only visible when Generate SEO Metadata is enabled
- **Influence:** Controls exactly how many variants of each SEO element are generated in the separate SEO API call

#### Generate Scores
- **Type:** Checkbox
- **Default:** false
- **Conditional Behavior:** Hidden in Quick mode
- **Influence:** After primary content generation, triggers separate API call to score content on clarity, persuasiveness, tone match, engagement, word count accuracy. Does NOT affect primary prompt

#### Prioritize Word Count
- **Type:** Checkbox (labeled "Strict word count adherence")
- **Default:** false
- **Conditional Behavior:** Hidden in Quick mode
- **Influence:** When true, enforces tight tolerance (±2% by default, adjustable via wordCountTolerancePercentage). System prompt states: "The copy must be between X-Y words. This is STRICT word count mode - you will be asked to revise if outside this range." When false, uses ±30% tolerance with quality-over-precision messaging

#### Word Count Tolerance Percentage
- **Type:** Number input
- **Default:** 20
- **Conditional Behavior:** Only relevant when Prioritize Word Count is enabled
- **Influence:** Sets percentage tolerance. If prioritizeWordCount is true, creates strict range (target ± tolerance%). If false, uses fixed ±30% range regardless of this value

#### Force Keyword Integration
- **Type:** Checkbox
- **Default:** false
- **Conditional Behavior:** Hidden in Quick mode. Only relevant when Keywords field is populated
- **Influence:** When true, adds to system prompt: "IMPORTANT: You MUST naturally integrate all of these keywords throughout the copy: {keywords}"

#### Force Elaborations & Examples
- **Type:** Checkbox
- **Default:** false
- **Conditional Behavior:** Hidden in Quick mode
- **Influence:** When true, adds to system prompt: "IMPORTANT: You MUST provide detailed explanations, comprehensive examples, case studies, and in-depth elaboration throughout the copy. Expand on every point with supporting evidence, real-world applications, and specific details to reach the target word count."

#### Enhance for GEO (Generative Engine Optimization)
- **Type:** Checkbox
- **Default:** false
- **Conditional Behavior:** Hidden in Quick mode. When enabled, shows Add TL;DR Summary toggle and GEO Regions field
- **Influence:** Adds GEO targeting instructions to system prompt. If geoRegions is populated, includes region-specific optimization instructions. If location is populated, includes location references. If neither, uses universal/location-neutral instructions

#### Add TL;DR Summary
- **Type:** Checkbox
- **Default:** true
- **Conditional Behavior:** Only visible when Enhance for GEO is enabled
- **Influence:** When true, prepends system prompt with absolute mandatory requirement for TL;DR format: "Your response MUST begin with 'TL;DR:' followed by exactly one concise sentence." Includes strict formatting rules and failure warnings

#### GEO Regions
- **Type:** Text input (comma-separated)
- **Default:** Empty
- **Conditional Behavior:** Only visible when Enhance for GEO is enabled
- **Influence:** Added to system prompt GEO section with instructions to optimize for visibility in AI assistants targeting specified regions, include regional relevance, and use culturally relevant terminology

#### Generate GEO Score
- **Type:** Checkbox
- **Default:** false
- **Conditional Behavior:** Hidden in Quick mode
- **Influence:** After primary content generation, triggers separate API call to calculate GEO score based on criteria like direct answers, source attribution, comparative context, etc. Does NOT affect primary prompt

---

## 5. Prompt Construction Logic

### System Prompt Assembly

The Copy Maker system prompt is constructed programmatically in the following order:

1. **TL;DR Requirement Block** (if enhanceForGEO && addTldrSummary && no output structure)
   - Mandatory TL;DR format requirements
   - Explicit failure warnings
   - Format examples

2. **Base Role Definition**
   - "You are an expert copywriter with years of experience in creating persuasive, engaging, and effective marketing copy."

3. **Task Framing**
   - "Your task is to create new marketing copy based on the provided information."
   - Language and tone specification

4. **Word Count Instructions**
   - If prioritizeWordCount is true: "The copy must be between X-Y words (target: Z words, ±T% tolerance). This is STRICT word count mode - you will be asked to revise if outside this range."
   - If false: "CRITICAL WORD COUNT REQUIREMENT: Target: Z words. Acceptable range: X-Y words (±10%). YOU MUST STAY WITHIN THIS RANGE. Content outside X-Y words will be REJECTED. Before you finish, count your words..."

5. **Mode-Specific Instructions**
   - Create mode: "You will create compelling new marketing copy based on the business description provided..."
   - Improve mode: "You will improve the existing marketing copy while maintaining its core message..."

6. **Output Format Requirements**
   - "Your response must contain ONLY the generated marketing copy"
   - "Do NOT include any introductory text, concluding remarks, or explanations"
   - "Do NOT include meta-commentary about how the copy meets requirements"

7. **SEO Metadata Exclusion** (always included)
   - "CRITICAL: DO NOT include any SEO metadata in your content output: DO NOT include URL slugs, meta descriptions, or Open Graph tags..."

8. **Tone Level Instructions** (if toneLevel is defined)
   - Maps slider value to formality guidance

9. **Writing Style** (if preferredWritingStyle is populated)
   - "Preferred writing style: {style}"

10. **Language Style Constraints** (if populated)
    - Bulleted list of constraints to follow

11. **Brand Voice Section** (if brandVoiceId is selected)
    - Full brand voice configuration including personality traits, tone style, sentence style, preferred vocabulary, forbidden terms, CTA style, punctuation rules, advanced style controls
    - "BRAND VOICE HIERARCHY: This brand voice provides the baseline framework... form inputs take precedence..."

12. **Section-Specific Instructions** (if section is populated)
    - Section type identification
    - Context-specific guidance for that section type

13. **Output Structure Instructions** (if outputStructure is populated)
    - Q&A formatting requirements (if Q&A detected)
    - Section title generation instructions (if includeSectionTitles is true)
    - Word count allocations per section (if specified)

14. **Keyword Integration** (if forceKeywordIntegration is true)
    - "IMPORTANT: You MUST naturally integrate all of these keywords throughout the copy..."

15. **Elaboration Instructions** (if forceElaborationsExamples is true)
    - "IMPORTANT: You MUST provide detailed explanations, comprehensive examples..."

16. **GEO Enhancement** (if enhanceForGEO is true)
    - "GEO TARGETING ENABLED: Adapt the output to improve visibility in AI-generated answers..."
    - Region-specific or location-specific or universal instructions based on geoRegions/location fields
    - TL;DR reminder if enabled

17. **Strict Word Count Reminder** (if prioritizeWordCount is true)
    - Repeats strict requirements with exact ranges

18. **General Guidance Block**
    - 8-point list of copy requirements (persuasive, clear, proper grammar, original, highlight USPs, CTA, audience-focused, scannable, professional)
    - Final word count requirement: "The final output must meet or exceed the target word count of {target} words."

19. **Special Instructions** (if specialInstructions is populated)
    - "ADDITIONAL SPECIAL INSTRUCTIONS: {instructions}. These special instructions must be followed in addition to all other requirements."

### User Prompt Assembly

The user prompt is constructed in the following order:

1. **Primary Content Block**
   - Create mode: "Create compelling marketing copy based on this business description: \"\"\"\n{content}\n\"\"\""
   - Improve mode: "Improve this existing marketing copy: \"\"\"\n{content}\n\"\"\""

2. **Key Information Section**
   - If populated: targetAudience, keyMessage, callToAction, desiredEmotion, brandValues, keywords, context, industryNiche, productServiceName, readerFunnelStage, geoRegions
   - Each as bulleted item: "- {label}: {value}"
   - Always includes: tone and language

3. **Competitor Information** (if populated)
   - Competitor URLs as bulleted list
   - Competitor copy text as quoted block

4. **Pain Points** (if populated)
   - "Target audience pain points to address: \"\"\"\n{painPoints}\n\"\"\""

5. **TL;DR Reminder** (if enhanceForGEO && addTldrSummary)
   - "CRITICAL REMINDER: Your response MUST start with 'TL;DR: [one sentence summary]' followed by a blank line, then your main content. This is absolutely mandatory and cannot be skipped."

6. **Output Structure Instructions** (if outputStructure is populated)
   - FAQ JSON note (if FAQ JSON format detected)
   - Q&A format requirements (if Q&A format detected)
   - Section list in exact order with word count targets
   - Format requirements: "CRITICAL OUTPUT FORMAT INSTRUCTIONS: DO NOT use JSON format. DO NOT create a JSON object. Write your response as natural flowing text with markdown headings. Use # for main headings."
   - Section title generation instructions (if includeSectionTitles is true with examples)

7. **Plain Text Output Instruction** (if no output structure)
   - "Provide your response as natural flowing text with appropriate paragraphs and formatting."
   - Section title instructions if includeSectionTitles is true

8. **Word Count Reminder**
   - If prioritizeWordCount is true: "⚠️ STRICT WORD COUNT REQUIREMENT ⚠️ You MUST generate between X-Y words (target: Z words). Content outside this range will be AUTOMATICALLY REJECTED and revised. Count your words before submitting."
   - If false: "📝 WORD COUNT GUIDANCE 📝 Target: approximately Z words. Acceptable range: X-Y words (±30% tolerance). Prioritize content quality and completeness. The word count is a guideline, not a strict requirement. IMPORTANT: Never cut off mid-sentence or leave content incomplete..."

### Conditional Logic

**Brand Voice Precedence:**
- Brand voice settings provide baseline framework
- Form inputs (tone, writing style, special instructions) override brand voice when they conflict
- Explicitly stated in system prompt hierarchy section

**Word Count Enforcement:**
- Strict mode (prioritizeWordCount = true): ±2% tolerance (adjustable), automatic revision triggered if outside range
- Flexible mode (prioritizeWordCount = false): ±30% tolerance, quality-over-precision messaging, revision still occurs if dramatically outside range
- Tolerance settings determined by `getWordCountTolerance()` function which checks prioritizeWordCount and wordCountTolerancePercentage

**Output Format:**
- Plain text with markdown headings is the default and strongly enforced format
- System prompt explicitly forbids JSON object format
- If outputStructure is populated, markdown sections are required with # or ## headings
- If no outputStructure, content flows naturally with optional section headings

**TL;DR Requirement:**
- Only added when enhanceForGEO is true AND addTldrSummary is true AND no output structure is defined
- Prepended to system prompt as absolute mandatory requirement
- Also added as reminder in user prompt

### Enforcement of Word Count, Structure, Constraints

**Limits & Non-Guarantees:**
- **Prompt Instructions Only:** All constraints (word count, structure, forbidden terms) are enforced through prompt instructions to the AI, not through programmatic validation.
- **AI Interpretation:** AI models may not perfectly follow instructions. Generated content may deviate from requirements.
- **No Rejection Mechanism:** System does not reject outputs that violate constraints (except word count, which triggers revision). Non-compliant content is still saved and displayed.

**Word Count:**
1. Target calculated from wordCount/customWordCount
2. System prompt includes target and acceptable range
3. User prompt repeats requirements based on strict/flexible mode
4. After generation, `extractWordCount()` counts actual words in response
5. If outside acceptable range, `reviseContentForWordCount()` is called automatically
6. Revision can occur up to 2 times (first revision, second revision if still outside range)
7. Revision prompts include: "The content is X words but needs to be between Y-Z words. Revise to meet this requirement while maintaining quality..."

**Structure:**
- If outputStructure is populated, user prompt lists sections in exact order
- System prompt requires markdown headings (# or ##)
- No automated validation of structure adherence (AI is instructed, but system doesn't parse/validate structure in response)

**Constraints:**
- Excluded terms: Instructed in system prompt but no post-generation filtering observed in codebase
- Forbidden terms (from brand voice): Instructed in system prompt, no post-generation filtering
- Language style constraints: Instructed in system prompt, no automated validation
- Keywords integration: If forceKeywordIntegration is true, requirement added to system prompt, but no validation of keyword presence in output

---

## 6. Output System

*Note: Output card UI, visual indicators, and layout details described in this section reflect current implementation and may change without affecting core data structure.*

### Output Cards

Generated content is stored in a unified array called `generatedVersions` within the `copyResult` object. Each item in this array is a `GeneratedContentItem` with:

- `id`: Unique identifier
- `type`: Enum value (original, improved, alternative, restyled_improved, restyled_alternative, seo_metadata, faq_schema)
- `content`: String or StructuredCopyOutput object or string array (for headlines)
- `persona`: String (if restyle/voice was applied)
- `score`: ScoreData object (if scoring was performed)
- `faqSchema`: JSON-LD schema (if FAQ schema was generated)
- `sourceId`, `sourceType`, `sourceIndex`, `sourceDisplayName`: Linking metadata for derivative versions
- `generatedAt`: ISO timestamp
- `seoMetadata`: SeoMetadata object (if SEO generation was performed)
- `geoScore`: GeoScoreData object (if GEO scoring was performed)
- `modificationInstruction`: String (if content was modified via custom instruction)
- `blendInstructions`: String (if this is a blended version)
- `brandVoiceName`: String (brand voice name if applied during generation)
- `comparedContent`: Object (for Grok comparison summary cards)

### Multiple Variations

**Initial Generation:**
- Single primary output created
- Stored as first item in generatedVersions array
- If `createVariants` is enabled and `numberOfVariants` > 1, generates additional variants (2-10 total) in same API call sequence
- Each variant uses slightly modified prompt asking for "UNIQUE variation" with "different phrasing, structure, or approach"

**On-Demand Variations:**
After initial generation, user can trigger:
- Alternative versions: New copy with different angle/approach
- Restyled versions: Apply specific persona/voice (Humanize, Alex Hormozi, Steve Jobs, etc.)
- Modified versions: Apply custom instruction to existing content
- Scored versions: Generate quality scores for existing content
- Headlines: Generate headline variations
- Blended versions: Combine multiple outputs based on Grok comparison analysis

Each on-demand generation creates new GeneratedContentItem with appropriate source linking.

### Sectioned Outputs

**When Output Structure is Defined:**
- Content is generated as plain text with markdown headings
- Sections appear in order specified in outputStructure array
- Each section can have individual word count target
- System enforces markdown heading format (# or ##)
- If includeSectionTitles is true, AI generates compelling titles different from structural names

**When No Output Structure:**
- Content generated as natural flowing text
- AI creates own structure and headings based on content needs
- Still uses markdown headings if appropriate

**StructuredCopyOutput Type:**
Legacy format (not actively used in current generation logic):
```
{
  headline: string,
  sections: [{
    title: string,
    content?: string,
    listItems?: string[]
  }],
  wordCountAccuracy?: number
}
```

### Word Count Handling

**Target Calculation:**
- Short: 50-100 → target 75
- Medium: 100-200 → target 150
- Long: 200-400 → target 300
- Custom: uses customWordCount value

**Actual Word Count Extraction:**
- `extractWordCount()` function splits content by whitespace and counts tokens
- Handles both plain string and structured content

**Comparison to Target:**
- Percentage of target calculated: (actual / target) * 100
- Tolerance determined by prioritizeWordCount setting and wordCountTolerancePercentage
- Flexible mode: ±30% tolerance (70% - 130% of target is acceptable)
- Strict mode: ±2% tolerance by default (98% - 102% of target is acceptable)

**Revision Trigger:**
If actual word count falls outside acceptable range:
1. First revision: `reviseContentForWordCount()` called with instructions to expand or contract content
2. Second revision: If still outside range after first revision, second revision attempt made
3. If second revision also fails, system proceeds with best available content

**Revision Prompts:**
- Below target: "The content is {actual} words but needs to be at least {minimum} words. Expand it by adding more details, examples, and elaboration while maintaining quality."
- Above target: "The content is {actual} words but needs to be at most {maximum} words. Condense it by removing redundancy and tightening language while preserving core message."
- Emergency revision: Uses even stricter instructions if second revision is needed

### Retry / Failure Handling

**API Failures:**
- Edge function implements automatic fallback between models
- If selected model fails, system attempts fallback (e.g., DeepSeek → GPT-4o)
- User notified via toast: "Using {fallback} as fallback ({original} unavailable)"
- If no models available, error thrown with API_KEY_FAILED message
- User shown modal to select alternative model manually

**Word Count Revision Failures:**
- If revision API calls fail (network error, timeout, API error), original content is kept
- Error logged to console, progress callback shows error message
- Generation continues (does not completely fail)

**SEO/Scoring/GEO Failures:**
- These are separate API calls after main generation
- If they fail, they fail independently without affecting main content
- Error logged, progress callback updated, but empty result returned
- Main content generation is unaffected

**Token Tracking Failures:**
- Token tracking is mandatory for logged-in users
- If tracking fails, generation proceeds but warning logged
- Session data still saved even if token tracking fails

---

## 7. Scoring & Evaluation

### What is Scored

When Generate Scores is enabled, a separate API call scores generated content on:

1. **Overall Score** (0-100): Composite quality score
2. **Clarity** (descriptive rating): How clear and understandable the copy is
3. **Persuasiveness** (descriptive rating): How effectively it persuades the reader
4. **Tone Match** (descriptive rating): How well it matches requested tone
5. **Engagement** (descriptive rating): How engaging and captivating it is
6. **Word Count Accuracy** (0-100): Percentage accuracy of word count vs target
7. **Improvement Explanation** (text): Explanation of what was improved (for Improve mode)
8. **Suggestions** (array of strings): Specific optimization suggestions

### How Scores Should Be Interpreted

- Scores are AI-generated assessments, not absolute measurements
- Overall score is subjective composite based on AI evaluation criteria
- Word count accuracy is objective: (actual words / target words) * 100, capped at 100
- Descriptive ratings (clarity, persuasiveness, etc.) are qualitative assessments
- Suggestions are actionable recommendations for further improvement

### Explicit Limitations

1. **Subjectivity:** Scores reflect AI model's assessment, not universal truth
2. **No Guarantees:** High scores do not guarantee marketing performance
3. **Context Dependency:** Same copy may score differently with different prompts/contexts
4. **Model Variance:** Different AI models may produce different scores for same content
5. **Criteria Interpretation:** AI interprets scoring criteria based on training, may not align with specific brand standards
6. **No A/B Testing:** Scores do not predict conversion rates or real-world performance

**Scoring is disabled by default.** User must explicitly enable via checkbox.

---

## 8. Templates System

### System Templates

**What They Are:**
- Pre-configured form state snapshots saved to database with `is_public = true`
- Created by admin users
- Visible to all users in template dropdown
- Organized by category (e.g., "Social Media", "Email Marketing", "Web Copy", etc.)

**How They're Stored:**
Database table: `pmc_public_saved_templates`
- All form field values saved as columns
- `form_state_snapshot` column stores complete FormState object as JSON
- `category` field for organization
- `is_public = true` flag distinguishes system templates from user templates

**Selection Mechanism:**
- Dropdown with search capability
- Grouped by category
- When selected, loads all saved field values into form
- Sets `templatePrefilledFields` array to track which fields came from template
- `loadedTemplateId`, `loadedTemplateName`, `loadedTemplateCategory` set in parent state

**What Happens on Load:**
1. Template data fetched from database
2. Form state updated with all template fields
3. Fields with placeholder syntax `[text]` are tracked in `fieldsWithPlaceholders` array
4. UI highlights prefilled fields with indicator badge
5. Placeholder warning modal appears if placeholders detected
6. If template contains customer/brand voice, those associations are loaded

### User Templates

**What They Are:**
- Custom templates saved by individual users
- Visible only to the user who created them
- Same structure as system templates but with `is_public = false` (or user-specific visibility)

**How They're Created:**
1. User fills out form
2. Clicks "Save as Template" button
3. SaveTemplateModal opens
4. User provides: template name, description, category (optional)
5. System captures entire current FormState
6. Saves to database with user_id association

**Updating Existing Templates:**
- If user has loaded a template (loadedTemplateId is set), SaveTemplateModal shows "Update" vs "Save as New" option
- Clicking Save updates existing template record
- Clicking "Save as New" creates new template record

**Template-Form Interaction:**
- Loading template does NOT lock form
- User can modify any field after loading template
- Modified fields lose template prefill indicator
- Saving after modifications can update original template or create new one

### Stored Configuration Logic

**Full FormState Captured:**
All form fields saved including:
- Required inputs (projectDescription, productServiceName, businessDescription/originalCopy)
- Optional inputs (all text fields, dropdowns, etc.)
- Advanced inputs (industryNiche, painPoints, competitorCopyText, etc.)
- Optional feature toggles (generateSeoMetadata, prioritizeWordCount, etc.)
- Output structure configuration
- Customer and brand voice associations

**NOT Stored:**
- Runtime state (isLoading, isEvaluating, generationProgress)
- Generated outputs (copyResult)
- Prompt evaluation results
- Session ID (each load creates new session)
- Model selection (retained from previous form state, not forced by template)

### Interaction with Modes & Inputs

**Mode Switching with Template:**
- Templates can be loaded in any mode (Quick, Standard, Advanced)
- If template contains fields hidden in current mode, warning appears: "This template includes fields not visible in {current mode}. Switch to Advanced mode?"
- User can choose to switch modes or continue with hidden fields populated but not visible
- Hidden fields retain their template values even when not displayed

**Prefill vs Template:**
- Prefills are similar to templates but more lightweight (managed via different UI)
- Prefills can be loaded alongside templates
- Template loading does NOT clear manually entered data (merge operation)
- If conflict between prefill and template, last-loaded wins

### Limits & Non-Guarantees

1. **No Template Validation:** Templates save current form state without validating field values. Invalid configurations (e.g., conflicting settings, placeholder syntax errors) are saved and will load with errors.
2. **No Versioning:** Template updates overwrite previous versions. No history or ability to revert to previous template configuration.
3. **No Cross-Account Sharing:** User templates are account-specific. No built-in mechanism to export/import templates between accounts.
4. **Customer/Brand Voice Dependencies:** Templates that reference customers or brand voices assume those entities exist. Loading template in different account or after deletion of customer/brand voice will fail partially.
5. **Mode Compatibility:** Templates created in Advanced mode with all fields populated may not display correctly in Quick mode, though hidden fields retain values.
6. **No Conflict Resolution:** If template contains contradictory settings (e.g., strict word count mode with elaboration requirements), system does not detect or warn about conflicts.

---

## 9. Models & Providers

### Supported AI Providers

1. **Anthropic (Claude)**
   - claude-sonnet-4-5 (default)
   - claude-haiku-4-5
   - claude-opus-4-5

2. **DeepSeek**
   - deepseek-chat

3. **OpenAI (GPT)**
   - gpt-4o
   - chatgpt-4o-latest
   - gpt-4-turbo
   - gpt-3.5-turbo

4. **xAI (Grok)**
   - grok-4-latest

5. **Google (Gemini)**
   - gemini-2.0-flash

### Model Selection Logic

**User Selection:**
- Dropdown on form with all model options
- Selection persists in form state
- On change, validation check runs

**Validation:**
- When user selects model, API key validation occurs via `validateApiKey()` function
- If model is available (API key configured), selection proceeds
- If model unavailable, AiModelValidationModal appears showing available alternatives

**Fallback Mechanism:**
- Implemented in edge function `makeApiRequestWithFallback()`
- Automatic fallback if primary model fails
- Example: DeepSeek V3 → GPT-4o if DeepSeek unavailable
- User notified via toast and browser event
- `model_used` field in response indicates which model actually generated content

**Model-Specific Behavior:**
- Max output tokens vary by model (see MAX_TOKENS_PER_MODEL constant)
- Claude models: 64K tokens
- GPT variants: 16K tokens
- DeepSeek: 8K tokens
- Gemini: 8K tokens
- Edge function enforces appropriate token limits per model

### Temperature / Top_p Controls

**Temperature:**
- Dynamically set based on content length
- Content ≤150 words: temperature = 0.5 (more precise, less creative)
- Content >150 words: temperature = 0.7 (balanced)

**Top_p:**
- Not explicitly set in codebase
- Default behavior of underlying AI APIs applies

**Rationale:**
Shorter content needs more precision and adherence to instructions, while longer content benefits from more natural variation.

**Limits & Non-Guarantees:**
1. **No Predictable Determinism:** Even with fixed temperature settings, AI models produce variable outputs. Same prompt may yield different results across generations.
2. **Model-Dependent Variance:** Different models interpret temperature settings differently. Temperature 0.7 on Claude may produce different variability than temperature 0.7 on GPT-4.
3. **No Quality Guarantee:** Lower temperature does not guarantee higher quality, only lower randomness. Quality depends on prompt construction, model capability, and input quality.
4. **No Control Over Internal Model State:** Temperature controls output sampling, but internal model decision-making processes remain opaque and variable.

### Per-Call vs Global Behavior

**Per-Call:**
- Temperature set per API call based on target word count
- Max tokens calculated per call based on model limits
- Response format (JSON mode) specified per call when needed (SEO generation, scoring)

**Global:**
- Model selection affects all API calls in a session until changed
- System prompt construction logic is consistent across calls
- Token tracking accumulates across all calls in a session

**No User-Facing Controls:**
Temperature and top_p are not exposed as user inputs. They are hardcoded in the generation logic.

---

## 10. Brand Voice System

### What Brand Voice Is

Brand Voice is a comprehensive style and tone configuration system that defines how copy should sound and feel. It's stored as a structured record in the database and applied systematically to all generated content when selected.

### How It Is Defined

**Core Components:**

1. **Description:** Free-text overview of the brand voice
2. **Personality Traits:** Array of descriptive traits (e.g., "confident", "approachable", "innovative")
3. **Tone Style:** Overall tone description (e.g., "professional yet friendly", "bold and direct")
4. **Sentence Style:** Sentence construction preferences (e.g., "short and punchy", "flowing and descriptive")
5. **Preferred Vocabulary:** Array of words/phrases to favor
6. **Forbidden Terms:** Array of words/phrases to never use
7. **CTA Style:** Call-to-action style preferences
8. **Punctuation Rules:**
   - use_oxford_comma: boolean
   - prefer_short_sentences: boolean
   - max_sentence_length: number
   - use_contractions: boolean
   - exclamation_frequency: 'rare' | 'moderate' | 'frequent'

**Advanced Style Controls (Optional):**

9. **sentence_length:** 'short' | 'medium' | 'long' | 'varied'
10. **rhythm:** 'staccato' | 'smooth' | 'energetic' | 'calm'
11. **formality:** 1-5 scale (1 = extremely casual, 5 = ultra formal)
12. **emotional_tone:** Array of emotion descriptors
13. **persona:** 'mentor' | 'friend' | 'expert' | 'leader' | 'storyteller' | etc.
14. **pov:** 'first_person' | 'second_person' | 'third_person' | 'brand_voice'
15. **figurative_level:** 'literal' | 'balanced' | 'metaphorical'
16. **detail_depth:** 'minimal' | 'balanced' | 'detailed' | 'highly_explanatory'
17. **vocabulary_complexity:** 'simple' | 'basic_professional' | 'sophisticated' | 'highly_intellectual'
18. **content_structure_rules:** Object with flags for short_paragraphs, use_bullets, questions_allowed
19. **allowed_elements:** Array of allowed content elements (e.g., 'questions', 'bullets', 'analogies')
20. **forbidden_elements:** Array of forbidden content elements (e.g., 'emojis', 'slang', 'ALL CAPS')

**Creation Methods:**

1. **AI Analysis of Pasted Content:** User pastes existing copy, AI analyzes and extracts voice characteristics
2. **AI Generation from Description:** User provides brand description, AI generates voice profile
3. **Manual Configuration:** User fills out brand voice form manually (not observed in current UI implementation)

**Database Storage:**
Table: `pmc_public_brand_voices`
- Linked to customer via `customer_id`
- Each customer can have multiple brand voices
- Owner identified via `owner_user_id`

### How It Influences Outputs

**Injection into System Prompt:**

When brand voice is selected, entire brand voice configuration is injected into system prompt as dedicated section:

```
=== BRAND VOICE: {name} ===
{description}

Personality Traits:
- {trait1}
- {trait2}
...

Tone Style: {tone_style}
Sentence Style: {sentence_style}
Preferred Vocabulary: {vocab list}
Forbidden Terms (DO NOT USE): {forbidden list}
Call-to-Action Style: {cta_style}

Punctuation Rules:
- Oxford comma: {required/not used}
- Prefer short sentences
- Max sentence length: X words
- Contractions: {use liberally/avoid}
- Exclamation marks: {frequency}

=== ADVANCED STYLE CONTROLS ===
{all advanced style settings listed}

BRAND VOICE HIERARCHY:
This brand voice provides the baseline framework and default style for the copy.
However, when specific form inputs for this session (tone, writing style, special instructions, etc.) conflict with brand voice settings, the form inputs take precedence.
Think of brand voice as the foundation, and form inputs as session-specific overrides.
```

**Precedence Rules:**
- Brand voice provides baseline/default style
- Form inputs (tone, writing style, special instructions) override brand voice when conflicts occur
- Explicitly stated in prompt to AI
- Ensures session-specific requirements take priority

**Effect on Generation:**
- AI receives detailed style instructions before generating copy
- All voice characteristics applied consistently across generation
- Forbidden terms are explicitly flagged as DO NOT USE
- Preferred vocabulary is favored but not strictly enforced
- Advanced controls fine-tune sentence structure, rhythm, vocabulary complexity, etc.

### Known Limitations

1. **No Automated Enforcement:** System instructs AI but does not validate that forbidden terms were avoided or preferred vocabulary was used
2. **AI Interpretation Variance:** Different models may interpret brand voice instructions differently
3. **Conflicts with Form Inputs:** When form tone contradicts brand voice tone, form wins, but AI may blend both
4. **Complex Configurations:** Highly detailed brand voices with many advanced controls may lead to conflicting instructions
5. **No Version Control:** Brand voice edits affect all future generations immediately, no ability to version or roll back
6. **Customer Dependency:** Brand voice requires customer selection first, cannot be used without customer context

---

## 11. SEO / GEO Features

### SEO-Related Inputs

**Keywords Field:**
- Comma-separated list of target keywords
- Added to user prompt's key information section
- If forceKeywordIntegration is enabled, AI instructed to integrate all keywords naturally

**Force Keyword Integration Toggle:**
- When enabled, system prompt includes mandatory keyword integration instruction
- No validation that keywords actually appear in output

**Generate SEO Metadata Toggle:**
- When enabled, triggers separate API call after main content generation
- Generates: URL slugs, meta descriptions, H1-H3 variants, OG titles, OG descriptions
- Variant counts configurable (1-10 for each type)

### Metadata Generation

**Process:**
1. Main content generated first
2. If Generate SEO Metadata is enabled, separate API call made
3. API receives content + context (language, tone, audience, industry, keywords)
4. Character limits strictly enforced: URL slugs (60 chars), meta descriptions (160 chars), H1 (60 chars), H2/H3 (70 chars), OG titles (60 chars), OG descriptions (110 chars)
5. AI generates exact number of variants specified by user
6. Response parsed and attached to GeneratedContentItem as seoMetadata object

**Output Format:**
```
{
  urlSlugs: string[],
  metaDescriptions: string[],
  h1Variants: string[],
  h2Headings: string[],
  h3Headings: string[],
  ogTitles: string[],
  ogDescriptions: string[]
}
```

**Character Limit Enforcement:**
- System prompt includes "ABSOLUTE MANDATORY CHARACTER LIMIT ENFORCEMENT"
- AI instructed to count characters before submitting
- If approaching limit, AI must shorten content immediately
- Exceeding limit "by even 1 character is COMPLETE FAILURE"

### GEO / LLM Indexing Awareness

**What GEO Is:**
Generative Engine Optimization - optimizing content for visibility in AI-generated answers from ChatGPT, Claude, Gemini, etc.

**GEO Enhancement Toggle:**
When enabled:
- System prompt includes "GEO TARGETING ENABLED: Adapt the output to improve visibility in AI-generated answers for location-based queries"
- If geoRegions is populated: "Optimize the content for visibility in AI assistants targeting the specified regions: {regions}. Include regional relevance, localized phrasing, or examples where helpful."
- If location is populated: "Naturally include this location in the content, such as: 'Serving businesses in {location}'. Reference the region in examples, testimonials, or CTAs."
- If neither: "Focus on making content discoverable and quotable without adding geographical references. Use language that appeals to a broad audience without mentioning specific locations."

**Add TL;DR Summary Toggle:**
When GEO and TL;DR are both enabled:
- System prompt prepended with absolute mandatory TL;DR requirement
- Format: "TL;DR: [one sentence direct answer]\n\n[main content]"
- Designed for better AI snippet extraction
- User prompt includes critical reminder to include TL;DR

**GEO Score Toggle:**
When enabled:
- Separate API call after main generation
- Scores content on GEO criteria: direct answers, source attribution, comparative context, statistical evidence, structured format, quotability, query alignment, location specificity
- Returns overall score + breakdown by criterion + suggestions for improvement

### Explicit Limits of Control

1. **No Pre-Generation Validation:** System instructs AI but does not validate that keywords appear in output before saving
2. **No Post-Generation Filtering:** Excluded terms are instructed but not filtered out after generation
3. **Character Limits for SEO:** Enforced via prompt instructions, not programmatically truncated if exceeded
4. **GEO Optimization:** Subjective assessment, no guarantee of actual AI assistant visibility
5. **Regional Targeting:** AI instructed to optimize for regions but no validation of regional relevance
6. **TL;DR Format:** Mandated in prompt but not validated; if AI doesn't include it, system proceeds with non-compliant output

---

## 12. Legacy & Deprecated Features

### Legacy But Active Features

**Output Structure JSON Format:**
- Original system supported JSON object format with { headline, sections } structure
- Current system explicitly forbids JSON format in prompts: "DO NOT use JSON format. DO NOT create a JSON object with 'headline' and 'sections' keys. Write your response as natural flowing text with markdown headings."
- StructuredCopyOutput type still exists in codebase but not actively used in generation
- System has migrated to markdown plain text format

**Alternative Copy Separate Generation:**
- Original design generated both improved and alternative versions in single API call
- Current system generates only primary version initially
- Alternative versions generated on-demand via separate API call after primary generation
- Legacy properties remain in CopyResult type: alternativeCopy, restyledAlternativeCopy, etc.

**Humanized Copy:**
- Legacy system had separate "humanize" operation
- Current system includes humanization as "restyle" persona option
- Old humanizedCopy properties still in type definitions but not actively populated

**Tab System:**
- Form has three tabs defined: 'create', 'improve', 'copyMaker'
- Only 'create' and 'improve' are actively used
- 'copyMaker' tab value exists but is not used in current UI (CopyMakerTab is the main component but doesn't use 'copyMaker' as a tab value)

### Removed Features Still Referenced

**Prefill Editing Mode:**
- CopyForm component has `isPrefillEditingMode` prop
- Affects whether Generate button is shown
- Not actively used in current CopyMakerTab implementation

**Page Type Field:**
- PageType dropdown existed (Homepage, About, Services, Contact, Other)
- Not displayed in current form UI
- Field still exists in FormState type
- Originally provided page-specific guidance, replaced by more flexible Section field

**Speak Like Personas (Original Implementation):**
- Original system had separate "Speak Like" dropdown on main form
- Migrated to on-demand "Restyle" operation triggered from output cards
- selectedPersona field still in FormState but not actively used in primary generation prompt (only in restyle operations)

### Known Inconsistencies

**Field Visibility Logic:**
- Some fields defined in type system are not rendered in any mode
- Example: readerSophistication defined in form types but not implemented in UI
- pageType field exists but is hidden in all modes

**Output Structure vs Plain Text:**
- System strongly enforces plain text markdown format
- StructuredCopyOutput type suggests JSON structure was original design
- Current implementation discourages JSON but types remain

**Brand Voice Advanced Controls:**
- All advanced style fields are optional in type definition
- Not all advanced controls have UI implementation
- Some controls (like content_structure_rules) use open-ended object type, unclear which rules are supported

**Prompt Display:**
- UI has "View Prompts" button to show constructed prompts
- `storePrompts()` function saves last generated prompts globally
- If generation fails before prompts are constructed, "View Prompts" may show stale prompts from previous generation

**Token Tracking:**
- Mandatory for authenticated users
- If tracking fails, generation proceeds but inconsistency exists between actual API usage and tracked usage
- No retry mechanism for failed token tracking calls

---

## 13. Known Limitations

### Technical Constraints

1. **Single Generation Per Session:** Each "Generate" click creates one primary output. Multiple variants require separate API calls (on-demand generation)
2. **No Streaming:** Outputs arrive complete; no token-by-token streaming to UI
3. **Edge Function Timeout:** Generation API calls have timeout limits (not explicitly documented in codebase but inherited from Supabase Edge Functions)
4. **Token Limit Variability:** Different models have different max token limits; very long prompts + long target word counts may exceed model capacities
5. **No Prompt History:** Each generation is independent; no chat-style history or context from previous generations within same session
6. **No Undo:** Once generated, previous content is replaced; no built-in undo mechanism
7. **Session-Based Storage:** Work is organized into sessions; if session is not saved, inputs and outputs are lost on page refresh

### UX Limitations

1. **No Real-Time Collaboration:** Single-user interface; no multi-user editing or commenting
2. **No Version Comparison UI:** Can compare multiple outputs via Grok Analysis, but no side-by-side diff view
3. **Limited Export Formats:** Can export form as JSON, copy outputs to clipboard, or download as PDF, but no native Markdown or HTML export
4. **Template Organization:** Templates organized by category string; no hierarchical folder structure
5. **No Bulk Operations:** Cannot generate copy for multiple projects/products simultaneously
6. **Modal-Heavy UI:** Most operations open modals; no inline editing or quick actions
7. **Progress Visibility:** Progress messages appear in modal but are text-only; no percentage or step indicators
8. **No Draft Saving:** Outputs are final; no concept of drafts vs published versions

### AI-Related Limits

1. **No Guarantee of Accuracy:** AI-generated content may contain factual errors, requires human review
2. **No Guarantee of Brand Voice Adherence:** System instructs AI but cannot enforce perfect compliance
3. **No Guarantee of Constraint Compliance:** Excluded terms, forbidden terms, character limits are instructed but not validated
4. **Variable Quality:** Different models produce different quality; same model may produce varying quality across generations
5. **No Explainability:** Scoring and evaluation are opaque; AI does not explain why specific scores were assigned
6. **No Bias Detection:** System does not detect or flag potentially biased or sensitive content
7. **No Plagiarism Check:** Generated content is assumed original but not validated against external sources
8. **No SEO Performance Prediction:** SEO metadata is generated based on best practices, but no guarantee of ranking improvement
9. **No Conversion Optimization:** Copy is optimized for persuasion based on AI training, but no A/B testing or conversion prediction
10. **Token Cost Variability:** Different models have different costs per token; users must monitor token usage separately

---

## 14. Terminology Glossary

**Alternative Version**
On-demand generation that creates a different approach or angle to the same content while maintaining core message.

**Brand Voice**
Structured configuration defining tone, style, vocabulary, and rules for how copy should sound.

**Copy Maker**
The core module within CopyZap responsible for copy generation, form management, prompt construction, and output handling.

**CopyZap**
The product name for the AI-powered marketing copy generation platform. Copy Maker is the core module within CopyZap.

**Business Description**
Primary input field in Create mode containing description of the business, product, or service.

**Content Item**
Individual generated output stored in generatedVersions array with unique ID and metadata.

**Copy Result**
Object containing all generated outputs, scores, metadata, and session information.

**Create Mode**
Generation mode for producing entirely new marketing copy from business descriptions.

**Customer**
Organizational entity (client, company) for which copy is being generated. Required for brand voice selection.

**Custom Word Count**
User-specified target word count when "Custom" option is selected from Word Count dropdown.

**Form State**
Complete state object containing all user inputs, settings, runtime flags, and generated results.

**GEO (Generative Engine Optimization)**
Optimizing content for visibility in AI assistant responses (ChatGPT, Claude, Gemini, etc.).

**Generated Versions**
Array of GeneratedContentItem objects representing all outputs from a session.

**Humanize**
Restyle persona that transforms text into warm, conversational, relatable voice with natural language patterns.

**Improve Mode**
Generation mode for enhancing and refining existing marketing copy.

**Mode**
Form display mode (Quick, Standard, Advanced) controlling which fields are visible.

**On-Demand Generation**
Secondary generation operations triggered from output cards (alternative, restyle, score, etc.).

**Original Copy**
Primary input field in Improve mode containing existing copy to be enhanced.

**Output Structure**
Ordered list of sections defining desired content structure (Problem, Solution, Benefits, etc.).

**Persona**
Voice style applied via restyle operation (Alex Hormozi, Steve Jobs, Humanize, etc.).

**Prefill**
Lightweight saved configuration that can be quickly loaded to populate form fields.

**Primary Generation**
Initial API call that produces the first output after user clicks Generate.

**Project Description**
Internal organizational field (not sent to AI) used to name and identify sessions.

**Prompt**
Instructions sent to AI model consisting of system prompt (role/rules) and user prompt (task/content).

**Quick Mode**
Simplified form mode showing only essential fields (10 fields).

**Restyle**
On-demand operation that applies specific persona/voice to existing content.

**Revision**
Automated secondary API call to adjust content word count when outside acceptable range.

**Score**
AI-generated quality assessment including overall score, clarity, persuasiveness, tone match, engagement.

**Section**
Specific part of a page type (Hero Section, Benefits, Features, etc.) for focused guidance.

**SEO Metadata**
URL slugs, meta descriptions, headings, and OG tags generated separately from main content.

**Session**
Database record linking user, customer, inputs, outputs, and metadata for a single project.

**Special Instructions**
Free-form text field appended to system prompt as additional requirements.

**Standard Mode**
Balanced form mode showing essential fields plus mid-level controls and optional features (20+ fields).

**Strict Mode**
Word count enforcement setting with tight tolerance (±2% default).

**Structured Output**
Content organized into predefined sections with markdown headings.

**System Prompt**
Instructions defining AI's role, rules, constraints, and output requirements.

**Tab**
Primary mode selection (create or improve) determining generation approach.

**Target Word Count**
Calculated word count goal based on wordCount dropdown or customWordCount value.

**Template**
Saved form configuration that can be reloaded to populate all form fields.

**TL;DR Summary**
One-sentence direct answer placed at beginning of content for GEO optimization.

**Token**
Unit of AI API usage measured and tracked per call (approximately 0.75 words per token).

**Tolerance**
Acceptable range around target word count (±2% strict, ±30% flexible).

**User Prompt**
Task-specific instructions containing content to work with and key information.

**Wizard**
Guided setup flow (QuickSetupWizard) that collects inputs through multi-step interface.

**Word Count Accuracy**
Percentage representing how close generated content is to target word count.

---

END OF CANONICAL DOCUMENTATION
