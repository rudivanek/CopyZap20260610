# Help Center URL Mapping

All static HTML docs have been mapped to React routes under `/help/*`

## Complete URL Mapping

| Static HTML (old) | React Route (new) | Component |
|-------------------|-------------------|-----------|
| `/docs/getting-started.html` | `/help/getting-started` | GettingStarted |
| `/docs/tutorials.html` | `/help/tutorials` | Tutorials |
| `/docs/copy-maker.html` | `/help/copy-maker` | CopyMakerIndex |
| `/docs/quick-prompt-wizard.html` | `/help/quick-prompt-wizard` | QuickPromptWizard |
| `/docs/project-setup.html` | `/help/project-setup` | ProjectSetup |
| `/docs/output-features.html` | `/help/output-features` | OutputFeatures |
| `/docs/optional-features.html` | `/help/optional-features` | OptionalFeatures |
| `/docs/feature-interactions.html` | `/help/feature-interactions` | FeatureInteractions |
| `/docs/compare-blend.html` | `/help/compare-blend` | CompareBlend |
| `/docs/export-management.html` | `/help/export-management` | ExportAndFileManagement |
| `/docs/templates.html` | `/help/templates` | TemplatesAndReuse |
| `/docs/recommended-settings.html` | `/help/recommended-settings` | RecommendedSettings |
| `/docs/workflows-examples.html` | `/help/workflows` | Workflows |
| `/docs/glossary.html` | `/help/glossary` | Glossary |
| `/docs/brand-voice.html` | `/help/brand-voice` | BrandVoiceSystem |
| `/docs/troubleshooting.html` | `/help/troubleshooting` | TroubleshootingFAQs |
| `/docs/contact.html` | `/help/contact` | Contact |
| `/docs/voice-styles-and-blending.html` | `/help/voice-styles-and-blending` | VoiceStylesAndBlending |
| `/docs/smart-vs-expert-mode.html` | `/help/smart-vs-expert-mode` | SmartVsExpertMode |

## URL Aliases (multiple URLs pointing to same component)

- `/help/templates` and `/help/templates-and-reuse` → TemplatesAndReuse
- `/help/workflows` and `/help/workflows-examples` → Workflows
- `/help/troubleshooting` and `/help/troubleshooting-faqs` → TroubleshootingFAQs
- `/help/export-management` and `/help/export-and-file-management` → ExportAndFileManagement

## Nested Routes

- `/help/real-case-workflows` → RealCaseWorkflowsIndex
- `/help/real-case-workflows/quick-wizard-new-copy` → QuickWizardNewCopy

## Fixed Issues

1. **CopyMakerIndex.tsx broken links** - Fixed all internal links that were pointing to non-existent `/help/copy-maker/*` paths
   - `/help/copy-maker/project-setup` → `/help/project-setup`
   - `/help/copy-maker/generated-output` → `/help/output-features`
   - `/help/copy-maker/optional-features` → `/help/optional-features`
   - `/help/copy-maker/evaluation-tools` → `/help/compare-blend` ✓ (was causing 404)
   - `/help/copy-maker/export-and-save` → `/help/export-management`
   - `/help/copy-maker/templates` → `/help/templates`

2. **Created new pages**
   - Contact (with functional form)
   - Glossary
   - ProjectSetup
   - OutputFeatures
   - CompareBlend
   - FeatureInteractions
   - RecommendedSettings
   - Workflows
   - Tutorials

3. **Updated HelpCenter.tsx** - All search results and topic cards now use React Router `Link` instead of opening external HTML files

## System Status

✓ All URLs from help-index.json are mapped
✓ Build successful
✓ No 404 errors on existing routes
✓ Internal navigation working (no external HTML opens)
✓ Static `/docs/*.html` files remain for SEO but users never see them
