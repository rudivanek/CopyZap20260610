# CopyZap Components Architecture

Detailed breakdown of every major UI section and component.

## CopyMaker (Main Interface)

### CopyMakerTab
- **File**: `/src/components/copy-maker/CopyMakerTab/CopyMakerTab.tsx`
- **State**: 
  - Form state via `useFormState()` hook (pulls from `SessionContext`)
  - Session state via `useSession()` context
  - Generation state (loading, results) in local state
- **Child Components**:
  - `HeaderBar.tsx` (title, session info, mode toggle)
  - `AiPromptSection.tsx` (AI prompt display)
  - `ResultsPanel.tsx` (results container)
  - `TemplateLoader.tsx` (template picker)
  - `QuickStartPicker.tsx` (quick start templates)
  - Various modals: `ScoringContextModal`, `JsonLdViewer`, `PrefillSaveDialog`
  - `FloatingActionBar.tsx` (action buttons)
  - `FloatingOutputNavigation.tsx` (output navigation)

### ResultsSection
- **File**: `/src/components/results/ResultsSection.tsx`
- **State**: Results from `SessionContext.generatedOutputCards`
- **Child Components**:
  - `CopyOutput.tsx` (individual output display, ~1049 KB component)
  - `ComparisonTable.tsx` (2-version comparison)
  - `ComprehensiveComparisonTable.tsx` (multi-version comparison)
  - `StickyResultsNav.tsx` (sticky navigation)
  - `WinnerHeroCard.tsx` (winner display)

### GeneratedCopyCard
- **File**: `/src/components/GeneratedCopyCard.tsx`
- **State**: Card data passed as props (output_data from SessionContext)
- **Child Components**:
  - `ScoreCard.tsx` (displays 10 dimensions)
  - `MultiScoreDisplay.tsx` (multi-score visualization)
  - `SubScoreChips.tsx` (score breakdown chips)
  - Renders markdown content via `react-markdown`

## Dashboard

### Dashboard
- **File**: `/src/components/Dashboard.tsx`
- **State**: 
  - `useAuth()` for user info
  - Local state for session list, pagination cursor
  - `getUserSavedOutputsMeta()` for metadata-only list (2KB per record)
  - Local state for filters, favorites toggle
- **Child Components**:
  - Session list rendering (custom JSX, no child component)
  - Saved output metadata display
  - Pagination controls

## CopySnap (Scoring Only)

### CopySnap
- **File**: `/src/components/CopySnap.tsx`
- **State**:
  - Form state via `useFormState()`
  - Session state via `useSession()`
  - Local state for scoring results
  - `useCreditsBalance()` for credit info
- **Child Components**:
  - Form inputs (custom JSX)
  - `ProcessingModal.tsx` (loading state)
  - Score results display (custom JSX)

## Quick Polish Mode

### QuickPolishPage
- **File**: `/src/features/quickPolish/QuickPolishPage.tsx`
- **State**:
  - Form state via `useFormState()`
  - Session state via `useSession()`
  - Local state for polish operations
  - Variant recommendations from `variantRecommendation.ts`
- **Child Components**:
  - Form inputs (custom JSX)
  - Variant suggestion display
  - Results display

## Admin Section

### AdminDiagnostics
- **File**: `/src/components/AdminDiagnostics.tsx`
- **State**: 
  - `useIsAdmin()` for role check
  - Local state for dashboard metrics
  - Queries via `adminGetTokenStats()`, `adminGetUsers()`, etc.
- **Child Components**:
  - Custom admin UI (no child components)

### ManageUsers
- **File**: `/src/components/ManageUsers.tsx`
- **State**:
  - Local state for user list
  - `adminGetUsers()` data
  - Edit/delete state
- **Child Components**:
  - `AddUserModal.tsx`
  - `EditUserModal.tsx`
  - User list table (custom JSX)

### ManageCustomers
- **File**: `/src/components/ManageCustomers.tsx`
- **State**:
  - Local state for customer list
  - `getCustomers()` data
- **Child Components**:
  - `CustomerDetail.tsx` (detail view)
  - Customer list table (custom JSX)

### ManagePrefills
- **File**: `/src/components/ManagePrefills.tsx`
- **State**:
  - Local state for prefill list
  - `getPrefills()` data
- **Child Components**:
  - Prefill editor (custom JSX)

### ManageSpecialInstructions
- **File**: `/src/components/ManageSpecialInstructions.tsx`
- **State**:
  - Local state for instructions list
  - Database queries for instructions
- **Child Components**:
  - Instruction editor (custom JSX)

### ManageWorkflows
- **File**: `/src/components/workflow/ManageWorkflows.tsx`
- **State**:
  - Local state for workflow list
  - Workflow permissions via `WorkflowPermissionsModal.tsx`
- **Child Components**:
  - `WorkflowBuilder.tsx`
  - `WorkflowPermissionsModal.tsx`

## Help Center

### HelpCenter
- **File**: `/src/components/help/HelpCenter.tsx`
- **State**:
  - Local state for search query
  - Sidebar navigation state
- **Child Components**:
  - `HelpSidebar.tsx` (navigation)
  - `HelpSearch.tsx` (search box)
  - Route-specific help pages (dynamically rendered)

### HelpLayout
- **File**: `/src/components/help/HelpLayout.tsx`
- **State**: Route state from React Router
- **Child Components**:
  - `HelpSidebar.tsx`
  - Help page content (dynamic via children prop)

### HelpPageTemplate
- **File**: `/src/components/help/HelpPageTemplate.tsx`
- **State**: Page-specific data passed as props
- **Child Components**:
  - Rendered as wrapper for consistent styling

## Blog

### BlogPost
- **File**: `/src/components/blog/BlogPost.tsx`
- **State**:
  - Blog post data from Supabase via `getBlogPost()`
  - Local state for loading/error
- **Child Components**:
  - `MarkdownRenderer.tsx` (renders markdown content)

### AdminBlogDashboard
- **File**: `/src/components/blog/AdminBlogDashboard.tsx`
- **State**:
  - Local state for blog list
  - `getBlogPosts()` data
- **Child Components**:
  - `AdminBlogEditor.tsx` (edit modal)

## Modal Components

All modals follow the same pattern:
- **State**: Props-driven (isOpen, onClose callbacks)
- **Child Components**: Form inputs or dialog content (custom JSX)

Key modals:
- `SaveTemplateModal.tsx` - Save current form as template
- `BrandVoiceModal.tsx` - Edit brand voices
- `SavePrefillModal.tsx` - Save form as prefill
- `StartHubModal.tsx` - Onboarding modal
- `TokenLimitModal.tsx` - Credits limit warning
- `AiModelValidationModal.tsx` - Model selection validation

## Selector Components

All selectors are controlled form components:
- **State**: Props-driven (value, onChange callbacks)
- **Pattern**: Dropdown/combobox with filtering

- `CustomerSelector.tsx` - Select customer
- `BrandVoiceSelector.tsx` - Select brand voice
- `PrefillSelector.tsx` - Select prefill
- `AiEngineSelector.tsx` - Select AI engine (Claude vs OpenAI)
- `WorkflowSelector.tsx` - Select workflow

## UI Component Library

Located in `/src/components/ui/`:
- Radix UI-based components (checkbox, select, label, etc.)
- Custom components:
  - `AppSpinner.tsx` - App-wide loading spinner
  - `CharacterCounter.tsx` - Character count display
  - `WordCounter.tsx` - Word count display
  - `DraggableTagsInput.tsx` - Draggable tag input
  - `CategoryTagsInput.tsx` - Category tag input
  - `ContentQualityIndicator.tsx` - Content quality indicator
  - `SpecialInstructionsField.tsx` - Special instructions input

## Shared Components

- `GuidanceHintHost.tsx` - Contextual help system
- `GuidanceToast.tsx` - Toast notifications for guidance
- `SocialShare.tsx` - Social sharing buttons
- `ErrorBoundary.tsx` - Error boundary wrapper

## Pages (Landing Site)

Located in `/src/components/pages/`:
- `HeroSection.tsx` - Hero banner
- `FeaturesSection.tsx` - Features showcase
- `HowItWorksSection.tsx` - How it works section
- `WhyUsersLoveSection.tsx` - Social proof section
- `VideoSection.tsx` - Video showcase
- `FooterSection.tsx` - Footer
- `TopNavigation.tsx` - Top navigation bar
