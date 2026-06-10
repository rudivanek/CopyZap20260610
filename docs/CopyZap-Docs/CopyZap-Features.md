# CopyZap - Complete Feature Documentation
**Last Updated:** 2026-02-20T00:00:00 UTC
**Version:** 8.7.5 (Pre-Generation Session Saving)

---

## Document Overview

*Note: This document serves as training material, user guidance, and feature demonstration. For technical implementation details and canonical system behavior, refer to CopyZap_Documentation.md.*

This comprehensive reference guide covers every aspect of **CopyZap**'s **Copy Maker** module. It serves as complete functional documentation, training material, and demonstration resource.

**Terminology:**
- **CopyZap** = the product
- **Copy Maker** = the core module within CopyZap responsible for content generation

## Table of Contents

- [1. Introduction](#1.-introduction)
  - [What is Copy Maker? Copy Maker is the core content generation engine of CopyZap. It's an AI-powered tool that helps you create, improve, and refine marketing copy, website content, product descriptions, emails, and any other written content you need. Think of it as your AI copywriting assistant that doesn't just generate text - it understands context, follows your instructions, adapts to different tones and styles, and gives you multiple options to choose from.  What This Document Covers](#what-is-copy-maker?-copy-maker-is-the-core-content-generation-engine-of-copyzap-it's-an-ai-powered-tool-that-helps-you-create-improve-and-refine-marketing-copy-website-content-product-descriptions-emails-and-any-other-written-content-you-need-think-of-it-as-your-ai-copywriting-assistant-that-doesn't-just-generate-text---it-understands-context-follows-your-instructions-adapts-to-different-tones-and-styles-and-gives-you-multiple-options-to-choose-from--what-this-document-covers)
- [2. Core Modules](#2.-core-modules)
  - [2.1 Copy Maker](#21-copy-maker)
    - [2.1.1 Project Setup](#211-project-setup)
  - [2.1 AI Model Selection](#21-ai-model-selection)
    - [How Model Choice Affects Output](#how-model-choice-affects-output)
  - [2.2 Core Input Fields](#22-core-input-fields)
    - [Project Description](#project-description)
    - [Brief Description](#brief-description)
    - [Product/Service Name](#product/service-name)
    - [Business Description (Make New Copy mode)](#business-description-make-new-copy-mode)
    - [Original Copy (Improve Existing Copy mode)](#original-copy-improve-existing-copy-mode)
    - [Target Audience](#target-audience)
    - [Key Message](#key-message)
    - [Desired Emotion](#desired-emotion)
    - [Call to Action](#call-to-action)
    - [Brand Values](#brand-values)
    - [Keywords](#keywords)
    - [Context](#context)
    - [Industry/Niche](#industry/niche)
    - [Language](#language)
    - [Tone](#tone)
    - [Tone Level (Slider)](#tone-level-slider)
    - [Reader Funnel Stage](#reader-funnel-stage)
    - [Competitor URLs / Competitor Copy Text](#competitor-urls-/-competitor-copy-text)
    - [Target Audience Pain Points](#target-audience-pain-points)
    - [Preferred Writing Style](#preferred-writing-style)
    - [Language Style Constraints](#language-style-constraints)
    - [Excluded Terms](#excluded-terms)
  - [2.3 Target Word Count](#23-target-word-count)
  - [2.4 Output Structure](#24-output-structure)
  - [2.5 Special Instructions](#25-special-instructions)
  - [2.6 New 3-Mode System (Quick, Standard, Advanced)](#26-new-3-mode-system-quick-standard-advanced)
  - [2.7 AI Engine Mode Selection](#27-ai-engine-mode-selection)
  - [2.8 Optional Features (Toggles)](#28-optional-features-toggles)
    - [Generate Content Scores](#generate-content-scores)
    - [Generate GEO Score](#generate-geo-score)
    - [Force Keyword Integration](#force-keyword-integration)
    - [Force Elaborations & Examples](#force-elaborations--examples)
    - [Prioritize Word Count (Strict Enforcement)](#prioritize-word-count-strict-enforcement)
    - [Adhere to Little Word Count](#adhere-to-little-word-count)
    - [Enhance for GEO](#enhance-for-geo)
    - [Location & GEO Regions](#location--geo-regions)
  - [2.9 Quick Prompt Wizard 2.0](#29-quick-prompt-wizard-20)
    - [What's New in 2.0:](#what's-new-in-20)
    - [Two-Step Wizard Flow:](#two-step-wizard-flow)
    - [Smart Inference Examples:](#smart-inference-examples)
    - [Customer → Brand Voice Auto-Selection:](#customer-→-brand-voice-auto-selection)
    - [Auto-Language Detection:](#auto-language-detection)
    - [Wizard 1.0 vs 2.0 Comparison:](#wizard-10-vs-20-comparison)
    - [Example Flows:](#example-flows)
    - [Advanced 2.0 Features:](#advanced-20-features)
    - [When to Use 2.0 vs Manual Form:](#when-to-use-20-vs-manual-form)
    - [Best Practices:](#best-practices)
    - [Technical Notes:](#technical-notes)
  - [2.10 Saved Templates](#210-saved-templates)
  - [2.11 Quick Start Templates](#211-quick-start-templates)
  - [2.12 Evaluate Inputs Button](#212-evaluate-inputs-button)
  - [2.13 Collapsible Section Interface](#213-collapsible-section-interface)
  - [2.14 Export / Import JSON](#214-export-/-import-json)
  - [2.15 Start Hub / Project Launcher](#215-start-hub--project-launcher)
    - [2.1.2 Generated Output & Management](#212-generated-output--management)
  - [3.2 Modify Content](#32-modify-content)
  - [3.3 Get Modification Suggestions](#33-get-modification-suggestions)
  - [3.4 Create Alternative Copy](#34-create-alternative-copy)
  - [3.5 Apply Voice Style](#35-apply-voice-style)
    - [Humanization Options: **Humanize**](#humanization-options-**humanize**)
    - [Generic Tone/Style: **Luxury Brand**](#generic-tone/style-**luxury-brand**)
    - [Personas (Famous Communicators): **Alex Hormozi**](#personas-famous-communicators-**alex-hormozi**)
  - [3.6 Additional Instructions (Voice Style)](#36-additional-instructions-voice-style)
  - [3.7 Voice Style Quick Reference Table](#37-voice-style-quick-reference-table)
  - [3.8 Endless Combinations: Chaining Features](#38-endless-combinations-chaining-features)
  - [3.9 Compare All Outputs](#39-compare-all-outputs)
  - [3.10 Blend Outputs](#310-blend-outputs)
  - [3.11 Right Floating Action Buttons](#311-right-floating-action-buttons)
    - [2. Copy as Markdown](#2-copy-as-markdown)
- [Improved Copy](#improved-copy)
- [Alternative Copy](#alternative-copy)
  - [3.12 Advanced Copy Maker Features](#312-advanced-copy-maker-features)
  - [4.1 Model Token Limits](#41-model-token-limits)
  - [4.2 Auto Language Detection (Wizard)](#42-auto-language-detection-wizard)
  - [4.3 Content Quality Indicators](#43-content-quality-indicators)
  - [4.4 Word Count Accuracy Tracking](#44-word-count-accuracy-tracking)
  - [4.5 Loading States and Progress](#45-loading-states-and-progress)
  - [4.6 URL Parameter Loading](#46-url-parameter-loading)
  - [4.7 Dark Mode Support](#47-dark-mode-support)
  - [4.8 Clear All Button](#48-clear-all-button)
  - [4.9 Delete Individual Outputs](#49-delete-individual-outputs)
  - [4.10 Tooltips and Help Text](#410-tooltips-and-help-text)
  - [4.11 Responsive Design](#411-responsive-design)
  - [4.12 Location Restoration (Session Persistence)](#412-location-restoration-session-persistence)
  - [2.2 Brand Voice System](#22-brand-voice-system)
  - [What Is the Brand Voice System?](#what-is-the-brand-voice-system?)
  - ["Save as Brand Voice" Workflow](#"save-as-brand-voice"-workflow)
  - [Brand Voice Extraction via AI Analysis](#brand-voice-extraction-via-ai-analysis)
  - [Updated Brand Voice Data Model](#updated-brand-voice-data-model)
  - [Fine-Grained Voice Strength Controls](#fine-grained-voice-strength-controls)
  - [Brand Voice vs Tone vs Persona](#brand-voice-vs-tone-vs-persona)
  - [Customer Management Integration](#customer-management-integration)
  - [Core Components](#core-components)
  - [Brand Voice Presets](#brand-voice-presets)
  - [Creating Custom Brand Voices](#creating-custom-brand-voices)
  - [Using Brand Voices](#using-brand-voices)
  - [Brand Voice vs. Voice Styles](#brand-voice-vs-voice-styles)
  - [URL-Based Brand Voice Extraction](#url-based-brand-voice-extraction)
  - [2.3 Templates & Customer Management](#23-templates--customer-management)
  - [Saved Templates Architecture](#saved-templates-architecture)
  - [Template Types](#template-types)
  - [Template Management Features](#template-management-features)
  - [Customer Management System](#customer-management-system)
  - [Template Organization Best Practices](#template-organization-best-practices)
  - [Template Categories & Tags](#template-categories--tags)
  - [Prefills System (Advanced)](#prefills-system-advanced)
  - [Database Schema](#database-schema)
  - [Template Import/Export](#template-import/export)
  - [Usage Analytics](#usage-analytics)
  - [2.4 Special Instructions Library](#24-special-instructions-library)
  - [Formatting & Structure](#formatting--structure)
  - [Tone & Voice](#tone--voice)
  - [Language & Dialect](#language--dialect)
  - [Constraints & Avoidances](#constraints--avoidances)
  - [Content Requirements](#content-requirements)
  - [SEO & Keywords](#seo--keywords)
  - [Call-to-Actions](#call-to-actions)
  - [Industry-Specific](#industry-specific)
- [3. Advanced Systems](#3.-advanced-systems)
  - [3.1 URL Extraction & Structure Detection](#31-url-extraction--structure-detection)
  - [Overview](#overview)
  - [Two Extraction Modes](#two-extraction-modes)
  - [Structure Confirmation Modal](#structure-confirmation-modal)
  - [Best Practices](#best-practices)
  - [3.2 AI Model Comparison](#32-ai-model-comparison)
  - [Available Models](#available-models)
  - [Model Selection Matrix](#model-selection-matrix)
  - [3.3 GEO & SEO Optimization Deep Dive](#33-geo--seo-optimization-deep-dive)
  - [What is GEO (Generative Engine Optimization)?](#what-is-geo-generative-engine-optimization?)
  - [GEO Score Components](#geo-score-components)
  - [Implementing GEO](#implementing-geo)
  - [SEO Metadata Generation](#seo-metadata-generation)
  - [3.4 Output System Architecture](#34-output-system-architecture)
  - [Card-Based Architecture](#card-based-architecture)
  - [Content Threading](#content-threading)
  - [On-Demand Enhancement Philosophy](#on-demand-enhancement-philosophy)
- [4. User Experience & Help Center](#4.-user-experience--help-center)
  - [4.1 Help Center Architecture](#41-help-center-architecture)
  - [Help Center Architecture](#help-center-architecture)
  - [Help Pages Structure](#help-pages-structure)
  - [Search Functionality](#search-functionality)
  - [Video Tutorials](#video-tutorials)
  - [Contextual Help System](#contextual-help-system)
  - [Feedback System](#feedback-system)
  - [Contact Support System](#contact-support-system)
  - [Glossary of Terms](#glossary-of-terms)
  - [UX Enhancement Features](#ux-enhancement-features)
  - [Analytics & Improvement](#analytics--improvement)
- [5. Workflows & Real-World Examples](#5.-workflows--real-world-examples)
  - [5.1 How It All Works Together](#51-how-it-all-works-together)
  - [The Power of Combinations: The real magic happens when you **stack features**:](#the-power-of-combinations-the-real-magic-happens-when-you-**stack-features**)
  - [Key Principles: 1. **Inputs matter:** Better inputs = better outputs. Be specific.](#key-principles-1-**inputs-matter**-better-inputs-=-better-outputs-be-specific)
  - [The Learning Curve: **Week 1:** Use Smart Mode, Quick Start templates, wizard](#the-learning-curve-**week-1**-use-smart-mode-quick-start-templates-wizard)
  - [Best Results Come From: 1. **Specific inputs** - "E-commerce business" < "Sustainable fashion e-commerce for Gen Z"](#best-results-come-from-1-**specific-inputs**---"e-commerce-business"-<-"sustainable-fashion-e-commerce-for-gen-z")
  - [5.2 Typical Workflow: End-to-End Example](#52-typical-workflow-end-to-end-example)
  - [Total Time: 25 Minutes](#total-time-25-minutes)
  - [What Made This Successful: 1. **Specific inputs:** Detailed business description with concrete differentiators](#what-made-this-successful-1-**specific-inputs**-detailed-business-description-with-concrete-differentiators)
  - [5.3 Real-Life Scenarios: Copy Maker in Action](#53-real-life-scenarios-copy-maker-in-action)
  - [Scenario 1: Black Friday Email Campaign](#scenario-1-black-friday-email-campaign)
  - [Scenario 2: SaaS Landing Page (Services Page)](#scenario-2-saas-landing-page-services-page)
  - [Scenario 3: Blog Post Introduction (Thought Leadership)](#scenario-3-blog-post-introduction-thought-leadership)
- [The Real Shift](#the-real-shift)
  - [Scenario 4: E-commerce Product Description with Full SEO](#scenario-4-e-commerce-product-description-with-full-seo)
- [The Difference You'll Feel](#the-difference-you'll-feel)
- [6. Best Practices & Recommendations](#6.-best-practices--recommendations)
  - [6.1 Common Mistakes & Pro Tips](#61-common-mistakes--pro-tips)
  - [Mistake #1: Vague Project Descriptions](#mistake-#1-vague-project-descriptions)
  - [Mistake #2: No Target Audience Details](#mistake-#2-no-target-audience-details)
  - [Mistake #3: Feature-Focused Instead of Benefit-Focused](#mistake-#3-feature-focused-instead-of-benefit-focused)
  - [Mistake #4: Conflicting Tone and Audience](#mistake-#4-conflicting-tone-and-audience)
  - [Mistake #5: Setting Word Count Too Strict for Complex Structure](#mistake-#5-setting-word-count-too-strict-for-complex-structure)
  - [Mistake #6: Not Using Special Instructions for Brand Voice](#mistake-#6-not-using-special-instructions-for-brand-voice)
  - [Mistake #7: Generating Once and Stopping](#mistake-#7-generating-once-and-stopping)
  - [Mistake #8: Not Reviewing SEO Metadata Before Using](#mistake-#8-not-reviewing-seo-metadata-before-using)
  - [Mistake #9: Using Expert Mode Too Early](#mistake-#9-using-expert-mode-too-early)
  - [Mistake #10: Not Saving Templates for Repeated Work](#mistake-#10-not-saving-templates-for-repeated-work)
  - [6.2 Recommended Settings: Beginners vs Experts](#62-recommended-settings-beginners-vs-experts)
  - [Beginner Starting Checklist](#beginner-starting-checklist)
- [10. Feature Interactions: How Everything Connects](#10.-feature-interactions-how-everything-connects)
  - [Interaction 2: Output Structure ↔ Word Count Settings](#interaction-2-output-structure-↔-word-count-settings)
  - [Interaction 3: Tone Setting ↔ Voice Style Application](#interaction-3-tone-setting-↔-voice-style-application)
  - [Interaction 4: Special Instructions ↔ All Other Settings](#interaction-4-special-instructions-↔-all-other-settings)
  - [Universal Defaults](#universal-defaults)
  - [By Content Type](#by-content-type)
  - [By Experience Level](#by-experience-level)
  - [By Budget](#by-budget)
- [APPENDIX: COMPLETE QUICK START TEMPLATE CATALOG](#appendix-complete-quick-start-template-catalog)
  - [6.3 Feature Interactions: How Everything Connects](#63-feature-interactions-how-everything-connects)
  - [Interaction 5: Generate Scores ↔ Compare All Outputs](#interaction-5-generate-scores-↔-compare-all-outputs)
  - [Interaction 6: Saved Templates ↔ Optional Features](#interaction-6-saved-templates-↔-optional-features)
  - [Interaction 7: Alternative Creation ↔ Voice Style ↔ Blend](#interaction-7-alternative-creation-↔-voice-style-↔-blend)
  - [Interaction 8: Improve Mode ↔ Modification Feature](#interaction-8-improve-mode-↔-modification-feature)
- [11. Video Narration Tips + Suggested Visuals](#11.-video-narration-tips-+-suggested-visuals)
  - [Section 1: Introduction](#section-1-introduction)
  - [Section 2.1: AI Model Selection](#section-21-ai-model-selection)
  - [Section 2.2: Make New vs Improve Existing](#section-22-make-new-vs-improve-existing)
  - [Section 2.3: Core Input Fields](#section-23-core-input-fields)
  - [Section 2.4: Output Structure](#section-24-output-structure)
  - [Section 2.5: Special Instructions](#section-25-special-instructions)
  - [Section 2.6: Smart Mode vs Expert Mode](#section-26-smart-mode-vs-expert-mode)
  - [Section 2.7: Optional Features](#section-27-optional-features)
  - [Section 2.8: Quick Prompt Wizard](#section-28-quick-prompt-wizard)
  - [Section 2.9: Templates](#section-29-templates)
  - [Section 3.1: Output Display](#section-31-output-display)
  - [Section 3.2: Modify Content](#section-32-modify-content)
  - [Section 3.3: Alternative Copy](#section-33-alternative-copy)
  - [Section 3.4: Voice Styles](#section-34-voice-styles)
  - [Section 3.5: Compare All Outputs](#section-35-compare-all-outputs)
  - [Section 3.6: Blend Outputs](#section-36-blend-outputs)
  - [Section 3.7: Floating Action Buttons](#section-37-floating-action-buttons)
  - [Section 4: Miscellaneous Features](#section-4-miscellaneous-features)
  - [Section 5: Summary](#section-5-summary)
- [12. Glossary of Terms](#12.-glossary-of-terms)
  - [AI Model](#ai-model)
- [13. Motivational Closing: Master Your Message](#13.-motivational-closing-master-your-message)
- [14. Typography and Design System](#14.-typography-and-design-system)
- [15. Session Tracking and Token Usage Management](#15.-session-tracking-and-token-usage-management)
- [16. Legacy Features (DEPRECATED)](#16.-legacy-features-deprecated)
  - [16.1 Legacy Pipeline (Deprecated)](#161-legacy-pipeline-deprecated)
  - [16.2 XXX Placeholder (Deprecated)](#162-xxx-placeholder-deprecated)
  - [16.3 Removed Features (No Longer Available)](#163-removed-features-no-longer-available)
  - [16.4 Type Definitions & Props (Inconsistencies)](#164-type-definitions--props-inconsistencies)
  - [16.5 Database Columns (Legacy)](#165-database-columns-legacy)
  - [16.6 Future Deprecation Notices](#166-future-deprecation-notices)
- [7. Reference Materials](#7.-reference-materials)
  - [7.1 Glossary of Terms](#71-glossary-of-terms)
  - [AI Model](#ai-model)
  - [7.2 Video Narration Guide](#72-video-narration-guide)
  - [Section 1: Introduction](#section-1-introduction)
  - [Section 2.1: AI Model Selection](#section-21-ai-model-selection)
  - [Section 2.2: Make New vs Improve Existing](#section-22-make-new-vs-improve-existing)
  - [Section 2.3: Core Input Fields](#section-23-core-input-fields)
  - [Section 2.4: Output Structure](#section-24-output-structure)
  - [Section 2.5: Special Instructions](#section-25-special-instructions)
  - [Section 2.6: Smart Mode vs Expert Mode](#section-26-smart-mode-vs-expert-mode)
  - [Section 2.7: Optional Features](#section-27-optional-features)
  - [Section 2.8: Quick Prompt Wizard](#section-28-quick-prompt-wizard)
  - [Section 2.9: Templates](#section-29-templates)
  - [Section 3.1: Output Display](#section-31-output-display)
  - [Section 3.2: Modify Content](#section-32-modify-content)
  - [Section 3.3: Alternative Copy](#section-33-alternative-copy)
  - [Section 3.4: Voice Styles](#section-34-voice-styles)
  - [Section 3.5: Compare All Outputs](#section-35-compare-all-outputs)
  - [Section 3.6: Blend Outputs](#section-36-blend-outputs)
  - [Section 3.7: Floating Action Buttons](#section-37-floating-action-buttons)
  - [Section 4: Miscellaneous Features](#section-4-miscellaneous-features)
  - [Section 5: Summary](#section-5-summary)
  - [7.3 Quick Start Templates Library](#73-quick-start-templates-library)
- [8. Appendix](#8.-appendix)
  - [8.1 Optional Features Comprehensive Guide](#81-optional-features-comprehensive-guide)
  - [Smart Mode vs Expert Mode (Optional Features)](#smart-mode-vs-expert-mode-optional-features)
  - [Feature Cost Impact Matrix](#feature-cost-impact-matrix)
  - [Recommended Feature Combinations](#recommended-feature-combinations)
  - [8.2 Best Practices Extended](#82-best-practices-extended)
  - [Getting Started Right](#getting-started-right)
  - [Field-Level Excellence](#field-level-excellence)
  - [Generation Workflow](#generation-workflow)
  - [Template Strategy](#template-strategy)
  - [8.3 Motivational Closing: Master Your Message](#83-motivational-closing-master-your-message)

---


## 1. Introduction

### What is Copy Maker? Copy Maker is the core content generation engine of CopyZap. It's an AI-powered tool that helps you create, improve, and refine marketing copy, website content, product descriptions, emails, and any other written content you need. Think of it as your AI copywriting assistant that doesn't just generate text - it understands context, follows your instructions, adapts to different tones and styles, and gives you multiple options to choose from. ### What This Document Covers

This analysis focuses exclusively on **how Copy Maker works** from a functional perspective. You'll learn:
- What each input field does and when to use it
- How different settings affect your output
- Best practices for getting the results you want
- How to combine features for maximum impact

This is **not** a UI guide - it's a functional understanding of the Copy Maker's capabilities. ---

---

## 1.1 Authentication & Account Access

### Sign In Options

CopyZap offers two convenient ways to access your account:

#### Google OAuth (Primary Option)
- **What it is:** Sign in using your existing Google account with one click
- **Benefits:**
  - Fastest way to get started - no password to remember
  - Secure authentication handled by Google
  - Automatic account creation on first sign-in
  - No email verification required (already verified by Google)
- **How it works:** Click "Continue with Google" on the login page, authorize CopyZap to access your basic profile information (name and email), and you're immediately signed in

#### Email & Password (Secondary Option)
- **What it is:** Traditional sign-in with email address and password
- **Benefits:**
  - Works without a Google account
  - Full control over your credentials
  - Password reset available if needed
- **How it works:** Enter your email and password to sign in, or create a new account with the sign-up form

### Account Setup Process

**For Google OAuth Users:**
1. Click "Continue with Google" on the login page
2. Select your Google account or sign in to Google if needed
3. Authorize CopyZap to access your name and email
4. Automatically redirected to the Copy Maker dashboard
5. Your account is created automatically on first sign-in
6. Welcome email sent to your registered email address

**For Email/Password Users:**
1. Click "Need an account? Sign Up" on the login page
2. Enter your name, email, and password (minimum 6 characters)
3. Click "Create Account"
4. Account created immediately - no email verification needed
5. Automatically signed in and redirected to Copy Maker
6. Welcome email sent to your registered email address

### Switching Between Authentication Methods

- You can use either method with the same email address
- If you signed up with Google, you can later set a password through "Forgot password?" link
- If you signed up with email/password, you can later add Google OAuth by signing in with Google using the same email

### Security Features

- **Google OAuth:** Industry-standard OAuth 2.0 protocol ensures your Google credentials are never shared with CopyZap
- **Email/Password:** Passwords securely hashed and stored using Supabase authentication
- **Session Management:** Secure session tokens with automatic expiration
- **HTTPS Only:** All authentication happens over encrypted connections in production

### Password Reset

For email/password accounts:
1. Click "Forgot password?" on the login page
2. Enter your email address
3. Check your inbox for password reset instructions
4. Click the link in the email and set a new password
5. Sign in with your new password

### Account Data

When you sign in (either method), CopyZap stores:
- Your name (from Google profile or sign-up form)
- Your email address
- Account preferences and settings
- Generated content and saved templates
- Brand voices and customer data you create

### First-Time User Experience

After signing in for the first time:
1. **Start Hub Modal** automatically opens to help you get started
2. Choose from:
   - Quick Prompt Wizard (guided setup)
   - Load a template (pre-built starting points)
   - Start from scratch (full manual control)
3. Access the Help Center anytime for detailed guidance
4. Explore saved templates and brand voice presets

### Common Questions

**Q: Can I use the same email for both Google OAuth and email/password?**
A: Yes, but the accounts are separate. Use whichever method you prefer for signing in.

**Q: What happens to my data if I switch authentication methods?**
A: Your data is tied to your email address. As long as you use the same email, all your content, templates, and settings remain accessible.

**Q: Is Google OAuth secure?**
A: Yes, Google OAuth is an industry-standard security protocol. CopyZap only receives your name and email - never your Google password.

**Q: What if I don't have a Google account?**
A: You can use the email/password option instead. It works exactly the same way.

**Q: Can I sign out of one device without affecting others?**
A: Yes, signing out is device-specific. You remain signed in on other devices until you explicitly sign out there too.

### Credits Display in Main Menu

**What it is:** A real-time display of your remaining credits balance shown in the main navigation menu next to your user information.

**Location:** Main menu header, positioned between your email/username and the Logout button.

**What it shows:**
- Your current credits balance formatted for easy reading
- Displays in small, unobtrusive text with a subtle background
- Updates automatically every 30 seconds while you're using the app
- Loading state while fetching your balance

**Display Format:**
- Credits under 1,000: Shows exact number (e.g., "850 credits")
- Credits 1,000-999,999: Shows in thousands with one decimal (e.g., "12.5K credits")
- Credits 1,000,000+: Shows in millions with one decimal (e.g., "1.2M credits")

**Visual Design:**
- **Desktop:** Displayed horizontally between username and logout button in a small pill-shaped badge
- **Mobile:** Displayed below username in the mobile menu dropdown
- **Theme Support:** Adapts to light/dark mode with appropriate colors
- **Colors:** Gray text on light gray background (light mode) or gray-800 background (dark mode)

**Why it's useful:**
- **Transparency:** Know your credit balance at a glance before starting work
- **Planning:** Helps you plan your generation activities based on available credits
- **Prevents Surprises:** Avoid running out of credits mid-project
- **Peace of Mind:** Always aware of your account status

**Technical Details:**
- Balance is calculated from your credits_allowed minus total billable_units used
- Refreshes automatically while the page is active
- No manual refresh needed
- Does not slow down or interfere with content generation

**Example Display:**
```
[Username] [2.5K credits] [Logout]
```

---

## 2. Core Modules

This section covers the primary tools and features you'll use daily in CopyZap.

### 2.1 Copy Maker

The Copy Maker is CopyZap's core content generation engine. This comprehensive module handles project setup, content generation, and output management.

#### 2.1.1 Project Setup

### 2.1 AI Model Selection

The AI model is the "brain" behind your content generation. Different models have different strengths, costs, and output characteristics.

**Model Validation and Smart Fallback**

CopyZap features intelligent model validation and automatic fallback:

1. **Automatic Validation:** When you select an AI model, the system validates it's properly configured
2. **Generation Fallback:** If your selected model fails during content generation (expired key, rate limit, etc.), the system automatically opens a model selection modal
3. **Available Alternatives:** The modal displays all currently working models with their availability status, including Claude 3.5 Sonnet, GPT-4o, DeepSeek V3, Gemini 2.0 Flash, Grok, and others
4. **One-Click Switch:** Select any available model to continue working immediately without losing your inputs

**This smart fallback ensures uninterrupted workflow** - if Claude isn't available, instantly switch to GPT-4o, DeepSeek, or another working model without restarting your generation. If a different model fails, Claude will be shown as an alternative option in the modal.

#### Available Models

**Claude 3.5 Sonnet (claude-3-5-sonnet-20241022)** ⭐ DEFAULT
- **Best for:** Balanced excellence across all content types
- **Output quality:** Exceptional, industry-leading
- **Token limit:** 8,192 tokens output
- **Cost:** Moderate ($3 per 1M tokens)
- **Use when:** You need superior quality for any content type - this is the recommended default
- **Example:** Any content creation task, from landing pages to blog posts
- **Why it's default:** Best overall performance, quality, and reliability for most use cases

**Claude Sonnet 4.5 (claude-sonnet-4.5-20250514)** 🆕 LATEST
- **Best for:** Cutting-edge AI capabilities and most advanced reasoning
- **Output quality:** Exceptional, next-generation
- **Token limit:** 8,192 tokens output
- **Cost:** Premium ($3 per 1M input, $15 per 1M output tokens)
- **Use when:** You want the absolute latest Claude model with enhanced capabilities
- **Example:** Complex content requiring nuanced understanding and advanced reasoning
- **Note:** This is the newest Claude model with enhanced performance across all tasks

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
- **Example:** Creative marketing campaigns or innovative product messaging

**Gemini 2.0 Flash (gemini-2.0-flash)**
- **Best for:** Extremely cost-effective, high-volume generation
- **Output quality:** Very good
- **Token limit:** 8,192 tokens output
- **Cost:** Lowest cost option (~100x cheaper than GPT-4o)
- **API Provider:** Google AI (Gemini API)
- **Use when:** You need quality content at minimal cost or generating massive volumes
- **Ideal use cases:** Bulk product descriptions, blog posts, email campaigns, social media content at scale
- **Example:** Creating hundreds of product descriptions, blog posts, or social media content
- **Cost comparison:** ~$0.075 per million input tokens vs. $2.50 for GPT-4o (97% cost savings)
- **Setup:** Requires Google API key from Google AI Studio (https://aistudio.google.com/apikey)

#### How Model Choice Affects Output

The model you choose influences:
- **Creativity level:** Some models are more creative, others more factual
- **Writing style:** Subtle differences in how sentences are structured
- **Token cost:** Directly affects your budget
- **Maximum output length:** Determines how much text can be generated in one request
- **Processing speed:** Some models are faster than others

---

### 2.1.2 Output Validation & Automatic Repair

**What it is:** Copy Maker includes intelligent output validation to ensure generated content meets quality standards and structural requirements before delivering it to you.

**How it works:**

When you generate content, the system automatically validates the output for:
1. **Structural completeness** - All requested sections are present
2. **Format compliance** - Output matches requested structure (sections, bullet points, etc.)
3. **Content quality** - No placeholder text, incomplete thoughts, or formatting artifacts
4. **JSON parseability** - Internal data structures are valid and complete

**Automatic Repair System:**

If the initial AI output fails validation:
- System automatically attempts ONE repair generation
- Uses the same AI model and settings
- Applies stricter constraints to fix validation issues
- Seamlessly delivers corrected output to you

**IMPORTANT - Credits & Billing:**

**Repairs consume additional credits.** Here's how the billing works:

- **Original generation attempt** → Consumes credits (tracked as `generate_copy`)
- **Validation fails** → System attempts automatic repair
- **Repair attempt** → Makes ANOTHER AI call → Consumes ADDITIONAL credits (tracked as `generate_copy_repair`)

**Example Cost Scenario:**
```
Original generation:
- Input tokens: 1,500 | Output tokens: 2,000
- Cost: $0.14
- Credits charged: 19 credits

Repair attempt (if validation fails):
- Input tokens: 1,500 | Output tokens: 2,000
- Cost: $0.14
- Credits charged: 19 credits

TOTAL IF REPAIR NEEDED: 38 credits (approximately double cost)
```

**Why repairs happen:**
- AI occasionally produces incomplete structures
- Output doesn't match requested format exactly
- Content contains formatting issues or artifacts
- JSON parsing errors in internal data

**What you see:**
- **Success (no repair needed):** Content appears normally with standard success message
- **Success (after repair):** Content appears normally - repair happens transparently behind the scenes
- **Failure (repair also failed):** Error message with option to retry with different settings

**Transparency:**
- The `operation` field in usage tracking distinguishes between `generate_copy` and `generate_copy_repair`
- Admin dashboards and usage reports show repair frequency
- You're charged based on actual AI calls made (original + repair if needed)

**Best practices to minimize repairs:**
- Use clear, specific instructions in your inputs
- Request reasonable output structures (not overly complex)
- Match word count expectations to content complexity
- Choose appropriate AI models for your content type

**Technical note:** This system ensures you receive high-quality, properly formatted output without manual intervention. The automatic repair happens in seconds and is designed to maintain workflow speed while guaranteeing output quality. Credits are charged based on actual API usage - no refunds or exemptions for repair attempts.

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

**What it does:** Gives the AI high-level context about what you're working on. Also used for session tracking and organization, allowing you to find your work later in the dashboard.

**IMPORTANT - Required Field:** Project Description is REQUIRED for all copy generation and AI suggestions. This field serves two purposes:
1. Provides context to the AI for better results
2. Creates a searchable session name so you can find this work later

**How it affects output:** This field helps the AI understand the bigger picture and align the copy with your project's goals. Without it, your session will be difficult to identify in your history.

**Example of correct usage:**
- "Homepage for a meal delivery service targeting busy professionals"
- "Product page for noise-cancelling headphones"
- "Email sequence for abandoned cart recovery"

**Best practices:**
- Be descriptive enough to find this project later ("Email campaign" vs "Welcome email for new subscribers")
- Include the content type and context
- Keep it concise but specific (10-30 words)

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

**What it does:** Specifies the exact product or service being described.

**IMPORTANT - Required Field:** Product/Service Name is REQUIRED for all copy generation and AI suggestions. This ensures the AI references your offering correctly and consistently throughout the generated content.

**How it affects output:** Ensures the AI references your offering correctly and consistently. The AI will use this name appropriately in the generated copy.

**Example:** "TaskMaster Pro", "Premium Noise Guard X200", "FlexFit Subscription"

**Best practices:**
- Use exact spelling and capitalization
- Include any important taglines or slogans if applicable
- Must be filled before generating copy or requesting AI suggestions

---

#### Business Description (Make New Copy mode)

**What it does:** This is your primary content input when creating new copy. Describe your business, what you offer, and what makes you unique. **How it affects output:** This is the foundation of your generated content. The AI uses this to understand your value proposition, target audience, and differentiators.

**IMPORTANT - Required Field:** The Business Description field is REQUIRED to generate copy in "Make New Copy" mode. Along with Project Description and Product/Service Name, all three fields must be filled before:
- The "Make Copy" button becomes active
- Any AI suggestion buttons (⚡ lightning icons) become available

This ensures the AI has complete context to provide meaningful suggestions and generate quality copy.

**Example of correct usage:**
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
- Must be filled in before accessing AI suggestions or generating copy

---

#### Original Copy (Improve Existing Copy mode)

**What it does:** This is your current text that needs improvement. **How it affects output:** The AI analyzes your existing copy and enhances it while maintaining your core message.

**IMPORTANT - Required Field:** The Original Copy field is REQUIRED to improve existing copy. Along with Project Description and Product/Service Name, all three fields must be filled before:
- The "Make Copy" button becomes active
- Any AI suggestion buttons (⚡ lightning icons) become available

This ensures the AI has complete context and content to analyze and improve.

**Example of correct usage:**
```
Our software helps teams work better. We have lots of features
like task management, file sharing, and communication tools.
Companies use us to get things done faster.
```

**Best practices:**
- Paste your complete current text
- Don't pre-edit it - let the AI see the raw version
- Include any headlines or structure you want to preserve
- Must be filled in before accessing AI suggestions or generating improved copy

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

**Technical Note:**
- Pain points are automatically handled whether entered as a comma-separated list or selected from AI suggestions
- The system properly formats array or string inputs (e.g., "point1,point2,point3" or ["point1", "point2", "point3"])
- No spaces after commas are required - the system handles formatting automatically

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

### 2.6 New 3-Mode System (Quick, Standard, Advanced)

**What it does:** Controls which input fields are visible through progressive disclosure. CopyZap now uses a 3-tier visibility system designed for all skill levels.

#### Quick Mode (Beginner)

**Purpose:** Truly minimal interface for beginners who want fast results

**Field Count:** ~12 essential fields only

**Visible Fields:**
- Project Description (required)
- Product/Service Name (required)
- Business Description OR Original Copy (required)
- Section
- Target Audience
- Language
- Tone
- Word Count (+ Custom input only when "Custom" selected)
- Key Message
- Call to Action
- Special Instructions

**What's Hidden:**
- Customer & Brand Voice
- All Optional Features (SEO/GEO, scoring, metadata)
- Competitor analysis fields
- Industry/Niche
- Funnel Stage
- Advanced tone/style fields
- Output structure controls

**Best for:** First-time users, quick copy generation, simple projects

**Tooltip:** "Best for beginners. Only essential fields."

#### Standard Mode (Default)

**Purpose:** Balanced approach for regular users

**Field Count:** ~23-25 fields (essential + common advanced features)

**Visible Fields:** All Quick Mode fields PLUS:
- Customer Selection
- Brand Voice Selection
- Excluded Terms
- Target Audience Pain Points
- Competitor URLs (3 fields)
- Preferred Writing Style
- Language Style Constraints
- Brand Values
- Keywords
- Context
- Optional Features section (visible but collapsed by default)

**What's Still Hidden:**
- Industry/Niche
- Reader Funnel Stage
- Competitor Copy Text
- Tone Level slider
- Output Structure
- Include Section Titles
- Desired Emotion

**Best for:** Everyday users, most projects, balanced control

**Tooltip:** "Balanced. Most commonly used fields."

#### Advanced Mode (Full Control)

**Purpose:** Complete control for power users and agencies

**Field Count:** 30+ fields (everything)

**Visible Fields:** Everything from Standard Mode PLUS:
- Industry/Niche
- Reader Funnel Stage
- Competitor Copy Text
- Tone Level slider
- Output Structure
- Include Section Titles
- Desired Emotion
- All SEO/GEO advanced controls
- All metadata variant numbers

**Best for:** Power users, complex projects, agency work

**Tooltip:** "Full control. All fields visible."

#### Mode Comparison Table

| Feature | Quick | Standard | Advanced |
|---------|-------|----------|----------|
| Essential fields | ✓ | ✓ | ✓ |
| Customer / Brand Voice | ✗ | ✓ | ✓ |
| Optional Features | ✗ | ✓ (collapsed) | ✓ (collapsed) |
| Advanced-only fields | ✗ | ✗ | ✓ |
| Field count | ~12 | ~23-25 | 30+ |
| Ideal for | Beginners | Most users | Power users |

#### How It Works

**Mode Persistence:**
- Your selected mode saves to browser storage
- Persists across sessions
- Default on first visit: Standard Mode

**Mode Switcher UI:**
- Located at top of form
- Three buttons: Quick (⚡), Standard (📚), Advanced (⚙️)
- Active mode highlighted with white background

**Section Behavior:**
- Quick Mode: Only sections with Quick-visible fields appear
- Standard/Advanced: All 5 sections always visible
- Sections show field counts: "Audience & Targeting (2 filled)"

**When to use each:**
- **Quick Mode:** Learning the tool, fast simple copy, minimal inputs needed
- **Standard Mode:** Regular projects, customer-specific work, balanced control
- **Advanced Mode:** Complex campaigns, precise brand compliance, full customization

**Best practices:**
- Start with Standard Mode (default)
- Switch to Quick Mode when you need speed over control
- Use Advanced Mode only when you need specific advanced features
- Your mode choice persists automatically

---

### 2.7 AI Engine Mode Selection

**What it is:** Choose which AI pipeline generates your content.

**Available Modes:**

#### Legacy Pipeline
- **Icon:** Cpu (computer chip)
- **Label:** "Legacy"
- **What it does:** Uses the current stable AI pipeline
- **Tooltip:** "Current stable AI pipeline (default)"
- **Color:** Blue when selected
- **Best for:** Standard copy generation with proven reliability

#### CopyZap+ Enhanced Pipeline
- **Icon:** Sparkles
- **Label:** "CopyZap+"
- **What it does:** Advanced 3-step pipeline with input expansion and editorial refinement
- **Tooltip:** "Enhanced AI pipeline with input expansion and editorial refinement (experimental)"
- **Color:** Purple-to-pink gradient when selected
- **Best for:** Premium copy requiring strategic insights and higher quality output
- **Features:**
  - Step 1: Input expansion and enrichment with strategic insights
  - Step 2: Enhanced generation with professional copywriting standards
  - Step 3: Editorial refinement pass for polish

#### Both (Compare Mode)
- **Icon:** GitCompare (comparison arrows)
- **Label:** "Both"
- **What it does:** Runs BOTH pipelines in a single generation and creates two separate output cards
- **Tooltip:** "Run both pipelines and compare results side-by-side"
- **Color:** Green-to-teal gradient when selected
- **Best for:** A/B testing between pipelines, making informed decisions about which pipeline works best for your content type
- **How it works:**
  1. Runs Legacy pipeline first → Creates "Legacy Pipeline" output card
  2. Runs CopyZap+ pipeline second → Creates "CopyZap+ Pipeline" output card
  3. Both cards appear in the results section
  4. If "Generate Scores" is enabled, both cards get scored automatically
  5. All optional features (SEO metadata, GEO scoring, etc.) apply to both outputs

**When to use "Both" mode:**
- Testing which pipeline produces better results for your content type
- Important content where you want maximum options
- Evaluating CopyZap+ quality versus Legacy for your specific use case
- Creating comparison data to inform future pipeline selection

**Mode Persistence:**
- Your selected mode saves to browser storage
- Persists across sessions
- Default on first use: Legacy

**Technical Notes:**
- Both mode uses 2x the API tokens (runs both pipelines)
- Generation takes approximately 2x as long
- Scores are calculated for both outputs if enabled
- Each output card is fully independent with all features available

---

### 2.8 Optional Features (Toggles)

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

**Color-Coded Score Display:**

All scores throughout CopyZap are now color-coded for quick visual assessment:

- **Green (80-100):** High-performing content that meets or exceeds expectations
- **Yellow (60-79):** Good content with room for improvement
- **Red (Below 60):** Content that needs significant improvement

This color coding appears in:
- Overall scores (e.g., "92/100" displays in green)
- Individual metric scores (Clarity, Persuasiveness, Tone Match, etc.)
- Score comparison tables
- Word count accuracy scores
- Version comparison breakdowns
- Prompt evaluation quality scores

The color coding automatically adapts to dark mode for optimal visibility in all viewing conditions.

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

### 2.9 Quick Prompt Wizard 2.0

The Quick Prompt Wizard is a streamlined, conversational interface that transforms complex form-filling into a simple 2-step process. Version 2.0 dramatically simplifies the original 3-5 step flow while adding intelligent automation and full integration with the new 3-mode system.

#### What's New in 2.0:

**Consolidated Flow:**
- Reduced from 3-5 steps to just 2 steps
- Combined "what/who/problem" into Step 1
- Moved all preferences to Step 2
- 60% faster completion time

**Smart Defaults:**
- Tone inferred from your description
- Output structure suggested based on content type
- Language auto-detected from input text
- Word count estimated from content type

**Mode Integration (NEW):**
- Wizard respects your current mode (Quick, Standard, or Advanced)
- Shows only fields allowed in your active mode
- Filters generated configuration to match mode restrictions
- Customer & Brand Voice selectors appear in Standard/Advanced modes only
- SEO/GEO toggles visible in all modes (always shown, unchecked by default)
- **Tab switching now works correctly:** When you select "Improve Existing Copy" in the wizard, the form automatically switches to that tab

**Customer Integration:**
- Select customer → auto-loads their Brand Voice (Standard/Advanced modes)
- Maintains brand consistency across projects
- One-click brand application

#### Two-Step Wizard Flow:

**Step 1: Project Setup & Context**

**First: Project Description (Required)**
- Short, descriptive name for your project
- Used as the session name for tracking token usage
- Example: "AI-powered project management tool for remote teams"
- Cannot be empty - required to start wizard
- This ensures consistent session tracking across all AI calls

**Then: Combined Context Question**

Single comprehensive field that captures:
- **What**: Content type and purpose
- **Who**: Target audience
- **Problem**: Pain points or goals

Example input:
```
Landing page hero for our SaaS project management tool,
targeting small business owners who struggle with scattered
tools and missed deadlines
```

The AI extracts:
- Content type: Landing page hero
- Product: SaaS project management tool
- Audience: Small business owners
- Pain points: Scattered tools, missed deadlines

**Note:** Once entered in the wizard, the Project Description is placed into the main form's "Project Description" field. If you later edit this field in the main form, the session name automatically updates to match - ensuring your token usage reports always reflect the current project name.

**Auto-Analysis for Pasted Copy (NEW):**

When you select "Improve existing copy" mode and paste your content:
- **Automatic Analysis:** After you paste at least 50 characters, the wizard automatically analyzes your copy after 1 second of inactivity
- **AI-Powered Extraction:** Uses AI to intelligently extract:
  - **Who is it for?** (Target Audience) - Identifies the intended readers
  - **What problems does it solve?** (Pain Points) - Discovers the problems your copy addresses
- **Seamless Experience:** Analysis happens in the background without interrupting your workflow
- **Smart Behavior:** Only runs when fields are empty (won't overwrite your manual entries)
- **Consistent with URL Analysis:** Provides the same auto-fill experience whether you paste copy or analyze a URL

**URL Analysis → Output Structure Auto-Population (Improve Mode):**

When using "Improve Existing Copy" mode and analyzing a URL (including Deep Crawl via Firecrawl), the extracted Output Structure is now correctly passed through to the Copy Maker form. Previously, the Output Structure was always discarded for "Improve" mode during the wizard-to-Copy Maker handoff. The logic now checks whether the wizard extracted an Output Structure from URL analysis first — if so, it is used regardless of mode. Only when no structure was extracted does the improve mode default to an empty Output Structure (its correct baseline behavior).

**Example:**
If you paste: "Get better sleep with our premium memory foam mattress. Perfect for people who wake up with back pain every morning..."

The wizard automatically fills:
- **Target Audience:** "People who wake up with back pain and struggle with sleep quality"
- **Pain Points:** "Morning back pain, poor sleep quality, discomfort during sleep"

This eliminates the repetitive task of manually filling these fields when improving existing copy.

**Step 2: Quick Preferences**

Fast-select interface for:

1. **Tone** (6 options with smart inference):
   - Professional (auto-selected for B2B)
   - Friendly (auto-selected for consumer)
   - Bold
   - Minimalist
   - Creative
   - Persuasive

2. **Length** (4 quick options):
   - Short (50-100 words)
   - Medium (100-200 words) - default
   - Detailed (200-400 words)
   - Custom (manual entry)

3. **SEO Optimization** (checkbox, OFF by default - **All modes**):
   - Unchecked by default - users must explicitly enable
   - Generates meta descriptions, URL slugs, and structured headings
   - Visible in all modes (Quick, Standard, and Advanced)

4. **GEO Optimization** (checkbox, OFF by default - **All modes**):
   - Unchecked by default - users must explicitly enable
   - Optimizes for AI search engines (ChatGPT, Perplexity)
   - Generates TL;DR summaries and snippet-ready formatting
   - Visible in all modes (Quick, Standard, and Advanced)

5. **Special Instructions** (text field - all modes):
   - Optional additional requirements
   - Visible in all modes

#### Mode-Aware Field Visibility:

**Quick Mode (Minimal):**
- ✅ Project Description (required - for session tracking)
- ✅ What are you creating?
- ✅ Who is it for? (Target Audience)
- ✅ What problems does it solve? (Pain Points)
- ✅ Tone
- ✅ Word Count
- ✅ **Enable SEO** (visible, unchecked by default)
- ✅ **Enable GEO** (visible, unchecked by default)
- ✅ Special Instructions
- ❌ Customer Selector (hidden)
- ❌ Brand Voice Selector (hidden)

**Standard Mode (Mid-Level):**
- ✅ All Quick Mode fields
- ✅ **Customer Selector** (now visible)
- ✅ **Brand Voice Selector** (appears when customer selected)
- ✅ Enable SEO (visible, unchecked by default)
- ✅ Enable GEO (visible, unchecked by default)

**Advanced Mode:**
- ✅ All Standard Mode fields (wizard doesn't add extra fields beyond Standard)
- ✅ Enable SEO (visible, unchecked by default)
- ✅ Enable GEO (visible, unchecked by default)

#### Hidden Field Warning System:

When wizard generates configuration with fields hidden in your current mode:

**Scenario:** User completes wizard in Quick Mode, but AI generates SEO metadata

**Result:**
1. Wizard detects `enableSEO: true` is hidden in Quick Mode
2. Shows warning modal:
   ```
   Some Fields Are Hidden

   The wizard generated some fields that are hidden in
   your current mode (Quick Mode).

   Hidden fields:
   • enableSEO

   Switch to Standard or Advanced Mode to edit these fields.

   [Cancel]  [Apply Visible Fields Only]
   ```
3. User can:
   - **Cancel** → Stay in wizard, nothing applied
   - **Apply Visible Fields Only** → Hidden fields excluded, visible fields applied

**Why this matters:**
- Prevents confusion about missing features
- Guides users toward appropriate mode for their needs
- No data loss - clear explanation of what's filtered

#### Smart Inference Examples:

**Input:** "Blog post about email marketing tips for startups"
**Auto-inferred:**
- Tone: Friendly (blog content)
- Structure: Header 1, Subheadings, Paragraphs, Conclusion
- SEO: Enabled
- Length: Detailed (blog posts need depth)

**Input:** "Abandoned cart email for e-commerce store"
**Auto-inferred:**
- Tone: Persuasive (conversion-focused)
- Structure: Problem, Solution, CTA
- SEO: Disabled (email content)
- Length: Medium (email best practice)

**Input:** "Technical whitepaper for IT security product"
**Auto-inferred:**
- Tone: Professional (technical audience)
- Structure: Introduction, Sections, Statistics, Conclusion
- SEO: Enabled
- Length: Custom (whitepapers vary)

#### Customer → Brand Voice Auto-Selection:

**How it works:**
1. User selects customer from dropdown in main form
2. Wizard detects active customer selection
3. Auto-loads customer's default Brand Voice
4. Applies voice settings to generation
5. Visual indicator shows Brand Voice is active

**Benefits:**
- Zero-setup brand consistency
- Instant voice application
- No manual field configuration
- Perfect for agencies managing multiple clients

**Override capability:**
- User can manually change tone/settings
- Manual selections take priority
- Brand Voice provides baseline

#### Auto-Language Detection:

**Detection logic:**
1. Analyzes Step 1 input text
2. Identifies language (English, Spanish, French, German, Italian, Portuguese)
3. Sets language field automatically
4. Shows detected language in UI
5. User can override if incorrect

**Accuracy:**
- 99%+ for inputs longer than 20 characters
- Handles mixed-language inputs (uses dominant language)
- Detects formal vs informal variants

**Example:**
- Input: "Página de inicio para restaurante mexicano"
- Detected: Spanish
- Applied: Spanish language setting + culturally appropriate examples

#### Wizard 1.0 vs 2.0 Comparison:

| Feature | Wizard 1.0 | Wizard 2.0 |
|---------|------------|------------|
| **Steps** | 3-5 steps | 2 steps |
| **Time to Complete** | 2-3 minutes | 45-60 seconds |
| **Questions** | Separate fields per step | Combined context question |
| **SEO Setting** | Manual toggle | Auto-enabled (smart) |
| **Tone Selection** | Manual only | Auto-inferred + manual override |
| **Structure** | Manual selection | Auto-suggested based on content type |
| **Language** | Manual dropdown | Auto-detected from input |
| **Brand Voice** | Not integrated | Customer → Voice auto-load |
| **Word Count** | Always manual | Estimated from content type |
| **User Guidance** | Example chips | Smart placeholders + real-time hints |
| **Mobile UX** | Scrolling required | Single-screen steps |
| **Undo/Back** | Step-by-step | Quick restart button |

#### Example Flows:

**Example 1: Landing Page Hero**

Step 1 Input:
```
Landing page hero for AI copywriting tool targeting
marketers who waste hours writing repetitive copy
```

Wizard Auto-Generates:
- Tone: Professional (B2B SaaS)
- Length: Medium (150-200 words ideal for hero)
- SEO: Enabled
- Structure: Header 1, Paragraph, Benefits, CTA
- Keywords: AI copywriting, marketing automation, content generation

Time: 30 seconds

**Example 2: Blog Introduction**

Step 1 Input:
```
Blog intro about 10 email marketing mistakes that kill
open rates, for small business owners
```

Wizard Auto-Generates:
- Tone: Friendly (blog content)
- Length: Detailed (blog needs depth)
- SEO: Enabled
- Structure: Hook, Problem List, Preview
- Keywords: email marketing, open rates, mistakes

Time: 40 seconds

**Example 3: Abandoned Cart Email**

Step 1 Input:
```
Email reminding customers they left items in cart,
emphasizing free shipping and limited stock
```

Wizard Auto-Generates:
- Tone: Persuasive (conversion goal)
- Length: Short (email best practice)
- SEO: Disabled (email content)
- Structure: Problem, Urgency, CTA
- Special Instructions: Emphasize scarcity, free shipping

Time: 35 seconds

#### Advanced 2.0 Features:

**Context-Aware Defaults:**
- B2B keywords → Professional tone + longer content
- E-commerce → Persuasive tone + benefits focus
- Educational → Friendly tone + examples/explanations
- Technical → Professional tone + precise language

**Template Suggestion:**
- After wizard completes, shows relevant saved templates
- "You've used similar settings before - load '[Template Name]'?"
- One-click template application with wizard values
- Learns from your usage patterns

**Smart Field Population:**
- Keywords field auto-filled from description
- Target audience extracted from input
- Pain points identified and listed
- Call to action suggested from content type

**Validation & Warnings:**
- Real-time character count in Step 1
- Warning if input too vague (< 30 chars)
- Suggestion to add more detail for better results
- Preview of what AI will receive

#### When to Use 2.0 vs Manual Form:

**Use Wizard 2.0 when:**
- Quick content generation needed
- Standard use cases (landing page, blog, email)
- First time working on a project
- Customer has predefined Brand Voice
- Want smart defaults with minimal config

**Use Manual Form when:**
- Complex, unusual content requirements
- Multiple special instructions needed
- Precise control over every setting
- Testing specific configurations
- Advanced features like Compare/Blend

#### Best Practices:

**For Step 1:**
- Include all three elements: what, who, problem
- Be specific: "marketing agencies" not "businesses"
- Mention key differentiators or unique value
- Add urgency or emotion if relevant
- Length: 50-150 characters ideal

**For Step 2:**
- Trust smart defaults unless you have specific needs
- Override tone if auto-inference seems wrong
- Enable GEO for "how-to" and informational content
- Use Custom length only when required (ad copy, specific limits)

**General Tips:**
- Review summary screen before generating
- Use "Explain My Setup" to understand AI decisions
- Save successful configurations as templates
- Let auto-detection work - it's highly accurate
- Edit form fields after applying if needed

**For Agencies:**
- Set up customers with Brand Voices first
- Select customer before opening wizard
- Create customer-specific templates from wizard outputs
- Use wizard for client work, manual form for internal

#### Mode Behavior (NEW in v7.0):

**No Auto-Switching:**
- Wizard opens in your current mode (Quick, Standard, or Advanced)
- NO automatic mode changes when opening wizard
- NO mode restoration when closing wizard
- Your mode stays exactly as you set it

**Field Population:**
- Wizard populates fields that are visible in your current mode
- In Quick Mode: Only essential fields populated
- In Standard/Advanced Mode: All wizard-detected fields populated
- Missing fields not an issue - you can switch modes after wizard completes

**Post-Wizard Flexibility:**
- After wizard completes, switch to any mode you want
- All wizard data preserved regardless of mode
- Text updated to reference "Advanced Mode" for additional options
- Clean, predictable behavior

**Best Practice:**
- Use Standard Mode (default) for most wizard sessions
- Switch to Advanced Mode after wizard if you need advanced fields
- Quick Mode works fine for simple wizard requests

#### Technical Notes:

- Wizard state saved to localStorage (survive refresh)
- Works offline after initial load
- Mobile-optimized (thumb-friendly buttons)
- Keyboard shortcuts: Enter to continue, Esc to close
- Analytics tracked: completion rate, time per step, abandonment points

---

### 2.10 Saved Templates

**Location:** Left floating action bar (vertical button panel on left side of screen)

**What it does:** Save your current form configuration for reuse with an improved save/overwrite interface.

**Visibility Requirements:** The left floating action bar (containing Save as Template and Evaluate Inputs buttons) is **hidden** until you fill in the minimum required fields:
- **Project Description** (required for session tracking)
- **Product/Service Name** (required)
- **EITHER** Business Description **OR** Original Copy (you only need one)

The entire left action bar appears as soon as you have these three fields filled—you don't need to select a tab first. This ensures templates contain complete, ready-to-use configurations.

**How the Save Template Dialog Works:**

When you click "Save as Template," you'll see a clean form with TWO action buttons:

**The Form:**
- **Template Name**: Enter the name for your template (required)
- **Description**: Optional notes about this template
- **Category**: Optional category (defaults to "Uncategorized" if blank)

**Two Clear Actions:**

**1. "Update Original Template" Button (Primary - Blue)**
- Only appears when you've loaded an existing template
- Updates the template you originally loaded with your current settings
- Shows a confirmation dialog before updating
- Confirmation warns: "You are about to update the template '[Name]'. This will overwrite all existing settings with your current configuration. This action cannot be undone."
- Perfect for refining and improving templates you already use

**2. "Save as New Template" Button (Secondary - Gray)**
- Always available
- Opens a confirmation dialog asking for the new template name
- Default name suggestion: "Original Template Name - Copy"
- You can modify the suggested name before saving
- Creates a brand new template - never overwrites existing ones
- Perfect for creating variations from existing templates

**Visual Flow:**
```
┌─────────────────────────────────────────┐
│ Save as Template                        │
├─────────────────────────────────────────┤
│ ℹ️ Loaded from: "Homepage Template"     │
├─────────────────────────────────────────┤
│ Template Name: [Homepage v2______]      │
│ Description:   [Updated version__]      │
│ Category:      [Marketing________]      │
│                                         │
│ [Cancel]  [Update Original] [Save New] │
└─────────────────────────────────────────┘
```

**Confirmation Dialog (Update):**
```
┌─────────────────────────────────────────┐
│ ⚠️  Update Existing Template?           │
├─────────────────────────────────────────┤
│ You are about to update the template    │
│ "Homepage Template". This will          │
│ overwrite all existing settings with    │
│ your current configuration.             │
│                                         │
│ This action cannot be undone.           │
│                                         │
│         [Cancel] [Yes, Update Template] │
└─────────────────────────────────────────┘
```

**Confirmation Dialog (Save as New):**
```
┌─────────────────────────────────────────┐
│ Save as New Template                    │
├─────────────────────────────────────────┤
│ Enter a name for the new template:      │
│                                         │
│ New Template Name: *                    │
│ [Homepage Template - Copy_________]     │
│                                         │
│              [Cancel] [Save New Template]│
└─────────────────────────────────────────┘
```

**What gets saved:**
- All input fields and their values
- AI model selection
- Tone, language, word count
- Output structure configuration
- All toggles and optional features
- Special instructions
- Template category
- Customer assignment (if selected)
- Brand Voice selection (if applied)

**What doesn't get saved:**
- Generated outputs (those are saved separately)

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
- Use "Update Original Template" to refine templates you already use
- Use "Save as New Template" to create variations or new templates
- Always review the confirmation dialog before updating
- Use descriptive names with categories
- Update templates when you refine your approach
- Share template names with team members

**New Features in v6.8-6.10:**
- ✅ **NEW in v6.10.1:** "Save as New Template" now prompts for name with smart default (Original Name - Copy)
- ✅ **NEW in v6.10.1:** Prevents accidental overwrites when creating template variations
- ✅ **NEW in v6.10:** Two separate action buttons for clarity
- ✅ **NEW in v6.10:** "Update Original Template" as primary action (when applicable)
- ✅ **NEW in v6.10:** Confirmation dialog prevents accidental overwrites
- ✅ **NEW in v6.10:** Simplified UI removes confusion between update/create workflows
- ✅ **NEW in v6.9:** Customer and Brand Voice associations now saved in templates
- ✅ **NEW in v6.9:** Loading a template restores Customer and Brand Voice selections
- ✅ **NEW in v6.9.1:** Category field is now optional (defaults to "Uncategorized" if blank)

---

### 2.11 Load Template (Quick Starts & Saved Templates)

**What it does:** One unified dropdown that provides access to both Quick Start templates (pre-built examples) and your Saved Templates (custom configurations).

**Two types of templates:**
- **Quick Starts** = Built-in examples for common content types
- **My Templates** = Your custom saved configurations

**How to use:**
1. Click "Load Template" dropdown
2. Browse two sections:
   - **Quick Starts**: Pre-configured templates for common use cases
   - **My Templates**: Your saved templates (grouped by category)
3. Select a template that matches your needs
4. Form auto-fills with the template content
5. Customize as needed for your specific case
6. Generate

**NEW: Automatic Advanced Mode Switching (v7.4.5)**

When you load any template, CopyZap automatically switches to Advanced mode to ensure all template fields are visible:

**Automatic Mode Switching:**
- Loading any template automatically switches the form to **Advanced mode**
- Works for both **Quick Start templates** and **Saved Templates**
- Guarantees all template fields are immediately visible
- No hidden fields - you see exactly what the template contains
- Eliminates confusion about what data was loaded
- If you're already in Advanced mode, no switch occurs
- The Advanced button in the mode toggle highlights as active

**Field Count Notification:**
- Toast appears: "Template loaded: 12 fields. Switched to Advanced mode."
- Or if already in Advanced: "Template loaded: 12 fields."
- Instant feedback on how much data was imported
- Confirms the mode switch occurred (if needed)

**Why This Matters:**
- Templates can contain many fields across Quick, Standard, and Advanced sections
- Staying in Quick or Standard mode could hide populated fields
- Hidden fields would still affect generation, causing confusion
- Automatic Advanced mode switch prevents this issue entirely
- You always see the complete template configuration

**Smart Section Expansion:**
- Sections with populated template data automatically expand
- Empty sections remain collapsed
- See your loaded data immediately
- Focus on what matters

**Field Highlighting:**
- Populated fields briefly highlight with blue fade (300ms)
- Visual confirmation of loaded data
- See exactly what changed
- Professional, polished experience

**Customer & Brand Voice Handling:**
- Templates may contain Customer and Brand Voice selections
- These fields remain hidden in Quick Mode even when populated
- Warning notifies you of hidden populated fields
- Switch to Standard/Advanced Mode to see and use these selections
- No data loss - all template data preserved

**Template Saves All Fields:**
- Templates save ALL populated fields regardless of mode
- Data never lost based on your current mode
- Mode compatibility checked on load, not save
- Full flexibility for template creation and reuse

**Quick Start categories:**
- **Website Content:** Landing pages, about pages, service pages
- **Marketing:** Product descriptions, campaigns, value propositions
- **Email:** Newsletters, promotional emails, drip campaigns
- **Social Media:** Posts, captions, announcements
- **Long-form:** Blog posts, articles, guides

**When to use Quick Starts:**
- Learning the tool (see what good input looks like)
- Quick projects where examples save time
- Not sure how to structure your request
- Want inspiration for your own template

**When to use Saved Templates:**
- Repeated work with consistent settings
- Team standardization and brand consistency
- Complex configurations you want to reuse
- Client-specific setups

**Best practices:**
- Treat Quick Starts as starting points, not final solutions
- Replace example content with your specifics
- Learn from the structure and wording
- Create your own templates for frequently used configurations

**✅ NEW in v6.12.0: Smart Bracket Placeholder Detection**

The system now intelligently detects when Quick Start templates contain bracketed placeholder text and helps you remember to customize them:

**Visual Highlighting (v7.4.4):**
- Form fields containing bracketed placeholders like `[angle]` or `[your product]` are automatically highlighted with an **orange background**
- Only fields with actual bracket placeholders receive the orange highlight - empty fields and completed fields remain white/black (depending on theme)
- This visual cue immediately shows you which fields need customization
- Removes the guesswork - you can see at a glance what still needs your input
- Updates in real-time as you edit and remove placeholders

**Smart Toast Notification:**
- When you load a Quick Start template that contains bracketed placeholders (like [enter your issue] or [your product]), you'll see a helpful warning toast
- Message: "⚠️ Replace bracketed placeholders [like this] with your specific details before generating"
- Only appears for templates that actually have bracketed placeholders - no unnecessary notifications
- Appears 500ms after the success toast for better visibility

**Pre-Generation Validation:**
- Before generating content, the system checks if your form still contains bracketed placeholder text
- If placeholders are detected, a modal appears showing:
  - Clear warning about bracketed placeholder text
  - Examples of placeholders found in your form (up to 3 examples)
  - Field names where placeholders were detected
- Two options:
  - **"Go Back and Edit"** (recommended) - Returns to form to replace placeholders
  - **"Generate Anyway"** - Proceeds with generation (in case placeholders are intentional)

**Common bracketed placeholders detected:**
- `[enter your issue]` - Action-based instructions
- `[your topic]`, `[your product]`, `[your company]` - Generic bracketed prompts
- `[product name]`, `[brand name]`, `[service name]` - Specific field placeholders
- Any text within brackets with 3+ characters

**Also detects:** The legacy `XXX` placeholder for backward compatibility

**Why this helps:**
- Prevents wasting API credits on unedited template examples
- Teaches new users to customize templates properly
- Catches accidental oversights before generation
- Non-intrusive - only appears when actually needed
- Focuses on the most common placeholder pattern (bracketed text)

---

### 2.12 Evaluate Inputs Button

**Location:** Left floating action bar (vertical button panel on left side of screen)

**What it does:** AI analyzes your form inputs before generation and suggests improvements. **Checks for:**
- Missing critical information
- Vague or unclear descriptions
- Conflicting instructions
- Insufficient context
- Opportunities to improve specificity

**Visibility Requirements:** The left floating action bar (containing Evaluate Inputs and Save as Template buttons) is **hidden** until you fill in the minimum required fields:
- **Project Description** (required for session tracking)
- **Product/Service Name** (required)
- **EITHER** Business Description **OR** Original Copy (you only need one)

The entire left action bar appears as soon as you have these three fields filled—you don't need to select a tab first.

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

### 2.13 Collapsible Section Interface

**What it does:** Organizes form fields into 5 collapsible sections with smart field counting.

**The 5 Sections:**

1. **What You're Creating**
   - Model, Customer, Brand Voice, Project Description, Product/Service Name, Business Description/Original Copy, Section, Excluded Terms
   - Default state: Expanded
   - Shows field count: "(X filled)"

2. **Audience & Targeting**
   - Industry/Niche, Target Audience, Reader Funnel Stage, Competitor URLs, Pain Points, Competitor Copy Text
   - Default state: Collapsed
   - Shows field count: "(X filled)"

3. **Tone & Style**
   - Language, Tone, Word Count, Tone Level, Writing Style, Style Constraints, Output Structure, Include Section Titles
   - Default state: Collapsed
   - Shows field count: "(X filled)"

4. **Strategic Messaging**
   - Key Message, Desired Emotion, Call to Action, Brand Values, Keywords, Context, Special Instructions
   - Default state: Collapsed
   - Shows field count: "(X filled)"

5. **Optimization & Optional Features**
   - All SEO metadata toggles, GEO optimization, scoring options, word count enforcement, metadata variant controls
   - Default state: Collapsed
   - Shows field count: "(X filled)"
   - **Note:** Entire section hidden in Quick Mode

**Section Behavior by Mode:**

**Quick Mode:**
- Sections only appear if they contain Quick Mode-visible fields
- Empty sections automatically hidden
- Minimal, focused interface

**Standard/Advanced Mode:**
- All 5 sections always visible
- Sections remain visible even when empty
- Field counts update dynamically

**Smart Features:**

**Field Counting:**
- Each section header shows filled field count
- Only displays count when > 0
- Updates in real-time as you type
- Example: "Audience & Targeting (3 filled)"

**Visual Dividers:**
- Clean 1px horizontal lines between sections
- Subtle gray color (light/dark mode aware)
- Professional visual separation

**Template Loading:**
- Sections with populated template data auto-expand
- Empty sections remain collapsed
- Populated fields briefly highlight (300ms blue fade)
- Visual confirmation of loaded data

**Best practices:**
- Keep Section 1 expanded while working
- Collapse sections after filling them out
- Use field counts to track completion progress
- Expand sections as needed during workflow

---

### 2.14 Export / Import JSON

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

### 2.15 Start Hub / Project Launcher

**What it is:** A persistent modal that appears when you enter the Copy Maker, helping you choose the fastest path to start your content creation work. Think of it as a project launcher that eliminates decision fatigue and routes you directly to the right tool with the right settings.

**Visibility Rules:**
- Appears automatically on every app entry until you permanently dismiss it
- No complex logic - it shows until you click "Don't show this again"
- Once dismissed, you can always re-open it via the "Start New Project" button

**Three Entry Paths:**

**1. Start with Copy Wizard**
Best for: Guided, outcome-driven content creation. Ideal for new users or when you want quick results with AI-powered setup.

Sub-options:
- **Make new copy** - Create fresh content from scratch. Opens wizard in "create" mode with focus on business description.
- **Improve existing copy** - Enhance and refine your current content. Opens wizard in "improve" mode with focus on existing copy input.
- **Quick Polish** - Fast touch-ups and refinements. Opens wizard in "polish" mode for rapid improvements.

**2. Start with Copy Form**
Best for: Experienced users who want manual control over all parameters.

Sub-options:
- **Quick** - Essential fields only, fastest path to generation. Shows only core panel.
- **Standard** - Balanced control with key options. Shows core and SEO panels.
- **Advanced** - Full control over all parameters. All panels expanded.

**3. Start from a Template**
Best for: Fast repeat workflows using your saved templates or Quick Start templates.

Opens the template selection view where you can browse saved templates and Quick Start templates.

**"Show Start Hub on app load" toggle:**
Located in the modal footer, this toggle controls automatic display behavior:
- **Toggle ON (default):** Start Hub appears automatically when you load the app with an empty form
- **Toggle OFF:** Start Hub will not appear automatically
- Your preference is saved immediately to your user account
- Changes take effect right away - no refresh needed

**Re-access via "Start Hub" button:**
A "Start Hub" button appears in the top navigation when you're on the Copy Maker page:
- Click it anytime to manually open the Start Hub
- Always works, regardless of your auto-show preference
- Full routing options always available
- **Visual styling:** The button features an orange icon and text to make it easily identifiable and distinct from other navigation elements

**Why this matters:**
- Eliminates "blank canvas" paralysis
- Routes you directly to the right state with zero additional clicks
- Provides context-aware starting points
- Reduces time-to-first-generation significantly

---


#### 2.1.2 Generated Output & Management

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

### 3.3 Get Modification Suggestions (AI-Powered)

**What it does:** Analyzes your generated content using AI and suggests specific, context-aware improvements tailored to your actual copy. This is **NOT a static list** - the AI reads your content and provides intelligent, actionable suggestions.

**How it works:**
1. Click the wand icon button "Get modification suggestions" on any generated copy card
2. AI analyzes your content, considering:
   - Your target audience
   - Selected tone and style
   - Key message and goals
   - Current content structure and flow
   - Language and output type
3. Generates 3-5 specific suggestions in each category
4. Browse AI-generated suggestions by category
5. Use search to filter suggestions
6. Click any suggestion to add it to your modification instruction field
7. Can combine multiple suggestions
8. Edit the combined instruction before applying

**AI generates suggestions in these categories:**

**1. Tone & Style**
- Adjustments to voice, formality, and energy level
- Example: "The opening paragraph is too formal for the stated 'casual' tone - rewrite with more conversational language"

**2. Structure & Flow**
- Organization, pacing, and transitions
- Example: "Add subheadings before paragraphs 3 and 5 to improve scanability"

**3. Persuasion & Impact**
- Strengthening arguments, emotional appeals, clarity
- Example: "The benefits section lists features instead of outcomes - reframe each point to focus on customer results"

**4. Audience Alignment**
- Better targeting, addressing pain points
- Example: "For a B2B audience, add more concrete ROI data in the second section"

**5. Brevity & Clarity**
- Simplification, removing redundancy, improving readability
- Example: "Paragraph 4 repeats the same idea three times - consolidate into one stronger statement"

**Token Usage:**
- Operation type: `modification_suggestions`
- Typical usage: 500-800 tokens per generation
- All token usage is tracked in the admin token dashboard
- Uses the model selected in your form settings

**When to use:**
- Not sure exactly what changes you need
- Want AI to identify weak spots in your content
- Need specific, actionable improvement ideas
- Want suggestions based on your actual content, not generic advice

**Best practices:**
- AI suggestions are context-specific to YOUR content
- Can combine multiple suggestions before applying
- Edit suggestions to be even more specific to your needs
- Suggestions are starting points - you can refine them further
- Try one category at a time to see the impact

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

**Enhanced Individual Version Analysis:**

Each version in the "All Versions Breakdown" section now includes the same detailed analysis components shown for the overall winner:

**Key Strengths** (3-5 points specific to that version)
- Universal relatability through 'we've all been there' framing that transcends political divisions
- Superior structural flow with short, punchy sentences that build momentum and maintain engagement
- Elevated brand positioning through inspirational tone

**Suggested Improvements** (2-3 actionable suggestions specific to that version)
- Could benefit from a stronger call-to-action at the end to drive immediate conversion
- The opening could be slightly more attention-grabbing to compete in crowded social feeds

**Strategic Recommendation** (1-2 sentences on how to best use or optimize this specific version)
- "Use this approach for main landing pages and premium positioning, then deploy urgency-focused variations in retargeting ads and email sequences to convert warm traffic"
- "Best suited for early-stage awareness content where building trust takes priority over immediate conversion"

**Why This Matters:**
- **Per-version insights:** Every alternative now gets its own strategic analysis, not just the winner
- **Actionable feedback:** Each version receives specific, targeted improvement suggestions
- **Usage guidance:** Clear recommendations on when and where to deploy each version
- **Better decision-making:** Understand exactly what makes each version unique and valuable
- **Learn from all versions:** Even non-winning versions offer strategic insights for future content

**Example - Individual Version Analysis:**

```
Alternative 1 (Steve Jobs Style)
Score: 82/100

KEY STRENGTHS
• Universal relatability through 'we've all been there' framing
• Superior structural flow with short, punchy sentences
• Elevated brand positioning through inspirational tone
• Strategic de-emphasis of political controversy
• Clear value proposition focusing on emotional benefits

SUGGESTED IMPROVEMENTS
• Could benefit from a stronger call-to-action at the end
• The opening could be slightly more attention-grabbing

STRATEGIC RECOMMENDATION
Use this approach for main landing pages and premium positioning,
then deploy urgency-focused variations in retargeting ads and email
sequences to convert warm traffic.
```

This enhancement ensures that you get deep, actionable insights for **every version you generate**, not just the winning one. This helps you understand the strategic value of each alternative and make informed decisions about when and how to use different versions for different contexts, audiences, or channels.

**Bulk Generate Analysis (All Versions at Once):**

At the top of the "All Versions Breakdown" section, a "Generate analysis for all versions" button appears when the detailed breakdown panel is open. It:

- Generates analysis only for versions that do not yet have a cached result — no re-spend on already-analyzed versions
- Shows a live progress counter: "Generating analysis: X / N" while running
- Disables during generation to prevent double-clicks
- Helper text reads: "Uses credits. Generates only missing analyses."
- Replaced by an "All analyses generated" badge once every version has a result
- Never triggers automatically — only on explicit user click
- Internally calls `ensureVersionDeepAnalysis` sequentially, so all caching and in-flight guards apply

**Per-Version On-Demand Deep Analysis (Option A — Auto-Detect Missing Analysis):**

Deep analysis is generated lazily — only when you explicitly interact with a specific version. This preserves credits and avoids unexpected token spend.

How it works:

- Expand the "View detailed breakdown" panel. Each version card is shown with a collapsible header displaying the version name and score.
- If a version has no deep analysis yet (e.g., it was added after the initial analysis run), its card shows a placeholder with a "Generate Analysis" button.
- Click the version card header, click "Generate Analysis" in the placeholder, or use the "Output" / "Improve" table deep links — any of these explicit actions trigger analysis for **only that specific version**. No other versions are affected.
- While analysis is generating for a card, an inline spinner appears next to that version's name. Other version cards are unaffected and remain interactive.
- Once complete, the placeholder is immediately replaced with the full strengths / improvements / strategic recommendation content. The result is cached in state so reopening the card does not trigger another API call.
- Versions that already have analysis are always shown expanded with their content intact. Toggling a card with existing analysis collapses and re-expands it without re-calling the API.

Trigger points:
1. Clicking a version card header in the "All Versions Breakdown" section
2. Clicking the "Generate Analysis" button inside the placeholder card
3. Clicking "Output" or "Improve" deep links in the score comparison table row
4. Clicking "Suggest Improvements" from the version header (when scrolling to the improvements section of an unanalyzed version via a deep link)

No analysis is ever generated automatically in the background. Generation always requires an explicit user click.

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

**Comparison Persistence & Updates:**

**Important:** Comparison results are static snapshots that persist exactly as generated:
- Once created, a comparison card remains unchanged even if you add new output cards
- Adding alternatives, applying voice styles, or creating new variations does NOT automatically update existing comparisons
- To include new outputs in a comparison, you must manually click "Compare All Outputs" again
- This creates a new comparison card while preserving the original comparison for reference

**Why this behavior:**
- Preserves historical analysis for tracking and decision-making
- Prevents unexpected changes to saved comparison data
- Allows side-by-side comparison of different comparison runs
- Gives you full control over when comparisons are recalculated

**Example workflow:**
1. Generate 3 alternatives → Click "Compare All Outputs" → Get Comparison Card A (analyzes 3 outputs)
2. Apply voice style to best alternative → Comparison Card A remains unchanged
3. Create another alternative → Comparison Card A still shows original 3 outputs
4. Click "Compare All Outputs" again → Get Comparison Card B (analyzes all 5 current outputs)
5. Now you have both comparisons saved for reference

**Best practice:** If you want a comparison to include all your current outputs, click "Compare All Outputs" after you've finished creating all the variations you want to evaluate.

---

### 3.10 Blend Outputs

**What it does:** Combines the best elements from multiple versions into one superior version. **How it works:**
1. After running "Analyze – Compare & Score Copy", a **Blend Best Versions** button appears directly below the comparison table
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

### 3.11 Analyze – Compare & Score Copy

**What it does:** This feature allows you to objectively compare multiple copy variations and understand which version performs best for marketing and conversion. CopyZap uses an independent AI analysis system to evaluate clarity, persuasion, structure, tone, and conversion potential. Each version is scored and explained, helping you confidently select the strongest copy for client delivery or publication.

**Trust & Objectivity:** The analysis is performed independently from copy generation to ensure objective and unbiased evaluation.

**How it works:**
1. Generate at least 2 outputs (or have 1 output + original copy in Improve mode)
2. Scroll to the bottom of your output cards
3. Click the "Analyze – Compare & Score Copy" button
4. Select your preferred analysis type from 6 options
5. Wait while the system analyzes all versions with your chosen focus
6. A new output card appears with "Independent Analysis Summary"

**Analysis Type Options:**

When you click "Analyze – Compare & Score Copy", a modal appears with 6 specialized analysis types to choose from:

1. **Marketing Effectiveness**
   - Analyzes persuasion techniques used
   - Evaluates value proposition clarity
   - Assesses unique selling points
   - Measures conversion potential
   - Reviews competitive positioning
   - Examines marketing psychology principles
   - **Best for:** Sales pages, ads, promotional content

2. **Clarity & Readability**
   - Evaluates sentence structure and flow
   - Assesses word choice and simplicity
   - Identifies jargon and technical terms
   - Measures reading level and accessibility
   - Reviews scanability and formatting
   - Checks message clarity
   - **Best for:** Educational content, instructions, broad audiences

3. **SEO & Keywords**
   - Analyzes keyword usage and density
   - Evaluates search intent alignment
   - Assesses meta-friendly content structure
   - Reviews semantic relevance
   - Identifies long-tail keyword opportunities
   - Measures search engine optimization potential
   - **Best for:** Blog posts, web pages, content marketing

4. **Emotional Impact**
   - Evaluates emotional triggers used
   - Assesses tone and voice consistency
   - Measures audience connection strength
   - Reviews storytelling elements
   - Examines brand personality expression
   - Checks empathy and relatability
   - **Best for:** Brand storytelling, emotional campaigns, testimonials

5. **Call-to-Action Effectiveness**
   - Analyzes CTA clarity and visibility
   - Evaluates action verb strength
   - Assesses urgency and scarcity elements
   - Reviews value communication
   - Identifies friction points
   - Checks next steps clarity
   - **Best for:** Landing pages, sales emails, conversion-focused content

6. **Comprehensive Analysis** ⭐ DEFAULT
   - Covers all aspects above
   - Marketing effectiveness and persuasion
   - Clarity and readability
   - SEO and keyword optimization
   - Emotional impact and connection
   - Call-to-action effectiveness
   - Overall copywriting quality
   - **Best for:** Important content requiring thorough evaluation

**What gets compared:**
- **Original Copy** (if in Improve Existing Copy mode and original copy exists) - labeled as "Option 1)"
- **All Output Cards** - each labeled with its existing card name (e.g., "Generated Copy 1", "Alternative: Generated Copy 1", "Don Draper's Voice from...")

**What the analysis provides** (based on your selected analysis type):
- Focused score (1-10 for each option) based on the chosen analysis type
- Section-by-section analysis relevant to your selected focus
- Strengths of each version in the context of your chosen analysis
- Weaknesses and areas for improvement specific to your analysis type
- Specific actionable suggestions tailored to your focus area
- Comparison table summarizing all findings
- Clear recommendation of the best-performing copy
- Structured, explainable reasoning (not just raw scores)

**Enhanced Display Features:**
- **Actual Card Names in Table:** The comparison table now uses real output card names (e.g., "Generated Copy 1", "Steve Jobs' Voice") instead of generic "Option 1", "Option 2" labels
- **Scores in Headers:** Each analysis section shows the score directly in the header (e.g., "### Analysis of Generated Copy 1 - Score: 8/10")
- **Color-Coded Scores:** All scores throughout the analysis are color-coded:
  - 🟢 Green: 80-100 (Excellent)
  - 🟡 Yellow/Orange: 50-79 (Good/Fair)
  - 🔴 Red: 0-49 (Needs improvement)
- **Quick Navigation Anchor Links:** Both the "Best Version Analysis" section and the "Comparison Table" include clickable anchor links in the Option column:
  - **Primary link** (e.g., "Generated Copy 1") - Scrolls to the corresponding output card
  - **"→ View Analysis"** / **"→ View Detailed Analysis"** link - Scrolls directly to that option's detailed analysis section
  - All links use smooth scrolling for better UX
  - Helps you quickly jump between the summary table, full output cards, and detailed analysis sections

**Example analysis output:**

```
# Marketing Copy Comparison Analysis

## Detailed Analysis

### Analysis of Original Copy - Score: 7/10

**Strengths:**
- Clear and straightforward messaging
- Establishes credibility well
- Professional tone appropriate for B2B

**Weaknesses:**
- Lacks emotional engagement
- No clear call-to-action
- Benefits not prominently featured

**Improvements:**
- Add a compelling hook in the opening
- Include specific metrics or proof points
- Strengthen the CTA with urgency

### Analysis of Steve Jobs' Voice from Generated Copy 1 - Score: 9/10 ⭐ RECOMMENDED

**Strengths:**
- Powerful opening that captures attention immediately
- Simple, bold statements that resonate
- Clear differentiation from competitors
- Strong emotional appeal

**Weaknesses:**
- May be too bold for conservative audiences
- Could benefit from one concrete example

**Improvements:**
- Consider softening slightly for risk-averse prospects
- Add one specific use case or customer story

## Comparison Table

| Option | Clarity (1-10) | Emotional Impact (1-10) | Persuasiveness (1-10) | Overall (Avg.) | Best Use Case |
|--------|----------------|------------------------|----------------------|----------------|---------------|
| Original Copy | 7 (Clear) | 5 (Moderate) | 6 (Decent) | 6.0 | General content |
| Generated Copy 1 | 8 (Good) | 7 (Strong) | 8 (Very good) | 7.7 | Marketing materials |
| Alternative: Generated Copy 1 | 8 (Clear) | 8 (Engaging) | 8 (Solid) | 8.0 | Web content |
| Steve Jobs' Voice from Generated Copy 1 | 9 (Excellent) | 9 (Powerful) | 9 (Outstanding) | 9.0 | Bold campaigns |

## Recommendation
The "Steve Jobs' Voice from Generated Copy 1" version delivers the strongest overall marketing effectiveness with exceptional emotional impact and clear differentiation. Best suited for bold product launches and brand positioning.
```

**Button behavior:**
- **Disabled** when fewer than 2 total items available to compare
- Shows **"Analyzing..."** loading state during analysis
- Appears at the bottom of all output cards in the results panel

**When to use:**
- Want focused analysis on a specific aspect of your copy (SEO, clarity, emotional impact, etc.)
- Need detailed improvement suggestions for each version in your chosen focus area
- Want to understand effectiveness across a specific dimension or comprehensively
- Need clear scoring to justify version selection to stakeholders
- Comparing versions for a specific purpose (e.g., SEO optimization vs. conversion optimization)
- Require objective evaluation to make confident content decisions

**Requirements:**
- Need at least 2 items to compare (original copy + 1 output, OR 2+ outputs)
- Analysis creates a new output card that can be:
  - Copied to clipboard
  - Included in exports
  - Saved with other outputs

**Best practices:**
- **Choose the right analysis type:** Select the analysis focus that matches your primary goal (e.g., "SEO & Keywords" for blog posts, "CTA Effectiveness" for landing pages)
- Run this after generating multiple variations for maximum insight
- Compare both standard and voice-styled versions for diverse perspectives
- **Try multiple analysis types:** Run different focused analyses on the same set to get comprehensive insights (e.g., first run "Marketing Effectiveness", then run "SEO & Keywords")
- Use "Comprehensive Analysis" when you need a complete evaluation across all dimensions
- Use the specific suggestions to refine your copy further
- Combine with standard "Compare All Outputs" to get multiple perspectives
- The analysis summary is formatted in clean markdown for easy reading

**Difference from standard Compare:**
- Uses independent analysis for objective evaluation
- Different analytical perspective and scoring methodology
- Includes more detailed improvement suggestions
- Formatting optimized for marketing analysis
- Creates a standalone output card rather than a comparison modal

**Clean Display Mode for Workflow Analysis:**

When viewing workflow analysis outputs (such as when using "Analyze – Compare & Score Copy" with workflow-generated content), the display intelligently hides redundant detailed analysis sections to improve readability:

- **What gets hidden:** Individual "Analysis of [Option Name]" sections with detailed breakdowns are automatically suppressed
- **What you still see:**
  - Summary comparison table with scores and recommendations
  - Overall recommendation and best version analysis
  - All output cards showing the actual generated content
  - Quick navigation anchor links to output cards
- **Why this matters:** The detailed analysis text is redundant because the same information is already visible in the output cards themselves. This prevents repetitive content and creates a cleaner, more focused workflow comparison experience
- **Technical note:** This is an intentional design feature that should not be modified without explicit permission. The filtering logic is clearly documented in the codebase to preserve this behavior

**Example workflow display:**
When comparing multiple workflow outputs, you'll see:
1. Overall comparison table with scores
2. Best version recommendation
3. Quick links to jump to specific outputs
4. The actual output cards with full content

But you won't see:
- Redundant "Analysis of Option 1" text sections
- Duplicate detailed breakdowns already shown in cards
- Repetitive scoring information

This streamlined approach keeps workflow comparisons concise and actionable while maintaining all essential information for decision-making.

---

### 3.12 Right Floating Action Buttons

These buttons provide quick actions on your generated content. They appear in a vertical bar on the right side of the screen. #### 1. Save Output

**What it does:** Saves all generated content and form inputs to your dashboard. **What gets saved:**
- All generated output cards
- All form inputs used
- Comparison results (if you ran Compare All)
- Relationships between outputs (alternatives, derived versions)
- Metadata (generation date, AI model used, word counts)
- SEO metadata (if generated - either during initial generation or added per-card later)

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

#### Understanding Copy Sessions vs Saved Outputs

CopyZap uses a two-tier storage system to keep your workspace clean while preserving important work:

**Copy Sessions (Auto-Save / Temporary Storage):**
- **What:** Every time you click "Generate," your **input settings only** are automatically saved as a session (form configuration, prompts, parameters)
- **What's NOT saved:** Generated outputs/content are NOT stored in sessions
- **Purpose:** Lets you quickly restore your input settings and parameters without preserving the actual generated content
- **Lifecycle:** **Temporary** - automatically cleaned up to prevent database bloat
- **Retention Policy:**
  - Sessions older than **30 days** are automatically deleted
  - Each user is limited to their **50 most recent sessions**
  - Cleanup runs daily at 2 AM UTC
- **User control:** You never have to manage these - they're automatic
- **Example:** You generate 20 different versions of an email this week → all input settings auto-saved as sessions → after 30 days, they're gone unless you explicitly saved your favorites

**Saved Outputs (Permanent Storage):**
- **What:** When you click "Save Output" button, both your inputs AND generated outputs are marked for permanent storage
- **Purpose:** Long-term preservation of important work you want to keep
- **Lifecycle:** **Permanent** - never automatically deleted
- **Features:**
  - Add custom title and description
  - Tag for easy searching
  - Organize by project or client
  - Load back anytime to continue editing
- **User control:** You decide what to save and when to delete
- **Example:** You love version 3 of your email → click "Save Output" → it's preserved forever in your Saved Outputs library

**Why Two Systems?**

Without this dual approach:
- ❌ Save everything forever → Database fills with junk, slow performance
- ❌ Delete old work → Users lose important projects

With this system:
- ✅ Working sessions are temporary (like browser history)
- ✅ Important work is preserved (like bookmarks)
- ✅ Database stays clean and fast
- ✅ You never lose what matters

**Workflow Example:**

1. **Monday:** Generate 10 blog headline variations → all input settings auto-saved as sessions (but NOT the generated headlines)
2. **Tuesday:** Love headline #7 → click "Save Output" → inputs AND outputs saved to Saved Outputs
3. **45 days later:** The 10 auto-saved sessions → deleted automatically (over 30 days old)
4. **45 days later:** Your saved headline #7 → still in Saved Outputs with full content, ready to use

**Key Takeaway:**
- **Don't worry about sessions** - they're automatic working copies
- **Do use "Save Output"** for any work you want to keep long-term
- **Think of it like Google Docs:** Auto-save handles drafts, you star/bookmark what matters

---

#### 2. Copy as Markdown

**What it does:** Copies ALL generated content to clipboard in Markdown format, including SEO metadata if present. This button appears in TWO locations:

1. **Floating Action Bar** (right side) - Copies entire project
2. **Individual Output Cards** - Copies single output only (NEW)

**Floating Action Bar - Copy as Markdown:**

Copies the entire project including:
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

**Output Card - Copy as Markdown (NEW):**

Each output card now has its own "Copy as MD" button that copies ONLY that specific output in clean Markdown format.

**What's included:**
- Output content in Markdown
- Preserves all formatting (headers, bold, lists, etc.)
- Clean, ready-to-paste format
- NO metadata, NO inputs, NO other outputs

**Button location:**
- Top-right corner of each output card
- Icon: Markdown symbol (MD)
- Tooltip: "Copy as Markdown"

**Use cases:**
- **Single output export:** When you only want one specific version
- **Quick sharing:** Copy and paste into Slack, email, Notion
- **Content repurposing:** Use one output across multiple platforms
- **Draft iteration:** Paste into Google Docs or Word for editing
- **Documentation:** Add to technical docs or wikis
- **GitHub/GitLab:** Paste into markdown files or issues

**When to use:**
- **Project copy (Floating bar):** Documenting complete project, saving all versions, team reviews
- **Single output (Card button):** Quick sharing, focused export, single version needed

**Best practices:**
- Paste into Markdown-compatible tools for best formatting
- Edit in a Markdown editor if needed
- Works great for version control (Git)
- Use card button for quick individual exports
- Use floating bar button for comprehensive project export

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

**Note:** This is a technical/admin feature not meant for typical content creation workflow.

---

### 3.12 Advanced Copy Maker Features

This section covers powerful advanced features for precise content control and optimization.

#### Output Card Hierarchy System

**Visual Organization:**

Generated content follows a parent-child hierarchy:

1. **Primary Output** (Level 0)
   - Original generated content
   - Appears at top level
   - No indentation

2. **Derived Outputs** (Level 1)
   - Alternatives created from primary
   - Voice styles applied to primary
   - Modifications of primary
   - Indented once, connecting line to parent

3. **Secondary Derived** (Level 2)
   - Alternatives of alternatives
   - Voice styles applied to modifications
   - Modifications of derived content
   - Indented twice, connecting lines show full chain

**Visual Indicators:**
- **Parent card**: Standard border, full-width
- **Child card**: Indented 40px, left border line connects to parent
- **Grandchild card**: Indented 80px, double connecting lines
- **Active source**: Highlighted border when creating derived content

**Example Hierarchy:**
```
📄 Improved Copy (Primary)
  ├─ 📄 Alternative Copy 1 (Derived)
  │   └─ 📄 Voice Style: Persuasive (Secondary Derived)
  ├─ 📄 Voice Style: Professional (Derived)
  └─ 📄 Modified: Add Statistics (Derived)
      └─ 📄 Alternative Copy 2 (Secondary Derived)
```

**Navigation:**
- Click parent title to collapse/expand children
- "Show All" / "Hide Children" buttons per card
- Floating nav bar includes all levels
- Breadcrumb trail shows current position

**Benefits:**
- Visual tracking of content evolution
- Easy comparison between iterations
- Clear attribution (know what came from what)
- Prevents confusion with multiple versions

---

#### Hard Word Count Enforcement Loop

**Purpose:** Ensures output precisely matches target word count

**How It Works:**

1. **Initial Generation**
   - AI generates content aiming for target
   - System counts words in output
   - Compares to target ± tolerance

2. **Enforcement Check**
   ```
   Target: 200 words
   Tolerance: 20% (40 words)
   Acceptable Range: 160-240 words
   ```

3. **Retry Logic**
   - If outside range: Regenerate with adjusted prompt
   - If too short: "Expand content to reach [target] words"
   - If too long: "Reduce content to [target] words maximum"
   - Maximum 3 retry attempts

4. **Final Output**
   - Within range: Accept and display
   - Still outside range after 3 tries: Display with warning
   - Show actual vs target word count

**Strict Mode Toggle:**

**When OFF (default):**
- Word count is a guideline
- AI prioritizes quality over exact length
- Typical variance: ±20-30%
- Faster generation (no retries)

**When ON (strict):**
- Word count is hard requirement
- Multiple retry attempts
- Slower generation (potential retries)
- Higher accuracy (90%+ hit rate)

**Settings:**
- **Tolerance Percentage**: 10%, 15%, 20%, 25% (default: 20%)
- **Max Retry Attempts**: 1-5 (default: 3)
- **Strict Mode**: ON/OFF toggle

**Use Cases:**

**Strict Mode ON:**
- Ad copy with character limits (Google Ads: 90 chars)
- Email subject lines (60-70 chars)
- Meta descriptions (155-160 chars)
- Social media posts (Twitter: 280 chars)
- Product descriptions with platform limits
- Standardized content templates

**Strict Mode OFF:**
- Blog posts (quality over exact length)
- Landing page copy (natural flow important)
- Creative content (don't constrain creativity)
- Long-form content (exact count less critical)

**Technical Details:**
- Word count algorithm: Split on whitespace, exclude HTML tags
- Character count: Includes spaces for char-limited content
- Retry delay: 2 seconds between attempts
- Token buffer: Reserves 10% tokens for retry overhead

---

#### "Allow Retry If Too Short" Toggle

**Purpose:** Automatically regenerate if output is significantly shorter than target

**Behavior:**

**When ON:**
1. Generation completes
2. If output < 80% of target:
   - Auto-trigger retry
   - Add "Please expand to full target length" instruction
   - Show "Retrying (attempt X/3)" message
   - Maximum 3 auto-retries

**When OFF:**
- No automatic retries
- Accept short outputs
- User can manually request alternative
- Faster generation (no retry overhead)

**Smart Detection:**
- Ignores short targets (< 100 words)
- Only applies to "Short by a lot" (< 80%)
- Respects "Strict Mode" if both enabled
- Disabled for "Custom" word counts

**Example:**
```
Target: 200 words
Generated: 145 words (72% of target)

If Toggle ON:
- Auto-retry with expansion prompt
- Attempt 2: 185 words (92% of target)
- Accept (within 80-120% range)

If Toggle OFF:
- Accept 145 word output
- Show orange warning badge
- User can manually create alternative
```

**Best Practices:**
- Enable for important content
- Disable for rough drafts
- Works well with Strict Mode
- May increase generation time 20-40%

---

#### Enhanced Keyword Integration Logic

**Purpose:** Naturally weave keywords throughout content without stuffing

**Three Integration Modes:**

**1. Natural Mode (default)**
- Keywords used when contextually appropriate
- Synonyms and variations preferred
- Readability prioritized over keyword frequency
- Typical density: 1-2%

**2. Force Keyword Integration (toggle)**
- Guarantees all keywords appear at least once
- Strategic placement (headings, first paragraph, conclusion)
- Uses variations but ensures exact match included
- Density: 2-3%

**3. SEO-Optimized Mode (when SEO toggle ON)**
- Primary keyword in:
  - H1 heading
  - First paragraph (first 100 words)
  - One H2 subheading
  - Conclusion
  - Meta description
  - URL slug
- Secondary keywords distributed naturally
- Density: 2.5-3.5%

**Keyword Processing:**

Input: `project management software, team collaboration, task tracking`

**AI receives:**
```json
{
  "primary_keyword": "project management software",
  "secondary_keywords": ["team collaboration", "task tracking"],
  "variations": [
    "project management tool",
    "team collaboration platform",
    "task tracking system"
  ],
  "placement_rules": {
    "primary_in_h1": true,
    "primary_in_first_100": true,
    "secondary_distributed": true
  }
}
```

**Output Analysis:**
- Keyword frequency report per output
- Placement visualization (where each keyword appears)
- Density percentage calculation
- Warning if over-optimized (>4% density)

**Best Practices:**
- 3-7 keywords optimal
- Mix short-tail and long-tail
- Use Force Integration for critical SEO pages
- Check density report to avoid stuffing

---

#### GEO Optimization Enhanced

**TL;DR Snippet Generation:**

**Purpose:** Create AI-search-ready summaries (ChatGPT, Perplexity, Gemini)

**When GEO Toggle ON:**
1. Main content generated first
2. AI creates 2-3 sentence TL;DR
3. TL;DR appears at top of output
4. Optimized for direct answer extraction

**TL;DR Format:**
```markdown
**TL;DR:** [Product/Service] helps [Target Audience] [Achieve Goal]
by [Key Method]. [Key Differentiator] and [Main Benefit] in [Timeframe].
```

**Example:**
```
TL;DR: TaskMaster Pro helps small business owners streamline project
management by centralizing tasks, deadlines, and team communication in
one platform. Save 10+ hours per week with automated workflows and
real-time collaboration, starting at $12/month.
```

**Snippet-Ready Formatting:**

**Structured for AI Extraction:**
- Clear topic sentences per paragraph
- Question-answer format integration
- Definition statements for key terms
- Numeric data prominently placed
- Action verbs for clarity

**Example Optimizations:**
```
❌ Before: "Our solution offers various benefits"
✅ After: "TaskMaster Pro saves teams 10 hours per week"

❌ Before: "It's great for collaboration"
✅ After: "Teams collaborate in real-time with instant notifications"

❌ Before: "Pricing is competitive"
✅ After: "Plans start at $12/month with 14-day free trial"
```

**GEO Score Elements:**

System evaluates content across 8 dimensions:

1. **Direct Answer Presence (0-100)**
   - Does content directly answer common questions?
   - Are answers in first 100 words?

2. **Clarity & Scanability (0-100)**
   - Short sentences (< 20 words average)
   - Clear structure (headers, lists)
   - No ambiguous pronouns

3. **Factual Density (0-100)**
   - Numbers, statistics, dates
   - Specific claims vs vague statements
   - Quantified benefits

4. **Entity Recognition (0-100)**
   - Clear subject identification
   - Proper nouns properly used
   - No dangling references

5. **Question Integration (0-100)**
   - Answers "who, what, why, how"
   - Natural FAQ format where appropriate

6. **Actionability (0-100)**
   - Clear next steps
   - Specific CTAs
   - Implementable advice

7. **Authoritative Tone (0-100)**
   - Confident assertions
   - Evidence-based claims
   - Expert positioning

8. **Snippet Compatibility (0-100)**
   - 40-60 word answer blocks
   - Self-contained paragraphs
   - Featured snippet structure

**Overall GEO Score:** Average of all 8 dimensions

**Score Ranges:**
- 90-100: Excellent (highly likely to be featured)
- 75-89: Good (competitive for AI answers)
- 60-74: Adequate (needs improvement)
- Below 60: Poor (unlikely to be featured)

**Improvement Suggestions:**
- Specific recommendations per dimension
- Example rewrites for low-scoring sections
- Competitor comparison (if URLs provided)

---

#### OG Description 100-110 Character Rule

**Purpose:** Open Graph descriptions optimized for social sharing

**Strict Character Limit:**
- Minimum: 100 characters
- Maximum: 110 characters
- Target: 105 characters (safe middle)

**Why This Range:**
- Facebook display: ~110 chars
- LinkedIn display: ~100 chars
- Twitter cards: ~100 chars
- Prevents truncation with ellipsis (...)

**Generation Process:**

1. **AI creates description**
2. **Character count check**
3. **If too short (< 100):**
   - Expand with benefit or detail
   - Retry until ≥ 100
4. **If too long (> 110):**
   - Compress without losing meaning
   - Remove filler words
   - Retry until ≤ 110

**Quality Rules:**
- Complete sentences (no cutoffs)
- Key message clear
- Includes brand or product name
- Call-to-action or benefit
- No wasted characters

**Example OG Descriptions:**

**Too Short (85 chars):**
```
TaskMaster Pro: Project management for small teams. Save time and collaborate better.
```

**Too Long (125 chars):**
```
TaskMaster Pro is an innovative project management platform designed to help small business owners save time and improve team collaboration.
```

**Perfect (105 chars):**
```
TaskMaster Pro: Project management built for small teams. Save 10+ hours/week. Start free trial today.
```

**Validation:**
- Character counter in real-time
- Color-coded: Green (100-110), Orange (95-100 or 110-115), Red (outside range)
- Auto-retry up to 3 times if outside range

---

#### Persona Writing System Enhancements

**Advanced Persona Definition:**

Beyond basic tone, users can define complete personas:

**Persona Components:**
1. **Role**: "Marketing Director", "CEO", "Customer Service Rep"
2. **Experience Level**: Junior, Mid-level, Senior, Expert
3. **Communication Style**: Formal, Casual, Technical, Simplified
4. **Vocabulary Preferences**: Industry jargon, Plain English, Academic
5. **Audience Relationship**: Authority, Peer, Service Provider
6. **Emotional State**: Urgent, Calm, Excited, Concerned

**Persona Presets:**

**1. Tech CEO (Thought Leader)**
```
- Role: CEO / Founder
- Voice: Visionary, confident, data-driven
- Vocabulary: Business + tech jargon blend
- Sentence Style: Bold, declarative statements
- Examples: "We're redefining X", "The data shows Y"
```

**2. Customer Success Rep**
```
- Role: Support / Success
- Voice: Helpful, patient, empathetic
- Vocabulary: Plain English, no jargon
- Sentence Style: Question-oriented, supportive
- Examples: "Let me help you with that", "Have you tried X?"
```

**3. Technical Writer**
```
- Role: Documentation / Technical
- Voice: Precise, methodical, clear
- Vocabulary: Technical but explained
- Sentence Style: Step-by-step, instructional
- Examples: "First, configure X", "Note: Y is required"
```

**4. Sales Executive**
```
- Role: Sales / Business Development
- Voice: Persuasive, benefit-focused, urgent
- Vocabulary: ROI, value prop, competitive
- Sentence Style: Benefit-driven, action-oriented
- Examples: "Imagine if you could X", "Don't miss out on Y"
```

**Persona Application:**
- Select from presets or create custom
- Override base tone settings
- Affects word choice, sentence structure, examples used
- Consistent across all generated content

---

#### AI Model Settings (Advanced)

**OpenAI vs DeepSeek Configuration:**

**Model-Specific Parameters:**

**OpenAI Models (GPT-4o, GPT-4 Turbo):**
```json
{
  "temperature": 0.7,
  "top_p": 0.9,
  "frequency_penalty": 0.3,
  "presence_penalty": 0.1,
  "max_tokens": 4096
}
```

**DeepSeek V3:**
```json
{
  "temperature": 0.8,
  "top_p": 0.85,
  "max_tokens": 8192
}
```

**Parameter Explanations:**

**Temperature (0.0 - 2.0):**
- **0.0-0.3**: Deterministic, consistent (technical writing, facts)
- **0.4-0.7**: Balanced creativity (marketing copy, blogs)
- **0.8-1.2**: Creative, varied (storytelling, brainstorming)
- **1.3-2.0**: Highly experimental (not recommended for production)

**Top P (0.0 - 1.0):**
- **0.9-1.0**: Full vocabulary range (creative writing)
- **0.7-0.9**: Focused but flexible (most content)
- **0.5-0.7**: Very focused (technical, precise)

**Frequency Penalty (0.0 - 2.0):**
- **0.0**: No penalty (may repeat phrases)
- **0.3-0.6**: Reduces repetition (recommended)
- **0.7-2.0**: Strong diversity (may lose coherence)

**Presence Penalty (0.0 - 2.0):**
- **0.0**: No penalty (may stick to topics)
- **0.1-0.3**: Encourages new topics (recommended)
- **0.4-2.0**: Forces topic diversity (may lose focus)

**Use Cases by Configuration:**

**Creative Marketing (High Variation):**
```
Temperature: 0.9
Top P: 0.95
Frequency Penalty: 0.5
Result: Unique, creative, varied phrasing
```

**Technical Documentation (Consistency):**
```
Temperature: 0.3
Top P: 0.8
Frequency Penalty: 0.2
Result: Precise, consistent, clear
```

**Sales Copy (Persuasive Balance):**
```
Temperature: 0.7
Top P: 0.9
Frequency Penalty: 0.4
Result: Compelling, varied, benefit-focused
```

**Model Selection Best Practices:**

**Use GPT-4o when:**
- High-stakes content (landing pages, sales materials)
- Complex reasoning needed
- Nuanced tone critical
- Latest capabilities desired

**Use GPT-4 Turbo when:**
- Fast generation needed
- Bulk content production
- Balanced cost/quality
- Standard use cases

**Use DeepSeek V3 when:**
- Budget-constrained projects
- High-volume generation
- Testing/experimentation
- Non-critical content

**Cost Comparison:**
- DeepSeek V3: $0.27 per 1M tokens (cheapest)
- GPT-4 Turbo: ~$10 per 1M tokens (mid-range)
- GPT-4o: ~$15 per 1M tokens (premium)

---


#### 2.1.3 Additional Features

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

### 4.12 Location Restoration (Session Persistence)

**Purpose:** The app automatically remembers where you were and restores your exact location when you refresh the page or return to the app.

**What Gets Restored:**

1. **Dashboard Tabs:**
   - Sessions
   - Templates
   - Saved Outputs
   - Token Usage
   - The last active tab is automatically restored when you return

2. **Copy Maker Mode:**
   - Quick Mode
   - Standard Mode
   - Advanced Mode
   - Your selected mode is preserved across sessions

**How It Works:**
- Every time you switch tabs in the Dashboard or change modes in Copy Maker, your preference is saved locally
- When you refresh the page or log back in, the app automatically navigates to your last location
- This works even if you close the browser and come back days later

**Example Scenarios:**

1. **Dashboard Token Usage:**
   - You're viewing Token Usage on the Dashboard
   - You refresh the page → You're back on Token Usage tab
   - You close and reopen the browser → Still on Token Usage tab

2. **Copy Maker Advanced Mode:**
   - You're working in Advanced Mode in Copy Maker
   - You refresh the page → Advanced Mode is still active
   - You navigate away and come back → Advanced Mode is restored

3. **Cross-Session Persistence:**
   - Monday: You're on Dashboard viewing Templates
   - Tuesday: You log back in → Automatically opens to Templates tab
   - You switch to Copy Maker in Quick Mode
   - Wednesday: You log back in → Opens Copy Maker with Quick Mode active

**Technical Details:**
- Uses browser localStorage for persistence
- No server-side storage required
- Works independently for each browser/device
- Survives browser restarts and system reboots

**Privacy Note:**
- All location data is stored locally in your browser
- No location data is sent to servers
- Clearing browser data will reset your saved locations

---


### 2.2 Brand Voice System

The Brand Voice System captures your brand's unique personality and writing style for consistent content generation.

### What Is the Brand Voice System?

The Brand Voice System is CopyZap's advanced feature for defining, storing, and reusing consistent brand voices across all content generation. Think of it as your brand's "personality profile" that ensures every piece of content sounds authentically "you."

**Key Innovation:** Unlike generic "tone" selection, Brand Voices capture nuanced writing patterns, constraints, style preferences, and advanced formatting rules that make your content uniquely recognizable.

### "Save as Brand Voice" Workflow

**Purpose:** Convert successful generated outputs into reusable Brand Voice profiles

**How It Works:**

1. **Generate Great Copy**
   - Create content using Copy Maker
   - Generate output that perfectly matches desired brand voice
   - Review and confirm it's exactly what you want

2. **Extract Voice Pattern**
   - Click "Save as Brand Voice" button on output card
   - AI analyzes the output's characteristics:
     - Sentence patterns and length distribution
     - Vocabulary complexity and word choices
     - Tone markers (formal, casual, etc.)
     - Punctuation style (em dashes, semicolons, exclamation points)
     - Paragraph structure
     - Use of questions, lists, examples
     - Emotional arc (how enthusiasm/urgency builds)

3. **Review Extracted Profile**
   - System presents detected characteristics
   - Shows example phrases that define the voice
   - Identifies key patterns:
     ```
     Detected Patterns:
     - Average sentence length: 15 words
     - Questions per 100 words: 2-3
     - Use of contractions: Frequent
     - Exclamation points: Moderate (1-2 per paragraph)
     - Technical terms: Explained in parentheses
     - Story elements: Present (personal examples)
     ```

4. **Name and Save**
   - Assign descriptive name: "Friendly Tech Explainer"
   - Add usage notes: "For blog posts targeting beginners"
   - Link to customer (optional)
   - Save to Brand Voice library

5. **Reuse Across Projects**
   - Select saved voice from dropdown
   - All future content matches this pattern
   - Consistent brand voice maintained

**Benefits:**
- Learn from your best content
- Capture successful voice patterns
- Scale consistent voice across team
- No manual profile configuration needed
- Voice evolves as you refine content

### Brand Voice Extraction via AI Analysis

**Purpose:** Create Brand Voice profiles by analyzing provided text samples

**Input Methods:**

**1. URL Analysis**
- Paste competitor or reference URL
- AI analyzes entire page
- Extracts voice characteristics
- Generates profile automatically

**2. Text Sample Analysis**
- Paste 500+ words of existing content
- AI identifies patterns and style
- Creates voice profile from sample
- Shows confidence score per attribute

**3. Multiple Sample Analysis** (most accurate)
- Provide 3-5 different content samples
- AI identifies consistent patterns
- Filters out one-off variations
- Produces robust, reliable profile

**Analysis Process:**

1. **Text Ingestion**
   - Minimum 500 words recommended
   - Multiple samples preferred
   - Different content types ideal (email, blog, landing page)

2. **Pattern Detection**
   - Sentence structure analysis
   - Vocabulary mapping
   - Tone identification
   - Style markers extraction
   - Formatting preferences

3. **Profile Generation**
   ```json
   {
     "core_traits": {
       "tone": "friendly-professional",
       "formality": 6.5,
       "energy": 7.2,
       "directness": 8.1
     },
     "tone_rules": {
       "base_tone": "friendly",
       "intensity": 65,
       "modifiers": ["conversational", "helpful", "confident"]
     },
     "vocabulary": {
       "complexity_level": "moderate",
       "jargon_usage": "explained",
       "metaphor_frequency": "occasional"
     },
     "sentence_rules": {
       "avg_length": 17,
       "variation": "moderate",
       "question_ratio": 0.08
     },
     "punctuation_style": {
       "em_dashes": "frequent",
       "semicolons": "rare",
       "exclamations": "moderate"
     },
     "formatting_tendencies": {
       "paragraph_length": "short (2-4 sentences)",
       "list_usage": "frequent",
       "bold_emphasis": "key terms only"
     }
   }
   ```

4. **User Review & Adjustment**
   - Review detected characteristics
   - Adjust any inaccurate detections
   - Add brand-specific requirements
   - Test profile on sample content

**Example Use Cases:**

**Match Competitor Voice:**
```
Input: Competitor's high-performing landing page
Output: Brand Voice profile matching their successful style
Use: Create content that resonates with same audience
```

**Replicate Historical Success:**
```
Input: Your highest-converting email from 2 years ago
Output: Profile capturing what made it successful
Use: Apply that voice to current campaigns
```

**Standardize Team Output:**
```
Input: Content from your best-performing writer
Output: Profile codifying their style
Use: Help entire team match that quality
```

### Updated Brand Voice Data Model

**Core Traits (Quantified 0-10):**

1. **Warmth** (0 = clinical, 10 = extremely warm)
   - How friendly and approachable?
   - Use of personal pronouns
   - Empathy expressions

2. **Directness** (0 = flowery, 10 = blunt)
   - Gets to the point?
   - Sentence efficiency
   - Filler word usage

3. **Complexity** (0 = elementary, 10 = academic)
   - Vocabulary sophistication
   - Sentence structure complexity
   - Concept abstraction

4. **Pacing** (0 = leisurely, 10 = urgent)
   - Sentence rhythm
   - Action verb density
   - Urgency markers

5. **Formality** (0 = slang/casual, 10 = corporate formal)
   - Contraction usage
   - Colloquialisms
   - Professional terminology

6. **Metaphor Density** (0 = literal, 10 = highly figurative)
   - Analogies per 100 words
   - Descriptive language
   - Abstract comparisons

**Tone Rules:**
```typescript
interface ToneRules {
  base_tone: 'professional' | 'friendly' | 'bold' | 'minimalist' | 'creative' | 'persuasive';
  intensity: number; // 0-100
  modifiers: string[]; // ["conversational", "empathetic", "data-driven"]
  avoid: string[]; // ["aggressive", "condescending", "vague"]
}
```

**Vocabulary Preferences:**
```typescript
interface VocabularyPrefs {
  complexity_level: 'simple' | 'moderate' | 'advanced' | 'expert';
  domain_terms: string[]; // Industry-specific vocabulary to use
  preferred_synonyms: Map<string, string[]>; // "buy" → ["invest in", "get", "acquire"]
  avoid_terms: string[]; // Taboo words
  brand_terms: string[]; // Proprietary terms, product names
}
```

**Taboo Words (Excluded Terms):**
- Blacklist of words never to use
- Common for luxury brands: "cheap", "budget", "discount"
- Professional services: "easy", "simple", "just" (can sound condescending)
- Inclusive language: gender-specific terms, ableist language

**Sentence Rules:**
```typescript
interface SentenceRules {
  avg_length: number; // 12-25 typical
  min_length: number;
  max_length: number;
  variation: 'low' | 'moderate' | 'high'; // How much variety
  question_ratio: number; // 0.05 = 5% of sentences are questions
  active_voice_preference: number; // 0-100, how strongly to avoid passive
}
```

**Punctuation Rules:**
```typescript
interface PunctuationRules {
  em_dashes: 'never' | 'rare' | 'moderate' | 'frequent';
  semicolons: 'never' | 'rare' | 'moderate' | 'frequent';
  exclamations: 'never' | 'rare' | 'moderate' | 'frequent';
  oxford_comma: boolean;
  parenthetical_asides: 'never' | 'rare' | 'moderate' | 'frequent';
  ellipses: 'never' | 'rare' | 'moderate' | 'frequent';
}
```

**Emotional Arc Patterns:**
```typescript
interface EmotionalArc {
  opening: 'calm' | 'energetic' | 'provocative' | 'empathetic';
  middle: 'building' | 'steady' | 'fluctuating';
  closing: 'urgent' | 'inspiring' | 'reassuring' | 'direct';
  peak_placement: 'early' | 'middle' | 'end'; // Where excitement peaks
}
```

**Formatting Tendencies:**
```typescript
interface FormattingTendencies {
  paragraph_length: 'very short (1-2)' | 'short (2-4)' | 'medium (4-6)' | 'long (6+)';
  list_usage: 'frequent' | 'moderate' | 'rare';
  bold_for: 'key terms' | 'emphasis' | 'structure' | 'rarely';
  italics_for: 'emphasis' | 'technical terms' | 'rarely';
  subheading_frequency: 'every 100 words' | 'every 200 words' | 'sparingly';
}
```

### Fine-Grained Voice Strength Controls

**Voice Strength Slider (0-100):**

Unlike the simple "Tone Level" slider, Voice Strength controls how aggressively to enforce ALL voice characteristics:

**0-30: Subtle Influence**
- Voice serves as gentle guide
- Natural writing takes priority
- Characteristics suggest, don't dictate
- Use for: First drafts, brainstorming

**40-60: Balanced Application**
- Voice characteristics clearly present
- Still allows natural variation
- Most common setting
- Use for: Standard content creation

**70-85: Strong Enforcement**
- Voice characteristics prominently applied
- Overrides some natural flow for consistency
- Limited variation allowed
- Use for: Brand-critical content, team standardization

**90-100: Absolute Adherence**
- Every rule strictly followed
- Minimal deviation
- May sacrifice some flow for consistency
- Use for: Legal compliance, regulated industries

**Per-Characteristic Strength:**

Advanced users can set individual strength levels:

```typescript
{
  warmth: { value: 8, strength: 70 },     // Apply warmth strongly
  directness: { value: 6, strength: 40 }, // Apply directness subtly
  complexity: { value: 4, strength: 90 }, // Strictly enforce simplicity
  pacing: { value: 7, strength: 50 },     // Moderate urgency application
  formality: { value: 5, strength: 60 }   // Clear but not rigid formality
}
```

This allows fine-tuning like:
- "Be very warm (8/10) but don't force it (strength: 40)"
- "Maintain simple vocabulary (3/10) strictly (strength: 95)"
- "Moderate formality (5/10) with flexible application (strength: 50)"

### Brand Voice vs Tone vs Persona

**Clarifying the Differences:**

**Tone:**
- **What**: Overall emotional character
- **Examples**: Professional, Friendly, Bold
- **Scope**: Broad, high-level feeling
- **Application**: Set before generation
- **Flexibility**: Changes per project
- **Use When**: Starting point for voice

**Brand Voice:**
- **What**: Complete writing system
- **Examples**: "Tech Startup - Conversational Expert"
- **Scope**: Comprehensive (20+ attributes)
- **Application**: Profile loaded, affects everything
- **Flexibility**: Consistent across all content
- **Use When**: Established brand with defined style

**Persona:**
- **What**: Specific person's writing style
- **Examples**: "Steve Jobs", "Marie Forleo", "Donald Miller"
- **Scope**: Mimics individual communicator
- **Application**: Post-generation transformation
- **Flexibility**: Applied to existing content as filter
- **Use When**: Want recognizable style for specific piece

**Interaction Examples:**

**Example 1: Tone Only**
```
Settings: Tone = Friendly
Result: Warm, approachable language
Consistency: Basic
```

**Example 2: Brand Voice**
```
Settings: Brand Voice = "SaaS Friendly Expert"
  - Warmth: 7/10
  - Directness: 8/10
  - Complexity: 4/10 (simple)
  - Sentence avg: 14 words
  - Questions: 8% of sentences
  - Metaphors: Rare
  - Lists: Frequent
Result: Consistently warm, direct, simple, question-oriented, list-heavy
Consistency: High
```

**Example 3: Tone + Brand Voice + Persona**
```
Settings:
  - Tone: Professional (baseline)
  - Brand Voice: "B2B Authority" (modifies tone)
  - Persona: "Simon Sinek" (post-generation style)

Process:
  1. Tone sets professional baseline
  2. Brand Voice adds specific rules (data-driven, benefit-focused)
  3. Content generated
  4. Persona transformation adds Sinek patterns (why-focused, inspirational)

Result: Professional + B2B rules + Sinek's inspirational why-driven style
```

### Customer Management Integration

**Linking Voices to Customers:**

**Customer Profile Structure:**
```typescript
interface Customer {
  id: string;
  name: string;
  industry: string;
  default_brand_voice_id: string; // Auto-load this voice
  alternate_voices: string[]; // Additional voices for different content types
  notes: string;
  brand_guidelines_url: string;
}
```

**Auto-Voice-Loading Workflow:**

1. **User selects customer** from dropdown in Copy Maker
2. **System detects** customer has default Brand Voice
3. **Auto-loads voice** without user interaction
4. **Visual indicator** shows which voice is active
5. **All generation** uses that voice until customer changes

**Multiple Voices Per Customer:**

Agencies can define voice variations:

```
Client: TechStartup Inc.
├─ Brand Voice: "Landing Pages - Bold"
├─ Brand Voice: "Blog Posts - Friendly Expert"
├─ Brand Voice: "Email - Conversational"
├─ Brand Voice: "Whitepaper - Professional Authority"
└─ Brand Voice: "Social Media - Playful"
```

**Selection Logic:**
- Customer selected → Default voice loads
- User can manually switch to alternate voice
- Voice persists for session
- Next project → Default voice reloads

**Benefits:**
- Zero-setup content creation
- Guaranteed brand consistency
- Client-specific voice management
- Easy switching between clients
- Audit trail (which voice used when)

---

### Core Components

#### 1. Voice Name & Description
- **Name:** Internal identifier (e.g., "Vienna Tech Professional")
- **Description:** Purpose and use case (e.g., "For B2B tech content targeting German-speaking professionals")

#### 2. Core Voice Attributes
- **Tone:** Professional, Friendly, Bold, etc.
- **Tone Level:** 1-10 intensity
- **Language:** Primary language for content
- **Formality:** Casual to Very Formal (5 levels)
- **Sentence Structure:** Simple to Complex (5 levels)

#### 3. Advanced Style Controls
- **Paragraph Length:** Very Short to Very Long
- **Use of Questions:** Never to Very Frequently
- **Use of Lists:** Never to Very Frequently
- **Metaphor/Analogy Use:** Never to Very Frequently
- **Jargon Level:** None to Heavy Technical
- **Humor Level:** None to Frequent
- **Storytelling:** Minimal to Story-Heavy
- **Active vs Passive Voice:** Prefer Active to Prefer Passive
- **Personal Pronouns:** None to Heavy Use

#### 4. Formatting Preferences
- **Sentence Length:** Very Short (<10 words) to Long (>25 words)
- **Exclamation Marks:** Never to Frequent
- **Bold/Italics:** None to Generous
- **Numbers vs Words:** "10" vs "ten"

#### 5. Special Instructions
- Custom constraints and requirements
- Brand-specific rules
- Regional considerations
- Cultural references

### Brand Voice Presets

**Professional Tech:**
- Tone: Professional (Level 5)
- Formality: Formal
- Sentence Structure: Complex
- Paragraph Length: Medium
- Questions: Occasionally
- Lists: Frequently
- Metaphors: Occasionally
- Jargon: Moderate

**Friendly Conversational:**
- Tone: Friendly (Level 7)
- Formality: Informal
- Sentence Structure: Simple
- Paragraph Length: Short
- Questions: Frequently
- Lists: Occasionally
- Metaphors: Frequently
- Jargon: Minimal

**Bold & Direct:**
- Tone: Bold (Level 8)
- Formality: Casual
- Sentence Structure: Simple
- Paragraph Length: Very Short
- Questions: Occasionally
- Lists: Frequently
- Metaphors: Rarely
- Jargon: Minimal

**Luxury Brand:**
- Tone: Sophisticate (Level 4)
- Formality: Very Formal
- Sentence Structure: Complex
- Paragraph Length: Medium
- Questions: Rarely
- Lists: Rarely
- Metaphors: Occasionally
- Jargon: Minimal

### Creating Custom Brand Voices

**Step 1: Define Core Identity**
1. Name your voice descriptively
2. Write clear description
3. Select primary tone
4. Set formality level
5. Choose sentence complexity

**Step 2: Configure Advanced Controls**
1. Adjust paragraph preferences
2. Set question frequency
3. Configure list usage
4. Define metaphor level
5. Set jargon tolerance

**Step 3: Add Special Instructions**
- Brand-specific rules
- Cultural considerations
- Formatting requirements
- Prohibited terms

**Step 4: Test & Refine**
1. Generate sample content
2. Review voice consistency
3. Adjust controls as needed
4. Regenerate and compare
5. Save when satisfied

### Using Brand Voices

**In Main Form:**
1. Select "Brand Voice" dropdown
2. Choose saved voice
3. All voice settings apply automatically
4. Override individual settings if needed
5. Generate content

**In Templates:**
- Save templates with specific brand voices
- Voice loads automatically with template
- Ensures consistency across projects

**In Quick Prompt Wizard:**
- Step 4 asks for brand voice selection
- Applies voice to wizard recommendations
- Wizard respects voice constraints

### Brand Voice vs. Voice Styles

**Brand Voice (Identity):**
- Defines WHO you are
- Consistent across all content
- Your authentic voice
- Applied at generation time
- Captured in templates

**Voice Styles (Transformation):**
- Applies persona AFTER generation
- Temporary stylistic variation
- Testing different approaches
- Alex Hormozi, Seth Godin, etc.

**Example Workflow:**
```
1. Generate with "Vienna Professional" brand voice
2. Review base content
3. Test "Alex Hormozi" voice style on copy
4. Compare brand voice vs styled version
5. Choose best for context
```

### URL-Based Brand Voice Extraction

**Feature:** Analyze any website to extract their brand voice automatically.

**How It Works:**
1. Click "Extract Brand Voice from URL"
2. Enter competitor or inspiration URL
3. AI analyzes writing patterns
4. Extracts tone, formality, style preferences
5. Suggests brand voice configuration
6. Save as new brand voice or adjust

**Use Cases:**
- Competitive analysis (match competitor voice)
- Inspiration (adapt admired brand voice)
- Consistency check (analyze your own site)
- Voice evolution (compare current vs past)

**What Gets Extracted:**
- Tone and tone level
- Formality assessment
- Sentence complexity patterns
- Paragraph length preferences
- Question frequency
- List usage patterns
- Metaphor/analogy frequency
- Jargon level
- Humor presence
- Storytelling approach

---


### 2.3 Templates & Customer Management

### Saved Templates Architecture

**Purpose:** Save complete form configurations for reuse

**What Gets Saved:**
- All input field values
- AI model selection
- Tone and tone level
- Output structure configuration
- All feature toggles (SEO, GEO, etc.)
- Special instructions
- Brand voice association
- Customer assignment

**What Doesn't Get Saved:**
- Generated outputs (separate system)
- Temporary wizard state
- Session-specific data

### Template Types

**1. Personal Templates**
- Created by individual users
- Private to creator
- Unlimited quantity
- Fully customizable

**2. Customer-Linked Templates**
- Associated with specific customer/project
- Filtered by customer selection
- Organized under customer name
- Maintains brand consistency

**3. Quick Start Templates**
- Pre-built by system
- Available to all users
- Cover common use cases
- Read-only (can clone and modify)

### Template Management Features

**Creating Templates:**
1. Configure form with desired settings
2. Click "Save as Template"
3. Enter template name (required)
4. Add description (optional)
5. Select customer association (optional)
6. Click Save
7. Template immediately available in dropdown

**Loading Templates:**
1. Click "Load Template" dropdown
2. Browse or search templates
3. Filter by customer if needed
4. Click template name
5. Form populates instantly
6. Sparkle indicators show auto-filled fields

**Smart Template Loading (v6.16):**

When a template loads, the system provides intelligent feedback and assistance:

1. **Field Count Display**
   - Toast notification shows: "Template loaded: N fields."
   - Helps you understand template complexity
   - Confirms successful load operation

2. **Mode Compatibility Check**
   - Detects if current mode hides populated template fields
   - Shows warning: "Some fields in this template are hidden in [Mode] mode."
   - Suggests minimum required mode to see all fields
   - Provides one-click mode switch button

3. **Smart Section Expansion**
   - Automatically expands ONLY sections with populated fields
   - Other sections remain collapsed for clean interface
   - Saves time scrolling through empty sections
   - Focuses attention on relevant content

4. **Field Animation**
   - Newly populated fields flash briefly (300ms)
   - Visual highlight helps identify changed fields
   - Subtle blue background fade effect
   - Works across all field types

**Example Template Loading Flow:**
```
1. User selects "Product Launch Email" template (in Quick mode)
2. Toast: "Template loaded: 12 fields."
3. Warning: "Some fields hidden in Quick mode. Switch to Standard?"
4. [Switch to Standard] button appears in toast
5. User clicks - mode switches, all fields visible
6. Sections auto-expand: "What You're Creating", "Strategic Messaging"
7. Populated fields flash briefly to show changes
```

**Editing Templates:**
1. Load template into form
2. Modify any fields
3. Click "Save" (overwrites existing)
4. Or "Save As" (creates new template)
5. Confirmation toast appears

**Deleting Templates:**
1. Open template manager
2. Find template in list
3. Click delete icon
4. Confirm deletion
5. Template removed from all dropdowns

**Template Metadata:**
- Creation date
- Last modified date
- Usage count (tracks how often loaded)
- Creator user ID
- Associated customer
- Template category (optional tag)

### Customer Management System

**Customer Profiles:**

Each customer record contains:
- **Name**: Company or client name
- **Website**: Optional URL
- **Industry**: Dropdown selection
- **Contact Info**: Email, phone
- **Notes**: Internal notes about client
- **Brand Guidelines**: Link or document
- **Active Status**: Active/Inactive toggle
- **Created Date**: When added to system

**Customer Dashboard:**
- List view of all customers
- Search and filter capabilities
- Sort by name, date, status
- Quick actions: Edit, Delete, View Templates

**Customer-Template Relationship:**
- One customer can have multiple templates
- Templates filtered by customer selection
- "All Customers" shows all templates
- Customer dropdown appears in template selector
- Color-coded or icon-based customer indicators

### Template Organization Best Practices

**Naming Conventions:**
```
[Content Type] - [Use Case] - [Tone]
Examples:
- Landing Page - SaaS Product - Professional
- Blog Post - SEO Guide - Friendly
- Email - Newsletter Signup - Persuasive
- Product Desc - E-commerce - Minimalist
```

**Description Guidelines:**
- Include when to use template
- Note any special requirements
- Reference successful uses
- Document any quirks or tips

**Example:**
```
Name: Landing Page - B2B SaaS - Professional
Description: Use for enterprise software landing pages.
Includes SEO optimization, benefit-focused structure,
and trust-building elements. Works best for 300-500 word
hero sections. Proven 35% conversion lift in A/B tests.
```

### Template Categories & Tags

**Content Type Categories:**
- Landing Pages
- Blog Posts
- Product Descriptions
- Emails
- Social Media
- Ad Copy
- Case Studies
- White Papers
- Press Releases

**Use Case Tags:**
- New Content Creation
- Content Improvement
- SEO Optimization
- A/B Testing
- Seasonal Campaigns
- Industry-Specific

**Filtering System:**
- Filter by category
- Filter by customer
- Filter by tags
- Search by name/description
- Sort by date, usage, name

### Prefills System (Advanced)

**Purpose:** Save specific field values for reuse without full template

**Use Cases:**
- Common target audiences
- Frequently used pain points
- Standard SEO keywords for industry
- Repeated special instructions
- Go-to excluded terms lists

**Prefill Types:**
1. **Target Audience Prefills**
   - Pre-written audience descriptions
   - Quick-select from dropdown
   - Edit before applying

2. **Pain Points Prefills**
   - Common customer problems
   - Industry-specific challenges
   - Reusable problem statements

3. **Keywords Prefills**
   - SEO keyword sets by topic
   - Industry standard terms
   - Competitor keyword lists

4. **Special Instructions Prefills**
   - Brand voice guidelines
   - Compliance requirements
   - Standard formatting rules

**Prefill Management:**
- Create from current field value
- Name and categorize
- Edit existing prefills
- Delete unused prefills
- Share between templates

**Prefill vs Template:**
- **Prefill**: Single field value, quick insert
- **Template**: Complete form configuration, full setup

### Database Schema

**templates table:**
```sql
CREATE TABLE templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  customer_id UUID REFERENCES customers,
  name TEXT NOT NULL,
  description TEXT,
  config JSONB NOT NULL,
  category TEXT,
  tags TEXT[],
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**customers table:**
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  brand_guidelines_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**prefills table:**
```sql
CREATE TABLE prefills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  customer_id UUID REFERENCES customers,
  name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  value TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### Template Import/Export

**Export Features:**
- Export single template as JSON
- Export all templates for backup
- Export customer-specific templates
- Include or exclude metadata

**Import Features:**
- Import single JSON template
- Bulk import multiple templates
- Validate JSON structure
- Handle conflicts (skip, overwrite, rename)
- Preview before importing

**JSON Structure:**
```json
{
  "name": "Landing Page - SaaS",
  "description": "Professional SaaS landing page template",
  "config": {
    "projectDescription": "...",
    "targetAudience": "...",
    "tone": "professional",
    "toneLevel": 7,
    "wordCount": 300,
    ...
  },
  "category": "Landing Pages",
  "tags": ["SaaS", "B2B", "Professional"]
}
```

### Usage Analytics

**Template Performance Tracking:**
- Usage count per template
- Last used timestamp
- Success rate (if tracking conversions)
- Average output satisfaction score
- Most popular templates dashboard

**Insights:**
- Which templates generate best results
- Underutilized templates (consider archiving)
- Template usage trends over time
- Customer-specific template performance

---


### 2.4 Special Instructions Library

### Formatting & Structure

```
"Maximum 3 sentences per paragraph. Use bullet points for feature lists. Bold all product names on first mention."

"Start each section with provocative question. Include subheading every 150 words. End with clear CTA."

"Use numbered lists for steps. Bullet points for benefits. Tables for comparisons."

"Very short paragraphs (2-3 sentences max). Mobile-first formatting. Single-column layout."

"Include TL;DR at top. Use expandable sections. Add visual break every 200 words."
```

### Tone & Voice

```
"Conversational but professional - like trusted advisor, not corporation."

"Bold and direct. No fluff. Every sentence must add value. Cut unnecessary words."

"Warm and empathetic. Use inclusive language. Focus on emotional connection."

"Technical but accessible. Explain jargon when first used. Assume intermediate knowledge."

"Playful with occasional humor. Use metaphors. Make complex ideas simple through analogies."
```

### Language & Dialect

```
"Use British English spelling throughout. Favour, colour, organisation, etc."

"Use Viennese dialect naturally where appropriate. Reference local culture and landmarks."

"Canadian English. Multicultural references. Bilingual sensitivity (English/French)."

"Use American English. Direct and informal. Contractions encouraged."
```

### Constraints & Avoidances

```
"Avoid all superlatives (best, greatest, ultimate, perfect). Use specific claims only."

"No jargon. Explain technical terms simply. Write for non-technical audience."

"Never use passive voice. Always active, direct statements."

"Avoid corporate speak (synergy, leverage, paradigm). Use plain language."

"No hype or marketing fluff. Fact-based only. Include specific metrics."
```

### Content Requirements

```
"Include one compelling statistic or metric in each section."

"Reference real customer stories. Use specific examples, not generic scenarios."

"Add social proof in every section (testimonials, case studies, usage stats)."

"Include comparison to alternatives. Address objections proactively."

"Mention price or ROI in every benefits section."
```

### SEO & Keywords

```
"Primary keyword 'project management' must appear in first paragraph and H1. Natural integration only."

"Include keyword variations: 'task tracking', 'team coordination', 'deadline management'. Don't force."

"Target keyword density 1-2%. Prioritize readability over keyword stuffing."
```

### Call-to-Actions

```
"End every section with micro-CTA. Final section has primary CTA. Low-pressure approach."

"Multiple CTA options: Free trial, demo, consultation. Let user choose engagement level."

"No aggressive CTAs. Suggest next steps rather than demanding action."
```

### Industry-Specific

**SaaS:**
```
"Focus on ROI and time savings. Include trial info. Emphasize ease of implementation."
```

**E-commerce:**
```
"Use sensory language. Benefits before features. Address shipping/returns. Include urgency naturally."
```

**Healthcare:**
```
"Empathetic and caring tone. HIPAA compliance mentions. Patient-first language. Trust-building focus."
```

**Financial Services:**
```
"Security and trust emphasis. Regulatory compliance mentions. Conservative tone. Data protection highlighted."
```

**Professional Services:**
```
"Expertise demonstrated through insights. Thought leadership angle. Case study references."
```

---

### 2.16 Copy Snap

**Copy Snap** is a lightweight, instant AI tool for quick content tasks. Unlike Copy Maker (which is comprehensive and project-focused), Copy Snap is designed for fast, on-the-fly improvements and generation when you need results in seconds.

#### Overview

Copy Snap operates on a simple input → output model with three distinct modes:
1. **Improve** - Polish and enhance existing text
2. **Reply** - Generate context-aware responses
3. **Questions** - Create strategic questions from content

**Access:** Copy Snap has its own dedicated page accessible via the yellow "Copy Snap" button in the main navigation.

#### Key Characteristics

- **Speed-focused:** Optimized for instant results (typically 3-5 seconds)
- **Minimal configuration:** No project setup, templates, or complex settings
- **Standalone tool:** Operates independently from Copy Maker sessions
- **DeepSeek-powered:** Uses DeepSeek V3 for cost-effective, high-quality output
- **Credits-tracked:** All generations consume credits like other AI operations

#### Mode 1: Improve

Transform rough text into polished, professional copy.

**Use cases:**
- Quick edits to drafts
- Cleaning up rough notes
- Improving clarity of existing content
- Professional tone adjustment
- Grammar and style refinement

**Controls:**
- **Goal:** Clearer, Persuasive, Shorter, Punchier
- **Platform:** General, X (Twitter), LinkedIn, Email
- **Length:** Short, Same, Longer

**Output Structure:**
- 1 best version (primary improved text)
- Exactly 2 alternatives
- Exactly 3 tips/notes (improvement suggestions)

**How it works:**
1. Paste your text (up to 2000 characters)
2. Select goal, platform, and length preferences
3. Click "Generate"
4. Get improved version with alternatives and tips
5. Copy result with one click

**Example Input:**
```
our product helps teams work better its really good for communication and stuff
```

**Example Output:**
```
Our solution empowers teams to collaborate more effectively through streamlined communication and enhanced coordination.
```

#### Mode 2: Answer

Generate contextual responses to messages, comments, or feedback.

**Use cases:**
- Replying to customer messages
- Responding to social media comments
- Crafting professional email responses
- Addressing feedback or reviews
- Quick conversational replies

**Controls:**
- **Reply Style:** Helpful, Friendly, Confident, Witty, Direct
- **Stance:** Neutral, Agree, Disagree
- **Length:** Short (1-2 sentences), Medium (2-4 sentences), Long (4-6 sentences)

**Output Structure:**
- 1 best reply (primary response)
- Exactly 2 alternatives

**How it works:**
1. Paste the message you need to reply to
2. Select style, stance, and length preferences
3. Click "Generate"
4. Get a professional, context-aware response with alternatives
5. Edit if needed and use

**Example Input:**
```
"Your pricing seems high compared to competitors. Why should we choose you?"
```

**Example Output:**
```
"Great question! While our pricing reflects the premium value we deliver, many clients find we actually reduce their total costs through improved efficiency and fewer support needs. We'd love to show you a detailed ROI breakdown specific to your use case - can we schedule a quick call?"
```

##### ANSWER Mode Enhanced Engine (v2)

**Last Updated:** 2026-01-28

Copy Snap ANSWER mode now uses an enhanced generation engine with strict guardrails and quality validation, matching the production-quality standards of IMPROVE v2.

**What Changed (Internal Only):**
- Sophisticated guardrail system for all option combinations
- Strict priority order: Platform norms > Length > Reply Style > Stance
- Comprehensive validation with automatic fallback
- No UI changes - all improvements are internal

**Key Quality Improvements:**

**1. Length Enforcement (Strict)**
- **Short (1-2 sentences):** Maximum 2 sentences, maximum 1 question
- **Medium (2-4 sentences):** Maximum 4 sentences, maximum 1 question preferred
- **Long (4-6 sentences):** Maximum 6 sentences, maximum 2 questions, MUST include concrete insight

**2. Reply Style Refinements**
- **Helpful:** Must add ONE concrete idea, no filler, no multiple tips
- **Friendly:** Warm tone, MAX ONE emoji, never combine multiple emojis, no sarcasm
- **Confident:** Clear and assertive, avoids sounding dismissive, softening clause required for Disagree
- **Witty:** Clever and light, NEVER sarcastic, humor ONLY in first sentence for Long length
- **Direct:** Concise, no emojis, minimal adjectives, statements over questions

**3. Stance-Specific Guardrails**

**Neutral:**
- CRITICAL: Does NOT default to questions
- Rotates between 4 strategies: Context/framing, Rephrasing, Observation, or Question
- Never asks multiple questions
- Provides variety across generations

**Agree:**
- MUST add original perspective
- Never just restates the original
- Avoids generic praise like "Totally agree" unless followed by insight

**Disagree:**
- MANDATORY: Starts with acknowledgment or softener
- Approved phrases: "In my experience…", "I've seen cases where…", "I agree in part, but…"
- Disallowed: Absolutist language, "you're wrong" tone, lecture-style
- Confident + Disagree still invites dialogue

**4. Quality Validation**

Before returning a reply, the system validates:
1. Reply is coherent standalone
2. Reply adds value beyond restating original
3. Reply respects selected stance
4. Reply matches selected style
5. Sentence count within bounds
6. Question count within bounds
7. Emoji count ≤ max allowed (if applicable)
8. No markdown formatting
9. Ready to post without editing
10. Semantic overlap with original < 70%

If validation fails, the system automatically:
- Regenerates with stricter constraints (fallback: Helpful + Neutral + Medium)
- Uses GPT-4o for fallback generation
- Notifies user with friendly message

**5. Internal Safety Heuristics**
- Avoids repeated sentence structures
- Avoids repeated CTA/question patterns
- Reduces semantic overlap with original text
- Prefers specificity over general advice
- Never rude, aggressive, or dismissive
- Matches tone and formality of original post

**Example Quality Improvements:**

**Before Enhancement:**
- Long replies could be verbose without substance
- Neutral stance often defaulted to questions
- Witty + Long could have humor throughout (risky)
- Confident + Disagree could feel lecture-like
- Inconsistent emoji usage

**After Enhancement:**
- Long replies have intentional structure with concrete insights
- Neutral provides balanced observations, not just questions
- Witty + Long restricts humor to first sentence only
- Confident + Disagree always includes softening language
- Emoji usage strictly controlled (max 1 if allowed)

**User Benefits:**
- More consistent reply quality across all option combinations
- Better adherence to selected style, stance, and length
- Fewer edge cases requiring regeneration
- Production-ready outputs safe to post without editing
- Improved conversational quality and appropriateness

**Technical Notes:**
- Uses same sophisticated architecture as IMPROVE v2 engine
- Guardrails dynamically configured based on option combinations
- Validation runs on every generation before output
- No performance impact (processing happens server-side)
- Full backward compatibility maintained

#### Mode 3: Questions

Generate strategic questions from any text or topic.

**Controls:**
- **Question Type:**
  - **Clarify** - Questions to better understand the content
  - **Challenge** - Questions that probe deeper or push back
  - **Explore** - Questions that open new angles or perspectives
  - **Convert** - Questions that drive action or decisions
- **Count:** 1, 3, or 5 questions
- **Directness:**
  - **Soft** - Gentle, diplomatic phrasing
  - **Direct** - Straightforward, no-nonsense approach

**Output Structure:**
- Questions array with exactly the number you selected (1, 3, or 5)
- No alternatives or notes in Question mode

**Use cases:**
- Creating FAQ content
- Developing sales questions
- Preparing interview questions
- Generating thought-provoking content
- Building customer discovery questions

**Example Input (Clarify, Soft, 3 questions):**
```
"We offer cloud-based project management for small businesses"
```

**Example Output:**
```json
{
  "questions": [
    "Could you help me understand what makes your solution particularly suited for small businesses?",
    "I'm curious - what size teams typically benefit most from your platform?",
    "Would you mind sharing what kind of projects your tool works best for?"
  ]
}
```

#### Features

**Automatic Language Detection:**
- Copy Snap automatically detects the language of your input text
- **Responds in the same language as your input** - this is critical for multilingual workflows
- No language selection required - works seamlessly with any language
- If input is mixed-language, uses the dominant language
- If language is unclear, defaults to English
- Supports all languages supported by DeepSeek V3 and GPT-4o
- Perfect for multilingual teams and international content
- **Language detection applies to all output:** best version, alternatives, notes, and questions

**Example:**
- Input in Spanish → Output in Spanish
- Input in French → Output in French
- Input in Japanese → Output in Japanese
- Mixed English/Spanish (mostly Spanish) → Output in Spanish

**Human Tone Mode:**
- **What it does:** Makes output sound more natural and conversational (less AI-polished)
- **How to enable:** Check the "Human tone" checkbox below Special Instructions
- **Effect:** Output uses more natural sentence rhythm, concrete language, and avoids corporate/buzzword language
- **Goal:** Content that reads like it was written by a real person in casual professional contexts
- **Platform-aware:** Adapts to selected platform (X = concise/conversational, LinkedIn = professional but personal, Email = natural/direct)
- **Works in all modes:** Improve, Answer, and Questions
- **Language-agnostic:** Works seamlessly in any language

**What Human Tone does NOT do:**
- Does not guarantee "undetectable" or "non-AI" output
- Does not bypass AI detection tools
- Simply adjusts writing style to be more natural and conversational

**Best use cases for Human Tone:**
- Social media posts (X, LinkedIn)
- Email replies
- Conversational content
- Content where authenticity and natural voice matter
- When you want to avoid overly polished or corporate tone

**Character Limit:**
- 2000 characters maximum input
- Prevents excessive token usage
- Real-time character counter with visual feedback
- Warning at 1800+ characters

**One-Click Copy:**
- Copy button appears next to all output
- Visual confirmation on copy ("Copied ✅")
- Works for both improve/reply modes and individual questions

**Live Output:**
- Results appear immediately below the generate button
- JSON formatting automatically handled
- Clear visual separation from input

**Smart Error Handling:**
- Validates input before generation
- Clear error messages if generation fails
- Graceful handling of API issues
- Automatic GPT fallback if needed (see below)

**Intelligent Model Fallback:**
- **Primary Model:** DeepSeek V3 (deepseek-chat) - fast, cost-effective, high-quality
- **Fallback Model:** GPT-4o - automatically used if DeepSeek fails for ANY reason
- **Fallback Triggers (ANY of these trigger automatic fallback to GPT-4o):**
  - DeepSeek API errors or non-200 responses
  - Network timeout or connectivity issues
  - Empty or missing response from DeepSeek
  - Invalid JSON output (after multiple parsing attempts)
  - Parse exceptions or malformed responses
  - Any other DeepSeek failure
- **Validation Before Accepting:** DeepSeek output is validated for parseability BEFORE being accepted
- **Automatic Retry:** If DeepSeek fails, GPT-4o is tried automatically with same settings
- **User Notification:** A small, non-intrusive blue banner appears when fallback is used:
  - Title: "Used GPT-4o (fallback)"
  - Body: "DeepSeek was unavailable, so we generated this with GPT-4o."
- **Transparent Operation:** You always know which model was used
- **Seamless Experience:** Fallback happens automatically without manual intervention
- **Accurate Billing:** Credits are charged based on the ACTUAL model used (DeepSeek or GPT)

**Parse Error Recovery:**
- If both models fail to produce valid JSON, Copy Snap shows the raw output
- Copy raw output button allows you to extract useful content
- Retry button lets you regenerate with one click
- No data is lost - you can always access what the AI produced

**Modify Output (Iterative Refinement):**
- After generating output, a "Modify Output" field appears below the results
- Allows you to iteratively refine the generated content without starting over
- Simply enter modification instructions and click "Apply Modification"
- The AI takes the current "best" output and applies your requested changes
- Clears automatically after each successful modification
- Supports all three modes: Improve, Reply, and Questions

**How it works:**
1. Generate initial output using any Copy Snap mode
2. Review the "Best Output" result
3. Enter modification instructions in the "Modify Output" field
4. Click "Apply Modification" to generate refined version
5. The output updates with the modified version
6. Repeat as needed for iterative refinement

**Example Modification Instructions:**
- "Make it shorter"
- "Add more emotion"
- "Remove the emoji"
- "Make it more casual"
- "Shorten to 100 words"
- "Use simpler language"
- "Add a question at the end"
- "Make it more professional"

**Use cases:**
- Quick refinements without re-entering all inputs
- Testing different tones or styles on the same content
- Gradual improvement through iterative modifications
- Fine-tuning output to match specific requirements
- Experimenting with variations efficiently

**Token Tracking:**
- Modifications are tracked separately under operation type: `copy-snap-modify`
- Credits charged based on the model used (DeepSeek or GPT fallback)
- Typical cost: 200-600 tokens per modification (0.2-0.6 credits with DeepSeek)
- Same fallback system applies (DeepSeek → GPT-4o if needed)

#### Credits & Token Usage

Copy Snap uses DeepSeek V3 by default, making it one of the most cost-effective features:

**Primary Model (DeepSeek V3) Approximate Costs:**
- Improve/Answer: 150-500 tokens (0.15-0.5 credits)
- Questions (3): 200-400 tokens (0.2-0.4 credits)

**Fallback Model (GPT-4o) Approximate Costs:**
- Improve/Answer: 150-500 tokens (0.75-2.5 credits)
- Questions (3): 200-400 tokens (1.0-2.0 credits)

**Token Tracking:**
- All Copy Snap generations are tracked under operation type: `copy-snap`
- Credits are charged based on the **actual model used** (DeepSeek or GPT)
- Fallback usage is clearly indicated in your usage dashboard
- Model used is recorded: `deepseek-chat` or `gpt-4o`

#### Best Practices

**When to use Copy Snap:**
- Quick edits during writing sessions
- Rapid response generation
- Fast question brainstorming
- Testing ideas before full Copy Maker generation
- On-the-fly improvements

**When to use Copy Maker instead:**
- Long-form content (blog posts, landing pages)
- Complex projects requiring context
- Multiple variations needed
- Brand voice consistency required
- Saved templates or workflows

#### Technical Details

**Primary Model:** DeepSeek V3 (deepseek-chat)
- Optimized for speed and cost
- Excellent quality-to-price ratio
- 4000 token output limit
- JSON parsing validation before accepting response

**Fallback Model:** GPT-4o (gpt-4o)
- High reliability and quality
- Excellent JSON compliance
- Automatic fallback on DeepSeek failures
- Used only when needed

**Model Selection Logic:**
1. Try DeepSeek first
2. Validate JSON response
3. If DeepSeek fails or produces invalid JSON → use GPT-4o
4. Track actual model used for accurate billing

**Response Time:**
- DeepSeek: 3-8 seconds typical
- GPT-4o (fallback): 4-10 seconds typical

**Max Input:** 2000 characters
**Max Output:** ~4000 tokens (varies by mode)

**Error Handling:**
- Automatic retry with fallback model
- Raw output display if parsing fails
- Copy and retry options always available

---

### 2.17 Intent Polish

**Intent Polish** is a specialized AI-powered tool designed for rapid, intent-based content refinement. It polishes and optimizes your text based on specific marketing intents (e.g., Social Media Ad, Email Marketing, Landing Page) with full control over audience, goal, tone, and calls to action.

#### Overview

Intent Polish uses preset templates to guide content optimization for specific marketing channels and purposes. Unlike Copy Maker (comprehensive and project-focused) or Copy Snap (quick and lightweight), Intent Polish strikes a balance - providing structured, intent-driven refinement with optional contextual controls.

**Access:** Intent Polish is accessible via the main navigation or Start Hub.

#### Key Characteristics

**Intent-First Approach:**
- Select from predefined marketing intents (Social Media Ad, Email Marketing, Blog Post, etc.)
- Each intent has optimized prompting for its specific use case
- Fields dynamically adjust based on selected intent

**Complete Session Saving:**
- Saves input + ALL generated variants together (like Copy Snap)
- One save action captures the entire working session
- Reload complete sessions from Dashboard with all variants intact

**Flexible Controls:**
- Optional audience targeting
- Goal/outcome specification
- Tone selection
- Call to action customization
- Generate 1-3 variants per session

**Content Type Support:**
- Plain text (default)
- HTML (with structured preservation)

---

#### Core Features

**Intent Presets:**

Intent Polish provides specialized presets for common marketing scenarios:
- **Social Media Ad** - Optimized for social platforms (audience, goal, tone, CTA)
- **Email Marketing** - Email-specific optimization (audience, goal, tone, CTA)
- **Landing Page Copy** - Landing page refinement (audience, goal, tone, CTA)
- **Blog Post** - Blog content enhancement (goal, tone)
- **Product Description** - E-commerce copy (audience, tone, CTA)

Each preset activates relevant fields:
- **Audience** - "Who is this for?" (optional)
- **Goal** - "What is it for / desired outcome?" (optional)
- **Tone** - Tone selection from predefined options (optional)
- **CTA** - Call to action text (optional)

**Multiple Variants:**
- Generate 1, 2, or 3 polished variants per session
- Each variant provides a unique angle or approach
- All variants use the same intent, settings, and context
- Copy individual variants or save the entire session

**Complete Session Saving (NEW):**

Intent Polish now saves complete sessions just like Copy Snap:

**What Gets Saved:**
- Original input text
- All input settings (intent, audience, goal, tone, CTA, variants count)
- ALL generated variants together in one record
- Metadata (intent label, content type, tags)

**How It Works:**
1. Generate variants using any intent preset
2. Review all variants in the results panel
3. Click the "Save Session" button at the top of the results
4. Enter title and description
5. Click "Save" - saves input + all variants as one complete session

**Save Data Structure:**
```javascript
{
  input_data: {
    input_text: string,           // Original text
    content_type: 'plain' | 'html',
    intent_id: string,            // e.g., 'social-media-ad'
    intent_label: string,         // e.g., 'Social Media Ad'
    audience: string,             // Optional
    goal: string,                 // Optional
    tone: string,                 // e.g., 'professional'
    cta: string,                  // Optional
    variants_count: 1 | 2 | 3
  },
  output_data: {
    variants: string[]            // ALL variants saved together
  },
  tags: ['quick-polish', intent_id, content_type]
}
```

**Benefits of Complete Session Saving:**
- No need to save each variant individually
- Reload entire sessions with all variants intact
- Compare all variants side-by-side when reviewing saved outputs
- Consistent with Copy Snap's save behavior
- Faster workflow - one save captures everything

---

#### How to Use Intent Polish

**Step 1: Enter Your Text**
- Paste or type the text you want to polish
- Supports up to ~2000 characters
- Works with plain text or HTML

**Step 2: Select Content Type**
- **Plain Text** - Standard text (default)
- **HTML** - Preserves HTML structure and tags

**Step 3: Choose Your Intent**
- Select the marketing intent that matches your goal
- Read the preset description to understand its focus
- Dynamic fields appear based on your selection

**Step 4: Configure Optional Settings**
- **Audience** (if shown) - Specify target audience
- **Goal** (if shown) - Define desired outcome
- **Tone** (if shown) - Select from predefined tones (Professional, Friendly, Persuasive, etc.)
- **CTA** (if shown) - Enter call-to-action text

**Step 5: Set Variants Count**
- Choose 1, 2, or 3 variants
- More variants = more options to choose from
- Higher credit cost with more variants

**Step 6: Polish**
- Click "Polish" button
- Wait 5-10 seconds for generation
- Review variants in the results panel

**Step 7: Copy or Save**
- **Copy individual variants:** Click "Copy" button on any variant card
- **Save complete session:** Click "Save Session" button at top of results
- Saved sessions include input + all variants together

---

#### Intent Presets Explained

**Social Media Ad:**
- Fields: Audience, Goal, Tone, CTA
- Optimized for: Facebook, Instagram, LinkedIn, Twitter ads
- Focus: Concise, engaging, action-driven copy

**Email Marketing:**
- Fields: Audience, Goal, Tone, CTA
- Optimized for: Marketing emails, newsletters, campaigns
- Focus: Personalization, engagement, conversions

**Landing Page Copy:**
- Fields: Audience, Goal, Tone, CTA
- Optimized for: Landing pages, sales pages
- Focus: Persuasion, clarity, conversion optimization

**Blog Post:**
- Fields: Goal, Tone
- Optimized for: Blog content, articles
- Focus: Readability, engagement, SEO

**Product Description:**
- Fields: Audience, Tone, CTA
- Optimized for: E-commerce, product pages
- Focus: Benefits, features, purchase motivation

---

#### Tone Options

Intent Polish offers the following tone presets:
- **Neutral** (default) - Balanced, professional
- **Professional** - Formal, authoritative
- **Friendly** - Warm, approachable
- **Persuasive** - Compelling, action-oriented
- **Casual** - Relaxed, conversational
- **Bold** - Confident, attention-grabbing
- **Empathetic** - Understanding, supportive

---

#### Credits & Token Usage

Intent Polish uses Claude Sonnet 4.5, providing high-quality, intent-optimized refinement:

**Model:** Claude Sonnet 4.5 (claude-sonnet-4-5)
- Premium quality and consistency
- Excellent instruction following
- No fallback model (single-model approach)

**Approximate Costs per Session:**
- 1 variant: 800-1,500 tokens (4.0-7.5 credits)
- 2 variants: 1,200-2,200 tokens (6.0-11.0 credits)
- 3 variants: 1,600-3,000 tokens (8.0-15.0 credits)

**Token Tracking:**
- All Intent Polish generations tracked under operation type: `quick-polish`
- Credits charged based on actual usage
- Model used: `claude-sonnet-4-5`

**Cost Comparison:**
- More expensive than Copy Snap (DeepSeek)
- Less expensive than Copy Maker with Claude
- Premium quality-to-cost ratio for intent-driven work

---

#### Best Practices

**When to use Intent Polish:**
- You need intent-specific optimization (social, email, landing page, etc.)
- You want multiple polished variants to choose from
- You need structured refinement with audience/goal/tone controls
- You're refining existing copy for specific channels

**When to use Copy Snap instead:**
- Very quick edits (under 10 seconds)
- No need for intent-specific optimization
- Cost is a priority (Copy Snap uses DeepSeek)

**When to use Copy Maker instead:**
- Long-form content (blog posts, landing pages)
- Complex projects requiring extensive context
- Brand voice consistency required
- Saved templates or workflows needed
- URL extraction or structure detection needed

**Pro Tips:**
- Save complete sessions to compare variants later
- Use specific audience descriptions for better targeting
- Combine with Copy Snap for iterative refinement
- Test different tones to find what resonates

---

#### Technical Details

**Model:** Claude Sonnet 4.5 (claude-sonnet-4-5)
- Premium instruction following
- Excellent at intent-based optimization
- Consistent quality across all presets

**Response Time:**
- Single variant: 5-8 seconds typical
- Multiple variants: 8-12 seconds typical

**Max Input:** ~2000 characters
**Max Output:** Varies by intent (typically 200-1000 tokens per variant)

**Error Handling:**
- Validation before submission
- Clear error messages
- Retry option on failure

**Save System:**
- Uses same `pmc_saved_outputs` table as Copy Snap
- Complete session structure (input + all variants)
- Searchable by title, tags, and date
- Accessible from Dashboard

---

**Last Updated:** 2026-02-07 UTC

**Changes:**
- Intent Polish now uses **complete session saving** - saves input + all variants together in one record, matching Copy Snap's save behavior
- Intent Polish sessions now appear in Dashboard > Saved Outputs (NOT in Copy Sessions or Credits Usage tabs)
- Opening saved Intent Polish sessions from Dashboard correctly routes to Intent Polish (not Copy Maker)
- Complete session restoration - all input settings and variants reload perfectly
- Intent Polish usage tracking is separate from Copy Maker/Copy Snap - does not appear in Credits Usage tab

---


---

## 3. Advanced Systems

Deep-dive into specialized optimization and analysis features.

### 3.1 URL Extraction & Structure Detection

### Overview

The URL Extraction system allows users to analyze any webpage and automatically extract marketing copy, context, or full content structure. This feature dramatically speeds up the "improve existing copy" workflow by eliminating manual copy-pasting and preserving original content architecture.

### Two Extraction Modes

#### 1. Analyze Context (Quick Analysis)

**Purpose:** Extract key information from a webpage to populate wizard fields

**Available In:**
- Create New mode
- Improve Copy mode

**What It Extracts:**
- Product/service description (1-2 sentences)
- Target audience (specific)
- Detected tone (Professional, Friendly, Bold, etc.)
- Pain points addressed (comma-separated)
- Key features list (max 5)
- Main benefits (max 5)
- Primary language detected

**Performance:**
- Uses GPT-4o-mini for speed
- Processes first 8,000 characters
- Results cached for 7 days
- Average response: 2-4 seconds

#### 2. Extract Copy (Full Extraction)

**Purpose:** Extract ALL marketing copy while preserving structure

**Available In:**
- Improve Copy mode only

**What It Extracts:**
- Complete marketing copy (clean Markdown)
- Language detected
- Target audience
- Pain points
- Tone/voice
- **Output Structure:** Array of section names (Hero, Features, Benefits, etc.)

**Content Processing:**
- Removes navigation, headers, footers, scripts, styles
- Preserves original order and hierarchy
- Formats as clean Markdown (# ## ### for headers)
- No HTML tags in output
- Maintains natural page flow

**Structure Detection:**
- AI analyzes page architecture
- Identifies major sections
- Returns max 8 sections
- Section names concise (1-3 words)
- Based on ## headers in extracted Markdown

**Performance:**
- Uses GPT-4o-mini
- Processes first 100,000 characters
- No caching (always fresh)
- Average response: 4-8 seconds

### Structure Confirmation Modal

**When It Appears:**
- User clicks "Extract Copy" in wizard
- Analysis completes successfully
- outputStructure array returned
- Only in "Improve" mode

**What It Shows:**
- Extracted structure (detected sections)
- Default structure (Overview, Key Points, CTA)
- Radio button selection
- Visual comparison

**User Choice:**
1. **Use Extracted:** Preserves original page architecture
2. **Use Default:** Generic but functional 3-section structure

**Data Flow:**
```
URL Input → Edge Function → AI Analysis → Structure Detection →
Modal Choice → createOutputStructure() → StructuredOutputElement[] →
Form State → DraggableStructuredInput → Generation
```

### Best Practices

**Good URLs to Analyze:**
- Direct product/service pages
- Landing pages with clear structure
- Competitor marketing pages
- Pages with substantial content

**Poor URLs to Analyze:**
- Home pages with minimal copy
- Navigation-heavy pages
- JavaScript-rendered SPAs
- Pages with heavy multimedia, minimal text

**Structure Decision Guide:**

**Choose Extracted When:**
- Page has 4+ clear sections
- Structure is logical and intuitive
- Sections have descriptive names
- Architecture matches your goals
- Improving existing content

**Choose Default When:**
- Detected structure has <3 sections
- Section names are vague
- Page structure is complex/confusing
- You want to simplify organization
- Creating new content from scratch

---


### 3.2 AI Model Comparison

### Available Models

#### Claude 3.5 Sonnet (claude-3-5-sonnet-20241022) ⭐ DEFAULT
- **Output Limit:** 8,192 tokens
- **Cost:** $3.00 per million input tokens, $15.00 per million output tokens
- **Best For:** Balanced excellence across all content types
- **Quality:** Exceptional, industry-leading
- **Speed:** Fast
- **Use When:** Any content creation task - this is the recommended default model

#### Claude Sonnet 4.5 (claude-sonnet-4.5-20250514) 🆕 LATEST
- **Output Limit:** 8,192 tokens
- **Cost:** $3.00 per million input tokens, $15.00 per million output tokens
- **Best For:** Cutting-edge AI capabilities and most advanced reasoning
- **Quality:** Exceptional, next-generation
- **Speed:** Fast
- **Use When:** You want the absolute latest Claude model with enhanced performance
- **Note:** This is the newest Claude model released in 2025

#### DeepSeek V3 (deepseek-chat)
- **Output Limit:** 8,192 tokens
- **Cost:** $0.27 per million input tokens, $1.10 per million output tokens
- **Best For:** Cost-effective high-volume generation
- **Quality:** Very good, comparable to GPT-4
- **Speed:** Fast
- **Use When:** Budget-conscious, high volume needed

#### GPT-4 Omni (gpt-4o)
- **Output Limit:** 16,000 tokens
- **Cost:** $2.50 per million input tokens, $10.00 per million output tokens
- **Best For:** Balanced performance and quality
- **Quality:** Excellent
- **Speed:** Moderate
- **Use When:** High-quality output for important content

#### ChatGPT-4o Latest (chatgpt-4o-latest)
- **Output Limit:** 16,384 tokens
- **Cost:** $5.00 per million input tokens, $15.00 per million output tokens
- **Best For:** Latest improvements and features
- **Quality:** Excellent, most up-to-date
- **Speed:** Moderate
- **Use When:** Need absolute latest capabilities

#### GPT-4 Turbo (gpt-4-turbo)
- **Output Limit:** 16,000 tokens
- **Cost:** $10.00 per million input tokens, $30.00 per million output tokens
- **Best For:** Fast, high-quality generation
- **Quality:** Excellent
- **Speed:** Fast
- **Use When:** Speed and quality both matter

#### GPT-3.5 Turbo (gpt-3.5-turbo)
- **Output Limit:** 4,096 tokens
- **Cost:** $0.50 per million input tokens, $1.50 per million output tokens
- **Best For:** High-volume simple content
- **Quality:** Good
- **Speed:** Very fast
- **Use When:** Simple content, tight budget, high volume

#### Grok 4 Latest (grok-4-latest)
- **Output Limit:** 16,000 tokens
- **Cost:** $5.00 per million input tokens, $15.00 per million output tokens (estimated)
- **Best For:** Alternative perspectives, creative approaches
- **Quality:** Very good
- **Speed:** Moderate
- **Use When:** Need different creative angle or innovative approach

#### Gemini 2.0 Flash (gemini-2.0-flash)
- **Output Limit:** 8,192 tokens
- **Cost:** $0.075 per million input tokens, $0.30 per million output tokens
- **Provider:** Google AI (Gemini API)
- **Best For:** Extremely cost-effective, massive-scale generation
- **Quality:** Very good
- **Speed:** Very fast
- **Cost Savings:** ~97% cheaper than GPT-4o, ~73% cheaper than DeepSeek V3
- **Use When:** Need quality at minimal cost, high-volume production
- **Perfect For:** E-commerce product descriptions, blog content at scale, social media campaigns, email sequences
- **API Setup:** Get free API key at https://aistudio.google.com/apikey
- **Note:** Best choice for maximizing content output on tight budgets

### Model Selection Matrix

**By Content Type:**
- Landing Pages: Claude 3.5 Sonnet (default) or GPT-4o
- Blog Posts: Claude 3.5 Sonnet (default), DeepSeek V3, or Gemini 2.0 Flash
- Email Campaigns: Claude 3.5 Sonnet (default) or GPT-4 Turbo
- Product Descriptions: Claude 3.5 Sonnet (balanced), Gemini 2.0 Flash (volume), or DeepSeek V3 (budget)
- Social Media: Claude 3.5 Sonnet (default), Gemini 2.0 Flash, or DeepSeek V3
- Ad Copy: Claude 3.5 Sonnet (default) or GPT-4 Turbo
- Sales Pages: Claude 3.5 Sonnet (default) or GPT-4o
- Case Studies: Claude 3.5 Sonnet (default) or ChatGPT-4o Latest
- High-Volume Content: Gemini 2.0 Flash (lowest cost) or DeepSeek V3

**By Budget:**
- Ultra Tight: Gemini 2.0 Flash primary (lowest cost)
- Tight: Mix Gemini 2.0 Flash and DeepSeek V3
- Medium: Claude 3.5 Sonnet (default), supplemented with DeepSeek V3 or Gemini for volume
- High: Claude 3.5 Sonnet primary, GPT-4o for specialized needs

---


### 3.3 GEO & SEO Optimization Deep Dive

### What is GEO (Generative Engine Optimization)?

**GEO** optimizes content for AI-powered search engines and chat interfaces (ChatGPT, Perplexity, Google AI Overviews, Bing Chat).

**Key Difference:**
- **SEO:** Optimize for traditional search engines (keyword matching, backlinks)
- **GEO:** Optimize for AI engines (citability, structure, factual clarity)

### GEO Score Components

**1. Citation-Friendliness (0-100)**
- Quotable statements present
- Facts clearly stated
- Attribution quality
- Standalone comprehensibility

**2. Structure & Scanability (0-100)**
- Clear section headers
- Descriptive headings
- Bullet point usage
- Visual hierarchy

**3. Factual Clarity (0-100)**
- Specific information
- Verifiable claims
- No vague statements
- Measurable data included

**4. AI-Friendly Formatting (0-100)**
- TL;DR summaries
- List formatting
- Clear hierarchies
- Scannable structure

### Implementing GEO

**Enable "Enhance for GEO" Feature:**
- Adds TL;DR summary at top
- Structures content for AI parsing
- Includes clear, quotable statements
- Uses scannable formatting

**GEO Best Practices:**
- Start with concise summary
- Use descriptive headers
- Include specific data/metrics
- Format key points as lists
- Make statements independently quotable
- Avoid ambiguous language
- Use structured data when possible

### SEO Metadata Generation

**URL Slugs:**
- Lowercase, hyphenated
- Keyword-rich
- Readable and descriptive
- 3-5 words typical

**Meta Descriptions (~155 chars):**
- Primary keyword included
- Compelling call-to-action
- Benefit-focused
- Within Google's limit

**H1 Headings:**
- Primary keyword included
- Benefit/transformation focused
- Compelling and clear
- 50-70 characters ideal

**H2/H3 Headings:**
- Keyword variations
- Section-appropriate
- Benefit-oriented
- Scannable

**OG Tags (Social Sharing):**
- Optimized for social platforms
- 60-90 characters for titles
- 155-200 for descriptions
- Compelling for clicks

**On-Demand SEO Generation for Individual Cards:**

SEO metadata can be generated in two ways:

1. **During Initial Generation:** Enable "Generate SEO Metadata" toggle before generating content
2. **Per-Card After Generation:** Click the "Generate SEO Metadata" button on any individual output card

**Per-Card SEO Generation Benefits:**
- Generate SEO metadata only for your best-performing versions
- Try different SEO variant counts for different outputs
- Add SEO elements after testing which copy resonates
- More control over token usage (only generate SEO when needed)

**How It Works:**
1. Generate your content normally (with or without SEO metadata)
2. Review outputs, create alternatives, apply voice styles
3. Select your best version(s)
4. Click "Generate SEO Metadata" button on the card
5. Choose variant counts (URL slugs: 1-5, meta descriptions: 1-5, etc.)
6. SEO metadata generates and attaches to that specific card
7. **Automatically saved:** When you click "Save Output," all SEO metadata is included
8. **Automatically exported:** All exports (HTML, Markdown) include SEO metadata

**When to Use Per-Card SEO:**
- Testing multiple copy variations before committing to SEO optimization
- Want SEO only for the winner, not all alternatives
- Iterative workflow: content first, SEO second
- Managing API token costs by generating SEO selectively

**What Gets Saved & Exported:**
Once SEO metadata is generated for a card (either during initial generation or added later), it becomes part of that card permanently and is:
- ✅ Included when you click "Save Output"
- ✅ Included in HTML exports
- ✅ Included in Markdown exports
- ✅ Preserved when loading saved outputs

**Generate All 3 Analyses - One-Click Complete Analysis:**

For maximum efficiency, CopyZap offers a "Generate All 3 Analyses" button that creates all three analytical enhancements at once:

**What It Generates:**
1. **SEO Metadata** - Complete SEO optimization elements (URL slugs, meta descriptions, H1/H2/H3 variants, OG tags)
2. **Content Score** - Quality analysis across clarity, persuasiveness, tone match, and engagement
3. **GEO Score** - Generative Engine Optimization rating for AI search visibility

**When This Button Appears:**
- Only shows when 2 or more analyses are missing from the card
- Disappears once most analyses have been generated
- Provides a streamlined workflow for comprehensive content analysis

**How It Works:**
1. Click "Generate All 3 Analyses" button on any output card
2. System generates all three analyses sequentially:
   - First: SEO Metadata (uses default variant counts)
   - Second: Content Score
   - Third: GEO Score
3. Progress indicators show each generation step
4. All three analyses attach to the card and are included in saves/exports

**Benefits:**
- **Time Savings:** One click instead of three separate actions
- **Workflow Efficiency:** Get complete analysis without multiple interactions
- **Consistent Analysis:** All three analyses use the same content state
- **Token Optimization:** Batch processing for better API efficiency

**When to Use:**
- Final content versions you want fully analyzed
- Client deliverables requiring comprehensive reporting
- Quality assurance before publishing
- Comparing multiple versions with full metrics

**Individual Buttons Still Available:**
Even with the "Generate All 3" button available, individual generation buttons remain:
- "Generate SEO Metadata" - For SEO-only optimization
- "Generate Content Score" - For quality assessment only
- "Generate GEO Score" - For AI search optimization only

This gives you complete flexibility: use the all-in-one button for efficiency or individual buttons for targeted analysis.

**Batch Analysis Smart Button Behavior (NEW):**

When using Batch Analysis (Auto-Generate) mode in Optional Features, CopyZap intelligently shows on-demand buttons only for features you didn't auto-generate:

**How It Works:**
1. **During Setup:** You select which analyses to auto-generate:
   - ✅ Auto-Generate Content Quality Score
   - ✅ Auto-Generate Geo/LLM SEO Optimization Score
   - ❌ Auto-Generate SEO Metadata (unchecked)

2. **In Output Cards:**
   - Content Quality Score: ✅ Already present (auto-generated)
   - GEO Score: ✅ Already present (auto-generated)
   - SEO Metadata: **Button appears** → "Generate SEO Metadata" (available on-demand)

**Smart Logic:**
- Only features you **didn't** check in Batch Analysis show on-demand buttons
- Features you **did** check are auto-generated and don't show buttons
- This applies to all three analyses: SEO Metadata, Content Score, and GEO Score

**Benefits:**
- **Selective Generation:** Auto-generate analyses you want for every output
- **On-Demand Flexibility:** Generate other analyses only for selected outputs
- **Token Efficiency:** Don't pay for analyses you don't need on every output
- **Workflow Control:** Mix auto-generated and selective analyses in one workflow

**Example Use Cases:**

**Case 1: Content-First, SEO-Later Workflow**
- Batch Analysis: ✅ Content Score, ✅ GEO Score, ❌ SEO Metadata
- Generate multiple content variants with quality scores
- Review and pick winners
- Generate SEO only for the best 1-2 outputs
- Result: Save tokens, focus SEO efforts where they matter

**Case 2: Quick Quality Check**
- Batch Analysis: ✅ Content Score only
- All outputs get quality scores automatically
- Selectively add SEO and GEO scores to top performers
- Result: Fast quality assessment, detailed analysis on demand

**Case 3: SEO-Heavy Project**
- Batch Analysis: ✅ SEO Metadata, ❌ Content Score, ❌ GEO Score
- Every output gets SEO elements for A/B testing
- Add quality scores only to shortlisted versions
- Result: Maximum SEO options, targeted quality analysis

**Special Case: Blended Voice Outputs**

When you create a **Blended Voice** output (by selecting multiple versions and blending them), the new blended content always shows ALL on-demand buttons regardless of your Batch Analysis settings:

**Why Blended Outputs Are Different:**
- Blended outputs are **brand new content** created by combining multiple versions
- They don't inherit SEO metadata, Content Scores, or GEO Scores from parent outputs
- Even if parent outputs were generated with Batch Analysis enabled, the blended output starts fresh
- Users need the ability to generate all analyses for this new unique content

**Example:**
1. You generate 3 outputs with Batch Analysis: ✅ SEO, ✅ Content Score, ✅ GEO Score
2. All 3 outputs have complete analyses (no buttons showing)
3. You blend Output 1 and Output 2 to create a new version
4. The blended output shows ALL buttons:
   - "Generate SEO Metadata" button appears
   - "Generate Content Score" button appears
   - "Generate GEO Score" button appears
   - "Generate All 3 Analyses" button appears
5. You can now analyze the new blended content completely

**This ensures:** Every piece of content, including blended versions, can receive full analysis independent of the original Batch Analysis settings.

---


### 3.4 Output System Architecture

### Card-Based Architecture

**Every Content Card Contains:**

**Header:**
- Content Type Badge
- Word Count (actual vs target)
- Timestamp
- Source Indicator

**Body:**
- Full content with markdown rendering
- Quality indicators
- **Copy Button** - Copies only the main copy content as plain text (no scores or metadata)
- **Copy HTML Button** - Copies only the main copy content formatted as clean HTML (no scores or metadata)
- **Copy MD Button** - Copies the entire output card with all sections as markdown (includes content, scores, SEO metadata, and all other data)

**Footer - Action Buttons:**
- Generate Alternative Copy
- Apply Voice Style
- Generate Score
- Modify Content
- Generate FAQ Schema

**Metadata:**
- Quality Scores
- SEO Metadata
- GEO Scores
- Applied Persona

### Content Threading

**Relationship Tree Example:**
```
Generated Copy (Original)
├── Alternative Copy 1
│   ├── Restyled (Alex Hormozi)
│   └── Modified ("make shorter")
├── Alternative Copy 2
│   └── Restyled (Seth Godin)
└── Restyled (Steve Jobs)
    └── Modified ("add pricing")
```

**Visual Indicators:**
- Source Badge (shows parent)
- Type Badge (relationship type)
- Timestamp (generation order)
- Thread Lines (visual connections)

### On-Demand Enhancement Philosophy

**Traditional Tools:**
Generate → Get Everything → Want Changes → Regenerate Everything

**CopyZap:**
Generate Base → Review → Enhance Selectively → Keep Building

**Benefits:**
- Efficient (generate only what you need)
- Cost-effective (pay for what you use)
- Fast (surgical enhancements)
- Preservative (keeps all versions)

---

### 3.5 Workflow Automation & Permissions

#### Overview

The Workflow Automation system allows users to create, save, and share reusable sequences of copy generation steps. Instead of manually executing the same actions repeatedly, workflows automate multi-step processes with a single click.

**Key Innovation:** Workflows can be shared with other team members with granular permission controls, enabling collaboration and standardization across teams.

#### What Are Workflows?

A workflow is an automated sequence of steps that processes content through multiple transformations. Each workflow consists of:

1. **Create Alternative Copy Steps** - Generate additional versions of content
2. **Apply Voice Style Steps** - Apply brand voices or preset styles
3. **Analyze & Compare Steps** - Automatically evaluate and compare outputs

#### Creating a Workflow

**Location:** Main Menu → Manage Workflows → Create Workflow

**Basic Setup:**
1. **Name:** Descriptive name for the workflow (e.g., "LinkedIn Post Variations with Analysis")
2. **Description (Optional):** Add a helpful note or description to explain the workflow's purpose
3. **Customer Association (Optional):** Link to a specific customer/project
4. **Steps Configuration:** Add and configure workflow steps

**Step Types:**

1. **Create Alternative Copy**
   - Generates an alternative version of the content
   - Target: Specify which content to use as source (original, alt_1, alt_2, etc.)

2. **Apply Voice Style**
   - Applies a brand voice or preset voice style
   - Choose from:
     - Preset voice styles (Steve Jobs, Seth Godin, etc.)
     - Customer brand voices (must select customer first)
   - Target: Specify which content to style

**Analyze & Compare Copy (Optional):**
- Managed via checkbox toggle at the top of the workflow editor
- When enabled, automatically evaluates all generated outputs at the end of the workflow
- Analysis types:
  - Comprehensive analysis
  - Marketing effectiveness
  - Custom instructions
- Generates comparison report with recommendations
- Always executes as the final step (cannot be reordered)

**Example Workflow:**
```
Workflow: "Social Media Triple Variant Analysis"
1. Create Alternative Copy (target: original)
2. Create Alternative Copy (target: alt_1)
3. Apply Voice Style (target: alt_2, style: "conversational-friendly")

Optional: Enable "Analyze & Compare Copy" checkbox (type: marketing effectiveness)
```

#### Using Workflows

**In Copy Maker:**
1. Fill in your initial content fields as normal
2. Enable "Use Workflow" toggle
3. Select workflow from dropdown
4. Click Generate

**What Happens:**
- Initial content is generated first
- Workflow steps execute automatically in sequence
- Each step's output is added to the results panel
- Final analysis (if included) compares all versions
- All outputs are preserved and labeled

#### Workflow Permissions System

**Permission Levels:**

1. **Owner** (Workflow Creator)
   - Full edit access
   - Can delete workflow
   - Can grant/revoke permissions
   - Can make workflow public

2. **View Permission**
   - Can see and use the workflow
   - Can duplicate to create own copy
   - Cannot modify original

3. **Edit Permission**
   - Can modify workflow steps
   - Can update name and settings
   - Cannot delete workflow
   - Cannot manage permissions

4. **Public Workflows**
   - Visible to all users
   - Anyone can use or duplicate
   - Only owner can edit

#### Managing Workflow Permissions

**Location:** Manage Workflows → [Workflow Card] → Share Button

**Granting Permission:**
1. Click "Share" button on workflow
2. Enter user's email address
3. Select permission level (View or Edit)
4. Click "Grant Permission"

**User Requirements:**
- User must have an active CopyZap account
- Email must match their registered email
- System validates user exists before granting

**Permission Management:**
- View all granted permissions
- See who granted each permission and when
- Update permission level (View ↔ Edit)
- Revoke access instantly

**Permission Indicators:**
- Workflows you own show "Share" button
- Shared workflows show permission badge
- Public workflows show "Public" badge

#### Workflow Collaboration Use Cases

**Agency Scenario:**
- Agency owner creates "Client Blog Post Workflow"
- Grants Edit permission to senior writers
- Grants View permission to junior writers
- Junior writers use standard workflow
- Senior writers can adapt for special cases

**Team Scenario:**
- Marketing manager creates "Product Launch Workflow"
- Shares with entire marketing team (View)
- All team members use consistent process
- Ensures brand voice consistency
- Reduces training time

**Freelancer Scenario:**
- Create workflows for different content types
- Share with clients for approval
- Client can see exactly what process will be used
- Demonstrates professionalism and consistency

#### Best Practices

**Workflow Design:**
- Keep workflows focused (3-5 steps ideal)
- Name workflows descriptively
- Include analysis step for objective evaluation
- Document custom instructions clearly

**Permission Strategy:**
- Start with View permissions
- Grant Edit only to trusted collaborators
- Use Public for templates and examples
- Regularly review and audit permissions

**Workflow Organization:**
- Associate with customers when possible
- Create separate workflows for different content types
- Build library of reusable processes
- Test workflows before sharing

#### Technical Details

**Database Tables:**
- `workflows` - Stores workflow definitions
- `workflow_permissions` - Manages sharing permissions

**Security:**
- Row Level Security (RLS) enforced
- Users only see workflows they own, have permission for, or are public
- Edit operations validate permissions
- Permission grants require ownership

**Performance:**
- Workflows execute steps sequentially
- Each step processes independently
- Failed steps don't block subsequent steps
- All outputs preserved regardless of errors

---


---

## 4. User Experience & Help Center

### 4.1 Help Center Architecture

### Help Center Architecture

**Location:** Separate `/help` section of application

**Purpose:**
- Comprehensive user documentation
- Searchable knowledge base
- Video tutorials
- Troubleshooting guides
- Best practices library
- Glossary of terms

### Help Pages Structure

**Main Help Index:**
- Getting Started guide
- Feature overview
- Video tutorials
- FAQs
- Troubleshooting
- Best practices
- Glossary
- Contact support

**Individual Feature Pages:**

Each major feature has dedicated page:
1. **Quick Prompt Wizard** - Complete guide to wizard system
2. **Brand Voice System** - How to create and use brand voices
3. **Output Features** - Understanding generated outputs
4. **Export Management** - File downloads and formats
5. **Templates & Reuse** - Template system guide
6. **Compare & Blend** - Output comparison tools
7. **Project Setup** - Initial configuration
8. **Workflows & Examples** - Real-world use cases

**Page Structure:**
- Clear navigation breadcrumbs
- Table of contents with anchor links
- Step-by-step instructions
- Screenshots/GIFs for visual learners
- Video embeds where applicable
- Related articles section
- Feedback widget at bottom

### Search Functionality

**Help Search Features:**
- Full-text search across all help content
- Search-as-you-type suggestions
- Highlighted search terms in results
- Ranked by relevance
- Filter by category
- Recent searches history

**Search Index:**
- Pre-generated search index JSON
- Client-side search for speed
- Fuzzy matching for typos
- Synonym support
- Weighted fields (title > headers > body)

**Implementation:**
```javascript
// search-index.json structure
{
  "pages": [
    {
      "id": "quick-wizard",
      "title": "Quick Prompt Wizard Guide",
      "url": "/help/quick-wizard.html",
      "content": "...",
      "keywords": ["wizard", "setup", "beginner", "guided"],
      "category": "Getting Started"
    }
  ]
}
```

### Video Tutorials

**Tutorial Library:**
- Getting started (5-minute overview)
- Quick Wizard walkthrough (3 minutes)
- Brand Voice creation (4 minutes)
- Using templates (3 minutes)
- Compare & blend features (5 minutes)
- Advanced workflows (8 minutes)
- Pro tips series (2-minute episodes)

**Video Features:**
- Embedded YouTube/Vimeo players
- Chapters/timestamps
- Transcripts for accessibility
- Download option for offline viewing
- Related videos suggestions

### Contextual Help System

**In-App Help:**

**Tooltips:**
- Hover over field labels
- Short explanatory text
- Icon indicator (? or info icon)
- Appears on hover/tap
- Dismissible
- Links to full documentation

**Help Buttons:**
- Next to complex features
- Opens help modal or sidebar
- Shows relevant documentation
- Doesn't leave current page
- Maintains form state

**Help Center Access (Logged-in Users):**
- Help links open in new tab when user is authenticated
- Preserves work session in original tab
- Prevents accidental navigation away from active work
- User can reference documentation while working
- Applies to both desktop and mobile navigation
- Non-authenticated users navigate normally in same tab

**Empty State Guidance:**
- Appears when no outputs yet
- Shows video or quick guide
- Links to relevant help pages
- Suggests Quick Wizard
- Reduces confusion for new users

**Onboarding Flows:**
- First-time user tour (optional)
- Highlights key features
- Step-by-step walkthrough
- Dismissible at any point
- Can replay from help menu
- Tracks completion status

### Feedback System

**Help Page Feedback:**

Each help page includes feedback widget:
- "Was this helpful?" Yes/No buttons
- Optional comment field
- Submit feedback button
- Thank you confirmation
- Anonymous or authenticated

**Feedback Database:**
```sql
CREATE TABLE help_page_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug TEXT NOT NULL,
  user_id UUID REFERENCES auth.users,
  is_helpful BOOLEAN NOT NULL,
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Edge Function:**
```typescript
// submit-help-feedback
// Receives feedback, stores in database
// Sends email notification to support team
// Returns confirmation
```

**Analytics Dashboard:**
- Feedback by page
- Helpful vs not helpful ratio
- Common feedback themes
- Pages needing improvement
- User satisfaction trends

### Contact Support System

**Support Request Form:**
- Name and email fields
- Subject dropdown (categories)
- Detailed description textarea
- Attachment upload option
- Priority selection
- Submit button

**Categories:**
- Technical Issue
- Feature Request
- Billing Question
- General Inquiry
- Bug Report
- Documentation Feedback

**Edge Function:**
```typescript
// send-help-email
// Validates input
// Sends email to support team
// Creates ticket in system
// Sends confirmation to user
// Tracks response time
```

**User Confirmation:**
- Thank you message
- Ticket number
- Expected response time
- Link to submitted request
- Additional resources while waiting

### Glossary of Terms

**Comprehensive Definitions:**

Over 100 terms defined:
- AI Model (e.g., GPT-4o, DeepSeek)
- Brand Voice
- GEO (Generative Engine Optimization)
- Tone Level
- Output Structure
- SEO Metadata
- Token
- Alternative Copy
- Voice Style
- Compare Mode
- Blend Mode
- Prefill
- Template
- Customer
- Special Instructions
- Language Constraints
- Excluded Terms
- Word Count Target
- Funnel Stage
- Pain Points
- CTA (Call to Action)
- Schema Markup
- FAQ JSON
- URL Slug
- Meta Description
- H1/H2/H3
- Open Graph
- Structured Data
- Featured Snippet

**Glossary Features:**
- Alphabetical index
- Search/filter
- Related terms links
- Examples for each term
- When to use guidance
- Cross-references

### UX Enhancement Features

**Loading States:**
- Skeleton screens during load
- Progress indicators for long operations
- Contextual loading messages
- Cancel buttons for cancelable operations
- Estimated time remaining

**Error Handling:**
- User-friendly error messages
- Specific guidance on fixing errors
- Link to help documentation
- Contact support option
- Retry button where applicable

**Success Feedback:**
- Toast notifications for actions
- Confetti animation for major completions
- Success modals with next steps
- Save confirmations
- Progress celebrations

**Responsive Design:**
- Mobile-optimized layouts
- Touch-friendly buttons (minimum 44x44px)
- Collapsible sections on small screens
- Hamburger menu for navigation
- Swipe gestures for mobile
- Desktop: Side-by-side panels
- Tablet: Stacked with easy scrolling

**Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation throughout
- Screen reader optimized
- High contrast mode support
- Focus indicators
- Alt text for all images
- Aria labels for interactive elements
- Skip to content links

**Dark Mode:**
- System preference detection
- Manual toggle available
- All colors optimized for dark
- Image inverting where needed
- Smooth transition animation
- Preference saved to localStorage

### Analytics & Improvement

**Help Content Analytics:**
- Page views per help article
- Time spent on page
- Scroll depth tracking
- Exit pages (where users give up)
- Search queries (what users look for)
- Video play rates
- Feedback scores

**Continuous Improvement:**
- Monthly help content review
- Update based on feedback
- Add new articles for common questions
- Improve low-scoring pages
- Create videos for confusing features
- A/B test different explanations

---

---

## 5. Workflows & Real-World Examples

### 5.1 How It All Works Together

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

### The Learning Curve: **Week 1:** Use Quick or Standard Mode, Quick Start templates, wizard
**Week 2-4:** Try different toggles, understand what each setting does
**Month 2+:** Advanced mode, custom templates, advanced combinations
**Month 3+:** Teaching others, creating team standards, optimizing workflows

### Best Results Come From: 1. **Specific inputs** - "E-commerce business" < "Sustainable fashion e-commerce for Gen Z"
2. **Clear objectives** - Know what success looks like before generating
3. **Iteration** - First version is rarely the final version
4. **Comparison** - Generate multiple options and choose objectively
5. **Consistency** - Save templates for recurring needs

---

**Remember:** Copy Maker is a tool, not magic. The quality of your output depends on the quality of your inputs, your willingness to iterate, and your understanding of your audience. This documentation gives you the knowledge - practice gives you mastery. ---


### 5.2 Typical Workflow: End-to-End Example

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


### 5.3 Real-Life Scenarios: Copy Maker in Action

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


---

## 6. Best Practices & Recommendations

### 6.1 Common Mistakes & Pro Tips

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


### 6.2 Recommended Settings: Beginners vs Experts

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

Understanding how Copy Maker features interact helps you use them strategically.

### Interaction 0: Required Fields ↔ Form Validation

**How they connect:**

The application enforces required field validation to ensure quality output and proper session tracking:

**Required Fields (ALL THREE must be filled):**

**Make New Copy mode:**
1. **Project Description** - For session tracking and context
2. **Product/Service Name** - For accurate content generation
3. **Business Description** - Primary content to generate from

**Improve Existing Copy mode:**
1. **Project Description** - For session tracking and context
2. **Product/Service Name** - For accurate content generation
3. **Original Copy** - Primary content to improve

**What gets disabled when required fields are empty:**
1. **Make Copy button** - Disabled with hover tooltip: "Fill in Project Description, Product/Service Name, and Business Description/Original Copy first"
2. **All AI Suggestion buttons (⚡ lightning icons)** - Disabled with tooltip "Fill in all required fields first (Project Description, Product/Service Name, and content)"

**Why this matters:**
- **Project Description** ensures your work is trackable and findable later in session history
- **Product/Service Name** ensures consistent, accurate references in generated content
- **Business Description/Original Copy** provides the core context for meaningful AI output
- AI suggestions require complete context to be relevant and helpful
- Prevents wasted API calls and user frustration
- Guides users to provide essential information first

**Visual feedback:**
- Disabled buttons have reduced opacity and cursor-not-allowed
- Hover tooltips explain exactly which fields are needed
- Clear indication of incomplete form state

**Strategic use:**
- Fill all three required fields before attempting generation or suggestions
- Project Description: Think about how you'll search for this later ("Email campaign" → "Welcome email series for SaaS trial users")
- Product/Service Name: Use the exact name/branding you want in the output
- Content field: Provide comprehensive context for best results

**Best practice:** Fill all three required fields (Project Description, Product/Service Name, and Business Description/Original Copy) before exploring AI suggestions. This ensures proper session tracking and guarantees all suggestions are relevant and contextual.

---

### Interaction 1: Smart Mode ↔ Quick Prompt Wizard

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
### Universal Defaults

**AI Model:** DeepSeek V3
**Language:** English
**Tone Level:** 5 (Moderate)
**Generate SEO:** YES (if web content, 1-2 variants)
**Generate Scores:** NO (initially)
**Generate GEO:** YES (future-proofing)

### By Content Type

**Landing Page Hero:**
- Model: GPT-4 Turbo
- Word Count: 150
- Tone: Persuasive (Level 6-7)
- Structure: H1, Problem, Solution, CTA
- SEO: YES (2-3 variants)
- GEO: YES

**Blog Post (1200 words):**
- Model: DeepSeek V3
- Word Count: 1200
- Tone: Conversational (Level 5)
- Structure: Intro, 3x H2 sections, Conclusion
- SEO: YES (full metadata)
- GEO: YES

**Email Campaign:**
- Model: GPT-4 Turbo
- Word Count: 100-150
- Tone: Friendly (Level 6)
- Structure: None (natural flow)
- SEO: NO
- Scores: YES (quality check)

**Product Description:**
- Model: DeepSeek V3 or GPT-4 Turbo
- Word Count: 100-150
- Tone: Persuasive (Level 5-6)
- Structure: H1, Problem, Solution, Features, CTA
- SEO: YES
- GEO: YES

**Ad Copy:**
- Model: GPT-4 Turbo
- Word Count: Custom (strict limits)
- Tone: Persuasive (Level 7)
- Prioritize Word Count: YES
- Little Word Count Mode: YES
- Scores: YES

### By Experience Level

**Beginners (Week 1):**
- Model: DeepSeek V3
- Word Count: Medium
- Tone: Friendly (Level 5)
- Structure: None initially
- SEO/GEO: NO initially
- Scores: YES (learning)

**Intermediate (Month 2-3):**
- Mix DeepSeek and GPT-4 Turbo
- Use structure for complex content
- Enable SEO/GEO based on type
- Special Instructions: 3-5 rules
- Template library: 5-10 templates

**Advanced (Month 4+):**
- Strategic model selection
- 15+ specialized templates
- Extensive prefill library
- Detailed special instructions
- Multi-model testing

### By Budget

**Tight Budget:**
- DeepSeek V3 primary
- SEO: 1 variant each
- Scores: Final versions only
- Alternatives: 1 max
- Expected: $10-50/month

**Medium Budget:**
- Mix models (60% DeepSeek, 35% GPT-4 Turbo, 5% GPT-4o)
- SEO: 2 variants each
- Scores: Regular QA
- Alternatives: 2-3
- Expected: $50-200/month

**High Budget:**
- GPT-4 Turbo primary, GPT-4o for critical
- SEO: 3-5 variants for A/B
- Scores: Always
- Alternatives: 3-5
- Expected: $200-500+/month

---

## APPENDIX: COMPLETE QUICK START TEMPLATE CATALOG

[This section contains the full template library from analysis1-quick-start-templates.md - 600+ lines of pre-configured templates for all common content types, maintained as separate reference]

---


### 6.3 Feature Interactions: How Everything Connects


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
"When you're done, these action buttons let you save to your dashboard, copy as Markdown, or download as HTML."

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
# CONSOLIDATED ADDITIONS TO COPYZAP-FEATURES.MD

**Date:** 2025-11-20
**Purpose:** New sections to append to master documentation

---


---

## 7. Reference Materials

### 7.1 Glossary of Terms


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


### 7.2 Video Narration Guide


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
"When you're done, these action buttons let you save to your dashboard, copy as Markdown, or download as HTML."

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


### 7.3 Quick Start Templates Library

[See analysis1-quick-start-templates.md for complete 600+ line template library]

**Template Categories:**
1. Landing Pages (SaaS, Consumer Product)
2. Blog Posts (How-To, Thought Leadership)
3. Email Templates (Welcome, Promotional, Nurture)
4. Social Media (LinkedIn, Instagram, Twitter)
5. Ad Copy (Google, Facebook, LinkedIn)
6. Product Descriptions (E-commerce, Premium)
7. Email Sequences
8. Long-Form Sales Pages

**Each Template Includes:**
- Mode, Model, Word Count
- Tone and Tone Level
- Output Structure
- Special Instructions
- SEO/GEO Settings
- Best Use Cases

---


---

## 8. Appendix

### 8.1 Optional Features Comprehensive Guide

### Smart Mode vs Expert Mode (Optional Features)

**Smart Mode:**
- Shows 3 core toggles only:
  - Humanize Output
  - Retry if Too Short
  - Enforce Word Count
- "Show Advanced Options" toggle reveals all

**Expert Mode:**
- All options visible by default
- Full control immediately

### Feature Cost Impact Matrix

**Very Low Cost:**
- Generate GEO Score
- Enhance for GEO
- Little Word Count Mode
- Force Keyword Integration

**Low Cost:**
- Generate Content Scores
- FAQ Schema Generation
- Content Modification (single)

**Medium Cost:**
- SEO Metadata (2 variants)
- Generate Alternative (each)
- Voice Style (each)

**High Cost:**
- SEO Metadata (5 variants each)
- Multiple Alternatives (3+)
- Many Voice Styles (5+)

### Recommended Feature Combinations

**Minimal Setup (Speed Priority):**
- Output Structure: NO
- SEO Metadata: NO
- Scores: NO
- Alternatives: NO
- Voice Styles: NO

**Standard Setup (Balanced):**
- Output Structure: IF COMPLEX
- SEO Metadata: YES (2 variants)
- GEO Enhancement: YES
- Scores: NO (initially)
- Alternatives: NO (initially)

**Premium Setup (Quality Priority):**
- Output Structure: YES (if applicable)
- SEO Metadata: YES (3-5 variants)
- GEO Enhancement: YES (with TL;DR)
- Scores: YES
- Alternatives: 2-3
- Voice Styles: Test 2-4

---


### 8.2 Best Practices Extended

### Getting Started Right

**First-Time Users - Day 1:**
- Use Quick Prompt Wizard
- Answer all 3 questions thoroughly
- Use "Apply Only" to review
- Study AI-generated configuration
- Generate first content

**API Key Setup:**
For models requiring API keys:
- **OpenAI (GPT models):** Get your API key at https://platform.openai.com/api-keys
- **Anthropic (Claude models):** Get your API key at https://console.anthropic.com/
- **DeepSeek:** Get your API key at https://platform.deepseek.com/api_keys
- **Google (Gemini 2.0 Flash):** Get your FREE API key at https://aistudio.google.com/apikey
- **xAI (Grok):** Get your API key at https://console.x.ai/

**Recommended Starting Model:**
- **Budget-conscious:** Gemini 2.0 Flash (lowest cost, excellent quality)
- **Balanced:** DeepSeek V3 (great quality-to-cost ratio)
- **Premium:** GPT-4o (highest quality, moderate cost)

**Week 1 Focus:**
- Save successful configurations
- Create 2-3 core templates
- Start prefill library
- Establish naming conventions

### Field-Level Excellence

**Business Description:**
- 100-200 words minimum
- Be specific about what you do
- Identify exact target market
- Explain problems you solve
- Clarify your differentiation

**Target Audience:**
- Include role/title specifics
- Note company size/type
- Mention technical sophistication
- Describe current pain state
- Indicate decision authority

**Special Instructions:**
- Be extremely specific
- Use bullet points for clarity
- Prioritize most important rules
- Give examples when helpful
- Explain "why" if not obvious

### Generation Workflow

**The Efficient Workflow:**
1. Base Generation (minimal features)
2. Review Base Output
3. Selective Enhancement
4. Finalize

**What NOT to Do:**
- Don't generate everything at once
- Don't enable all features by default
- Don't skip review before enhancing

### Template Strategy

**Building Your Library:**
1. Most frequent content type first
2. Client-specific templates
3. Industry-standard templates
4. Emergency quick templates

**Template Naming:**
Format: `[Content Type] - [Audience] - [Tone]`

Examples:
- "Landing Page - B2B - Professional"
- "Email Campaign - Consumer - Friendly"
- "Product Description - Technical - Detailed"

---


### 8.3 Motivational Closing: Master Your Message


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
# CONSOLIDATED ADDITIONS TO COPYZAP-FEATURES.MD

**Date:** 2025-11-20
**Purpose:** New sections to append to master documentation

---


---

## 14. Typography and Design System

### 14.1 Dual Typography System

CopyZap implements a sophisticated dual typography system that provides:

1. **Compact UI Typography** - For the main application interface
2. **Documentation Typography** - For the Help Center

#### Main App Typography (Compact UI)

The main application uses Inter font with a compact, modern scale optimized for UI density:

**Font Stack:**
- Primary: Inter (400, 500, 600 weights)
- Fallbacks: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif

**Typography Scale:**
- **Body Text:** 14px, 400 weight, 1.5 line-height
- **H1 (Page Titles):** 22px, 600 weight, 1.3 line-height, 12px margin-bottom
- **H2 (Panel Titles):** 18px, 600 weight, 1.4 line-height, 8px margin-bottom
- **H3 (Section Titles):** 16px, 600 weight, 1.4 line-height, 6px margin-bottom
- **Labels:** 13px, 500 weight
- **Buttons:** 14px, 500 weight
- **Inputs/Selects/Textareas:** 14px, 400 weight
- **Secondary Text:** 12.5px with 85% opacity

**Applied to:** All routes except `/help/*` (Dashboard, Copy Maker, Settings, Management pages)

**Benefits:**
- Modern, clean appearance
- Reduced visual clutter
- Better information density
- Improved readability at compact sizes
- Consistent spacing throughout UI

#### Help Center Typography (Documentation)

The Help Center maintains a larger, more comfortable typography scale optimized for long-form reading:

**Typography Scale:**
- **H1:** 32px, 600 weight, 1.2 line-height, 16px margin-bottom
- **H2:** 24px, 600 weight, 1.3 line-height, 32px margin-top, 12px margin-bottom
- **H3:** 20px, 600 weight, 1.4 line-height, 24px margin-top, 8px margin-bottom
- **Paragraphs:** 16px, 400 weight, 1.6 line-height, 16px margin-bottom
- **Lists:** 16px, 400 weight, 1.6 line-height, 24px left-padding

**Applied to:** All `/help/*` routes automatically

**Benefits:**
- Comfortable reading experience
- Clear hierarchy for documentation
- Generous spacing for comprehension
- Professional documentation appearance

#### Automatic Switching

The typography system automatically switches based on the current route:

- When navigating to `/help/*` routes, the body element receives `.help-center-active` class
- When navigating away, the class is removed
- No manual intervention required
- Seamless transition between UI modes

### 14.2 Implementation Details

**Technical Architecture:**

1. **Font Loading** - Inter loaded with optimal font-display strategy
2. **CSS Scoping** - Main app styles use `body:not(.help-center-active)` selector
3. **Help Center Wrapper** - `.help-center-root` class protects documentation styles
4. **Route-Based Toggling** - React useEffect monitors route changes and manages class

**Browser Compatibility:**
- Modern browsers: Uses Inter
- Legacy browsers: Falls back to system fonts
- Mobile devices: Optimized for touch interfaces

### 14.3 Design Principles

1. **Separation of Concerns** - UI and documentation have different typography needs
2. **Automatic Adaptation** - System automatically applies correct styles based on context
3. **Visual Consistency** - Each context maintains its own consistent hierarchy
4. **Performance** - Font subsetting and optimal loading strategy
5. **Accessibility** - Sufficient contrast ratios and readable sizes maintained

---

## 15. Session Tracking and Token Usage Management

### 15.1 Overview

CopyZap now includes comprehensive session tracking to help you monitor and analyze token usage across your copy generation workflows. Every time you generate content, all related API calls are grouped into a single session with an auto-generated name.

### 15.2 What is a Session?

A **session** represents a complete copy generation workflow. It includes:

- **Initial copy generation** - The main content creation
- **Alternative versions** - Additional variations you generate
- **Restyled versions** - Persona-based style changes
- **Scoring operations** - Content quality and GEO scores
- **SEO metadata generation** - Meta tags and descriptions
- **All related API calls** - Everything that happens in one generation cycle

### 15.3 Session Names

Sessions are automatically named using this format:

**Format:** `[Content Type] - [Brief Description] - [Date]`

**Examples:**
- `Blog Post - AI Marketing Tips - Nov 29, 2025`
- `Email Campaign - Product Launch - Nov 29, 2025`
- `Landing Page - SaaS Homepage - Nov 29, 2025`

**Special Session Types:**

The application automatically creates properly named sessions for operations outside the main Copy Maker:

- **Brand Voice Generation:** When creating brand voices from Manage Customers → Add Brand Voice, sessions are automatically named "Brand Voice Generation"
- **URL Analysis:** When analyzing URLs, sessions are named appropriately based on the operation
- **Template Suggestions:** When using AI suggestion features, sessions are named based on the operation type

This ensures that token usage is always properly tracked and categorized, even when working outside of the main Copy Maker interface. You'll never see "No Session" in your token usage reports.

**Fallback:** If no description is available: `Session - Nov 29, 2025 2:45 PM`

**Important:** Session names are auto-generated and cannot be renamed. This ensures consistency and makes filtering/searching easier.

### 15.4 Session Display in UI

While working in Copy Maker, you'll see the current session displayed in the header:

- **Location:** Top-right corner of the header
- **Format:** Small blue badge with link icon
- **Content:** Shows the auto-generated session name
- **Purpose:** Lets you know which session is tracking your current work

### 15.5 Session Information Tracked

Each session automatically records:

#### Basic Information
- **Session ID** - Unique identifier (UUID)
- **Session Name** - Auto-generated human-readable name
- **User** - Who created the session
- **Customer** - If associated with a specific customer/project
- **Content Type** - Blog post, email, landing page, etc.
- **Brief Description** - Short summary of what's being created
- **Created At** - Date and time session started

#### Token Usage Summary
- **API Calls Count** - Total number of API calls in this session
- **Total Tokens** - Sum of all tokens used (input + output)
- **Total Cost** - Aggregated cost in USD for the entire session
- **Models Used** - Which AI models were used (GPT-4, DeepSeek, etc.)
- **Operations Performed** - List of actions (generate, score, restyle, etc.)

### 15.6 Admin: Managing Sessions Dashboard

**Access:** Admin users only
**Location:** Dashboard → "View Sessions & Token Usage" button (green Activity icon)
**Route:** `/manage-sessions`

#### Dashboard Features

**Filtering Options:**
- **Recent (50)** - Shows the 50 most recent sessions
- **All (200)** - Shows the 200 most recent sessions

**Session Cards Display:**

Each session card shows:
- **Session Name** - Auto-generated descriptive name
- **Brief Description** - Content summary if available
- **Date/Time** - When the session was created
- **Content Type Badge** - Visual indicator of content type
- **API Calls Count** - Number of API calls made
- **Total Tokens** - Total token usage
- **Total Cost** - Cost in USD (formatted to 4 decimal places)
- **Models Used** - List of AI models utilized
- **Operations List** - Detailed breakdown of operations performed

**Visual Design:**
- Clean card-based layout
- Color-coded statistics icons
- Dark mode support
- Hover effects for better interaction
- Responsive grid layout

### 15.7 Benefits of Session Tracking

#### For Individual Users
- **Transparency** - See exactly what each content generation costs
- **Debugging** - Understand which operations use the most tokens
- **Learning** - Learn which workflows are most efficient

#### For Admin/Management
- **Cost Analysis** - Track token usage and costs per session
- **Usage Patterns** - Identify high-usage periods or operations
- **Billing** - Accurate cost attribution per project/customer
- **Optimization** - Find opportunities to reduce token usage

#### For Teams
- **Accountability** - Know who generated what and when
- **Budgeting** - Plan token budgets based on session patterns
- **Reporting** - Generate reports on content production costs

### 15.8 Session Lifecycle

**Creation:**
- Sessions are created automatically when you click "Generate"
- One session per generation workflow
- Session ID is generated and stored in the form state

**Tracking:**
- All API calls include the session ID
- Token usage is linked to the session
- Operations are logged with the session

**Persistence:**
- Sessions are stored in the database
- Automatic cleanup after 30 days (configurable)
- Users are limited to their 50 most recent sessions

**Viewing:**
- Admin dashboard shows all sessions across all users
- Sortable by date, cost, tokens
- Searchable by session name

### 15.9 Session Guarantee System

**Updated:** 2025-12-03

CopyZap implements a **Frontend-First with Safety Net** approach to ensure every AI token is correctly tracked to a session.

#### How It Works

**Frontend Responsibility (Primary):**
- Before ANY AI call, the frontend MUST call `ensureActiveSession()` to get or create a session
- This method returns a `session_id` that is passed to all AI operations
- The session context maintains the active session throughout the user's workflow
- If a session already exists, it's reused; if not, a new one is created automatically

**Backend Safety Net (Fallback):**
- If somehow an AI call is made without a `session_id`, the `track-tokens` edge function automatically creates a fallback session
- This session is named "Untracked Session - [timestamp]" and logs a warning
- This ensures NO token usage is ever lost, even if the frontend fails to create a session

#### Implementation Details

**SessionContext Enhancement:**
```typescript
ensureActiveSession(
  userId: string,
  outputType?: string,
  projectDescription?: string,
  customerId?: string,
  inputData?: any
): Promise<string>
```

**What It Does:**
1. Checks if an active session already exists in context
2. If yes, returns the existing session ID
3. If no, creates a new session in the database
4. Updates the SessionContext with the new session
5. Returns the session ID for use in AI calls

**Usage in Components:**
```typescript
const { ensureActiveSession } = useSession();

// Before any AI operation
const sessionId = await ensureActiveSession(
  currentUser.id,
  'blog-post',
  'AI Marketing Tips',
  customerId,
  formState
);

// Pass sessionId to all AI functions
await generateCopy(formState, currentUser, sessionId, progressCallback);
```

**Safety Net in track-tokens:**
- Automatically creates a session if `session_id` is missing
- Logs a warning: `⚠️ WARNING: No session_id provided for token tracking`
- Creates a session with name: `Untracked Session - [datetime]`
- Continues to track tokens even if session creation fails
- Makes the system fail-safe and bulletproof

#### Benefits

**For Users:**
- Seamless experience - sessions are managed automatically
- All work is properly tracked and findable
- No manual session management required

**For Developers:**
- Clear, explicit session flow
- Easy to debug - can see if session_id is missing
- Single point of control for session management
- Defensive programming prevents data loss

**For System Reliability:**
- Guaranteed token tracking - no untracked API calls
- Fail-safe fallback if frontend has issues
- Observable warnings when things go wrong
- Easy to monitor and fix session creation problems

#### Best Practices

**Frontend Development:**
- ALWAYS call `ensureActiveSession()` before AI operations
- Pass the returned `session_id` to all API functions
- Don't create sessions manually - use the context method
- Handle session creation errors gracefully with try-catch

**Monitoring:**
- Watch for "Untracked Session" entries in session dashboard
- These indicate places where `session_id` wasn't passed
- Investigate and fix the source of missing session IDs
- Should be extremely rare in production

**Testing:**
- Verify session_id is passed to all AI functions
- Test error cases (network failures, etc.)
- Ensure fallback sessions are created when needed
- Check that no tokens are lost in edge cases

### 15.10 Pre-Generation Session Saving

**Added:** 2026-02-08

Users can now save sessions **before generating any copy**. This allows you to save your project configuration, input fields, and settings without having to click "Generate" first.

#### How It Works

**Automatic Session Creation:**
- As soon as you fill in the required fields (Project Description, Product/Service Name, and either Business Description or Original Copy), a session is automatically created in the background
- This session is linked to your work immediately, even before you generate any output
- The session ID is displayed in the header badge

**Save Button Availability:**
- The "Save Session" button (bookmark icon) appears in the left floating action bar as soon as the required fields are filled
- No need to generate copy first - you can save your configuration immediately
- Perfect for saving work in progress or creating templates for later use

**What Gets Saved:**
- All input fields and their values
- Selected tone, style, and optional features
- Customer assignment (if applicable)
- Brand voice selection
- All configuration settings
- Template selection (if loaded)

**What's NOT Required:**
- Generated copy results
- Content scores
- SEO metadata
- Alternative versions

#### Use Cases

**1. Save Work in Progress:**
```
Scenario: You're filling out a complex project but need to leave before generating
Action: Fill required fields → Click Save Session button
Result: Your configuration is saved and can be loaded from Saved Outputs later
```

**2. Create Configuration Templates:**
```
Scenario: You want to save a project setup to reuse later with different content
Action: Set up all fields → Save session → Load it later and just update the content
Result: Consistent configuration across multiple content pieces
```

**3. Collaborate on Setup:**
```
Scenario: You're setting up a project for someone else to generate
Action: Configure all settings → Save session → Share the saved output ID
Result: Other team members can load your configuration and generate
```

**4. Experiment with Configurations:**
```
Scenario: You want to try different setups before committing to generation
Action: Create multiple saved sessions with different configurations
Result: Compare setups without wasting credits on generation
```

#### Technical Implementation

**Auto-Creation Logic:**
- A `useEffect` hook monitors the form state
- When `isFormComplete()` returns true and no session exists, a session is created
- Session creation is silent and doesn't interrupt the user's workflow
- If session creation fails, the user can still work - session will be created on save

**Save Handler Enhancement:**
- The save handler now checks if a session exists
- If no session, it creates one before saving to Saved Outputs
- All form data is preserved, including transient UI state (cleaned before storage)
- Session is immediately available in Dashboard → Sessions tab

**Button Visibility:**
- Changed from `hasSession={!!formState.sessionId && !!formState.copyResult?.generatedVersions?.length}`
- To: `hasSession={!!formState.sessionId || isFormComplete()}`
- Button appears when EITHER a session exists OR the form is complete

#### Benefits

**For Users:**
- Save work anytime - no need to generate first
- Preserve configurations without spending credits
- Resume work exactly where you left off
- Create reusable project templates

**For Workflow Efficiency:**
- Separate configuration from generation
- Experiment with setups risk-free
- Share configurations with team members
- Build a library of proven project setups

**For Data Management:**
- All sessions tracked in one place
- Clear audit trail of what was configured when
- Easy to find and reload saved configurations
- No lost work due to browser crashes or accidental navigation

#### Notes

- Sessions created before generation will show "0 credits used" until generation occurs
- Pre-generation sessions appear in Dashboard → Saved Outputs
- Session names are auto-generated based on Project Description
- You can save multiple configurations before deciding which to generate

### 9.10 Technical Details

#### Database Structure

**Table: `pmc_copy_sessions`**
- Stores session metadata and references
- Links to user and customer records
- Includes auto-generated session name

**Table: `pmc_user_tokens_used`**
- Records individual API calls
- Links to session via `session_id` column
- Tracks tokens, cost, model, and operation type

**View: `pmc_session_token_summary`**
- Aggregates token usage per session
- Computed view for fast reporting
- Includes all summary statistics

#### Session Name Generation

Session names are generated using this function:

```typescript
generateSessionName(
  outputType?: string,      // e.g., "blog-post", "email"
  briefDescription?: string, // User's content description
  createdAt: Date           // Session creation time
): string
```

**Logic:**
1. Format content type (capitalize, clean up)
2. Use first 50 characters of brief description
3. Add ellipsis if description is longer
4. Format date as "Mon DD, YYYY"
5. Combine: `{ContentType} - {Description} - {Date}`
6. Fallback if no description: `Session - {Date} {Time}`

### 9.11 Best Practices

**For Users:**
- Always fill in "Brief Description" for better session names
- Review session info to understand your token usage
- Use consistent naming in Project Description for easier tracking

**For Admins:**
- Regularly review session dashboard to monitor usage
- Look for patterns in high-cost sessions
- Use session data to optimize prompts and workflows
- Export session data for detailed analysis

**For Development:**
- Always pass session ID to API calls
- Handle session creation errors gracefully
- Include session context in error logs
- Monitor session creation and cleanup jobs

### 9.12 Future Enhancements

Potential future features for session tracking:

- **Session Filtering** - Filter by user, customer, date range, content type
- **Cost Alerts** - Notifications when sessions exceed cost thresholds
- **Session Comparison** - Compare token usage across similar sessions
- **Export Options** - Export session data as CSV or JSON
- **Session Replay** - View the complete sequence of operations
- **Cost Optimization** - Suggestions for reducing token usage
- **Session Analytics** - Graphs and charts of usage patterns
- **Budget Limits** - Per-user or per-customer token budgets

---

## 16. Legacy Features (DEPRECATED)

**Status:** These features are deprecated and maintained only for backward compatibility. They may be removed in future versions.

**Last Updated:** 2025-12-19

---

### 16.1 Legacy Pipeline (Deprecated)

**Status:** ⚠️ DEPRECATED - Still functional but not recommended for new projects

**What it was:** The original AI pipeline used for content generation before the introduction of CopyZap+ Enhanced Pipeline.

**Current behavior:**
- Still available as a selectable option in AI Engine Mode
- Uses single-pass generation without input expansion or editorial refinement
- Labeled as "Legacy" in the interface with Cpu (computer chip) icon
- Blue color when selected

**Why deprecated:**
- CopyZap+ Enhanced Pipeline provides significantly better quality output
- Lacks strategic insights and input enrichment
- No editorial refinement pass
- Does not leverage advanced copywriting frameworks

**Migration path:**
- Switch to CopyZap+ Enhanced Pipeline for improved results
- Use "Both" mode to compare outputs side-by-side
- CopyZap+ provides 3-step pipeline with superior quality

**Technical notes:**
- Still maintained in codebase for backward compatibility
- Existing templates that reference Legacy mode continue to work
- No plans for removal in near term, but no active development

---

### 16.2 XXX Placeholder (Deprecated)

**Status:** ⚠️ DEPRECATED - Replaced by [[PLACEHOLDER]] syntax

**What it was:** The original placeholder syntax `XXX` used in templates to mark content that needs to be filled in.

**Current behavior:**
- System still detects `XXX` for backward compatibility
- Automatically converts to `[[PLACEHOLDER]]` format internally
- Warning displayed when old syntax is detected

**Why deprecated:**
- `XXX` is not descriptive and can appear in legitimate content
- New `[[PLACEHOLDER]]` syntax is more explicit and readable
- Supports named placeholders like `[[COMPANY_NAME]]` or `[[PRODUCT_NAME]]`
- Better visual distinction in templates

**Migration path:**
- Replace all `XXX` instances with `[[PLACEHOLDER]]`
- Use descriptive placeholder names: `[[YOUR_COMPANY]]`, `[[TARGET_AUDIENCE]]`, etc.
- System will warn you when old syntax is detected

**Technical notes:**
- Detection happens in placeholder detection utility
- Backward compatibility maintained indefinitely
- No breaking changes planned

---

### 16.3 Removed Features (No Longer Available)

**These features have been completely removed from the codebase:**

#### Old Comparison Modal (Removed)
- **Removed:** v7.0
- **Replacement:** Compare All Outputs now creates an output card instead of a modal
- **Reason:** Output cards are more flexible, exportable, and integrate better with workflow

#### Static Voice Style Presets (Removed)
- **Removed:** v6.5
- **Replacement:** Brand Voice System with AI extraction and custom voices
- **Reason:** Brand Voice System provides more flexibility and personalization

#### Single-Mode Generation (Removed)
- **Removed:** v7.2
- **Replacement:** New 3-mode system (Quick, Standard, Advanced)
- **Reason:** Old binary Smart/Expert modes didn't provide enough granularity

---

### 16.4 Type Definitions & Props (Inconsistencies)

**These exist in the codebase for backward compatibility but should not be used in new code:**

#### Deprecated Type Properties:
```typescript
// OLD - Deprecated
interface GeneratedCopy {
  comparedContent?: string;  // DEPRECATED - use comparison output cards instead
  legacyScore?: number;      // DEPRECATED - replaced by structured scoring
}
```

#### Unused Component Props:
- Some components have props that are no longer actively used
- Maintained for backward compatibility with existing templates
- These will be removed in a future major version update

**Best Practice:**
- Ignore deprecated props when creating new components
- Don't rely on deprecated type definitions
- Use current documented interfaces

---

### 16.5 Database Columns (Legacy)

**These database columns exist but are deprecated:**

#### `pmc_saved_outputs` table:
- `comparedContent` - DEPRECATED, use separate comparison output cards
- `legacyMetadata` - DEPRECATED, replaced by structured metadata columns

#### `pmc_templates` table:
- `oldVersionFormat` - DEPRECATED, automatically migrated to new format on load

**Migration:**
- These columns are automatically handled by the system
- No user action required
- Data is preserved for historical outputs

---

### 16.6 Future Deprecation Notices

**Features that may be deprecated in future versions:**

#### Under Review:
- **Legacy Pipeline** - May be fully removed once CopyZap+ is proven stable across all use cases
- **Manual Template Categories** - May be replaced with AI-powered auto-categorization
- **Static Prefills** - May be replaced with dynamic suggestion system

**Timeline:**
- No immediate deprecation planned
- 6-month minimum notice before removal
- Migration guides will be provided
- All existing data will be preserved

---

**How to Handle Legacy Features:**

1. **For New Projects:** Always use current recommended features (CopyZap+, Brand Voices, [[PLACEHOLDER]] syntax)
2. **For Existing Projects:** Continue using legacy features if they work, but plan migration path
3. **For Developers:** Avoid building on deprecated features; use documented current APIs
4. **For Templates:** Update templates to use new syntax and features when convenient

---

---

## 17. BRAND VOICE SYSTEM – COMPLETE USER GUIDE

### 17.1 What Is a Brand Voice?

A **brand voice** is the consistent personality and style that comes through in all your written communications. It encompasses:

- **Tone**: The emotional character (professional, friendly, bold, playful)
- **Personality Traits**: Core characteristics (trustworthy, innovative, warm, authoritative)
- **Vocabulary**: Preferred words and phrases that resonate with your brand
- **Sentence Structure**: Short and punchy vs. long and flowing
- **Punctuation Style**: Use of contractions, exclamation marks, Oxford commas
- **CTA Style**: How you encourage action (direct, subtle, enthusiastic)

#### Why It Matters

For small agencies, freelancers, and businesses managing multiple clients:

- **Consistency**: Ensure every piece of content sounds like it came from the same brand
- **Efficiency**: Stop rewriting content to "make it sound right"
- **Scalability**: Onboard new team members faster with documented voice guidelines
- **Client Satisfaction**: Deliver on-brand content on the first draft

#### How CopyZap Uses Brand Voice

When you apply a brand voice to generated copy, the AI automatically:
- Adopts the specified tone and personality
- Uses preferred vocabulary and avoids forbidden terms
- Matches sentence length and structure preferences
- Applies punctuation rules consistently
- Formats CTAs in the specified style

---

### 17.2 Brand Voice Concepts in CopyZap

#### Customer vs Brand Voice

**Customer**: A client or project you're creating content for. Think of this as a container for all brand-related information.

**Brand Voice**: The specific writing style for that customer. One customer can have multiple brand voices:
- **Example**: A hotel might have:
  - "Luxury Suite Voice" (formal, elegant) for premium offerings
  - "Social Media Voice" (friendly, casual) for Instagram posts
  - "Corporate Voice" (professional, trustworthy) for B2B communications

#### How Brand Voices Are Stored

Brand voices are saved in your CopyZap database and linked to specific customers. They're reusable across all projects for that customer.

#### Where Brand Voice Can Be Used

- **Copy Maker**: Main copy generation interface
- **Quick Prompt Wizard**: Streamlined copy creation
- **Alternative Copy Generation**: Apply brand voice to alternatives
- **Content Modification**: Maintain voice when editing

#### Basic vs Advanced Controls

**Basic Controls**:
- Personality traits
- Tone style
- Sentence style
- Preferred vocabulary
- Forbidden terms
- CTA style
- Punctuation rules

**Advanced Controls** (Fine-Grained):
- Sentence length preference (short, medium, long, varied)
- Rhythm & cadence (staccato, smooth, energetic, calm)
- Formality level (1-5 scale)
- Emotional tone (multiple selections)
- Brand persona (mentor, friend, expert, leader, storyteller, coach, analyst, luxury concierge)
- Point of view (first person, second person, third person, brand voice)
- Figurative vs literal language
- Depth of detail (minimal, balanced, detailed, highly explanatory)
- Vocabulary complexity (simple, basic professional, sophisticated, highly intellectual)
- Content structure rules (short paragraphs, bullet lists, rhetorical questions)
- Allowed and forbidden content elements

---

### 17.3 Getting Started – First Brand Voice in 5 Minutes

#### Create a Customer

**Step 1**: Navigate to your Dashboard
**Step 2**: Click on **"Customers"** in the menu
**Step 3**: Click **"Add New Customer"**
**Step 4**: Fill in:
- **Customer Name** (required): e.g., "Sunset Resort & Spa"
- **Description** (optional): e.g., "Luxury beachfront resort in Mexico"

**Step 5**: Click **"Save"**

You now have a customer container for brand voices.

#### Create a Brand Voice (Basic Flow)

**Step 1**: From the Customer detail page, click **"Add Brand Voice"**

**Step 2**: Enter a **Brand Voice Name**:
- Good: "Luxury Guest Communications"
- Good: "Social Media Casual"
- Avoid: "Voice 1" (not descriptive)

**Step 3**: Choose a creation method (for quick start, use **"Use Preset"**):
- Select a preset like **"Luxury / Premium"** or **"Friendly & Warm"**

**Step 4**: Review the auto-filled fields:
- Personality Traits: sophisticated, exclusive, refined
- Tone Style: formal-elegant
- Sentence Style: flowing-descriptive
- Preferred Vocabulary: curated, bespoke, exclusive, refined
- Forbidden Terms: cheap, discount, deal, bargain

**Step 5**: Click **"Save Brand Voice"**

Done! Your brand voice is ready to use.

---

### 17.4 Creating Brand Voices – All Methods

#### Method A – From Scratch (Manual Definition)

**When to use**: You have clear brand guidelines or want complete control.

**Fields Explanation**

**Brand Voice Name**
Clear, descriptive name for internal organization.
- Example: "Tech Startup - Product Pages"
- Example: "Law Firm - Client Communications"

**Description**
1-2 sentence summary of when/where to use this voice.
- Example: "Professional, empathetic voice for patient-facing wellness content"

**Personality Traits**
4-6 adjectives that describe the brand's character.
- Examples: trustworthy, innovative, warm, professional, playful, authoritative

**Tone Style**
The overall emotional feel.
- Examples: conversational-warm, formal-professional, casual-playful, confident-energetic

**Sentence Style**
How sentences should be structured.
- Examples: short-punchy, flowing-descriptive, clear-concise, dynamic-impactful

**Preferred Vocabulary**
8-12 words or phrases the brand commonly uses.
- Examples: transform, empower, innovative, journey, community, solution

**Forbidden Terms**
5-8 words or phrases to avoid.
- Examples: cheap, outdated, problem, difficult, complicated

**CTA Style**
How calls-to-action should be framed.
- **Direct Action**: "Buy Now", "Start Today"
- **Subtle Invitation**: "Discover More", "Explore Our Collection"
- **Friendly Invitation**: "Let's Get Started", "Come Join Us"
- **Enthusiastic Action**: "Grab Your Spot!", "Don't Miss Out!"
- **Consultative Invitation**: "Schedule a Consultation", "Let's Discuss"
- **Urgent Action**: "Limited Time!", "Act Now"

**Punctuation Rules**:
- **Use Oxford Comma**: Yes/No
- **Prefer Short Sentences**: Yes/No
- **Max Sentence Length**: 10-40 words
- **Use Contractions**: Yes/No (we're vs. we are)
- **Exclamation Frequency**: Rare / Moderate / Frequent

**Complete Example: Friendly Marketing Agency**

```
Brand Voice Name: Agency Social Voice
Description: Friendly, approachable voice for social media and blog content

Personality Traits:
- friendly
- helpful
- creative
- authentic
- enthusiastic

Tone Style: conversational-warm
Sentence Style: natural-flowing

Preferred Vocabulary:
- amazing, community, together, grow, transform,
- discover, elevate, authentic, creative, partner

Forbidden Terms:
- corporate, synergy, leverage, utilize, paradigm

CTA Style: friendly-invitation

Punctuation Rules:
- Use Oxford Comma: Yes
- Prefer Short Sentences: No
- Max Sentence Length: 25
- Use Contractions: Yes
- Exclamation Frequency: Moderate
```

**Result**: Social media post using this voice:
> "We're so excited to share this with you! Our new community feature is here, and it's designed to help you connect, grow, and create together. Come check it out and let us know what you think!"

---

#### Method B – From Sample Text ("Analyze Existing Copy")

**When to use**: You have existing content that captures the brand voice perfectly.

**Workflow**

**Step 1**: Open Brand Voice modal → Select **"AI Generate"** tab

**Step 2**: Choose **"Option 2: Paste Any Copy"**

**Step 3**: Paste 100-10,000 characters of existing brand content
(More text = more accurate analysis)

**Step 4**: Click **"Analyze & Generate Brand Voice"**

**Step 5**: AI analyzes and fills in:
- Personality traits
- Tone and sentence style
- Vocabulary patterns
- Punctuation preferences
- Advanced style controls

**Step 6**: Review, adjust if needed, and **Save**

---

#### Method C – From Generated Output (NEW FEATURE)

**When to use**: You generated copy that perfectly captures the brand, and you want to save that style.

**Workflow**

**Step 1**: Generate copy in Copy Maker with your desired tone and style

**Step 2**: Review the generated output and confirm it matches the brand voice you want

**Step 3**: Click **"Save as Brand Voice"** button in the output card

**Step 4**: The Brand Voice modal opens with:
- The generated text pre-filled in the analysis field
- AI automatically analyzing the style

**Step 5**: AI suggests:
- Tone and personality traits
- Typical vocabulary and phrases
- Sentence length & rhythm preferences
- Punctuation style
- Emotional tone
- Formality level

**Step 6**: Enter a **Brand Voice Name**, review suggestions, adjust if needed

**Step 7**: Click **"Save Brand Voice"**

---

#### Method D – From Website URL Scanning

**When to use**: Extract brand voice directly from a company's website.

**Workflow**

**Step 1**: Open Brand Voice modal → Select **"AI Generate"** tab

**Step 2**: Choose **"Option 3: Scan Website for Brand Voice"**

**Step 3**: Enter website URL
(AI will analyze homepage and about page)

**Step 4**: Click **"Scan & Generate Brand Voice"**

**Step 5**: AI extracts brand voice from website content

**Step 6**: Review, refine, and **Save**

---

#### Method E – Use Preset Templates

**When to use**: Quick start with industry-standard voice templates.

**Available Presets**

1. **Professional & Authoritative**
   - For: Established businesses, B2B services, consulting firms
   - Traits: professional, reliable, transparent, competent, trustworthy, expert, authoritative

2. **Friendly & Conversational**
   - For: Community-focused brands, service businesses, approachable companies
   - Traits: friendly, approachable, warm, genuine, helpful, conversational

3. **Bold & Energetic**
   - For: SaaS companies, tech startups, innovation-focused brands
   - Traits: innovative, bold, disruptive, ambitious, visionary, energetic

4. **Minimalist & Clear**
   - For: Design-focused brands, tech products, modern services
   - Traits: clear, focused, simple, direct, essential, minimal

5. **Creative & Playful**
   - For: Creative agencies, lifestyle brands, youth-focused products
   - Traits: playful, energetic, creative, fun, quirky, imaginative

6. **Persuasive & Urgent**
   - For: E-commerce, online stores, product-focused businesses, sales-driven brands
   - Traits: persuasive, benefit-focused, urgent, value-driven, customer-centric, action-oriented

---

### 17.5 Brand Voice Options & Controls – Complete Reference

#### Core Fields

**Brand Voice Name**
- **What it controls**: Internal organization and identification
- **How to use**: Be descriptive and specific
- **Examples**:
  - Good: "Website Professional Voice"
  - Good: "Instagram Casual Voice"
  - Avoid: "Voice 1" (not descriptive)

**Associated Customer**
- **What it controls**: Links brand voice to a specific client/project
- **How to use**: Select from your customer list
- **Note**: One customer can have multiple brand voices

**Short Brand Summary**
- **What it controls**: Context for when to use this voice
- **Example**: "Formal voice for investor communications and annual reports"

**Core Personality Traits**
- **What it controls**: The fundamental character of the brand
- **How it influences copy**: Shapes word choice, tone, and approach
- **Examples**:
  - Bold, innovative → "We're revolutionizing the industry"
  - Calm, trustworthy → "We provide reliable, time-tested solutions"

**Tone**
- **What it controls**: Emotional character of writing
- **Options**: Professional, Friendly, Bold, Authoritative, Playful, Inspirational, Warm, Neutral
- **Example comparison** (Same message, different tones):
  - Professional: "Our platform increases productivity by 40%"
  - Friendly: "We'll help you get 40% more done—and you'll actually enjoy it!"
  - Bold: "Boost your productivity by 40%. Starting now."

**Writing Style Notes**
- **What it controls**: Specific writing patterns and preferences
- **Examples**:
  - "Use short, punchy sentences. Never exceed 15 words."
  - "Tell stories. Begin with a customer challenge, show the transformation."
  - "Lead with benefits. Save features for later."

**Words To Use (Preferred Vocabulary)**
- **What it controls**: Brand-specific terminology that should appear regularly
- **How it influences copy**: AI prioritizes these words when appropriate
- **Example**: A wellness brand might prefer:
  - "balance, harmony, nourish, restore, mindful"
  - Result: "Find your balance with our mindful wellness programs"

**Words To Avoid (Forbidden Terms)**
- **What it controls**: Terms that conflict with brand positioning
- **How it influences copy**: AI actively avoids these words
- **Example**: A premium brand might forbid:
  - "cheap, discount, deal, bargain, budget"
  - This ensures: Never "Get this luxury item cheap!" ✗
  - Instead: "Acquire this exclusive piece" ✓

**Language & Locale**
- **What it controls**: Regional language variations
- **Options**: US English, UK English, Australian English, Canadian English, etc.
- **Example differences**:
  - US: "color, optimize, analyze"
  - UK: "colour, optimise, analyse"

---

### 17.6 Brand Voice Usage Options in Copy Maker

#### Use Brand Voice (Toggle)

**When OFF**:
- AI uses form-level tone and style settings
- More flexibility, less consistency

**When ON**:
- AI applies complete brand voice profile
- Overrides form-level tone settings
- Ensures brand consistency

**Example** (Same prompt, toggle OFF vs ON):

**Prompt**: "Write homepage hero for project management tool"

**Toggle OFF** (using form "Professional" tone):
> "Manage Your Projects Efficiently
>
> Our platform helps teams stay organized and meet deadlines. Track progress, assign tasks, and collaborate in real-time."

**Toggle ON** (using "Tech Startup Energetic" brand voice):
> "Transform How Your Team Ships Products
>
> Stop drowning in spreadsheets. Our platform empowers teams to move fast, stay aligned, and ship what matters. Join 500+ companies accelerating their growth."

---

#### Brand Voice Selection Dropdown

**What it does**: Choose which brand voice to apply (if customer has multiple)

**Example scenario**: Marketing Agency Client

Customer: "BrightTech Solutions"
Brand Voices:
1. "Website Professional" → Corporate site pages
2. "Blog Conversational" → Educational content
3. "Social Media Casual" → Twitter/LinkedIn posts
4. "Sales Email Direct" → Outbound communications

You select different voices based on the content type you're creating.

---

### 17.7 Advanced / Fine-Grained Voice Controls

Access these by expanding **"Advanced Style Controls (Optional)"** when creating/editing a brand voice.

#### Sentence Length Preference

**Options**:
- Short & Punchy
- Medium
- Long & Flowing
- Varied

**What it controls**: Average sentence length and structure

**Examples** (Same content, different lengths):

**Short & Punchy** (8-12 words):
> "We solve real problems. Fast. Our AI analyzes data instantly. You get actionable insights. Make better decisions today."

**Medium** (15-20 words):
> "Our AI platform analyzes your data in real-time, providing actionable insights that help you make better decisions quickly."

**Long & Flowing** (25-35 words):
> "Our sophisticated AI platform continuously analyzes your business data in real-time, synthesizing complex patterns into clear, actionable insights that empower your team to make confident, data-driven decisions."

**Varied** (Mix of short and long):
> "Our AI changes everything. It analyzes complex data streams in real-time, identifying patterns and opportunities that would take humans weeks to discover. The result? Better decisions, faster."

---

#### Rhythm & Cadence

**Options**:
- Staccato (choppy, emphatic)
- Smooth (flowing, connected)
- Energetic (dynamic, punchy)
- Calm (gentle, measured)

**Examples** (Same concept, different rhythms):

**Staccato**:
> "Listen. Your competitors are moving fast. You need to move faster. Our tool helps. Simple as that."

**Smooth**:
> "While your competitors are accelerating their digital transformation, you have an opportunity to not just catch up, but to lead the way with our intuitive platform."

**Energetic**:
> "Ready? Your competitors are racing ahead. Time to supercharge your growth. Our platform gives you the edge. Let's go!"

**Calm**:
> "As the market evolves, we understand you need reliable tools to support your growth. Our platform provides the steady foundation you need to scale with confidence."

---

#### Formality Level (1-5 Scale)

**Scale**:
- 1 = Extremely casual (like texting a friend)
- 3 = Neutral professional
- 5 = Ultra formal (academic/legal)

**Examples** (Website hero for same product):

**Level 1 - Very Casual**:
> "Hey! Tired of juggling a million spreadsheets? Us too. That's why we built this thing. It's gonna make your life so much easier. Promise."

**Level 3 - Neutral Professional**:
> "Streamline your workflow with our intuitive platform. Manage projects, track progress, and collaborate with your team—all in one place."

**Level 5 - Very Formal**:
> "Our enterprise-grade platform facilitates comprehensive project lifecycle management, enabling organizations to optimize operational efficiency and enhance cross-functional collaboration through integrated workflow automation."

---

#### Emotional Tone (Multiple Selections)

**Available tones**:
- warm
- friendly
- inspirational
- assertive
- dramatic
- serious
- neutral
- humorous
- respectful
- empathetic

**Can select multiple**. Example: "warm + inspirational"

**Example** (Email subject lines, different emotional tones):

**Warm**:
> "We're here to help you grow 🌱"

**Assertive**:
> "Take control of your productivity—starting now"

**Inspirational**:
> "Imagine what you could achieve with the right tools"

**Empathetic**:
> "We know managing projects is hard. We're here to help."

**Neutral**:
> "New features available in your dashboard"

---

#### Brand Persona (Speaking Archetype)

**Options**:
- Mentor (wise guide, teaching)
- Friend (casual peer, supportive)
- Expert (authoritative specialist)
- Leader (visionary, commanding)
- Storyteller (narrative-driven)
- Coach (motivational, action-oriented)
- Analyst (data-focused, logical)
- Luxury Concierge (refined, service-oriented)

**Examples** (Landing page intro, different personas):

**Mentor**:
> "Over two decades, we've learned what truly matters in business growth. Let us share those insights with you and help you avoid the costly mistakes we see companies make every day."

**Friend**:
> "Look, we've been in your shoes. The endless to-do lists, the late nights, the feeling that you're always behind. That's exactly why we built this—to make your life easier."

**Expert**:
> "Based on analyzing 10 million data points across 50,000 companies, we've identified the exact factors that drive sustainable growth. Our platform implements these proven strategies for you."

**Leader**:
> "The future of work is here. Those who embrace it now will dominate their markets. Those who wait will be left behind. We're building that future. Join us."

**Storyteller**:
> "Sarah was drowning in spreadsheets. Every morning started with three hours of data entry. Then she discovered our platform. Now those hours are spent growing her business. This could be your story too."

**Coach**:
> "You've got this! The tools are here. The strategy is clear. All you need to do is take that first step. Ready? Let's make it happen together!"

**Analyst**:
> "The data reveals a clear pattern: companies using our platform see an average 43% reduction in project delays and a 67% improvement in team collaboration metrics. The correlation is statistically significant."

**Luxury Concierge**:
> "We are delighted to present our exclusive service, thoughtfully designed for discerning professionals who expect nothing less than excellence. Every detail has been carefully curated for your comfort and success."

---

### 17.8 Managing Brand Voices

#### Editing Brand Voices

**How to open**: Customer Detail → Brand Voices → Click Edit icon

**Safe to change**:
- Brand Voice Name (internal reference only)
- Description
- Personality traits
- Vocabulary preferences
- Punctuation rules
- Advanced style controls

**Consider the impact**:
- Changing tone/style dramatically will affect all future content
- Existing generated content won't retroactively change

**Recommendation**: If making major changes, consider duplicating the voice first and creating a variant.

#### Duplicating Brand Voices

**Use cases**:
- Create A/B variations for testing
- Develop channel-specific versions (web vs. email vs. social)
- Maintain archive of voice evolution

**How**: Currently done manually by creating a new voice with similar settings. Name clearly:
- "Website Voice v1"
- "Website Voice v2 - More Casual"

#### Deleting Brand Voices

**How**: Customer Detail → Brand Voices → Delete icon → Confirm

**What happens**:
- Brand voice is permanently removed
- Previously generated content using this voice remains unchanged
- Future generations can't use this voice
- No undo available

**Best practice**: Export or duplicate before deleting if you might need it again.

---

### 17.9 Using Brand Voices in Different Modules

#### Copy Maker

**Step-by-step**:

1. **Select Customer**: Choose customer from dropdown
2. **Select Brand Voice**: Choose which voice to apply (if multiple exist)
3. **Enter copy requirements**: Add your prompt, keywords, target audience, etc.
4. **Generate**: Click generate button

#### Quick Prompt Wizard

**How it works**: Wizard automatically selects the customer's default brand voice (if only one exists) or prompts you to choose.

#### Alternative Copy Generation

When generating alternatives, the same brand voice is maintained, ensuring consistency across all variants.

#### Content Modification

When modifying content, brand voice is preserved.

---

### 17.10 Practical Examples & Recipes

#### Example 1: Friendly Website Agency

**Use case**: Small digital agency creating website copy for diverse clients

**Brand Voice Configuration**:
```
Name: Agency Professional-Friendly
Customer: [Your Agency]

Personality Traits: professional, helpful, creative, clear, results-focused
Tone Style: professional-warm
Sentence Style: clear-conversational

Preferred Vocabulary:
• solutions, partner, transform, growth, results, proven,
• streamlined, enhance, optimize, effective

Forbidden Terms:
• cheap, quick fix, easy money, guarantee, overnight

CTA Style: consultative-invitation

Formality: 3 (neutral professional)
POV: first_person
Vocabulary Complexity: basic_professional
```

---

### 17.11 Tips, Best Practices & Common Mistakes

#### Best Practices

**1. Start with Real Samples**
Instead of guessing at brand voice, analyze 2-3 pieces of content that perfectly represent the brand. Use the "Paste Copy" analysis feature.

**2. Be Specific with Vocabulary**
Don't just list obvious words. Include:
- Industry-specific terms
- Phrases the brand uses uniquely
- Vocabulary that competitors avoid

**3. Document When to Use Each Voice**
If you have multiple voices for one customer:
```
• "Professional Voice" → Website, proposals, case studies
• "Social Voice" → Instagram, Twitter, blog comments
• "Email Voice" → Newsletters, customer communications
```

**4. Test Before Committing**
Generate 3-4 samples with your new brand voice before finalizing. Check:
- Does it sound authentic?
- Would the client approve this on first draft?
- Is it distinct from competitors?

**5. Keep Voices Updated**
Brands evolve. Review and refine voices quarterly, especially:
- After rebranding initiatives
- When entering new markets
- If content isn't performing well

**6. Use Forbidden Terms Strategically**
Don't over-restrict. Focus on terms that truly conflict with positioning:
- Luxury brand: forbid "cheap, discount, budget"
- Tech startup: forbid "traditional, legacy, old-school"
- Healthcare: forbid "quick fix, miracle, guarantee"

**7. Match Formality to Channel**
Consider different formality levels for different channels:
- Website: 4 (more formal)
- Blog: 3 (neutral)
- Social: 2 (casual)

---

#### Common Mistakes

**1. Being Too Vague**
❌ Bad: "Be professional and friendly"
✅ Good: Specific personality traits + vocabulary + sentence examples

**2. Over-Restricting Creativity**
❌ Bad: Forbidding 20+ terms, demanding exact phrases
✅ Good: Set guardrails but allow natural variation

**3. Ignoring the Audience**
Brand voice should serve your audience, not just express the brand's self-image.

**4. One Voice for Everything**
A law firm shouldn't use the same voice for:
- Legal filings (ultra-formal)
- Client emails (professional but warm)
- Social media (more accessible)

**5. Not Testing Edge Cases**
Test your brand voice with:
- Technical content (does it stay on-brand?)
- Emotional content (is it appropriate?)
- Sales content (does it convert without being pushy?)

**6. Forgetting to Update**
Brand voice isn't "set it and forget it." Update when:
- Client feedback suggests misalignment
- Market positioning changes
- New products/services launch

---

### 17.12 FAQ

#### Can I use the same Brand Voice for multiple customers?

No, brand voices are tied to specific customers. However, you can:
1. Create a new customer
2. Manually recreate the brand voice settings
3. Or copy-paste from your documented brand voice template

This is intentional—each customer should have their unique voice, even if similar.

#### Why does my output sometimes ignore my Brand Voice?

Common reasons:
1. **Brand Voice toggle is OFF**: Check that it's enabled
2. **Conflicting instructions in prompt**: If your prompt says "write casually" but brand voice is formal, you'll get mixed results
3. **Insufficient brand voice definition**: If you only set a name without traits/vocabulary, there's little for AI to work with
4. **Using "No brand voice"**: Dropdown must have a specific voice selected

#### How many Brand Voices can I create?

Unlimited. Create as many as you need per customer.

Recommended structure:
- 1-3 voices per customer (different channels/purposes)
- More than 5 per customer might be overcomplicated

#### What's the difference between Brand Voice and Tone?

**Tone** (form-level setting):
- General emotional character
- Options: Professional, Friendly, Bold, etc.
- Quick adjustment per project

**Brand Voice** (saved profile):
- Complete style system
- Includes tone + vocabulary + structure + punctuation + advanced controls
- Consistent across all projects

When brand voice is enabled, it overrides form-level tone.

#### Can I share a Brand Voice with my team?

Currently, brand voices are stored per account. To share:
1. Document the complete brand voice (see Section 17.8)
2. Team members recreate it in their account
3. Use the export format provided in this guide

#### Does Brand Voice affect SEO output?

Yes. Brand voice influences:
- Meta descriptions
- H1/H2/H3 suggestions
- URL slugs (word choice)
- OG descriptions

The SEO content will maintain brand voice while optimizing for search.

---

## 18. URL EXTRACTION & STRUCTURE DETECTION

### 18.1 Overview

The URL Extraction system allows users to analyze any webpage and automatically extract marketing copy, context, or full content structure. This feature dramatically speeds up the "improve existing copy" workflow by eliminating manual copy-pasting and preserving original content architecture.

### 18.2 Two Extraction Modes

#### 1. Analyze Context (Quick Analysis)

**Purpose:** Extract key information from a webpage to populate wizard fields

**Available In:**
- Create New mode
- Improve Copy mode

**What It Extracts:**
- Product/service description (1-2 sentences)
- Target audience (specific)
- Detected tone (Professional, Friendly, Bold, etc.)
- Pain points addressed (comma-separated)
- Key features list (max 5)
- Main benefits (max 5)
- Primary language detected

**Performance:**
- Uses GPT-4o-mini for speed
- Processes first 8,000 characters
- Results cached for 7 days
- Average response: 2-4 seconds

#### 2. Extract Copy (Full Extraction)

**Purpose:** Extract ALL marketing copy while preserving structure

**Available In:**
- Improve Copy mode only

**What It Extracts:**
- Complete marketing copy (clean Markdown)
- Language detected
- Target audience
- Pain points
- Tone/voice
- **Output Structure:** Array of section names (Hero, Features, Benefits, etc.)

**Content Processing:**
- Removes navigation, headers, footers, scripts, styles
- Preserves original order and hierarchy
- Formats as clean Markdown (# ## ### for headers)
- No HTML tags in output
- Maintains natural page flow

**Structure Detection:**
- AI analyzes page architecture
- Identifies major sections
- Returns max 8 sections
- Section names concise (1-3 words)
- Based on ## headers in extracted Markdown

**Performance:**
- Uses GPT-4o-mini
- Processes first 100,000 characters
- No caching (always fresh)
- Average response: 4-8 seconds

---

### 18.3 Structure Confirmation Modal

**When It Appears:**
- User clicks "Extract Copy" in wizard
- Analysis completes successfully
- outputStructure array returned
- Only in "Improve" mode

**What It Shows:**
- Extracted structure (detected sections)
- Default structure (Overview, Key Points, CTA)
- Radio button selection
- Visual comparison

**User Choice:**
1. **Use Extracted:** Preserves original page architecture
2. **Use Default:** Generic but functional 3-section structure

**Data Flow:**
```
URL Input → Edge Function → AI Analysis → Structure Detection →
Modal Choice → createOutputStructure() → StructuredOutputElement[] →
Form State → DraggableStructuredInput → Generation
```

---

### 18.4 Best Practices

**Good URLs to Analyze:**
- Direct product/service pages
- Landing pages with clear structure
- Competitor marketing pages
- Pages with substantial content

**Poor URLs to Analyze:**
- Home pages with minimal copy
- Navigation-heavy pages
- JavaScript-rendered SPAs
- Pages with heavy multimedia, minimal text

**Structure Decision Guide:**

**Choose Extracted When:**
- Page has 4+ clear sections
- Structure is logical and intuitive
- Sections have descriptive names
- Architecture matches your goals
- Improving existing content

**Choose Default When:**
- Detected structure has <3 sections
- Section names are vague
- Page structure is complex/confusing
- You want to simplify organization
- Creating new content from scratch

---

## 19. AI MODELS DEEP COMPARISON

### 19.1 Available Models

#### DeepSeek V3 (deepseek-chat)
- **Output Limit:** 8,192 tokens
- **Cost:** $0.27 per million input tokens, $1.10 per million output tokens
- **Best For:** Cost-effective high-volume generation
- **Quality:** Very good, comparable to GPT-4
- **Speed:** Fast
- **Use When:** Budget-conscious, high volume needed

#### GPT-4 Omni (gpt-4o)
- **Output Limit:** 16,000 tokens
- **Cost:** $2.50 per million input tokens, $10.00 per million output tokens
- **Best For:** Balanced performance and quality
- **Quality:** Excellent
- **Speed:** Moderate
- **Use When:** High-quality output for important content

#### ChatGPT-4o Latest (chatgpt-4o-latest)
- **Output Limit:** 16,384 tokens
- **Cost:** $5.00 per million input tokens, $15.00 per million output tokens
- **Best For:** Latest improvements and features
- **Quality:** Excellent, most up-to-date
- **Speed:** Moderate
- **Use When:** Need absolute latest capabilities

#### GPT-4 Turbo (gpt-4-turbo)
- **Output Limit:** 16,000 tokens
- **Cost:** $10.00 per million input tokens, $30.00 per million output tokens
- **Best For:** Fast, high-quality generation
- **Quality:** Excellent
- **Speed:** Fast
- **Use When:** Speed and quality both matter

#### GPT-3.5 Turbo (gpt-3.5-turbo)
- **Output Limit:** 4,096 tokens
- **Cost:** $0.50 per million input tokens, $1.50 per million output tokens
- **Best For:** High-volume simple content
- **Quality:** Good
- **Speed:** Very fast
- **Use When:** Simple content, tight budget, high volume

---

### 19.2 Model Selection Matrix

**By Content Type:**
- Landing Pages: GPT-4 Turbo or GPT-4o
- Blog Posts: DeepSeek V3 or GPT-4 Turbo
- Email Campaigns: GPT-4 Turbo
- Product Descriptions: DeepSeek V3 (volume) or GPT-4 Turbo (premium)
- Social Media: DeepSeek V3 or GPT-3.5 Turbo
- Ad Copy: GPT-4 Turbo or GPT-4o
- Sales Pages: GPT-4o
- Case Studies: ChatGPT-4o Latest

**By Budget:**
- Tight: DeepSeek V3 primary, GPT-3.5 for volume
- Medium: Mix DeepSeek (60%), GPT-4 Turbo (35%), GPT-4o (5%)
- High: GPT-4 Turbo primary, GPT-4o for critical

---

## 20. SPECIAL INSTRUCTIONS LIBRARY (50+ EXAMPLES)

### 20.1 Formatting & Structure

```
"Maximum 3 sentences per paragraph. Use bullet points for feature lists. Bold all product names on first mention."

"Start each section with provocative question. Include subheading every 150 words. End with clear CTA."

"Use numbered lists for steps. Bullet points for benefits. Tables for comparisons."

"Very short paragraphs (2-3 sentences max). Mobile-first formatting. Single-column layout."

"Include TL;DR at top. Use expandable sections. Add visual break every 200 words."
```

---

### 20.2 Tone & Voice

```
"Conversational but professional - like trusted advisor, not corporation."

"Bold and direct. No fluff. Every sentence must add value. Cut unnecessary words."

"Warm and empathetic. Use inclusive language. Focus on emotional connection."

"Technical but accessible. Explain jargon when first used. Assume intermediate knowledge."

"Playful with occasional humor. Use metaphors. Make complex ideas simple through analogies."
```

---

### 20.3 Language & Dialect

```
"Use British English spelling throughout. Favour, colour, organisation, etc."

"Use Viennese dialect naturally where appropriate. Reference local culture and landmarks."

"Canadian English. Multicultural references. Bilingual sensitivity (English/French)."

"Use American English. Direct and informal. Contractions encouraged."
```

---

### 20.4 Constraints & Avoidances

```
"Avoid all superlatives (best, greatest, ultimate, perfect). Use specific claims only."

"No jargon. Explain technical terms simply. Write for non-technical audience."

"Never use passive voice. Always active, direct statements."

"Avoid corporate speak (synergy, leverage, paradigm). Use plain language."

"No hype or marketing fluff. Fact-based only. Include specific metrics."
```

---

### 20.5 Content Requirements

```
"Include one compelling statistic or metric in each section."

"Reference real customer stories. Use specific examples, not generic scenarios."

"Add social proof in every section (testimonials, case studies, usage stats)."

"Include comparison to alternatives. Address objections proactively."

"Mention price or ROI in every benefits section."
```

---

### 20.6 SEO & Keywords

```
"Primary keyword 'project management' must appear in first paragraph and H1. Natural integration only."

"Include keyword variations: 'task tracking', 'team coordination', 'deadline management'. Don't force."

"Target keyword density 1-2%. Prioritize readability over keyword stuffing."
```

---

### 20.7 Call-to-Actions

```
"End every section with micro-CTA. Final section has primary CTA. Low-pressure approach."

"Multiple CTA options: Free trial, demo, consultation. Let user choose engagement level."

"No aggressive CTAs. Suggest next steps rather than demanding action."
```

---

### 20.8 Industry-Specific

**SaaS:**
```
"Focus on ROI and time savings. Include trial info. Emphasize ease of implementation."
```

**E-commerce:**
```
"Use sensory language. Benefits before features. Address shipping/returns. Include urgency naturally."
```

**Healthcare:**
```
"Empathetic and caring tone. HIPAA compliance mentions. Patient-first language. Trust-building focus."
```

**Financial Services:**
```
"Security and trust emphasis. Regulatory compliance mentions. Conservative tone. Data protection highlighted."
```

**Professional Services:**
```
"Expertise demonstrated through insights. Thought leadership angle. Case study references."
```

---

## 21. GEO & SEO OPTIMIZATION DEEP DIVE

### 21.1 What is GEO (Generative Engine Optimization)?

**GEO** optimizes content for AI-powered search engines and chat interfaces (ChatGPT, Perplexity, Google AI Overviews, Bing Chat).

**Key Difference:**
- **SEO:** Optimize for traditional search engines (keyword matching, backlinks)
- **GEO:** Optimize for AI engines (citability, structure, factual clarity)

---

### 21.2 GEO Score Components

**1. Citation-Friendliness (0-100)**
- Quotable statements present
- Facts clearly stated
- Attribution quality
- Standalone comprehensibility

**2. Structure & Scanability (0-100)**
- Clear section headers
- Descriptive headings
- Bullet point usage
- Visual hierarchy

**3. Factual Clarity (0-100)**
- Specific information
- Verifiable claims
- No vague statements
- Measurable data included

**4. AI-Friendly Formatting (0-100)**
- TL;DR summaries
- List formatting
- Clear hierarchies
- Scannable structure

---

### 21.3 Implementing GEO

**Enable "Enhance for GEO" Feature:**
- Adds TL;DR summary at top
- Structures content for AI parsing
- Includes clear, quotable statements
- Uses scannable formatting

**GEO Best Practices:**
- Start with concise summary
- Use descriptive headers
- Include specific data/metrics
- Format key points as lists
- Make statements independently quotable
- Avoid ambiguous language
- Use structured data when possible

---

### 21.4 SEO Metadata Generation

**URL Slugs:**
- Lowercase, hyphenated
- Keyword-rich
- Readable and descriptive
- 3-5 words typical

**Meta Descriptions (~155 chars):**
- Primary keyword included
- Compelling call-to-action
- Benefit-focused
- Within Google's limit

**H1 Headings:**
- Primary keyword included
- Benefit/transformation focused
- Compelling and clear
- 50-70 characters ideal

**H2/H3 Headings:**
- Keyword variations
- Section-appropriate
- Benefit-oriented
- Scannable

**OG Tags (Social Sharing):**
- Optimized for social platforms
- 60-90 characters for titles
- 155-200 for descriptions
- Compelling for clicks

---

## 22. SAVED TEMPLATES & PREFILLS ARCHITECTURE

### 22.1 Database Structure

**Templates Table:**
- ID, User ID, Customer ID
- Template Name, Description
- Complete Form State (JSON)
- Mode (Create/Improve)
- Created/Updated timestamps

**Prefills Table:**
- ID, User ID
- Field Name
- Prefill Name
- Value (text)
- Created timestamp

---

### 22.2 Template Storage

**What's Saved:**
- All 40+ input field values
- Mode selection
- AI model choice
- Tone, word count, structure settings
- SEO/GEO configurations
- Special instructions
- Output structure definitions
- All advanced settings
- Brand Voice selection

**NOT Saved:**
- Generated output content
- Customer selection (saved separately)
- Brief/Project description fields

---

### 22.3 Template Management

**Creating Templates:**
1. Fill form completely
2. Click "Save as Template"
3. Enter descriptive name
4. Add optional description
5. Template saved to database

**Loading Templates:**
1. Click "Load Template"
2. Browse saved templates
3. Select template
4. All fields populate instantly
5. Adjust as needed
6. Generate

**Template Best Practices:**
- Descriptive naming: "SaaS Landing - B2B Professional"
- Add use case in description
- Test templates periodically
- Update based on results
- Delete underperformers

---

### 22.4 Prefill System

**Field-Level Reusability:**
- Save individual field values
- Reuse across different contexts
- Maintain consistency

**Common Prefill Uses:**
- Brand values (company-wide)
- Standard company descriptions
- Target audience profiles
- Special instructions (brand guides)

**Creating Prefills:**
1. Fill field with reusable value
2. Click "Save as Prefill"
3. Name descriptively
4. Access from dropdown on any field

---

## 23. OPTIONAL FEATURES COMPREHENSIVE GUIDE

### 23.1 Smart Mode vs Expert Mode (Optional Features)

**Smart Mode:**
- Shows 3 core toggles only:
  - Humanize Output
  - Retry if Too Short
  - Enforce Word Count
- "Show Advanced Options" toggle reveals all

**Expert Mode:**
- All options visible by default
- Full control immediately

---

### 23.2 Feature Cost Impact Matrix

**Very Low Cost:**
- Generate GEO Score
- Enhance for GEO
- Little Word Count Mode
- Force Keyword Integration

**Low Cost:**
- Generate Content Scores
- FAQ Schema Generation
- Content Modification (single)

**Medium Cost:**
- SEO Metadata (2 variants)
- Generate Alternative (each)
- Voice Style (each)

**High Cost:**
- SEO Metadata (5 variants each)
- Multiple Alternatives (3+)
- Many Voice Styles (5+)

---

### 23.3 Recommended Feature Combinations

**Minimal Setup (Speed Priority):**
- Output Structure: NO
- SEO Metadata: NO
- Scores: NO
- Alternatives: NO
- Voice Styles: NO

**Standard Setup (Balanced):**
- Output Structure: IF COMPLEX
- SEO Metadata: YES (2 variants)
- GEO Enhancement: YES
- Scores: NO (initially)
- Alternatives: NO (initially)

**Premium Setup (Quality Priority):**
- Output Structure: YES (if applicable)
- SEO Metadata: YES (3-5 variants)
- GEO Enhancement: YES (with TL;DR)
- Scores: YES
- Alternatives: 2-3
- Voice Styles: Test 2-4

---

## 24. BEST PRACTICES COMPREHENSIVE

### 24.1 Getting Started Right

**First-Time Users - Day 1:**
- Use Quick Prompt Wizard
- Answer all 3 questions thoroughly
- Use "Apply Only" to review
- Study AI-generated configuration
- Generate first content

**Week 1 Focus:**
- Save successful configurations
- Create 2-3 core templates
- Start prefill library
- Establish naming conventions

---

### 24.2 Field-Level Excellence

**Business Description:**
- 100-200 words minimum
- Be specific about what you do
- Identify exact target market
- Explain problems you solve
- Clarify your differentiation

**Target Audience:**
- Include role/title specifics
- Note company size/type
- Mention technical sophistication
- Describe current pain state
- Indicate decision authority

**Special Instructions:**
- Be extremely specific
- Use bullet points for clarity
- Prioritize most important rules
- Give examples when helpful
- Explain "why" if not obvious

---

### 24.3 Generation Workflow

**The Efficient Workflow:**
1. Base Generation (minimal features)
2. Review Base Output
3. Selective Enhancement
4. Finalize

**What NOT to Do:**
- Don't generate everything at once
- Don't enable all features by default
- Don't skip review before enhancing

---

### 24.4 Template Strategy

**Building Your Library:**
1. Most frequent content type first
2. Client-specific templates
3. Industry-standard templates
4. Emergency quick templates

**Template Naming:**
Format: `[Content Type] - [Audience] - [Tone]`

Examples:
- "Landing Page - B2B - Professional"
- "Email Campaign - Consumer - Friendly"
- "Product Description - Technical - Detailed"

---

## 25. OUTPUT SYSTEM DEEP DIVE

### 25.1 Card-Based Architecture

**Every Content Card Contains:**

**Header:**
- Content Type Badge
- Word Count (actual vs target)
- Timestamp
- Source Indicator

**Body:**
- Full content with markdown
- Quality indicators
- Copy to Clipboard button
- Copy HTML button

**Footer - Action Buttons:**
- Generate Alternative Copy
- Apply Voice Style
- Generate Score
- Modify Content
- Generate FAQ Schema

**Metadata:**
- Quality Scores
- SEO Metadata
- GEO Scores
- Applied Persona

---

### 25.2 Content Threading

**Relationship Tree Example:**
```
Generated Copy (Original)
├── Alternative Copy 1
│   ├── Restyled (Alex Hormozi)
│   └── Modified ("make shorter")
├── Alternative Copy 2
│   └── Restyled (Seth Godin)
└── Restyled (Steve Jobs)
    └── Modified ("add pricing")
```

**Visual Indicators:**
- Source Badge (shows parent)
- Type Badge (relationship type)
- Timestamp (generation order)
- Thread Lines (visual connections)

---

### 25.3 On-Demand Enhancement Philosophy

**Traditional Tools:**
Generate → Get Everything → Want Changes → Regenerate Everything

**CopyZap:**
Generate Base → Review → Enhance Selectively → Keep Building

**Benefits:**
- Efficient (generate only what you need)
- Cost-effective (pay for what you use)
- Fast (surgical enhancements)
- Preservative (keeps all versions)

---

## 26. RECOMMENDED DEFAULT SETTINGS

### 26.1 Universal Defaults

**AI Model:** DeepSeek V3
**Language:** English
**Tone Level:** 5 (Moderate)
**Generate SEO:** YES (if web content, 1-2 variants)
**Generate Scores:** NO (initially)
**Generate GEO:** YES (future-proofing)

---

### 26.2 By Content Type

**Landing Page Hero:**
- Model: GPT-4 Turbo
- Word Count: 150
- Tone: Persuasive (Level 6-7)
- Structure: H1, Problem, Solution, CTA
- SEO: YES (2-3 variants)
- GEO: YES

**Blog Post (1200 words):**
- Model: DeepSeek V3
- Word Count: 1200
- Tone: Conversational (Level 5)
- Structure: Intro, 3x H2 sections, Conclusion
- SEO: YES (full metadata)
- GEO: YES

**Email Campaign:**
- Model: GPT-4 Turbo
- Word Count: 100-150
- Tone: Friendly (Level 6)
- Structure: None (natural flow)
- SEO: NO
- Scores: YES (quality check)

**Product Description:**
- Model: DeepSeek V3 or GPT-4 Turbo
- Word Count: 100-150
- Tone: Persuasive (Level 5-6)
- Structure: H1, Problem, Solution, Features, CTA
- SEO: YES
- GEO: YES

**Ad Copy:**
- Model: GPT-4 Turbo
- Word Count: Custom (strict limits)
- Tone: Persuasive (Level 7)
- Prioritize Word Count: YES
- Little Word Count Mode: YES
- Scores: YES

---

### 26.3 By Experience Level

**Beginners (Week 1):**
- Model: DeepSeek V3
- Word Count: Medium
- Tone: Friendly (Level 5)
- Structure: None initially
- SEO/GEO: NO initially
- Scores: YES (learning)

**Intermediate (Month 2-3):**
- Mix DeepSeek and GPT-4 Turbo
- Use structure for complex content
- Enable SEO/GEO based on type
- Special Instructions: 3-5 rules
- Template library: 5-10 templates

**Advanced (Month 4+):**
- Strategic model selection
- 15+ specialized templates
- Extensive prefill library
- Detailed special instructions
- Multi-model testing

---

### 26.4 By Budget

**Tight Budget:**
- DeepSeek V3 primary
- SEO: 1 variant each
- Scores: Final versions only
- Alternatives: 1 max
- Expected: $10-50/month

**Medium Budget:**
- Mix models (60% DeepSeek, 35% GPT-4 Turbo, 5% GPT-4o)
- SEO: 2 variants each
- Scores: Regular QA
- Alternatives: 2-3
- Expected: $50-200/month

**High Budget:**
- GPT-4 Turbo primary, GPT-4o for critical
- SEO: 3-5 variants for A/B
- Scores: Always
- Alternatives: 3-5
- Expected: $200-500+/month

---

**END OF DOCUMENTATION**

*This restructured edition (v4.2) consolidates all previous content into a logical, hierarchical flow for improved navigation and comprehension.*
