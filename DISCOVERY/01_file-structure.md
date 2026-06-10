# CopyZap File Structure

Complete directory tree of the CopyZap codebase.

## Project Root Structure

```
/tmp/cc-agent/57925151/project/
├── src/                          # Main source directory
├── supabase/                      # Supabase migrations and functions
├── public/                        # Static assets
├── dist/                          # Build output
├── index.html                     # Entry point
├── vite.config.ts                 # Vite configuration
├── tailwind.config.js             # Tailwind CSS config
├── tsconfig.json                  # TypeScript config
├── package.json                   # Dependencies
├── CLAUDE.md                       # Developer guidance (NEW)
└── DISCOVERY/                     # Codebase audit docs (NEW)
```

## `/src/` Directory Structure

```
src/
├── App.tsx                        # Main app router & lazy-loaded routes
├── main.tsx                       # React entry point
├── index.css                      # Global styles
│
├── components/
│   ├── (70+ UI components at root)
│   │   ├── CopyForm.tsx
│   │   ├── CopySnap.tsx
│   │   ├── Dashboard.tsx
│   │   ├── GeneratedCopyCard.tsx
│   │   ├── HomePage.tsx
│   │   ├── Header.tsx
│   │   ├── MainMenu.tsx
│   │   ├── Login.tsx
│   │   ├── CreateAccount.tsx
│   │   ├── ResetPassword.tsx
│   │   ├── AuthCallback.tsx
│   │   ├── NotFound.tsx
│   │   ├── Privacy.tsx
│   │   ├── DesktopRequired.tsx
│   │   ├── CookieConsent.tsx
│   │   ├── GenerateButton.tsx
│   │   ├── SessionInfo.tsx
│   │   ├── FloatingActionBar.tsx
│   │   ├── LeftFloatingActionBar.tsx
│   │   ├── FloatingOutputNavigation.tsx
│   │   │
│   │   ├── (Modals)
│   │   ├── SaveTemplateModal.tsx
│   │   ├── BrandVoiceModal.tsx
│   │   ├── SavePrefillModal.tsx
│   │   ├── SaveAsNewTemplateModal.tsx
│   │   ├── TemplateSuggestionModal.tsx
│   │   ├── SuggestionModal.tsx
│   │   ├── StartHubModal.tsx
│   │   ├── TokenLimitModal.tsx
│   │   ├── PlaceholderWarningModal.tsx
│   │   ├── ComparisonWarningModal.tsx
│   │   ├── AiModelValidationModal.tsx
│   │   ├── RegenerateAnalysisModal.tsx
│   │   ├── ProcessingModal.tsx
│   │   ├── JsonLdModal.tsx
│   │   ├── PromptDisplay.tsx
│   │   ├── PromptEvaluation.tsx
│   │   │
│   │   ├── (Admin)
│   │   ├── AdminDiagnostics.tsx
│   │   ├── AdminRoute.tsx
│   │   ├── ManageUsers.tsx
│   │   ├── ManageCustomers.tsx
│   │   ├── CustomerDetail.tsx
│   │   ├── ManagePrefills.tsx
│   │   ├── ManageSpecialInstructions.tsx
│   │   ├── AddUserModal.tsx
│   │   ├── EditUserModal.tsx
│   │   ├── UsageAuditPanel.tsx
│   │   │
│   │   ├── (Selectors & Toggles)
│   │   ├── CustomerSelector.tsx
│   │   ├── BrandVoiceSelector.tsx
│   │   ├── PrefillSelector.tsx
│   │   ├── AiEngineSelector.tsx
│   │   ├── ModeToggle.tsx
│   │   ├── FormModeToggle.tsx
│   │   ├── ThemeToggle.tsx
│   │   │
│   │   ├── (Diagnostics & Pages)
│   │   ├── VideosPage.tsx
│   │   ├── SocialShare.tsx
│   │   ├── ClearButton.tsx
│   │   ├── FeatureToggles.tsx
│   │   ├── UrlParamLoader.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── BetaRegistrationModal.tsx
│   │   ├── BetaThanks.tsx
│   │   ├── PublicFooter.tsx
│   │
│   ├── copy-maker/
│   │   ├── CopyMakerSidebar.tsx              # Left sidebar navigation
│   │   ├── CopyMakerTab/
│   │   │   ├── CopyMakerTab.tsx              # Main component (orchestrator)
│   │   │   ├── hooks/
│   │   │   │   ├── useGeneration.ts          # Copy generation orchestrator
│   │   │   │   ├── useExports.ts             # Export functionality
│   │   │   │   ├── usePrefillEditing.ts      # Prefill management
│   │   │   │   └── useTemplates.ts           # Template management
│   │   │   ├── modals/
│   │   │   │   ├── JsonLdViewer.tsx
│   │   │   │   ├── PrefillSaveDialog.tsx
│   │   │   │   └── ScoringContextModal.tsx
│   │   │   ├── sections/
│   │   │   │   ├── HeaderBar.tsx
│   │   │   │   ├── AiPromptSection.tsx
│   │   │   │   ├── EmptyState.tsx
│   │   │   │   ├── QuickStartPicker.tsx
│   │   │   │   ├── ResultsPanel.tsx
│   │   │   │   └── TemplateLoader.tsx
│   │   │   └── utils/
│   │   │       ├── isContentEmpty.ts
│   │   │       └── mapPrefillToFormState.ts
│   │   ├── guidance/
│   │   │   ├── DynamicGuidance.tsx
│   │   │   ├── GuidanceBar.tsx
│   │   │   ├── GuidanceHint.tsx
│   │   │   ├── NextStepSuggestion.tsx
│   │   │   └── UpgradeHint.tsx
│   │
│   ├── results/
│   │   ├── ResultsSection.tsx                # Main results container
│   │   ├── CopyOutput.tsx                    # Individual output card display
│   │   ├── ComparisonTable.tsx               # Comparison UI
│   │   ├── ComprehensiveComparisonTable.tsx  # Advanced comparison
│   │   ├── ComparisonCard.tsx                # Comparison card display
│   │   ├── ScoreCard.tsx                     # Individual score display
│   │   ├── MultiScoreDisplay.tsx             # Multi-dimension score display
│   │   ├── SubScoreChips.tsx                 # Score breakdown chips
│   │   ├── HeadlineIdeas.tsx                 # Headlines display
│   │   ├── AlternativeCopy.tsx               # Alternative versions display
│   │   ├── DebugInfoModal.tsx                # Debug information
│   │   ├── ScoreComparisonModal.tsx          # Score detail modal
│   │   ├── decision/
│   │   │   ├── ActionPanel.tsx
│   │   │   ├── RankingsSnapshotCard.tsx
│   │   │   ├── StickyResultsNav.tsx
│   │   │   ├── VersionAnalysisCard.tsx
│   │   │   └── WinnerHeroCard.tsx
│   │
│   ├── help/
│   │   ├── HelpCenter.tsx                    # Main help page
│   │   ├── HelpLayout.tsx                    # Help layout wrapper
│   │   ├── HelpSearch.tsx                    # Help search
│   │   ├── HelpSidebar.tsx                   # Help navigation sidebar
│   │   ├── HelpPageTemplate.tsx              # Help page template
│   │   ├── HtmlContentWrapper.tsx            # HTML content wrapper
│   │   ├── pages/
│   │   │   ├── BrandVoiceSystem.tsx
│   │   │   ├── CompareBlend.tsx
│   │   │   ├── Contact.tsx
│   │   │   ├── CopyMakerIndex.tsx
│   │   │   ├── CoreWorkflows.tsx
│   │   │   ├── CreditsAndBilling.tsx
│   │   │   ├── DashboardAndHistory.tsx
│   │   │   ├── ExportAndFileManagement.tsx
│   │   │   ├── FeatureInteractions.tsx
│   │   │   ├── GettingStarted.tsx
│   │   │   ├── Glossary.tsx
│   │   │   ├── HowScoringWorks.tsx
│   │   │   ├── OptionalFeatures.tsx
│   │   │   ├── OutputFeatures.tsx
│   │   │   ├── ProjectSetup.tsx
│   │   │   ├── QuickPromptWizard.tsx
│   │   │   ├── RealCaseWorkflowsIndex.tsx
│   │   │   ├── RecommendedSettings.tsx
│   │   │   ├── SetupAndInputs.tsx
│   │   │   ├── StartHub.tsx
│   │   │   ├── TemplatesAndReuse.tsx
│   │   │   ├── TroubleshootingFAQs.tsx
│   │   │   ├── Tutorials.tsx
│   │   │   ├── VoiceStylesAndBlending.tsx
│   │   │   ├── WorkflowBuilder.tsx
│   │   │   ├── Workflows.tsx
│   │   │   ├── tutorials/
│   │   │   │   ├── CompareAndSelect.tsx
│   │   │   │   ├── CreateFirstOutput.tsx
│   │   │   │   └── ImproveFromURL.tsx
│   │   │   └── workflows/
│   │   │       ├── QuickWizardNewCopy.tsx
│   │   │       └── WorkflowStub.tsx
│   │
│   ├── blog/
│   │   ├── AdminBlogDashboard.tsx
│   │   ├── AdminBlogEditor.tsx
│   │   ├── BlogList.tsx
│   │   ├── BlogPost.tsx
│   │   └── MarkdownRenderer.tsx
│   │
│   ├── workflow/
│   │   ├── ManageWorkflows.tsx
│   │   ├── WorkflowBuilder.tsx
│   │   └── WorkflowPermissionsModal.tsx
│   │
│   ├── pages/
│   │   ├── FeaturesSection.tsx
│   │   ├── FooterSection.tsx
│   │   ├── HeroSection.tsx
│   │   ├── HowItWorksSection.tsx
│   │   ├── TopNavigation.tsx
│   │   ├── VideoModal.tsx
│   │   ├── VideoSection.tsx
│   │   └── WhyUsersLoveSection.tsx
│   │
│   ├── shared/
│   │   ├── GuidanceHintHost.tsx
│   │   └── GuidanceToast.tsx
│   │
│   └── ui/
│       ├── button.tsx
│       ├── card.tsx
│       ├── checkbox.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── select.tsx
│       ├── textarea.tsx
│       ├── tags-input.tsx
│       ├── Tooltip.tsx
│       ├── AppSpinner.tsx
│       ├── GradientSpinner.tsx
│       ├── LoadingSpinner.tsx
│       ├── LoadingOverlay.tsx
│       ├── CharacterCounter.tsx
│       ├── WordCounter.tsx
│       ├── CompareButton.tsx
│       ├── DraggableTagsInput.tsx
│       ├── DraggableStructuredInput.tsx
│       ├── TagInput.tsx
│       ├── CategoryTagsInput.tsx
│       ├── OutputTagsInput.tsx
│       ├── ContentQualityIndicator.tsx
│       ├── SpecialInstructionsField.tsx
│       ├── SuggestionButton.tsx
│       ├── TemplateIndicator.tsx
│       ├── RequiredFieldIndicator.tsx
│       ├── FormattedContent.tsx
│       ├── HtmlContentWrapper.tsx
│       ├── CollapsibleSection.tsx
│       ├── OutputStructureSelect.tsx
│       ├── OnDemandGeneration.tsx
│       ├── OnDemandSeoButtons.tsx
│       └── WorkflowSelector.tsx
│
├── context/
│   ├── SessionContext.tsx          # Main session state (form inputs, outputs)
│   ├── ModeContext.tsx              # Copy Maker vs. Quick Polish mode
│   ├── ThemeContext.tsx             # Dark/light theme
│   └── GuidanceHintContext.tsx      # Contextual help hints
│
├── hooks/
│   ├── useAuth.ts                   # Authentication state
│   ├── useFormState.ts              # Form state management
│   ├── useBrandVoices.ts            # Brand voices data fetching
│   ├── useCreditsBalance.ts         # Credits/billing info
│   ├── useIsAdmin.ts                # Admin role detection
│   ├── useIsSmallScreen.ts          # Responsive design helper
│   ├── useLastRoute.ts              # Navigation history
│   ├── useActiveCard.ts             # Active output card tracking
│   └── useInputField.ts             # Input field helper
│
├── services/
│   ├── supabaseClient.ts            # Supabase client & database queries (2600+ lines)
│   ├── sessionService.ts            # Session management utilities
│   ├── workflowService.ts           # Workflow execution
│   ├── workflowExecutionEngine.ts   # Workflow execution engine
│   ├── adminService.ts              # Admin operations
│   ├── blogService.ts               # Blog operations
│   ├── api/
│   │   ├── index.ts
│   │   ├── copyGeneration.ts        # LLM copy generation
│   │   ├── contentScoring.ts        # LLM-based scoring
│   │   ├── comprehensiveScoring.ts  # 10-dimension scoring engine (142KB)
│   │   ├── comparativeScoring.ts    # Comparison logic
│   │   ├── alternativeCopy.ts       # Alternative versions
│   │   ├── humanizedCopy.ts         # Humanization
│   │   ├── blendedCopy.ts           # Blending versions
│   │   ├── brandVoiceGeneration.ts  # Voice/persona application
│   │   ├── contentModification.ts   # Content modification
│   │   ├── contentRefinement.ts     # Refinement operations
│   │   ├── performanceBoost.ts      # Performance boosting
│   │   ├── geoGeneration.ts         # Geographic generation
│   │   ├── geoScoring.ts            # Geographic scoring
│   │   ├── seoGeneration.ts         # SEO metadata generation
│   │   ├── urlAnalysis.ts           # URL content analysis
│   │   ├── urlAnalysisFirecrawl.ts  # Firecrawl URL analysis
│   │   ├── urlBrandVoiceExtraction.ts # Brand voice from URL
│   │   ├── voiceStyles.ts           # Voice/style variations
│   │   ├── suggestions.ts           # Suggestion generation
│   │   ├── templateSuggestions.ts   # Template suggestions
│   │   ├── modificationSuggestions.ts # Modification suggestions
│   │   ├── promptEvaluation.ts      # Prompt evaluation
│   │   ├── modelValidation.ts       # Model validation
│   │   ├── tokenTracking.ts         # Token/credit tracking
│   │   ├── unifiedComparison.ts     # Unified comparison logic
│   │   ├── versionDeepAnalysis.ts   # Deep analysis of versions
│   │   └── utils.ts                 # API utilities
│
├── lib/
│   └── llm/
│       ├── modelRegistry.ts         # Model definitions & pricing
│       ├── callLLMWithFallback.ts   # LLM call orchestration
│       └── (utility files)
│
├── utils/
│   ├── ai-pipeline/
│   │   ├── enhancedPipeline.ts
│   │   ├── expandInputs.ts
│   │   ├── modelSettings.ts
│   │   └── refineOutput.ts
│   ├── (70+ utility files)
│   ├── enhancedExports.ts           # Export templates
│   ├── copyFormatter.ts             # Copy formatting
│   ├── scoreColors.ts               # Score color mapping
│   ├── scoreInterpretation.ts       # Score interpretation
│   ├── multiScoreDisplay.ts         # Multi-score display utils
│   ├── markdownUtils.ts             # Markdown utilities
│   ├── dateFormatting.ts            # Date formatting
│   ├── contentAnalysisForExport.ts  # Export content analysis
│   ├── placeholderDetection.ts      # Placeholder detection
│   ├── performanceTrace.ts          # Performance tracing
│   ├── debugLogger.ts               # Debug logging
│   ├── savedOutputGuards.ts         # Saved output validation
│   ├── sessionContract.ts           # Session contract validation
│   ├── sessionErrors.ts             # Session error handling
│   └── (many more...)
│
├── types/
│   ├── index.ts                     # Main type definitions
│   ├── supabase.ts                  # Supabase-generated types
│   └── blog.ts                      # Blog types
│
├── constants/
│   ├── index.ts                     # Application constants
│   └── prefills.ts                  # Default prefill values
│
├── config/
│   ├── brandVoicePresets.ts         # Brand voice definitions
│   └── guidanceHints.ts             # Guidance hint definitions
│
└── features/
    └── quickPolish/
        ├── QuickPolishPage.tsx
        ├── intents.ts
        ├── microConfirmation.ts
        ├── quickPolishService.ts
        ├── types.ts
        └── variantRecommendation.ts
```

## `/supabase/` Directory Structure

```
supabase/
├── migrations/                      # All database migrations (100+ files)
│   ├── 20250520231020_shrill_grove.sql
│   ├── 20250520231026_fading_summit.sql
│   ├── ... (90+ more migrations)
│   └── 20260427220531_fix_credits_rolling_30day_period.sql
│
└── functions/                       # Edge Functions (Deno/TypeScript)
    ├── _shared/
    │   └── admin.ts                 # Shared admin utilities
    ├── admin-create-user/
    ├── admin-delete-user/
    ├── admin-export-token-usage/
    ├── admin-get-beta-registrations-count/
    ├── admin-get-token-stats/
    ├── admin-get-token-usage/
    ├── admin-get-users/
    ├── admin-ping/
    ├── admin-update-user/
    ├── ai-completion/
    ├── analyze-brand-voice/
    ├── analyze-url-firecrawl/
    ├── analyze-url/
    ├── extract-brand-voice-from-url/
    ├── register-beta-user/
    ├── send-copydeck-email/
    ├── send-help-email/
    ├── send-welcome-email/
    ├── submit-help-feedback/
    └── track-tokens/
```

## `/public/` Directory Structure

```
public/
├── favicon.png
├── copy_generator_favicon.svg
├── logo_copyzap_1.png
├── copyzap.png
├── copyzap-hero.gif
├── robots.txt
├── _headers
├── _redirects
├── docs/
│   ├── CopyZap-Features.md
│   ├── help-index.json
│   ├── search-index.json
│   ├── help-search.js
│   ├── search.js
│   ├── feedback-script.js
│   ├── archive/
│   │   └── (legacy documentation)
│   └── og/
│       └── (OG image files)
```

## Key Statistics

- **Total Source Files**: ~312 files
- **Components**: ~150 files
- **Services/API**: ~30+ files
- **Utilities**: ~70+ files
- **Supabase Migrations**: 100+ files
- **Edge Functions**: 18 functions
- **Lines of Code (src/)**: ~50,000+ lines
