# CopyZap - UI & Floating Controls Guide

## Interface Overview

CopyZap uses a clean, organized interface with strategic floating controls for workflow efficiency.

---

## Main Layout Structure

```
┌─────────────────────────────────────────┐
│ Header (Logo, Navigation, User Menu)   │
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │             │  │                 │  │
│  │   Input     │  │    Results      │  │
│  │   Panel     │  │    Panel        │  │
│  │   (Form)    │  │    (Cards)      │  │
│  │             │  │                 │  │
│  └─────────────┘  └─────────────────┘  │
│                                         │
├─────────────────────────────────────────┤
│ Floating Action Bar (Context Actions)  │
└─────────────────────────────────────────┘
```

---

## Header Navigation

### Primary Navigation

**Left Side:**
- **Logo:** Returns to home/copy maker
- **Copy Maker Tab:** Main generation interface
- **Dashboard Tab:** Saved outputs and history

**Right Side:**
- **Theme Toggle:** Dark/Light mode
- **Mode Toggle:** Create/Improve mode (shown in Copy Maker)
- **User Menu:** Settings, Logout
- **Admin Link:** (if admin user)

### Breadcrumb Navigation

**When Applicable:**
```
Home > Copy Maker > Results
Dashboard > Saved Output > [Output Name]
Admin > Manage Users
```

---

## Input Panel (Left Side)

### Organization

**Collapsible Sections:**
1. Project Setup
2. Core Business Context
3. Audience & Messaging
4. Brand Voice & Style
5. Technical Parameters
6. SEO & Content Enhancement
7. Advanced Options

**Benefits:**
- Organized by category
- Reduces visual overwhelm
- Allows focused editing
- Remembers open/closed state

### Field Types

**Text Inputs:**
- Product/Service Name
- Location
- Key Message
- Call to Action

**Textareas:**
- Business Description (with quality indicator)
- Target Audience
- Pain Points
- Special Instructions
- Keywords

**Dropdowns:**
- AI Model
- Tone
- Word Count
- Language
- Industry/Niche
- Writing Style

**Sliders:**
- Tone Level (1-10)

**Checkboxes:**
- Generate SEO Metadata
- Generate Scores
- Generate GEO
- Enhance for GEO
- Various language constraints

**Special Components:**
- **Output Structure Builder:** Drag-and-drop section organization
- **Tags Input:** Keywords, Excluded Terms
- **Prefill Selector:** Dropdown with saved values

---

## Floating Action Bar

### Purpose

Provides quick access to primary actions regardless of scroll position.

### Location

**Desktop:** Bottom of viewport, fixed position
**Mobile:** Sticky at bottom

### Actions Displayed

**In Form View (before generation):**
- **Quick Prompt Wizard:** Opens wizard modal
  - Features magic wand icon (Wand2) for visual recognition
  - Full-width gradient button
  - Icon positioned to the left of "Quick Prompt Wizard" text
  - 18px icon with 8px spacing
- **Load Template:** Browse and load saved configurations
- **Clear Form:** Reset all fields
- **Generate Copy:** Primary action button

**In Results View (after generation):**
- **Generate Copy:** Create new output
- **Save Output:** Save current session
- **Clear Results:** Remove all cards
- **Export:** Download options

### Visual Design

**Characteristics:**
- Semi-transparent background
- Elevated (shadow for depth)
- Icon + text labels
- Primary action highlighted
- Responsive (stacks on mobile)

---

## Results Panel (Right Side)

### Content Card Display

**Layout:**
- Vertical stack of cards
- Most recent at top
- Clear visual separation
- Relationship indicators (lines connecting related cards)

**Card Types:**
- Generated Copy (primary)
- Alternative Copy
- Restyled Copy (with persona badge)
- Modified Copy
- Score Cards (when generated)

### Card Components

**Header:**
- Type badge
- Word count
- Timestamp
- Source indicator (if derivative)

**Body:**
- Content display (formatted)
- Expandable if very long
- Copy buttons (plain text, HTML)

**Footer (Action Buttons):**
- Generate Alternative
- Apply Voice Style
- Modify Content
- Generate Score
- Generate FAQ Schema (if applicable)

**Metadata Section:**
- Quality Scores (if generated)
- SEO Metadata (if generated)
- GEO Scores (if generated)

---

## Modal Dialogs

### Quick Prompt Wizard

**Activation Button:**
- Magic wand icon (Wand2 from lucide-react)
- Icon positioned left of text with 8px gap
- 18px icon size for clarity
- Full-width gradient button in primary blue
- Text: "Quick Prompt Wizard"
- Disabled when user not authenticated

**Full-Screen Modal:**
- Step indicator at top
- Large content area
- Navigation buttons at bottom
- Progress saved automatically

**Steps:**
1. What Are You Creating? (with mode toggle)
2. Who Is This For?
3. Configuration & Options
4. Fine-Tune (optional)
5. Summary & Apply

### Template Browser

**Modal Dialog:**
- List of saved templates
- Search/filter
- Preview on hover/click
- Load button per template
- Create new template option

### Score Comparison

**Side-by-Side Modal:**
- Two content pieces displayed
- Scores compared dimension-by-dimension
- Visual indicators (better/worse)
- Recommendation highlighted

### Modification Dialog

**Simple Modal:**
- Current content displayed (preview)
- Instruction textarea
- Examples/suggestions
- Apply button

### Voice Style Selector

**Modal with Grid:**
- All 26 personas in organized grid
- Category headers
- Description on hover
- Select and apply

### Save Output Dialog

**Modal:**
- Name input (required)
- Description textarea (optional)
- Customer selection dropdown
- Tags input (future feature)
- Save button

---

## Responsive Behavior

### Desktop (1200px+)

**Layout:**
```
Split view:
- Input panel: 40% width
- Results panel: 60% width
- Side-by-side display
```

### Tablet (768px - 1199px)

**Layout:**
```
Split view:
- Input panel: 45% width
- Results panel: 55% width
- Slightly condensed
```

### Mobile (< 768px)

**Layout:**
```
Stacked view:
- Input panel: Full width
- Results panel: Full width (below)
- Tab-based switching option
- Floating action bar: Always visible
- Collapsible sections: Collapsed by default
```

---

## Interaction Patterns

### Form Filling

**Auto-Save:**
- Saves to localStorage every 2 seconds
- No explicit save needed
- Survives page refresh

**Prefill Selection:**
- Click dropdown next to field
- Select saved prefill
- Value populates instantly
- Can still edit after population

**Template Loading:**
- Click "Load Template"
- Browse templates
- Click to load
- All fields populate
- Can customize after loading

### Content Generation

**Loading States:**
- Button shows spinner
- Disabled during generation
- Progress indication (if applicable)
- Cancel option (if supported)

**Success:**
- New card animates in
- Scrolls to new card
- Action buttons enabled
- Success toast notification

**Error:**
- Error toast with message
- Form remains filled
- Retry button available
- Error details logged

### Card Actions

**Click Action Button:**
- Modal opens (if needed for input)
- Or action executes immediately
- Loading state shown
- New card created or metadata updated

**Copy Buttons:**
- Click to copy
- Brief "Copied!" confirmation
- Clipboard receives content
- Format preserved (plain text vs HTML)

---

## Keyboard Shortcuts

**Global:**
- `Ctrl/Cmd + S`: Save output
- `Ctrl/Cmd + Enter`: Generate copy
- `Esc`: Close modal

**In Form:**
- `Tab`: Move to next field
- `Shift + Tab`: Previous field
- `Ctrl/Cmd + K`: Open wizard

**In Results:**
- `Ctrl/Cmd + C`: Copy selected card content
- `Ctrl/Cmd + Alt + A`: Generate alternative for selected

---

## Accessibility Features

### Screen Reader Support

**Semantic HTML:**
- Proper heading hierarchy
- Form labels associated
- ARIA labels where needed
- Focus management in modals

**Keyboard Navigation:**
- All actions keyboard accessible
- Logical tab order
- Focus indicators visible
- Skip links available

### Visual Accessibility

**Color Contrast:**
- WCAG AA compliant
- Dark mode optimized
- High contrast mode support

**Text Sizing:**
- Respects browser zoom
- Relative units (rem/em)
- Minimum 16px base

---

## State Indicators

### Loading States

**Spinner Types:**
- Button spinner (inline)
- Card skeleton (placeholder)
- Full overlay (modal actions)
- Progress bar (long operations)

### Success/Error States

**Visual Feedback:**
- ✅ Green checkmark (success)
- ❌ Red X (error)
- ⚠️ Yellow warning (caution)
- ℹ️ Blue info (information)

**Toast Notifications:**
- Bottom-right corner
- Auto-dismiss (5 seconds)
- Manual dismiss option
- Stack multiple if needed

### Form Validation

**Inline Validation:**
- Real-time for text inputs
- On blur for textareas
- Red border + error message
- Success indicator (green check)

**Submit Validation:**
- Prevents submission if invalid
- Scrolls to first error
- Highlights all errors
- Clear error messages

---

## Contextual Help

### Tooltips

**Trigger:** Hover over info icon
**Content:** Brief explanation of field purpose
**Placement:** Above/below icon (smart positioning)

**Example:**
```
[i] Tone Level
    
"1-3: Subtle expression
 4-6: Moderate (balanced)
 7-8: Strong
 9-10: Extreme"
```

### Field Descriptions

**Below Input:**
- Light gray text
- Explains purpose or format
- Provides examples where helpful

**Example:**
```
Special Instructions
[textarea]
Add unique requirements beyond standard options.
Example: "Maximum 3 sentences per paragraph"
```

---

## Visual Design Elements

### Color System

**Primary:** Blue (#3B82F6)
- Action buttons
- Links
- Active states

**Success:** Green (#10B981)
- Success messages
- Positive indicators
- Completion states

**Warning:** Yellow (#F59E0B)
- Caution messages
- Review needed
- Optional items

**Error:** Red (#EF4444)
- Error messages
- Validation failures
- Critical issues

**Neutral:** Gray scale
- Text (#1F2937 dark, #F9FAFB light)
- Borders (#E5E7EB)
- Backgrounds (theme-dependent)

### Typography

**Headings:**
- H1: 32px (page titles)
- H2: 24px (section titles)
- H3: 20px (subsections)
- H4: 18px (card headers)

**Body:**
- Base: 16px
- Small: 14px (meta info)
- Tiny: 12px (labels, timestamps)

**Font:**
- System font stack (fast loading)
- `-apple-system, BlinkMacSystemFont, "Segoe UI", ...`

### Spacing

**Consistent Scale:**
- 4px base unit
- 8px (small gap)
- 16px (medium gap)
- 24px (large gap)
- 32px (section separation)

---

## Animation & Transitions

### Micro-Interactions

**Hover States:**
- Buttons: Slight scale (1.02) + shadow
- Cards: Elevation increase
- Links: Underline appearance

**Click States:**
- Brief scale down (0.98)
- Ripple effect (material design)
- Immediate visual feedback

### Page Transitions

**Card Appearance:**
- Fade in + slide up
- 300ms duration
- Ease-out timing

**Modal Opening:**
- Fade background to dim
- Scale modal from 0.95 to 1
- 200ms duration

**Loading States:**
- Skeleton screens (preferred)
- Or spinner with fade-in delay (500ms)

---

## Mobile-Specific UI

### Touch Targets

**Minimum Size:** 44x44px (Apple HIG)
**Spacing:** 8px between targets
**Hit Area:** Padding extends beyond visual

### Gestures

**Swipe:**
- Swipe card left: Quick actions menu
- Swipe modal down: Dismiss

**Pinch:**
- Zoom on content cards (if long)

### Bottom Sheet

**For Mobile Modals:**
- Slides up from bottom
- Partial height initially
- Drag to expand/dismiss
- Better ergonomics than center modal

---

## Conclusion

CopyZap's UI prioritizes:
- ✅ Clarity and organization
- ✅ Efficient workflows
- ✅ Contextual actions
- ✅ Responsive design
- ✅ Accessibility
- ✅ Visual feedback

**Master the interface to maximize productivity.**
