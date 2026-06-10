# CopyZap Copy Maker - Complete Feature Analysis
**Documentation Date:** November 10, 2025
**Version:** 2.0

---

## Document Overview

This comprehensive reference guide covers every aspect of the Copy Maker module in CopyZap. It serves as the complete functional documentation, training material, and demo video scripting resource. You'll find detailed explanations of all features, real-world usage examples, workflow walkthroughs, common mistakes to avoid, video narration guidance, and a complete glossary. Whether you're learning the tool, training others, creating demonstration content, or simply looking up a specific feature, this document provides the depth and clarity you need. ---

## Table of Contents

- [1. Introduction](#1-introduction)
- [2. Project Setup](#2-project-setup)
  - [2.1 AI Model Selection](#21-ai-model-selection)
  - [2.2 Core Input Fields](#22-core-input-fields)
  - [2.3 Target Word Count](#23-target-word-count)
  - [2.4 Output Structure](#24-output-structure)
  - [2.5 Special Instructions](#25-special-instructions)
  - [2.6 Smart Mode vs Expert Mode](#26-smart-mode-vs-expert-mode)
  - [2.7 Optional Features](#27-optional-features-toggles)
  - [2.8 Quick Prompt Wizard](#28-quick-prompt-wizard)
  - [2.9 Saved Templates](#29-saved-templates)
  - [2.10 Quick Start Templates](#210-quick-start-templates)
  - [2.11 Evaluate Inputs Button](#211-evaluate-inputs-button)
  - [2.12 Show Only Populated Fields vs Show All Fields](#212-show-only-populated-fields-vs-show-all-fields)
  - [2.13 Export / Import JSON](#213-export--import-json)
- [3. Generated Output Section](#3-generated-output-section)
  - [3.1 Output Display](#31-output-display)
  - [3.2 Modify Content](#32-modify-content)
  - [3.3 Get Modification Suggestions](#33-get-modification-suggestions)
  - [3.4 Create Alternative Copy](#34-create-alternative-copy)
  - [3.5 Apply Voice Style](#35-apply-voice-style)
  - [3.6 Additional Instructions (Voice Style)](#36-additional-instructions-voice-style)
  - [3.7 Voice Style Quick Reference Table](#37-voice-style-quick-reference-table)
  - [3.8 Endless Combinations](#38-endless-combinations-chaining-features)
  - [3.9 Compare All Outputs](#39-compare-all-outputs)
  - [3.10 Blend Outputs](#310-blend-outputs)
  - [3.11 Right Floating Action Buttons](#311-right-floating-action-buttons)
- [4. General / Miscellaneous](#4-general--miscellaneous)
- [5. Summary](#5-summary)
- [6. Typical Workflow: End-to-End Practical Example](#6-typical-workflow-end-to-end-practical-example)
- [7. Real-Life Scenarios: Copy Maker in Action](#7-real-life-scenarios-copy-maker-in-action)
- [8. Common Mistakes & Pro Tips](#8-common-mistakes--pro-tips)
- [9. Recommended Settings: Beginners vs Experts](#9-recommended-settings-beginners-vs-experts)
- [10. Feature Interactions: How Everything Connects](#10-feature-interactions-how-everything-connects)
- [11. Video Narration Tips + Suggested Visuals](#11-video-narration-tips--suggested-visuals)
- [12. Glossary of Terms](#12-glossary-of-terms)
- [13. Motivational Closing: Master Your Message](#13-motivational-closing-master-your-message)

---

## 1. Introduction

### What is Copy Maker? Copy Maker is the core content generation engine of CopyZap. It's an AI-powered tool that helps you create, improve, and refine marketing copy, website content, product descriptions, emails, and any other written content you need. Think of it as your AI copywriting assistant that doesn't just generate text - it understands context, follows your instructions, adapts to different tones and styles, and gives you multiple options to choose from. ### What This Document Covers

This analysis focuses exclusively on **how Copy Maker works** from a functional perspective. You'll learn:
- What each input field does and when to use it
- How different settings affect your output
- Best practices for getting the results you want
- How to combine features for maximum impact

This is **not** a UI guide - it's a functional understanding of the Copy Maker's capabilities. ---

## 2. Project Setup

### 2.1 AI Model Selection

The AI model is the "brain" behind your content generation. Different models have different strengths, costs, and output characteristics. #### Available Models

**DeepSeek V3 (deepseek-chat)**
- **Best for:** Cost-effective, high-volume content generation
- **Output quality:** Very good, comparable to GPT-4
- **Token limit:** 8,192 tokens output
- **Cost:** Most economical option
- **Use when:** You need excellent quality at lower cost, or generating large volumes of content
- **Example:** Creating 20 product descriptions for an e-commerce site

**GPT-4 Omni (gpt-4o)**
- **Best for:** Balanced performance and quality
- **Output quality:** Excellent
- **Token limit:** 16,000 tokens output
- **Cost:** Moderate
- **Use when:** You need reliable, high-quality output for important content
- **Example:** Writing landing page hero sections or key marketing messages

**ChatGPT-4o Latest (chatgpt-4o-latest)**
- **Best for:** Latest improvements and features
- **Output quality:** Excellent, most up-to-date
- **Token limit:** 16,384 tokens output
- **Cost:** Moderate to high
- **Use when:** You want the absolute latest capabilities
- **Example:** Complex content requiring nuanced understanding

**GPT-4 Turbo (gpt-4-turbo)**
- **Best for:** Fast, high-quality generation
- **Output quality:** Excellent
- **Token limit:** 16,000 tokens output
- **Cost:** Moderate
- **Use when:** Speed and quality both matter
- **Example:** Time-sensitive campaign copy

**GPT-3.5 Turbo (gpt-3.5-turbo)**
- **Best for:** Quick drafts and simple content
- **Output quality:** Good
- **Token limit:** 16,000 tokens output
- **Cost:** Low
- **Use when:** Creating rough drafts or simple content
- **Example:** Internal documentation or draft blog posts

**Grok 4 Latest (grok-4-latest)**
- **Best for:** Alternative perspective, creative content
- **Output quality:** Very good
- **Token limit:** 16,000 tokens output
- **Cost:** Moderate
- **Use when:** You want a different approach or creative angle
- **Example:** Unconventional marketing campaigns

#### How Model Choice Affects Output

The model you choose influences:
- **Creativity level:** Some models are more creative, others more factual
- **Writing style:** Subtle differences in how sentences are structured
- **Token cost:** Directly affects your budget
- **Maximum output length:** Determines how much text can be generated in one request
- **Processing speed:** Some models are faster than others

---

### 2.2 Core Input Fields

These fields define what you're creating and how the AI should approach it. #### Make New Copy vs Improve Existing Copy

This is the fundamental choice that determines how the AI behaves. **Make New Copy**
- Creates content from scratch based on your instructions
- Primary input field: **Business Description**
- **When to use:** Creating new landing pages, product descriptions, emails from scratch
- **Example:** "Write hero section for a SaaS productivity app that helps teams manage projects"

**Improve Existing Copy**
- Takes your current text and enhances it
- Primary input field: **Original Copy**
- **When to use:** You have existing content that needs polishing, restructuring, or enhancement
- **Example:** Paste your current landing page text and ask AI to make it more persuasive

**How it affects behavior:**
- **Make New:** AI focuses on originality, creativity, and building from the ground up
- **Improve:** AI preserves your core message while enhancing clarity, impact, and structure

---

#### Project Description

**What it does:** Gives the AI high-level context about what you're working on. **How it affects output:** This field helps the AI understand the bigger picture and align the copy with your project's goals. **Example of correct usage:**
- "Homepage for a meal delivery service targeting busy professionals"
- "Product page for noise-cancelling headphones"
- "Email sequence for abandoned cart recovery"

**Best practices:**
- Be specific but concise (10-30 words)
- Include the content type and purpose
- Mention the target platform if relevant

---

#### Brief Description

**What it does:** A short summary of what you want to achieve with this specific piece of copy. **How it affects output:** Guides the AI's focus and intent. **Example of correct usage:**
- "Emphasize time-saving benefits and professional appeal"
- "Focus on comfort during long work sessions"
- "Create urgency without being pushy"

**Best practices:**
- State your primary goal
- Mention 1-2 key points to emphasize
- Keep it under 50 words

---

#### Product/Service Name

**What it does:** Specifies the exact product or service being described. **How it affects output:** Ensures the AI references your offering correctly and consistently. **Example:** "TaskMaster Pro", "Premium Noise Guard X200", "FlexFit Subscription"

**Best practices:**
- Use exact spelling and capitalization
- Include any important taglines or slogans if applicable

---

#### Business Description (Make New Copy mode)

**What it does:** This is your primary content input when creating new copy. Describe your business, what you offer, and what makes you unique. **How it affects output:** This is the foundation of your generated content. The AI uses this to understand your value proposition, target audience, and differentiators. **Example of correct usage:**
```
We're a cloud-based project management platform built for creative agencies.
Unlike traditional PM tools, we integrate client feedback directly into workflows,
reducing back-and-forth emails by 70%. Our visual timeline makes it easy for
non-technical clients to understand project progress.
```

**Best practices:**
- Include what you do, who it's for, and why it matters
- Mention key differentiators
- Add specific benefits or results if available
- Length: 100-300 words works well

---

#### Original Copy (Improve Existing Copy mode)

**What it does:** This is your current text that needs improvement. **How it affects output:** The AI analyzes your existing copy and enhances it while maintaining your core message. **Example of correct usage:**
```
Our software helps teams work better. We have lots of features
like task management, file sharing, and communication tools.
Companies use us to get things done faster.
```

**Best practices:**
- Paste your complete current text
- Don't pre-edit it - let the AI see the raw version
- Include any headlines or structure you want to preserve

---

#### Target Audience

**What it does:** Defines who will read this content. **How it affects output:** Dramatically changes language complexity, tone assumptions, pain points addressed, and examples used. **Example of correct usage:**
- "CTOs at mid-sized tech companies (50-500 employees)"
- "First-time home buyers aged 25-35"
- "Small business owners with no marketing experience"
- "Fitness enthusiasts who value data-driven training"

**Best practices:**
- Include demographics when relevant (age, role, experience level)
- Mention their level of expertise with your topic
- Add their primary pain points or goals
- Be specific - "busy professionals" is less useful than "corporate managers with limited lunch breaks"

---

#### Key Message

**What it does:** The single most important point you want to communicate. **How it affects output:** Ensures the AI keeps circling back to this central idea. **Example of correct usage:**
- "You can save 10 hours per week on project administration"
- "Our headphones deliver studio-quality sound at half the price"
- "Start seeing results in 30 days or your money back"

**Best practices:**
- Make it specific and concrete
- Include numbers or timeframes when possible
- State it as a benefit, not a feature

---

#### Desired Emotion

**What it does:** Sets the emotional tone and response you want to evoke in readers. **How it affects output:** Influences word choice, sentence rhythm, and persuasive tactics. **Example of correct usage:**
- "Confidence and empowerment"
- "Relief and peace of mind"
- "Excitement and anticipation"
- "Trust and credibility"

**Best practices:**
- Choose 1-2 primary emotions
- Consider your buyer's journey stage
- Match the emotion to your product category

---

#### Call to Action

**What it does:** Specifies what action you want readers to take. **How it affects output:** The AI structures the copy to naturally lead to this action. **Example of correct usage:**
- "Schedule a free demo"
- "Start your 14-day trial"
- "Download the buyer's guide"
- "Get a custom quote"

**Best practices:**
- Use action verbs
- Make it specific and concrete
- Match the commitment level to your funnel stage

---

#### Brand Values

**What it does:** Defines the principles and beliefs your brand stands for. **How it affects output:** Influences messaging angle, language choices, and which features to emphasize. **Example of correct usage:**
- "Transparency, sustainability, and ethical sourcing"
- "Innovation without complexity"
- "Accessibility for everyone, regardless of technical skill"

**Best practices:**
- List 2-4 core values
- Be authentic - these should reflect actual company priorities
- Use specific terms rather than generic buzzwords

---

#### Keywords

**What it does:** SEO keywords to naturally incorporate into the content. **How it affects output:** The AI weaves these terms into the copy in a natural, non-forced way. **Example of correct usage:**
- "project management software, team collaboration, task tracking"
- "noise cancelling headphones, wireless, over-ear"

**Best practices:**
- Separate keywords with commas
- Include both primary and secondary keywords
- Don't overdo it - 5-10 keywords maximum
- Use natural phrases, not awkward keyword stuffing

---

#### Context

**What it does:** Additional background information that doesn't fit elsewhere. **How it affects output:** Provides important nuance and helps the AI make better decisions. **Example of correct usage:**
- "This is for a Black Friday campaign, so urgency is important"
- "Our target audience is skeptical of bold claims after being burned by competitors"
- "This replaces our old page that was too technical and scared away non-tech users"

**Best practices:**
- Include competitive context
- Mention campaign timing or urgency factors
- Note any constraints or sensitivities

---

#### Industry/Niche

**What it does:** Specifies your business category. **How it affects output:** Ensures the AI uses industry-appropriate language, references relevant pain points, and understands common challenges in your space. **Available categories:**
- **Business & Services:** E-commerce, Real Estate, Legal Services, Financial Services, Consulting, Marketing, Web Design, SaaS/Tech
- **Health & Wellness:** Healthcare, Mental Health, Fitness, Nutrition, Spa & Beauty
- **Education:** Online Courses, Coaching, Schools, E-learning Platforms
- **Hospitality & Travel:** Hotels, Restaurants, Tourism, Event Planning
- **Arts & Culture:** Photography, Music, Art Galleries, Museums
- **Lifestyle & Fashion:** Fashion, Jewelry, Home Decor, Cosmetics
- **Non-Profit & Community:** NGOs, Religious Organizations, Community Projects

**Example usage:**
- Select "SaaS / Tech" for a project management tool
- Select "Fitness / Personal Training" for a gym's website

**Best practices:**
- Choose the most specific category available
- This helps the AI understand your competitive landscape

---

#### Language

**What it does:** Sets the output language. **Available options:** English, Spanish, French, German, Italian, Portuguese

**How it affects output:** The AI generates content in your selected language, using culturally appropriate expressions and idioms. **Best practices:**
- The wizard can auto-detect language from your input text
- Choose the language your target audience speaks
- Note: The AI works best in English, with slightly varying quality in other languages

---

#### Tone

**What it does:** Sets the overall communication style. **Available options:**
- **Professional:** Formal, credible, authoritative
- **Friendly:** Warm, approachable, conversational
- **Bold:** Confident, direct, assertive
- **Minimalist:** Clean, concise, essential
- **Creative:** Imaginative, original, unconventional
- **Persuasive:** Compelling, benefit-focused, conversion-oriented

**How it affects output:** Changes sentence structure, word choice, and communication style. **When to use each:**
- **Professional:** B2B services, legal, finance, healthcare
- **Friendly:** Consumer products, lifestyle brands, community-focused businesses
- **Bold:** Disruptive brands, sports, fashion, competitive markets
- **Minimalist:** Tech products, luxury goods, modern brands
- **Creative:** Agencies, arts, entertainment, innovative products
- **Persuasive:** Sales pages, campaigns, limited-time offers

**Example:**
Same message, different tones:
- **Professional:** "Our platform enhances operational efficiency by 40%"
- **Friendly:** "We help you get more done without the headaches"
- **Bold:** "Stop wasting time. Start winning."

---

#### Tone Level (Slider)

**What it does:** Fine-tunes the intensity of your selected tone (0-100 scale). **How it affects output:**
- **Low (0-30):** Subtle application of the tone
- **Medium (40-60):** Balanced, noticeable tone
- **High (70-100):** Strong, emphatic tone application

**Example with "Bold" tone:**
- **Low (20):** "Consider trying our efficient solution"
- **Medium (50):** "Take control with our proven platform"
- **High (90):** "Stop settling for mediocre results. Dominate with our platform."

**Best practices:**
- Start at 50 and adjust based on results
- Higher levels work well for specific campaigns
- Lower levels suit long-form, varied content

---

#### Reader Funnel Stage

**What it does:** Indicates where your audience is in their buying journey. **Available options:**
- **Awareness:** Just learning about the problem
- **Consideration:** Evaluating different solutions
- **Decision:** Ready to choose a specific provider
- **Retention:** Existing customers you want to keep engaged
- **Advocacy:** Happy customers who could refer others

**How it affects output:**

**Awareness Stage:**
- Focuses on education and problem identification
- Uses more explanatory language
- Builds credibility and trust
- Example: "Are you spending 15+ hours per week on manual data entry?"

**Consideration Stage:**
- Compares approaches and solutions
- Highlights unique benefits
- Addresses common objections
- Example: "Unlike spreadsheets, our platform automatically syncs data across teams"

**Decision Stage:**
- Emphasizes specific features and guarantees
- Uses strong CTAs
- Reduces purchase friction
- Example: "Start your 30-day trial - no credit card required"

**Retention Stage:**
- Focuses on maximizing value
- Highlights advanced features
- Builds loyalty
- Example: "Here's how to get even more from your subscription"

**Advocacy Stage:**
- Encourages sharing and referrals
- Makes referring easy
- Example: "Love the results? Give your colleagues 20% off"

**Best practices:**
- Match content to the actual funnel stage
- Don't skip stages - awareness content won't convert decision-stage readers

---

#### Competitor URLs / Competitor Copy Text

**What it does:** Provides examples of competitor approaches for reference. **How it affects output:** The AI analyzes competitor positioning and helps you differentiate. **Example of correct usage:**
- **URLs:** Enter 1-3 competitor website links
- **Copy Text:** Paste competitor messaging you want to improve upon

**Best practices:**
- Use this to identify gaps in competitor messaging
- The AI won't copy competitors - it identifies opportunities to differentiate
- Useful for understanding market positioning

---

#### Target Audience Pain Points

**What it does:** Lists specific problems your audience faces. **How it affects output:** The AI directly addresses these pain points in the copy. **Example of correct usage:**
```
- Drowning in disorganized project emails
- Missing deadlines due to poor team coordination
- Clients frustrated by lack of visibility
- Spending hours on status updates
```

**Best practices:**
- List 3-7 specific pain points
- Use your audience's actual words when possible
- Prioritize emotional pain over technical problems

---

#### Preferred Writing Style

**What it does:** Sets the structural approach to content. **Available options:**
- **Persuasive:** Focus on conversion and action
- **Conversational:** Friendly, dialogue-like
- **Informative:** Educational, fact-focused
- **Storytelling:** Narrative-driven, engaging
- **Educational:** Teaching-oriented, step-by-step
- **Authoritative:** Expert, commanding
- **Humorous:** Lighthearted, entertaining
- **Inspirational:** Motivational, aspirational

**How each style works:**

**Persuasive:**
- Heavy use of benefits over features
- Strategic social proof placement
- Clear, frequent CTAs
- Example: "Join 50,000 teams who've doubled their productivity"

**Conversational:**
- Uses "you" and "we"
- Asks rhetorical questions
- Casual, friendly language
- Example: "Ever feel like you're drowning in emails? We get it."

**Informative:**
- Fact-heavy, statistics-backed
- Clear structure and headers
- Educational tone
- Example: "Studies show teams using project management software save an average of 12 hours per week"

**Storytelling:**
- Uses narratives and examples
- Customer journey focus
- Engaging scenarios
- Example: "When Sarah started her agency, she was managing 5 projects with just email..."

**Best practices:**
- Can combine with tone (e. g., "Conversational" style with "Professional" tone)
- Match style to content type (product pages = persuasive, blog posts = informative)

---

#### Language Style Constraints

**What it does:** Applies specific writing rules to the output. **Available constraints:**
- Avoid passive voice
- No idioms
- Avoid jargon
- Short sentences
- Simple vocabulary
- Avoid clichés
- Gender-neutral language
- Inclusive language

**How it affects output:**

**Avoid passive voice:**
- Before: "Efficiency is improved by our software"
- After: "Our software improves efficiency"

**No idioms:**
- Removes phrases like "piece of cake" or "low-hanging fruit"
- Important for international audiences

**Avoid jargon:**
- Removes industry-specific terminology
- Makes content accessible to beginners

**Short sentences:**
- Keeps sentences under 20 words
- Improves readability

**Simple vocabulary:**
- Uses common words over complex ones
- Increases accessibility

**Best practices:**
- Select multiple constraints if needed
- Use "No idioms" and "Simple vocabulary" for international audiences
- Use "Gender-neutral language" and "Inclusive language" for modern brand standards

---

#### Excluded Terms

**What it does:** Lists words or phrases the AI should never use. **How it affects output:** Ensures brand compliance and avoids problematic language. **Example of correct usage:**
- "cheap, budget, affordable, low-cost" (for luxury brands)
- "easy, simple, just" (can sound condescending)
- "revolutionary, game-changing, disruptive" (overused buzzwords)

**Best practices:**
- Separate terms with commas
- Include variations (e. g., "easy, easily, easier")
- Use this to enforce brand tone guidelines

---

### 2.3 Target Word Count

**What it does:** Specifies approximately how much content to generate. **Available options:**
- **Short:** 50-100 words
- **Medium:** 100-200 words
- **Long:** 200-400 words
- **Custom:** Set your own target

**How it affects output:** The AI aims for this word count, but actual length depends on other factors like output structure and content complexity. **Word count priority vs. structure priority:**

When both word count and output structure are defined:
1. **Structure takes priority** - The AI ensures all requested sections are included
2. **Word count is a guideline** - The AI distributes words across sections
3. **Quality matters most** - The AI won't cut sentences short to hit an arbitrary number

**Example:**
- Target: 200 words
- Structure: Header 1, Paragraph, Bullet Points, CTA
- Result: The AI creates all four sections, totaling approximately 200 words

**Best practices:**
- Longer word counts give the AI more room for detail
- For structured content, allow extra words for section transitions
- Use "Custom" for precise requirements (e. g., 150 words for email templates)

---

### 2.4 Output Structure

**What it does:** Defines how the content should be organized and formatted. **Available structure types:**
- **Header 1 / Header 2:** Main and sub-headings
- **Structured with clear Subheadings:** Auto-generated logical sections
- **Paragraph:** Traditional text blocks
- **Problem / Solution / Benefits:** Classic copywriting structure
- **Features:** Product capability descriptions
- **Bullet Points / Numbered List:** Scannable lists
- **Q&A / FAQ (JSON):** Question and answer format
- **Call to Action:** Conversion-focused closing
- **Testimonial:** Customer success story
- **Comparison:** Side-by-side evaluation
- **Statistics:** Data-driven content
- **Case Study:** Detailed success story
- **Quote:** Highlighted statement
- **Summary / Introduction / Conclusion:** Content bookends

**How to use:**
- Select multiple structure types in the order you want them
- Drag to reorder
- The AI follows the sequence you create

**Example combinations:**

**Landing Page Hero:**
1. Header 1
2. Paragraph
3. Bullet Points
4. Call to Action

**Product Description:**
1. Paragraph (overview)
2. Features
3. Benefits
4. Testimonial
5. Call to Action

**Blog Post:**
1. Introduction
2. Structured with clear Subheadings
3. Statistics
4. Conclusion

**Email:**
1. Paragraph
2. Problem
3. Solution
4. Call to Action

**Best practices:**
- More structure elements = longer output (regardless of word count setting)
- Use "Structured with clear Subheadings" for the AI to decide logical sections
- FAQ (JSON) format is perfect for Schema markup

**Include Section Titles Toggle:**
- **ON:** AI generates titles for each structure element (e. g., "Key Benefits:", "How It Works:")
- **OFF:** Content only, no section labels
- Use ON for standalone content, OFF when you'll add your own headings

---

### 2.5 Special Instructions

**What it does:** Provides custom directions that override or enhance other settings. **How it affects output:** This is the most powerful field - it directly influences the AI's prompt and can change behavior in specific ways. **Three detailed examples:**

**Example 1: Enforce specific tone nuances**
```
Use a confident but not arrogant tone. Emphasize teamwork over
individual achievement. Avoid technical jargon - write as if
explaining to a smart 8th grader. End every paragraph with a
question to encourage reflection.
```
Result: The AI adapts its tone, simplifies language, and adds engagement questions. **Example 2: Control structure and pacing**
```
Start with a provocative statistic that makes people uncomfortable.
Then introduce the problem in emotional terms - make them feel the
pain. Only after establishing the problem, present the solution.
Use short, punchy sentences throughout. No sentence over 15 words.
```
Result: The AI follows this specific flow and sentence structure. **Example 3: Brand-specific requirements**
```
Our brand voice is warm and supportive, never pushy or salesy.
We always address readers as "you" and ourselves as "we" - never
use third person. Include at least one specific example in every
section. Reference our core belief that "everyone deserves access
to mental health support" at least once.
```
Result: The AI maintains brand voice consistency and includes required elements. **Best practices:**
- Be specific rather than vague ("Use short sentences" not "Write well")
- Combine with other fields - this enhances, doesn't replace them
- Use for brand-specific requirements that don't fit elsewhere
- Can enforce formatting (e. g., "Start every benefit with an action verb")

---

### 2.6 Smart Mode vs Expert Mode

**What it does:** Controls which input fields are visible. **Smart Mode (Recommended for most users):**
- Shows essential fields only
- Hides advanced options by default
- "Show Advanced" button reveals more fields
- Cleaner, less overwhelming interface

**Expert Mode:**
- Shows all fields at once
- Full control immediately visible
- For experienced users who know exactly what they need

**Visible fields in Smart Mode:**
- Project Description
- Brief Description
- Business Description / Original Copy
- Target Audience
- Key Message
- Language, Tone, Word Count
- Output Structure
- Special Instructions

**Additional fields in Expert Mode:**
- Product/Service Name
- Industry/Niche
- Tone Level slider
- Reader Funnel Stage
- Competitor URLs/Text
- Pain Points
- Preferred Writing Style
- Language Constraints
- Excluded Terms
- All word count enforcement options
- GEO optimization settings
- SEO metadata options

**When to use each:**
- **Smart Mode:** Quick projects, simple copy, learning the tool
- **Expert Mode:** Complex projects, brand compliance needs, precise control

**Best practices:**
- Start with Smart Mode
- Switch to Expert Mode when you need specific features
- Your choice persists across sessions

---

### 2.7 Optional Features (Toggles)

These are special generation options that enhance or modify your output. #### Generate SEO Metadata

**What it does:** Creates SEO-optimized elements for web pages. **When ON:**
- Generates URL slugs
- Creates meta descriptions
- Produces H1, H2, H3 heading variants
- Generates Open Graph titles and descriptions
- All elements are SEO-optimized for target keywords

**Output format:** Included at the end of the main content with clear labels. **Example output:**
```
URL Slug: project-management-software-teams
Meta Description: TaskMaster Pro helps teams collaborate effectively...
H1: Professional Project Management Software for Growing Teams
H2 Options:
- Streamline Team Collaboration with TaskMaster
- Manage Projects Like a Pro
```

**How many variants:**
- You can specify quantities for each element (1-5)
- Default: 1 of each type
- More variants = more testing options

**When to use:**
- Creating new web pages
- Optimizing existing pages for search
- Need multiple options for A/B testing

**Best practices:**
- Fill in the Keywords field for best results
- More keywords = better SEO optimization
- Review and customize the output before using

#### Generate Content Scores

**What it does:** AI evaluates your generated content across multiple dimensions. **When ON:**
- Analyzes clarity, engagement, persuasiveness
- Checks tone consistency
- Evaluates structure effectiveness
- Provides improvement suggestions

**Scoring dimensions:**
- **Clarity:** Easy to understand, no confusion
- **Engagement:** Holds attention, interesting
- **Persuasiveness:** Convincing, conversion-focused
- **Tone Match:** Aligns with requested tone
- **Structure:** Logical flow, good organization

**Each dimension scored 0-100**

**When to use:**
- Quality assurance for important content
- Comparing multiple versions
- Learning what makes good copy

**Best practices:**
- Use after generating content (on-demand)
- Compare scores across different versions
- Scores are subjective - trust your judgment too

#### Generate GEO Score

**What it does:** Evaluates content for Google's Generative Engine Optimization (the new era of AI search). **When ON:**
- Checks for clear value propositions
- Evaluates readability for AI parsing
- Assesses structured data compatibility
- Measures authoritative language
- Checks for natural question answering

**GEO vs SEO:**
- **SEO:** Optimized for traditional Google search
- **GEO:** Optimized for AI-generated answer boxes and summaries

**Why it matters:** Google increasingly shows AI-generated answers instead of traditional results. GEO-optimized content is more likely to be featured. **When to use:**
- Content you want featured in AI answers
- FAQ pages
- Educational content
- Product comparisons

#### Force Keyword Integration

**What it does:** Ensures keywords appear naturally throughout the content. **When ON:**
- Prioritizes keyword inclusion without stuffing
- Maintains readability
- Uses variations of your target keywords
- Strategically places keywords in headers and key sentences

**When OFF:**
- Keywords might appear organically or not at all
- Content flows more naturally
- Less SEO-focused

**When to use:**
- SEO-critical pages (landing pages, product pages)
- Competitive keywords you need to rank for
- When keyword density matters

**Best practices:**
- Still requires keywords to be filled in the Keywords field
- Use 3-7 keywords for best results
- Don't force keywords on purely creative content

#### Force Elaborations & Examples

**What it does:** Ensures the AI includes detailed explanations and concrete examples. **When ON:**
- Every major point includes an example
- More detailed explanations
- Less abstract, more concrete language
- Output length typically increases 20-40%

**When OFF:**
- More concise output
- Examples included only when naturally relevant

**Example comparison:**

**OFF:**
"Our platform improves team productivity through better task management."

**ON:**
"Our platform improves team productivity through better task management. For example, when the design team at Acme Corp started using TaskMaster, they reduced their project completion time from 6 weeks to 4 weeks by eliminating confusion over task assignments and priorities."

**When to use:**
- Educational content
- Convincing skeptical audiences
- Complex products that need explanation
- Case studies and success stories

**Best practices:**
- Increases word count significantly - adjust target accordingly
- Works well with "Storytelling" writing style
- May feel verbose for simple products

#### Prioritize Word Count (Strict Enforcement)

**What it does:** Forces the AI to hit your target word count more precisely. **When ON:**
- AI will regenerate content if it falls short
- Word count tolerance set by percentage
- Retry logic ensures closer adherence
- May sacrifice some flow for length compliance

**When OFF:**
- Word count is a loose guideline
- AI prioritizes quality over exact length
- May undershoot or overshoot by 20-40%

**Settings:**
- **Word Count Tolerance Percentage:** How far off target triggers retry (default 20%)
- Example: 200 word target, 20% tolerance = accepts 160-240 words

**When to use:**
- Exact word count requirements (e. g., ad copy with character limits)
- Consistency across multiple similar pieces
- Meeting specific content length standards

**Best practices:**
- Don't use for creative or flowing content
- Works best with structured output
- May require multiple generations for perfect hit

#### Adhere to Little Word Count

**What it does:** Special enforcement for short content (under 100 words). **Why it exists:** Short content is harder to control - the AI naturally wants to elaborate. **When ON:**
- Extra strict enforcement for brevity
- Uses compression techniques
- Removes filler words aggressively
- Tolerance percentage applies (default 20%)

**When OFF:**
- Short targets may overshoot by 50%+
- More natural phrasing even if longer

**Example:**
- Target: 50 words
- Tolerance: 20%
- Accepts: 40-60 words

**When to use:**
- Social media posts
- Ad copy
- Button text and microcopy
- Email subject lines (very short)

#### Enhance for GEO

**What it does:** Optimizes content specifically for AI search engines and featured snippets. **When ON:**
- Uses clear, declarative statements
- Structures content for easy AI parsing
- Includes direct answers to likely questions
- Adds context for AI understanding
- More factual, less promotional tone

**Optional add-on: TL; DR Summary**
- When checked, adds a concise summary at the top
- Perfect for featured snippets
- Summarizes key points in 2-3 sentences

**GEO optimization techniques applied:**
- Question-answer format integration
- Fact-heavy statements
- Structured data-friendly phrasing
- Clear topic definitions
- Natural keyword placement

**When to use:**
- "How to" content
- FAQ pages
- Comparison pages
- Definition/explanation content
- Any content where you want to appear in AI-generated answers

**Best practices:**
- Works well with FAQ structure
- Combine with structured output
- Include location if local business

#### Location & GEO Regions

**What it does:** Targets content to specific geographic areas. **Fields:**
- **Location:** Primary city/region (e. g., "Austin, Texas")
- **GEO Regions:** Additional areas to reference

**How it affects output:**
- Includes location-specific references
- Uses regional language or terms
- Mentions local factors when relevant
- Optimized for "near me" searches

**Example:**
Without location: "Our service helps homeowners improve energy efficiency"
With location (Seattle): "Our service helps Seattle homeowners reduce heating costs during our wet, cold winters"

**When to use:**
- Local businesses
- Regional service providers
- Location-specific products
- "Near me" search optimization

---

### 2.8 Quick Prompt Wizard

The Quick Prompt Wizard is a guided, conversational way to set up your project without filling out a complex form. #### What it does:
- Asks 3-5 simple questions
- Interprets your answers intelligently
- Auto-fills the form based on your responses
- Detects language automatically
- Suggests optimal settings

#### Three modes: **Make New Copy**
- For creating content from scratch
- Questions focus on what you're building
- Example flow: 1. "What are you creating?" → "A landing page for my meal delivery service"
  2. "Who's your target audience?" → "Busy professionals who want healthy meals"
  3. "What are their pain points?" → "No time to cook, eating unhealthy takeout"
  4. "How long should it be?" → "Medium (100-200 words)"
  5. "What tone?" → "Friendly"
- Wizard applies your answers and pre-fills fields intelligently

**Improve Existing Copy**
- For enhancing current content
- Questions focus on what needs fixing
- Example flow: 1. "Paste your current copy" → [Paste your text]
  2. "What's not working?" → "Too formal and boring"
  3. "What should it accomplish?" → "Get people excited to try our free trial"
  4. "Any specific changes?" → "More benefits, less features"
- Wizard sets improve mode and creates appropriate instructions

**Quick Polish**
- Fast, simple content refinement
- Paste your content
- Select quick options: - Make it more persuasive
  - Simplify the language
  - Add more personality
  - Improve clarity
- Generate immediately with one click

#### When to use each: **Make New Copy Wizard:**
- Starting a new project
- Not sure where to begin
- Want guidance on setup
- First time using the tool

**Improve Existing Copy Wizard:**
- Have content that needs work
- Know what's wrong but not how to fix it
- Want to modernize old content

**Quick Polish:**
- Minor tweaks needed
- Time-sensitive project
- Content is 80% there, needs final touch
- Want to try multiple quick variations

**Best practices:**
- Wizard is smart - answer in plain English, don't overthink
- You can edit filled fields after wizard completes
- Wizard detects language from your input text
- Can run wizard multiple times with different approaches

---

### 2.9 Saved Templates

**What it does:** Save your current form configuration for reuse. **How it works:**
1. Fill out the form with your desired settings
2. Click "Save as Template"
3. Name your template (e. g., "Product Page - Tech SaaS")
4. Add optional description
5. Load it anytime you need those exact settings

**What gets saved:**
- All input fields and their values
- AI model selection
- Tone, language, word count
- Output structure configuration
- All toggles and optional features
- Special instructions

**What doesn't get saved:**
- Generated outputs (those are saved separately)
- Customer assignments

**When to use:**
- You create similar content regularly
- Consistent brand requirements across projects
- Multiple team members need same setup
- Testing different approaches on similar content

**Example templates you might create:**
- "Landing Page Hero - Professional Tone"
- "Product Description - E-commerce"
- "Email Newsletter - Friendly"
- "Blog Post - Educational 800 words"

**Best practices:**
- Create templates for your most common use cases
- Use descriptive names
- Update templates when you refine your approach
- Share template names with team members

---

### 2.10 Quick Start Templates

**What it does:** Pre-built templates for common use cases, ready to use immediately. **Difference from Saved Templates:**
- Quick Start = Built-in examples
- Saved Templates = Your custom configurations

**How to use:**
1. Click "Quick Start" dropdown
2. Browse categories
3. Select a template that matches your needs
4. Form auto-fills with example content
5. Customize the pre-filled content for your specific case
6. Generate

**Template categories:**
- **Website Content:** Landing pages, about pages, service pages
- **Marketing:** Product descriptions, campaigns, value propositions
- **Email:** Newsletters, promotional emails, drip campaigns
- **Social Media:** Posts, captions, announcements
- **Long-form:** Blog posts, articles, guides

**When to use:**
- Learning the tool (see what good input looks like)
- Quick projects where examples save time
- Not sure how to structure your request
- Want inspiration for your own template

**Best practices:**
- Treat as starting points, not final solutions
- Replace example content with your specifics
- Learn from the structure and wording
- Copy patterns that work well for you

---

### 2.11 Evaluate Inputs Button

**What it does:** AI analyzes your form inputs before generation and suggests improvements. **Checks for:**
- Missing critical information
- Vague or unclear descriptions
- Conflicting instructions
- Insufficient context
- Opportunities to improve specificity

**Example feedback:**
- "Your target audience is too broad - consider narrowing to a specific demographic"
- "Add 2-3 specific pain points to make the content more relatable"
- "Your key message focuses on features rather than benefits - consider reframing"

**When to use:**
- First time using the tool
- Important, high-stakes content
- Getting poor results and not sure why
- Learning to write better prompts

**Best practices:**
- Run this before generating complex projects
- Use suggestions to improve your input quality
- Over time, you'll internalize these tips

---

### 2.12 Show Only Populated Fields vs Show All Fields

**What it does:** Filters visible fields based on what has content. **Show Only Populated Fields:**
- Hides empty fields
- Cleaner interface
- Focus on what you've filled out
- Easier to review before generating

**Show All Fields:**
- Displays every available field
- See what you might be missing
- Better for comprehensive setup
- Default view

**When to use each:**

**Show Only Populated:**
- Reviewing a complex setup
- Working with templates (hide unused fields)
- Final check before generating
- Less overwhelming for simple projects

**Show All Fields:**
- Initial setup
- Making sure you're not missing important fields
- Expert mode users
- Learning what fields exist

**Best practices:**
- Toggle as needed during your workflow
- Use "Only Populated" for final review
- Use "Show All" when you might add more detail

---

### 2.13 Export / Import JSON

**What it does:** Save your form configuration as a JSON file or load one from disk. **Export JSON:**
- Downloads current form state as a. json file
- Includes all settings and inputs
- Does NOT include generated outputs

**Import JSON:**
- Upload a previously exported. json file
- Instantly restores all form fields
- Overwrites current form state

**Use cases:**

**Backup configurations:**
- Save complex setups before experimenting
- Create backups before major changes

**Share setups with team:**
- Export your configuration
- Share the file with colleagues
- They import to get identical setup

**Version control:**
- Save different versions of similar projects
- Compare approaches side-by-side
- Iterate on successful configurations

**Cross-project consistency:**
- Use same setup across multiple pieces
- Ensure brand consistency
- Standardize team processes

**When to use:**
- Before major form changes
- Collaborating with team members
- Testing multiple approaches
- Moving setups between accounts

**Best practices:**
- Name files descriptively (e. g., "landing-page-config-v2. json")
- Store in organized folders
- Document what each config is for
- Test imported configs before generating

---

## 3. Generated Output Section

After you hit "Generate," the AI creates content based on your settings. Here's what happens next. ### 3.1 Output Display

**What you see:**

Each piece of generated content appears as a **card** with:
- **Title:** Indicates what type of content (Improved Copy, Alternative, Voice Style Applied, etc.)
- **Content:** The actual generated text
- **Metadata:** Word count, generation time, source (if derived from another output)
- **Action buttons:** Copy, modify, create alternative, apply voice style, delete

**Content format:**
- Respects your requested output structure
- Applies formatting (headers, bullets, paragraphs)
- Includes section titles if toggle was ON
- SEO metadata appears at the bottom if generated

**Navigation:**
- Bottom floating bar appears with output links
- Wraps to multiple lines if needed
- Click to jump to specific output cards
- Includes "Go to Top" button

**Word count display:**
- Shows actual word count
- Compares to target (if specified)
- Green = close to target
- Orange = somewhat off
- Red = significantly off

**Content hierarchy:**
- Original outputs appear at top level
- Derived outputs (alternatives, voice styles) appear indented below their source
- Visual connecting lines show relationships

---

### 3.2 Modify Content

**What it does:** Transforms existing generated content based on specific instructions. **How it works:**
1. Click "Modify" on any output card
2. Enter your modification instruction
3. Optionally click "Get Suggestions" for ideas
4. Generate modified version
5. New card appears indented under the source

**Modification instruction examples:**

**Adding elements:**
- "Add a customer success story to the Benefits section"
- "Include 3 specific statistics to support claims"
- "Add a FAQ section at the end"

**Changing tone:**
- "Make it more urgent without being pushy"
- "Soften the language - less aggressive"
- "Add more personality and humor"

**Restructuring:**
- "Reorder to put the CTA earlier"
- "Break the long paragraph into bullet points"
- "Add subheadings every 100 words"

**Improving clarity:**
- "Simplify the language for a general audience"
- "Explain technical terms in parentheses"
- "Make the value proposition clearer"

**When to use:**
- Content is 80% right, needs specific adjustments
- Testing specific changes without regenerating everything
- Iterative refinement
- A/B testing specific elements

---

### 3.3 Get Modification Suggestions

**What it does:** Opens a modal with categorized, pre-built modification instructions. **How it works:**
1. Click "Get Suggestions" in the modification panel
2. Browse suggestions by category
3. Use search to filter
4. Click a suggestion to add it to your instruction field
5. Can add multiple suggestions
6. Edit the combined instruction before generating

**Suggestion categories:**

**Tone & Style:**
- "Make it more conversational and relatable"
- "Increase urgency without being aggressive"
- "Add sophistication and elegance"
- "Make it bold and attention-grabbing"

**Structure & Format:**
- "Add clear subheadings every 2-3 paragraphs"
- "Break long paragraphs into bullet points"
- "Restructure using Problem-Solution-Benefit flow"
- "Add a compelling hook at the beginning"

**Content Enhancement:**
- "Include specific examples or case studies"
- "Add statistics or data to support claims"
- "Integrate social proof (testimonials, numbers)"
- "Include a strong call to action"

**Clarity & Readability:**
- "Simplify language for broader audience"
- "Eliminate jargon and technical terms"
- "Make sentences shorter and punchier"
- "Add transition phrases between ideas"

**Persuasion & Conversion:**
- "Emphasize benefits over features"
- "Address common objections preemptively"
- "Create more urgency and scarcity"
- "Strengthen the value proposition"

**SEO & Keywords:**
- "Integrate target keywords more naturally"
- "Add FAQ section for voice search"
- "Include long-tail keyword variations"

**When to use:**
- Not sure exactly what changes you need
- Want to try proven modification patterns
- Learning what kinds of modifications work well
- Quick improvements without overthinking

**Best practices:**
- Can combine multiple suggestions
- Edit suggestions to be more specific
- Suggestions are starting points - customize them
- Try one suggestion at a time to see effects

---

### 3.4 Create Alternative Copy

**What it does:** Generates a different version using the same inputs with variation. **How it works:**
1. Click "Create Alternative" on any output card
2. AI generates a fresh take with different wording, structure, or angle
3. New card appears at same level as source (not indented)

**What changes:**
- Different opening hooks
- Alternative sentence structures
- Varied examples or metaphors
- Different emphasis on points
- Fresh call-to-action wording

**What stays consistent:**
- Core message and facts
- Target audience
- Tone and brand voice
- Key points covered
- Overall length

**Example:**

**Original:**
"TaskMaster Pro streamlines your team's workflow. Spend less time coordinating and more time creating. Join 10,000+ teams who've boosted productivity by 40%."

**Alternative:**
"Stop drowning in project chaos. TaskMaster Pro brings order to your team's workflow, freeing up 40% more time for what matters. Over 10,000 teams have made the switch."

**When to use:**
- A/B testing different approaches
- Need multiple options to choose from
- Original is good but want to see other angles
- Combining best parts of multiple versions (see Blend feature)

**Best practices:**
- Generate 2-3 alternatives for important content
- Look for different angles, not just rewording
- Can create alternatives of alternatives
- Use Compare All Outputs to evaluate objectively

---

### 3.5 Apply Voice Style

**What it does:** Transforms existing content to match a specific writing voice or persona. **How it works:**
1. Click "Apply Voice Style" on any output card
2. Select a voice style from dropdown
3. Optionally add custom instructions
4. Generate styled version
5. New card appears indented under source with voice label

**Available Voice Styles:**

#### Humanization Options: **Humanize**
- Makes content sound naturally written by a person
- Reduces AI-like patterns
- Adds conversational elements
- Subtle personality injection
- Best for: Most content that needs to feel authentic

**Humanize (No AI Detection)**
- Specifically designed to pass AI detection tools
- Introduces intentional imperfections
- Varies sentence rhythm
- Uses colloquialisms
- Best for: When AI detection is a concern (academic, editorial content)

#### Generic Tone/Style: **Luxury Brand**
- Sophisticated, refined, exclusive language
- Emphasizes quality and craftsmanship
- Subtle superiority without arrogance
- Best for: Premium products, high-end services

**Tech Startup**
- Modern, innovative, fast-paced
- Forward-thinking language
- Problem-solving focus
- Best for: SaaS, tech products, startups

**Professional Formal**
- Authoritative, polished, credible
- Traditional business language
- Trust-building tone
- Best for: B2B, finance, legal, corporate

**Friendly Conversational**
- Warm, approachable, relatable
- Uses "you" and "we"
- Casual but professional
- Best for: Consumer brands, lifestyle, community

**Bold Direct**
- Straightforward, confident, punchy
- No-nonsense communication
- Clear value statements
- Best for: Competitive markets, sports, bold brands

**Cool Trendy**
- Contemporary, culturally aware
- Modern references
- Youth-oriented language
- Best for: Fashion, entertainment, youth brands

**Minimalist**
- Concise, essential, focused
- Clean and simple language
- Maximum impact, minimum words
- Best for: Modern tech, luxury, design brands

**Playful**
- Fun, lighthearted, engaging
- Humor and creativity
- Energy and enthusiasm
- Best for: Entertainment, games, creative brands

**High-End Exclusive**
- Premium, select, aspirational
- Implies membership in elite group
- Sophisticated but accessible
- Best for: Luxury brands, clubs, premium services

**Soft Empathetic**
- Caring, understanding, supportive
- Emotional connection focus
- Addresses pain gently
- Best for: Healthcare, counseling, support services

#### Personas (Famous Communicators): **Alex Hormozi**
- Framework-driven, value-first
- Direct and practical
- Focus on ROI and systems
- Best for: SaaS offers, business services

**Brené Brown**
- Empathetic, vulnerable, authentic
- Emotional intelligence
- Community and values focus
- Best for: Coaching, community, personal development

**David Ogilvy**
- Fact-driven, research-backed
- Elegant persuasion
- Educational selling
- Best for: Long-form sales copy, premium products

**Don Draper**
- Emotional, cinematic, persuasive
- Story-driven selling
- Brand positioning focus
- Best for: Brand narratives, emotional products

**Donald Miller**
- Clear, story-structured
- Benefit-driven
- StoryBrand framework
- Best for: Service pages, value propositions

**Elon Musk**
- Visionary, technical, ambitious
- Future-focused
- Big thinking
- Best for: Innovative tech, moonshot ideas

**Gary Halbert**
- Aggressive, emotional, urgent
- Classic direct response
- High-conversion focus
- Best for: Sales letters, promotions

**Maider Tomasena**
- Authentic, strategic, purpose-driven
- Thoughtful business messaging
- Leadership content
- Best for: Business consulting, thought leadership

**Marie Forleo**
- Witty, upbeat, empowering
- Feminine energy
- Personal growth focus
- Best for: Women-focused brands, coaching

**Richard Branson**
- Bold, adventurous, customer-focused
- Disruptive and fun
- Entrepreneurial spirit
- Best for: Challenger brands, innovative services

**Seth Godin**
- Punchy, metaphorical, insightful
- Counter-intuitive thinking
- Short, memorable ideas
- Best for: Thought leadership, marketing content

**Simon Sinek**
- Purpose-driven, inspirational
- "Start with Why" philosophy
- Mission-focused
- Best for: About pages, mission statements

**Steve Jobs**
- Bold, visionary, minimalist
- Product-focused
- Revolutionary language
- Best for: Product launches, hero sections

**Tony Robbins**
- High-energy, motivational, urgent
- Transformation-focused
- Peak performance language
- Best for: Personal development, coaching

---

### 3.6 Additional Instructions (Voice Style)

**What it does:** Customizes how the voice style is applied. **Located:** In the Voice Style modal, below the dropdown

**How to use:**

**Examples of additional instructions:**

**Combine style with specific changes:**
"Apply Alex Hormozi style but keep it under 150 words and add a pricing hook at the end"

**Modify the persona:**
"Use Seth Godin style but make it slightly longer and more detailed"

**Add specific requirements:**
"Apply Humanize style but ensure all technical terms are explained in parentheses"

**Blend styles:**
"Mix Steve Jobs' boldness with Brené Brown's empathy"

**When to use:**
- The voice style alone isn't quite right
- Need the style plus specific changes
- Want to customize a persona
- Testing variations on a style

**Best practices:**
- Keep instructions focused on style, not content changes
- Can reference other voice styles
- Use to fine-tune the transformation

---

### 3.7 Voice Style Quick Reference Table

| Voice Style | Description | Best For | Content Type |
|-------------|-------------|----------|--------------|
| **Humanize** | Natural, conversational, relatable | Most content needing authenticity | Landing pages, blogs, emails |
| **Humanize (No AI Detection)** | Designed to pass AI detection | Content scrutinized for AI use | Editorial, academic, guest posts |
| **Luxury Brand** | Sophisticated, refined, exclusive | Premium products | Luxury goods, high-end services |
| **Tech Startup** | Modern, innovative, fast-paced | Technology products | SaaS, apps, tech services |
| **Professional Formal** | Authoritative, polished, credible | B2B and corporate | Corporate sites, B2B services |
| **Friendly Conversational** | Warm, approachable, relatable | Consumer brands | E-commerce, community, lifestyle |
| **Bold Direct** | Straightforward, confident | Competitive markets | Sales pages, competitive products |
| **Cool Trendy** | Contemporary, culturally aware | Youth audience | Fashion, entertainment, culture |
| **Minimalist** | Concise, essential, impactful | Modern design brands | Tech, design, luxury minimalism |
| **Playful** | Fun, lighthearted, engaging | Entertainment | Games, creative, fun products |
| **High-End Exclusive** | Premium, aspirational, select | Luxury and exclusive | Memberships, luxury, premium |
| **Soft Empathetic** | Caring, understanding | Health and wellness | Healthcare, counseling, support |
| **Alex Hormozi** | Framework-driven, value-first | Business offers | SaaS, business services |
| **Brené Brown** | Empathetic, vulnerable | Community and values | Coaching, personal development |
| **David Ogilvy** | Fact-driven, elegant persuasion | Long-form selling | Sales letters, premium products |
| **Don Draper** | Emotional, cinematic | Brand storytelling | Brand narratives, lifestyle |
| **Donald Miller** | Clear, story-structured | Service businesses | Service pages, about pages |
| **Elon Musk** | Visionary, future-focused | Innovation | Tech launches, visionary products |
| **Gary Halbert** | Aggressive, emotional, urgent | Direct response | Sales letters, promotions |
| **Maider Tomasena** | Authentic, strategic, purpose | Business leadership | Consulting, thought leadership |
| **Marie Forleo** | Witty, upbeat, empowering | Women-focused brands | Coaching, women's products |
| **Richard Branson** | Bold, adventurous | Disruptive brands | Challenger brands, adventures |
| **Seth Godin** | Punchy, metaphorical | Marketing thought | Marketing content, blogs |
| **Simon Sinek** | Purpose-driven, inspirational | Mission-focused | About pages, mission statements |
| **Steve Jobs** | Bold, visionary, minimalist | Product launches | Product pages, launch content |
| **Tony Robbins** | High-energy, motivational | Personal transformation | Coaching, personal development |

---

### 3.8 Endless Combinations: Chaining Features

The real power of Copy Maker comes from **combining features** to create exactly what you need. #### Common Combination Patterns: **Pattern 1: Alternative + Voice Styles**
1. Generate initial copy
2. Create 2 alternatives
3. Apply different voice styles to each
4. Now you have 6+ versions to choose from
5. Compare all to find the winner

**Use case:** Landing page hero that needs to hit just right

**Pattern 2: Modify + Voice Style**
1. Generate initial copy
2. Modify to add specific elements (e. g., statistics)
3. Apply humanization to modified version
4. Result: Data-backed, naturally-written copy

**Use case:** Sales page that needs credibility and personality

**Pattern 3: Multiple Alternatives + Compare**
1. Generate initial copy
2. Create 3-4 alternatives
3. Apply voice styles to 1-2 alternatives
4. Use "Compare All Outputs" to get AI evaluation
5. Blend the best parts

**Use case:** Important content where you need the absolute best version

**Pattern 4: Improve + Modify + Voice**
1. Start with your existing copy (Improve mode)
2. AI improves it
3. Modify to add missing elements
4. Apply brand voice style
5. Result: Polished, complete, on-brand

**Use case:** Updating old content to current standards

**Pattern 5: Template + Alternative + Scoring**
1. Load saved template (brand standards pre-set)
2. Generate initial version
3. Create alternative
4. Score both versions
5. Choose winner based on objectives

**Use case:** Consistent brand content production

---

### 3.9 Compare All Outputs

**What it does:** AI objectively evaluates all your generated versions and recommends the best one. **How it works:**
1. Generate multiple output versions (alternatives, voice styles, etc.)
2. Click "Compare All Outputs" button
3. AI analyzes all versions across multiple dimensions
4. Generates detailed comparison report
5. Report appears as a new card in your outputs

**What the comparison includes:**

**Overall Recommendation:**
- Which version is best overall
- Detailed reasoning for the choice
- Overall score (0-100)

**Individual Version Analysis:**
- Score for each version
- Pros (what this version does well)
- Cons (where this version falls short)
- Best used for (ideal use case)

**Dimension-by-Dimension Comparison:**
- **Tone:** Which version best matches your requested tone
- **Readability:** Which is easiest to understand
- **Persuasion:** Which is most likely to convert
- **Emotional Appeal:** Which connects most emotionally
- **Differentiation:** Which stands out from competitors
- **Conversion Potential:** Which is most likely to drive action

**Example comparison output:**

```
Best Version: Alternative 2 (Don Draper style)
Overall Score: 89/100

Reasoning: This version combines emotional storytelling with clear
value propositions. The cinematic opening hooks readers immediately,
and the benefits are presented in a way that feels aspirational
rather than salesy. Version Comparison: Improved Copy (Original)
Score: 76/100
Pros: Clear, professional, covers all key points
Cons: Somewhat generic, lacks emotional punch
Best for: Corporate audiences, formal contexts

Alternative 1 (Steve Jobs style)
Score: 82/100
Pros: Bold, memorable, great for tech products
Cons: May feel too aggressive for some audiences
Best for: Product launches, tech-savvy audiences

Alternative 2 (Don Draper style) ⭐ RECOMMENDED
Score: 89/100
Pros: Emotionally engaging, aspirational, excellent storytelling
Cons: Slightly longer than ideal
Best for: Brand storytelling, lifestyle products, emotional purchases
```

**Metrics breakdown example:**
- Tone Match: Alternative 2 (95%) > Alternative 1 (88%) > Original (75%)
- Readability: Original (High) = Alternative 2 (High) > Alternative 1 (Medium)
- Persuasion: Alternative 2 (Very High) > Alternative 1 (High) > Original (Medium)

**When to use:**
- Multiple versions and can't decide objectively
- Want to understand why one version works better
- Learning what makes effective copy
- Need to justify your choice to stakeholders
- A/B testing prioritization

**Best practices:**
- Generate at least 3 versions for meaningful comparison
- Comparison is saved with your output
- AI considers your original inputs (target audience, goals) when scoring
- Use this before finalizing important content

---

### 3.10 Blend Outputs

**What it does:** Combines the best elements from multiple versions into one superior version. **How it works:**
1. After comparing outputs, you see "Blend Best Versions" option
2. Optionally add blend instructions
3. AI intelligently merges: - Best opening hook
   - Strongest value propositions
   - Most effective examples
   - Clearest explanations
   - Best call-to-action
4. Creates a new "Blended" output card

**Blend instructions examples:**
- "Prioritize Version 2's opening but keep Version 1's bullet points"
- "Maintain Version 3's tone throughout but use Version 1's structure"
- "Combine but keep it under 200 words"

**What gets blended:**
- Opening hooks
- Key messaging points
- Examples and social proof
- Structural elements
- Call-to-action language

**What stays consistent:**
- Overall tone
- Core message
- Target length
- Brand voice

**Example:**

**Version 1 strengths:**
- Great opening hook
- Clear value proposition

**Version 2 strengths:**
- Excellent examples
- Strong call-to-action

**Blended result:**
Uses Version 1's hook, maintains its value prop clarity, integrates Version 2's examples, ends with Version 2's CTA. **When to use:**
- Multiple versions each have strong elements
- Don't want to choose just one
- Need the "best of all worlds"
- Comparison shows no clear winner across all dimensions

**Best practices:**
- Compare first, then blend - comparison helps identify strengths
- Add blend instructions to guide the AI
- Can blend 2-5 versions
- Blended versions can be further modified or styled

---

### 3.11 Right Floating Action Buttons

These buttons provide quick actions on your generated content. They appear in a vertical bar on the right side of the screen. #### 1. Save Output

**What it does:** Saves all generated content and form inputs to your dashboard. **What gets saved:**
- All generated output cards
- All form inputs used
- Comparison results (if you ran Compare All)
- Relationships between outputs (alternatives, derived versions)
- Metadata (generation date, AI model used, word counts)

**When to use:**
- Finished generating and want to preserve everything
- Need to reference this project later
- Want to show outputs to team members
- Need version history

**How to access saved outputs:**
- Go to Dashboard
- Click "Saved Outputs" tab
- Browse by date or project name
- Load any saved output to restore everything

**Best practices:**
- Save before closing the browser
- Add descriptive project name
- Save iterations as you go for version history

---

#### 2. Copy as Markdown

**What it does:** Copies ALL generated content to clipboard in Markdown format. **What's included:**
- Project inputs summary
- All generated output versions
- Scores (if generated)
- Comparison results (if run)
- Proper Markdown formatting (headers, lists, emphasis)

**Format example:**
```markdown
# Copy Generation Project
**Project Description:** Landing page for meal delivery service
**Target Audience:** Busy professionals

## Improved Copy
Tired of choosing between healthy eating and saving time?
FreshMeals delivers chef-prepared, nutritious meals... **Word Count:** 156 words

## Alternative Copy
Your lunch break shouldn't be a compromise... **Word Count:** 142 words
```

**When to use:**
- Documenting your work
- Sharing with team members via Slack/email
- Saving to Notion, Obsidian, or other Markdown tools
- Creating project archives
- Writing reports or case studies

**Best practices:**
- Paste into Markdown-compatible tools for best formatting
- Edit in a Markdown editor if needed
- Works great for version control (Git)

---

#### 3. Export as HTML

**What it does:** Downloads everything as a styled, standalone HTML file. **Filename format:** `[project-description]_[date-time].html`

Example: `meal-delivery-landing_2025-11-10_14-30-22.html`

**What's included:**
- Professional CSS styling
- All generated outputs with formatting
- Metadata and scores
- Comparison results (if any)
- SEO metadata (if generated)
- Fully self-contained (works offline)

**When to use:**
- Presenting to clients (can print to PDF from browser)
- Formal documentation with styled formatting
- Stakeholder review with visual presentation
- Portfolio pieces

**Best practices:**
- HTML file can be opened in any web browser
- Print to PDF directly from browser (File → Print → Save as PDF)
- Styled formatting makes it professional and readable
- Can be easily shared via email or cloud storage

---

#### 4. View Prompts (Admin Only)

**What it does:** Shows the actual prompts sent to the AI. **Visible to:** Admin users only (configured by email)

**What you see:**
- System prompt (instructions to AI)
- User prompt (your inputs transformed into AI request)
- Model settings (temperature, tokens, etc.)

**Why it exists:**
- Quality assurance
- Debugging unexpected outputs
- Learning how inputs translate to prompts
- Improving prompt engineering

**When to use:**
- Results aren't matching expectations
- Learning how the system works
- Debugging issues
- Optimizing prompt templates

**Note:** This is a technical/admin feature not meant for typical content creation workflow. ---

## 4. General / Miscellaneous Features

### 4.1 Model Token Limits

Each AI model has a maximum output length (measured in tokens, roughly 0.75 words per token): - **DeepSeek V3:** 8,192 tokens (~6,000 words max)
- **GPT-4o:** 16,000 tokens (~12,000 words max)
- **ChatGPT-4o Latest:** 16,384 tokens (~12,000 words max)
- **GPT-4 Turbo:** 16,000 tokens (~12,000 words max)
- **GPT-3.5 Turbo:** 16,000 tokens (~12,000 words max)
- **Grok 4 Latest:** 16,000 tokens (~12,000 words max)

**What this means:**
- If you request 1,000 words, any model works
- If you request 8,000 words, don't use DeepSeek
- Most projects stay well under limits

**System behavior:**
- System warns you if target exceeds model limit
- Truncation happens gracefully if limit hit
- Switch to higher-limit model for long content

---

### 4.2 Auto Language Detection (Wizard)

The Quick Prompt Wizard automatically detects what language you're writing in: **How it works:**
- Analyzes your input text for language patterns
- Detects Spanish, French, German, Italian, Portuguese
- Defaults to English if uncertain
- Sets the Language field automatically

**Accuracy:**
- Very reliable with 50+ words of input
- May default to English with very short input

**Override:**
- Can manually change language after wizard completes
- Wizard is a helper, not a restriction

---

### 4.3 Content Quality Indicators

When content scoring is enabled, visual indicators show quality: **Indicator colors:**
- **Green:** 80-100 score (excellent)
- **Yellow:** 60-79 score (good, room for improvement)
- **Red:** Below 60 (needs work)

**Appears on:**
- Individual output cards
- Comparison results
- Score cards

**Use for:**
- Quick visual assessment
- Identifying which outputs need work
- Quality control workflow

---

### 4.4 Word Count Accuracy Tracking

System tracks how close output is to target word count: **Tolerance levels:**
- **On target:** Within 10% of target (green indicator)
- **Close:** 10-30% from target (yellow indicator)
- **Off target:** More than 30% from target (red indicator)

**Factors affecting accuracy:**
- More structure elements = harder to hit exact count
- Strict enforcement ON = better accuracy
- Short targets (under 100) are harder to hit exactly
- Quality always prioritized over exact count

---

### 4.5 Loading States and Progress

**Generation progress messages:**
- Appear below form during generation
- Show current step (e. g., "Generating improved copy...", "Applying voice style...")
- Help track what's happening
- Multiple operations show multiple messages

**Loading spinners:**
- Appear on "Generate" button
- Appear on individual cards during operations
- Prevent accidental double-clicks

**Cancel operation:**
- Button appears during generation
- Safely stops current operation
- Partial results may be shown

---

### 4.6 URL Parameter Loading

**What it does:** Load configurations via URL parameters. **Use case:**
- Share exact setup with colleagues
- Bookmark common configurations
- Create links for team templates

**How it works:**
System can parse URL params to pre-fill form fields. **Security:**
- Only loads form inputs, not outputs
- Validated before application
- No sensitive data in URLs

---

### 4.7 Dark Mode Support

**Toggle:** Top navigation
**Affects:** Entire interface including output displays
**Persists:** Across sessions
**Best for:** Personal preference, reducing eye strain

---

### 4.8 Clear All Button

**What it does:** Resets form to defaults. **Clears:**
- All input fields
- Generated outputs
- Loaded templates
- Form state

**Doesn't clear:**
- Saved templates
- Dashboard outputs
- Account settings

**Use when:**
- Starting fresh project
- Current form is messy
- Testing from clean slate

**Safety:**
- Confirmation required
- Can't undo - save important work first

---

### 4.9 Delete Individual Outputs

**What it does:** Remove specific output cards. **How to:**
1. Click trash icon on output card
2. Confirm deletion
3. Card and children (derived outputs) removed

**Use when:**
- Decluttering output area
- Removing failed attempts
- Focusing on specific versions

**Note:** Deletion is immediate and can't be undone unless you've saved. ---

### 4.10 Tooltips and Help Text

Throughout the interface:
- **Info icons (ⓘ):** Hover for helpful explanations
- **Field labels:** Click for more context
- **Button tooltips:** Hover to see what each button does

**Best for:**
- Learning the tool
- Remembering what fields do
- Getting quick help without leaving the page

---

### 4.11 Responsive Design

**Works on:**
- Desktop (optimal experience)
- Tablet (full functionality)
- Mobile (limited but functional)

**Mobile adaptations:**
- Simplified layout
- Collapsible sections
- Touch-friendly buttons

**Best practices:**
- Use desktop for complex projects
- Mobile works for quick edits and reviews

---

## 5. Summary: How It All Works Together

Copy Maker is a comprehensive AI copywriting system that gives you complete control over your content generation. ### The Typical Workflow: 1. **Setup:** Choose your mode (Make New vs Improve), fill in key fields
2. **Configure:** Set tone, structure, word count, optional features
3. **Generate:** AI creates initial version
4. **Iterate:** Create alternatives, modify, apply voice styles
5. **Compare:** Use AI to objectively evaluate versions
6. **Blend:** Combine the best elements
7. **Finalize:** Save, export, and use your content

### The Power of Combinations: The real magic happens when you **stack features**:
- Start with a template → generate → create alternatives → apply different voices → compare → blend the winner
- Use the wizard for setup → generate → modify with specific changes → score → iterate until perfect
- Improve existing copy → apply voice → modify for specific channel → create alternatives for A/B testing

### Key Principles: 1. **Inputs matter:** Better inputs = better outputs. Be specific.
2. **Iterate freely:** Generation is cheap, perfection takes iteration.
3. **Compare objectively:** Your gut isn't always right - let AI help evaluate.
4. **Save everything:** You never know what you'll want to reference later.
5. **Learn patterns:** Note what input combinations produce your best results. ### When to Use What: **Quick projects (under 10 minutes):**
- Quick Prompt Wizard or Quick Polish
- Generate → maybe one alternative → done

**Standard projects (10-30 minutes):**
- Manual form fill or template
- Generate → 2-3 alternatives → maybe voice styles → compare → finalize

**Important projects (30+ minutes):**
- Expert mode, detailed inputs
- Generate → multiple alternatives → multiple voice styles → score everything → compare → blend → final modifications → save multiple versions

### The Learning Curve: **Week 1:** Use Smart Mode, Quick Start templates, wizard
**Week 2-4:** Try different toggles, understand what each setting does
**Month 2+:** Expert mode, custom templates, advanced combinations
**Month 3+:** Teaching others, creating team standards, optimizing workflows

### Best Results Come From: 1. **Specific inputs** - "E-commerce business" < "Sustainable fashion e-commerce for Gen Z"
2. **Clear objectives** - Know what success looks like before generating
3. **Iteration** - First version is rarely the final version
4. **Comparison** - Generate multiple options and choose objectively
5. **Consistency** - Save templates for recurring needs

---

**Remember:** Copy Maker is a tool, not magic. The quality of your output depends on the quality of your inputs, your willingness to iterate, and your understanding of your audience. This documentation gives you the knowledge - practice gives you mastery. ---

## 6. Typical Workflow: End-to-End Practical Example

Let's walk through a complete real-world project from start to finish. ### Scenario: Creating a Landing Page Hero Section for a SaaS Product

**Context:** You're launching a project management tool called "TaskFlow" targeting small creative agencies. #### Step 1: Open Copy Maker and Choose Mode

**Action:** User clicks into Copy Maker tab, sees the interface. **Decision:** This is new copy, so select **"Make New Copy"** tab. *User thinks: "I'm creating from scratch, not improving existing content."*

---

#### Step 2: Decide on Smart Mode or Expert Mode

**Action:** Toggle remains on Smart Mode (recommended for most users). **Reasoning:** For a straightforward landing page hero, Smart Mode provides all necessary fields without overwhelming options. *User thinks: "I don't need advanced GEO optimization or funnel stages for this - Smart Mode is fine."*

---

#### Step 3: Select AI Model

**Action:** User opens model dropdown, reviews options. **Decision:** Selects **"GPT-4 Omni (gpt-4o)"**

**Reasoning:** Landing page hero is critical content - worth the moderate cost for excellent quality. DeepSeek would work too, but GPT-4o gives slightly more polished results. *User thinks: "This is the first thing visitors see - I'll use the reliable, high-quality model."*

---

#### Step 4: Fill Core Input Fields

**Project Description:**
```
Landing page hero section for TaskFlow, a project management SaaS for creative agencies
```

**Brief Description:**
```
Emphasize visual project tracking and client collaboration features that set us apart from traditional PM tools
```

**Business Description:**
```
TaskFlow is a visual project management platform built specifically for creative agencies.
Unlike generic tools like Asana or Monday, we integrate client feedback directly into the
workflow with approval boards, branded client portals, and visual timelines that non-technical
clients actually understand. Our customers report 60% less back-and-forth communication and
deliver projects 2 weeks faster on average. We serve agencies with 5-50 employees who
manage multiple client projects simultaneously.
```

**Target Audience:**
```
Creative agency owners and project managers (ages 30-45) who are frustrated with tools
that weren't built for client-facing work. They value aesthetics and simplicity, and
their biggest pain point is keeping clients informed without constant status meetings.
```

**Key Message:**
```
Deliver projects faster and keep clients happy with visual project tracking they'll actually use
```

**Desired Emotion:**
```
Relief and confidence - finally a tool that works the way agencies work
```

**Call to Action:**
```
Start your 14-day free trial
```

---

#### Step 5: Configure Settings

**Language:** English (default)

**Tone:** Friendly (agencies value approachable over corporate)

**Word Count:** Short: 50-100 (hero sections should be concise)

**Output Structure:**
1. Header 1 (main headline)
2. Paragraph (supporting copy)
3. Bullet Points (key benefits)
4. Call to Action

*User drags these into order in the structure picker*

---

#### Step 6: Add Special Instructions

**User types:**
```
Focus on the client collaboration angle - that's our unique differentiator.
Use "you" language to speak directly to agency owners. Keep sentences under
15 words for punchiness. Include a specific benefit in the headline.
```

---

#### Step 7: Configure Optional Features

**User scrolls to "Optional Features" section:**

- ✅ Generate SEO Metadata (checked) - "We'll need this for the landing page"
- ✅ Generate Scores (checked) - "I want to evaluate quality"
- ❌ Generate GEO Score (unchecked) - "Not priority right now"
- ❌ Force Keyword Integration (unchecked) - "Let it flow naturally"
- ❌ Prioritize Word Count (unchecked) - "Quality over exact length"

---

#### Step 8: Generate Initial Copy

**Action:** User clicks big green **"Generate Copy"** button. **What happens:**
- Loading spinner appears
- Progress messages show: "Analyzing your inputs..." → "Generating improved copy..." → "Creating SEO metadata..."
- Takes 15-20 seconds
- Output cards appear in the results section

**Generated Output - Improved Copy:**

```
# Help Clients See Progress, Not Just Spreadsheets

TaskFlow turns complex projects into visual timelines your clients will love.
Built for creative agencies, our platform eliminates endless status emails
and confusion with branded client portals that show real-time progress. • Visual project boards clients can actually understand
• Client feedback integrated directly into your workflow
• Deliver projects 2 weeks faster with 60% less back-and-forth

Start your 14-day free trial

---
SEO METADATA:
URL Slug: project-management-creative-agencies
Meta Description: TaskFlow helps creative agencies deliver projects faster with visual
tracking and client collaboration tools. 14-day free trial.
H1: Project Management Built for Creative Agencies
```

**Word Count:** 94 words ✅ (on target)

---

#### Step 9: Review and Create Alternative

*User reads the output*

**User thinks:** *"This is good, but I want to see a slightly bolder approach. Let me create an alternative."*

**Action:** Clicks **"Create Alternative"** button on the output card. **What happens:**
- AI generates a fresh take with different phrasing
- New card appears at same level as original

**Generated Output - Alternative Copy:**

```
# Stop Losing Projects in Email Chaos

Your agency deserves better than generic project tools. TaskFlow is built for the
way creative teams actually work - with visual boards, client approval workflows,
and branded portals that make you look professional. • Clients see progress in real-time (no more "what's the status?" emails)
• Creative feedback flows directly into tasks
• Ship projects faster with tools built for agency life

Start your 14-day free trial

---
SEO METADATA:
[Similar metadata generated]
```

**Word Count:** 89 words ✅

---

#### Step 10: Apply Voice Style to Alternative

*User thinks:* "The alternative is punchier. Let me try it with a specific voice style to see if we can make it even more compelling."

**Action:** Clicks **"Apply Voice Style"** on Alternative Copy card. **Modal opens:** User selects **"Donald Miller"** from the Personas category. **Why Donald Miller?** His StoryBrand framework emphasizes clear benefit-driven messaging - perfect for landing pages. **Additional Instructions field:** User types:
```
Keep the punchy opening but ensure the benefits are crystal clear
```

**Action:** Clicks **"Apply Voice Style"**

**Generated Output - Alternative (Donald Miller style):**

```
# Tired of Clients Asking "Where Are We?"

Here's the problem: traditional project tools weren't built for agencies.
They're built for internal teams. That's why you're drowning in client emails. TaskFlow changes that. We built a visual project platform specifically for
agencies who work with clients. Here's what that means for you:
• Your clients see project progress in real-time - no status meetings required
• Feedback becomes action items automatically
• You look professional with branded client portals
• Your team delivers 2 weeks faster (that's what our customers report)

Start your 14-day free trial - see the difference visual project tracking makes. ---
SEO METADATA:
[Similar metadata]
```

**Word Count:** 118 words ⚠️ (slightly over, but acceptable for clarity)

---

#### Step 11: Generate Scores for Comparison

**Action:** User clicks **"Generate Score"** on all three versions. **What happens:**
- AI analyzes each version across multiple dimensions
- Score cards appear showing 0-100 ratings

**Scores:**
- **Original:** 82/100 (Clear, professional, safe)
- **Alternative:** 88/100 (Punchier, more engaging)
- **Alternative (Miller style):** 91/100 (Best clarity and problem-solution structure)

---

#### Step 12: Compare All Outputs

**Action:** User clicks **"Compare All Outputs"** button at bottom of results. **What happens:**
- AI analyzes all three versions
- Comparison report card appears

**Comparison Result:**

```
BEST VERSION: Alternative (Donald Miller style)
Overall Score: 91/100

REASONING:
This version excels at establishing the problem (email chaos) before presenting
the solution. The StoryBrand structure naturally guides the reader through
understanding → solution → benefits → action. While slightly longer than target,
every word serves a purpose. INDIVIDUAL ANALYSIS: Original Copy (82/100)
Pros: Professional, clear benefits, good structure
Cons: Generic opening, doesn't establish urgency
Best for: Conservative audiences, formal campaigns

Alternative Copy (88/100)
Pros: Strong opening hook, punchy, urgent
Cons: Benefits could be more specific
Best for: Bold campaigns, competitive positioning

Alternative (Donald Miller style) (91/100) ⭐ RECOMMENDED
Pros: Clear problem-solution flow, specific benefits, professional urgency
Cons: Slightly longer than 100 words
Best for: Landing pages, conversion-focused content, agency audiences

METRICS:
Tone Match: Miller style (95%) > Alternative (90%) > Original (85%)
Persuasion: Miller style (Very High) > Alternative (High) > Original (Medium-High)
Clarity: Miller style (Excellent) > Original (Very Good) > Alternative (Very Good)
```

---

#### Step 13: Make Final Decision

*User reviews the comparison*

**User thinks:** *"The Miller style version is the winner. The slight word count overage is worth it for the clarity and structure. Let me make one small tweak though - I want to adjust the CTA."*

**Action:** Clicks **"Modify"** on the Miller style version. **Modification instruction:**
```
Change the CTA to "See TaskFlow in action - Start your free trial" to be more
visual and action-oriented
```

**Generated Output - Modified Version:**

```
[Same content as before, but with updated CTA]

See TaskFlow in action - Start your free trial
```

---

#### Step 14: Save and Export

**Action:** User clicks **"Save Output"** (floating button on right). **What happens:**
- Prompt for project name: User enters "TaskFlow Landing Hero v1"
- All outputs, inputs, scores, and comparison saved to Dashboard

**Action:** User clicks **"Copy as Markdown"** (floating button). **What happens:**
- Entire project copied to clipboard in Markdown format
- User pastes into Notion for team review

---

#### Step 15: Use the Content

**User opens design tool (Figma, Webflow, etc.)**

**Copies the winning version:**
- Headline goes into hero H1
- Supporting paragraph becomes subheading
- Bullet points formatted as visual benefits
- CTA becomes button text

**Also uses SEO metadata:**
- URL slug configured in CMS
- Meta description added to page settings
- H1 variant used as backup option

---

### Total Time: 25 Minutes

**Breakdown:**
- Setup and input: 8 minutes
- Generation and alternatives: 10 minutes
- Comparison and refinement: 7 minutes

**Result:** Professional landing page hero copy with multiple tested variations, complete SEO metadata, and team documentation. ---

### What Made This Successful: 1. **Specific inputs:** Detailed business description with concrete differentiators
2. **Clear audience definition:** Exact pain points and preferences
3. **Structured approach:** Used output structure to organize content
4. **Iteration:** Didn't settle for first version
5. **Objective comparison:** Let AI evaluate rather than gut feeling
6. **Small refinement:** Final modification to perfect the CTA

---

## 7. Real-Life Scenarios: Copy Maker in Action

### Scenario 1: Black Friday Email Campaign

**Context:** E-commerce clothing brand needs a promotional email for their Black Friday sale. **User Profile:** Marketing coordinator, moderate experience

**Time Available:** 15 minutes

---

**Inputs Used:**

**Mode:** Make New Copy

**Project Description:**
```
Black Friday promotional email for sustainable fashion brand targeting eco-conscious millennials
```

**Business Description:**
```
EcoThreads sells sustainable, ethically-made clothing for young professionals who
care about the environment. All materials are organic or recycled, and we plant
a tree for every purchase. Our Black Friday sale is 30% off sitewide, plus free
shipping - rare for us.
```

**Target Audience:**
```
Environmentally conscious millennials (25-35) who normally avoid fast fashion but
appreciate good deals when aligned with their values
```

**Key Message:**
```
Save 30% on sustainable fashion guilt-free - our biggest sale of the year
```

**Tone:** Friendly

**Word Count:** Medium: 100-200

**Output Structure:**
1. Paragraph (opening hook)
2. Benefits (bullet points)
3. Call to Action

**Special Instructions:**
```
Acknowledge that sales can feel wasteful but emphasize that buying quality
sustainable pieces on sale is actually smart. Create urgency without being pushy.
No fake scarcity tactics.
```

**Optional Features:**
- Generate Scores: ✅ (want to ensure persuasiveness)

---

**Generated Output (Winner after 2 alternatives + voice style):**

```
Subject: Our Biggest Sale Ever (And It's Guilt-Free)

We know you're thoughtful about what you buy. That's exactly why this sale matters. Quality sustainable pieces don't have to cost a fortune. This Black Friday, get 30%
off everything at EcoThreads - our biggest discount ever. Plus free shipping. Why this sale makes sense:
• Buying fewer, better pieces is the sustainable choice
• Organic materials that last years, not months
• Every purchase plants a tree (yes, even on sale)
• Support ethical manufacturing without the premium price

This weekend only: November 24-27

Shop the sale →
```

**Why These Settings Worked:**

1. **Friendly tone** matched the brand's approachable voice
2. **Special instructions** addressed the ethical tension directly
3. **Benefits structure** clearly justified the purchase
4. **Medium word count** provided enough context without overwhelming
5. **Applied Humanize voice style** to make it feel authentic, not salesy

**Result:** Email sent to 45,000 subscribers, 28% open rate (above average), 6.2% conversion rate. ---

### Scenario 2: SaaS Landing Page (Services Page)

**Context:** B2B software company needs to explain their implementation services. **User Profile:** Startup founder, first time using Copy Maker

**Approach:** Used Quick Prompt Wizard

---

**Wizard Flow:**

**Step 1:** "What are you creating?"
```
A services page explaining our onboarding and implementation process for new customers
```

**Step 2:** "Who's your target audience?"
```
IT managers at mid-sized companies who need help rolling out our software to their teams
```

**Step 3:** "What are their main concerns?"
```
They're worried about downtime, employee resistance to new tools, and the time
investment required
```

**Step 4:** "How long should the content be?"
```
Long: 200-400 words (need to be thorough)
```

**Step 5:** "What tone?"
```
Professional (this is B2B)
```

---

**Wizard Auto-Applied:**
- Mode: Make New Copy
- AI Model: GPT-4 Omni (reliable for B2B)
- Output Structure: Introduction → Structured with clear Subheadings → Call to Action
- Optional features: Generate SEO Metadata ✅

**User clicked "Apply and Generate"**

---

**Generated Output:**

```
# Seamless Implementation, Zero Headaches

Rolling out new software shouldn't disrupt your business. Our white-glove
implementation service ensures your team is up and running in days, not weeks. ## Discovery & Planning (Week 1)
We start by understanding your workflows, pain points, and success metrics.
Our implementation specialist creates a customized rollout plan tailored to
your team's needs. ## Configuration & Setup (Week 2)
We handle the technical heavy lifting - integrations, user permissions, data
migration, and custom configurations. Your IT team stays informed but doesn't
get bogged down. ## Team Training (Week 3)
Role-specific training sessions ensure everyone knows how to use the features
that matter to them. We provide recorded sessions and documentation for future reference. ## Launch & Support (Week 4)
Go-live with dedicated support. We monitor usage, address questions in real-time,
and fine-tune settings based on actual usage patterns. ## Ongoing Success
Quarterly check-ins, feature updates training, and priority support ensure your
team continues getting maximum value. Schedule your implementation consultation →

---
SEO METADATA:
URL Slug: implementation-services-onboarding
Meta Description: Professional software implementation services with customized
training and ongoing support. Get your team up and running in 4 weeks.
H1: Professional Implementation Services
```

**Why The Wizard Worked:**

1. **User provided clear context** in plain English
2. **Wizard detected pain points** and emphasized solutions
3. **Auto-structured content** logically (timeline-based)
4. **Professional tone** appropriate for B2B audience
5. **Generated actionable content** that addressed specific concerns

**Result:** Services page published, 42% of demo requests now mention wanting implementation support. ---

### Scenario 3: Blog Post Introduction (Thought Leadership)

**Context:** Marketing agency wants to publish a blog post about the future of AI in content marketing. **User Profile:** Content manager, experienced Copy Maker user

**Approach:** Expert Mode with custom template

---

**Inputs Used:**

**Mode:** Make New Copy

**Model:** ChatGPT-4o Latest (want cutting-edge perspective on AI)

**Project Description:**
```
Blog post introduction about how AI is changing content marketing and what
marketers need to know to stay relevant
```

**Business Description:**
```
We're a digital marketing agency that helps B2B companies create content strategies.
This post positions us as thought leaders who understand AI without fearmongering.
We want to educate, not sell.
```

**Target Audience:**
```
Marketing directors and content strategists (35-50) who are curious about AI
but maybe a bit overwhelmed by the hype
```

**Preferred Writing Style:** Informative (but engaging)

**Reader Funnel Stage:** Awareness (educating, not selling)

**Tone:** Professional (but not stuffy)

**Tone Level:** 45 (moderate professional - not too formal)

**Word Count:** Long: 200-400

**Output Structure:**
1. Introduction (hook)
2. Structured with clear Subheadings
3. Quote (key insight)

**Special Instructions:**
```
Start with a provocative statement about AI but immediately balance it with
nuance. Acknowledge both the potential and limitations. Use we/our to speak
as fellow marketers, not preachers. Include at least one specific example
of AI use. End with a forward-looking statement that sets up the rest of
the article.
```

**Language Style Constraints:**
- ✅ Avoid jargon
- ✅ Avoid clichés

**Optional Features:**
- Generate GEO Score: ✅ (want this to appear in AI search results)
- Enhance for GEO: ✅
- Add TL; DR Summary: ✅

---

**Generated Output:**

```
TL; DR: AI is transforming content marketing faster than any tool in the last decade.
Success won't come from using AI—it'll come from using it thoughtfully. # The AI Revolution in Content Marketing Isn't What You Think

Everyone's talking about AI replacing marketers. That conversation misses the point. AI isn't replacing content marketers—it's redefining what we do. The question isn't
"Will AI take my job?" It's "How do I evolve my job to leverage AI while maintaining
what makes content human?"

## The Real Shift

Here's what's actually changing: AI handles the scalable, repeatable parts of content
creation. That means marketers need to double down on strategy, creativity, and
understanding audiences at a deep level. Take SEO content as an example. Five years
ago, writing 50 blog posts optimized for specific keywords was valuable. Today, AI
can do that in an afternoon. But it can't decide which topics actually matter to
your audience. It can't craft a unique brand voice. It can't understand the nuanced
pain points that only come from customer conversations. ## What Marketers Actually Need to Know

"The marketers who thrive in the AI era won't be the ones who resist it or blindly
adopt it—they'll be the ones who understand where AI adds value and where human
expertise is irreplaceable."

The core skills haven't changed: understanding your audience, crafting compelling
narratives, and creating genuine value. What's changed is the toolkit. AI accelerates
research, enables personalization at scale, and frees us from repetitive tasks. That
means more time for strategy and creativity—if we choose to use it that way. ## Looking Forward

The next 12 months will separate content marketers into two camps: those who evolve
their skills and those who don't. This article breaks down exactly what you need to
know to be in the first camp. [Article continues...]
```

**Why These Settings Worked:**

1. **Expert Mode** gave access to nuanced controls (tone level, reader funnel stage)
2. **Informative writing style** + moderate tone created balanced, credible voice
3. **GEO optimization** structured content for AI search engines
4. **TL; DR** made it snippet-friendly
5. **Language constraints** kept it accessible
6. **Special instructions** ensured balanced perspective

**Result:** Post published, featured in Perplexity AI results for "AI content marketing guide," 3,200 organic views first month. ---

### Scenario 4: E-commerce Product Description with Full SEO

**Context:** Online furniture store launching a new ergonomic office chair. **User Profile:** E-commerce manager, needs fast production

**Approach:** Quick Start Template + modifications

---

**Process:**

**Step 1:** Clicked "Quick Start Templates" dropdown

**Step 2:** Selected "E-commerce Product Description" template

**Template auto-filled:**
- Mode: Make New Copy
- Tone: Persuasive
- Word Count: Medium: 100-200
- Structure: Paragraph → Features → Benefits → Testimonial → CTA
- Optional: Generate SEO Metadata ✅

**Step 3:** User customized the auto-filled example content: **Product/Service Name:**
```
ErgoLux Pro Office Chair
```

**Business Description:**
```
The ErgoLux Pro is a premium ergonomic office chair designed for people who
work 8+ hours at a desk. Features include adjustable lumbar support, breathable
mesh back, 4D armrests, and a weight-capacity of 300lbs. Available in 3 colors.
Independently tested and certified by ergonomic specialists. 5-year warranty.
```

**Target Audience:**
```
Remote workers and office professionals (25-55) experiencing back pain or
discomfort from long hours at desk. They've tried cheaper chairs and are
ready to invest in quality.
```

**Key Message:**
```
End back pain and work comfortably with professional-grade ergonomic support
```

**Keywords:**
```
ergonomic office chair, back pain relief, adjustable lumbar support,
mesh office chair, home office furniture
```

**Optional Features:**
- Generate SEO Metadata: ✅
- Force Keyword Integration: ✅ (important for product page SEO)
- Generate Scores: ❌ (not needed for straightforward product copy)

**Step 4:** Generated → Created 1 alternative → Chose winner

---

**Final Output:**

```
# End Back Pain, Work in Comfort

Working from home shouldn't mean suffering through another day of back pain.
The ErgoLux Pro Office Chair brings professional-grade ergonomic support to
your home office. ## Professional-Grade Features
• Adjustable lumbar support that adapts to your spine's natural curve
• Breathable mesh back keeps you cool during long work sessions
• 4D armrests adjust in every direction for perfect positioning
• 300lb weight capacity with commercial-grade construction
• 5-year warranty backed by ergonomic certification

## The Difference You'll Feel
Stop shifting positions every 20 minutes. The ErgoLux Pro's multi-point
adjustment system means you can dial in the perfect fit for your body.
Our customers report significant reduction in back pain within the first week. "I've tried three 'ergonomic' chairs before this one. The ErgoLux Pro is
the first that actually eliminated my lower back pain. Worth every penny."
— Sarah M., Software Developer

Available in 3 colors. Free shipping. 30-day trial period. Add to Cart - $499

---
SEO METADATA: URL Slug: ergolux-pro-ergonomic-office-chair

Meta Description: ErgoLux Pro ergonomic office chair with adjustable lumbar
support relieves back pain. Breathable mesh, 4D armrests, 5-year warranty.
Free shipping. H1 Options:
1. ErgoLux Pro Ergonomic Office Chair - Professional Back Support
2. Premium Ergonomic Chair for Back Pain Relief
3. ErgoLux Pro: Adjustable Lumbar Support Office Chair

H2 Options:
1. Professional-Grade Ergonomic Features
2. Adjustable Lumbar Support for All-Day Comfort

H3 Options:
1. 4D Armrest Adjustment System
2. Breathable Mesh Technology

Open Graph:
Title: End Back Pain with ErgoLux Pro Ergonomic Chair
Description: Professional-grade ergonomic support with adjustable lumbar,
breathable mesh, and 5-year warranty. Transform your home office comfort.
```

**Why This Approach Worked:**

1. **Quick Start Template** provided proven product page structure
2. **Force Keyword Integration** ensured SEO optimization
3. **Persuasive tone** focused on benefits and pain relief
4. **Testimonial structure** added social proof
5. **Complete SEO metadata** ready for immediate implementation

**Result:** Product page published same day, ranking on page 2 of Google for "ergonomic office chair back pain relief" within 3 weeks. ---

## 8. Common Mistakes & Pro Tips

### Mistake #1: Vague Project Descriptions

**The Mistake:**
```
Project Description: "Website content"
```

**Why It Fails:** The AI has no context about what kind of website, industry, or purpose. Results will be generic. **The Fix:**
```
Project Description: "About page for boutique accounting firm targeting small
business owners in Seattle"
```

**Pro Tip:** Include content type, industry, and target location/audience in 15-25 words. ---

### Mistake #2: No Target Audience Details

**The Mistake:**
```
Target Audience: "Everyone" or "General public"
```

**Why It Fails:** Copy that appeals to everyone appeals to no one. The AI can't tailor tone, language, or pain points. **The Fix:**
```
Target Audience: "Small business owners (5-20 employees) with no in-house IT,
frustrated with tech complexity, value simplicity over features"
```

**Pro Tip:** Include demographics, experience level, specific pain points, and what they value most. ---

### Mistake #3: Feature-Focused Instead of Benefit-Focused

**The Mistake:**
```
Key Message: "Our software has automated reporting and API integrations"
```

**Why It Fails:** Features don't emotionally resonate. Users need to understand what they GET. **The Fix:**
```
Key Message: "Save 10 hours per week on manual reporting and connect all your
tools without hiring a developer"
```

**Pro Tip:** Always frame as "You can [benefit]" not "We have [feature]."

---

### Mistake #4: Conflicting Tone and Audience

**The Mistake:**
- Target Audience: "Gen Z consumers who value authenticity"
- Tone: "Professional" (formal)

**Why It Fails:** Gen Z responds to conversational, casual language. Formal tone creates disconnect. **The Fix:**
- Keep Target Audience the same
- Tone: "Friendly" or "Cool Trendy"
- Add: Language Constraints → ✅ Avoid jargon

**Pro Tip:** Match tone to audience expectations, not your company's self-image. ---

### Mistake #5: Setting Word Count Too Strict for Complex Structure

**The Mistake:**
- Word Count: Short: 50-100 words
- Output Structure: Header 1 + Paragraph + Bullet Points + Features + CTA
- Prioritize Word Count: ✅ ON

**Why It Fails:** 5 structure elements can't fit meaningfully in 100 words. AI will sacrifice quality or structure to hit word count. **The Fix:**
- Either: Increase word count to Medium (100-200)
- Or: Reduce structure to 2-3 elements
- Turn OFF "Prioritize Word Count" for structured content

**Pro Tip:** Rule of thumb: Each structure element needs 25-50 words minimum. ---

### Mistake #6: Not Using Special Instructions for Brand Voice

**The Mistake:**
Leaving Special Instructions blank when the company has specific brand guidelines (e. g., never use certain phrases, always reference sustainability). **Why It Fails:** The AI doesn't know your brand quirks. Output might be good but off-brand. **The Fix:**
```
Special Instructions: "Always emphasize sustainability in every section.
Never use the words 'cheap' or 'affordable' - use 'accessible' instead.
Reference our B Corp certification. Maintain warm but professional tone."
```

**Pro Tip:** Treat Special Instructions as your brand voice enforcement mechanism. ---

### Mistake #7: Generating Once and Stopping

**The Mistake:**
- Generate copy once
- Think "That's pretty good"
- Use it immediately

**Why It Fails:** First generation is rarely the best version. You miss opportunities for improvement. **The Fix:**
- Generate initial copy
- Create 1-2 alternatives
- Apply voice style to the best one
- Maybe modify for final tweaks
- Compare objectively

**Pro Tip:** Budget 20 minutes per project, not 5. Iteration creates excellence. ---

### Mistake #8: Not Reviewing SEO Metadata Before Using

**The Mistake:**
Auto-generating SEO metadata and copying it directly to website without review. **Why It Fails:** AI-generated metadata is good but might not align perfectly with your actual SEO strategy, brand voice, or character limits. **The Fix:**
- Generate SEO metadata as starting point
- Review each element: - Does URL slug match your site structure? - Is meta description under 155 characters? - Do H1 variants align with your headline strategy?
- Edit as needed before implementing

**Pro Tip:** SEO metadata is 80% done - spend 5 minutes customizing the last 20%. ---

### Mistake #9: Using Expert Mode Too Early

**The Mistake:**
New user immediately switches to Expert Mode because it looks more powerful. **Why It Fails:** Overwhelming number of fields leads to analysis paralysis. User fills out 30 fields poorly instead of 10 fields well. **The Fix:**
- Week 1-2: Smart Mode only
- Week 3-4: Try Expert Mode on familiar projects
- Month 2+: Expert Mode for complex needs, Smart Mode for quick projects

**Pro Tip:** Expert Mode adds 20+ fields. Only use them when you have specific needs. ---

### Mistake #10: Not Saving Templates for Repeated Work

**The Mistake:**
Creating landing page copy for 10 different products, filling out the same fields manually each time. **Why It Fails:** Wastes time and introduces inconsistency. **The Fix:**
- Create first product page copy carefully
- Save as Template: "Product Page - Standard Template"
- For each new product: Load template → Update product-specific fields → Generate
- Saves 5-10 minutes per product

**Pro Tip:** If you're doing something more than twice, make it a template. ---

## 9. Recommended Settings: Beginners vs Experts

| Aspect | Beginners (Week 1-4) | Intermediate (Month 2-3) | Experts (Month 3+) |
|--------|---------------------|-------------------------|-------------------|
| **Mode** | Smart Mode always | Smart Mode for simple projects, Expert for complex | Seamlessly switch based on needs |
| **Model** | Stick with GPT-4 Omni or DeepSeek | Experiment with different models for different content types | Match model to project requirements |
| **Wizard Use** | Use Quick Prompt Wizard 80% of the time | Use wizard for new content types, manual for familiar | Manual setup preferred, wizard for inspiration |
| **Word Count Enforcement** | Leave OFF | Turn ON for specific needs (ads, strict limits) | Use strategically based on structure |
| **Output Structure** | 2-3 elements max | 3-5 elements, experiment with combinations | Complex structures with 5+ elements |
| **Special Instructions** | Leave blank or 1-2 simple sentences | 2-3 specific brand requirements | Detailed brand voice, constraints, formatting rules |
| **Voice Styles** | Humanize only | Try 3-4 different personas | Strategic use of personas for specific effects |
| **Alternatives Created** | 1 alternative max | 2-3 alternatives for important content | 3-5 alternatives + voice styles + comparison |
| **Optional Features** | 1-2 toggles max (SEO, Scores) | 3-4 features, understand when each helps | Strategic feature combination based on goals |
| **Template Usage** | Quick Start Templates only | Create 1-2 personal templates | Library of 10+ custom templates |
| **Comparison** | Skip or rarely | Use for important decisions | Standard practice for all important content |
| **Blending** | Skip | Try occasionally | Strategic use to combine best elements |
| **Time Per Project** | 10-15 minutes | 15-25 minutes | 20-40 minutes (but higher quality) |
| **Recommended Next Step** | Focus on improving inputs (audience, key message) | Learn which settings affect what | Optimize personal workflow and templates |

---

### Beginner Starting Checklist

If you're new to Copy Maker, follow this sequence: **Week 1:**
- [ ] Complete 5 projects using Quick Prompt Wizard
- [ ] Try both "Make New" and "Improve Existing" modes
- [ ] Create 1 alternative copy for each project
- [ ] Experiment with 3 different tones

**Week 2:**
- [ ] Switch to manual form entry (Smart Mode)
- [ ] Focus on writing specific Target Audience descriptions
- [ ] Try 5 different Quick Start Templates
- [ ] Use Special Instructions field on 3 projects

**Week 3:**
- [ ] Generate SEO Metadata for 3 projects
- [ ] Apply 5 different Voice Styles to your outputs
- [ ] Use Compare All Outputs feature
- [ ] Create and save your first template

**Week 4:**
- [ ] Try Expert Mode on 2 projects
- [ ] Experiment with Output Structure combinations
- [ ] Use the Blend feature
- [ ] Save outputs to Dashboard

**By Month 2, you should:**
- Understand which settings affect which aspects of output
- Have 3-5 saved templates for common use cases
- Be comfortable with iteration and comparison
- Spend 15-20 minutes per project on average

---

## 10. Feature Interactions: How Everything Connects

Understanding how Copy Maker features interact helps you use them strategically. ### Interaction 1: Smart Mode ↔ Quick Prompt Wizard

**How they connect:**

The Quick Prompt Wizard works best with Smart Mode:
- Wizard asks simple questions
- Fills Smart Mode fields automatically
- Hides Expert Mode complexity
- User can reveal "Show Advanced" if needed after wizard completes

**Strategic use:**
- New projects: Start with wizard → Switch to Expert Mode if you need advanced settings
- Familiar projects: Skip wizard → Manual Smart Mode → Fast generation

**Best practice:** Let wizard do initial setup, then switch modes if project complexity demands it. ---

### Interaction 2: Output Structure ↔ Word Count Settings

**How they connect:**

Output Structure and Word Count compete for priority: **Scenario A: Many structure elements + Strict word count**
- AI struggles to fit all elements in word limit
- Quality suffers or structure gets abbreviated
- Retry logic may fire repeatedly

**Scenario B: Many structure elements + Flexible word count**
- AI delivers all structure elements with appropriate detail
- Word count exceeded but quality maintained

**Scenario C: Simple structure + Strict word count**
- AI easily hits target
- Clean, concise output

**Strategic use:**
- Complex structure (5+ elements): Set word count high or turn OFF strict enforcement
- Simple structure (2-3 elements): Strict word count works well
- Unknown complexity: Start flexible, then enforce if needed

**Best practice:** Structure takes priority over word count in most cases. Let the content breathe. ---

### Interaction 3: Tone Setting ↔ Voice Style Application

**How they connect:**

Tone and Voice Style layer on top of each other: **Tone** = Baseline emotional character (set before generation)
**Voice Style** = Transformation applied after generation

**Example flow:**
1. Generate with Tone: "Professional"
2. Apply Voice Style: "Seth Godin"
3. Result: Professional baseline + Godin's punchy, metaphorical style

**What happens:**
- Voice Style respects original tone setting
- "Seth Godin" applied to "Friendly" tone = Approachable wisdom
- "Seth Godin" applied to "Bold" tone = Provocative insights

**Strategic use:**
- Set Tone based on audience expectations
- Apply Voice Style based on desired personality
- Can apply multiple voice styles to same base content

**Best practice:** Think of Tone as the foundation, Voice Style as the finishing touch. ---

### Interaction 4: Special Instructions ↔ All Other Settings

**How they connect:**

Special Instructions is the **override mechanism**:
- Other fields set defaults
- Special Instructions provides specific directions that take priority

**Example:**
- Tone: "Professional"
- Special Instructions: "Use casual, conversational language"
- Result: Special Instructions wins - output is casual

**Power move:**
- Use fields for standard setup
- Use Special Instructions for project-specific customization

**Strategic use:**
- Campaign-specific requirements: "This is for Black Friday - emphasize urgency"
- Brand exceptions: "Avoid industry jargon even though target audience is experts"
- Structural overrides: "Put CTA after every major section, not just at end"

**Best practice:** Special Instructions is your wildcard - use it to enforce anything that doesn't fit elsewhere. ---

### Interaction 5: Generate Scores ↔ Compare All Outputs

**How they connect:**

These are complementary evaluation tools: **Generate Scores:**
- Evaluates individual outputs
- Provides absolute scores (0-100)
- Shows specific strengths/weaknesses
- Use: Understand why one version works

**Compare All Outputs:**
- Evaluates outputs relative to each other
- Ranks versions
- Explains trade-offs
- Recommends winner
- Use: Choose between options

**Optimal workflow:**
1. Generate 3 versions
2. Generate Scores on each (understand individual quality)
3. Compare All (understand relative strengths)
4. Make informed decision

**Best practice:** Score first to understand quality, compare second to choose winner. ---

### Interaction 6: Saved Templates ↔ Optional Features

**How they connect:**

Templates save optional feature configurations: **Saved template includes:**
- All input fields
- All toggle states (SEO, Scores, Word Count Enforcement, etc.)
- Output structure preferences

**Power move:**
- Create template: "Product Page - Full SEO"
  - Generate SEO Metadata: ✅
  - Force Keyword Integration: ✅
  - Generate Scores: ✅
  - Prioritize Word Count: ❌
  - Standard output structure saved

**Strategic use:**
- Different templates for different content needs: - "Blog Post - Thought Leadership" (GEO optimization ON)
  - "Email - Promotional" (Word count strict ON)
  - "Landing Page - Hero" (SEO + Scores ON)

**Best practice:** Templates aren't just input presets - they're complete workflow configurations. ---

### Interaction 7: Alternative Creation ↔ Voice Style ↔ Blend

**How they connect:**

This is the **power combo** for best results: **The workflow:**
1. Generate initial copy
2. Create 2-3 alternatives (different angles)
3. Apply different voice styles to each alternative
4. Now you have 6-9 versions
5. Compare All
6. Blend top 2-3 versions
7. Final output combines best elements

**Why this works:**
- Alternatives explore different approaches
- Voice styles add personality variations
- Comparison objectively evaluates
- Blend creates hybrid excellence

**Example:**
- Alternative 1 (base) + "Steve Jobs" style = Bold, visionary
- Alternative 2 (base) + "Brené Brown" style = Empathetic, vulnerable
- Alternative 3 (base) + "Donald Miller" style = Clear, benefit-driven
- Compare → Blend Jobs' boldness + Miller's clarity
- Result: Visionary messaging with actionable benefits

**Best practice:** This is the "maximum quality" approach - use for critical content. ---

### Interaction 8: Improve Mode ↔ Modification Feature

**How they connect:**

These seem similar but serve different purposes: **Improve Existing Copy Mode:**
- Starting point: Your original text
- AI enhances overall quality
- Maintains your core structure
- Use: Modernize old content, polish rough drafts

**Modification Feature:**
- Starting point: Already-generated Copy Maker output
- AI makes specific targeted changes
- Adds or adjusts specific elements
- Use: Iterate on already-good content

**Workflow combination:**
1. Start with your old landing page (Improve Mode)
2. AI generates improved version
3. Use Modify to add specific element: "Add social proof section"
4. Use Modify again: "Strengthen the CTA"
5. Result: Enhanced + customized

**Best practice:** Improve Mode for major overhauls, Modify for precision tweaks. ---

## 11. Video Narration Tips + Suggested Visuals

### Section 1: Introduction

**Video Narration Tip:**
"Welcome to Copy Maker - your AI-powered copywriting assistant that doesn't just generate text, it understands your goals and creates multiple options so you can choose what works best."

**Suggested Visual:**
- Wide shot of the Copy Maker interface
- Highlight tab at top
- Quick montage of different output cards appearing
- End on the "Generate" button

---

### Section 2.1: AI Model Selection

**Video Narration Tip:**
"First, choose your AI model - think of this as choosing between a economy, luxury, or sports car. Each has different strengths and costs."

**Suggested Visual:**
- Close-up of model dropdown
- Hover over each model showing tooltip
- Highlight "GPT-4 Omni" as recommended starting point
- Show checkmark animation on selection

---

### Section 2.2: Make New vs Improve Existing

**Video Narration Tip:**
"Your first decision: are you creating fresh copy from scratch, or improving something you already have? This fundamentally changes how the AI approaches your project."

**Suggested Visual:**
- Split screen showing both tabs
- Left side: "Make New" tab with Business Description field highlighted
- Right side: "Improve Existing" tab with Original Copy field highlighted
- Animation showing text being created vs text being transformed

---

### Section 2.3: Core Input Fields

**Video Narration Tip:**
"Think of these fields as answering five questions: What are you making? Who's it for? What should it say? How should it sound? And what action should readers take?"

**Suggested Visual:**
- Scroll through form slowly
- Briefly highlight each field with label visible
- Show example text being typed into 2-3 key fields
- Time-lapse of form being filled out

---

### Section 2.4: Output Structure

**Video Narration Tip:**
"Output Structure is like building with blocks - drag and arrange the sections you want, and the AI assembles them in order."

**Suggested Visual:**
- Show structure picker interface
- Demonstrate dragging "Paragraph" above "Bullet Points"
- Show 3-4 structure elements being arranged
- Split screen showing structure picker vs final output with those sections

---

### Section 2.5: Special Instructions

**Video Narration Tip:**
"Special Instructions is your secret weapon - this is where you tell the AI anything specific that doesn't fit in other fields."

**Suggested Visual:**
- Zoom into Special Instructions field
- Type example: "Use short sentences. Reference our sustainability mission. End with a question."
- Show the generated output reflecting those instructions
- Highlight where each instruction appears in output

---

### Section 2.6: Smart Mode vs Expert Mode

**Video Narration Tip:**
"Smart Mode keeps it simple with essential fields. Expert Mode reveals advanced controls. Choose based on your experience and project complexity."

**Suggested Visual:**
- Toggle animation: Smart → Expert Mode
- Show interface expanding to reveal more fields
- Count indicator: "10 fields" → "30+ fields"
- Side-by-side comparison

---

### Section 2.7: Optional Features

**Video Narration Tip:**
"Optional Features are power-ups for your copy - turn on SEO metadata, content scoring, or word count enforcement when you need them."

**Suggested Visual:**
- Scroll through toggles section
- Show checkboxes being clicked ON
- Brief animation showing what each toggle produces (SEO metadata appearing, score card appearing)
- Highlight the "Show Advanced" button in Smart Mode

---

### Section 2.8: Quick Prompt Wizard

**Video Narration Tip:**
"Not sure where to start? The Quick Prompt Wizard asks simple questions and sets everything up for you automatically."

**Suggested Visual:**
- Click "Quick Setup Wizard" button
- Show wizard modal appearing
- Type answer into first question
- Fast-forward through questions (show 3 of 5)
- Show form auto-filling with wizard results
- End on "Apply and Generate" button

---

### Section 2.9: Templates

**Video Narration Tip:**
"Save time by creating templates for your common projects - one click loads all your settings and you're ready to generate."

**Suggested Visual:**
- Click "Saved Templates" dropdown
- Show list of templates
- Select one, watch form auto-fill
- Quick cut to "Save as Template" modal
- Show naming and saving process

---

### Section 3.1: Output Display

**Video Narration Tip:**
"After generating, your content appears as organized cards - each showing word count, generation time, and action buttons for further refinement."

**Suggested Visual:**
- Show "Generate" button click
- Loading animation
- Results section appearing with output cards
- Zoom in on one card showing all metadata
- Hover over action buttons showing tooltips

---

### Section 3.2: Modify Content

**Video Narration Tip:**
"Modify lets you make surgical changes - tell the AI exactly what to add, change, or improve, and it updates that specific output."

**Suggested Visual:**
- Click "Modify" button on output card
- Modal opens with instruction field
- Type: "Add a statistics section"
- Show modified version appearing indented below original
- Side-by-side comparison highlighting the added section

---

### Section 3.3: Alternative Copy

**Video Narration Tip:**
"Create Alternative explores different angles - same message, different approach. Generate three alternatives and you'll have options to choose from."

**Suggested Visual:**
- Click "Create Alternative" button
- Show new card appearing at same level
- Compare first paragraph of original vs alternative
- Show 3 alternatives stacked, highlighting different opening hooks

---

### Section 3.4: Voice Styles

**Video Narration Tip:**
"Voice Styles transform your copy to sound like famous communicators or match specific brand personalities - from Steve Jobs' boldness to Brené Brown's empathy."

**Suggested Visual:**
- Click "Apply Voice Style" button
- Show dropdown with categorized styles
- Hover over 2-3 personas showing tooltips
- Select "Donald Miller"
- Show styled version appearing indented
- Split screen comparing original vs styled version

---

### Section 3.5: Compare All Outputs

**Video Narration Tip:**
"When you have multiple versions, let the AI objectively evaluate them - it scores each one and recommends the winner based on your goals."

**Suggested Visual:**
- Show 4 output cards on screen
- Click "Compare All Outputs" button
- Comparison card appears with loading animation
- Zoom in on scores: 82, 88, 91, 85
- Highlight recommended version with star
- Show detailed breakdown section

---

### Section 3.6: Blend Outputs

**Video Narration Tip:**
"Blend takes the best parts of multiple versions and combines them into one superior version - the AI's hook with version two's benefits and version three's closing."

**Suggested Visual:**
- From comparison results, show "Blend" button
- Modal with version checkboxes
- Select 3 versions
- Blended output appears
- Side-by-side showing source versions and blended result
- Highlight which sentences came from which source

---

### Section 3.7: Floating Action Buttons

**Video Narration Tip:**
"When you're done, these action buttons let you save to your dashboard, export as Markdown, or download as HTML which you can print to PDF from your browser."

**Suggested Visual:**
- Zoom to right-side floating bar
- Hover over each button showing tooltip
- Click "Save Output" - show success message
- Click "Copy as Markdown" - show clipboard animation
- Click "Export as HTML" - show download notification

---

### Section 4: Miscellaneous Features

**Video Narration Tip:**
"A few final tips: use dark mode for long sessions, clear all when starting fresh, and check tooltips throughout the interface for helpful hints."

**Suggested Visual:**
- Toggle dark mode showing interface change
- Hover over info icons showing tooltips
- Click "Clear All" showing confirmation
- Show mobile responsive view
- End on navigation showing all sections

---

### Section 5: Summary

**Video Narration Tip:**
"Copy Maker gives you complete control over AI-generated content - from initial setup through multiple iterations to final export. The quality depends on your inputs and willingness to iterate."

**Suggested Visual:**
- Fast motion recap: Form filling → Generating → Creating alternatives → Comparing → Selecting winner → Exporting
- Montage of different output types (landing page, email, blog)
- Final shot: Completed project saved in dashboard
- Fade to Copy Maker logo

---

## 12. Glossary of Terms

### AI Model
The underlying artificial intelligence system that generates your content. Different models have different capabilities, costs, and maximum output lengths. Think of it like choosing between different writers with different specialties. ### Token
A unit of text measurement used by AI models. Roughly 0.75 words per token. Models have maximum token outputs (e. g., 8,192 tokens = ~6,000 words max). You don't need to count tokens manually - the system handles this. ### Tone
The overall emotional character of your content. Professional sounds authoritative, Friendly sounds approachable, Bold sounds confident. Tone affects word choice, sentence structure, and communication style throughout the generated copy. ### Tone Level
A 0-100 scale that adjusts how strongly your selected tone is applied. 50 is balanced, 80+ is very strong, 20 is subtle. For example, "Bold" at 30 is assertive; "Bold" at 90 is aggressive. ### Voice Style
A transformation applied to already-generated content that makes it sound like a specific person (e. g., Steve Jobs, Seth Godin) or match a specific style (e. g., Luxury Brand, Humanized). Different from Tone, which is set before generation. ### Output Structure
The organizational framework for your content. Instead of one long paragraph, you can specify sections like "Header 1 → Bullet Points → Benefits → CTA." The AI arranges content into these sections in the order you choose. ### Word Count Tolerance
When strict word count enforcement is ON, this percentage determines how close to target is acceptable. With 200-word target and 20% tolerance, the AI accepts 160-240 words. Below 160 triggers regeneration. ### Target Word Count
The approximate length you want the content to be. Options range from 50-100 (short social post) to 200-400+ (long-form). This is a guideline, not a strict limit unless you turn ON word count enforcement. ### SEO Metadata
Search Engine Optimization elements like URL slugs, meta descriptions, H1 tags, and Open Graph tags that help web pages rank in search engines. Copy Maker can auto-generate these alongside your content. ### GEO Score / GEO Optimization
Generative Engine Optimization - how well content performs in AI-powered search results (like ChatGPT search or Perplexity AI). Different from traditional SEO. Content optimized for GEO uses clear, direct answers and structured information. ### Alternative Copy
A different version of your content generated using the same inputs. Not just rephrased - an alternative explores different angles, hooks, or approaches to the same message. Used for A/B testing or finding the best approach. ### Modify Content
Making specific targeted changes to already-generated copy. For example, "add a statistics section" or "make the CTA stronger." Different from regenerating entirely - this is surgical editing. ### Comparison Result
When you use "Compare All Outputs," the AI evaluates all your generated versions and produces a detailed analysis showing scores, pros/cons, and recommendations for which version works best for your goals. ### Blend
Combining the best elements from multiple generated versions into one superior version. The AI intelligently merges the strongest hook, best benefits, clearest explanations, etc. from different outputs. ### Special Instructions
A free-form text field where you can add any custom direction that doesn't fit in other fields. This overrides other settings when conflicts occur. Your "anything goes" customization field. ### Template
A saved configuration of all your form fields and settings. Load a template to instantly fill the entire form with your saved values. Useful for repeated work or team standardization. ### Quick Start Template
Pre-built example templates provided by Copy Maker for common use cases (landing pages, product descriptions, emails, etc.). Good starting points for learning what good inputs look like. ### Smart Mode vs Expert Mode
Two interface views. Smart Mode shows ~10 essential fields and hides advanced options. Expert Mode shows 30+ fields including funnel stages, language constraints, tone levels, and more. Switch based on your experience and project complexity. ### Quick Prompt Wizard
A guided, conversational setup tool that asks 3-5 simple questions and automatically fills out the form for you. Good for beginners or when you're not sure how to structure your inputs. ### Floating Action Buttons
The vertical button bar on the right side of the screen that provides quick access to Save, Copy as Markdown, Export as HTML, and View Prompts actions. ### Reader Funnel Stage
Where your audience is in their buying journey: Awareness (just learning), Consideration (evaluating options), Decision (ready to buy), Retention (existing customers), or Advocacy (happy referrers). Affects messaging approach. ### Persona
In voice styles, a persona is a famous communicator whose style can be applied to your content (e. g., Alex Hormozi, Marie Forleo, Gary Halbert). Each persona has distinct patterns that transform your copy. ### Language Style Constraints
Specific writing rules you want enforced: avoid passive voice, no jargon, short sentences, simple vocabulary, etc. Multiple constraints can be selected to shape how the AI writes. ### Content Quality Score
A 0-100 rating the AI assigns to generated content based on dimensions like clarity, engagement, persuasiveness, tone match, and structure. Helps you objectively evaluate which versions work best. ### Keyword Integration
When turned ON, the AI ensures your specified keywords naturally appear throughout the content in a way that helps SEO without sounding forced or repetitive. ### TL; DR Summary
"Too Long; Didn't Read" - a brief 2-3 sentence summary of longer content. When GEO optimization is enabled, this can be auto-generated to appear at the top for quick scanning. ### Dashboard
Your saved projects area where all previously generated outputs, form configurations, and templates are stored. Access past projects, reload them for editing, or use them as reference. ### Humanize
A voice style that transforms AI-generated text to sound more naturally human-written. Reduces AI-like patterns, adds conversational elements, and includes subtle imperfections. The "No AI Detection" variant specifically aims to pass AI detection tools. ---

## 13. Motivational Closing: Master Your Message

You've just learned how to wield one of the most powerful content creation tools available today. Copy Maker isn't about replacing human creativity - it's about amplifying it. It's about taking the tedious parts of copywriting (finding the right words, exploring different angles, maintaining consistency) and automating them so you can focus on strategy, creativity, and connection. Think about what you can do with this tool: **For Solo Creators:**
You're no longer limited by your writing speed. Generate a week's worth of social content in an afternoon. Create multiple landing page variations for A/B testing. Polish every piece of content to professional standards before publishing. **For Marketing Teams:**
Establish brand voice consistency across all team members with saved templates. Produce more content without hiring more writers. Test messaging variations before committing to campaigns. Spend less time on first drafts and more time on strategy. **For Agencies:**
Deliver client copy faster without sacrificing quality. Show multiple options instead of just one. Adapt copy to different channels and audiences instantly. Scale content production to match client demand. **For Businesses:**
Create professional copy without expensive freelancers. Update outdated content across your website efficiently. Launch campaigns faster. Compete with bigger companies' content output. But here's the truth: **Copy Maker is only as good as you make it.**

The AI doesn't know your customers like you do. It doesn't understand your brand's subtle personality quirks. It can't feel the energy in your office or the passion behind your mission. That's where you come in. Your knowledge of your audience. Your understanding of what makes your product special. Your sense of which message will resonate. That's irreplaceable. Copy Maker takes your insights and transforms them into polished, professional copy. It gives you 10 options where you might have struggled to write one. It shows you angles you hadn't considered. It helps you say what you want to say in the way you want to say it. The best Copy Maker users aren't the ones who know every feature by heart. They're the ones who:
- **Understand their audience deeply** and translate that into specific inputs
- **Iterate fearlessly** because they know first drafts are starting points, not endpoints
- **Trust the process** of generating, comparing, and refining
- **Combine AI efficiency with human judgment** rather than treating AI as oracle or enemy

You're not just learning a tool. You're developing a new skill: **AI-assisted copywriting**. And like any skill, you'll get better with practice. Your first project might take 45 minutes as you explore features and learn what works. By your tenth project, you'll complete the same quality work in 15 minutes because you understand the patterns. By month three, you'll have templates, workflows, and intuitions about which settings produce which results. You'll teach colleagues. You'll establish team standards. You'll create content that would have seemed impossible to produce at this quality and speed just months earlier. **So here's your challenge:**

Don't just read this documentation and close the tab. Open Copy Maker right now and create something. Anything. - That landing page you've been putting off
- The product description that needs updating
- The email campaign you've been dreading
- The blog post that's been sitting in drafts for weeks

Use the Quick Prompt Wizard if you're nervous. Follow the workflows in Section 6 if you want guidance. Make mistakes. Generate terrible copy and then make it better. Because the only way to master this tool is to use it. And when you create something you're proud of - copy that perfectly captures your message, that sounds exactly like your brand, that you know will resonate with your audience - you'll realize something important: **You didn't just use a tool. You amplified your expertise.**

The AI provided the polish, the variations, the speed. But the strategy, the insights, the understanding of what matters - that was all you. Welcome to the future of copywriting. Where human creativity and AI efficiency combine to create better content, faster, more consistently than either could alone. Your message matters. Make it count. Now go create something remarkable. ---

**End of Complete Analysis**
**Version:** 2.0 Extended
**Date:** November 10, 2025
**Total Sections:** 13
**Focus:** Copy Maker Complete Functionality + Practical Application + Training Support
**Purpose:** Official documentation, training material, demo video scripting, team onboarding
**Next Steps:** Use this as your comprehensive reference for all Copy Maker education and demonstration needs

---

**Sharpen Studio Documentation Series – CopyZap / Copy Maker Module**  
Last Updated: November 2025

---
