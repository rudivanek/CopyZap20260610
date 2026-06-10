# Typography System Implementation

## Overview

Implemented a dual typography system that applies Inter font and compact UI scaling to the main app while preserving the Help Center's dedicated documentation typography.

## Implementation Details

### 1. Font Loading (index.html)

Added Inter font import with proper preconnect optimization:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
```

### 2. Global Font Application (index.css)

Applied Inter globally with exclusion for Help Center:

```css
body:not(.help-center-active) {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### 3. Main App Typography Scale (index.css)

Implemented compact UI typography for all app routes EXCEPT `/help/*`:

#### Typography Scale

| Element | Size | Weight | Line Height | Margin |
|---------|------|--------|-------------|--------|
| Body | 14px | 400 | 1.5 | - |
| H1 (Page Titles) | 22px | 600 | 1.3 | 12px bottom |
| H2 (Panel Titles) | 18px | 600 | 1.4 | 8px bottom |
| H3 (Section Titles) | 16px | 600 | 1.4 | 6px bottom |
| Paragraphs | 14px | 400 | 1.5 | - |
| Labels | 13px | 500 | - | - |
| Buttons | 14px | 500 | - | - |
| Inputs/Selects/Textareas | 14px | 400 | - | - |
| Secondary Text (.text-secondary) | 12.5px | 400 | - | - |

All styles are scoped with `body:not(.help-center-active)` selector to exclude Help Center.

### 4. Help Center Typography Preservation

Help Center maintains its own dedicated typography system:

```css
.help-center-root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}
```

#### Help Center Scale (UNCHANGED)

| Element | Size | Weight | Line Height | Margins |
|---------|------|--------|-------------|---------|
| H1 | 32px | 600 | 1.2 | 16px bottom |
| H2 | 24px | 600 | 1.3 | 32px top, 12px bottom |
| H3 | 20px | 600 | 1.4 | 24px top, 8px bottom |
| Paragraphs | 16px | 400 | 1.6 | 16px bottom |
| Lists | 16px | 400 | 1.6 | 16px bottom, 24px left padding |

### 5. Route-Based Class Toggle (App.tsx)

Added automatic class management based on current route:

```typescript
React.useEffect(() => {
  if (location.pathname.startsWith('/help')) {
    document.body.classList.add('help-center-active');
  } else {
    document.body.classList.remove('help-center-active');
  }
}, [location.pathname]);
```

## How It Works

1. **Main App Routes** (`/`, `/dashboard`, `/copy-maker`, etc.)
   - Body has NO `.help-center-active` class
   - Inter font applies via `body:not(.help-center-active)`
   - Compact typography scale applies (14px base)
   - All UI elements use smaller, tighter spacing

2. **Help Center Routes** (`/help/*`)
   - Body has `.help-center-active` class
   - Global app typography is excluded
   - Help Center wrapper (`.help-center-root`) takes over
   - Larger documentation-focused typography (16px base)
   - Preserved spacing and hierarchy

## Visual Differences

### Main App (Compact)
- 14px base text
- Tighter line heights (1.5)
- Smaller headings (22px → 16px)
- Compact spacing
- Modern UI feel

### Help Center (Documentation)
- 16px base text
- Comfortable line heights (1.6)
- Larger headings (32px → 20px)
- Generous spacing
- Documentation feel

## Benefits

✅ Modern, clean Inter font across entire app
✅ Compact UI reduces visual clutter in main app
✅ Help Center remains readable and documentation-focused
✅ Automatic switching based on route
✅ No manual intervention required
✅ Clean CSS architecture with clear separation

## Files Modified

1. `/index.html` - Added Inter font import
2. `/src/index.css` - Added typography scales and selectors
3. `/src/App.tsx` - Added route-based class toggling
4. `/src/components/help/HelpLayout.tsx` - Already had `.help-center-root` wrapper (no changes needed)

## Testing

Build successful with no errors related to typography changes.

```bash
npm run build
✓ built in 21.84s
```

## Browser Compatibility

Inter font loads with proper fallbacks:
- Inter (primary)
- -apple-system (macOS)
- BlinkMacSystemFont (Windows)
- Segoe UI (Windows)
- Roboto (Android)
- sans-serif (universal fallback)
