# CopyZap - Recommended Default Settings

## Overview

This guide provides proven default configurations for common scenarios, saving time and ensuring quality results from the start.

---

## Universal Defaults (All Content Types)

### Core Settings

**AI Model:** DeepSeek V3
- Best cost/quality balance for most content
- Upgrade to GPT-4 Turbo if insufficient
- Reserve GPT-4o for critical content only

**Language:** English (or your target language)

**Tone Level:** 5 (Moderate)
- Balanced expression
- Not too subtle, not too extreme
- Adjust up/down based on results

**Generate SEO Metadata:** YES (if web content)
- Variants: 1-2 of each (not 5)
- More variants only for A/B testing

**Generate Scores:** NO (initially)
- Enable after reviewing base content
- Only generate for quality assurance

**Generate GEO:** YES (future-proofing)
- Add TL;DR: YES
- Minimal cost, high value

### Field Priorities

**Always Fill (Critical):**
- Business Description (100-200 words)
- Target Audience (specific details)
- Product/Service Name
- Tone
- Word Count

**Fill When Applicable:**
- Target Audience Pain Points
- Key Message
- Call to Action
- Special Instructions
- Keywords (if SEO matters)

**Optional:**
- Brand Values
- Desired Emotion
- Context
- Excluded Terms
- Output Structure (unless complex content)

---

## By Content Type

### Landing Page (Hero Section)

**Recommended Configuration:**

```
Mode: Create New Copy
AI Model: GPT-4 Turbo
Word Count: Medium (100-200) or Custom (150)
Tone: Persuasive or Professional
Tone Level: 6-7

Output Structure:
- Header 1
- Problem (75 words)
- Solution (100 words)
- Call to Action (30 words)

Generate SEO: YES
- URL Slugs: 2
- Meta Descriptions: 2
- H1 Variants: 3
- OG Tags: 2

Generate GEO: YES
- Add TL;DR: YES

Special Instructions:
"Maximum 3 sentences per paragraph. Bold product name on first mention.
Include one compelling statistic or metric. End with clear, low-pressure CTA."
```

**Why These Defaults:**
- GPT-4 Turbo: Quality/cost balance
- 150 words: Optimal hero length
- Structure ensures completeness
- SEO critical for landing pages
- GEO future-proofs content

---

### Blog Post (1000-1500 words)

**Recommended Configuration:**

```
Mode: Create New Copy
AI Model: DeepSeek V3
Word Count: Custom (1200)
Tone: Conversational or Informative
Tone Level: 5

Output Structure:
- Introduction (150 words)
- Header 2 - Section 1 (300 words)
- Header 2 - Section 2 (300 words)
- Header 2 - Section 3 (300 words)
- Conclusion (150 words)

Generate SEO: YES
- URL Slugs: 2
- Meta Descriptions: 2
- H1: 2
- H2: 5-7
- H3: 3-5

Generate GEO: YES
- Add TL;DR: YES

Special Instructions:
"Use subheadings within each H2 section. Include concrete examples throughout.
Write in second person ('you'). Add actionable tips in each section. Keep
paragraphs under 4 sentences."
```

**Why These Defaults:**
- DeepSeek V3: Cost-effective for long-form
- 1200 words: Comprehensive without overwhelming
- Structure ensures flow
- Heavy SEO focus (blogs drive organic traffic)

---

### Email Campaign

**Recommended Configuration:**

```
Mode: Create New Copy
AI Model: GPT-4 Turbo
Word Count: Short (50-100) or Medium (100-200)
Tone: Friendly or Persuasive
Tone Level: 6

Output Structure: None (natural flow)

Generate SEO: NO (emails not indexed)
Generate GEO: NO
Generate Scores: YES (for quality check)

Special Instructions:
"Mobile-first: very short paragraphs (2-3 sentences max). Use 'you' language
throughout. Include one clear call-to-action. Conversational subject line style.
No jargon - write like emailing a colleague."
```

**Why These Defaults:**
- GPT-4 Turbo: Email quality matters
- 100-150 words: Optimal email length
- No structure: Natural flow works better
- Skip SEO: Not applicable
- Scores: Quality assurance for sends

---

### Product Description

**Recommended Configuration:**

```
Mode: Create New Copy
AI Model: DeepSeek V3 (volume) or GPT-4 Turbo (premium)
Word Count: Short (50-100) or Medium (100-200)
Tone: Professional or Persuasive
Tone Level: 5-6

Output Structure:
- Header 1 (Product Name + Benefit)
- Problem (50 words)
- Solution (75 words)
- Features (as bullet points)
- Call to Action (25 words)

Generate SEO: YES
- Focus on URL slug and meta description
- H1/H2: 2 each

Generate GEO: YES

Special Instructions:
"Focus on benefits, not just features. Use sensory language where appropriate.
Include specific use cases. Bold key features. End with compelling reason to
buy now."
```

**Why These Defaults:**
- DeepSeek for volume, GPT-4 Turbo for flagship
- 100-150 words: E-commerce sweet spot
- Structure ensures persuasive flow
- SEO critical for product discovery

---

### Social Media Post

**Recommended Configuration:**

```
Mode: Create New Copy
AI Model: DeepSeek V3 or GPT-3.5 Turbo
Word Count: Custom (depends on platform)
- Twitter/X: 280 characters
- LinkedIn: 150-200 words
- Facebook: 100-150 words
- Instagram: 125-150 words

Tone: Friendly, Bold, or Creative
Tone Level: 7-8

Output Structure: None

Generate SEO: NO
Generate GEO: NO

Special Instructions:
"Platform: [specify]. Conversational and engaging. Include hook in first sentence.
Natural CTA at end. Hashtag suggestions if appropriate. Mobile-optimized short
paragraphs."
```

**Why These Defaults:**
- Cheapest models sufficient
- Custom word counts match platforms
- Higher tone level (social allows personality)
- No SEO/GEO needed

---

### Ad Copy (Google/Facebook/LinkedIn)

**Recommended Configuration:**

```
Mode: Create New Copy
AI Model: GPT-4 Turbo
Word Count: Custom (strict platform limits)
- Google Search Ad: Headline 30 chars, Description 90 chars
- Facebook Ad: 125 characters primary text
- LinkedIn Ad: 150 characters

Tone: Persuasive or Bold
Tone Level: 7

Prioritize Word Count: YES
Little Word Count Mode: YES

Output Structure: None

Generate SEO: NO
Generate Scores: YES (optimize for conversions)

Special Instructions:
"Platform: [specify]. Every word must count. Lead with benefit, not feature.
Include clear CTA. Speak directly to pain point. Use power words. No wasted
words - ultra concise."
```

**Why These Defaults:**
- GPT-4 Turbo: Quality critical for ads
- Exact word limits: Ads have strict requirements
- Word count precision: Must hit limits exactly
- Scores: A/B test optimization

---

### Case Study / White Paper

**Recommended Configuration:**

```
Mode: Create New Copy
AI Model: ChatGPT-4o Latest (extended output)
Word Count: Custom (2000-3000)
Tone: Professional or Informative
Tone Level: 4-5

Output Structure:
- Introduction (200 words)
- Challenge/Problem (400 words)
- Solution/Approach (600 words)
- Results/Outcomes (600 words)
- Key Takeaways (200 words)
- Conclusion (200 words)

Generate SEO: YES (full metadata)
Generate GEO: YES (highly citable content)

Special Instructions:
"Use specific data and metrics throughout. Include direct quotes if available.
Structure with clear subheadings. Use 'The company' or client name. Present
information objectively. Include statistical proof of results."
```

**Why These Defaults:**
- ChatGPT-4o Latest: Extended output for long-form
- 2000-3000 words: Standard case study length
- Heavy structure: Ensures completeness
- Full SEO/GEO: High-value content

---

### Sales Page (Long-Form)

**Recommended Configuration:**

```
Mode: Create New Copy
AI Model: GPT-4o (quality critical)
Word Count: Custom (1500-2500)
Tone: Persuasive
Tone Level: 7

Output Structure:
- Header 1 (Attention-grabbing)
- Problem (300 words - paint the pain)
- Solution (400 words - introduce product)
- Benefits (300 words - transform life)
- Features (200 words - how it works)
- Social Proof (200 words - testimonials/stats)
- Comparison (150 words - vs alternatives)
- Guarantee (100 words - reduce risk)
- Call to Action (200 words - compelling close)

Generate SEO: YES
Generate GEO: YES
Generate Scores: YES (optimize conversions)

Special Instructions:
"Use PAS framework (Problem-Agitate-Solution). Include specific results and
transformations. Use 'you' language throughout. Add urgency without false
scarcity. Bold all key benefits. Include micro-commitments throughout."
```

**Why These Defaults:**
- GPT-4o: Sales copy quality critical
- Long-form: Persuasion requires space
- Detailed structure: Proven sales framework
- Full optimization: High-stakes content

---

## By Experience Level

### Beginners (First Week)

**Start Simple:**
```
Mode: Create (or use Wizard)
AI Model: DeepSeek V3
Word Count: Medium (100-200)
Tone: Friendly or Professional
Tone Level: 5

Output Structure: None (let AI decide)
Generate SEO: NO (initially)
Generate GEO: NO (initially)
Generate Scores: YES (learn what's good)

Special Instructions: Keep minimal or empty initially
```

**Why:** Learn basics without overwhelming complexity

**Progression:**
- Week 1: Minimal settings, learn interface
- Week 2: Add Special Instructions
- Week 3: Add Output Structure
- Week 4: Enable SEO/GEO, test models

### Intermediate (Month 2-3)

**Standard Approach:**
```
AI Model: Mix DeepSeek V3 and GPT-4 Turbo based on importance
Output Structure: Use for complex content
SEO/GEO: Enable based on content type
Special Instructions: 3-5 key requirements
Templates: Build library of 5-10 core templates
```

### Advanced (Month 4+)

**Optimized Workflow:**
```
Model Selection: Strategic (right model for job)
Templates: 15+ specialized templates
Prefills: Extensive library
Special Instructions: Detailed, refined
Multi-Model Testing: Compare approaches
Voice Styles: Strategic persona application
Modify Content: Surgical improvements
```

---

## By Budget Level

### Tight Budget

**Cost-Optimized Defaults:**
```
AI Model: DeepSeek V3 (primary), GPT-3.5 Turbo (volume)
SEO Variants: 1 of each (not 5)
Generate Scores: Only for final versions
Alternatives: Generate 1, not 3
Voice Styles: Test 1-2, not all
Strategy: Start cheap, upgrade if insufficient
```

**Expected Costs:** $10-50/month for moderate use

### Medium Budget

**Balanced Defaults:**
```
AI Model: Mix of DeepSeek V3 (60%), GPT-4 Turbo (35%), GPT-4o (5%)
SEO Variants: 2 of each
Generate Scores: Regularly for quality assurance
Alternatives: 2-3 for important content
Voice Styles: Test 3-4 strategically
Strategy: Quality where it matters
```

**Expected Costs:** $50-200/month

### High Budget

**Quality-First Defaults:**
```
AI Model: GPT-4 Turbo (primary), GPT-4o (important content)
SEO Variants: 3-5 for A/B testing
Generate Scores: Always
Alternatives: 3-5 versions
Voice Styles: Test extensively
Strategy: Optimize for quality, test everything
```

**Expected Costs:** $200-500+/month

---

## Quick Reference: One-Page Defaults

### Most Common Scenario (80% of Use Cases)

```
✓ Mode: Create New Copy
✓ AI Model: DeepSeek V3
✓ Word Count: Medium (100-200) or Custom based on need
✓ Tone: Professional or Friendly (matching brand)
✓ Tone Level: 5
✓ Output Structure: None (for simple) or Basic Structure (for complex)
✓ Generate SEO: YES if web content (2 variants each)
✓ Generate GEO: YES (Add TL;DR: YES)
✓ Generate Scores: NO initially, YES after review
✓ Special Instructions: 3-5 key brand/formatting rules
✓ Keywords: Primary + 3-4 variations if SEO matters
```

**This configuration works for:**
- Most landing page sections
- Standard blog posts
- Product descriptions
- Service pages
- About pages
- Email content

**Adjust from these defaults based on:**
- Content importance (upgrade model)
- Budget constraints (downgrade model)
- Length requirements (custom word count)
- Specific needs (add to Special Instructions)

---

## Configuration Templates

### Template 1: Quick Content

```yaml
name: "Quick Content - Standard"
model: "deepseek-chat"
wordCount: "Medium: 100-200"
tone: "friendly"
toneLevel: 5
generateSeo: false
generateGeo: false
outputStructure: null
specialInstructions: "Conversational and clear. Short paragraphs."
```

### Template 2: SEO-Optimized Blog

```yaml
name: "SEO Blog Post"
model: "deepseek-chat"
wordCount: "Custom: 1200"
tone: "informative"
toneLevel: 5
generateSeo: true
seoVariants: 2
generateGeo: true
addTldr: true
outputStructure: [intro, h2, h2, h2, conclusion]
specialInstructions: "Subheadings in each section. Examples throughout. Actionable tips."
```

### Template 3: Premium Landing Page

```yaml
name: "Premium Landing Page"
model: "gpt-4-turbo"
wordCount: "Custom: 150"
tone: "persuasive"
toneLevel: 6
generateSeo: true
seoVariants: 3
generateGeo: true
addTldr: true
outputStructure: [h1, problem, solution, cta]
specialInstructions: "Bold product name. Include compelling metric. Clear CTA."
```

---

## Conclusion

**Starting Point > Perfection**

These defaults provide proven starting configurations. Adjust based on:
- Your specific needs
- Audience feedback
- Performance results
- Budget constraints
- Industry requirements

**Key Principles:**
1. Start with defaults
2. Generate content
3. Review results
4. Refine configuration
5. Save successful configs as templates
6. Build your optimized library

**Master these defaults to achieve 80% optimal results immediately, then refine to 100% through iteration.**
