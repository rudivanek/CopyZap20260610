# CopyZap — Feature Inventory (Raw)

> Phase 1 — Complete System Dump
> Generated: 2026-04-16
> Method: Full codebase audit — no summarization, no merging, no interpretation

---

## 1. Core Functional Features

- **Feature Name:** Copy Creation (Create New Tab)
- **Description:** Generate entirely new marketing copy from scratch based on a business description
- **Inputs:** Business Description, Project Description, Product/Service Name, Language, Tone, Word Count, Target Audience, Key Message, Brand Values, Keywords, Page Type, Section, Special Instructions
- **Outputs:** Primary Improved Copy, Alternative Versions, Humanized Versions, Headlines, SEO Metadata (if enabled), GEO Score (if enabled)
- **Conditions/Toggles:** Tab mode must be set to 'create'; businessDescription required; requires productServiceName

---

- **Feature Name:** Copy Improvement (Improve Tab)
- **Description:** Enhance existing user-supplied copy through AI revision and optimization
- **Inputs:** Original Copy, Project Description, Product/Service Name, Language, Tone, Word Count, Competitive Analysis, Pain Points, Call-to-Action, Special Instructions
- **Outputs:** Improved Copy, Alternative Versions, Humanized Versions, Headlines
- **Conditions/Toggles:** Tab mode must be set to 'improve'; originalCopy field required; tracks originalCopyEnteredAt timestamp

---

- **Feature Name:** Alternative Copy Generation
- **Description:** Create variations of the primary generated copy with different angles and messaging approaches
- **Inputs:** Primary improved copy text, form state (tone, word count, language, special instructions), detected zone labels, selectedPersona
- **Outputs:** Multiple alternative versions numbered sequentially (Alt 1, Alt 2, Alt 3...); each version independently scoreable
- **Conditions/Toggles:** Requires primary copy to exist first; on-demand generation per alternative; zone structure preservation enforced when zone labels detected

---

- **Feature Name:** Humanized Copy Generation
- **Description:** Transform AI-generated copy into warm, conversational, human-sounding content
- **Inputs:** Source copy (improved or alternative), tone settings, language, special instructions, noAIDetection flag
- **Outputs:** Humanized version preserving meaning but with warm relatable voice
- **Conditions/Toggles:** generateHumanized toggle; noAIDetection flag applies additional sentence variation and filler phrase techniques; GEO enhancement applied if enhanceForGEO enabled

---

- **Feature Name:** Voice-Based / Restyled Copy
- **Description:** Generate copy in different brand voice styles or personas (Professional, Casual, Creative, Persuasive, etc.)
- **Inputs:** Base copy, persona selection, voice style settings, tone, brand voice guidelines
- **Outputs:** Multiple persona-specific versions; e.g., "Alternative Copy (Professional's Voice)", "Alternative Copy (Casual's Voice)"
- **Conditions/Toggles:** selectedPersona field in form state; supports multiple personas per version; brand voice guidelines injected into prompt if brandVoiceId set

---

- **Feature Name:** Create Variants (Batch Generation)
- **Description:** Generate multiple copy versions in a single batch operation
- **Inputs:** numberOfVariants (1–10, default 3), all current form settings
- **Outputs:** Multiple variants generated simultaneously, each independently scoreable
- **Conditions/Toggles:** createVariants toggle; numberOfVariants field; all variants share same form context

---

- **Feature Name:** Performance Boost
- **Description:** Iteratively re-generate highest-scoring copy to push score higher
- **Inputs:** Best-performing output text, form state, iteration limit (MAX_BOOST_ITERATIONS = 2), score threshold (MAX_BOOST_SCORE_THRESHOLD = 9.0)
- **Outputs:** Boosted copy; boostIteration counter incremented; zone structure preserved if applicable
- **Conditions/Toggles:** Available for any generated output; max 2 iterations; only runs if current score < 90; zone labels detected from content and specialInstructions and enforced in prompt

---

- **Feature Name:** Content Scoring (Multi-Dimension)
- **Description:** Score any generated copy on multiple quality dimensions using LLM evaluation
- **Inputs:** Content text, contentType, model, originalContent (for comparison baseline), targetWordCount, full form state
- **Outputs:** ScoreData object — overall (0–100), clarity, persuasiveness, toneMatch, engagement, wordCountAccuracy, improvementExplanation (narrative), suggestions array (5–7 items)
- **Conditions/Toggles:** generateScores toggle; on-demand per output card; automatic when running comparison

---

- **Feature Name:** Prompt / Input Quality Evaluation
- **Description:** Assess quality of user-provided inputs before copy generation to surface gaps
- **Inputs:** All populated form fields (businessDescription, targetAudience, keywords, tone, pageType, section, etc.)
- **Outputs:** Evaluation score (0–100), array of 6–10 improvement tips, field-specific guidance per tip
- **Conditions/Toggles:** On-demand; evaluates completeness, clarity, coherence, strategic value, actionability

---

- **Feature Name:** Word Count Accuracy Tracking
- **Description:** Calculate and display how closely generated content matches the target word count
- **Inputs:** Generated content word count, targetWordCount from form
- **Outputs:** wordCountAccuracy percentage (0–100), word difference (+/-), variance percentage
- **Conditions/Toggles:** Automatic when targetWordCount is set; displayed on output card

---

- **Feature Name:** SEO Scoring (Conditional)
- **Description:** Include SEO keyword performance as a scoring dimension — only when valid keywords are present
- **Inputs:** Keywords field, generated content, form state
- **Outputs:** SEO score component included in finalScore calculation
- **Conditions/Toggles:** seoActive flag; SEO dimension only counts when keywords are provided and keywordsExplicit is true; excluded from finalScore otherwise

---

- **Feature Name:** Multi-Score Heuristic Display (Conversion / Trust / Risk)
- **Description:** Display three additional heuristic subscores alongside main scores — these are display-only and do NOT affect ranking or winner selection
- **Inputs:** Generated content text
- **Outputs:** Conversion score (0–100), Trust score (0–100), Risk level badge (Low / Medium / High / Critical)
- **Conditions/Toggles:** Always shown in comparison view; showExplanation toggle reveals "+/- reason" breakdown; explicitly non-authoritative

---

- **Feature Name:** Comprehensive Comparative Scoring
- **Description:** Score all generated versions against each other using a unified comparison engine
- **Inputs:** All GeneratedContentItem objects with their scores, scoring context (UseCaseKey), SEO status, keyword count
- **Outputs:** ComparisonResult — winner, final scores for all versions, rankings, deep analysis metadata
- **Conditions/Toggles:** On-demand trigger; contextual weighting based on UseCaseKey; winner determined by weighted multi-dimension scoring

---

- **Feature Name:** Version Deep Analysis
- **Description:** Generate narrative strategic recommendations for each version, separate from numeric scoring
- **Inputs:** Version content, versionId, form state context, content hash (for cache key)
- **Outputs:** VersionDeepAnalysis — summary, keyStrengths array, suggestedImprovements array, strategicRecommendation, pros, cons, analysisVersion, evaluatedAt, contentHash
- **Conditions/Toggles:** On-demand or batch ("Generate All"); cached per contentHash + contextKey; separate pipeline from numeric scoring

---

- **Feature Name:** Winner Selection
- **Description:** Identify and declare the highest-scoring version after comparison
- **Inputs:** All comparison rows with finalScore values, scoring engine results
- **Outputs:** winnerVersionId, finalRecommendation text, priorityActions array, scoringGap to second place
- **Conditions/Toggles:** Automatic after comprehensive comparison runs; shown in WinnerHeroCard component

---

- **Feature Name:** SEO Metadata Generation
- **Description:** Generate full SEO structural metadata for any content
- **Inputs:** Generated content, keywords, language, tone, audience, industry, seoOptions object (which elements to generate and how many)
- **Outputs:** SeoMetadata object — urlSlugs (1–5), metaDescriptions (1–5), h1Variants (1–5), h2Headings (1–10), h3Headings (1–10), ogTitles (1–5), ogDescriptions (1–5)
- **Conditions/Toggles:** generateSeoMetadata toggle; individual count controls per element type; absolute character limits enforced (meta 160, h1 60, h2/h3 70, ogTitle 60, ogDesc 110)

---

- **Feature Name:** Keyword Integration Enforcement
- **Description:** Force generated copy to include target keywords naturally
- **Inputs:** keywords field, forceKeywordIntegration flag, generated content
- **Outputs:** Copy with keywords integrated; keyword signal validated during scoring
- **Conditions/Toggles:** forceKeywordIntegration toggle; requires keywords field to be populated; impacts SEO scoring weight

---

- **Feature Name:** GEO (Generative Engine Optimization) Scoring
- **Description:** Score content on 7 criteria for AI assistant readability, quotability, and discoverability
- **Inputs:** Generated content, form state, GEO settings (geoRegions, addTldrSummary)
- **Outputs:** GeoScoreData — overall (0–100), breakdown: Direct Answer Clarity (20 pts), Scannable Structure (15 pts), Question-Based Headings (10 pts), Local Relevance / GEO Markers (20 pts), Quote-Friendly Sentences (15 pts), Authority Signals (10 pts), Optional TL;DR / Answer Box (10 pts)
- **Conditions/Toggles:** generateGeoScore toggle; only calculated when enhanceForGEO is enabled

---

- **Feature Name:** GEO Content Enhancement
- **Description:** Modify generated content structure for AI assistant discovery optimization
- **Inputs:** Content, enhanceForGEO flag, addTldrSummary flag, geoRegions field, language
- **Outputs:** Content restructured with scannable format, location markers if applicable, TL;DR if enabled
- **Conditions/Toggles:** enhanceForGEO toggle; addTldrSummary toggle; geoRegions field; not applied to structured output format

---

- **Feature Name:** TL;DR Summary Auto-Prepend
- **Description:** Automatically prefix content with a one-sentence TL;DR for AI assistant scanning
- **Inputs:** Content text, addTldrSummary flag
- **Outputs:** Content beginning with "TL;DR: [concise sentence]" followed by blank line and full content
- **Conditions/Toggles:** addTldrSummary toggle; gated behind enhanceForGEO; excluded from structured output

---

- **Feature Name:** URL Analysis — Context Mode
- **Description:** Scrape and analyze a URL to extract context data for pre-filling the wizard
- **Inputs:** URL string, analysis mode = 'context', model selection
- **Outputs:** Extracted context — whatCreating, targetAudience, tone, painPoints, features[], benefits[], language, page title, description
- **Conditions/Toggles:** mode = 'context'; timeout 90 seconds; result used to pre-fill Quick Setup Wizard fields

---

- **Feature Name:** URL Analysis — Full Copy Extraction
- **Description:** Extract complete copy text from a webpage for the Improve tab
- **Inputs:** URL string, analysis mode = 'fullCopy', model selection
- **Outputs:** Structured copy text, language, targetAudience, painPoints, tone, outputStructure suggestions
- **Conditions/Toggles:** mode = 'fullCopy'; timeout 180 seconds; optional caching indicator returned

---

- **Feature Name:** URL Analysis via Firecrawl
- **Description:** Advanced URL scraping via Firecrawl service for pages resistant to standard scraping
- **Inputs:** URL, Firecrawl API key, extraction parameters
- **Outputs:** Cleaned structured webpage content
- **Conditions/Toggles:** Separate edge function (analyze-url-firecrawl); fallback when standard analysis fails

---

- **Feature Name:** Brand Voice Extraction from URL
- **Description:** Analyze brand voice tone and style characteristics from existing website content
- **Inputs:** URL, optional customer context
- **Outputs:** Brand voice guidelines — tone, style, key phrases, voice characteristics extracted from live site
- **Conditions/Toggles:** Separate edge function (extract-brand-voice-from-url); supports assigning result to customer record

---

- **Feature Name:** Brand Voice Application
- **Description:** Apply a saved brand voice profile to all generated content
- **Inputs:** brandVoiceId from form state, customer context
- **Outputs:** Generated content styled according to brand voice guidelines injected into prompt
- **Conditions/Toggles:** brandVoiceId field; requires customerId to be set; visible in Standard/Advanced mode; hidden in Quick mode

---

- **Feature Name:** Advanced Style Controls (Brand Voice)
- **Description:** Fine-grained brand voice configuration beyond basic tone
- **Inputs:** Sentence rhythm (varied / punchy / flowing), Persona type, Formality level, POV (first / second / third person), Vocabulary complexity
- **Outputs:** Brand voice definition object used in generation prompts
- **Conditions/Toggles:** Advanced section inside BrandVoiceModal; optional per-voice settings stored in brand voice record

---

- **Feature Name:** Customer / Client Organization
- **Description:** Organize projects and brand voices by customer/client
- **Inputs:** customerId, customerName
- **Outputs:** Customer context applied to form state; workspace organization by client
- **Conditions/Toggles:** customerId field; visible in Standard/Advanced mode; hidden in Quick mode; supports on-the-fly customer creation

---

---

## 2. Input Controls & Configuration Features

- **Feature Name:** Project Description Field
- **Description:** Internal label for organizing projects in the dashboard — NOT sent to AI
- **Inputs:** Free-form text
- **Outputs:** formState.projectDescription; used for dashboard display and session naming
- **Conditions/Toggles:** Required; always visible; explicitly excluded from AI prompts

---

- **Feature Name:** Product / Service Name Field
- **Description:** Exact product or service name for branding consistency
- **Inputs:** Free-form text
- **Outputs:** formState.productServiceName; included in AI prompts
- **Conditions/Toggles:** Required; always visible

---

- **Feature Name:** Tab Toggle — Create vs Improve
- **Description:** Switch between generating new copy (Create) and improving existing copy (Improve)
- **Inputs:** Toggle selection
- **Outputs:** formState.tab = 'create' or 'improve'; shows/hides businessDescription or originalCopy field
- **Conditions/Toggles:** Mutually exclusive; affects which fields are required

---

- **Feature Name:** Business Description Field
- **Description:** Describe the business, product, or service for new copy generation
- **Inputs:** Multi-line text area
- **Outputs:** formState.businessDescription; primary AI context for copy generation
- **Conditions/Toggles:** Required when tab = 'create'; hidden when tab = 'improve'; word counter active

---

- **Feature Name:** Original Copy Field
- **Description:** Paste existing copy to be improved
- **Inputs:** Multi-line text area
- **Outputs:** formState.originalCopy; sent to AI for improvement and used as baseline for scoring; originalCopyEnteredAt timestamp recorded
- **Conditions/Toggles:** Required when tab = 'improve'; hidden when tab = 'create'; word counter active

---

- **Feature Name:** Language Selector
- **Description:** Target language for all generated content
- **Inputs:** Dropdown — English, Spanish, French, German, Italian, Portuguese
- **Outputs:** formState.language; determines output language
- **Conditions/Toggles:** Default: English; affects all generation

---

- **Feature Name:** Tone Selector
- **Description:** Voice/style tone for generated copy
- **Inputs:** Dropdown — Professional, Friendly, Bold, Minimalist, Creative, Persuasive
- **Outputs:** formState.tone; sent to AI for style guidance
- **Conditions/Toggles:** Default: Professional

---

- **Feature Name:** Tone Level Slider
- **Description:** Control intensity of the selected tone from subtle to extreme
- **Inputs:** Numeric slider 0–10
- **Outputs:** formState.toneLevel; modulates strength of tone application in prompts
- **Conditions/Toggles:** Optional; works in conjunction with tone selector

---

- **Feature Name:** Word Count Selector
- **Description:** Target word count for generated content
- **Inputs:** Dropdown — Short (50–100), Medium (100–200), Long (200–400), Custom
- **Outputs:** formState.wordCount; if Custom: formState.customWordCount
- **Conditions/Toggles:** Default: Medium; Custom unlocks a numeric input field

---

- **Feature Name:** Word Count Tolerance Field
- **Description:** Acceptable percentage deviation from target word count before triggering revision
- **Inputs:** Numeric field — percentage (default 2%)
- **Outputs:** formState.wordCountTolerancePercentage
- **Conditions/Toggles:** Used with prioritizeWordCount flag

---

- **Feature Name:** Prioritize Word Count Toggle
- **Description:** Enforce strict word count compliance; triggers content revision loops until target met
- **Inputs:** Checkbox toggle
- **Outputs:** formState.prioritizeWordCount; activates contentRefinement retry loop
- **Conditions/Toggles:** Overrides other content preferences when enabled

---

- **Feature Name:** Little Word Count Adherence Toggle
- **Description:** Strict word count adherence mode for short-form content
- **Inputs:** Checkbox toggle, tolerance percentage (0–50%, default 20%)
- **Outputs:** formState.adhereToLittleWordCount, formState.littleWordCountTolerancePercentage
- **Conditions/Toggles:** For short content (< 100 words); separate from standard word count logic

---

- **Feature Name:** Target Audience Field
- **Description:** Define primary audience for marketing messaging
- **Inputs:** Free-form text
- **Outputs:** formState.targetAudience; sent to AI for targeting context
- **Conditions/Toggles:** Optional; improves copy relevance

---

- **Feature Name:** Industry / Niche Selector
- **Description:** Business industry for AI contextual awareness
- **Inputs:** Dropdown — SaaS, Health, Real Estate, E-commerce, Education, Hospitality, Finance, Nonprofit, Other
- **Outputs:** formState.industryNiche
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Reader Funnel Stage Selector
- **Description:** Which stage of the buyer journey the content targets
- **Inputs:** Dropdown — Awareness, Consideration, Decision, Retention, Re-activation
- **Outputs:** formState.readerFunnelStage
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Reader Sophistication Level Selector
- **Description:** Target reader's knowledge/expertise level
- **Inputs:** Dropdown — Beginner, Intermediate, Advanced, Expert
- **Outputs:** formState.readerSophistication; affects technical depth and jargon use
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Target Audience Pain Points Field
- **Description:** Specific problems or pain points the audience experiences
- **Inputs:** Free-form text (comma-separated or prose)
- **Outputs:** formState.targetAudiencePainPoints; sent to AI for problem-focused messaging
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Key Message Field
- **Description:** Primary value proposition or core message
- **Inputs:** Free-form text
- **Outputs:** formState.keyMessage; sent to AI as central theme
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Call-to-Action Field
- **Description:** Desired action for readers to take
- **Inputs:** Free-form text
- **Outputs:** formState.callToAction; included in all copy variations
- **Conditions/Toggles:** Optional; recommended for conversion-focused copy

---

- **Feature Name:** Desired Emotion Field
- **Description:** Emotional response to trigger in the reader
- **Inputs:** Free-form text (emotion names)
- **Outputs:** formState.desiredEmotion; guides emotional tone
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Brand Values Field
- **Description:** Core brand values to reflect in generated copy
- **Inputs:** Free-form text (comma-separated)
- **Outputs:** formState.brandValues
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Keywords Field
- **Description:** Target keywords for SEO integration
- **Inputs:** Free-form text (comma-separated keywords)
- **Outputs:** formState.keywords; formState.keywordsExplicit = true on manual edit; triggers SEO dimension in scoring when populated
- **Conditions/Toggles:** Optional; auto-detected from other fields if not manually entered; seoActive flag set when valid keywords present

---

- **Feature Name:** Context / Additional Background Field
- **Description:** Any supplementary context for copy generation
- **Inputs:** Multi-line text area
- **Outputs:** formState.context; sent to AI as supplementary background
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Competitor URLs Field
- **Description:** Competitor website URLs for differentiation guidance
- **Inputs:** Free-form text (comma-separated URLs)
- **Outputs:** formState.competitorUrls array
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Competitor Copy Text Field
- **Description:** Competitor copy pasted directly for differentiation context
- **Inputs:** Multi-line text area
- **Outputs:** formState.competitorCopyText
- **Conditions/Toggles:** Optional; alternative to providing competitor URLs

---

- **Feature Name:** Preferred Writing Style Selector
- **Description:** Overall narrative/writing approach
- **Inputs:** Dropdown — Persuasive, Conversational, Informative, Storytelling
- **Outputs:** formState.preferredWritingStyle
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Language Style Constraints (Multi-Select)
- **Description:** Hard constraints on language patterns to enforce or avoid
- **Inputs:** Checkboxes — Avoid passive voice, No idioms, Avoid jargon, Short sentences
- **Outputs:** formState.languageStyleConstraints array; each selected constraint injected into AI prompt
- **Conditions/Toggles:** Optional; multiple selection allowed

---

- **Feature Name:** Excluded Terms Field
- **Description:** Words, phrases, or competitor names to explicitly exclude from generated copy
- **Inputs:** Multi-line text area (comma-separated)
- **Outputs:** formState.excludedTerms; sent to AI as explicit exclusion list
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Special Instructions Field
- **Description:** Free-form override instructions with highest priority in all prompts
- **Inputs:** Multi-line text area
- **Outputs:** formState.specialInstructions; appended as HIGHEST PRIORITY block in every system prompt
- **Conditions/Toggles:** Optional; overrides any conflicting default behavior; also scanned for zone structure labels

---

- **Feature Name:** Output Structure Configuration
- **Description:** Define section-by-section layout for structured copy output
- **Inputs:** Array of StructuredOutputElement — each has value (problem, solution, features, etc.), label, optional per-section wordCount
- **Outputs:** formState.outputStructure array; guides AI to produce named sections
- **Conditions/Toggles:** Optional; enables structured multi-section copy output

---

- **Feature Name:** Include Section Titles Toggle
- **Description:** Toggle auto-generation of AI-written section titles for structured output
- **Inputs:** Checkbox toggle (default: true)
- **Outputs:** formState.includeSectionTitles
- **Conditions/Toggles:** Only applies when outputStructure is configured

---

- **Feature Name:** Page Type Selector
- **Description:** Which type of web page the copy is for
- **Inputs:** Dropdown — Homepage, About, Services, Contact, Other
- **Outputs:** formState.pageType
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Section Selector
- **Description:** Which section of the page the copy targets
- **Inputs:** Free-form text or dropdown — Hero Section, Benefits, Features, Services, About, Testimonials, FAQ, Full Copy, Other
- **Outputs:** formState.section
- **Conditions/Toggles:** Optional

---

- **Feature Name:** Generate Headlines Toggle
- **Description:** Enable headline variant generation alongside copy
- **Inputs:** Checkbox toggle
- **Outputs:** formState.generateHeadlines; triggers HeadlineIdeas generation pipeline
- **Conditions/Toggles:** On-demand or auto-generate on completion

---

- **Feature Name:** Generate Scores Toggle
- **Description:** Enable multi-dimension scoring for all generated versions
- **Inputs:** Checkbox toggle
- **Outputs:** formState.generateScores; activates scoring pipeline on completion
- **Conditions/Toggles:** Performance-intensive; affects generation time

---

- **Feature Name:** Generate SEO Metadata Toggle
- **Description:** Enable SEO metadata generation for generated copy
- **Inputs:** Checkbox toggle
- **Outputs:** formState.generateSeoMetadata; activates SEO generation pipeline
- **Conditions/Toggles:** Unlocks SEO element count sub-fields

---

- **Feature Name:** Force Elaborations & Examples Toggle
- **Description:** Require concrete examples and detailed elaborations in generated copy
- **Inputs:** Checkbox toggle
- **Outputs:** formState.forceElaborationsExamples; modifies AI prompt to demand depth
- **Conditions/Toggles:** Optional; increases content length and specificity

---

- **Feature Name:** Force Keyword Integration Toggle
- **Description:** Guarantee target keywords appear naturally in copy
- **Inputs:** Checkbox toggle (only available when keywords field populated)
- **Outputs:** formState.forceKeywordIntegration; adds keyword enforcement rule to prompt
- **Conditions/Toggles:** Requires keywords field

---

- **Feature Name:** AI Engine Selector (Claude vs OpenAI)
- **Description:** Select which LLM provider to use for generation
- **Inputs:** Radio/toggle — Claude, OpenAI
- **Outputs:** formState.aiEngine ('claude' or 'openai'); also updates legacy formState.model field via migrateModelToEngine
- **Conditions/Toggles:** Default: Claude

---

- **Feature Name:** GEO Enhancement Toggle
- **Description:** Activate GEO content optimization mode
- **Inputs:** Checkbox toggle
- **Outputs:** formState.enhanceForGEO; unlocks TL;DR toggle and geoRegions field; activates GEO scoring
- **Conditions/Toggles:** Gates sub-options: addTldrSummary and geoRegions

---

- **Feature Name:** Add TL;DR Summary Toggle
- **Description:** Prepend one-sentence TL;DR to all generated content
- **Inputs:** Checkbox toggle
- **Outputs:** formState.addTldrSummary
- **Conditions/Toggles:** Gated behind enhanceForGEO; not applied to structured output

---

- **Feature Name:** AI Detection Avoidance Toggle
- **Description:** Apply anti-detection techniques during humanized copy generation
- **Inputs:** Checkbox toggle
- **Outputs:** formState.noAIDetection; applies sentence variation, filler phrases, conversational patterns
- **Conditions/Toggles:** Only affects humanized copy pipeline; does not affect other generation

---

- **Feature Name:** GEO Regions Field
- **Description:** Target geographic regions for location-specific content optimization
- **Inputs:** Free-form text (comma-separated regions/countries)
- **Outputs:** formState.geoRegions; passed to GEO scoring and content enhancement
- **Conditions/Toggles:** Only visible when enhanceForGEO enabled

---

- **Feature Name:** URL Slug Count Field
- **Description:** Number of URL slug variants to generate (1–5)
- **Inputs:** Numeric input, default 1
- **Outputs:** formState.numUrlSlugs
- **Conditions/Toggles:** Only when generateSeoMetadata enabled

---

- **Feature Name:** Meta Description Count Field
- **Description:** Number of meta description variants (1–5)
- **Inputs:** Numeric input, default 1
- **Outputs:** formState.numMetaDescriptions; 160 char limit per variant
- **Conditions/Toggles:** Only when generateSeoMetadata enabled

---

- **Feature Name:** H1 Variant Count Field
- **Description:** Number of H1 heading variants (1–5)
- **Inputs:** Numeric input, default 1
- **Outputs:** formState.numH1Variants; 60 char limit per variant
- **Conditions/Toggles:** Only when generateSeoMetadata enabled

---

- **Feature Name:** H2 Count Field
- **Description:** Number of H2 heading variants (1–10, default 2)
- **Inputs:** Numeric input
- **Outputs:** formState.numH2Variants; 70 char limit per heading
- **Conditions/Toggles:** Only when generateSeoMetadata enabled

---

- **Feature Name:** H3 Count Field
- **Description:** Number of H3 heading variants (1–10, default 2)
- **Inputs:** Numeric input
- **Outputs:** formState.numH3Variants; 70 char limit per heading
- **Conditions/Toggles:** Only when generateSeoMetadata enabled

---

- **Feature Name:** OG Title Count Field
- **Description:** Number of Open Graph title variants (1–5, default 1)
- **Inputs:** Numeric input
- **Outputs:** formState.numOgTitles; 60 char limit
- **Conditions/Toggles:** Only when generateSeoMetadata enabled

---

- **Feature Name:** OG Description Count Field
- **Description:** Number of Open Graph description variants (1–5, default 1)
- **Inputs:** Numeric input
- **Outputs:** formState.numOgDescriptions; 110 char limit
- **Conditions/Toggles:** Only when generateSeoMetadata enabled

---

- **Feature Name:** AI Engine Mode Selector (Legacy / Enhanced / Both)
- **Description:** Select which generation pipeline to use
- **Inputs:** Dropdown/radio — 'legacy', 'enhanced' (CopyZap+), 'both' (compare pipelines)
- **Outputs:** formState.aiEngineMode; routes generation to correct pipeline
- **Conditions/Toggles:** Advanced users; affects full generation flow

---

- **Feature Name:** Number of Variants Field
- **Description:** How many variants to generate in batch mode
- **Inputs:** Numeric input (1–10, default 3)
- **Outputs:** formState.numberOfVariants
- **Conditions/Toggles:** Only visible when createVariants toggle is enabled

---

---

## 3. Evaluation & Scoring Features

- **Feature Name:** Comprehensive Scoring v5 Architecture
- **Description:** Multi-dimensional LLM-evaluated scoring with context-aware weighting and BOLT patch reliability layer
- **Inputs:** Content, scoring context (UseCaseKey, seoActive, keyword count), content hash
- **Outputs:** finalScore (0–100), dimensionScores, winner determination
- **Conditions/Toggles:** Version 5 scoring engine; BOLT patch v1.1 retry layer; 6000 char content sanitization limit applied before scoring

---

- **Feature Name:** Per-Version Absolute Scoring (No Cross-Contamination)
- **Description:** Each version is scored independently; cache keys prevent score reuse across different contexts
- **Inputs:** Single version content, contextKey (seoActive + keywordsSignature + form context hash)
- **Outputs:** Independent score per version
- **Conditions/Toggles:** Cache key includes SEO status and keywords signature; changing context invalidates cache

---

- **Feature Name:** Dimension Weighting System
- **Description:** Dynamic weighting of scoring dimensions based on use case context
- **Inputs:** UseCaseKey, content characteristics, form state
- **Outputs:** Weighted contribution per dimension in finalScore
- **Conditions/Toggles:** Weights differ by use case; Context-aware; not exposed to user

---

- **Feature Name:** v5 Scoring Dimensions
- **Description:** Seven to eight distinct scoring criteria evaluated per version
- **Inputs:** Generated content evaluated against each dimension
- **Outputs:** Per-dimension scores — Clarity (merged with readability), Persuasiveness (context-aware), Audience-Tone Alignment (25% weight), Differentiation (10%), Trust (10%), Tone Match, Engagement, SEO (conditional — only counts when valid keywords provided)
- **Conditions/Toggles:** SEO dimension excluded from finalScore unless seoActive; v5 calibrated weights

---

- **Feature Name:** Language Register Detection (Spanish)
- **Description:** Auto-detect appropriate formal (usted) vs informal (tú) register in Spanish content
- **Inputs:** Spanish language content, tone setting
- **Outputs:** Score adjustment based on register appropriateness
- **Conditions/Toggles:** Spanish language only; automatic

---

- **Feature Name:** Numerical Claims Validation
- **Description:** Detect and penalize unsourced or fabricated statistics in generated content
- **Inputs:** Generated content text
- **Outputs:** Trust score reduction if unsourced numerical claims detected
- **Conditions/Toggles:** Automatic; part of Trust dimension scoring

---

- **Feature Name:** Word Count Accuracy Score Dimension
- **Description:** Score how closely generated content matches the target word count
- **Inputs:** Actual word count, targetWordCount
- **Outputs:** wordCountAccuracy percentage (0–100); separate from quality scoring
- **Conditions/Toggles:** Automatic when targetWordCount set

---

- **Feature Name:** Score Trace Audit System
- **Description:** Production diagnostic tool to inspect per-version scoring execution details
- **Inputs:** localStorage.setItem('copyzap_scoreTrace', '1') to enable
- **Outputs:** window.__copyzapScoreTrace — VariantTraceEntry per version: execution flow, parse status, retry count, fallback detection, final scores
- **Conditions/Toggles:** Hidden; disabled by default; must be manually enabled via localStorage

---

- **Feature Name:** Comparison Delta Calculation
- **Description:** Calculate score difference between any version and the baseline or winner
- **Inputs:** Version finalScore, baseline or winner finalScore
- **Outputs:** deltaPoints (absolute), deltaPercent (relative)
- **Conditions/Toggles:** Automatic when multiple scored versions compared

---

- **Feature Name:** Evidence Anchoring System
- **Description:** Link score justifications to specific text citations from the content
- **Inputs:** Scoring explanation text, content text
- **Outputs:** Evidence array with quoted citations supporting each dimension score
- **Conditions/Toggles:** v3+ feature; evidence validity guard prevents unsupported/hallucinated citations

---

- **Feature Name:** Rankings Snapshot
- **Description:** All versions ranked by finalScore with delta vs. best
- **Inputs:** All rankingRows (versionId, optionLabel, finalScore, deltaVsBest, isWinner)
- **Outputs:** Ranked list with score, rank position, delta, winner indicator
- **Conditions/Toggles:** Always shown in comprehensive comparison view

---

- **Feature Name:** Decision Badges (Heuristic)
- **Description:** Badge labels summarizing why a version won or lost — display-only, non-authoritative
- **Inputs:** Version heuristic subscores (conversion, trust, risk)
- **Outputs:** Badge type and label — e.g., "Best Persuasiveness", "Highest Trust", "Risky Language", "Balanced", "Best Overall"
- **Conditions/Toggles:** Derived from heuristic scores; not from authoritative scoring engine; display-only

---

- **Feature Name:** Scoring Context Display Badge
- **Description:** Show what scoring context was active (use case, SEO status, keyword count, scoring version)
- **Inputs:** Active scoring context metadata object
- **Outputs:** Small badge visible below comparison showing context details
- **Conditions/Toggles:** Always visible in comparison section

---

---

## 4. Workflow & Automation Features

- **Feature Name:** Quick Setup Wizard
- **Description:** Multi-step guided wizard for first-time users or fast project setup
- **Inputs:** Multi-step progressive form (business type, copy purpose, audience, tone, etc.)
- **Outputs:** Pre-populated formState ready for generation
- **Conditions/Toggles:** Optional; can skip to full form; URL analysis can pre-fill wizard steps

---

- **Feature Name:** Quick Polish Mode
- **Description:** Simplified one-step rapid copy improvement mode with minimal configuration
- **Inputs:** Business description or original copy only; smart defaults for all other fields
- **Outputs:** Improved copy quickly with basic scoring
- **Conditions/Toggles:** Mode toggle; hides all advanced fields; uses smart defaults

---

- **Feature Name:** Form Mode Toggle (Quick / Standard / Advanced)
- **Description:** Three-tier form complexity selector
- **Inputs:** Mode selection
- **Outputs:** Field visibility set by mode; Quick hides most fields; Advanced shows all
- **Conditions/Toggles:** isFieldVisible function checks mode; affects form complexity

---

- **Feature Name:** Workflow Builder
- **Description:** Visual tool for creating named multi-step copy generation workflows
- **Inputs:** Workflow name, description, ordered steps array with step type and configuration per step
- **Outputs:** Workflow object stored in database with steps, metadata, permissions
- **Conditions/Toggles:** Authenticated users; supports versioning

---

- **Feature Name:** Workflow Steps
- **Description:** Individual operations within a workflow sequence
- **Inputs:** Step type, step parameters, step dependencies
- **Outputs:** Step execution result passed to next step
- **Conditions/Toggles:** Sequential execution; multiple step types (generate, score, improve, etc.)

---

- **Feature Name:** Workflow Execution Engine
- **Description:** Automated execution of all steps in a workflow
- **Inputs:** Workflow ID, initial formState
- **Outputs:** Aggregated results from all steps; workflowGenerated flag set on outputs
- **Conditions/Toggles:** Supports error recovery; step-level retry logic

---

- **Feature Name:** Workflow Sharing / Permissions
- **Description:** Share workflows with specific users with edit or view-only access
- **Inputs:** Workflow ID, target user ID, permission level (edit / view)
- **Outputs:** Shared access record; can_edit flag per user
- **Conditions/Toggles:** RLS enforced at database level

---

- **Feature Name:** Public Workflows
- **Description:** Publish a workflow for discovery without explicit sharing
- **Inputs:** Workflow ID, is_public = true
- **Outputs:** Workflow discoverable and usable by all users
- **Conditions/Toggles:** is_public toggle; admin-controllable

---

- **Feature Name:** Enhanced Pipeline — Input Expansion
- **Description:** Pre-generation step that expands concise user inputs into enriched context
- **Inputs:** User form inputs (businessDescription, keywords, etc.)
- **Outputs:** Expanded richer context passed to generation prompt
- **Conditions/Toggles:** Enhanced pipeline only (aiEngineMode = 'enhanced'); automatic

---

- **Feature Name:** Enhanced Pipeline — Output Refinement
- **Description:** Post-generation step that validates and refines output against constraints
- **Inputs:** Generated copy, output constraints from form state
- **Outputs:** Refined, constraint-validated copy
- **Conditions/Toggles:** Enhanced pipeline only; automatic

---

- **Feature Name:** Content Refinement (Word Count Retry Loop)
- **Description:** Iteratively revise copy until word count target is met
- **Inputs:** Generated copy, targetWordCount, wordCountTolerancePercentage, prioritizeWordCount flag
- **Outputs:** Revised copy meeting word count target within tolerance
- **Conditions/Toggles:** Only runs when prioritizeWordCount = true; maximum iteration limit

---

- **Feature Name:** URL-Driven Pre-Fill Flow
- **Description:** Analyze a URL and use extracted data to auto-populate form fields
- **Inputs:** URL entered in wizard or form; analysis mode selection
- **Outputs:** Form fields populated with extracted data (audience, tone, features, benefits, etc.)
- **Conditions/Toggles:** Triggered from URL input field in wizard or Quick Polish mode

---

---

## 5. Output & Export Features

- **Feature Name:** Copy Output Card
- **Description:** Display panel for each generated copy version
- **Inputs:** Content text, card title, targetWordCount, isLoading state
- **Outputs:** Rendered copy with actual word count, accuracy percentage, copy-to-clipboard button, on-demand generation buttons
- **Conditions/Toggles:** Always shown for any generated content; animated loading state

---

- **Feature Name:** Word Count Accuracy Display
- **Description:** Visual word count accuracy indicator per output card
- **Inputs:** Actual word count, targetWordCount
- **Outputs:** Color-coded accuracy display — Perfect (<10 words off), Good (10–50 off), Acceptable (<20% variance), Needs Improvement (>20% variance)
- **Conditions/Toggles:** Always calculated when target set

---

- **Feature Name:** Markdown Rendering (FormattedContent)
- **Description:** Render copy content with full markdown formatting
- **Inputs:** Content string with markdown syntax
- **Outputs:** Styled HTML with paragraph breaks, bold, italic, links, lists
- **Conditions/Toggles:** FormattedContent component; stripMarkdown utility for plain text copy

---

- **Feature Name:** Structured Copy Output Display
- **Description:** Display structured copy with headline and named sections
- **Inputs:** StructuredCopyOutput — headline string and sections array (title, content, listItems)
- **Outputs:** Formatted display with headline, section titles, content blocks, list items
- **Conditions/Toggles:** Automatic detection and rendering when structure detected in output

---

- **Feature Name:** Headline Ideas Display
- **Description:** Render list of AI-generated headline alternatives
- **Inputs:** headlines array (strings)
- **Outputs:** Grid/list display of headline options
- **Conditions/Toggles:** Shown only when headlines were generated

---

- **Feature Name:** Score Card Component
- **Description:** Multi-dimension score breakdown display
- **Inputs:** ScoreData (overall, clarity, persuasiveness, toneMatch, engagement, wordCountAccuracy, improvementExplanation, suggestions)
- **Outputs:** Circular overall score badge, dimension grid, improvement tips list
- **Conditions/Toggles:** Shown when scores available; animated loading state during scoring

---

- **Feature Name:** Multi-Score Chips (Conversion / Trust / Risk)
- **Description:** Compact display of three heuristic subscores — non-authoritative display only
- **Inputs:** Content text, showExplanation flag
- **Outputs:** Three colored chips with scores; expandable "+/- reasons" per dimension
- **Conditions/Toggles:** Always shown in comparison; explicitly non-authoritative; does not affect rankings

---

- **Feature Name:** Multi-Score Explanation Panel
- **Description:** Expanded breakdown of why heuristic subscores were assigned
- **Inputs:** Detailed score reasons per dimension
- **Outputs:** Panel showing positive and negative reasons for Conversion, Trust, and Risk
- **Conditions/Toggles:** "Why?" button toggle; inline expansion

---

- **Feature Name:** Winner Hero Card
- **Description:** Prominent hero display of the winning version after comparison
- **Inputs:** Winner row data, finalRecommendation, priorityActions, scoringGap
- **Outputs:** Large card — winner name, score, recommendation text, priority action summary
- **Conditions/Toggles:** First element in comprehensive comparison view; links to winning copy card

---

- **Feature Name:** Rankings Snapshot Table
- **Description:** All versions ranked by score with delta indicators
- **Inputs:** rankingRows array
- **Outputs:** Ranked table — rank, version label, score, delta vs best, winner marker
- **Conditions/Toggles:** Always shown in comparison view

---

- **Feature Name:** Version Analysis Card (Expandable)
- **Description:** Expandable card per version with narrative deep analysis
- **Inputs:** Version row, deepAnalysis data, delta vs baseline, decision badge
- **Outputs:** Expandable card — metadata, analysis summary, keyStrengths, suggestedImprovements, strategicRecommendation
- **Conditions/Toggles:** Lazy-loads analysis on expand; on-demand deep analysis generation; "Expand All / Collapse All" control

---

- **Feature Name:** Comparison Table (Markdown-Parsed)
- **Description:** Parse and render a comparison table from markdown with colored score cells
- **Inputs:** Markdown table string, cards array for anchor link mapping
- **Outputs:** HTML table with hover effects, per-row anchor links to version cards
- **Conditions/Toggles:** Automatic detection of table syntax in comparison output

---

- **Feature Name:** On-Demand SEO Generation Buttons
- **Description:** Per-output inline buttons to generate SEO metadata on demand
- **Inputs:** Content, form state, SEO element selection
- **Outputs:** SEO metadata generated and shown for that specific output
- **Conditions/Toggles:** Available on each output card; shows loading state during generation

---

- **Feature Name:** Copy to Clipboard
- **Description:** One-click copy of any output content
- **Inputs:** Content text
- **Outputs:** Clipboard updated; "Copied!" visual confirmation for 2 seconds
- **Conditions/Toggles:** Available on all output cards

---

- **Feature Name:** Form Export as JSON
- **Description:** Download current form configuration as a JSON file
- **Inputs:** Current formState
- **Outputs:** JSON file download; filename includes timestamp and user email
- **Conditions/Toggles:** All settings included except session metadata

---

- **Feature Name:** Form Import from JSON
- **Description:** Load a previously exported form configuration from JSON file
- **Inputs:** JSON file selection
- **Outputs:** formState populated from file; isLoading, isEvaluating, session fields reset
- **Conditions/Toggles:** JSON validation required

---

- **Feature Name:** Copy All Results as Markdown Export
- **Description:** Export all generated results as a single formatted markdown document
- **Inputs:** All generated content, scores, metadata
- **Outputs:** Markdown document with headers, version sections, score tables, suggestion lists
- **Conditions/Toggles:** Export button in results header area

---

- **Feature Name:** HTML Export (LLM Evaluation)
- **Description:** Export full LLM evaluation results as a styled HTML document
- **Inputs:** Comparison results, deep analysis data, scores
- **Outputs:** Standalone HTML file with full evaluation content
- **Conditions/Toggles:** Available after comparison; enhanced export utilities

---

- **Feature Name:** Session Saving to Database
- **Description:** Persist the full generation session to Supabase
- **Inputs:** formState, all GeneratedContentItems, user context, sessionId
- **Outputs:** Session record in database; sessionId stored for retrieval
- **Conditions/Toggles:** Automatic on completion or manual save

---

- **Feature Name:** Saved Outputs (Favorites / History)
- **Description:** Save individual outputs to a personal library for later access
- **Inputs:** Generated content item, isFavorite flag, savedMode label
- **Outputs:** Saved output record in pmc_saved_outputs table
- **Conditions/Toggles:** isFavorite flag (added in migration 20260108); savedMode field tracks which mode generated it

---

---

## 6. UI / UX Functional Features

- **Feature Name:** Sticky Results Navigation Bar (StickyResultsNav)
- **Description:** Persistent header visible while scrolling through results with quick-jump links
- **Inputs:** Winner label, version count
- **Outputs:** Fixed navigation bar with section links and smooth scroll behavior
- **Conditions/Toggles:** Always visible during results view

---

- **Feature Name:** Floating Action Bar (Right)
- **Description:** Right-side floating button group for quick actions while scrolling
- **Inputs:** Scroll position, available actions
- **Outputs:** Floating buttons — save, export, compare, generate
- **Conditions/Toggles:** Appears on scroll; auto-hides on scroll down; re-appears on scroll up

---

- **Feature Name:** Left Floating Action Bar
- **Description:** Left-side alternative floating action bar
- **Inputs:** Available actions, viewport dimensions
- **Outputs:** Left-positioned floating action buttons
- **Conditions/Toggles:** Context-dependent display

---

- **Feature Name:** Floating Output Navigation
- **Description:** Jump navigation between output sections
- **Inputs:** Available output sections
- **Outputs:** Navigation buttons for each section — Improved, Alternative, Humanized, Headlines, SEO
- **Conditions/Toggles:** Updates dynamically as outputs are generated

---

- **Feature Name:** Collapsible Form Section Panels
- **Description:** Accordion-style collapse/expand for form sections
- **Inputs:** Section key, user toggle
- **Outputs:** Section shown or hidden; filled field count shown when collapsed
- **Conditions/Toggles:** State preserved during session

---

- **Feature Name:** Field Visibility by Mode
- **Description:** Show or hide fields based on active form mode (Quick / Standard / Advanced)
- **Inputs:** Current formMode, field key
- **Outputs:** Field visible or hidden
- **Conditions/Toggles:** isFieldVisible utility function; Quick mode hides most optional fields

---

- **Feature Name:** Template Pre-Fill Indicator Badge
- **Description:** Small badge marking fields that were auto-populated by a template
- **Inputs:** templatePrefilledFields array
- **Outputs:** Badge shown on each templated field
- **Conditions/Toggles:** Cleared when user manually edits field

---

- **Feature Name:** Required Field Indicator
- **Description:** Visual asterisk/highlight on required fields
- **Inputs:** Field required status
- **Outputs:** RequiredFieldIndicator component shown
- **Conditions/Toggles:** Required fields: projectDescription, productServiceName, businessDescription or originalCopy

---

- **Feature Name:** Placeholder Field Highlight
- **Description:** Visual indicator when a field still contains placeholder text not yet edited
- **Inputs:** fieldsWithPlaceholders array
- **Outputs:** Special styling on placeholder fields; PlaceholderWarningModal on generate attempt
- **Conditions/Toggles:** Auto-cleared on user edit; PlaceholderWarningModal offers continue-anyway option

---

- **Feature Name:** Word Counter (Real-Time)
- **Description:** Live word count display below long text fields
- **Inputs:** Field content string
- **Outputs:** Word count number updating as user types
- **Conditions/Toggles:** Active on businessDescription and originalCopy fields

---

- **Feature Name:** Character Counter
- **Description:** Character count display for fields with character limits
- **Inputs:** Field content string, limit value
- **Outputs:** Current character count; color-coded warning near limit
- **Conditions/Toggles:** Applied to SEO metadata fields (meta description, OG fields, etc.)

---

- **Feature Name:** Suggestion Button + Suggestion Modal
- **Description:** Per-field button that fetches AI suggestions and shows them in a modal for selection
- **Inputs:** Field type, current form context
- **Outputs:** SuggestionModal with AI-generated suggestions list; click to insert into field
- **Conditions/Toggles:** On-demand; one suggestion fetch per field; loading state shown

---

- **Feature Name:** AI Model Validation Modal
- **Description:** Modal shown when selected model is unavailable
- **Inputs:** Selected model, validation error message, available models list
- **Outputs:** Modal with error explanation and clickable alternative model options
- **Conditions/Toggles:** Triggered by validateApiKey failure

---

- **Feature Name:** Generation Progress Messages
- **Description:** Real-time step-by-step progress text during generation
- **Inputs:** Progress message callback from generation pipeline
- **Outputs:** Live updating progress text (e.g., "Generating alternative copy...", "Scoring version 2...")
- **Conditions/Toggles:** Progressive updates; shown in loading overlay

---

- **Feature Name:** Animated Loading Spinner / Gradient Spinner
- **Description:** Visual loading indicator during any async operation
- **Inputs:** isLoading boolean
- **Outputs:** Animated spinner component
- **Conditions/Toggles:** Used for generation, scoring, URL analysis, deep analysis

---

- **Feature Name:** Bulk Generation Progress Bar
- **Description:** Progress bar for batch operations with count display
- **Inputs:** done count, total count
- **Outputs:** Progress bar + "X of Y complete" text; modal overlay for bulk deep analysis generation
- **Conditions/Toggles:** Shown for batch operations

---

- **Feature Name:** On-Demand Content Generation Buttons (Per Card)
- **Description:** Inline buttons on each output card to generate related content on demand
- **Inputs:** Version data, content type to generate
- **Outputs:** Triggers specific generation (alternative, humanized, score, SEO, etc.) for that card
- **Conditions/Toggles:** Per-card; shows loading state during generation; result appended to card

---

- **Feature Name:** Context Changed Banner
- **Description:** Amber warning banner when scoring context has changed after scoring was last run
- **Inputs:** contextChanged flag, pendingContextLabel
- **Outputs:** Amber banner with "Apply new context & re-score all" action button
- **Conditions/Toggles:** Appears when context changes; dismissed by re-running comparison

---

- **Feature Name:** Comparison Outdated Banner
- **Description:** Amber warning banner when a version was edited after comparison was run
- **Inputs:** comparisonOutdated flag
- **Outputs:** Amber banner with "Re-score with updated changes" action button
- **Conditions/Toggles:** Appears on version edit after scoring

---

- **Feature Name:** Missing Outputs Banner
- **Description:** Amber warning banner when new outputs exist that were not included in last comparison
- **Inputs:** missingCount integer
- **Outputs:** Amber banner with "Score & add new outputs" action button
- **Conditions/Toggles:** Appears when new outputs generated after last comparison

---

- **Feature Name:** All Analyses Ready Indicator
- **Description:** Green success badge when all deep analyses have been generated
- **Inputs:** allAnalysisGenerated boolean
- **Outputs:** Green badge with checkmark and "All analyses ready" label
- **Conditions/Toggles:** Shown after batch deep analysis completes

---

- **Feature Name:** Expand All / Collapse All Version Cards
- **Description:** Toggle all version analysis cards open or closed simultaneously
- **Inputs:** Button click
- **Outputs:** All VersionAnalysisCards expanded or collapsed
- **Conditions/Toggles:** Available in comprehensive comparison section

---

- **Feature Name:** Date / Time Display (Session Info)
- **Description:** Display session creation time, last updated time, and operation timestamps
- **Inputs:** Timestamps from session and operation records
- **Outputs:** Formatted date/time shown in session info and output metadata
- **Conditions/Toggles:** dateFormatting utility; shown in SessionInfo component

---

- **Feature Name:** Delta Indicators (Score Comparison)
- **Description:** Show +/- point difference between versions and winner/baseline
- **Inputs:** deltaPoints, deltaPercent values from comparison
- **Outputs:** Color-coded delta display (+X pts above baseline, -X pts below winner)
- **Conditions/Toggles:** Shown in rankings table and version analysis cards

---

- **Feature Name:** Debug Toggle (localStorage)
- **Description:** Enable verbose debug logging and extra debug controls in UI
- **Inputs:** localStorage.setItem('copyzap_debugCompare', '1')
- **Outputs:** Debug panel visible; extra console logging
- **Conditions/Toggles:** Hidden from normal users; developer use only

---

- **Feature Name:** Debug Info Modal
- **Description:** Modal showing technical session data, score traces, and execution logs
- **Inputs:** Session data, score trace entries, execution logs
- **Outputs:** Tabbed debug modal
- **Conditions/Toggles:** Only accessible when debug toggle is on

---

---

## 7. System / Hidden Features

- **Feature Name:** Session Tracking System
- **Description:** Every user workflow is assigned a UUID session that links all operations
- **Inputs:** User action (generation, scoring, save, etc.)
- **Outputs:** sessionId UUID; persisted in formState and Supabase sessions table
- **Conditions/Toggles:** Automatic; required for all tracked operations

---

- **Feature Name:** Session Persistence
- **Description:** Full session state saved to Supabase on generation completion
- **Inputs:** sessionId, formState, all GeneratedContentItems
- **Outputs:** Session record in database with all metadata; retrievable by ID
- **Conditions/Toggles:** Automatic on completion; manual save also available

---

- **Feature Name:** Session Fork / Clone
- **Description:** Load an existing session and modify it to create a new session
- **Inputs:** Existing sessionId, form modifications
- **Outputs:** New sessionId; new session record; loadedSessionName tracks fork origin
- **Conditions/Toggles:** loadedSessionName tracks rename/fork; prevents overwriting original

---

- **Feature Name:** Session Scope Key
- **Description:** Unique composite key per session identifying the generation context
- **Inputs:** sessionId, context factors
- **Outputs:** scope_key stored with session record
- **Conditions/Toggles:** Used for deduplication and cross-session linking

---

- **Feature Name:** Token Usage Tracking
- **Description:** Log every LLM API call's token consumption per user per model per operation
- **Inputs:** userId, token count, model, operation type constant, sessionId
- **Outputs:** Token usage record in pmc_tokens_used table
- **Conditions/Toggles:** Mandatory; failure to track logs an error; tracks input_tokens and output_tokens separately

---

- **Feature Name:** Model-Specific Token Attribution
- **Description:** Attribute token usage to the actual model used, not the requested model
- **Inputs:** data.model_used from API response
- **Outputs:** Token record with correct actual model name
- **Conditions/Toggles:** Handles fallback routing attribution correctly

---

- **Feature Name:** Credits Balance System
- **Description:** User credit balance calculated from token usage history and plan allocation
- **Inputs:** userId, token usage history
- **Outputs:** creditsAllowed, creditsRemaining via get_user_credits_balance RPC
- **Conditions/Toggles:** Polled on window focus and every 5 minutes; displayed in header

---

- **Feature Name:** Content Hash Caching (Score Cache)
- **Description:** Cache scoring results by content fingerprint to avoid redundant LLM scoring calls
- **Inputs:** Content text hash, contextKey (seoActive + keywordsSignature + form hash)
- **Outputs:** Cached ScoreData returned if content + context key matches
- **Conditions/Toggles:** Cache invalidated on content edit or context change; versionScoreCache utility

---

- **Feature Name:** Placeholder Detection System
- **Description:** Detect which form fields still contain unedited placeholder text
- **Inputs:** formState values compared against known placeholder values
- **Outputs:** fieldsWithPlaceholders array in formState
- **Conditions/Toggles:** Recalculated on form changes; cleared field-by-field on user edit; triggers PlaceholderWarningModal on generate

---

- **Feature Name:** Optimization Restore Policy
- **Description:** Rules governing when optimization flags and placeholder markers are cleared or restored
- **Inputs:** Field edit events, restore policy configuration
- **Outputs:** fieldsWithPlaceholders updated; optimization flags reset appropriately
- **Conditions/Toggles:** Prevents premature clearing of placeholder indicators; optimizationRestorePolicy utility

---

- **Feature Name:** Zone Structure Detection
- **Description:** Detect named zone labels (e.g., "Zona 1 —", "Zona 2 —") in copy for structure-preserving generation
- **Inputs:** Copy content text, specialInstructions text
- **Outputs:** hasZoneStructure boolean, zoneLabels array
- **Conditions/Toggles:** detectZoneLabels function; dual-source scan (copy body + specialInstructions); when detected, zone preservation hard rules injected into prompts for Alternative Copy, Voice Restyle, and Performance Boost

---

- **Feature Name:** LLM API Fallback Routing
- **Description:** Automatic model fallback when primary model fails or is unavailable
- **Inputs:** Selected model, request parameters
- **Outputs:** API response with model_used field showing actual model used
- **Conditions/Toggles:** makeApiRequestWithFallback function; automatic on failure; model_used tracked for billing

---

- **Feature Name:** JSON Response Cleaning
- **Description:** Extract valid JSON from LLM responses that include surrounding text or markdown
- **Inputs:** Raw LLM response string
- **Outputs:** Parsed JSON object
- **Conditions/Toggles:** cleanJsonResponse utility; strips markdown code fences, triple quotes, preamble text

---

- **Feature Name:** JSON Mode Enforcement
- **Description:** Force LLM to return structured JSON for all scoring and extraction calls
- **Inputs:** response_format: { type: "json_object" } in request parameters
- **Outputs:** Guaranteed JSON output from LLM
- **Conditions/Toggles:** Applied to all scoring, evaluation, SEO generation, and structured extraction prompts

---

- **Feature Name:** LLM Reliability Auto-Retry (BOLT Patch v1.1)
- **Description:** Retry loop for LLM refusals, empty responses, and JSON parse failures
- **Inputs:** Initial LLM response, maxAttempts = 3
- **Outputs:** Valid parsed response after retry; throws after max attempts
- **Conditions/Toggles:** Wraps all scoring and evaluation calls; exponential backoff; logs retry attempts to score trace

---

- **Feature Name:** Content Sanitization Limit (6000 chars)
- **Description:** Truncate content to prevent LLM context window overflow during scoring
- **Inputs:** Content text
- **Outputs:** Content truncated to ≤ 6000 characters
- **Conditions/Toggles:** Applied before all comprehensive scoring calls

---

- **Feature Name:** Copy Validation & Repair Prompt System
- **Description:** Validate generated copy output; if invalid, construct a repair prompt and retry
- **Inputs:** Generated copy, validation rules, failure reason, previous attempt
- **Outputs:** Repaired copy after retry; up to 3 repair attempts
- **Conditions/Toggles:** validateCopyMakerResult function; buildRepairPrompt constructs targeted fix instruction

---

- **Feature Name:** Model Registry
- **Description:** Central registry of all supported LLM models and their properties
- **Inputs:** Model ID string
- **Outputs:** Model metadata — provider, token limits, capabilities, display name
- **Conditions/Toggles:** modelRegistry map; migrateModelToEngine function converts legacy model strings to aiEngine value

---

- **Feature Name:** Model-Specific Prompt Engineering
- **Description:** Adapt prompt structure and instructions for each LLM's response characteristics
- **Inputs:** Selected model, base prompt content
- **Outputs:** Model-optimized system prompt
- **Conditions/Toggles:** Different implementations for Claude vs. OpenAI vs. DeepSeek models

---

- **Feature Name:** Heuristic vs. LLM Score Separation
- **Description:** Explicitly separate heuristic subscores (conversion, trust, risk) from authoritative LLM scoring
- **Inputs:** Content, scoring mode
- **Outputs:** Two independent score sets: authoritative finalScore (LLM), heuristic subscores (rule-based display-only)
- **Conditions/Toggles:** Heuristic scores shown in UI but explicitly excluded from ranking; documented as non-authoritative

---

- **Feature Name:** Scoring Safeguard — Testimonial / Social Proof Handling
- **Description:** Prevent penalizing copy for "unverified" testimonial content that is legitimately part of marketing
- **Inputs:** Content type, section type (testimonials)
- **Outputs:** Trust scoring adjustment to not penalize legitimate testimonial sections
- **Conditions/Toggles:** Context-aware scoring; section = 'Testimonials' signals to scoring system

---

- **Feature Name:** Markdown Stripping Utility
- **Description:** Remove all markdown formatting for word counting and plain-text operations
- **Inputs:** Markdown-formatted string
- **Outputs:** Plain text string
- **Conditions/Toggles:** stripMarkdown utility; used in word count calculation and plain-text clipboard copy

---

- **Feature Name:** Score Color Mapping System
- **Description:** Map 0–100 scores to color classes for visual representation
- **Inputs:** Numeric score
- **Outputs:** CSS class — red (0–50), orange (50–70), yellow (70–85), green (85–100)
- **Conditions/Toggles:** getScoreTextClass, getScoreBorderClass, getScoreColorClass functions

---

- **Feature Name:** Risk Level Color Mapping
- **Description:** Map risk level strings to CSS color and background classes
- **Inputs:** Risk level string (Low, Medium, High, Critical)
- **Outputs:** CSS color class and background class
- **Conditions/Toggles:** getRiskLevelColor, getRiskLevelBg functions

---

- **Feature Name:** Row-Level Security (RLS) Enforcement
- **Description:** Database-level access control on all tables
- **Inputs:** Authenticated user context, table query
- **Outputs:** Only authorized rows returned; unauthorized rows invisible
- **Conditions/Toggles:** Enabled on all tables; policies: own data + shared data + public data

---

- **Feature Name:** Admin-Only Data Access Functions
- **Description:** Secure RPC functions for admin-level user and token data access
- **Inputs:** Admin user context, target user/period parameters
- **Outputs:** Aggregated user credits summary, token usage stats
- **Conditions/Toggles:** get_admin_users_credits_summary RPC; harden_admin_rpc_security migration; requires app_admins table membership

---

- **Feature Name:** App Admins Allowlist
- **Description:** Separate allowlist table controlling who has admin-level access
- **Inputs:** User email
- **Outputs:** isAdmin boolean checked via app_admins table
- **Conditions/Toggles:** app_admins table (migration 20260210); replaces hardcoded email checks

---

- **Feature Name:** Free Trial System (30 Days)
- **Description:** New users receive 30-day free trial with credit allocation
- **Inputs:** New user registration event
- **Outputs:** Trial start date set; trial credits allocated; trial status tracked
- **Conditions/Toggles:** Migration 20260122; free trial tracked in pmc_users table

---

- **Feature Name:** Block Google OAuth Auto-Registration
- **Description:** Prevent new accounts from being created via Google OAuth (allow only email/password)
- **Inputs:** OAuth registration attempt
- **Outputs:** Registration blocked for new users via Google OAuth
- **Conditions/Toggles:** Migration 20260127; existing OAuth users unaffected

---

- **Feature Name:** Welcome Email Trigger
- **Description:** Automatically send welcome email to new users on account creation
- **Inputs:** New user auth event (trigger on auth.users insert)
- **Outputs:** Welcome email sent via send-welcome-email edge function
- **Conditions/Toggles:** Database trigger (migration 20260123); uses pg_net for HTTP call to edge function

---

- **Feature Name:** Session Cleanup System
- **Description:** Automatically clean up empty/orphaned sessions
- **Inputs:** Session records with no associated outputs
- **Outputs:** Empty sessions deleted on schedule
- **Conditions/Toggles:** Migration 20251127; scheduled cleanup function

---

- **Feature Name:** URL Analysis Cache
- **Description:** Cache URL analysis results to avoid re-scraping the same URL
- **Inputs:** URL string, analysis mode
- **Outputs:** Cached analysis result returned if same URL+mode was previously analyzed
- **Conditions/Toggles:** url_analysis_cache table (migration 20251029); TTL-based expiry

---

*End of Phase 1 — Raw Feature Inventory*
*Total: 170+ discrete features documented*
*Source: Full audit of 75+ source files*
*No summarization. No interpretation. No merging.*
