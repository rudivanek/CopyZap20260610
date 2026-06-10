# CopyZap UI Buttons & Actions

Complete list of every actionable button, icon button, and clickable control.

## Primary Actions

| Label/Icon | Component | File Path | Function | Visibility Logic |
|---|---|---|---|---|
| Generate Copy | Button | CopyMakerTab.tsx | `handleGenerate()` | Always visible when form has content |
| Score | Button | GeneratedCopyCard.tsx | `scoreOutput()` | Always visible if not yet scored |
| Compare Selected | Button | ResultsSection.tsx | `handleCompare()` | Visible if 2+ outputs selected |
| Blend Best | Button | WinnerHeroCard.tsx | `handleBlend()` | Visible after comparison |
| Save Output | Button | GeneratedCopyCard.tsx | `saveOutput()` | Always visible |
| Export as Markdown | Button | ResultsSection.tsx | `exportAsMarkdown()` | Always visible |
| Export as HTML | Button | ResultsSection.tsx | `exportAsHTML()` | Always visible |
| Copy to Clipboard | Icon Button | GeneratedCopyCard.tsx | `copyToClipboard()` | Always visible |
| Share | Button | GeneratedCopyCard.tsx | `handleShare()` | Always visible |

## Form Actions

| Label/Icon | Component | File Path | Function | Visibility Logic |
|---|---|---|---|---|
| Load Template | Dropdown | TemplateLoader.tsx | `selectTemplate()` | Always visible |
| Save as Template | Button | HeaderBar.tsx | openSaveTemplateModal() | Always visible |
| Quick Start | Button | QuickStartPicker.tsx | `selectQuickStart()` | Always visible when form empty |
| Load Prefill | Button | PrefillSelector.tsx | `selectPrefill()` | Always visible |
| Clear Form | Button | CopyForm.tsx | `clearForm()` | Hidden if form already empty |
| Select Customer | Dropdown | CustomerSelector.tsx | `selectCustomer()` | Always visible |
| Select Brand Voice | Dropdown | BrandVoiceSelector.tsx | `selectVoice()` | Always visible |
| Toggle AI Engine | Toggle | AiEngineSelector.tsx | `toggleEngine()` | Always visible |

## Navigation & Modals

| Label/Icon | Component | File Path | Function | Visibility Logic |
|---|---|---|---|---|
| Help / ? | Icon | Header.tsx | openHelpCenter() | Always visible |
| Settings | Icon | MainMenu.tsx | openSettings() | Always visible |
| Dashboard | Link | Header.tsx | navigate('/dashboard') | Visible when authenticated |
| Logout | Button | MainMenu.tsx | handleLogout() | Visible when authenticated |
| Login | Link | HomePage.tsx | navigate('/login') | Visible when not authenticated |
| Sign Up | Button | HomePage.tsx | navigate('/signup') | Visible when not authenticated |
| Dark Mode | Toggle | ThemeToggle.tsx | toggleTheme() | Always visible |
| Mode (Copy Maker / Quick Polish) | Toggle | ModeToggle.tsx | switchMode() | Always visible |

## Admin Actions

| Label/Icon | Component | File Path | Function | Visibility Logic |
|---|---|---|---|---|
| Manage Users | Link | AdminDiagnostics.tsx | navigate('/admin/users') | Visible if isAdmin |
| Add User | Button | ManageUsers.tsx | openAddUserModal() | Visible if isAdmin |
| Edit User | Button | ManageUsers.tsx | openEditUserModal() | Visible if isAdmin |
| Delete User | Button | ManageUsers.tsx | confirmDelete() | Visible if isAdmin |
| Manage Customers | Link | AdminDiagnostics.tsx | navigate('/admin/customers') | Visible if isAdmin |
| Add Customer | Button | ManageCustomers.tsx | openAddCustomerModal() | Visible if isAdmin |
| Manage Prefills | Link | AdminDiagnostics.tsx | navigate('/admin/prefills') | Visible if isAdmin |
| Edit Prefill | Button | ManagePrefills.tsx | openEditPrefillModal() | Visible if isAdmin |
| Delete Prefill | Button | ManagePrefills.tsx | confirmDelete() | Visible if isAdmin |
| Manage Workflows | Link | AdminDiagnostics.tsx | navigate('/admin/workflows') | Visible if isAdmin |
| Create Workflow | Button | ManageWorkflows.tsx | openWorkflowBuilder() | Visible if isAdmin |
| Export Token Usage | Button | AdminDiagnostics.tsx | exportTokenUsage() | Visible if isAdmin |

## Dashboard Actions

| Label/Icon | Component | File Path | Function | Visibility Logic |
|---|---|---|---|---|
| Open Saved Output | Link | Dashboard.tsx | navigateToOutput(id) | Always visible |
| Re-score | Button | Dashboard.tsx | rescoreOutput(id) | Always visible if scored |
| Export | Button | Dashboard.tsx | exportOutput(id) | Always visible |
| Delete | Button | Dashboard.tsx | confirmDelete(id) | Always visible |
| Favorite | Star Icon | Dashboard.tsx | toggleFavorite(id) | Always visible |
| Filter by Favorite | Button | Dashboard.tsx | filterFavorites() | Always visible |
| Load More | Button | Dashboard.tsx | loadMore() | Visible if more data |

## Results Actions

| Label/Icon | Component | File Path | Function | Visibility Logic |
|---|---|---|---|---|
| Edit Copy | Pencil Icon | GeneratedCopyCard.tsx | enableEdit() | Always visible |
| Delete Version | Trash Icon | GeneratedCopyCard.tsx | deleteVersion() | Always visible |
| View Details | Link | ComparisonCard.tsx | openDetails() | Visible in comparison |
| Regenerate | Refresh Icon | GeneratedCopyCard.tsx | regenerate() | Always visible |
| View Full Analysis | Button | ScoreCard.tsx | openDetailModal() | Always visible if scored |

## Help & Information

| Label/Icon | Component | File Path | Function | Visibility Logic |
|---|---|---|---|---|
| Guidance Hint | Lightbulb | GuidanceHintHost.tsx | showHint() | Visible in Copy Maker |
| Search Help | Input | HelpSearch.tsx | searchHelp() | In Help Center |
| Back | Arrow | HelpPageTemplate.tsx | goBack() | In Help Center |
| Expand/Collapse | Chevron | CollapsibleSection.tsx | toggle() | In Help docs |

## Form Field Actions

| Label/Icon | Component | File Path | Function | Visibility Logic |
|---|---|---|---|---|
| Add Tag | Plus | TagInput.tsx | addTag() | After typing |
| Remove Tag | X | TagInput.tsx | removeTag() | On tag hover |
| Drag Handle | Menu Icon | DraggableTagsInput.tsx | startDrag() | On hover |
| Clear Field | X Icon | input.tsx | clearField() | If field has value |
| Character Count | Display | CharacterCounter.tsx | updateCount() | Always visible |
| Word Count | Display | WordCounter.tsx | updateCount() | Always visible |

## Modal Actions

| Label/Icon | Component | File Path | Function | Visibility Logic |
|---|---|---|---|---|
| Close Modal | X | (Any Modal) | closeModal() | Always visible |
| Confirm / Save | Button | (Any Modal) | confirm() | Always visible |
| Cancel | Button | (Any Modal) | cancel() | Always visible |

## Floating Action Bars

**Location**: `/src/components/FloatingActionBar.tsx`

| Icon | Function | Trigger | Notes |
|---|---|---|---|
| Copy | Copy to clipboard | On hover | Copies active output |
| Share | Share options | On hover | Opens share menu |
| Save | Save to saved outputs | On hover | Creates persistent saved output |
| Compare | Prepare for comparison | On click | Adds to comparison selection |
| Info | Show metadata | On hover | Displays word count, model, cost |

## Accessibility

All buttons include:
- `aria-label` for screen readers
- Keyboard navigation support (Tab, Enter)
- Focus indicators (visible outline)
- Tooltip on hover (where appropriate)
- Disabled state styling when not available

## Button States

Each button can be in states:
- **Enabled** (clickable)
- **Disabled** (grayed out, not clickable)
- **Loading** (spinner shown)
- **Active** (highlighted, for toggles)
- **Error** (red, with error message)
- **Success** (green checkmark, temporary)

## Tooltip Content

Most buttons include tooltips:
- Generate Copy: "Create new copy variations using AI"
- Score: "Analyze quality across 10 dimensions"
- Compare: "Compare selected versions side-by-side"
- etc.

Tooltips appear on hover after 500ms delay.
