# CopyZap – Complete Feature Overview (Human-Readable)

**Status:** Pre-Testing Freeze
**Audience:** Non-technical users, stakeholders, onboarding
**Last Updated:** 2026-02-24T00:00:00 UTC
**Reference:** Derived from `07_CopyZap_Feature_Capability_Map.md` and `01_CopyZap_Operating_Manual_v1.0.md`

---

CopyZap is an AI copywriting workflow platform built to help you create marketing copy fast — from a blank brief to multiple ready-to-use drafts. Then, inside the same session, you can transform, refine, and optimize those drafts using guided tools, workflows, and rubric-based scoring to confidently choose your best version.

This document explains what CopyZap can do in plain language.

---

## Table of Contents

1. [Rapid Copy Creation](#1-rapid-copy-creation)
2. [Guided Creation – Quick Prompt Wizard](#2-guided-creation--quick-prompt-wizard)
3. [Copy Transformation and Refinement](#3-copy-transformation-and-refinement)
4. [Structured Optimization and Analysis](#4-structured-optimization-and-analysis)
5. [Workflow and Iteration System](#5-workflow-and-iteration-system)
6. [Language Capabilities](#6-language-capabilities)
7. [Models and Usage Control](#7-models-and-usage-control)
8. [What Makes CopyZap Different](#8-what-makes-copyzap-different)

---

## 1. Rapid Copy Creation

CopyZap's core job is generating high-quality marketing copy from a brief. Users describe what they're creating, who it's for, and what tone they want — and the system produces ready-to-use copy.

### Start Hub

Every session begins with the Start Hub, a launchpad that routes users into the right tool immediately. Instead of navigating menus, users choose one of three starting points:

- **Quick Setup Wizard** — a guided two-step process that asks the right questions and pre-fills the creation form
- **Direct to Copy Maker** — opens the full creation form at the user's preferred level of detail
- **Template Loader** — loads a previously saved setup so the user can reuse a proven configuration

The Start Hub can be bypassed for users who prefer to go straight to the form.

### Copy Maker

Copy Maker is the main creation workspace. Users fill out a brief — describing their product or service, their audience, the tone they want, and any constraints — and the AI generates marketing copy based on those inputs.

Copy Maker operates in three experience levels, allowing users to control how much detail they work with:

- **Quick mode** shows only the essential inputs — enough to generate solid copy without overwhelming the user
- **Standard mode** unlocks additional options including brand voice, keyword integration, SEO metadata generation, and audience pain points
- **Advanced mode** adds expert inputs such as funnel stage, reader sophistication level, industry niche, competitor copy, and emotional targeting

Users can switch between modes at any time without losing their work. The level of detail in the brief directly affects the quality and precision of the output.

### What Copy Maker Produces

After generating, the user receives one or more versions of copy. Depending on settings, these can include:

- The primary generated version
- An alternative version with a different approach or angle
- SEO metadata — URL slugs, meta descriptions, H1/H2/H3 variants, and Open Graph titles and descriptions
- A GEO (generative engine optimization) readiness score — measuring how well the copy is suited for AI-powered search results
- A TL;DR summary appended to the output
- FAQ JSON-LD structured data (if enabled)

All generated versions can be scored, labeled, and refined within the same session.

---

## 2. Guided Creation – Quick Prompt Wizard

The Quick Prompt Wizard is a guided two-step flow for users who prefer a structured starting point over a blank form. It asks focused questions and uses the answers to pre-fill Copy Maker automatically.

### Three Starting Modes

Users choose one of three modes at the start of the wizard:

- **Make New Copy** — collects the product description, audience, and goals, then generates copy from scratch
- **Improve Existing Copy** — accepts existing copy (typed in or extracted from a URL) and sets up the session to produce an improved version; SEO and GEO options are automatically activated
- **Quick Polish** — routes directly to the Quick Polish tool for fast intent-based rewrites (see Section 3)

### What the Wizard Asks

The wizard collects a short set of focused inputs across two steps: what is being created, who it is for, what problems the audience faces, what tone is appropriate, how long the output should be, and whether SEO or GEO features should be active.

AI suggestion buttons are available on the audience and pain points fields — users can let the AI suggest reasonable values based on what they've already entered.

### URL Analysis in the Wizard

When using the Improve Existing Copy mode, users can provide a URL instead of pasting copy manually. The wizard offers three ways to use that URL:

- **Analyze Context** — reads the page and extracts the audience profile, tone, and core message to pre-fill the wizard fields
- **Extract Copy** — pulls the actual copy from the page, including its structure (sections and approximate word counts), ready to be improved
- **Deep Crawl** — performs a more thorough multi-page analysis for sites where a single page doesn't capture the full picture

When a page structure is detected, the wizard shows a confirmation step where users can review and accept or discard the detected structure before proceeding.

### What Happens Next

After the wizard completes, Copy Maker opens with every field pre-filled based on the answers. Users can review the pre-filled form, make any adjustments, and then generate — or choose to generate immediately without reviewing the form at all.

---

## 3. Copy Transformation and Refinement

Beyond creating copy from scratch, CopyZap includes three distinct tools for working with existing text: CopySnap, Quick Polish, and Purpose Rewrite. Each is designed for a different kind of transformation job.

### CopySnap – Rapid Short-Text Transformation

CopySnap is designed for quick transformations of short pieces of text — up to around 2,000 characters. Users paste in existing copy and choose one of three transformation modes:

**Improve** rewrites the input to make it better. Users specify the goal (clearer, more persuasive, shorter, or punchier), the platform the copy will be used on (general, X/Twitter, LinkedIn, or email), and whether the output should be shorter, the same length, or longer. The result includes a best version, alternative options, and brief notes on the changes made.

**Answer** generates a reply or response to the input text, treating it as a message or comment to respond to. Users set the reply style (helpful, friendly, confident, witty, or direct), their stance (neutral, agree, or disagree), and the desired length. This is useful for drafting social replies, comment responses, or email replies.

**Question** generates questions based on the input — for clarifying, challenging, exploring, or converting. Users choose the type of question and whether they want 1, 3, or 5 questions returned.

CopySnap automatically detects the language of the input and responds in the same language. No language selection is needed.

### Quick Polish – Intent-Based Rewriting

Quick Polish rewrites short copy through the lens of a specific content intent. Instead of open-ended transformation, users select what type of copy they are improving, and the tool reshapes the text to match the best-practice pattern for that type.

There are eleven available intents:

- Hero headline and brand statement
- Call to action
- About section or bio
- Instagram caption
- Short ad copy
- Email opening
- Value proposition
- SEO snippet
- Website section body
- Short product or service description
- Problem or pain point statement

For each intent, users can optionally specify the target audience, the goal the copy should achieve, a call-to-action phrase, and any constraints. The tool returns one, two, or three rewritten variants for comparison.

Quick Polish does not add new claims — it improves and reshapes the copy the user provides.

### Purpose Rewrite

Purpose Rewrite applies precision rewriting to copy that needs to serve a specific declared purpose or page section, adapting the framing and structure while preserving the core message. This tool is best suited for content that needs to be repositioned — for example, reshaping a feature description into a benefit-focused narrative, or converting long-form copy into a concise CTA section.

---

## 4. Structured Optimization and Analysis

CopyZap includes a comprehensive evaluation layer that scores, compares, and analyzes generated versions so users can make informed decisions about which version to use.

### Copy Quality Scoring

Every generated version can be scored across six dimensions:

- **Marketing strength** — the hook, unique angle, and urgency of the copy
- **Clarity** — how well structured and easy to follow the copy is
- **Emotion** — how effectively the copy connects with the reader's feelings and motivations
- **CTA effectiveness** — how clear, specific, and action-driving the call to action is
- **Readability** — sentence length, flow, and avoidance of verbose or cluttered language
- **SEO** — keyword usage and placement (only measured when SEO is the declared purpose)

Each dimension is scored and weighted according to the type of copy being produced. A homepage hero is scored differently from a cold email, for example — the weights shift to reflect what matters most for each use case. An overall score summarizes the result.

Scores are directional signals designed to guide refinement decisions. They are not pass/fail grades and should be interpreted within the declared use case context.

### GEO Score (Generative Engine Optimization)

In addition to traditional copy scoring, CopyZap can evaluate how well copy is optimized for AI-powered search engines and large language model retrieval. This score measures factors like whether the copy gives direct, scannable answers, uses question-based headings, includes authority signals, and contains quotable standalone sentences.

### Comparison Table

When multiple versions are available, CopyZap displays a side-by-side comparison table showing each version's scores across all dimensions, how much each version differs from the best-performing one, and which version leads in each individual category. The winner is determined by overall score, with tiebreakers applied across individual dimensions.

### Deep Analysis

For users who want more than scores, CopyZap can generate a detailed narrative breakdown for any version — explaining what is working, what could be improved, and why one version outperforms another. This analysis can be generated individually or for all versions at once, with an overall verdict that synthesizes the comparison across the full set.

### Best Version Summary

After scoring and comparison, CopyZap surfaces a single recommended version with supporting evidence — identifying not just the overall winner but also which version is best for marketing punch, best for clarity, and best for simplicity. Users can use this to make a confident final decision.

### Scoring Framework Clarification

CopyZap uses a rubric-based scoring system.

Individual dimension scores are generated by an AI evaluator following fixed criteria and may vary slightly between runs.

However, weighting formulas, comparison rules, and winner determination logic are fully deterministic. The same version scores always produce the same comparison outcome.

Scoring is designed as a structured decision framework, not an absolute measure of truth.

---

## 5. Workflow and Iteration System

CopyZap is built around the idea that great copy rarely comes from a single generation pass. The platform provides a full iteration system for refining, reshaping, and combining versions after the initial output is created.

### Post-Generation Actions

Once copy is generated, users have several actions available on each version:

- **Apply Voices** — restyles a version using a saved brand voice profile or preset style, producing a new version that preserves the content but adapts the tone and personality
- **Generate Variations** — creates alternative versions from the same brief, exploring different angles or approaches
- **Modify** — allows the user to manually edit a version, with the edited state tracked separately from the original
- **Boost** — applies a targeted performance enhancement pass to improve the quality of an existing version; capped at two applications per version and disabled when the version is already near peak quality
- **Blend** — merges two selected versions into a single combined output that synthesizes the best elements of both

All of these actions produce new, trackable versions that appear alongside the originals in the output panel and can be scored and compared.

### Saved Workflows

Users can define multi-step automation sequences — called workflows — that run after initial copy is generated. A workflow might automatically generate an alternative version, apply a specific brand voice to it, and then run a full scoring and comparison — all in sequence with a single trigger.

Workflows can be:
- Built from scratch using the Workflow Builder
- Saved and reused across future sessions
- Shared with specific other users
- Marked as public by administrators to make them available to all users

Workflows save time on repeat processes and ensure consistent results across similar copy projects.

### Brand Voice System

CopyZap includes a Brand Voice system that stores named voice profiles. Each profile captures the tone, personality, style preferences, and language constraints of a specific brand. Once created, a brand voice can be applied to any generated version to produce a restyled output that stays on-brand.

Brand voices can be associated with customer profiles, so users who manage copy for multiple clients can keep each client's voice separate and easily accessible.

### Saved Outputs and Templates

Every generated version can be saved to the Saved Outputs library for future reference, export, or reuse. Users can also save the entire form configuration as a template — locking in the settings that produced a good result so the same setup can be loaded instantly for a future project.

---

## 6. Language Capabilities

CopyZap supports multilingual copy generation, though the depth of support varies by tool.

### Copy Maker

Copy Maker supports output in six languages: English, Spanish, French, German, Italian, and Portuguese. Users select the target language from a dropdown, and the AI generates output in that language. The platform interface itself remains in English regardless of the selected output language.

Reliable generation quality is guaranteed for English and Spanish only. French, German, Italian, and Portuguese are accepted, but output quality may vary depending on the complexity of the brief.

### CopySnap

CopySnap automatically detects the language of the input text and responds in the same language. Users do not need to select a language manually. Detection works across 13 languages including English, Spanish, French, German, Italian, Portuguese, Dutch, Russian, Japanese, Chinese, Korean, Arabic, and Hindi. Reliable output quality is guaranteed for English and Spanish; other languages are detected but output quality may vary depending on the complexity of the transformation.

### Quick Polish and Purpose Rewrite

These tools reliably support English and Spanish. Input in other languages is accepted but results may be inconsistent or unpredictable. There is no option to manually select the output language in these tools.

### Important Note

The platform interface — all buttons, labels, menus, and navigation — is in English across all tools and all language selections. Language selection only affects the language of the generated copy output.

---

## 7. Models and Usage Control

### AI Model Selection

CopyZap connects to multiple AI providers and allows users to select which model generates their copy. Available options span Anthropic (Claude), OpenAI (GPT-4o, GPT-4 Turbo, GPT-3.5), Google (Gemini), xAI (Grok), and DeepSeek. Each model has different characteristics for output quality, speed, and cost.

Model selection is available in Copy Maker. CopySnap and Quick Polish use a fixed model and do not offer selection.

### Credits

Every AI operation in CopyZap consumes credits. This includes generating copy, improving copy, scoring, boosting, blending, applying voices, running CopySnap transformations, running Quick Polish, and analyzing URLs. Actions that do not involve the AI — such as copying text to clipboard, saving an output, or viewing existing scores — do not consume credits.

Users can view their available credit balance within the platform. Credit limits are set by administrators and can vary per account.

### Session Tracking

CopyZap tracks activity within named sessions. Each session is associated with a project description and records the work done within it. This helps users organize their history and allows administrators to review usage patterns across the team.

---

## 8. What Makes CopyZap Different

Most AI writing tools offer a text box and a generate button. CopyZap is built around the full lifecycle of copy — from brief to iteration to confident decision.

**It combines fast creation with structured iteration — so you don't just generate copy, you improve and select the best version.** Every generated version can be iterated on with targeted tools: voices, boosts, blends, and refinement modes. Users leave with a ranked set of options backed by evidence, not a single output with no way to improve it.

**It separates creation from transformation.** Copy Maker is for building from a brief. CopySnap is for transforming short existing text quickly. Quick Polish is for reshaping copy to fit a specific purpose. Each tool is optimized for its job rather than trying to do everything in one interface.

**It respects constraints.** Copy Maker gives users meaningful control over word count, keyword integration, tone, funnel stage, and output structure — without requiring technical knowledge. The Quick and Standard modes keep the interface accessible; Advanced mode provides expert-level precision for users who need it.

**It supports real team and client workflows.** Brand voices, customer profiles, saved templates, and sharable workflows mean that the platform grows with the user's practice. A solo operator can build up a library of reusable setups. A team or agency can share configurations and ensure consistent output across clients.

**It includes scoring as a decision layer — not a primary feature.** The scoring system does not apply a single quality metric. It weights dimensions differently based on what the copy is for — a paid ad is evaluated for hook strength and CTA, while a product description is weighted toward clarity and readability. Users know not just which version scored highest, but why, and which version leads in each dimension. Scoring exists to make the choice clear, not to define the product.

---

*This document is a plain-language overview of CopyZap capabilities as of the Pre-Testing Freeze. For detailed behavioral specifications, field inventories, and scoring formulas, refer to the Feature Capability Map (`07_CopyZap_Feature_Capability_Map.md`) and the Operating Manual (`01_CopyZap_Operating_Manual_v1.0.md`).*
