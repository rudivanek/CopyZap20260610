# CopyZap — Original Homepage Snapshot

> Captured: 2026-04-16
> Source: /src/components/HomePage.tsx (live, router-rendered component)
> Method: Direct codebase extraction — no interpretation, no rewriting
> Note: Components in /src/components/pages/ (HeroSection, FeaturesSection, etc.) are NOT rendered on the live homepage. They are legacy/unused files. The live homepage is entirely rendered by HomePage.tsx.

---

## LIVE HOMEPAGE COMPONENT: HomePage.tsx

Route: `/` (unauthenticated users only — authenticated users are redirected to their last route)

---

---

## Section: Navigation Bar

**Type:** Sticky top nav
**Background:** White (light) / Gray-900 (dark)
**Border:** Bottom border gray-200 / gray-800
**Height:** h-14

### Logo / Brand
- Icon: `Sparkles` (orange-500)
- Text: **CopyZap**
- Link: `/`

### Desktop Nav Links (hidden on mobile)
| Label | Route |
|---|---|
| Help | `/help` |
| Blog | `/blog` |
| Login | `/login` |

### Desktop CTA Button
- Label: **Enter Beta**
- Route: `/create-account`
- Style: Orange-500 background, white text, hover orange-600, rounded

### Mobile Nav (shown when hamburger open)
| Label | Route |
|---|---|
| Help | `/help` |
| Blog | `/blog` |
| Login | `/login` |
| **Enter Beta** (button) | `/create-account` |

### Mobile Toggle
- Open state icon: `X`
- Closed state icon: `Menu`

---

---

## Section 1: HERO — Mental Framing

**Background:** White (light) / Black (dark)
**Padding:** pt-12 pb-10
**Layout:** Centered, max-width 4xl

### Headline (h1)
> A Smarter Way to Create Marketing Copy

### Body Text (paragraph)
> CopyZap eliminates subjective copy decisions by introducing a structured, professional process.
> You define strategic guardrails, generate focused variants, and evaluate what works — so every piece of copy is intentional, consistent with your brand, and easy to stand behind.

### CTAs

**Primary Button**
- Label: **Login**
- Route: `/login`
- Style: Orange-500 background, white text, hover orange-600, rounded, full-width on mobile

**Secondary Link**
- Label: **Learn How It Works**
- Href: `#spine` (anchor scroll)
- Style: Text link, gray-700 / gray-300, hover orange-500

---

---

## Section 2: CORE SPINE — How CopyZap Works

**ID:** `#spine`
**Background:** Gray-50 (light) / Gray-950 (dark)
**Border:** Top and bottom border
**Padding:** py-28
**Layout:** 3-column grid on desktop, single column on mobile

### Section Headline (h2)
> How CopyZap Works

### Section Subheadline (p)
> CopyZap structures decision-making through three iterative stages — not linear steps, but a workflow for making informed copy decisions.

### Stage Cards (3 cards)

---

**Card 1**
- Icon: `Target`
- Headline: **Define Your Copy Problem**
- Body: Constraints create focus; prompts create ambiguity. You're not describing what you want — you're defining boundaries the system must respect. CopyZap structures your inputs into explicit constraints before generation begins.

---

**Card 2**
- Icon: `Layers`
- Headline: **Generate Constrained Variants**
- Body: Multiple variants reveal patterns; single outputs hide alternatives. The system produces options within your defined boundaries, letting you explore possibilities rather than accepting the first draft.

---

**Card 3**
- Icon: `BarChart3`
- Headline: **Evaluate & Refine**
- Body: Decisions should be informed, not intuitive. CopyZap provides data-driven insights on clarity, tone, and structure so you're measuring what works, not guessing.

---

---

## Section 3: CAPABILITIES BY THINKING STAGE

**Background:** Gray-50 (light) / Gray-950 (dark)
**Padding:** py-20
**Layout:** 3-column grid on desktop

### Section Headline (h2)
> Capabilities That Support Your Workflow

### Section Subheadline (p)
> Features organized by when you use them — not what they do.

### Column 1 — Define Your Copy Problem
**Description:** Clarifying intent and constraints before generation

| Icon | Name | Description |
|---|---|---|
| Megaphone | Brand Voice Extraction | Pull voice from existing content |
| Target | Competitor Analysis | Define differentiation constraints |
| User | Audience Targeting | Structure demographic and psychographic inputs |
| MapPin | GEO Customization | Add location-specific constraints |
| FileText | Template System | Reuse proven constraint sets |

### Column 2 — Generate Constrained Variants
**Description:** Producing options within defined boundaries

| Icon | Name | Description |
|---|---|---|
| Lightbulb | Structured Prompting | Inputs become constraints automatically |
| Settings2 | Multi-Mode Generation | Switch between depth levels (Quick/Smart/Expert) |
| Palette | Voice Style Blending | Combine brand + style influences |
| Sliders | Output Structure Control | Define format before generation |
| Layers | Variant Control | Generate multiple versions, not just one |

### Column 3 — Evaluate & Refine
**Description:** Making informed decisions about outputs

| Icon | Name | Description |
|---|---|---|
| TrendingUp | Data-Driven Scoring | Clarity, tone, audience fit metrics |
| BarChart3 | Variant Comparison | Side-by-side evaluation |
| Edit | Inline Refinement | Adjust elements without regeneration |
| Globe | AI Search Optimization | Evaluate for modern search engines |
| Folder | Output Management | Save, version, organize decisions |

---

---

## Section 4: USER FILTERING — Who CopyZap Is Built For

**Background:** White (light) / Black (dark)
**Padding:** py-20
**Layout:** Centered, max-width 3xl

### Section Headline (h2)
> Who CopyZap Is Built For

### Section Subheadline (p)
> CopyZap serves users who need structured copy systems.

### "Built For" Card
**Background:** Green-50 / Green-950/30
**Border:** Green-200 / Green-900
**Header Icon:** `CheckCircle` (green-600)
**Header Label:** CopyZap Is Built For

**List items:**

| User Type | Reason |
|---|---|
| Marketers managing multiple campaigns | Need consistent voice + speed + evaluation |
| Agencies producing client work | Require templates, versioning, and quality standards |
| Content teams with brand guidelines | Must maintain voice while scaling production |
| Professionals who've hit prompt tool limits | Understand constraints > prompts |
| Users who value control over convenience | CopyZap trades simplicity for precision |

---

---

## Section 5: FINAL CTA

**Background:** Gray-50 (light) / Gray-950 (dark)
**Padding:** py-24
**Layout:** Centered, max-width 3xl

### Headline (h2)
> If CopyZap's Approach Matches Your Workflow

### Body Text (p)
> Beta access is for active testers committed to providing feedback. If you're ready to invest time learning a structured system, request access or explore the help documentation first.

### CTAs

**Primary Button**
- Label: **Request Beta Access**
- Route: `/create-account`
- Style: Orange-500 background, white text, hover orange-600, rounded, py-2.5 px-6

**Secondary Link**
- Label: **Read Help Docs First**
- Route: `/help`
- Style: Text link, gray-700 / gray-300, hover orange-500

---

---

## Section 6: FOOTER

**Background:** White (light) / Black (dark)
**Border:** Top border gray-300 / gray-800
**Padding:** py-10

### Row 1 (flex, space-between)
- **Left:** Social share buttons (SocialShare component)
- **Center:** Nav links: Help Center → `/help` | Blog → `/blog` | Privacy → `/privacy`
- **Right:** Text: © 2025 CopyZap

### Row 2 (centered, border-top)
- Text: Powered by **Sharpen.Studio** (link to `https://sharpen.studio/en/`, orange-500, opens in new tab)
- Version text: **CopyZap - V.8.7**

---

---

## UNUSED LEGACY HOMEPAGE COMPONENTS

The following components exist in `/src/components/pages/` but are NOT imported or rendered in the live application. They appear to be from a previous homepage design.

### x-HomePage.tsx
- Not imported anywhere in the router
- Status: Orphaned file

### HeroSection.tsx
- **Headline:** Create Copy That Sells — Instantly
- **Subheadline:** CopyZap turns your ideas into persuasive marketing content powered by advanced AI. From ad campaigns to web pages, generate and refine professional-grade copy fine-tuned for clarity, tone, and results.
- **CTA 1 (button):** Start Free Beta → triggers beta modal
- **CTA 2 (link):** Login to Get Started → `/copy-maker`
- **Trust line:** No credit card required. Start creating better copy today.
- Status: NOT rendered live

### FeaturesSection.tsx
- **Section Headline:** Everything You Need to Create, Refine, and Scale Winning Copy
- **Section Subheadline:** From ideation to optimization, CopyZap gives you the tools to craft compelling marketing content at scale.
- **3 groups:**
  - Create Faster: Copy Maker Hub / Templates & Dashboard
  - Refine Smarter: Improve Existing Copy / Content Scoring & Insights
  - Optimize for Results: SEO & GEO Enhancements / Advanced Customizations
- Status: NOT rendered live

### HowItWorksSection.tsx
- **Section Headline:** How It Works — From Brief to Polished Copy in Minutes
- **Section Subheadline:** A streamlined workflow that takes you from concept to conversion-ready content.
- **3 steps:**
  - Step 1: Describe Your Project — Tell CopyZap what you're writing and who it's for.
  - Step 2: Generate & Refine — AI drafts your copy, scores it for clarity, and suggests improvements.
  - Step 3: Review & Export — Polish your copy, export as Markdown or HTML, and save templates for later.
- Status: NOT rendered live

### WhyUsersLoveSection.tsx
- **Section Headline:** Why Marketers & Agencies Choose CopyZap
- **Section Subheadline:** Join hundreds of professionals who've transformed their content workflow.
- **4 benefits:**
  - Save hours weekly with dynamic, context-aware generation.
  - Keep consistent brand tone using reusable templates.
  - Boost conversions with data-driven scoring & insights.
  - Manage projects seamlessly with your personalized dashboard.
- **CTA:** Try CopyZap Free → triggers beta modal
- **Trust line:** No credit card required. Start creating better copy today.
- Status: NOT rendered live

### VideoSection.tsx
- **Embedded video:** Vimeo `1137097120`
- **Video title:** CopyZap: Quick Copy Wizard - Create new Copy from an URL
- **Button:** Watch Video (blue, opens VideoModal)
- Status: NOT rendered live

### TopNavigation.tsx
- **Logo:** `/copyzap.png` image
- **Nav links:** Help / Blog / Login (→ `/copy-maker`)
- **CTA:** Start Free Beta → triggers beta modal
- Status: NOT rendered live

### FooterSection.tsx
- Social share + Privacy link + © 2025 CopyZap
- Help Center / Blog / Privacy Policy / Terms & Conditions links
- Powered by Sharpen.Studio
- Status: NOT rendered live

---

## HOMEPAGE CONTENT INVENTORY SUMMARY

| Element | Current Value |
|---|---|
| Nav CTA | Enter Beta |
| Hero headline | A Smarter Way to Create Marketing Copy |
| Hero primary CTA | Login |
| Hero secondary CTA | Learn How It Works |
| Section 2 headline | How CopyZap Works |
| Section 3 headline | Capabilities That Support Your Workflow |
| Section 4 headline | Who CopyZap Is Built For |
| Section 5 headline | If CopyZap's Approach Matches Your Workflow |
| Final primary CTA | Request Beta Access |
| Final secondary CTA | Read Help Docs First |
| Footer copyright | © 2025 CopyZap |
| Version | V.8.7 |
| Powered by | Sharpen.Studio |

---

*End of Original Homepage Snapshot*
*This file is a true content snapshot. Nothing has been rewritten, improved, or interpreted.*
*Use this as the baseline for comparison against future homepage versions.*
