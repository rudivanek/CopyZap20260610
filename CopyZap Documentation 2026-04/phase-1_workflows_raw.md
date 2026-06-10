# CopyZap — Workflow Inventory (Raw)

> Phase 1 — Complete Workflow Map
> Generated: 2026-04-16
> Method: Intent-first extraction from feature inventory and codebase audit
> No UI descriptions. No feature re-explanations. Pure user goals.

---

## 1. Core Workflows (Primary Use Cases)

---

### Workflow Name: Create New Copy from Scratch

### User Goal:
Generate original marketing copy for a product, service, or business when no existing copy is available

### Starting Point:
User has a business/product they want to promote and needs to produce copy from zero

### Input Type:
Business description, product/service name, tone, language, word count, audience, key message, brand values, CTA, keywords, industry, funnel stage, page type, section

### Key Actions (high-level, no UI steps):
- Provide business context and product details
- Configure tone, language, and length preferences
- Set targeting parameters (audience, funnel stage, sophistication level)
- Optionally configure SEO and GEO settings
- Initiate generation

### System Behavior:
Constructs a full generation prompt from all supplied inputs; generates primary improved copy; optionally generates alternative versions, headlines, humanized versions; scores all outputs if scoring enabled; applies word count refinement if prioritizeWordCount is set; logs token usage per operation

### Outputs Produced:
Primary copy, alternative versions, humanized versions, headline ideas, SEO metadata (if enabled), scores per version (if enabled)

### Variations / Branches:
- With scoring enabled vs. disabled
- With SEO metadata generation
- With GEO enhancement (TL;DR, regional markers)
- With structured output (section-by-section layout)
- With brand voice applied
- With keyword enforcement enforced
- With performance boost after generation
- With multiple variants (createVariants mode)

### Complexity Level: Beginner → Advanced

---

### Workflow Name: Improve Existing Copy

### User Goal:
Enhance copy that already exists — whether written by the user, a team member, or a previous AI generation — to make it stronger, more persuasive, or better aligned with a goal

### Starting Point:
User has existing copy text they are not satisfied with

### Input Type:
Original copy text, product/service name, tone, language, word count, CTA, pain points, competitor context, special instructions

### Key Actions (high-level, no UI steps):
- Paste existing copy
- Provide context for the improvement direction
- Configure tone and targeting preferences
- Initiate improvement generation

### System Behavior:
Original copy is sent as baseline context; AI generates improved version while preserving intent; original copy is stored as reference baseline for scoring comparison; word count refinement applied if configured; alternative versions generated on demand; token usage tracked

### Outputs Produced:
Improved copy, alternatives, humanized versions, score comparison against original baseline

### Variations / Branches:
- With performance boost applied after first improvement
- With scoring comparison vs. original
- With brand voice overlay
- With structured output format enforced
- With keyword integration forced
- With GEO enhancement
- With word count strictly enforced

### Complexity Level: Beginner → Intermediate

---

### Workflow Name: Generate Multiple Variants in Batch

### User Goal:
Produce several distinct copy versions simultaneously to cover different messaging angles or give a client options

### Starting Point:
User wants to explore multiple copy directions without running individual generations one at a time

### Input Type:
All standard form inputs plus numberOfVariants (1–10)

### Key Actions (high-level, no UI steps):
- Configure form with all context and preferences
- Set variant count (1–10)
- Initiate batch generation

### System Behavior:
Runs generation pipeline once per variant with shared form context; each variant receives independent scoring if enabled; all variants stored in session; token usage tracked per variant

### Outputs Produced:
Multiple independently scored copy variants; all available for comparison, export, or further optimization

### Variations / Branches:
- With scoring enabled (all variants scored on generation)
- Without scoring (scored on demand later)
- With brand voice applied to all variants
- With different personas per variant
- With performance boost applied to best variant after comparison

### Complexity Level: Intermediate → Agency

---

### Workflow Name: Compare Versions and Select Winner

### User Goal:
Evaluate all generated versions against each other to determine which performs best and get a clear recommendation for which to publish

### Starting Point:
User has two or more generated versions (from any generation workflow) and wants an objective comparison

### Input Type:
All existing generated versions with scores; scoring context (use case, SEO status, keyword count)

### Key Actions (high-level, no UI steps):
- Ensure versions have been scored individually
- Run comprehensive comparative analysis
- Review winner declaration and ranking
- Review per-version narrative analysis
- Select winning version for use

### System Behavior:
Runs unified comparison engine across all versions; applies context-aware dimension weighting; calculates final weighted scores; determines winner; generates ranking snapshot with deltas; generates narrative deep analysis per version on demand; evidence anchoring applied to score justifications

### Outputs Produced:
Winner hero card with recommendation, ranked snapshot of all versions, per-version score breakdown, delta indicators (vs. winner and vs. original baseline), decision badges per version, priority action recommendations

### Variations / Branches:
- With deep narrative analysis per version (on-demand or batch)
- With context change (re-score after scoring context update)
- With version edits (triggers outdated comparison banner, re-score)
- With new versions added after initial comparison (triggers missing outputs banner)
- With original copy included as baseline reference in ranking

### Complexity Level: Intermediate → Advanced

---

### Workflow Name: Optimize Best-Performing Copy (Performance Boost)

### User Goal:
Push the highest-scoring version even higher by running iterative re-generation targeting score improvement

### Starting Point:
User has already scored versions and identified a strong performer; wants to see if the copy can be further elevated

### Input Type:
Selected version content, current score, form state (reused)

### Key Actions (high-level, no UI steps):
- Identify highest-scoring version
- Trigger performance boost on that version
- Review boosted output and new score
- Repeat up to maximum iterations if improvement continues

### System Behavior:
Re-generates copy with explicit instruction to maintain strengths and address known weaknesses from scoring; scores boosted output; repeats up to MAX_BOOST_ITERATIONS (2); stops if score exceeds MAX_BOOST_SCORE_THRESHOLD (90); zone structure preserved if present; boostIteration counter tracked

### Outputs Produced:
Boosted copy version with updated score; iteration count visible; comparison against pre-boost score

### Variations / Branches:
- Single boost iteration
- Double boost iteration (maximum)
- Boost stopped early because score threshold exceeded
- Boost applied to humanized version instead of primary

### Complexity Level: Intermediate

---

### Workflow Name: Generate SEO Metadata for Copy

### User Goal:
Produce all SEO structural elements needed to publish copy on a website (meta descriptions, headings, slugs, OG tags)

### Starting Point:
User has generated or has existing copy and needs the supporting SEO elements built out

### Input Type:
Generated copy content, keywords, language, audience, industry; count settings per element type (URL slugs 1–5, meta descriptions 1–5, H1 variants 1–5, H2/H3 headings 1–10, OG titles/descriptions 1–5)

### Key Actions (high-level, no UI steps):
- Configure which SEO elements to generate and how many of each
- Trigger SEO metadata generation
- Review all generated elements
- Copy or export desired elements

### System Behavior:
Constructs SEO-specific prompt with absolute character limits enforced per element type; generates all requested elements in one call; returns structured SeoMetadata object; token usage tracked

### Outputs Produced:
URL slugs, meta descriptions, H1 variants, H2 headings, H3 headings, OG titles, OG descriptions — all within platform character limits

### Variations / Branches:
- Generating all elements together vs. specific elements only
- With keyword integration enforced in all elements
- Per-output SEO metadata (on-demand per individual version card)
- Global SEO generation (applied after primary generation)

### Complexity Level: Intermediate

---

### Workflow Name: Generate GEO-Optimized Content

### User Goal:
Create copy structured specifically to be discovered, quoted, and referenced by AI assistants (ChatGPT, Perplexity, Claude, Google AI Overviews)

### Starting Point:
User wants copy that ranks well in AI-powered search results, not just traditional SEO

### Input Type:
Standard form inputs plus: enhanceForGEO flag, addTldrSummary flag, geoRegions (target regions), standard language/tone/audience settings

### Key Actions (high-level, no UI steps):
- Enable GEO enhancement mode
- Optionally enable TL;DR prefix
- Optionally specify target regions
- Generate copy
- Review GEO score and its 7-dimension breakdown

### System Behavior:
Injects GEO-specific formatting instructions into generation prompt (scannable structure, question-based headings, quote-friendly sentences, authority signals, local relevance markers); prepends TL;DR if enabled; scores result on 7 GEO criteria with point allocations (Direct Answer Clarity 20, Scannable Structure 15, Question Headings 10, Local Relevance 20, Quote-Friendly Sentences 15, Authority Signals 10, TL;DR 10)

### Outputs Produced:
GEO-optimized copy, GEO score (0–100) with dimension breakdown, TL;DR prefix (if enabled)

### Variations / Branches:
- With TL;DR enabled vs. disabled
- With specific geoRegions vs. generic
- GEO enhancement applied to improved copy vs. new copy
- GEO score only (re-score existing content for GEO without regenerating)

### Complexity Level: Intermediate → Advanced

---

### Workflow Name: Extract Copy from URL and Improve It

### User Goal:
Pull existing copy off a live website and improve it without having to manually copy-paste the content

### Starting Point:
User has a URL to a page they want to improve the copy for

### Input Type:
URL string, analysis mode = fullCopy

### Key Actions (high-level, no UI steps):
- Provide the URL to analyze
- Trigger full copy extraction
- Review extracted content and auto-populated fields
- Adjust any pre-filled settings if needed
- Run improvement generation

### System Behavior:
Sends URL to edge function for scraping and structured extraction; extracts full copy text, detected language, audience signals, tone, pain points, output structure suggestions; populates Improve tab fields with extracted data; caches result to avoid re-scraping same URL; standard improvement pipeline runs on extracted copy

### Outputs Produced:
Pre-populated form state with extracted copy; then full Improve workflow outputs (improved copy, alternatives, scores)

### Variations / Branches:
- Standard URL analysis vs. Firecrawl-powered extraction (for resistant pages)
- With additional form fields added on top of extracted context
- With brand voice applied after extraction
- Cached result used vs. fresh extraction

### Complexity Level: Beginner → Intermediate

---

### Workflow Name: Extract Context from URL and Generate New Copy

### User Goal:
Analyze a website to extract brand context, then use that context to generate new copy (not improve the existing page copy, but create something new informed by the brand)

### Starting Point:
User has a URL to a client or competitor website and wants to use it as context for new copy creation

### Input Type:
URL string, analysis mode = context

### Key Actions (high-level, no UI steps):
- Provide URL
- Trigger context extraction
- Review auto-populated wizard/form fields
- Adjust or supplement extracted context
- Generate new copy

### System Behavior:
Edge function scrapes URL and extracts: whatCreating, targetAudience, tone, painPoints, features array, benefits array, language, page title; populates Quick Setup Wizard fields; user proceeds with new copy generation using extracted context

### Outputs Produced:
Pre-populated form context from URL; then full Create workflow outputs

### Variations / Branches:
- Wizard-led flow (structured step by step)
- Direct form fill (extracted context dropped into full form)
- Context from competitor URL used for differentiation

### Complexity Level: Beginner → Intermediate

---

### Workflow Name: Extract Brand Voice from URL and Reuse It

### User Goal:
Capture the voice, tone, and style of an existing brand (from their website) and save it for application to future copy

### Starting Point:
User wants to match or replicate a brand's voice without manually describing it

### Input Type:
URL of brand website, optional customer context

### Key Actions (high-level, no UI steps):
- Provide the brand's URL
- Trigger brand voice extraction
- Review extracted voice characteristics
- Save as named brand voice profile
- Assign to customer record

### System Behavior:
Edge function analyzes website copy for tone patterns, sentence style, vocabulary, key phrases, formality level; returns structured brand voice guidelines; user saves result as a named brand voice profile in the database; profile linked to a customer record; can be selected in future generation sessions

### Outputs Produced:
Named brand voice profile with extracted guidelines (tone, style, key phrases, voice characteristics, formality, POV)

### Variations / Branches:
- Extracted and saved immediately vs. reviewed and edited before saving
- Applied to customer record vs. standalone profile
- Used immediately vs. stored for later

### Complexity Level: Intermediate

---

### Workflow Name: Apply Brand Voice to New or Improved Copy

### User Goal:
Generate copy that consistently reflects a specific brand's documented voice and style

### Starting Point:
User has a saved brand voice profile and wants it applied to a generation

### Input Type:
Standard form inputs plus brandVoiceId selection, customerId

### Key Actions (high-level, no UI steps):
- Select customer record
- Select associated brand voice profile
- Configure generation settings
- Generate copy with brand voice applied

### System Behavior:
Brand voice guidelines fetched from database; injected into generation prompt as mandatory style constraints; all generated versions (primary, alternatives, humanized) receive brand voice context; advanced style controls (sentence rhythm, POV, formality, vocabulary complexity) applied if configured

### Outputs Produced:
Copy generation results styled to brand voice across all versions

### Variations / Branches:
- Simple brand voice (basic tone guidelines only)
- Advanced brand voice (sentence rhythm, POV, formality, vocabulary)
- Brand voice applied to existing copy improvement
- Multiple brand voices compared (not standard flow but possible via separate sessions)

### Complexity Level: Intermediate → Agency

---

### Workflow Name: Run Quick Simplified Generation (Quick Mode)

### User Goal:
Get usable copy fast with minimal setup — for users who don't need fine-grained control or just want a rapid first draft

### Starting Point:
User wants output quickly without configuring every option

### Input Type:
Business description or original copy (only required fields); smart defaults handle everything else

### Key Actions (high-level, no UI steps):
- Enter basic business or copy description
- Generate with smart defaults applied

### System Behavior:
Form operates in Quick mode with all optional fields hidden; smart defaults applied for tone, language, word count, and other settings; generation runs full standard pipeline; Quick Polish mode available as an even faster variant within this flow

### Outputs Produced:
Generated copy with smart defaults applied; scores if enabled by default

### Variations / Branches:
- Quick mode with URL analysis pre-fill (fast context from website)
- Quick Polish mode (even more stripped down for rapid improvement)
- Quick mode used as starting point then expanded to Standard/Advanced for further control

### Complexity Level: Beginner

---

### Workflow Name: Run Advanced Fully-Controlled Generation

### User Goal:
Produce highly specific copy with complete control over every generation parameter — for professional copywriters, SEO specialists, or agencies with exacting requirements

### Starting Point:
User needs precise output matching specific requirements including constraints, keywords, GEO targets, structure, brand voice, and style

### Input Type:
Full form state — all fields populated including: language style constraints, excluded terms, competitor context, structured output definition, special instructions, GEO regions, SEO element counts, brand voice, funnel stage, reader sophistication, tone level slider, word count tolerance, LLM provider choice, AI engine mode

### Key Actions (high-level, no UI steps):
- Fill all relevant fields in Advanced mode
- Configure all toggles, constraints, and enhancement options
- Optionally configure structured output sections
- Generate; review all outputs with full scoring detail

### System Behavior:
All form fields included in prompt construction; no defaults override explicit settings; special instructions applied at highest priority; structured output enforced if configured; word count refinement runs if strict mode enabled; all scoring dimensions active; full token usage tracked per operation type

### Outputs Produced:
Copy matching all specified constraints; full multi-dimension score breakdown; SEO metadata; GEO scores; structured output with named sections; comparison-ready for all variants

### Variations / Branches:
- With Enhanced pipeline (CopyZap+ mode for additional processing steps)
- With structured section output
- With both AI engines compared (aiEngineMode = 'both')
- With zone-labeled structure enforcement
- With all constraints + brand voice + GEO + SEO simultaneously

### Complexity Level: Advanced → Agency

---

### Workflow Name: Export Results for Client Delivery

### User Goal:
Package all generated results, scores, analysis, and recommendations into a deliverable format for a client or stakeholder

### Starting Point:
User has completed a generation and comparison session and needs to share results externally

### Input Type:
Completed session with generated content, scores, comparison results, deep analysis

### Key Actions (high-level, no UI steps):
- Run all desired generations and comparisons
- Optionally run deep analysis on all versions
- Select export format and scope
- Export and deliver

### System Behavior:
Markdown export compiles all versions, scores, tables, and analysis into a single document; HTML export creates a styled standalone file; per-item clipboard copy available for individual elements; JSON form export lets client or team member re-load exact settings; session saved to database for future reference

### Outputs Produced:
Markdown document with all results, HTML styled export, clipboard content per item, JSON form configuration, saved session record

### Variations / Branches:
- Markdown export (text-based, universal)
- HTML export (styled, for email or direct sharing)
- Per-section clipboard copy (selective sharing)
- JSON settings export (for team reuse of same configuration)
- Session saved and shared via session ID

### Complexity Level: Intermediate → Agency

---

### Workflow Name: Save and Reuse Previous Sessions

### User Goal:
Return to a previous generation session to continue work, reuse settings, or fork into a new project

### Starting Point:
User has a previous session saved in the system

### Input Type:
Session ID or session history list

### Key Actions (high-level, no UI steps):
- Browse session history
- Load a previous session
- Review previous outputs and settings
- Continue, modify, or fork into new session

### System Behavior:
Session fetched from Supabase with full formState, generated content, scores; session loaded into form; session can be continued (same sessionId) or forked (new sessionId with copied settings); loadedSessionName tracks rename/fork state; orphaned/empty sessions cleaned up automatically

### Outputs Produced:
Restored full session state; all previous outputs accessible; form ready to continue or re-generate

### Variations / Branches:
- Continue exact same session (append new outputs)
- Fork session (create new session with same settings)
- Load for reference only (view previous results without modifying)
- Load and re-generate with modified settings

### Complexity Level: Beginner → Intermediate

---

### Workflow Name: Run Deep Analysis on All Versions

### User Goal:
Get narrative strategic guidance on every generated version — not just numeric scores but actionable recommendations, key strengths, and improvement suggestions per version

### Starting Point:
User has multiple generated and scored versions and wants detailed qualitative analysis beyond scores

### Input Type:
All generated versions; scoring context

### Key Actions (high-level, no UI steps):
- Trigger deep analysis (individually or batch "Generate All")
- Wait for all analyses to complete
- Review per-version narrative — summary, strengths, improvements, strategic recommendation, pros/cons

### System Behavior:
Each version's analysis runs through a separate LLM call (independent from scoring); results cached per content hash + context key; batch generation shows progress bar with count; allAnalysisGenerated flag set when all complete; evidence anchored to specific content citations

### Outputs Produced:
Per-version VersionDeepAnalysis object — summary, keyStrengths, suggestedImprovements, strategicRecommendation, pros, cons, analysisVersion, evaluatedAt

### Variations / Branches:
- Single version analysis (on-demand per card)
- Batch analysis of all versions simultaneously
- Re-analysis after version edit (cache invalidated by content change)
- Analysis used alongside numeric scores in export

### Complexity Level: Intermediate → Advanced

---

### Workflow Name: Build a Reusable Workflow

### User Goal:
Define a repeatable, named multi-step generation process that can be run on demand for recurring copy needs (e.g., a blog post workflow, a product description workflow, a weekly social post workflow)

### Starting Point:
User has a recurring copy need that follows a consistent process

### Input Type:
Workflow name, description, ordered steps array, step types, step parameters

### Key Actions (high-level, no UI steps):
- Define workflow name and purpose
- Add steps in sequence (generate, score, improve, humanize, export, etc.)
- Configure each step's parameters
- Save workflow
- Optionally share with team or publish as public

### System Behavior:
Workflow saved to database with full step configuration; permissions model supports edit/view sharing; is_public flag enables team-wide or open access; workflow execution engine handles sequential step running with dependency passing between steps

### Outputs Produced:
Saved workflow record; shareable via permissions; executable as a single action

### Variations / Branches:
- Personal workflow (private, single user)
- Team workflow (shared via permissions)
- Public workflow (discoverable by any user)
- Workflow with branching logic (conditional steps)

### Complexity Level: Advanced → Agency

---

### Workflow Name: Execute a Saved Workflow

### User Goal:
Run a previously built workflow to produce all its outputs automatically in sequence without manually managing each step

### Starting Point:
User selects an existing workflow to run

### Input Type:
Workflow ID, initial form state (starting inputs)

### Key Actions (high-level, no UI steps):
- Select the workflow to run
- Provide starting input context
- Initiate execution
- Review sequential outputs as each step completes

### System Behavior:
Execution engine processes each step sequentially; output from each step passed as context to next step; workflowGenerated flag set on all outputs; error recovery per step; all outputs and token usage tracked against session; final aggregated results presented on completion

### Outputs Produced:
All outputs defined by the workflow steps; complete session record; token usage per step

### Variations / Branches:
- Workflow with all defaults (minimal input required)
- Workflow supplemented with custom inputs per run
- Workflow run interrupted and resumed

### Complexity Level: Intermediate → Agency

---

### Workflow Name: Use Comparison to Decide Best Copy for Publishing

### User Goal:
Move from "I have several versions" to "I know which one to publish and why" — with confidence backed by scoring evidence

### Starting Point:
User has completed generation and comparison and needs to make a final publishing decision

### Input Type:
Comparison results, deep analysis data, ranked outputs

### Key Actions (high-level, no UI steps):
- Review winner declaration and recommendation text
- Review ranking snapshot (all versions with scores and deltas)
- Review per-version decision badges (Best Conversion, Highest Trust, Risky, etc.)
- Optionally review deep narrative analysis
- Select version to publish
- Copy or export selected version

### System Behavior:
WinnerHeroCard presents final recommendation prominently; ranking table shows all versions with delta vs. winner; decision badges surface heuristic signals (non-authoritative); deep analysis provides narrative reasoning; selected version copied to clipboard or exported

### Outputs Produced:
Clear winner with narrative justification; all supporting evidence and analysis; selected copy ready for use

### Variations / Branches:
- Accept AI winner recommendation
- Override AI recommendation based on own judgment (any version can be copied regardless of rank)
- Use winning version as starting point for further optimization (performance boost)
- Export full comparison report for stakeholder review before deciding

### Complexity Level: Intermediate

---

### Workflow Name: Evaluate and Improve Input Quality Before Generating

### User Goal:
Assess how strong the current form inputs are before running a generation, to avoid wasting credits on weak prompts

### Starting Point:
User has partially or fully filled the form but is uncertain if inputs are strong enough

### Input Type:
All currently populated form fields

### Key Actions (high-level, no UI steps):
- Trigger input evaluation
- Review score (0–100) and specific improvement tips
- Update form fields based on recommendations
- Re-evaluate or proceed to generation

### System Behavior:
Evaluation prompt sent to LLM with all current field values; returns numeric score and array of 6–10 field-specific tips; tips reference specific fields (audience, keywords, CTA, etc.); user can act on tips before generating

### Outputs Produced:
Input quality score, field-specific improvement tips, actionable guidance per tip

### Variations / Branches:
- Evaluate and immediately improve inputs, then generate
- Evaluate and determine inputs are sufficient, generate without changes
- Repeat evaluation cycle after improving inputs

### Complexity Level: Beginner → Intermediate

---

### Workflow Name: Apply Zone-Structured Copy Improvement

### User Goal:
Improve structured copy that uses named zones (e.g., "Zona 1 — Hero", "Zona 2 — Benefits") while guaranteeing the zone structure is preserved and not reordered or merged

### Starting Point:
User has structured copy with explicit zone labels and needs it improved without breaking the structure

### Input Type:
Original copy with zone labels, special instructions referencing zones, standard form settings

### Key Actions (high-level, no UI steps):
- Paste zone-labeled copy
- Confirm zone structure detection
- Generate improvement or alternatives

### System Behavior:
detectZoneLabels scans both copy body and specialInstructions; if zones detected, zone preservation rules hard-coded into prompts for all generation modes (Improvement, Alternative Copy, Voice Restyle, Performance Boost); LLM instructed zone labels are immutable and must be preserved verbatim in exact order

### Outputs Produced:
Improved copy with identical zone structure preserved; all versions maintain zones

### Variations / Branches:
- Zones in body copy only
- Zones referenced in special instructions only
- Zones in both copy and instructions (dual-source detection)
- Multiple zones (2, 3, 4+ zones all preserved)

### Complexity Level: Advanced

---

## 2. Micro Workflows (Secondary Actions)

---

### Workflow Name: Generate Headlines Only

### User Goal:
Produce headline variations for existing or new copy without running a full generation cycle

### Starting Point:
User has copy and needs headline options

### Input Type:
Existing copy or business context, language, tone

### Key Actions (high-level, no UI steps):
- Ensure generateHeadlines is enabled
- Trigger headline generation (standalone or as part of full generation)

### System Behavior:
Headline generation pipeline runs against existing copy context; returns array of headline variants

### Outputs Produced:
Array of headline strings; displayed in HeadlineIdeas section

### Variations / Branches:
- Generated automatically with copy generation
- Generated on demand for existing output card

### Complexity Level: Beginner

---

### Workflow Name: Generate Humanized Version of Any Copy

### User Goal:
Make AI-generated copy sound warmer, more conversational, and less detectably AI-written

### Starting Point:
User has generated copy they want to humanize

### Input Type:
Source copy, tone, language, noAIDetection flag

### Key Actions (high-level, no UI steps):
- Select source version to humanize
- Optionally enable AI detection avoidance
- Trigger humanization

### System Behavior:
Humanization prompt applied with conversational tone instructions; noAIDetection flag adds filler phrase and sentence variation techniques; GEO enhancement applied if active; result stored as humanized version alongside source

### Outputs Produced:
Humanized copy version; independently scoreable

### Variations / Branches:
- Standard humanization (natural tone)
- Anti-detection humanization (noAIDetection enabled)
- Humanized with GEO enhancement applied

### Complexity Level: Beginner

---

### Workflow Name: Re-Score Content After Edits

### User Goal:
Update scores after manually editing generated copy to reflect the new content

### Starting Point:
User has edited a generated version and wants accurate scores for the updated content

### Input Type:
Edited content, current scoring context

### Key Actions (high-level, no UI steps):
- Edit content in version card
- Trigger re-score on edited version
- Review updated scores

### System Behavior:
Content hash changes on edit, invalidating cached score; re-scoring runs fresh LLM evaluation; comparison marked as outdated (comparisonOutdated banner shown); comparison must be re-run to reflect new score in rankings

### Outputs Produced:
Updated ScoreData for edited version; outdated comparison banner prompting re-comparison

### Variations / Branches:
- Re-score single version
- Re-run full comparison after re-scoring

### Complexity Level: Beginner

---

### Workflow Name: Add SEO Metadata to Existing Copy

### User Goal:
Generate SEO elements for copy that was generated earlier without SEO enabled, or for copy brought in from outside

### Starting Point:
User has final or near-final copy and needs SEO elements built

### Input Type:
Copy content, keywords, language, desired element types and counts

### Key Actions (high-level, no UI steps):
- Select version to generate SEO metadata for
- Configure element types and counts
- Trigger SEO generation for that version

### System Behavior:
On-demand SEO generation called for specific output card; character limits enforced; result displayed inline with that output

### Outputs Produced:
URL slugs, meta descriptions, H1/H2/H3 variants, OG tags — all displayed per output version

### Variations / Branches:
- All elements generated at once
- Specific elements only (e.g., meta descriptions only)
- SEO re-generated after copy edit

### Complexity Level: Beginner → Intermediate

---

### Workflow Name: Apply Keyword Enforcement to Generation

### User Goal:
Guarantee that specific keywords appear naturally integrated into the generated copy (not just mentioned, but woven in)

### Starting Point:
User has target keywords and wants them in the copy without keyword stuffing

### Input Type:
Keywords field, forceKeywordIntegration flag

### Key Actions (high-level, no UI steps):
- Enter target keywords
- Enable force keyword integration
- Generate copy

### System Behavior:
Keyword enforcement rule added to generation prompt; SEO dimension activates in scoring; keywordsExplicit flag set; keywords tracked in score cache key

### Outputs Produced:
Copy with keywords naturally integrated; SEO scoring dimension active in score breakdown

### Variations / Branches:
- With SEO scoring also enabled (full SEO workflow)
- Without scoring (keyword enforcement only, no scoring)

### Complexity Level: Beginner → Intermediate

---

### Workflow Name: Trigger Performance Boost on a Specific Version

### User Goal:
Attempt to improve an already-good version beyond what standard generation produced

### Starting Point:
User has a scored version they want to push higher

### Input Type:
Version content, current score, form state

### Key Actions (high-level, no UI steps):
- Select version for boost
- Trigger performance boost
- Review boosted output and compare scores

### System Behavior:
Boost prompt instructs AI to maintain all strengths while addressing identified weaknesses; zone labels preserved; up to 2 iterations; halts if score exceeds threshold (90); boostIteration counter tracked; new version added to session

### Outputs Produced:
Boosted version with updated score; comparison delta vs. pre-boost version

### Variations / Branches:
- Single iteration boost
- Double iteration boost
- Boost halted due to score threshold

### Complexity Level: Intermediate

---

### Workflow Name: Apply Voice Restyle to Existing Copy

### User Goal:
Transform existing copy into a different persona or brand voice style (e.g., restate the same message in a Casual vs. Professional voice)

### Starting Point:
User has generated copy and wants to see it in different voice styles

### Input Type:
Source copy, selected persona/voice style, brand voice guidelines if applicable

### Key Actions (high-level, no UI steps):
- Select source copy
- Select target voice/persona
- Trigger restyle generation

### System Behavior:
Restyle prompt instructs AI to preserve all meaning while applying target voice characteristics; zone structure preserved if detected; result added as named "Alternative Copy (Persona's Voice)"

### Outputs Produced:
Restyled copy version; independently scoreable; labeled with persona name

### Variations / Branches:
- One persona restyle
- Multiple persona restyles from same source
- Restyle with brand voice profile applied (custom persona)

### Complexity Level: Beginner → Intermediate

---

### Workflow Name: Evaluate Input Quality Before Generation

### User Goal:
Get a diagnostic score and tips on the current form inputs before spending credits on generation

### Starting Point:
User has filled out some or all form fields and wants to verify input quality

### Input Type:
All current form field values

### Key Actions (high-level, no UI steps):
- Trigger input evaluation
- Review score and tips
- Update fields

### System Behavior:
LLM evaluates all field values for completeness, clarity, coherence, strategic value, actionability; returns score (0–100) and array of 6–10 field-specific improvement tips

### Outputs Produced:
Input quality score, improvement tip array, field-specific guidance

### Variations / Branches:
- Evaluate then immediately proceed to generate
- Evaluate then update and re-evaluate in loop

### Complexity Level: Beginner

---

### Workflow Name: Compare GEO Score Across Versions

### User Goal:
Determine which generated version performs best specifically for AI assistant discoverability

### Starting Point:
User has GEO-enhanced versions and wants to compare their GEO performance

### Input Type:
Multiple generated versions with GEO scores enabled

### Key Actions (high-level, no UI steps):
- Ensure all versions have GEO scoring enabled
- Review GEO scores per version
- Compare dimension breakdowns (Direct Answer Clarity, Local Relevance, etc.)

### System Behavior:
GEO scoring runs as separate evaluation from quality scoring; 7-dimension breakdown shown per version; not integrated into authoritative comparison ranking (separate signal)

### Outputs Produced:
GEO score per version with 7-dimension breakdown

### Variations / Branches:
- GEO score used as tiebreaker when quality scores are equal
- GEO score used alone to select publishing version for AI-first audiences

### Complexity Level: Intermediate

---

### Workflow Name: Pre-Fill Form via Quick Setup Wizard

### User Goal:
Get form fully configured quickly through a guided step-by-step interface instead of manually filling the full form

### Starting Point:
New user or user starting a fresh project without existing data

### Input Type:
Business context answers through guided steps; optionally URL for auto-fill

### Key Actions (high-level, no UI steps):
- Step through wizard questions
- Optionally provide URL for context auto-extraction
- Confirm pre-filled settings
- Proceed to generation

### System Behavior:
Wizard collects context progressively; URL analysis (context mode) can auto-populate wizard fields; upon completion, full formState is ready; user can enter full form to modify any field

### Outputs Produced:
Fully configured form state ready for generation

### Variations / Branches:
- Manual wizard (answer all questions by hand)
- URL-assisted wizard (URL fills most questions automatically)
- Wizard skipped (experienced user goes directly to full form)

### Complexity Level: Beginner

---

### Workflow Name: Save Output as Favorite

### User Goal:
Bookmark a specific generated output for easy retrieval later without saving the full session

### Starting Point:
User has a generated output they want to flag for future reference

### Input Type:
Generated content item, isFavorite flag

### Key Actions (high-level, no UI steps):
- Mark output as favorite
- Access favorites later from saved outputs list

### System Behavior:
pmc_saved_outputs record created/updated with isFavorite = true; savedMode field records which generation mode produced it; RLS ensures only owner can access

### Outputs Produced:
Saved output record with favorite flag; retrievable from personal library

### Variations / Branches:
- Favorite immediately after generation
- Favorite after review and editing

### Complexity Level: Beginner

---

## 3. Hidden / System Workflows

---

### Workflow Name: LLM Reliability Auto-Retry (BOLT Patch v1.1)

### Trigger:
LLM API response is empty, returns a refusal, fails JSON validation, or contains a malformed structure

### What Happens:
Retry loop fires up to 3 times with exponential backoff; each attempt re-sends the original request; parse failures logged to score trace if trace mode enabled; after 3 failures, error thrown and surfaced to user

### Why It Exists:
LLM APIs occasionally return empty or malformed responses; without retry logic, users would see silent failures or corrupt scores; ensures reliability without requiring manual re-generation

---

### Workflow Name: Content Score Cache Lookup and Miss Handling

### Trigger:
Any scoring request for a version

### What Happens:
Cache key constructed from content hash + contextKey (seoActive + keywordsSignature + form hash); if cache hit, cached ScoreData returned immediately without LLM call; if cache miss, LLM scoring runs and result stored in cache; cache invalidated when content is edited or scoring context changes

### Why It Exists:
Scoring is LLM-intensive; caching prevents redundant re-scoring of identical content under identical context; reduces credit consumption and improves response speed for re-scoring scenarios

---

### Workflow Name: Context Changed Detection and Re-Score Prompt

### Trigger:
Scoring context (use case, SEO status, keyword count) changes after scoring has already been run

### What Happens:
contextChanged flag set to true; pendingContextLabel updated with description of new context; amber banner shown in comparison section; scores remain visible but are marked as potentially stale; user prompted to re-score under new context

### Why It Exists:
Changing context (e.g., adding keywords after scoring) changes the scoring weights and expected results; users need to be alerted that displayed scores may not reflect current settings

---

### Workflow Name: Outdated Comparison Detection

### Trigger:
A generated version is edited after the comparison has been run

### What Happens:
comparisonOutdated flag set to true; amber banner shown in comparison section with "Re-score with updated changes" prompt; existing comparison results remain visible but flagged as outdated

### Why It Exists:
Ensures users know their comparison may not reflect the current state of their copy; prevents publishing decisions based on stale scores

---

### Workflow Name: Missing Outputs Detection

### Trigger:
New outputs are generated after the last comparison was run

### What Happens:
missingCount integer incremented for each new output generated since last comparison; amber banner shown when missingCount > 0; user prompted to include new outputs in comparison

### Why It Exists:
Ensures all generated versions are considered in the final comparison; prevents users from accidentally excluding newer, potentially better versions from the ranking

---

### Workflow Name: Zone Structure Detection and Enforcement

### Trigger:
Copy generation or improvement initiated when zone labels (e.g., "Zona 1 —") are detected in copy body or specialInstructions

### What Happens:
detectZoneLabels scans both content fields; hasZoneStructure = true when labels found; zoneLabels array populated; zone preservation rules injected as hard constraints into prompts for Alternative Copy, Voice Restyle, and Performance Boost pipelines; LLM instructed these labels are immutable and must appear in exact original order

### Why It Exists:
Structured copy with named zones loses its structure if AI freely restructures the output; zone detection prevents this without requiring users to manually specify structural constraints every time

---

### Workflow Name: Word Count Refinement Retry Loop

### Trigger:
Generated copy falls outside targetWordCount tolerance when prioritizeWordCount = true

### What Happens:
Word count of generated output measured; if outside tolerance band (wordCountTolerancePercentage), contentRefinement pipeline runs with explicit revision instruction to adjust length; loop continues until within tolerance or maximum iterations reached; actual vs. target word count and accuracy percentage tracked on output card

### Why It Exists:
Default LLM outputs often miss word count targets; users needing specific lengths (e.g., ad copy with character/word limits) need reliable adherence; retry loop automates what would otherwise require manual re-generation

---

### Workflow Name: Copy Validation and Repair Prompt Retry

### Trigger:
Generated copy output fails validation rules (structure missing, required sections absent, zone structure violated, constraints not met)

### What Happens:
validateCopyMakerResult identifies the failure reason; buildRepairPrompt constructs a targeted correction instruction using the original prompt + failure reason + previous attempt output; up to 3 repair attempts run before surfacing error

### Why It Exists:
LLMs sometimes ignore specific structural or constraint requirements on first attempt; repair loop targets known failures specifically rather than starting from scratch

---

### Workflow Name: Placeholder Field Detection

### Trigger:
Form state changes or generation is initiated when fields contain known placeholder text

### What Happens:
fieldsWithPlaceholders array updated as form changes; on generation attempt with placeholder fields, PlaceholderWarningModal shown listing unfilled fields; user can override and continue or return to fill fields; fields removed from list when user edits them

### Why It Exists:
Pre-filled templates or wizard-assisted sessions may leave placeholder text in fields; generating with placeholder text produces poor quality output; proactive detection prevents wasted credits

---

### Workflow Name: Token Usage Attribution to Actual Model

### Trigger:
Any LLM API response received (generation, scoring, SEO, analysis, etc.)

### What Happens:
API response includes model_used field indicating actual model that handled the request (may differ from requested model due to fallback routing); token record written to pmc_tokens_used with actual model name, not requested model name

### Why It Exists:
Model fallback routing means the selected model may not always handle the request; billing must reflect actual model costs; token tracking must reference real model for accurate credit consumption calculation

---

### Workflow Name: URL Analysis Result Caching

### Trigger:
URL analysis request for a URL that has been analyzed before

### What Happens:
Cache key constructed from URL + analysis mode; cache lookup against url_analysis_cache table; if cache hit within TTL, cached result returned without re-scraping; if cache miss or TTL expired, live scrape runs and result stored in cache

### Why It Exists:
Re-scraping the same URL on every session is wasteful; caching provides faster context loading for repeat visits to the same site and reduces external API usage

---

### Workflow Name: Session Cleanup (Orphaned Sessions)

### Trigger:
Scheduled database job

### What Happens:
Sessions with no associated output records and older than threshold are identified; empty/orphaned session records deleted from database

### Why It Exists:
Aborted or abandoned sessions create orphaned records; cleanup prevents database bloat and keeps session history meaningful

---

### Workflow Name: Welcome Email Trigger on Registration

### Trigger:
New record inserted into auth.users (new user account created)

### What Happens:
Database trigger fires on auth.users insert; pg_net makes HTTP call to send-welcome-email edge function with new user's email and metadata; welcome email sent

### Why It Exists:
Automated onboarding communication; fires at database level independent of frontend to ensure reliability regardless of how the account was created

---

### Workflow Name: Score Trace Logging (Diagnostic)

### Trigger:
localStorage flag 'copyzap_scoreTrace' = '1' is set

### What Happens:
For each version scored, a VariantTraceEntry is written to window.__copyzapScoreTrace capturing: execution flow steps, JSON parse status per attempt, retry count, fallback detection flag, final scores; accessible via browser console

### Why It Exists:
Production diagnostic tool for identifying silent scoring failures, fallback triggers, and parse issues without modifying deployed code; allows debugging of scoring reliability without impacting normal users

---

### Workflow Name: Keyword Signature Construction for Scoring Context

### Trigger:
Any scoring operation when keywords are present in form state

### What Happens:
Sorted, normalized keyword string constructed from form keywords; included in score cache key (keywordsSignature); seoActive flag set based on whether valid non-empty keywords are present; SEO dimension included in finalScore calculation only when seoActive = true

### Why It Exists:
SEO scoring must only activate when keywords are meaningfully present; using a normalized signature in the cache key ensures scores computed with different keyword sets are never reused across different contexts

---

### Workflow Name: Deep Analysis Cache Invalidation

### Trigger:
Version content is edited after deep analysis was generated

### What Happens:
Content hash for that version changes; cached deep analysis (VersionDeepAnalysis) becomes invalid; version card shows regenerate prompt; new analysis must be generated against updated content

### Why It Exists:
Deep analysis narratives are content-specific; edited copy may have different strengths, weaknesses, and strategic positioning than the analyzed version; stale analysis could mislead publishing decisions

---

### Workflow Name: Free Trial Credit Allocation

### Trigger:
New user account creation

### What Happens:
pmc_users record created; free trial start date set; 30-day trial period begins; trial credit allocation assigned to user balance; trial status tracked; credits available immediately for generation

### Why It Exists:
Allows new users to experience full application functionality before committing to a paid plan; trial period and allocation tracked for conversion and upgrade prompting

---

*End of Phase 1 — Workflow Inventory*
*Total: 30+ explicit user workflows, 17 system/hidden workflows*
*Source: Feature inventory + full codebase audit*
*No UI descriptions. No button clicks. Pure user goals and system behavior.*
