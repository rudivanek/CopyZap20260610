# CopyZap - Special Instructions Field - DEEP DIVE

## Overview

**Special Instructions** is CopyZap's most powerful and flexible feature - a free-form text field that appends directly to your AI prompt, providing unlimited customization capability beyond standard form fields.

**Why It's the "Power Feature":**
- No predefined options limit you
- Direct control over AI behavior
- Handles edge cases standard fields can't address
- Combines multiple specific requirements
- Enables experimental approaches
- Achieves exact client specifications

### Smart/Expert Mode Behavior

In **Smart Mode**, Special Instructions appear as a collapsed field with a short preview and "+ Expand" button.

In **Expert Mode**, it's fully expanded and editable, allowing multi-line instructions and advanced prompt layering.

---

## What Special Instructions Does

### Direct Prompt Inclusion

Unlike other fields that get interpreted and transformed, Special Instructions text is appended almost verbatim to your prompt. This means:

**You write:**
```
"Use Vienna slang. Maximum 3 sentences per paragraph. Bold all product names."
```

**AI receives (in prompt):**
```
Additional Requirements:
- Use Vienna slang
- Maximum 3 sentences per paragraph  
- Bold all product names
```

This direct inclusion gives you precise control over AI behavior.

### When to Use Special Instructions

**Use When:**
- ✅ Standard fields don't cover your need
- ✅ You have unique brand requirements
- ✅ Client has specific style guide rules
- ✅ Cultural/regional adaptations needed
- ✅ Platform has specific constraints
- ✅ Testing experimental approaches
- ✅ Combining multiple specific constraints

**Skip When:**
- ❌ Standard fields already cover it
- ❌ Requirements are generic
- ❌ You're unsure what to add
- ❌ Would duplicate other field values

---

## Special Instructions Categories

### 1. Regional & Cultural Customization

**Purpose:** Adapt content for specific locations and cultures

**Examples:**

> **Note:** In Smart Mode, only the first 200 characters of the instruction are visible to reduce visual clutter.

**Vienna-Specific:**
```
"Use Viennese dialect expressions naturally. Reference local landmarks like
Stephansdom and Ringstraße. Incorporate coffee house culture references.
Use 'Grüß Gott' greeting style in tone."
```

**British English:**
```
"Use British spelling (colour, organisation, realise). Avoid Americanisms.
Reference UK-specific examples. Use 'whilst' instead of 'while'."
```

**Australian Tone:**
```
"Use Australian slang naturally ('mate', 'no worries'). Reference local
culture and work-life balance values. Keep it laid-back but professional."
```

**Canadian Adaptations:**
```
"Use Canadian spelling. Include bilingual consideration (French-Canadian
audience exists). Reference both US and UK influences. Use 'eh' sparingly
for authenticity."
```

**Latin American Spanish:**
```
"Use Latin American Spanish (not Spain Spanish). Avoid vosotros form.
Use 'ustedes'. Include regional expressions common across LatAm."
```

---

### 2. Formatting & Structure Requirements

**Purpose:** Control exact visual presentation

**Examples:**

**Paragraph Length:**
```
"Maximum 3 sentences per paragraph. Each paragraph must be separated by
blank line. No paragraph longer than 50 words."
```

**Sentence Structure:**
```
"Every sentence must be under 15 words. Use simple subject-verb-object
structure. No complex clauses."
```

**List Formatting:**
```
"Use bullet points only, no numbered lists. Each bullet must start with
action verb. Maximum 5 bullets per section."
```

**Emphasis Control:**
```
"Bold all product names and features. Italicize benefits. Use quotes around
customer testimonials. Never use ALL CAPS except acronyms."
```

**Questions Integration:**
```
"Include one question at the end of each section. Questions must be
rhetorical and thought-provoking, not requiring answers."
```

**Emoji Usage:**
```
"Include exactly one relevant emoji at the end of each section. Must be
subtle and professional, not childish. Use sparingly for emphasis only."
```

---

### 3. Brand Voice Specifics

**Purpose:** Achieve exact brand personality match

**Examples:**

**Apple-Style Minimalism:**
```
"Write like Apple - extremely minimalist, aspirational, focus on experience
not specs. Short sentences. Simple words. Emphasize 'how it feels' over
'what it does'. Use 'magical' and 'incredible' sparingly."
```

**Oatly-Style Wit:**
```
"Use Oatly's witty, slightly irreverent tone. Self-aware humor. Break fourth
wall occasionally. Use parentheses for side comments. Be honest about
limitations. Gentle sarcasm is OK."
```

**Mailchimp Friendly:**
```
"Friendly and helpful like Mailchimp. Use 'we' to create partnership feel.
Encouraging without being patronizing. Occasional playfulness but never
at user's expense. Helpful tips integrated naturally."
```

**Patagonia Activism:**
```
"Incorporate environmental consciousness like Patagonia. Mention sustainability
without preaching. Action-oriented environmental language. Authentic, not
greenwashing. Values-first approach."
```

**Nike Motivation:**
```
"Motivational and empowering like Nike. Use second person ('you') directly.
Challenge the reader. Short, punchy statements. Focus on achievement and
overcoming obstacles. 'Just Do It' mentality."
```

---

### 4. Content Constraints & Prohibitions

**Purpose:** Prevent problematic or inappropriate language

**Examples:**

**Competitor Mentions:**
```
"Never mention competitors by name. If comparison needed, use 'other tools'
or 'traditional solutions'. Focus on our strengths, not their weaknesses."
```

**Medical Claims:**
```
"Avoid any medical claims or health promises. Use 'may help' instead of
'will cure'. Reference clinical studies if available. Include 'consult your
doctor' disclaimer where appropriate."
```

**Legal Safety:**
```
"Avoid absolute guarantees. Use 'typically', 'in most cases', 'generally'
instead of 'always' or 'guaranteed'. Include 'results may vary' language."
```

**Superlative Avoidance:**
```
"Never use superlatives: no 'best', 'greatest', 'ultimate', 'perfect',
'revolutionary'. Use specific claims with proof instead. Be factual, not
hyperbolic."
```

**Price Sensitivity:**
```
"Never mention pricing or cost. Focus entirely on value and ROI. If price
comes up naturally, redirect to 'investment' or 'value' language."
```

**Political Neutrality:**
```
"Remain completely politically neutral. Avoid any politically charged language
or cultural war topics. Focus on universal values everyone shares."
```

---

### 5. Stylistic & Rhetorical Techniques

**Purpose:** Use specific writing techniques

**Examples:**

**Rhetorical Questions:**
```
"Use rhetorical questions frequently to engage reader. Each section should
start or end with a question. Questions should highlight pain points or
desired outcomes."
```

**Storytelling Elements:**
```
"Include mini-narratives and scenarios. Use 'Imagine...' to create scenes.
Introduce relatable characters briefly. Create before/after contrasts."
```

**Social Proof Integration:**
```
"Mention customer success naturally throughout. Use 'teams like yours' and
'companies similar to yours' language. Include quantified results where
possible without being salesy."
```

**Data & Statistics:**
```
"Include specific numbers and percentages where relevant. Cite sources for
statistics. Use data to back up claims, not replace emotional connection."
```

**Analogies & Metaphors:**
```
"Use analogies to explain complex concepts. Relate technical features to
everyday experiences. Build extended metaphor comparing product to [specify
metaphor]. Make abstract concrete."
```

**Power Words:**
```
"Use power words for impact: transform, eliminate, instant, proven,
guar anteed (carefully), exclusive. Balance with credible, specific language."
```

---

### 6. Platform-Specific Adaptations

**Purpose:** Optimize for specific platforms

**Examples:**

**LinkedIn Professional:**
```
"Write for LinkedIn audience - professional but not stuffy. Focus on business
value and ROI. Use industry terminology correctly. Mention job titles and
roles. Emphasize professional development angle."
```

**Instagram Casual:**
```
"Instagram-appropriate: conversational, visual language ('imagine', 'picture
this'). Emoji-friendly. Short paragraphs for mobile. Include natural hashtag
suggestions at end. Stories-style language."
```

**Email Newsletter:**
```
"Newsletter format: personal greeting style. Use 'you' and 'I'. Scannable
sections with clear headers. Include actionable tips. End with clear next
step. Keep paragraphs very short for email readers."
```

**Print Magazine:**
```
"Written for print - longer paragraphs OK. More literary style. No URLs or
web-specific language. Assume reader has time to read deeply. Include
sidebar-worthy information."
```

**Video Script:**
```
"Write for spoken word, not reading. Short sentences that breathe naturally.
No complex subordinate clauses. Include pause suggestions. Conversational
fillers OK ('you know', 'right?'). Time stamps for sections."
```

---

### 7. Edge Cases & Experimental

**Purpose:** Handle unusual or creative requirements

**Examples:**

**Rhyming Copy:**
```
"Make it rhyme like Dr. Seuss. Playful, bouncy rhythm. Simple rhyme scheme
(AABB). Memorable and fun. Perfect for child-focused or playful brands."
```

**Alliteration Heavy:**
```
"Use alliteration frequently for memorability. Each section heading should
alliterate. Product benefits should use alliterative phrases where natural."
```

**Film Noir Style:**
```
"Write in film noir detective style. Cynical but clever. Short, punchy
sentences. Metaphors about darkness and light. 'It was a dark and stormy
market' vibe. Play with the style without being cheesy."
```

**Shakespearean Elevated:**
```
"Elevate language to Shakespearean level. Use 'thou', 'whence', 'hither'
appropriately. Maintain clarity despite archaic language. Make it feel noble
and timeless, not confusing."
```

**80s Pop Culture:**
```
"Reference 80s culture naturally - music, movies, technology. Use phrases
like 'totally rad' sparingly. Appeal to nostalgia without being try-hard.
Balance retro with modern relevance."
```

---

### 8. Compliance & Legal Requirements

**Purpose:** Meet regulatory or legal standards

**Examples:**

**FDA Compliance:**
```
"Follow FDA guidelines for health product claims. Use 'supports' not 'cures'.
Include required disclaimers. Avoid disease claims. Reference studies
appropriately with asterisks for footnotes."
```

**GDPR Language:**
```
"Include GDPR-compliant language about data handling. Mention user control
over data. Include 'we never sell your data' if true. Reference privacy
policy naturally."
```

**Financial Disclosure:**
```
"Include 'past performance doesn't guarantee future results' language.
Use 'potential' not 'promised'. Reference risk appropriately. Comply with
financial advertising regulations."
```

**ADA Accessibility:**
```
"Write with screen readers in mind. Avoid relying on visual-only information.
Describe images that would accompany text. Use clear, descriptive link text
(not 'click here')."
```

---

### 9. SEO & Technical Requirements

**Purpose:** Optimize for search and technical constraints

**Examples:**

**Keyword Density:**
```
"Naturally integrate focus keyword 'project management software' exactly
5 times. Use variations 'PM tool', 'project tracker' 3-4 times each. Front-load
keyword in first paragraph."
```

**Internal Linking:**
```
"Suggest 3-4 places for internal links to other pages. Use natural anchor
text that includes relevant keywords. Indicate suggested link targets in
[brackets] within copy."
```

**Schema Markup:**
```
"Structure content to support FAQ schema markup. Format questions and answers
clearly. Include at least 5 Q&A pairs. Make answers comprehensive (50+ words
each)."
```

**Mobile-First:**
```
"Write for mobile screens first. Very short paragraphs (2-3 sentences max).
No horizontal scrolling needed. Thumb-friendly scanability. Key info in
first few lines."
```

---

### 10. Tone Refinement & Nuance

**Purpose:** Fine-tune beyond standard tone options

**Examples:**

**Warm Professional:**
```
"Professional but warm - like a trusted advisor, not a cold corporation.
Use 'we're here to help' language. Empathetic without being overly familiar.
Competent and caring simultaneously."
```

**Confident Without Arrogant:**
```
"Confident in capabilities but never arrogant. Use 'we know' but also
'we're always learning'. Strong claims backed by proof. Humble confidence."
```

**Urgent Without Pushy:**
```
"Create urgency through opportunity cost, not false scarcity. 'Don't miss
out' not 'Only 2 left!'. Natural deadlines only. Urgency from value, not
manipulation."
```

**Playful Yet Professional:**
```
"Inject personality and playfulness while maintaining professional standards.
Subtle humor OK. Puns if they're actually good. Never jokes at customer
expense. Fun but trustworthy."
```

---

## How to Write Effective Special Instructions

### Best Practices

**1. Be Specific, Not Vague:**

❌ **Vague:**
```
"Make it punchy"
```

✅ **Specific:**
```
"Use sentences under 15 words. Start paragraphs with strong action verbs.
End sections with clear takeaways."
```

**2. Give Examples When Possible:**

❌ **Abstract:**
```
"Use local expressions"
```

✅ **With Examples:**
```
"Use Vienna expressions like 'leiwand' (cool), 'oida' (dude), 'ur' (very).
Reference 'Würstelstand' culture and 'Gemütlichkeit' values."
```

**3. Prioritize Most Important Rules:**

❌ **Too Many:**
```
[15 different instructions that conflict or overwhelm]
```

✅ **Focused:**
```
"Top 3 priorities: 1) Maximum 3 sentences per paragraph, 2) Bold all product
names, 3) Include question in each section"
```

**4. Explain Why When Relevant:**

❌ **Command Only:**
```
"Don't use idioms"
```

✅ **With Context:**
```
"Avoid idioms - our audience includes non-native English speakers who may
not understand expressions like 'think outside the box'"
```

**5. Use Clear Formatting:**

❌ **Wall of Text:**
```
Use short sentences and avoid jargon and bold product names and include questions
```

✅ **Clear Format:**
```
- Use short sentences (under 15 words)
- Avoid jargon completely  
- Bold all product names
- Include question in each section
```

---

## Combining Multiple Instructions

### Layering Technique

**Level 1: Core Style**
```
"Write in friendly, conversational tone like chatting with a colleague."
```

**Level 2: Add Structure**
```
"Write in friendly, conversational tone like chatting with a colleague.
Maximum 3 sentences per paragraph. Use bullet points for lists of benefits."
```

**Level 3: Add Constraints**
```
"Write in friendly, conversational tone like chatting with a colleague.
Maximum 3 sentences per paragraph. Use bullet points for lists of benefits.
Avoid technical jargon. Never use superlatives like 'best' or 'greatest'."
```

**Level 4: Add Regional Flavor**
```
"Write in friendly, conversational tone like chatting with a colleague.
Maximum 3 sentences per paragraph. Use bullet points for lists of benefits.
Avoid technical jargon. Never use superlatives like 'best' or 'greatest'.
Use British spelling and reference UK business culture naturally."
```

### Example: Complete Special Instructions

**For Vienna SaaS Company:**
```
Tone & Voice:
- Friendly professional - like a smart colleague, not a corporation
- Inject subtle Viennese cultural references naturally
- Use 'Gemütlich' approach - efficiency with warmth

Formatting:
- Maximum 3 sentences per paragraph
- Bold all product names and features
- Include one thought-provoking question per section

Language:
- Use British English spelling
- Avoid American idioms  
- No jargon - our audience includes non-technical users
- Use 'we' language to create partnership feel

Content Requirements:
- Never mention competitors by name
- Focus on time-saving benefits over features
- Include specific metrics where possible (hours saved, etc.)
- End with clear, low-pressure call to action

Cultural Notes:
- Reference Vienna work-life balance values
- Mention coffee culture subtly if natural
- Acknowledge European GDPR consciousness  
```

---

## Special Instructions + Other Fields

### How They Interact

**Special Instructions Enhances:**
- Takes Tone field and adds nuance
- Takes Output Structure and adds formatting rules
- Takes Brand Values and adds specific applications
- Takes Keywords and adds integration rules

**Special Instructions Overrides:**
- Can contradict Tone if you want exception
- Can modify Output Structure presentation
- Can add constraints beyond Language Style options

**Example Interaction:**

**Tone Field:** "Friendly"
**Special Instructions:** "Friendly but with British reserve - warm but not overly familiar"

**Result:** Refined friendly tone with cultural adaptation

---

## Common Use Cases

### Use Case 1: International Client

**Scenario:** German client wants English copy with German sensibilities

**Special Instructions:**
```
"Write in English but with German business culture in mind: more formal than
American style, value precision and thoroughness over flashy claims. Use
'Sie' equivalent formality. Reference European examples and standards, not
US ones. Include engineering/quality focus typical of German brands."
```

### Use Case 2: Highly Regulated Industry

**Scenario:** Healthcare product with FDA constraints

**Special Instructions:**
```
"FDA-compliant language only: use 'may support' not 'treats' or 'cures'.
Avoid disease claims. Include 'consult healthcare provider' language.
Reference clinical studies with asterisks for footnotes. Use 'these statements
not evaluated by FDA' where appropriate."
```

### Use Case 3: Unique Brand Voice

**Scenario:** Quirky brand with specific personality

**Special Instructions:**
```
"Channel Oatly's self-aware, slightly irreverent style: break fourth wall
occasionally, use parentheses for side comments, gentle humor at our own
expense (never customer's), honest about limitations, use 'Wow, no cow'
style wordplay sparingly, conversational asides feel like inside jokes."
```

### Use Case 4: Platform Constraints

**Scenario:** LinkedIn ad with character limits

**Special Instructions:**
```
"LinkedIn ad format: Professional tone, B2B focus, maximum 150 characters
for headline, 70 characters for description. No emojis. Use job titles
('Director of', 'VP of'). End with single strong CTA. Every word counts -
be concise but complete."
```

---

## Testing & Iteration

### How to Test Special Instructions

**1. Start Simple:**
```
First version: "Use short sentences"
Test output: See if sentences actually shorter
```

**2. Add Specificity:**
```
Second version: "Use sentences under 15 words"
Test output: Count words, verify compliance
```

**3. Combine Multiple:**
```
Third version: "Sentences under 15 words. No jargon. Bold product names."
Test output: Check all three requirements
```

**4. Refine Based on Results:**
```
Final version: "Sentences under 15 words. Replace technical terms with
plain language. Bold all product names in first mention only."
```

### Learning from Outputs

**If AI Ignores Your Instruction:**
- Make it more specific
- Move it to first position
- Use stronger language ("Must", "Always", "Never")
- Check if conflicting with other fields

**If AI Over-Applies:**
- Add "naturally" or "where appropriate"
- Give examples of good vs bad application
- Specify frequency ("2-3 times" not "throughout")

---

## Advanced Techniques

### Negative Instructions

Telling AI what NOT to do can be powerful:

```
"Do NOT:
- Use exclamation points (period only)
- Make unverifiable claims
- Use questions as section headers
- Include competitor names
- Write in second person ('you') - use 'teams' or 'businesses' instead"
```

### Conditional Instructions

```
"If discussing pricing: use 'investment' language and emphasize ROI.
If discussing features: focus on outcomes, not technical specs.
If mentioning competitors: only as 'traditional tools', never by name."
```

### Persona-Based Instructions

```
"Write as if you're a senior project manager advising a colleague -
experienced, helpful, no-nonsense. You've seen projects fail and know what
matters. You're sharing hard-won wisdom, not selling."
```

---

## Conclusion

Special Instructions is CopyZap's secret weapon - the field that transforms good copy into perfect copy. Master this feature to achieve:

- ✅ Exact brand voice matching
- ✅ Cultural and regional adaptation
- ✅ Compliance with specific requirements
- ✅ Platform-specific optimization
- ✅ Edge case handling
- ✅ Experimental approaches
- ✅ Client satisfaction through precision

**The key:** Be specific, be clear, and iterate based on results. Special Instructions rewards precision with perfect customization.