# CopyZap - Quick Prompt Wizard - DEEP DIVE

## Overview

The **Quick Prompt Wizard** is CopyZap's guided onboarding and configuration tool that transforms simple user inputs into comprehensive, professional-grade form configurations. It bridges the gap between "I need marketing copy" and "Here's a perfectly configured prompt ready to generate."

**Key Innovation:** Uses AI to generate intelligent form field values from just 3 simple questions, then allows optional fine-tuning of all 40+ fields before applying.

---

## Why the Wizard Exists

### The Problem It Solves

**Without Wizard:**
- New users face 40+ empty form fields
- Overwhelming decision paralysis
- Don't know which fields matter
- Unclear how fields interact
- Hours spent learning the system

**With Wizard:**
- 3 simple questions
- AI fills 20+ fields intelligently
- Immediate results
- Learn by example
- Productive in minutes

### Target Users

**Primary:**
- First-time users
- Users unfamiliar with prompt engineering
- Quick content needs
- Users exploring the platform

**Secondary:**
- Experienced users wanting speed
- Template creators seeking starting points
- Users trying new content types
- Teams standardizing workflows

---

## Complete Wizard Flow

### Accessing the Wizard

**Button Location:** AI Prompt Section in the Copy Maker

**Visual Design:**
- Magic wand icon (Wand2) positioned to the left of text
- Button text: "Quick Prompt Wizard"
- Gradient primary background (blue)
- Full-width button with clear visual prominence
- Icon size: 18px for optimal visibility
- Gap of 8px between icon and text

**Purpose:** Single-click access to the guided setup experience

---

### Mode Selector (Initial Screen)

When the wizard first opens, users see a **mode selection screen** with three distinct workflow options:

**Three Workflow Modes:**

1. **Create New** (Sparkles icon)
   - Blue gradient card
   - For building copy from scratch
   - Guided through 2-step wizard process
   - Focuses on business description, audience, and goals
   - Best for: Starting with just an idea

2. **Improve Copy** (Wrench icon)
   - Green gradient card
   - For enhancing existing content
   - Guided through 2-step wizard process
   - Focuses on original copy and desired improvements
   - Best for: Refining and optimizing existing text

3. **Quick Polish** (Zap icon)
   - Amber gradient card
   - **Ultra-fast single-screen workflow**
   - Paste copy → Pick improvement → Generate
   - No wizard steps, instant results
   - Best for: Quick tweaks and fast iterations
   - See [analysis1-quick-polish-mode.md](./analysis1-quick-polish-mode.md) for detailed documentation

**Visual Design:**
- Three side-by-side gradient cards with hover animations
- Each card shows icon, title, description, and subtitle
- Clear value proposition for each workflow
- "Not sure which to pick?" helper text below cards
- Smooth scale and shadow effects on hover

**User Flow:**
- Click a mode card to enter that workflow
- **Quick Polish** → Loads single-screen polish interface (separate from wizard steps)
- **Create New / Improve Copy** → Proceeds to Step 1 of the wizard

---

### Step 1: What Are You Creating?

**Question:** "What are you creating?"

**Purpose:**
- Identifies content type
- Establishes project context
- Provides AI generation foundation
- Determines appropriate fields to populate

**Input Type:** Large textarea

**NEW: URL Analysis Feature**

Users can now analyze a URL to automatically extract content and pre-fill wizard answers:

**Access:** "Analyze URL" button (with Globe icon) appears above the textarea

**Two Analysis Modes:**

1. **Analyze Context:** (Available in both Create and Improve modes)
   - Extracts key information from the webpage
   - Pre-fills wizard fields with extracted data
   - Quick context gathering for content creation

2. **Extract Copy:** (Available in Improve mode only)
   - Extracts all marketing copy from the webpage
   - Automatically populates the "Original Copy" field
   - **NEW: Auto-detects word count** and sets Target Length accordingly
   - **NEW: Detects page structure** (Hero, Features, Benefits, FAQ, etc.)
   - Perfect for improving existing web content

**User Experience:**
- Click "Analyze URL" button to reveal URL input field
- Paste URL (https:// is auto-prepended if missing)
- Click "Analyze Context" or "Extract Copy" button
- **Modal appears** with spinner and "Cancel" button
- Modal shows different messages based on mode:
  - "Analyzing URL..." for context analysis
  - "Extracting Copy..." for full copy extraction
- Cancel button allows aborting the analysis at any time
- Results populate wizard fields automatically
- URL input area collapses after successful analysis

**NEW: Structure Confirmation Modal (Extract Copy mode only):**

When extracting copy from a URL, the system now detects the page structure and gives you a choice:

**What Happens:**
1. After extraction completes, a confirmation modal appears
2. Shows two structure options side-by-side:
   - **Extracted Structure:** Sections detected from the actual webpage (e.g., "Hero", "Features", "Benefits", "FAQ", "Call to Action")
   - **Default Structure:** Generic fallback (Overview, Key Points, Call to Action)
3. Each structure card shows:
   - Section names detected/suggested
   - Number of sections
   - Clear labels for easy comparison

**User Choice:**
- Click **"Use Extracted"** to apply the detected structure to Output Structure field
- Click **"Use Default"** to use the generic structure instead
- Both options convert the structure into properly formatted `StructuredOutputElement[]` with IDs and labels

**Why This Matters:**
- Preserves original page architecture when improving copy
- Maintains section flow and hierarchy
- Ensures generated copy matches original structure
- Gives flexibility if detected structure seems incorrect

**Technical Details:**
- Edge function returns `outputStructure` array from page analysis
- Modal only appears if structure is successfully detected (>0 sections)
- If no structure detected, applies data directly without modal
- Structure is converted to proper format using `createOutputStructure()` helper

**What to Include:**
- Content type (e.g., "landing page", "email", "ad copy")
- Subject matter (e.g., "project management software")
- Key goal (e.g., "convince small businesses to try free trial")
- Any specific requirements

**Quality Matters:** More detail = better AI configuration

**Example Inputs:**

**Basic:**
```
"Landing page for project management software"
```

**Good:**
```
"Landing page hero section for a project management tool designed for
remote teams. Focus on simplicity and time-saving benefits."
```

**Excellent:**
```
"Landing page hero section for TaskFlow Pro, a project management platform
specifically for remote teams of 5-50 people. Need to emphasize how we solve
coordination chaos and save time without complicated features. Main message:
go from chaos to clarity in 48 hours."
```

**How This Affects AI Generation:**
- Basic input → Generic configuration
- Good input → Relevant, focused configuration
- Excellent input → Highly specific, production-ready configuration

**Mode Selection: Create vs Improve**

Two radio buttons determine primary workflow:

**Create New Copy:**
- AI populates "Business Description" field
- Focuses on generating from scratch
- Emphasizes benefits and value props
- Use when starting fresh

**Improve Existing Copy:**
- AI populates "Original Copy" field
- Focuses on enhancement and refinement
- Emphasizes improvement suggestions
- Use when refining existing content

---

### Step 2: Target Audience

**Question:** "Who is this for?"

**Purpose:**
- Defines reader profile
- Shapes tone sophistication
- Guides pain point relevance
- Influences language complexity

**Input Type:** Textarea

**What to Include:**
- Role/title (e.g., "small business owners")
- Company size/type (e.g., "10-50 person startups")
- Technical level (e.g., "not very technical")
- Current situation (e.g., "struggling with team coordination")
- Decision authority (e.g., "decision makers")

**Example Inputs:**

**Vague:**
```
"Business people"
```
Result: Generic, broad configuration

**Specific:**
```
"Small business owners with 5-20 employees who are not very technical and
currently using spreadsheets and email to manage projects"
```
Result: Precise tone, appropriate complexity, relevant pain points

**Highly Detailed:**
```
"Founders and operations managers at tech startups (10-50 people) who are
dealing with remote team coordination chaos. They're technical enough to
appreciate good software but frustrated by complex enterprise tools. They
need something that works immediately without extensive training. Budget-conscious
but willing to pay for tools that deliver clear ROI."
```
Result: Highly targeted configuration with perfect tone matching

**How This Affects AI Configuration:**
- Sets appropriate reading level
- Adjusts formality
- Influences example types
- Shapes benefit framing
- Determines pain points to emphasize

---

### Step 3: Configuration & Options

**Core Settings:**

#### **Tone Selection (Dropdown)**

Options:
- Professional
- Friendly
- Bold
- Minimalist
- Creative
- Persuasive

**How to Choose:**
- Match brand personality
- Consider audience expectations
- Align with industry norms
- Test: How would your brand speak?

#### **Word Count Selection (Target Length)**

Options:
- Short: 50-100 words
- Medium: 100-200 words
- Long: 200-400 words
- Custom: Specify exact number

**How to Choose:**
- Platform constraints (ads = short)
- Content depth needed (features = long)
- Audience attention span
- Purpose (awareness = longer, decision = shorter)

**Custom Word Count:**
- Appears when "Custom" selected
- Number input field
- Use for precise requirements
- Example: 275 words for specific platform

**NEW: Auto-Detection from URL:**
- When using "Extract Copy" in Improve mode
- System automatically counts words in extracted content
- Sets Target Length field to match detected word count
- Ensures improved copy maintains original length
- User can still manually adjust if needed

#### **Special Instructions (Textarea)**

**Purpose:** Add unique requirements beyond standard options

**What to Include:**
- Regional language preferences
- Formatting requirements
- Brand-specific rules
- Content constraints
- Cultural considerations

**Example Special Instructions:**
```
"Use Vienna slang naturally. Keep paragraphs under 3 sentences.
Include a question at the end. Bold all feature names."
```

#### **Enable SEO (Checkbox)**

**What It Does:**
- Generates SEO metadata alongside content
- Includes URL slugs, meta descriptions, H1/H2/H3 variants
- Adds OG tags for social sharing
- Optimizes content for search

**When to Enable:**
- Web-published content
- Landing pages
- Blog posts
- Product pages

**When to Skip:**
- Email content
- Social posts (not web pages)
- Internal documents
- Print materials

#### **Enable GEO (Checkbox)**

**What It Does:**
- Optimizes for AI-powered search engines
- Adds citation-friendly structure
- Includes TL;DR summaries
- Improves discoverability in ChatGPT, Perplexity, etc.

**When to Enable:**
- Future-proofing content
- Educational content
- FAQ pages
- Information-rich content

**When to Skip:**
- Time-sensitive campaigns
- Platform-specific content
- Very short content

---

### AI Generation Process

**What Happens When You Click "Generate Setup":**

1. **Instruction Building:**
   - Combines all wizard answers into natural language
   - Adds explicit rules for checkboxes
   - Constructs comprehensive instruction

2. **API Call to AI:**
   - Sends instruction to template suggestion endpoint
   - AI analyzes requirements
   - Generates JSON configuration

3. **Configuration Generation:**
   - AI populates 20+ form fields
   - Selects appropriate settings
   - Creates coherent configuration
   - Respects explicit wizard choices

4. **Override Application:**
   - Wizard answers override AI suggestions
   - Ensures tone, word count, SEO/GEO flags match choices
   - Validates configuration completeness

**Example Generation:**

**Wizard Input:**
```
What: "Landing page for project management software for remote teams"
Who: "Small business owners, not technical"
Tone: Friendly
Word Count: Medium (100-200)
Special: "Keep it simple, avoid jargon"
SEO: Enabled
```

**AI Generates:**
```json
{
  "model": "deepseek-chat",
  "tab": "create",
  "businessDescription": "Cloud-based project management software designed for remote teams...",
  "productServiceName": "TaskFlow Pro",
  "targetAudience": "Small business owners with remote teams who need simple...",
  "targetAudiencePainPoints": "Team coordination chaos, missed deadlines...",
  "keyMessage": "Simplify remote team management in minutes",
  "tone": "Friendly",
  "wordCount": "Medium: 100-200",
  "industryNiche": "saas-tech",
  "preferredWritingStyle": "conversational",
  "generateSeoMetadata": true,
  "specialInstructions": "Keep it simple, avoid jargon",
  "keywords": "project management, remote teams, collaboration",
  ...
}
```

---

### Step 4: Fine-Tune (Optional)

**Purpose:** Review and adjust all generated fields before applying

**When to Use Fine-Tune:**
- Want to see what AI generated
- Need to adjust specific fields
- Learning how fields work
- Want precise control
- Creating template for reuse

**When to Skip:**
- Happy with AI configuration
- Want speed over precision
- Exploring platform
- Trust AI judgment

**What You Can Adjust:**

**Section: AI Model**
- Change from default (DeepSeek) to premium models
- Adjust for quality/cost tradeoff

**Section: Essential Settings**
- Product/Service Name
- Project Description
- Target Audience (review/refine)
- Pain Points (review/refine)

**Section: Core Parameters**
- Language
- Tone (review)
- Word Count (review)

**Section: Business Context**
- Business Description (review/refine)
- Industry/Niche (adjust if wrong)
- Location (add if needed)

**Section: Messaging**
- Key Message (refine)
- Desired Emotion (add)
- Brand Values (add)
- Call to Action (specify)

**Section: Content Specs**
- Output Structure (define if needed)
- Keywords (review/add)
- Context (add situational info)

**Section: Advanced Options**
- Special Instructions (review)
- Excluded Terms (add)
- Language Style Constraints (add)

**Section: Generation Features**
- SEO Settings (adjust variants)
- GEO Settings
- Score Generation
- Word Count Precision

**Navigation in Fine-Tune:**
- **Back Button:** Returns to Step 3 (if came from Step 3) or Summary (if came from Summary)
- **Apply & Close Button:** Saves changes and either returns to Step 3 or applies to main form

---

### Summary View

**Purpose:** Final review before applying configuration

**What's Displayed:**

**Configuration Overview:**
- Mode (Create/Improve)
- AI Model
- Tone & Word Count
- SEO/GEO Status

**Key Settings:**
- Product/Service Name
- Target Audience
- Pain Points
- Special Instructions

**Generated Fields Preview:**
- Business Description excerpt
- Industry/Niche
- Key Message
- Keywords

**Action Buttons:**

**1. Apply & Generate**
- Applies configuration to form in **Smart Mode** by default
- Immediately triggers generation
- Closes wizard
- Best for: Speed, trust in configuration

**2. Apply Only**
- Applies configuration to form in **Smart Mode** by default
- Allows manual review before generating
- Closes wizard
- Best for: Want to review/edit before generating

**3. Fine-Tune**
- Opens Step 4 (Fine-Tune interface)
- Allows field-by-field adjustment
- Returns to summary after saving
- Best for: Want precise control

**4. Start Over**
- Clears wizard state
- Returns to Step 1
- Allows complete restart
- Best for: Wrong direction, want fresh start

---

## State Persistence

### LocalStorage Auto-Save

**What Gets Saved:**
- Current wizard step
- All wizard answers
- Advanced fields from fine-tune
- Selected extra fields

**When It Saves:**
- After every step change
- After every field update
- Automatically in background

**When It Clears:**
- On wizard completion (Apply or Apply & Generate)
- On manual close
- On "Start Over"

**Why This Matters:**
- Page refresh doesn't lose progress
- Can switch tabs and return
- Accidental close recoverable
- Experimentation safe

### Smart Mode Transition

After completing the Wizard, the user is directed to the Copy Maker in **Smart Mode** by default. They can switch to Expert Mode anytime to view or adjust advanced parameters.

This change ensures that users see only the essential fields post-Wizard, improving first-run simplicity and completion rates.

---

## AI Configuration Intelligence

### What AI Understands

**From "What Are You Creating":**
- Content type (landing page, email, ad, etc.)
- Subject matter
- Product category
- Goal/purpose

**From "Target Audience":**
- Sophistication level
- Company size
- Technical ability
- Current situation
- Pain points

**From Configuration:**
- Desired tone
- Content length
- Special requirements
- SEO/GEO needs

### What AI Generates

**Always Populated:**
- Business Description (or Original Copy)
- Product/Service Name
- Project Description
- Target Audience
- Target Audience Pain Points
- Tone
- Word Count
- Model selection

**Conditionally Populated:**
- Industry/Niche (if identifiable)
- Keywords (if SEO enabled or content type implies)
- Output Structure (if content type has standard structure)
- Key Message (if clear from input)
- Preferred Writing Style (based on tone + content type)
- Special Instructions (based on wizard special instructions + content requirements)

**Rarely Populated (unless specifically mentioned):**
- Brand Values
- Desired Emotion
- Location
- Excluded Terms
- Language Style Constraints
- Specific SEO variant counts

---

## Wizard Best Practices

### For First-Time Users

1. **Be Specific in Step 1:**
   - More detail = better configuration
   - Include product name if you have one
   - Mention key benefits or differentiators

2. **Describe Audience Well in Step 2:**
   - Include technical level
   - Mention current situation
   - Note decision authority

3. **Use Special Instructions for Unique Needs:**
   - Regional language preferences
   - Brand-specific rules
   - Content constraints

4. **Review Summary Before Applying:**
   - Check if configuration makes sense
   - Use Fine-Tune if adjustments needed
   - Start Over if completely wrong

5. **Choose "Apply Only" First Time:**
   - Review configuration in main form
   - Understand what AI generated
   - Learn field purposes
   - Generate when ready

### For Experienced Users

1. **Wizard as Speed Tool:**
   - Quick configuration generation
   - Starting point for customization
   - Template creation aid

2. **Use Fine-Tune Liberally:**
   - Adjust AI suggestions
   - Add advanced settings
   - Create reusable templates

3. **Leverage for New Content Types:**
   - Explore unfamiliar formats
   - See how fields should be filled
   - Learn best practices

### Common Mistakes to Avoid

**❌ Too Vague in Step 1:**
```
"Website copy"
```
Result: Generic, unfocused configuration

**✅ Specific in Step 1:**
```
"Homepage hero section for SaaS project management tool targeting remote teams"
```
Result: Focused, relevant configuration

**❌ Generic Audience in Step 2:**
```
"Everyone"
```
Result: Unfocused tone, broad messaging

**✅ Specific Audience in Step 2:**
```
"Small business owners, 5-20 employees, not technical, using spreadsheets now"
```
Result: Precise tone, relevant messaging

**❌ Skipping Special Instructions:**
Result: Misses unique requirements

**✅ Using Special Instructions:**
```
"Use Vienna slang, avoid American idioms, keep paragraphs short"
```
Result: Perfectly customized output

---

## Wizard Workflow Patterns

### Pattern 1: Speed User

```
Step 1: Fill → Continue
Step 2: Fill → Continue
Step 3: Configure → Generate Setup
Summary: Apply & Generate → Done
```
Time: 2-3 minutes
Best for: Trust AI, need speed

### Pattern 2: Careful User

```
Step 1: Fill → Continue
Step 2: Fill → Continue
Step 3: Configure → Generate Setup
Summary: Apply Only → Review in Form → Generate
```
Time: 5-7 minutes
Best for: Want review control

### Pattern 3: Power User

```
Step 1: Fill → Continue
Step 2: Fill → Continue
Step 3: Configure → Generate Setup
Summary: Fine-Tune → Adjust All Fields → Apply & Close
Step 3: Review → Generate Setup
Summary: Apply & Generate
```
Time: 10-15 minutes
Best for: Precise requirements, template creation

### Pattern 4: Learning User

```
Step 1: Fill → Continue
Step 2: Fill → Continue
Step 3: Configure → Generate Setup
Summary: Fine-Tune → Review All Fields → Note Learnings
Summary: Apply Only → Study Configuration → Generate
```
Time: 15-20 minutes
Best for: Learning platform, understanding fields

---

## Competitive Advantage

### vs Jasper's Templates
**Jasper:** Static templates with fixed fields
**CopyZap Wizard:** AI-generated dynamic configuration

### vs Copy.ai's Workflows
**Copy.ai:** Pre-defined workflows, limited customization
**CopyZap Wizard:** Flexible AI generation + full fine-tuning

### vs Writesonic's ChatSonic
**Writesonic:** Conversational but manual prompt writing
**CopyZap Wizard:** Guided questions + professional prompt engineering

### Unique Value

1. **AI-Powered Configuration:** No competitor generates complete form configurations from simple questions
2. **Fine-Tune Option:** Review and adjust before applying (unique combination of speed + control)
3. **State Persistence:** Never lose progress (rare in competitor tools)
4. **Dual-Path Architecture:** Can bypass wizard entirely for manual control
5. **Learning Tool:** Shows how professional prompts should be structured

---

## Technical Implementation Notes

### Data Flow

```
Wizard Answers → buildInstruction() → API Call →
generateTemplateJsonSuggestion() → AI Response →
Override with Wizard Choices → Generated Configuration →
Optional Fine-Tune → Apply to FormState
```

### Key Functions

**buildInstruction():**
- Converts wizard answers to natural language
- Adds explicit rules for checkboxes
- Constructs AI-ready instruction

**handleGenerate():**
- Validates inputs
- Calls API
- Applies overrides
- Updates state

**handleFineTune():**
- Navigates to Step 4
- Preserves state
- Enables full editing

**handleApply():**
- Validates configuration
- Populates required fields
- Clears wizard state
- Applies to form or generates

### State Management

**wizardState:**
- Current step
- All answers
- Mode (create/improve)

**generatedData:**
- AI-generated configuration
- Populated fields

**advancedFields:**
- Fine-tuned modifications
- User overrides

**selectedExtraFields:**
- Additional fields user added
- Custom selections

---

## Conclusion

The Quick Prompt Wizard is CopyZap's key differentiator for onboarding and speed. It demonstrates that sophisticated AI copywriting doesn't require expertise - just clear answers to simple questions. The optional fine-tuning bridges simplicity and power, satisfying both novice and expert users.

**Master the wizard to:**
- Generate professional configurations in minutes
- Learn prompt engineering by example
- Create reusable templates efficiently
- Onboard team members quickly
- Standardize workflows across projects
