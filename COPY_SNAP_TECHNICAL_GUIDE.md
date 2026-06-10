# Copy Snap Technical Guide

**Version:** 2.0
**Last Updated:** 2026-01-28

---

## Table of Contents

1. [Overview](#overview)
2. [Core Concept](#core-concept)
3. [Three Operating Modes](#three-operating-modes)
4. [Improve Mode](#improve-mode)
5. [Answer Mode](#answer-mode)
6. [Question Mode](#question-mode)
7. [AI Processing Pipeline](#ai-processing-pipeline)
8. [Output System](#output-system)
9. [User Actions](#user-actions)
10. [Technical Implementation](#technical-implementation)

---

## Overview

Copy Snap is a lightweight, instant AI assistant designed for quick text transformations. Unlike Copy Maker (which is template-driven and comprehensive), Copy Snap is focused on speed and simplicity for three common tasks:

- **Improve** existing copy
- **Answer** messages or prompts
- **Question** generate questions about text

The interface is minimal, mobile-friendly, and optimized for rapid iteration.

---

## Core Concept

### Design Philosophy

Copy Snap follows a **"paste, tweak, snap"** workflow:

1. **Paste** your text into the input field
2. **Tweak** the controls to define your goal
3. **Snap** to generate instant results

No templates. No complex forms. No multi-step wizards. Just fast, focused AI assistance.

### Key Features

- **Single input field** for all modes
- **Mode-specific controls** that adapt based on your task
- **Language-aware output** - responds in the same language as your input
- **Human tone mode** - optional natural, social-native writing style
- **Instant generation** with DeepSeek AI model + GPT-4o fallback
- **Multiple outputs** (best result + alternatives)
- **One-tap copy buttons** on all outputs and alternatives
- **Replace input** to iterate on outputs
- **Special instructions** for custom guidance
- **Token tracking** for credit management

---

## Three Operating Modes

Copy Snap operates in three distinct modes. Each mode has its own set of controls and generates different output formats.

### Mode Selection

Users select a mode via three large buttons:
- **Improve** - Make existing copy better
- **Answer** - Generate replies to messages
- **Question** - Ask questions about text

When you switch modes:
- The input text **stays the same** (not cleared)
- The controls section **changes dynamically** to show mode-specific options
- Any previous output is **cleared** until you generate again

---

## Improve Mode

### Purpose

Transform existing copy to make it better for a specific goal, platform, and length preference.

### Controls

#### 1. Goal (4 options)

Defines the primary improvement objective:

| Option | Description | Prompt Instruction |
|--------|-------------|-------------------|
| **Clearer** | Make the copy clearer and easier to understand | "Make the copy clearer and easier to understand" |
| **Persuasive** | Make the copy more persuasive and compelling | "Make the copy more persuasive and compelling" |
| **Shorter** | Make the copy shorter and more concise | "Make the copy shorter and more concise" |
| **Punchier** | Make the copy punchier with stronger impact | "Make the copy punchier with stronger impact" |

**Default:** Clearer

#### 2. Platform (4 options)

Optimizes the copy for a specific channel:

| Option | Description | Prompt Instruction |
|--------|-------------|-------------------|
| **General** | For general use | "for general use" |
| **X** | Optimized for X (Twitter) | "optimized for X (Twitter)" |
| **LinkedIn** | Optimized for LinkedIn | "optimized for LinkedIn" |
| **Email** | Optimized for email | "optimized for email" |

**Default:** General

**Platform Considerations:**
- **X**: Character limits, hashtags, threading style
- **LinkedIn**: Professional tone, longer-form acceptable
- **Email**: Subject line optimization, clear CTAs
- **General**: No platform-specific constraints

#### 3. Length (3 options)

Controls the target length relative to the original:

| Option | Description | Prompt Instruction |
|--------|-------------|-------------------|
| **Short** | Shorter than the original | "shorter than the original" |
| **Same** | Roughly the same length as the original | "roughly the same length as the original" |
| **Longer** | Longer than the original with more detail | "longer than the original with more detail" |

**Default:** Same

### Improve Mode Output Structure

The AI returns a JSON object with three components:

```json
{
  "best": "Your primary improved version",
  "alternatives": [
    "Alternative version 1",
    "Alternative version 2"
  ],
  "notes": [
    "Tip 1 about the improvements",
    "Tip 2 about what changed",
    "Tip 3 about further optimization"
  ]
}
```

#### Output Components:

1. **Best** - The primary improved version, optimized for your selected goal, platform, and length
2. **Alternatives** (2 versions) - Additional variations to give you options
3. **Notes** (3 tips) - Expert tips explaining the improvements and suggesting further refinements

### Example Improve Workflow

**User Input:**
```
Check out our new product it's really good and affordable
```

**Settings:**
- Goal: Persuasive
- Platform: X
- Length: Same

**Generated Output:**

**Best:**
```
Introducing our game-changing product: premium quality at a price that works for you.
See why customers are raving 👇
```

**Alternatives:**
1. "Meet the product that delivers luxury without the luxury price tag. Limited spots available."
2. "Quality + affordability = rare find. Our new product checks both boxes. Try it risk-free."

**Notes:**
- "Added social proof with 'customers are raving' to build credibility"
- "Used 'game-changing' to create stronger impact than 'really good'"
- "Added emoji for X platform optimization and visual engagement"

---

## Answer Mode

### Purpose

Generate replies to messages, comments, or prompts with specific style and positioning.

### Controls

#### 1. Reply Style (5 options)

Defines the tone and personality of the reply:

| Option | Description | Prompt Instruction |
|--------|-------------|-------------------|
| **Helpful** | Helpful and supportive | "helpful and supportive" |
| **Friendly** | Friendly and warm | "friendly and warm" |
| **Confident** | Confident and authoritative | "confident and authoritative" |
| **Witty** | Witty and clever | "witty and clever" |
| **Direct** | Direct and straightforward | "direct and straightforward" |

**Default:** Helpful

#### 2. Stance (3 options)

Defines your position relative to the message:

| Option | Description | Prompt Instruction |
|--------|-------------|-------------------|
| **Neutral** | Take a neutral, balanced stance | "Take a neutral, balanced stance" |
| **Agree** | Take an agreeing, supportive stance | "Take an agreeing, supportive stance" |
| **Disagree** | Respectfully disagree or offer a counterpoint | "Respectfully disagree or offer a counterpoint" |

**Default:** Neutral

**Use Cases:**
- **Neutral**: Professional responses, customer service, uncertain situations
- **Agree**: Supporting comments, building on ideas, positive reinforcement
- **Disagree**: Constructive feedback, debate, offering alternative perspectives

#### 3. Length (3 options)

Controls reply length:

| Option | Description | Prompt Instruction |
|--------|-------------|-------------------|
| **Short** | Keep the reply short (1-2 sentences) | "Keep the reply short (1-2 sentences)" |
| **Medium** | Write a medium-length reply (2-4 sentences) | "Write a medium-length reply (2-4 sentences)" |
| **Long** | Write a detailed reply (4-6 sentences) | "Write a detailed reply (4-6 sentences)" |

**Default:** Short

### Answer Mode Output Structure

```json
{
  "best": "Your primary reply",
  "alternatives": [
    "Alternative reply 1",
    "Alternative reply 2"
  ]
}
```

**Note:** Answer mode does NOT include "notes" - just the best reply and alternatives.

### Example Answer Workflow

**User Input (message to reply to):**
```
Your pricing seems too high compared to competitors. Why should I choose you?
```

**Settings:**
- Style: Confident
- Stance: Disagree (respectfully)
- Length: Medium

**Generated Output:**

**Best:**
```
While our pricing is premium, here's why: we include features competitors charge extra for,
our support is 24/7 (not outsourced), and our customers see ROI in 30 days. You're not
paying more—you're investing smarter.
```

**Alternatives:**
1. "Great question. What looks like 'high pricing' is actually value-per-dollar leadership. Our all-inclusive approach means no surprise fees, unlike competitors who nickel-and-dime. Compare total cost of ownership, not just sticker price."
2. "I appreciate the direct feedback. Our pricing reflects our commitment to quality and outcomes. We could be cheaper, but that would mean cutting corners on the things that matter most to your success."

---

## Question Mode

### Purpose

Generate strategic questions about text to clarify understanding, challenge assumptions, explore new angles, or drive conversions.

### Controls

#### 1. Question Type (4 options)

Defines the intent behind the questions:

| Option | Description | Prompt Instruction |
|--------|-------------|-------------------|
| **Clarify** | Clarifying questions to better understand the text | "clarifying questions to better understand the text" |
| **Challenge** | Challenging questions that push back or probe deeper | "challenging questions that push back or probe deeper" |
| **Explore** | Exploratory questions that open up new angles | "exploratory questions that open up new angles" |
| **Convert** | Conversion-focused questions that drive action or decisions | "conversion-focused questions that drive action or decisions" |

**Default:** Clarify

**Use Cases:**
- **Clarify**: Understanding requirements, gathering context, requirements gathering
- **Challenge**: Critical thinking, testing assumptions, devil's advocate analysis
- **Explore**: Brainstorming, discovering opportunities, creative expansion
- **Convert**: Sales conversations, decision-making, overcoming objections

#### 2. Count (3 options)

Number of questions to generate:

| Option | Count |
|--------|-------|
| **1** | Generate 1 question |
| **3** | Generate 3 questions |
| **5** | Generate 5 questions |

**Default:** 3

#### 3. Directness (2 options)

Controls the approach style:

| Option | Description | Prompt Instruction |
|--------|-------------|-------------------|
| **Soft** | Ask in a soft, gentle way | "Ask in a soft, gentle way" |
| **Direct** | Ask in a direct, straightforward way | "Ask in a direct, straightforward way" |

**Default:** Soft

**When to use each:**
- **Soft**: Early relationships, sensitive topics, diplomatic situations
- **Direct**: Established relationships, time-sensitive decisions, cutting through ambiguity

### Question Mode Output Structure

```json
{
  "questions": [
    "Question 1",
    "Question 2",
    "Question 3"
  ]
}
```

**Note:** The number of questions returned matches your selected count (1, 3, or 5).

### Example Question Workflow

**User Input:**
```
We need to redesign our website because it looks outdated and conversion rates are low.
```

**Settings:**
- Type: Challenge
- Count: 3
- Directness: Direct

**Generated Output:**

**Questions:**
1. "How do you know the design is the problem versus the messaging, pricing, or product-market fit?"
2. "What specific conversion metrics are you tracking, and have you identified where users drop off in the funnel?"
3. "Before investing in a redesign, have you tested simple changes like headlines, CTAs, or page load speed?"

---

## AI Processing Pipeline

### Model Selection

Copy Snap uses an **intelligent fallback system** with two models:

#### Primary Model: DeepSeek V3 (deepseek-chat)

**Why DeepSeek First:**
- Ultra-fast response times (typically 3-8 seconds)
- Extremely cost-effective (5-10x cheaper than GPT)
- High-quality outputs for most use cases
- Excellent JSON formatting compliance

**Configuration:**
- Model: `deepseek-chat`
- Temperature: 0.7 (balanced creativity/consistency)
- Max tokens: 4000

#### Fallback Model: GPT-4o (gpt-4o)

**When Fallback Triggers:**
- DeepSeek API errors or timeouts
- Invalid JSON responses from DeepSeek
- Network connectivity issues to DeepSeek
- Parse errors from DeepSeek output

**Why GPT-4o as Fallback:**
- Rock-solid reliability
- Superior JSON compliance
- High-quality output consistency
- Industry-standard performance

**User Experience:**
- Automatic fallback (no manual intervention)
- Small blue notification banner appears when fallback is used
- Shows which model generated the output
- Transparent operation for troubleshooting

### Fallback Logic Flow

```
1. User clicks Generate
2. System attempts DeepSeek V3
3. DeepSeek returns response
4. System validates JSON
5. If valid → Display output (DeepSeek used)
6. If invalid/error → Automatically retry with GPT-4o
7. GPT-4o returns response
8. System validates JSON
9. Display output with fallback notification
10. Track actual model used for billing
```

### Cost Implications

> **Note:** Pricing numbers below are estimates based on current provider rates as of January 2026 and may change. CopyZap's credit system reflects actual costs. Users are always charged for the actual model used (DeepSeek or GPT-4o).

**DeepSeek V3 (Primary):**
- Input: ~$0.14 per 1M tokens (est.)
- Output: ~$0.28 per 1M tokens (est.)
- Typical generation: 150-500 tokens = **~0.15-0.5 credits**

**GPT-4o (Fallback):**
- Input: ~$2.50 per 1M tokens (est.)
- Output: ~$10.00 per 1M tokens (est.)
- Typical generation: 150-500 tokens = **~0.75-2.5 credits**

**Cost Efficiency:**
- 95%+ requests use DeepSeek (significantly cheaper)
- ~5% requests fall back to GPT-4o (more expensive, but rare)
- Average cost remains very low
- Credits charged reflect the actual model used
- Users always know which model was used via transparent notifications

### Prompt Construction

Every generation creates two messages:

#### 1. System Message

Sets the context and output format:

```
You are CopySnap, an AI assistant that helps improve, answer, or ask questions
about text. Always respond in the same language as the user's input text. If the
input is mixed-language, use the dominant language. If language is unclear,
default to English. Keep outputs concise and actionable.

[Mode-specific instructions based on selected controls]

Return ONLY valid JSON with this exact structure:
[Mode-specific JSON schema]

Do NOT add markdown formatting, code blocks, or explanations. Just raw JSON.

[If provided] Additional Instructions: [Special Instructions]
```

#### 2. User Message

Contains the input text:

```
[Mode-specific label]:

[User's input text]
```

### JSON Response Parsing

The system handles multiple response formats with robust error recovery:

#### Parsing Strategies (in order):

1. **Raw JSON** - Direct parsing of response
2. **Markdown code blocks** - Extracts from ```json blocks
3. **Generic code blocks** - Extracts from ``` blocks
4. **Fallback model retry** - If DeepSeek fails, automatically try GPT-4o
5. **Parse error recovery** - If both models produce unparseable output

#### Parse Error Recovery System

When both DeepSeek and GPT-4o fail to produce valid JSON:

**User-Friendly Fallback Display:**
- Raw output is shown in a styled card
- Clear explanation: "Couldn't parse the AI response, but here's the raw output"
- "Copy Raw Output" button to extract content
- "Retry" button to regenerate with one click
- No data loss - users always get something useful

**Benefits:**
- Graceful degradation (never shows technical errors)
- Users can still use the content even if JSON parsing fails
- One-click retry for quick recovery
- Maintains user trust and workflow continuity

**Visual Indicators:**
- Yellow/amber warning color for parse errors
- Clear messaging about what happened
- Action buttons for next steps

### Token Tracking

Every generation automatically tracks:
- **Prompt tokens** (input)
- **Completion tokens** (output)
- **Model used** (either `deepseek-chat` or `gpt-4o` - whichever actually generated the output)
- **User ID** (for credit deduction)
- **Feature** (copy-snap)
- **Email** (for admin tracking)

**Accurate Billing:**
- Credits are charged based on the **actual model used**
- DeepSeek usage: Lower credit cost
- GPT-4o fallback usage: Higher credit cost
- Model name is recorded for transparency

This data is stored in the `tokens_used` table and used for:
- Credit balance management (accurate per-model pricing)
- Usage analytics (DeepSeek vs GPT usage patterns)
- Cost tracking (real costs per user)
- User auditing (which model was used when)
- Fallback frequency monitoring

---

## Output System

### Display Structure

All modes show a card-based output layout:

#### Primary Display: "Best Output"

- Large, prominent display
- Copy button in header
- Formatted text with proper spacing
- For Question mode: Numbered list (1. 2. 3.)

#### Secondary Display: "Alternatives"

- Collapsible section (starts collapsed)
- Shows count: "Alternatives (2)"
- Each alternative in its own card
- Only shown for Improve and Answer modes

#### Tertiary Display: "Tips" (Improve mode only)

- Collapsible section (starts collapsed)
- Shows count: "Tips (3)"
- Bulleted list format
- Expert guidance on improvements made

### Copy to Clipboard

One-click copying with visual feedback:

1. Click "Copy" button on any output
2. Toast notification: "Copied ✅" appears
3. Immediate clipboard access
4. Works on all outputs and alternatives

**What gets copied:**

**Best Output:**
- Single copy button in header
- Copies main result text
- Most commonly used action

**Alternatives (Improve & Answer modes):**
- Each alternative has its own copy button
- Located in top-right corner of each card
- Copies that specific alternative only
- No need to select text manually

**Questions (Question mode):**
- "Copy all questions" button below the numbered list
- Copies all questions joined with double line breaks
- Ready to paste into calls, emails, or notes
- Preserves numbered format with clean spacing

**Mobile Optimization:**
- Large tap targets (14px+ icons)
- Positioned for easy thumb access
- Works reliably on all devices
- No accidental taps on neighboring elements

---

## User Actions

### Input Management

#### Clear Input
- Button appears when input has content
- Clears both input AND special instructions
- Also clears any generated output
- Resets the form to empty state

#### Replace Input
- Available on any generated output
- Replaces input field with the output text
- Clears the output display
- Allows iterative refinement (improve the improvement)

**Iterative Workflow:**
```
1. Paste "ok copy" → Generate → Get "good copy"
2. Replace Input (now input = "good copy")
3. Change settings, Generate → Get "great copy"
4. Replace Input (now input = "great copy")
5. Continue refining until perfect
```

### Output Actions

#### Regenerate
- Runs generation again with same settings
- Useful if output wasn't quite right
- Same token cost as initial generation
- Randomness from AI may produce different results

#### Copy Best Output
- Copies the primary result to clipboard
- Most common action users take

#### View Alternatives
- Expand collapsible section
- Compare different approaches
- Each alternative copyable independently

#### View Tips (Improve mode)
- Expand to see expert guidance
- Learn why changes were made
- Improve your own copywriting skills

---

## Technical Implementation

### State Management

Copy Snap uses React hooks for all state:

```typescript
// Input state
const [input, setInput] = useState('');
const [specialInstructions, setSpecialInstructions] = useState('');
const [mode, setMode] = useState<CopySnapMode>('improve');

// Mode-specific controls (change based on mode)
const [improveGoal, setImproveGoal] = useState<ImproveGoal>('clearer');
const [improvePlatform, setImprovePlatform] = useState<ImprovePlatform>('general');
const [improveLength, setImproveLength] = useState<ImproveLength>('same');

const [answerStyle, setAnswerStyle] = useState<AnswerStyle>('helpful');
const [answerStance, setAnswerStance] = useState<AnswerStance>('neutral');
const [answerLength, setAnswerLength] = useState<AnswerLength>('short');

const [questionType, setQuestionType] = useState<QuestionType>('clarify');
const [questionCount, setQuestionCount] = useState<QuestionCount>(3);
const [questionDirectness, setQuestionDirectness] = useState<QuestionDirectness>('soft');

// Generation state
const [isGenerating, setIsGenerating] = useState(false);
const [output, setOutput] = useState<ImproveOutput | AnswerOutput | QuestionOutput | null>(null);
const [copySuccess, setCopySuccess] = useState(false);
```

### Dynamic UI Rendering

Controls section uses conditional rendering:

```typescript
{mode === 'improve' && (
  // Show improve controls
)}

{mode === 'answer' && (
  // Show answer controls
)}

{mode === 'question' && (
  // Show question controls
)}
```

This creates a **single-page app feel** without navigation.

### API Request Flow

```typescript
const handleGenerate = async () => {
  setIsGenerating(true);
  setOutput(null);
  setUsedFallback(false);

  try {
    // 1. Build prompt based on current mode and settings
    const { system, user } = buildPrompt();

    // 2. Format messages for API
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: user }
    ];

    let response;
    let modelUsed = 'deepseek-chat';
    let parseError = false;

    // 3. Try DeepSeek first
    try {
      response = await makeApiRequest(
        'deepseek-chat',
        messages,
        0.7,          // temperature
        4000,         // max tokens
        undefined,    // no session
        currentUser?.email
      );

      // Validate JSON parsing
      const content = response.choices[0]?.message?.content || '';
      parseOutput(content); // Throws if invalid JSON

    } catch (deepseekError) {
      // 4. DeepSeek failed - try GPT-4o fallback
      console.log('DeepSeek failed, falling back to GPT-4o:', deepseekError);

      response = await makeApiRequest(
        'gpt-4o',
        messages,
        0.7,
        4000,
        undefined,
        currentUser?.email
      );

      modelUsed = 'gpt-4o';
      setUsedFallback(true); // Show fallback notification
    }

    // 5. Track token usage with ACTUAL model used
    await trackTokenUsage(
      response.usage?.prompt_tokens || 0,
      response.usage?.completion_tokens || 0,
      modelUsed, // Record which model actually generated this
      currentUser.id,
      currentUser.email,
      undefined,
      'copy-snap'
    );

    // 6. Parse JSON response
    const content = response.choices[0]?.message?.content || '';
    let parsed;

    try {
      parsed = parseOutput(content);
    } catch (parseError) {
      // Both models failed to produce valid JSON
      // Show raw output with recovery options
      setRawOutput(content);
      setParseError(true);
      return;
    }

    // 7. Update UI with output
    setOutput(parsed);
    setModelUsed(modelUsed);
    toast.success('Generated successfully!');

  } catch (error) {
    toast.error(error.message || 'Generation failed');
  } finally {
    setIsGenerating(false);
  }
};
```

**Key Changes from v1.0:**
1. **Two-stage attempt**: Try DeepSeek, then GPT on failure
2. **JSON validation**: Check parsing before accepting response
3. **Fallback tracking**: Record which model was actually used
4. **Parse error recovery**: Show raw output if both fail
5. **User notification**: Display blue banner when fallback used
6. **Accurate billing**: Credits charged based on actual model

### Mobile Optimization

Copy Snap is fully mobile-responsive:

#### Sticky Generate Button
- Fixed to bottom of screen
- Full width with padding
- Touch-optimized (44px min height)
- Visible at all times while scrolling

#### Responsive Controls
- Button grids that wrap on small screens
- Touch-friendly button sizes (py-2 px-4)
- Proper spacing for thumb-friendly tapping

#### Safe Area Handling
- `safe-area-inset-bottom` class on sticky button
- Ensures button visible above iOS home indicator

#### Text Input
- Large text areas (160px min height for input)
- 80px for special instructions
- Proper font sizing (text-base)
- Auto-resize capability (resize-y)

---

## Special Instructions Field

### Purpose

Allows users to add custom guidance that wouldn't fit into the standard controls.

### When to Use

- **Specific tone requirements**: "Sound like Elon Musk"
- **Industry terminology**: "Use fintech jargon"
- **Brand guidelines**: "Avoid words like 'innovative' and 'synergy'"
- **Cultural considerations**: "Use British English spelling"
- **Audience targeting**: "Write for C-suite executives"
- **Legal/compliance**: "Include required disclaimers"

### How It's Applied

The special instructions are appended to the system prompt:

```
[All standard instructions]

Additional Instructions: [User's special instructions]
```

This ensures the AI considers them **alongside** (not instead of) the mode controls.

### Example

**Standard Settings:**
- Mode: Improve
- Goal: Persuasive
- Platform: LinkedIn
- Length: Same

**Special Instructions:**
```
Write from the perspective of a data scientist. Use statistics and research findings
to support claims. Target audience is VP-level decision makers at Fortune 500 companies.
```

This creates output that combines platform optimization (LinkedIn), persuasive goal, AND the specific perspective/audience requirements.

---

## Language-Aware Output

### Automatic Language Detection

Copy Snap automatically detects the language of your input text and responds in **the same language**. This is a core feature that ensures natural, native-language outputs.

**How it works:**
1. When you paste text and click Generate
2. System detects the dominant language in your input
3. AI is instructed to respond in that exact language
4. All output sections (best, alternatives, notes, questions) are in the detected language

**Supported Languages:**
- English, Spanish, French, German, Italian, Portuguese
- Chinese, Japanese, Korean
- Dutch, Polish, Russian, Turkish
- Arabic, Hindi, and many more

**Mixed-Language Behavior:**
- If input contains multiple languages → follows the **dominant language**
- If language is unclear → defaults to **English**

**Examples:**

**Spanish Input:**
```
Necesito mejorar este texto para LinkedIn
```
**Output (in Spanish):**
```json
{
  "best": "Necesito optimizar este contenido profesional para LinkedIn",
  "alternatives": [...in Spanish...],
  "notes": [...in Spanish...]
}
```

**French Input:**
```
Comment répondre à ce message de manière professionnelle?
```
**Output (in French):**
```json
{
  "best": "Merci pour votre message. Je serais ravi d'en discuter...",
  "alternatives": [...in French...]
}
```

### Benefits

**Global Accessibility:**
- Works for international teams
- No need to translate input or output
- Native-language fluency in results

**Natural Expression:**
- Uses idiomatic expressions for each language
- Avoids literal translations
- Respects cultural communication norms

**Consistent Behavior:**
- Language detection is automatic
- No settings to configure
- Works across all three modes (Improve, Answer, Question)

---

## Human Tone Mode

### Purpose

Makes AI output sound more **natural, conversational, and human** - ideal for social media posts where authenticity matters more than polish.

### When to Use Human Tone

**Enable when:**
- Writing for X (Twitter), LinkedIn personal posts, or social platforms
- You want to sound like a real person, not a brand
- Authenticity and credibility matter more than perfection
- Your audience values natural, unpolished communication

**Keep disabled when:**
- Writing formal business communications
- Creating marketing copy that needs polish
- Professional emails or official announcements
- Brand-voice consistency is critical

### How to Enable

Simple checkbox control located below Special Instructions:

```
☐ Human tone
Make output sound more natural and social-native (less AI-polished)
```

**Default:** OFF (standard AI output)

### What Changes When Enabled

The AI follows additional instructions to:
- Sound like a real person writing, not marketing copy
- Use natural sentence rhythm (mix of short and medium sentences)
- Prefer concrete, specific language over abstractions
- Avoid buzzwords, clichés, and AI-style filler
- Allow mild imperfection when it feels natural
- Skip exaggerated enthusiasm and hype

**Phrases to Avoid (when Human Tone is ON):**
- "In today's fast-paced world"
- "It's important to note"
- "Unlock the power of"
- "Leverage", "synergy", "game-changing" (unless truly natural)

### Platform-Specific Behavior

**For X (Twitter):**
- Concise, conversational, scroll-stopping
- Written like a real person tweeting

**For LinkedIn:**
- Professional but personal
- Clear opinions without corporate fluff

**For Email:**
- Natural and direct
- Written like a real human message

### Examples

**Standard Output (Human Tone OFF):**
```
Excited to announce our innovative new product launch! We've leveraged cutting-edge
technology to deliver game-changing solutions that unlock unprecedented value for
our customers. Join us on this transformative journey!
```

**Human Tone Output (Human Tone ON):**
```
We just launched something new. It solves a real problem: teams waste hours on
manual work that should be automated. We built the tool we wished existed.
Early users are saying it's saved them 10+ hours/week.
```

### Technical Implementation

When Human Tone is enabled, the system appends comprehensive human-tone instructions to the AI prompt. These instructions:
- Apply to all modes (Improve, Answer, Question)
- Work with all language outputs (not just English)
- Use natural expressions for the detected language (no literal translations)
- Combine with other settings (platform, style, etc.)

### Use Cases

**Personal Brand Building:**
- LinkedIn thought leadership
- X (Twitter) commentary
- Newsletter content

**Community Management:**
- Responding to comments authentically
- Social media engagement
- Customer conversations

**Content Marketing:**
- Behind-the-scenes posts
- Founder stories
- Human-centric brand content

---

## Workflow Patterns

### Pattern 1: Quick Polish

**Goal:** Fix a draft quickly before sending

1. Paste draft → Mode: Improve → Goal: Clearer → Generate
2. If good: Copy and send
3. If not quite right: Regenerate or try different goal

**Time:** 10-30 seconds

---

### Pattern 2: Reply Generator

**Goal:** Respond to comments/messages consistently

1. Paste incoming message → Mode: Answer
2. Select style based on relationship (Friendly/Professional/Witty)
3. Select stance based on agreement (Neutral/Agree/Disagree)
4. Generate → Copy best output → Send

**Time:** 15-45 seconds

---

### Pattern 3: Iterative Refinement

**Goal:** Start rough, end polished

1. Type rough idea → Mode: Improve → Goal: Clearer → Generate
2. **Replace Input** with output
3. Change Goal to "Persuasive" → Generate
4. **Replace Input** with output
5. Change Platform to "X" → Generate
6. Final output is 3x refined

**Time:** 1-2 minutes

---

### Pattern 4: Question-Driven Sales

**Goal:** Move prospect through objections

1. Paste prospect's concern → Mode: Question
2. Type: "Challenge" → Count: 3 → Directness: Direct
3. Generate questions that reveal assumptions
4. Use questions in sales call
5. Paste their answers → Mode: Answer → Style: Confident
6. Generate strategic responses

**Time:** 2-3 minutes per cycle

---

### Pattern 5: Content Exploration

**Goal:** Discover new angles for content

1. Paste initial content idea → Mode: Question
2. Type: "Explore" → Count: 5 → Directness: Soft
3. Generate exploratory questions
4. Pick most interesting question → Paste as new input
5. Mode: Answer → Length: Long → Generate
6. Now you have expanded content from new angle

**Time:** 3-5 minutes

---

## Performance Characteristics

### Speed

**DeepSeek V3 (Primary - 95%+ of requests):**
- **API call**: 3-8 seconds average
- **Total time**: 4-9 seconds (including UI updates)

**GPT-4o (Fallback - ~5% of requests):**
- **API call**: 4-10 seconds average
- **Total time**: 5-11 seconds (including UI updates)

**Regenerate**: Same speed as initial generation (tries DeepSeek first again)

### Cost (in credits)

**DeepSeek V3 (Primary):**
- **Average prompt**: 100-200 tokens
- **Average completion**: 150-400 tokens
- **Cost per generation**: **0.15-0.5 credits** (very affordable)

**GPT-4o (Fallback):**
- **Average prompt**: 100-200 tokens
- **Average completion**: 150-400 tokens
- **Cost per generation**: **0.75-2.5 credits** (5x more expensive)

**Expected Average:**
- With 95% DeepSeek / 5% GPT usage
- **Average cost per generation**: ~0.2-0.6 credits
- Still extremely cost-effective overall

### Reliability

**Fallback system:** Multi-layered reliability
- **Layer 1**: DeepSeek V3 (primary attempt)
- **Layer 2**: GPT-4o (automatic fallback)
- **Layer 3**: Raw output display (if both produce invalid JSON)
- **Result**: ~99.9% success rate

**JSON parsing**: Handles multiple formats gracefully
- Raw JSON
- Markdown code blocks
- Generic code blocks
- Fallback model retry
- Raw output recovery

**Error messages**: User-friendly, actionable
- Clear notifications when fallback is used
- Helpful parse error explanations
- Always provides path forward (retry, copy raw output)

**Uptime considerations:**
- DeepSeek outages → automatic GPT failover
- GPT outages → unlikely during DeepSeek success
- Both down simultaneously → extremely rare
- Parse errors → raw output always accessible

---

## Fallback Notification System

When GPT-4o is used as a fallback, users see a non-intrusive notification:

### Visual Design

**Banner Appearance:**
- Small, compact banner above the output
- Light blue background (`bg-blue-50`)
- Blue border and icon
- Dismissible with X button
- Does not block content

**Message Content:**
```
ℹ️ Used GPT-4o (fallback)

DeepSeek was unavailable, so we generated this with GPT-4o.
```

**Note:** The message is factual and transparent without making quality claims. Users can judge output quality themselves.

### User Benefits

**Transparency:**
- Users know exactly which model was used
- No hidden surprises in billing
- Builds trust through openness

**Education:**
- Helps users understand the system
- Shows the reliability mechanisms in place
- Demonstrates value of multi-model approach

**Troubleshooting:**
- If output quality differs, users know why
- Can report issues with specific model
- Helps with debugging edge cases

### Implementation

```typescript
{usedFallback && (
  <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start justify-between">
    <div className="flex items-start gap-2">
      <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-blue-900">
          Used GPT-4o (fallback)
        </p>
        <p className="text-xs text-blue-700 mt-1">
          DeepSeek was unavailable, so we generated this with GPT-4o.
        </p>
      </div>
    </div>
    <button
      onClick={() => setUsedFallback(false)}
      className="text-blue-400 hover:text-blue-600"
    >
      <X className="w-4 h-4" />
    </button>
  </div>
)}
```

---

## Comparison: Copy Snap vs Copy Maker

| Feature | Copy Snap | Copy Maker |
|---------|-----------|------------|
| **Purpose** | Quick transformations | Comprehensive copy generation |
| **Input** | Single text field | Multi-field forms |
| **Templates** | No templates | 60+ templates |
| **Customization** | 3 modes × controls | Unlimited via templates |
| **Speed** | 3-6 seconds | 10-30 seconds |
| **Output** | Best + 2 alternatives | Single comprehensive output |
| **Iteration** | Replace input workflow | Save/load templates |
| **Use Case** | Quick fixes, replies | Full campaigns, blog posts |
| **Learning Curve** | Instant | Moderate |
| **Mobile UX** | Optimized | Functional but dense |

**When to use Copy Snap:**
- Quick edits to existing copy
- Replying to messages/comments
- Generating questions for calls
- Iterative refinement loops
- On-the-go mobile usage

**When to use Copy Maker:**
- Creating copy from scratch
- Multi-section content (blogs, landing pages)
- Brand voice consistency
- Complex workflows
- Template-based repetitive tasks

---

## Future Enhancement Opportunities

### Potential Additions

1. **Favorite outputs** - Save best results for later
2. **History** - See previous generations
3. **Bulk mode** - Improve multiple texts at once
4. **Custom presets** - Save your most-used control combinations
5. **Compare outputs** - Side-by-side comparison of alternatives
6. **Manual model selection** - Let users choose DeepSeek or GPT upfront (currently automatic)
7. **Additional fallback models** - Add Claude as tertiary fallback
8. **Export formats** - Download as TXT, MD, or copy to Notion
9. **Voice input** - Speak your text instead of typing
10. **Screenshot input** - Extract text from images
11. **Keyboard shortcuts** - Cmd+Enter to generate
12. **Fallback preferences** - Let users choose fallback behavior (always try both, DeepSeek only, etc.)
13. **Quality comparison** - A/B test outputs from different models
14. **Model performance dashboard** - Show users their DeepSeek vs GPT usage stats

### Architecture Considerations

**Why Copy Snap is separate from Copy Maker:**

1. **Performance**: Lightweight, fast-loading page
2. **Focus**: No distractions, single-purpose UI
3. **Mobile**: Optimized for touch, small screens
4. **Mental model**: Different user intent (quick vs comprehensive)
5. **Future flexibility**: Can evolve independently

**Why the dual-model approach:**

1. **Cost optimization**: DeepSeek is 5-10x cheaper for 95%+ of requests
2. **Reliability**: GPT fallback ensures ~99.9% success rate
3. **Quality**: Both models produce excellent outputs
4. **Transparency**: Users always know which model was used
5. **Flexibility**: Easy to add more models in the future

---

## Parse Error Recovery UI

When both DeepSeek and GPT-4o produce unparseable JSON, the system shows a recovery interface:

### Recovery Card Display

**Visual Design:**
- Amber/yellow warning card (`bg-amber-50`, `border-amber-200`)
- Warning icon to indicate non-standard output
- Clear heading: "Parse recovery"
- Friendly explanation: "Could not parse the AI response. Here's the raw output:"
- Professional, calm tone (not alarming)

**Content Display:**
- Raw AI output shown in readable format
- Pre-formatted text block with proper spacing
- Scrollable if content is long
- Maintains original formatting from AI

### Action Buttons

**Copy raw output:**
- Primary action button (lowercase for consistency)
- Copies entire raw output to clipboard
- Success feedback: "Copied ✅" toast
- Users can paste into their own editor and extract useful content

**Retry:**
- Secondary action button
- Re-runs generation with same settings
- Tries DeepSeek first again (fresh attempt may succeed)
- Quick recovery path for transient issues
- Same familiar retry flow as Regenerate

### Example Recovery Flow

```
User: Generates Copy Snap output
System: DeepSeek returns malformed JSON → tries GPT-4o
GPT-4o: Also returns malformed JSON (very rare)
System: Shows recovery card with raw output

Raw Output Display:
┌─────────────────────────────────────────┐
│ ⚠️ Parse recovery                       │
│                                          │
│ Could not parse the AI response.        │
│ Here's the raw output:                  │
│                                          │
│ ┌──────────────────────────────────┐  │
│ │ [RAW AI OUTPUT]                   │  │
│ │ This copy is much better because │  │
│ │ it's clear, concise, and...       │  │
│ └──────────────────────────────────┘  │
│                                          │
│ [Copy raw output]  [Retry]             │
└─────────────────────────────────────────┘
```

### User Experience Benefits

**No Dead Ends:**
- Users ALWAYS get something useful
- Even worst-case scenario provides value
- No frustrating "try again" without context

**Transparency:**
- Users understand what happened
- Clear explanation of the issue
- Builds trust through honesty

**Quick Recovery:**
- One-click retry
- One-click copy
- Minimal friction to continue working

**Data Preservation:**
- Raw output is never lost
- Users can manually extract value
- System doesn't hide AI responses

---

## Conclusion

Copy Snap is designed around the principle that **most copy tasks are quick iterations, not blank-slate creations**. By providing three focused modes with intuitive controls, it enables users to transform text in seconds rather than minutes.

### Design Philosophy Summary

**Speed + Intelligence:**
- DeepSeek V3 primary model for ultra-fast, cost-effective generation
- GPT-4o automatic fallback for rock-solid reliability
- ~99.9% success rate with multi-layer error recovery
- Average cost of 0.2-0.6 credits per generation

**Transparency:**
- Users always know which model was used
- Clear fallback notifications
- Accurate billing based on actual model
- No hidden surprises

**Graceful Degradation:**
- Primary attempt → Fallback model → Raw output display
- Users NEVER hit a dead end
- Always get something useful
- One-click recovery paths

**Template-Free Simplicity:**
- No templates by design
- Copy Snap is for text you already have
- Quick polish, replies, and questions
- That's what makes it fast

### Complete Workflow Coverage

Together, Copy Maker (comprehensive) and Copy Snap (fast) provide a complete copywriting workflow:
- **Copy Maker**: Generate comprehensive copy from 60+ templates
- **Copy Snap**: Refine, reply, and question in seconds with dual-model reliability

This two-tool approach serves both strategic planning and tactical execution needs, with Copy Snap's intelligent fallback system ensuring users always get quality results regardless of which AI model is performing better at any given moment.

### Version 2.0 Improvements

This technical guide (v2.0) documents major improvements introduced in January 2026:

**New in v2.0:**
- **Language-aware output** - Automatically detects input language and responds in the same language (not English-only)
- **Human tone mode** - Optional checkbox for natural, social-native writing style (less AI-polished)
- **DeepSeek V3 as primary model** - 5-10x cost savings with ultra-fast response times
- **GPT-4o automatic fallback** - Reliability improvement with transparent notification
- **Enhanced copy buttons** - Individual copy buttons on each alternative, "Copy all questions" for Question mode
- **Parse error recovery UI** - Amber-styled recovery card with "Copy raw output" and "Retry" actions
- **Accurate per-model billing** - Tracks actual model used (DeepSeek or GPT-4o) for transparent credit tracking
- **Dismissible fallback banner** - Clean, factual notification when fallback occurs
- **Mobile-optimized copy actions** - Large tap targets, thumb-friendly positioning

**Result:** Copy Snap v2.0 is faster, cheaper, more accessible (multi-language), more flexible (human tone), AND more reliable than v1.0, while maintaining the same simple, focused user experience.

**Breaking Changes:** None - all new features are additive and backward-compatible.
