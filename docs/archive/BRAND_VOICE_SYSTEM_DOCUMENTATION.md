# Brand Voice System - Complete Technical Documentation

## Table of Contents
1. [Overview](#1-overview)
2. [Customer Management System](#2-customer-management-system)
3. [Database Structure](#3-database-structure-supabase)
4. [Frontend UX Flow](#4-frontend-ux-flow-react--supabase)
5. [API Logic / Functions](#5-api-logic--functions)
6. [AI Brand Voice Generation](#6-ai-brand-voice-generation)
7. [How Brand Voices Are Used in Copy Generation](#7-how-brand-voices-are-used-in-copy-generation)
8. [Full End-to-End Example](#8-full-end-to-end-example)

---

## 1. Overview

### What is the Brand Voice System?

The Brand Voice System is a comprehensive feature that allows users to **define, store, and automatically apply a brand's unique writing style** across all AI-generated content. It ensures consistency in tone, personality, vocabulary, sentence structure, punctuation rules, and call-to-action styles.

### Why Does It Exist?

**Problem**: When generating marketing copy for different clients or brands, maintaining a consistent brand voice manually is time-consuming and error-prone. Different team members might interpret brand guidelines differently, leading to inconsistent messaging.

**Solution**: The Brand Voice System acts as a **centralized, AI-enforceable brand style guide** that:
- Captures brand personality traits, tone, and writing patterns
- Stores vocabulary preferences and forbidden terms
- Defines specific punctuation and grammar rules
- Automatically injects these rules into every AI generation request
- Can be created manually, via AI description, or by scanning a brand's website

### Key Capabilities

1. **Multiple Creation Methods**:
   - Manual entry of all brand voice parameters
   - AI generation from brand description + sample text
   - URL scanning (hybrid method) that extracts brand voice from website content

2. **Granular Control**:
   - Personality traits (e.g., "friendly", "authoritative", "playful")
   - Tone style (e.g., "conversational-warm", "formal-professional")
   - Sentence style (e.g., "short-punchy", "flowing-descriptive")
   - Preferred vocabulary (words/phrases the brand uses frequently)
   - Forbidden terms (words/phrases to avoid)
   - CTA style (how calls-to-action should be phrased)
   - Punctuation rules (Oxford comma, contractions, sentence length, exclamation frequency)

3. **Multi-Customer Support**:
   - Each brand voice is tied to a specific customer
   - Agencies can manage multiple client brand voices
   - Prevents cross-contamination between different brand identities

4. **Template Integration**:
   - Templates can save and restore brand voice selections
   - Ensures consistent voice across multiple copy generation sessions

---

## 2. Customer Management System

### Overview

The Customer Management system is the **foundation** of the Brand Voice system. Before brand voices can be created, customers must exist in the system. Each customer represents a client, brand, or project that the user works with.

### Purpose

**Why Customers Are Needed**:
1. **Organization**: Group brand voices, templates, and copy sessions by client
2. **Multi-Client Support**: Agencies can manage multiple clients in one place
3. **Data Isolation**: Ensure brand voices don't get mixed up between different clients
4. **Relationship Tracking**: Link all work (sessions, templates, brand voices) to specific customers

### Database: `pmc_customers` Table

#### Schema

```sql
CREATE TABLE public.pmc_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  user_id uuid REFERENCES public.pmc_users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pmc_customers_name ON public.pmc_customers(name);
CREATE INDEX idx_pmc_customers_user_id ON public.pmc_customers(user_id);
```

#### Column Descriptions

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key, auto-generated |
| `name` | text | NO | Customer/client name (e.g., "GreenLeaf Organics", "Acme Corp") |
| `description` | text | YES | Optional notes about the customer |
| `user_id` | uuid | YES | Foreign key to `pmc_users.id`. Owner of this customer. **ON DELETE CASCADE** removes customer if user is deleted. |
| `created_at` | timestamptz | NO | Timestamp when customer was created |

#### Row Level Security (RLS)

```sql
ALTER TABLE public.pmc_customers ENABLE ROW LEVEL SECURITY;

-- Users can create their own customers
CREATE POLICY "Users can insert their own customers"
  ON public.pmc_customers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view all customers (allows shared/default customers)
CREATE POLICY "Users can select all customers"
  ON public.pmc_customers FOR SELECT
  USING (true);

-- Users can only update their own customers
CREATE POLICY "Users can update their own customers"
  ON public.pmc_customers FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own customers
CREATE POLICY "Users can delete their own customers"
  ON public.pmc_customers FOR DELETE
  USING (auth.uid() = user_id);
```

**Key Security Points**:
- **SELECT is open** (`USING (true)`): All users can view all customers, including default/shared customers
- **INSERT/UPDATE/DELETE are restricted**: Only the owner can modify/delete their customers
- This allows for shared default customers (e.g., "General", "Small Business") while protecting user-created customers

#### Default Customers

The system includes pre-populated default customers that all users can see and use:

```sql
INSERT INTO public.pmc_customers (id, name, description, user_id)
VALUES
  (gen_random_uuid(), 'General', 'Default customer for general content', NULL),
  (gen_random_uuid(), 'Small Business', 'Small to medium-sized businesses', NULL),
  (gen_random_uuid(), 'Enterprise', 'Large enterprise clients', NULL),
  (gen_random_uuid(), 'E-commerce', 'Online retail businesses', NULL),
  (gen_random_uuid(), 'Education', 'Educational institutions and services', NULL),
  (gen_random_uuid(), 'Healthcare', 'Medical and healthcare services', NULL),
  (gen_random_uuid(), 'Technology', 'Tech companies and startups', NULL),
  (gen_random_uuid(), 'Non-profit', 'Non-profit organizations', NULL);
```

**Note**: `user_id` is `NULL` for default customers, making them visible to all users but not editable by anyone.

### Frontend: Manage Customers Page

**File**: `src/components/ManageCustomers.tsx`

#### UI Components

1. **Header Section**:
   - Title: "Manage Customers"
   - Description: "Manage your customers and clients. These help you organize your copy projects."
   - Back button to Dashboard
   - Refresh button

2. **Search Bar**:
   - Real-time filtering by customer name or description
   - Icon: `<Search />`

3. **Add New Customer Button**:
   - Opens inline form
   - Icon: `<Plus />`

4. **Add New Customer Form** (inline):
   - **Customer Name** (required)
   - **Description** (optional, textarea)
   - **Save** button (green)
   - **Cancel** button (gray)

5. **Customer List**:
   - Each customer card shows:
     - Customer name (clickable, routes to detail page)
     - Description (if provided)
     - Created date
     - Action buttons:
       - **View Details & Brand Voices** (`<Eye />`) - Routes to `/manage-customers/:customerId`
       - **Edit** (`<Edit />`) - Inline edit mode
       - **Delete** (`<Trash2 />`) - Confirmation dialog

6. **Edit Mode** (inline):
   - Replaces card content with edit form
   - Pre-filled name and description
   - **Save** and **Cancel** buttons

7. **Empty State**:
   - Icon: `<Users size={48} />`
   - Message: "No customers yet. Add your first customer!"
   - Prompt to add customer

#### User Workflows

**Adding a Customer**:
1. User clicks "Add New Customer"
2. Inline form appears
3. User enters name (required) and optional description
4. Clicks "Save"
5. **API Call**: `INSERT INTO pmc_customers` via Supabase
6. Success toast: "Customer added successfully!"
7. Form clears and list refreshes

**Editing a Customer**:
1. User clicks Edit (pencil icon) on a customer card
2. Card switches to edit mode with pre-filled fields
3. User modifies name/description
4. Clicks "Save"
5. **API Call**: `UPDATE pmc_customers SET name=..., description=... WHERE id=...`
6. Success toast: "Customer updated successfully!"
7. Card returns to view mode, list refreshes

**Deleting a Customer**:
1. User clicks Delete (trash icon)
2. Browser confirm dialog: "Are you sure you want to delete '[Customer Name]'? This action cannot be undone."
3. If confirmed:
   - **API Call**: `DELETE FROM pmc_customers WHERE id=...`
   - Success toast: "Customer '[Name]' deleted successfully!"
   - **Cascade Effect**: All related brand voices are automatically deleted due to `ON DELETE CASCADE`
4. If cancelled: No action

**Viewing Customer Details**:
1. User clicks on customer name OR "View Details" icon
2. Routes to `/manage-customers/:customerId`
3. Shows customer detail page with brand voices section (see next section)

#### State Management

```typescript
const [customers, setCustomers] = useState<Customer[]>([]);
const [searchQuery, setSearchQuery] = useState('');
const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
const [isAddingNew, setIsAddingNew] = useState(false);
const [editingId, setEditingId] = useState<string | null>(null);
```

#### API Operations

**Fetch Customers**:
```typescript
const { data, error } = await supabase
  .from('pmc_customers')
  .select('*')
  .eq('user_id', currentUser.id)
  .order('name');
```

**Create Customer**:
```typescript
const { data, error } = await supabase
  .from('pmc_customers')
  .insert({
    name: newName.trim(),
    description: newDescription.trim() || null,
    user_id: currentUser.id
  })
  .select()
  .single();
```

**Update Customer**:
```typescript
const { error } = await supabase
  .from('pmc_customers')
  .update({
    name: editName.trim(),
    description: editDescription.trim() || null
  })
  .eq('id', customerId);
```

**Delete Customer**:
```typescript
const { error } = await supabase
  .from('pmc_customers')
  .delete()
  .eq('id', customer.id);
```

### Dashboard Integration

**File**: `src/components/Dashboard.tsx`

The Dashboard provides quick access to customer management:

1. **"Customers" Button** in header:
   - Icon: `<Users />`
   - Label: "Customers"
   - Routes to `/manage-customers`
   - Styled with primary blue color

2. **Copy Sessions Table** includes customer column:
   - Shows `session.customer?.name || 'No customer'`
   - Allows filtering sessions by customer

**Dashboard Header Example**:
```tsx
<Link
  to="/manage-customers"
  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
  title="Manage Customers"
>
  <Users size={16} className="mr-2" />
  <span className="hidden sm:inline">Customers</span>
</Link>
```

### Relationship to Brand Voices

**Dependency**: Brand voices **require** a customer to exist first.

When a user:
1. Creates a customer
2. Clicks on the customer name or "View Details"
3. Routes to **Customer Detail Page** (`/manage-customers/:customerId`)
4. Can now add brand voices for that specific customer

**Data Flow**:
```
User → Creates Customer → Customer Detail Page → Creates Brand Voice → Brand Voice tied to Customer
```

**Database Relationship**:
```sql
-- Brand voice references customer
customer_id uuid NOT NULL REFERENCES public.pmc_customers(id) ON DELETE CASCADE
```

If a customer is deleted, all their brand voices are automatically deleted (cascade).

### Validation and Error Handling

**Frontend Validation**:
- Customer name: Required, min 1 character after trim
- Description: Optional, max length not enforced (database default)

**Backend Validation** (via Supabase):
- Name: `NOT NULL` constraint
- user_id: Must reference valid user (foreign key constraint)

**Error Messages**:
| Operation | Success Message | Error Message |
|-----------|----------------|---------------|
| Create | "Customer added successfully!" | "Failed to add customer: [error]" |
| Update | "Customer updated successfully!" | "Failed to update customer: [error]" |
| Delete | "Customer '[name]' deleted successfully!" | "Failed to delete customer: [error]" |
| Fetch | (silent success) | "Failed to load customers: [error]" |

### Access from Copy Maker

In the Copy Maker form, users can select a customer from a dropdown:

```tsx
<CustomerSelector
  value={customerId}
  onChange={(id) => setCustomerId(id)}
  currentUser={currentUser}
/>
```

**When customer is selected**:
1. Brand Voice dropdown becomes visible
2. Brand voices are filtered to show only those for selected customer
3. Templates can save the customer ID for future sessions

---

## 3. Database Structure (Supabase)

### Table: `pmc_public_brand_voices`

This is the primary table that stores all brand voice configurations.

#### Schema

```sql
CREATE TABLE public.pmc_public_brand_voices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.pmc_customers(id) ON DELETE CASCADE,
  owner_user_id uuid REFERENCES public.pmc_users(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  personality_traits text[] DEFAULT '{}',
  tone_style text,
  sentence_style text,
  preferred_vocabulary text[] DEFAULT '{}',
  forbidden_terms text[] DEFAULT '{}',
  cta_style text,
  punctuation_rules jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

#### Column Descriptions

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key, auto-generated |
| `customer_id` | uuid | NO | Foreign key to `pmc_customers.id`. Ties this voice to a specific customer/brand. **ON DELETE CASCADE** ensures cleanup. |
| `owner_user_id` | uuid | YES | Foreign key to `pmc_users.id`. Tracks which user created this voice. **ON DELETE SET NULL** preserves the voice if user is deleted. |
| `name` | text | NO | Display name for the brand voice (e.g., "Main Brand Voice", "Campaign 2024") |
| `description` | text | YES | Optional 1-2 sentence summary of the brand voice |
| `personality_traits` | text[] | NO | Array of adjectives describing brand personality (e.g., `{"friendly", "professional", "innovative"}`) |
| `tone_style` | text | YES | Overall tone descriptor (e.g., "conversational-warm", "formal-authoritative") |
| `sentence_style` | text | YES | Sentence structure preference (e.g., "short-punchy", "flowing-descriptive") |
| `preferred_vocabulary` | text[] | NO | Array of words/phrases the brand should use (e.g., `{"empower", "transform", "community"}`) |
| `forbidden_terms` | text[] | NO | Array of words/phrases to avoid (e.g., `{"cheap", "just", "actually"}`) |
| `cta_style` | text | YES | Call-to-action style. Allowed values: `"direct-action"`, `"subtle-invitation"`, `"friendly-invitation"`, `"enthusiastic-action"`, `"consultative-invitation"`, `"urgent-action"` |
| `punctuation_rules` | jsonb | NO | JSON object containing punctuation preferences (see below) |
| `created_at` | timestamptz | NO | Timestamp when the voice was created |
| `updated_at` | timestamptz | NO | Timestamp of last update |

#### Punctuation Rules Structure

The `punctuation_rules` column is a JSONB object with the following schema:

```typescript
{
  use_oxford_comma?: boolean;           // Whether to use Oxford/serial comma
  prefer_short_sentences?: boolean;     // Prefer concise sentences
  max_sentence_length?: number;         // Maximum words per sentence (10-40)
  use_contractions?: boolean;           // Use contractions (don't vs. do not)
  exclamation_frequency?: 'rare' | 'moderate' | 'frequent'; // How often to use exclamation marks
}
```

### Relationships

#### Relationship to `pmc_customers`

```sql
customer_id uuid NOT NULL REFERENCES public.pmc_customers(id) ON DELETE CASCADE
```

- **One-to-Many**: A customer can have multiple brand voices
- **Cascade Delete**: If a customer is deleted, all their brand voices are automatically deleted
- **Why**: Each brand voice is customer-specific. This prevents orphaned brand voices.

#### Relationship to `pmc_templates`

Templates can reference brand voices:

```sql
-- From migration: 20251115190547_add_customer_brand_voice_to_templates.sql
ALTER TABLE public.pmc_templates
ADD COLUMN brand_voice_id uuid REFERENCES public.pmc_public_brand_voices(id) ON DELETE SET NULL;
```

- **Optional Reference**: Templates can optionally save a brand voice ID
- **Set NULL on Delete**: If the brand voice is deleted, the template's `brand_voice_id` becomes NULL
- **Why**: Templates can remember which brand voice to use when loaded

### Indexes

```sql
-- Primary key index (automatic)
CREATE INDEX idx_pmc_public_brand_voices_pkey ON pmc_public_brand_voices(id);

-- Customer lookup (automatic from foreign key)
CREATE INDEX idx_pmc_public_brand_voices_customer_id ON pmc_public_brand_voices(customer_id);

-- Template brand voice lookup
CREATE INDEX idx_pmc_templates_brand_voice_id ON pmc_templates(brand_voice_id);
```

**Optimization Recommendations**:

1. **Composite Index for User-Customer Queries** (if users filter by their own voices):
```sql
CREATE INDEX idx_brand_voices_owner_customer ON pmc_public_brand_voices(owner_user_id, customer_id);
```

2. **GIN Index for Array Searches** (if you search within vocabulary arrays):
```sql
CREATE INDEX idx_brand_voices_preferred_vocab_gin ON pmc_public_brand_voices USING GIN (preferred_vocabulary);
CREATE INDEX idx_brand_voices_forbidden_terms_gin ON pmc_public_brand_voices USING GIN (forbidden_terms);
```

### Row Creation, Update, and Deletion

#### Creating a Row

Rows are created via the `useBrandVoices` hook's `createVoice` function:

```typescript
const { data, error } = await supabase
  .from('pmc_public_brand_voices')
  .insert({
    customer_id: customerId,
    owner_user_id: userId,
    name: 'Brand Voice Name',
    description: 'Optional description',
    personality_traits: ['friendly', 'professional'],
    tone_style: 'conversational-warm',
    sentence_style: 'clear-concise',
    preferred_vocabulary: ['empower', 'transform'],
    forbidden_terms: ['cheap', 'just'],
    cta_style: 'direct-action',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: false,
      max_sentence_length: 25,
      use_contractions: true,
      exclamation_frequency: 'moderate'
    }
  })
  .select()
  .single();
```

#### Updating a Row

```typescript
const { error } = await supabase
  .from('pmc_public_brand_voices')
  .update({
    name: 'Updated Name',
    description: 'Updated description',
    // ... other fields
  })
  .eq('id', brandVoiceId);
```

#### Deleting a Row

```typescript
const { error } = await supabase
  .from('pmc_public_brand_voices')
  .delete()
  .eq('id', brandVoiceId);
```

**Important**: Due to the `ON DELETE CASCADE` relationship, deleting a customer will automatically delete all associated brand voices.

### Security (Row Level Security - RLS)

**Current Implementation**: The table likely has RLS policies that restrict access based on:
- User authentication status
- Ownership via `owner_user_id`
- Customer relationship via `customer_id`

**Recommended RLS Policies**:

```sql
-- Users can view brand voices for their customers
CREATE POLICY "Users can view own customer brand voices"
  ON pmc_public_brand_voices FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND pmc_customers.user_id = auth.uid()
    )
  );

-- Users can create brand voices for their customers
CREATE POLICY "Users can create brand voices for own customers"
  ON pmc_public_brand_voices FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pmc_customers
      WHERE pmc_customers.id = pmc_public_brand_voices.customer_id
      AND pmc_customers.user_id = auth.uid()
    )
  );

-- Users can update their own brand voices
CREATE POLICY "Users can update own brand voices"
  ON pmc_public_brand_voices FOR UPDATE
  TO authenticated
  USING (owner_user_id = auth.uid())
  WITH CHECK (owner_user_id = auth.uid());

-- Users can delete their own brand voices
CREATE POLICY "Users can delete own brand voices"
  ON pmc_public_brand_voices FOR DELETE
  TO authenticated
  USING (owner_user_id = auth.uid());
```

---

## 3. Frontend UX Flow (React + Supabase)

### Component Hierarchy

```
CustomerDetail (Main Container)
├── BrandVoiceCard (Display Component)
│   ├── Shows: name, description, personality traits preview
│   ├── Actions: Edit button, Delete button
│   └── Styling: Hover effects, truncated trait display
│
├── BrandVoiceModal (Creation/Edit Form)
│   ├── Method Selection: AI Generate, Preset, Manual
│   ├── AI Tab:
│   │   ├── Option 1: Manual Description
│   │   │   ├── Brand description textarea
│   │   │   ├── Optional sample text textarea
│   │   │   └── "Generate Brand Voice" button
│   │   └── Option 2: URL Scanning
│   │       ├── Website URL input
│   │       ├── "Scan About Page" checkbox
│   │       └── "Scan & Generate Brand Voice" button
│   │
│   ├── Preset Tab:
│   │   └── Dropdown with pre-configured brand voice templates
│   │
│   ├── Manual/Advanced Fields:
│   │   ├── Description textarea
│   │   ├── Personality Traits (tag input)
│   │   ├── Tone Style input
│   │   ├── Sentence Style input
│   │   ├── Preferred Vocabulary (tag input)
│   │   ├── Forbidden Terms (tag input)
│   │   ├── CTA Style dropdown
│   │   └── Punctuation Rules section:
│   │       ├── Oxford comma checkbox
│   │       ├── Short sentences checkbox
│   │       ├── Max sentence length slider (10-40 words)
│   │       ├── Contractions checkbox
│   │       └── Exclamation frequency dropdown
│   │
│   └── Footer: Cancel button, Save button
│
└── BrandVoiceSelector (Used in Copy Maker)
    ├── Conditional Render: Only shows if customerId is selected
    ├── Dropdown: Lists all brand voices for the customer
    ├── Option: "No brand voice (use form settings)"
    └── Help Text: Explains what brand voices do
```

### User Journey: Accessing Brand Voices

1. **Navigate to Customer Detail Page**
   - User clicks "Manage Customers" from main menu
   - Selects a customer from the list
   - Routes to `/customer/:customerId`

2. **View Brand Voices Section**
   - Page loads `CustomerDetail` component
   - `useBrandVoices(customerId)` hook fetches all voices for this customer
   - If loading: Shows `<LoadingSpinner />`
   - If empty: Shows empty state with "Add Your First Brand Voice" button
   - If data: Shows grid of `<BrandVoiceCard />` components

### User Journey: Adding a New Brand Voice

#### Method 1: AI Generation from Description

1. User clicks **"Add Brand Voice"** button
2. `BrandVoiceModal` opens with `method='ai'` (default for new voices)
3. User enters:
   - **Brand Voice Name** (required)
   - **Brand Description** (e.g., "A luxury skincare brand focusing on natural ingredients...")
   - **Sample Text** (optional, helps AI understand writing style)
4. User clicks **"Generate Brand Voice"**
5. **Frontend Flow**:
   ```
   BrandVoiceModal.handleGenerateWithAI()
   → calls generateBrandVoice(aiDescription, aiSampleText)
   → API makes request to OpenAI GPT-4o
   → Returns structured JSON with all brand voice fields
   → Modal populates all manual fields with AI-generated values
   → User reviews and can edit before saving
   ```
6. User clicks **"Save Brand Voice"**
7. `useBrandVoices.createVoice()` inserts row into Supabase
8. Success toast appears, modal closes, list refreshes

#### Method 2: URL Scanning (Hybrid Method)

1. User clicks **"Add Brand Voice"** button
2. In modal, scrolls to **"Option 2: Scan Website for Brand Voice"**
3. User enters:
   - **Website URL** (e.g., `https://example.com`)
   - **Scan About Page checkbox** (optional, combines homepage + about page)
4. User clicks **"Scan & Generate Brand Voice"**
5. **Frontend Flow**:
   ```
   BrandVoiceModal.handleScanWebsite()
   → calls extractBrandVoiceFromUrl(websiteUrl, scanAboutPage)
   → Calls Supabase Edge Function: extract-brand-voice-from-url
   → Edge function fetches HTML from URL(s)
   → Edge function extracts text content
   → Returns combined text to frontend
   → Frontend sends text to OpenAI GPT-4o with brand voice extraction prompt
   → Returns structured JSON with all brand voice fields
   → Modal populates all manual fields with extracted values
   → User reviews and can edit before saving
   ```
6. User clicks **"Save Brand Voice"**
7. Data saved to Supabase as described above

#### Method 3: Preset Selection

1. User clicks **"Add Brand Voice"** button
2. User switches to **"Use Preset"** tab
3. Dropdown shows pre-configured options from `brandVoicePresets.ts`:
   - Professional & Authoritative
   - Friendly & Conversational
   - Bold & Energetic
   - Minimalist & Clear
   - Creative & Playful
   - Persuasive & Urgent
4. User selects preset → all fields auto-populate
5. User reviews, edits if needed, then saves

#### Method 4: Manual Entry

1. User clicks **"Add Brand Voice"** button
2. User switches to **"Manual"** tab
3. User fills in all fields manually using tag inputs, text inputs, sliders, and checkboxes
4. User saves

#### Method 5: Save Generated Output as Brand Voice

**NEW FEATURE**: Users can now convert any generated copy output directly into a Brand Voice profile.

1. User generates copy in the CopyMaker
2. Generated output appears in the results panel
3. User clicks **"Save as Brand Voice"** button (BookOpen icon) in the output card header
4. System validates:
   - A customer must be selected (shows error toast if not)
   - Output content must exist
5. BrandWise modal opens automatically:
   - Modal switches to **"Paste Copy"** method
   - Textarea is pre-filled with the generated output text
   - Customer is already selected (from form state)
6. User clicks **"Analyze & Generate Brand Voice"**
7. AI analyzes the output and generates Brand Voice structure
8. Advanced fields auto-populate with AI-generated values
9. User can review/edit any fields
10. User enters a name for the Brand Voice
11. User clicks **"Save Brand Voice"**
12. New Brand Voice is saved to `pmc_public_brand_voices` linked to the customer

**Benefits**:
- Quickly create Brand Voices from successful copy outputs
- Learn from what the AI generated that worked well
- Build brand consistency from proven content
- Streamlined workflow from generation to brand voice capture

### User Journey: Editing a Brand Voice

1. User clicks **Edit (pencil icon)** on a `BrandVoiceCard`
2. `BrandVoiceModal` opens with `editingVoice` populated
3. Modal shows **only manual fields** (no method selection for edits)
4. Special feature: **"Regenerate with AI"** button appears
   - If clicked, switches back to AI tab with description pre-filled
   - Allows re-generating from scratch while keeping the name
5. User modifies fields
6. User clicks **"Save Changes"**
7. `useBrandVoices.updateVoice()` updates the row
8. Success toast, modal closes, list refreshes

### User Journey: Deleting a Brand Voice

1. User clicks **Delete (trash icon)** on a `BrandVoiceCard`
2. Browser confirm dialog: *"Are you sure you want to delete "[Brand Voice Name]"? This action cannot be undone."*
3. If confirmed:
   - `useBrandVoices.deleteVoice()` deletes the row
   - Success toast appears
   - List refreshes automatically
4. If cancelled: No action taken

### Validation Rules

#### Frontend Validation

- **Name**: Required, min 1 character after trim
- **Personality Traits**: Array can be empty, duplicates prevented
- **Preferred Vocabulary**: Array can be empty, duplicates prevented
- **Forbidden Terms**: Array can be empty, duplicates prevented
- **CTA Style**: Optional, dropdown-enforced values if selected
- **Max Sentence Length**: Slider-enforced range (10-40)
- **Exclamation Frequency**: Dropdown-enforced values (`rare`, `moderate`, `frequent`)

#### API Validation

When calling `createVoice()` or `updateVoice()`:
- Supabase validates `customer_id` exists (foreign key constraint)
- Supabase validates `owner_user_id` exists if provided
- RLS policies validate user has access to the customer

### Error Handling and Notifications

All operations use `react-hot-toast` for user feedback:

| Operation | Success Message | Error Message |
|-----------|----------------|---------------|
| Create | "Brand voice created successfully!" | "Failed to create brand voice: [error]" |
| Update | "Brand voice updated successfully!" | "Failed to update brand voice: [error]" |
| Delete | "Brand voice deleted successfully!" | "Failed to delete brand voice: [error]" |
| Fetch | (silent success) | "Failed to load brand voices: [error]" |
| AI Generate | "Brand voice generated! Review and save." | "Failed to generate brand voice: [error]" |
| URL Scan | "Brand voice extracted from website! Review and save." | "Failed to extract brand voice from website: [error]" |

### When API Calls Are Triggered

1. **Fetch Voices**: Automatically on component mount when `customerId` changes
2. **Create Voice**: When user clicks "Save Brand Voice" in modal (new voice)
3. **Update Voice**: When user clicks "Save Changes" in modal (editing)
4. **Delete Voice**: When user confirms deletion
5. **AI Generation**: When user clicks "Generate Brand Voice"
6. **URL Scanning**: When user clicks "Scan & Generate Brand Voice"

### Component Data Flow

```
useBrandVoices Hook (Data Layer)
↓
- Manages state: voices[], loading, error
- Provides: createVoice(), updateVoice(), deleteVoice(), refetch()
- Auto-fetches on customerId change
↓
CustomerDetail Component (Container)
↓
- Receives: voices, loading, CRUD functions
- Manages: modal state, editing state
- Passes data to child components
↓
BrandVoiceCard (Display) / BrandVoiceModal (Form)
```

---

## 4. API Logic / Functions

### useBrandVoices Hook

**File**: `src/hooks/useBrandVoices.ts`

This is the primary data management hook for brand voices.

#### Hook Interface

```typescript
interface UseBrandVoicesReturn {
  voices: BrandVoice[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createVoice: (voice: Omit<BrandVoice, 'id' | 'created_at' | 'updated_at'>) => Promise<BrandVoice | null>;
  updateVoice: (id: string, updates: Partial<Omit<BrandVoice, 'id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteVoice: (id: string) => Promise<boolean>;
}

export const useBrandVoices = (customerId?: string): UseBrandVoicesReturn
```

#### How It Works

**1. Fetching Brand Voices**

```typescript
const fetchVoices = useCallback(async () => {
  if (!customerId) {
    setVoices([]);
    setLoading(false);
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const { data, error: fetchError } = await supabase
      .from('pmc_public_brand_voices')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (fetchError) throw fetchError;

    setVoices(data || []);
  } catch (err: any) {
    console.error('Error fetching brand voices:', err);
    const errorMsg = `Failed to load brand voices: ${err.message}`;
    setError(errorMsg);
    toast.error(errorMsg);
  } finally {
    setLoading(false);
  }
}, [customerId]);

useEffect(() => {
  fetchVoices();
}, [fetchVoices]);
```

**Key Points**:
- Fetches only voices for the specified `customerId`
- Orders by `created_at` descending (newest first)
- Auto-refetches when `customerId` changes
- Gracefully handles missing `customerId` by clearing voices

**2. Creating a Voice**

```typescript
const createVoice = async (voice: Omit<BrandVoice, 'id' | 'created_at' | 'updated_at'>): Promise<BrandVoice | null> => {
  try {
    const { data, error: insertError } = await supabase
      .from('pmc_public_brand_voices')
      .insert({
        ...voice,
        personality_traits: voice.personality_traits || [],
        preferred_vocabulary: voice.preferred_vocabulary || [],
        forbidden_terms: voice.forbidden_terms || [],
        punctuation_rules: voice.punctuation_rules || {}
      })
      .select()
      .single();

    if (insertError) throw insertError;

    toast.success('Brand voice created successfully!');
    await fetchVoices(); // Refresh list
    return data;
  } catch (err: any) {
    console.error('Error creating brand voice:', err);
    toast.error(`Failed to create brand voice: ${err.message}`);
    return null;
  }
};
```

**Key Points**:
- Ensures arrays/objects have defaults to prevent null issues
- Returns created voice data on success
- Automatically refetches list to show new voice
- Returns `null` on error

**3. Updating a Voice**

```typescript
const updateVoice = async (id: string, updates: Partial<...>): Promise<boolean> => {
  try {
    const { error: updateError } = await supabase
      .from('pmc_public_brand_voices')
      .update(updates)
      .eq('id', id);

    if (updateError) throw updateError;

    toast.success('Brand voice updated successfully!');
    await fetchVoices(); // Refresh list
    return true;
  } catch (err: any) {
    console.error('Error updating brand voice:', err);
    toast.error(`Failed to update brand voice: ${err.message}`);
    return false;
  }
};
```

**Key Points**:
- Allows partial updates (only specified fields)
- Returns boolean success status
- Refetches to ensure UI shows updated data

**4. Deleting a Voice**

```typescript
const deleteVoice = async (id: string): Promise<boolean> => {
  try {
    const { error: deleteError } = await supabase
      .from('pmc_public_brand_voices')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    toast.success('Brand voice deleted successfully!');
    await fetchVoices(); // Refresh list
    return true;
  } catch (err: any) {
    console.error('Error deleting brand voice:', err);
    toast.error(`Failed to delete brand voice: ${err.message}`);
    return false;
  }
};
```

**Key Points**:
- Returns boolean success status
- Refetches to remove deleted voice from UI

### Security Implementation

All database operations respect Supabase RLS policies:
- Authenticated users can only access voices for their customers
- Queries are automatically filtered by RLS
- No manual permission checks needed in frontend code

### Real-Time Updates

**Current Implementation**: No real-time subscriptions

**Recommendation** (Optional Enhancement):

```typescript
useEffect(() => {
  if (!customerId) return;

  const subscription = supabase
    .channel(`brand_voices_${customerId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'pmc_public_brand_voices',
      filter: `customer_id=eq.${customerId}`
    }, (payload) => {
      fetchVoices(); // Refresh on any change
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}, [customerId, fetchVoices]);
```

This would enable multi-user collaboration with instant updates.

### Helper Utilities

**BrandVoiceSelector Component**

**File**: `src/components/ui/BrandVoiceSelector.tsx`

Used in the Copy Maker form to select a brand voice:

```typescript
const BrandVoiceSelector: React.FC<{
  customerId?: string;
  value?: string;
  onChange: (brandVoiceId: string) => void;
  className?: string;
}> = ({ customerId, value, onChange, className }) => {
  const { voices, loading } = useBrandVoices(customerId);

  if (!customerId) return null; // Only show if customer selected

  return (
    <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
      <option value="">No brand voice (use form settings)</option>
      {voices.map(voice => (
        <option key={voice.id} value={voice.id}>
          {voice.name}
        </option>
      ))}
    </select>
  );
};
```

**Key Points**:
- Conditionally renders only when `customerId` is provided
- Shows "No brand voice" option (allows user to opt out)
- Directly uses `useBrandVoices` for data
- Updates parent form state via `onChange`

---

## 5. AI Brand Voice Generation

### Overview of Methods

The Brand Voice system supports three AI-powered generation methods:

1. **Manual AI Generation**: User describes the brand, AI generates voice parameters
2. **URL Scanning (Hybrid)**: System scrapes website, AI analyzes content to extract brand voice
3. **Preset Selection**: Pre-configured templates that can be AI-refined later

### Method 1: Manual AI Generation

**File**: `src/services/api/brandVoiceGeneration.ts`

#### Function Signature

```typescript
async function generateBrandVoice(
  brandDescription: string,
  sampleText?: string
): Promise<GeneratedBrandVoice>
```

#### Input Parameters

- `brandDescription` (required): 1-2 sentence description of the brand
  - Example: *"A luxury skincare brand that focuses on natural ingredients and sustainable practices"*
- `sampleText` (optional): Existing copy that represents the brand's voice
  - Example: *"Discover the transformative power of nature. Our organic formulas harness botanical essences..."*

#### AI Prompt Structure

**System Prompt**:
```
You are an AI generating a structured Brand Voice profile.
Return JSON only in this exact schema:
{
  "description": "",
  "personality_traits": [],
  "tone_style": "",
  "sentence_style": "",
  "preferred_vocabulary": [],
  "forbidden_terms": [],
  "cta_style": "",
  "punctuation_rules": {
    "use_oxford_comma": true,
    "prefer_short_sentences": false,
    "max_sentence_length": 25,
    "use_contractions": true,
    "exclamation_frequency": "moderate"
  }
}

Fill all fields based on the brand description and optional sample text provided.
- description: 1-2 sentence summary of the brand voice
- personality_traits: 4-6 adjectives describing the brand personality
- tone_style: e.g., "conversational-warm", "formal-professional", "casual-playful"
- sentence_style: e.g., "short-punchy", "flowing-descriptive", "clear-concise"
- preferred_vocabulary: 8-12 words/phrases this brand should use
- forbidden_terms: 5-8 words/phrases to avoid
- cta_style: one of: "direct-action", "subtle-invitation", "friendly-invitation",
  "enthusiastic-action", "consultative-invitation", "urgent-action"
- punctuation_rules: appropriate settings based on the brand style

Return ONLY valid JSON, no additional text.
```

**User Prompt**:
```
Brand Description: [brandDescription]

Sample Text: [sampleText] (if provided)
```

#### API Configuration

- **Model**: `gpt-4o`
- **Max Tokens**: `2000`
- **Temperature**: `0.7` (balanced creativity)
- **Response Format**: JSON mode enforced
- **Operation Type**: `brand_voice_generation` (for token tracking)

#### Response Handling

```typescript
const response = await makeApiRequestWithFallback(
  systemPrompt,
  userPrompt,
  'gpt-4o',
  2000,
  0.7,
  undefined,
  undefined,
  'brand_voice_generation'
);

const cleanedResponse = cleanJsonResponse(response); // Remove markdown, extra formatting
const parsed = JSON.parse(cleanedResponse);

return {
  description: parsed.description || '',
  personality_traits: parsed.personality_traits || [],
  tone_style: parsed.tone_style || '',
  sentence_style: parsed.sentence_style || '',
  preferred_vocabulary: parsed.preferred_vocabulary || [],
  forbidden_terms: parsed.forbidden_terms || [],
  cta_style: parsed.cta_style || 'direct-action',
  punctuation_rules: {
    use_oxford_comma: parsed.punctuation_rules?.use_oxford_comma ?? true,
    prefer_short_sentences: parsed.punctuation_rules?.prefer_short_sentences ?? false,
    max_sentence_length: parsed.punctuation_rules?.max_sentence_length ?? 25,
    use_contractions: parsed.punctuation_rules?.use_contractions ?? true,
    exclamation_frequency: parsed.punctuation_rules?.exclamation_frequency ?? 'moderate'
  }
};
```

**Key Features**:
- Defaults for all fields prevent null issues
- Validation ensures proper data types
- Error handling with descriptive messages

#### Error Handling

```typescript
catch (error: any) {
  console.error('Error generating brand voice:', error);
  throw new Error(error.message || 'Failed to generate brand voice');
}
```

Frontend catches this and displays user-friendly error toast.

---

### Method 2: URL Scanning (Hybrid Method)

This is the most sophisticated method, combining web scraping with AI analysis.

**File**: `src/services/api/urlBrandVoiceExtraction.ts`

#### Function Signature

```typescript
async function extractBrandVoiceFromUrl(
  url: string,
  scanAbout: boolean = false
): Promise<ExtractedBrandVoice>
```

#### Input Parameters

- `url` (required): Website URL (must start with `http://` or `https://`)
- `scanAbout` (optional, default: `false`): Whether to also scan the About page

#### Step 1: Fetch Text from URL via Edge Function

The frontend doesn't directly fetch the URL (CORS issues). Instead, it calls a Supabase Edge Function:

**Edge Function**: `extract-brand-voice-from-url`
**File**: `supabase/functions/extract-brand-voice-from-url/index.ts`

**How It Works**:

```typescript
async function fetchTextFromUrl(url: string, scanAbout: boolean): Promise<string> {
  const edgeFunctionUrl = `${VITE_SUPABASE_URL}/functions/v1/extract-brand-voice-from-url`;

  const response = await fetch(edgeFunctionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ url, scanAbout })
  });

  const data = await response.json();
  if (!data.success) throw new Error(data.error);

  return data.text; // Returns cleaned text content
}
```

**Edge Function Implementation**:

1. **Fetch Homepage HTML**:
```typescript
const response = await fetch(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; BrandVoiceScanner/1.0)',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  }
});
const html = await response.text();
```

2. **Extract Text from HTML**:
```typescript
function extractTextFromHtml(html: string): string {
  // Remove script, style, nav, footer, header tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  text = text.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '');
  text = text.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '');
  text = text.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '');

  // Convert block elements to newlines
  text = text.replace(/<\/?(p|h1|h2|h3|h4|h5|h6|li|div|br)[^>]*>/gi, '\n');

  // Remove all remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');

  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ');
  text = text.replace(/&amp;/g, '&');
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&#39;/g, "'");

  // Clean up whitespace
  text = text.replace(/\n\s*\n/g, '\n\n');
  text = text.replace(/[ \t]+/g, ' ');
  return text.trim();
}
```

3. **Try to Fetch About Page** (if `scanAbout` is true):
```typescript
async function tryFetchAboutPage(baseUrl: string): Promise<string | null> {
  const aboutPaths = ['/about', '/about-us', '/about-me', '/our-story'];

  for (const path of aboutPaths) {
    try {
      const aboutUrl = `${origin}${path}`;
      const response = await fetch(aboutUrl, { ... });

      if (response.ok) {
        const html = await response.text();
        return extractTextFromHtml(html);
      }
    } catch (err) {
      continue; // Try next path
    }
  }

  return null; // No about page found
}
```

4. **Combine and Limit Text**:
```typescript
let combinedText = homepageText;

if (scanAbout) {
  const aboutText = await tryFetchAboutPage(url);
  if (aboutText) {
    combinedText += '\n\n--- About Page ---\n\n' + aboutText;
  }
}

combinedText = limitText(combinedText, 6000); // Truncate to 6000 chars
```

**Why 6000 characters?**
- Balances comprehensiveness with token limits
- Typically captures key brand messaging without overwhelming the AI
- Stays well within GPT-4o's context window

#### Step 2: AI Analysis of Website Content

Once text is extracted, the frontend sends it to OpenAI for brand voice analysis:

**AI Prompt Structure**:

**System Prompt**:
```
You are an AI specializing in brand voice detection.

Analyze the following website content and extract the brand's tone, personality,
vocabulary, CTA style, and writing style.

Return ONLY JSON in this exact schema:
{
  "description": "",
  "personality_traits": [],
  "tone_style": "",
  "sentence_style": "",
  "preferred_vocabulary": [],
  "forbidden_terms": [],
  "cta_style": "",
  "punctuation_rules": { ... }
}

Instructions:
- description: 1-2 sentence summary of the brand voice based on the content
- personality_traits: 4-6 adjectives that describe the brand personality
- tone_style: overall tone (e.g., "professional-friendly", "casual-energetic")
- sentence_style: sentence structure (e.g., "short-direct", "flowing-descriptive")
- preferred_vocabulary: 8-12 words/phrases commonly used by this brand
- forbidden_terms: 5-8 words/phrases that don't fit this brand's voice
- cta_style: the call-to-action style used
- punctuation_rules: appropriate settings based on the writing style

Return ONLY valid JSON, no additional text.
```

**User Prompt**:
```
Website Content:

[combinedText from homepage and/or about page]
```

#### API Configuration

- **Model**: `gpt-4o`
- **Max Tokens**: `2500` (slightly higher for content analysis)
- **Temperature**: `0.7`
- **Response Format**: JSON object mode

#### Response Injection

The AI-generated brand voice fields are automatically injected into the BrandVoiceModal's form state:

```typescript
setDescription(result.description);
setPersonalityTraits(result.personality_traits);
setToneStyle(result.tone_style);
setSentenceStyle(result.sentence_style);
setPreferredVocabulary(result.preferred_vocabulary);
setForbiddenTerms(result.forbidden_terms);
setCtaStyle(result.cta_style);
setUseOxfordComma(result.punctuation_rules.use_oxford_comma ?? true);
// ... etc
```

User can then:
- Review all generated fields
- Edit any field manually
- Save the brand voice

#### Error Handling

**URL Validation**:
```typescript
if (!url || !url.trim()) {
  throw new Error('URL is required');
}

if (!url.match(/^https?:\/\//i)) {
  throw new Error('URL must start with http:// or https://');
}
```

**Insufficient Content**:
```typescript
if (!combinedText || combinedText.length < 100) {
  throw new Error('Could not extract enough text from the website');
}
```

**Network Errors**:
```typescript
catch (error: any) {
  console.error('Error extracting brand voice from URL:', error);
  throw new Error(error.message || 'Failed to extract brand voice from URL');
}
```

All errors surface as toast notifications in the UI.

---

### Method 3: Preset Templates

**File**: `src/config/brandVoicePresets.ts`

Pre-configured brand voice templates that provide instant setup:

```typescript
export const BRAND_VOICE_PRESETS: Record<string, BrandVoicePreset> = {
  'professional-authoritative': {
    name: 'Professional & Authoritative',
    description: 'Expert-level, credible, fact-based communication',
    personality_traits: ['knowledgeable', 'trustworthy', 'authoritative', 'clear'],
    tone_style: 'formal-professional',
    sentence_style: 'structured-clear',
    preferred_vocabulary: ['proven', 'research', 'expertise', 'results', 'effective'],
    forbidden_terms: ['maybe', 'hopefully', 'probably', 'sort of'],
    cta_style: 'consultative-invitation',
    punctuation_rules: {
      use_oxford_comma: true,
      prefer_short_sentences: false,
      max_sentence_length: 30,
      use_contractions: false,
      exclamation_frequency: 'rare'
    }
  },
  // ... more presets
};
```

**Usage Flow**:
1. User selects preset from dropdown
2. `handlePresetSelect()` populates all form fields
3. User can immediately save or customize further

---

## 6. How Brand Voices Are Used in Copy Generation

### Overview

When a brand voice is selected, it is **automatically injected into the system prompt** of every AI copy generation request. This ensures that all generated content adheres to the brand's style guidelines without manual intervention.

### Brand Voice Hierarchy (NEW)

**IMPORTANT**: Brand Voice now operates as a **baseline framework** with session-specific overrides.

**The Hierarchy**:
1. **Brand Voice** = Default/baseline settings (tone, vocabulary, CTA style, punctuation rules, etc.)
2. **Form Inputs** = Session-specific overrides (tone selector, writing style, special instructions, etc.)

**How It Works**:
- Brand Voice provides the foundation and consistent style
- When specific form inputs conflict with Brand Voice settings, **form inputs take precedence**
- This allows users to maintain brand consistency while having flexibility for specific copy needs

**Example**:
- Brand Voice says: "Use exclamations rarely"
- User form says: "Make it more enthusiastic"
- Result: AI will prioritize the user's session-specific instruction

**Implementation**:
The system prompt explicitly states this hierarchy:
```
BRAND VOICE HIERARCHY:
This brand voice provides the baseline framework and default style for the copy.
However, when specific form inputs for this session (tone, writing style, special instructions, etc.)
conflict with brand voice settings, the form inputs take precedence.
Think of brand voice as the foundation, and form inputs as session-specific overrides.
```

**Benefits**:
- Consistency by default (Brand Voice is always applied)
- Flexibility when needed (session overrides allow customization)
- Clear expectations (users understand they can override without changing the Brand Voice)
- No need to edit Brand Voice for one-off variations

### Fetch and Inject Flow

**File**: `src/services/api/copyGeneration.ts`

#### Step 1: Fetch Brand Voice Data

```typescript
async function fetchBrandVoice(brandVoiceId: string): Promise<BrandVoice | null> {
  if (!brandVoiceId) return null;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('pmc_public_brand_voices')
      .select('*')
      .eq('id', brandVoiceId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching brand voice:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in fetchBrandVoice:', error);
    return null;
  }
}
```

**Called During Generation**:
```typescript
let brandVoice: BrandVoice | null = null;
if (formState.brandVoiceId) {
  if (progressCallback) {
    progressCallback('Loading brand voice settings...');
  }
  brandVoice = await fetchBrandVoice(formState.brandVoiceId);
  if (brandVoice && progressCallback) {
    progressCallback(`Applying brand voice: ${brandVoice.name}`);
  }
}
```

#### Step 2: Build System Prompt with Brand Voice

The brand voice is injected into the system prompt as a dedicated section:

```typescript
// Add brand voice instructions if specified
if (brandVoice) {
  systemPrompt += `\n\n=== BRAND VOICE: ${brandVoice.name} ===`;

  if (brandVoice.description) {
    systemPrompt += `\n${brandVoice.description}`;
  }

  if (brandVoice.personality_traits && brandVoice.personality_traits.length > 0) {
    systemPrompt += `\n\nPersonality Traits:`;
    brandVoice.personality_traits.forEach(trait => {
      systemPrompt += `\n- ${trait}`;
    });
  }

  if (brandVoice.tone_style) {
    systemPrompt += `\n\nTone Style: ${brandVoice.tone_style}`;
  }

  if (brandVoice.sentence_style) {
    systemPrompt += `\nSentence Style: ${brandVoice.sentence_style}`;
  }

  if (brandVoice.preferred_vocabulary && brandVoice.preferred_vocabulary.length > 0) {
    systemPrompt += `\n\nPreferred Vocabulary: ${brandVoice.preferred_vocabulary.join(', ')}`;
  }

  if (brandVoice.forbidden_terms && brandVoice.forbidden_terms.length > 0) {
    systemPrompt += `\n\nForbidden Terms (DO NOT USE): ${brandVoice.forbidden_terms.join(', ')}`;
  }

  if (brandVoice.cta_style) {
    systemPrompt += `\n\nCall-to-Action Style: ${brandVoice.cta_style}`;
  }

  if (brandVoice.punctuation_rules) {
    systemPrompt += `\n\nPunctuation Rules:`;
    if (brandVoice.punctuation_rules.use_oxford_comma !== undefined) {
      systemPrompt += `\n- Oxford comma: ${brandVoice.punctuation_rules.use_oxford_comma ? 'Required' : 'Not used'}`;
    }
    if (brandVoice.punctuation_rules.prefer_short_sentences) {
      systemPrompt += `\n- Prefer short, punchy sentences`;
      if (brandVoice.punctuation_rules.max_sentence_length) {
        systemPrompt += ` (max ${brandVoice.punctuation_rules.max_sentence_length} words)`;
      }
    }
    if (brandVoice.punctuation_rules.use_contractions !== undefined) {
      systemPrompt += `\n- Contractions: ${brandVoice.punctuation_rules.use_contractions ? 'Use liberally' : 'Avoid'}`;
    }
    if (brandVoice.punctuation_rules.exclamation_frequency) {
      systemPrompt += `\n- Exclamation marks: ${brandVoice.punctuation_rules.exclamation_frequency}`;
    }
  }

  systemPrompt += `\n\nIMPORTANT: Strictly adhere to this brand voice throughout the entire copy.`;
}
```

### Example System Prompt Output

**Without Brand Voice**:
```
You are a professional copywriter specializing in [industry].

Write [tone] copy in [language].
Target audience: [audience description]
Key message: [message]
```

**With Brand Voice**:
```
You are a professional copywriter specializing in [industry].

Write [tone] copy in [language].
Target audience: [audience description]
Key message: [message]

=== BRAND VOICE: Eco-Friendly Wellness ===
A warm, knowledgeable brand focused on natural health and environmental sustainability.

Personality Traits:
- caring
- knowledgeable
- authentic
- eco-conscious

Tone Style: conversational-warm
Sentence Style: flowing-descriptive

Preferred Vocabulary: nurture, holistic, sustainable, natural, wellness, harmony, balance

Forbidden Terms (DO NOT USE): cheap, discount, toxic, harsh, artificial

Call-to-Action Style: friendly-invitation

Punctuation Rules:
- Oxford comma: Required
- Contractions: Use liberally
- Exclamation marks: rare

IMPORTANT: Strictly adhere to this brand voice throughout the entire copy.
```

### Merging with User-Selected Tone

**Conflict Resolution Strategy**:

1. **Brand Voice Tone Takes Priority**: If a brand voice is selected, its `tone_style` overrides the user's manual tone selection
2. **Additive Personality**: User-selected tone adjectives are merged with brand voice traits
3. **Vocabulary Enforcement**: Brand voice vocabulary and forbidden terms are strictly enforced

**Example Conflict**:
- User selects: Tone = "Bold"
- Brand voice has: `tone_style = "conversational-warm"`
- **Result**: System prompt emphasizes "conversational-warm" but notes the user wants "boldness", asking AI to balance both

**Handling Code**:
```typescript
// Build tone instruction
let toneInstruction = `Tone: ${formState.tone}`;

if (brandVoice && brandVoice.tone_style) {
  toneInstruction += ` (aligned with brand voice: ${brandVoice.tone_style})`;
}

systemPrompt += `\n${toneInstruction}`;
```

### Impact on AI Output

**Before Brand Voice**:
- AI has broad creative freedom
- Tone is loosely interpreted
- Vocabulary is generic
- Punctuation follows AI defaults

**After Brand Voice**:
- AI strictly follows personality traits
- Vocabulary is constrained to preferred terms
- Forbidden terms are actively avoided
- Punctuation rules are enforced
- CTA style is consistent across all sections

**Real Example**:

**Input**: "Write a product description for organic hand cream"

**Output Without Brand Voice**:
```
Our organic hand cream is perfect for anyone who wants soft, smooth hands.
Made with natural ingredients! Buy now and get 20% off!
```

**Output With Brand Voice** (Eco-Friendly Wellness):
```
Nurture your skin with our holistic hand cream, crafted from sustainably
sourced botanicals. Experience the harmony of nature's most caring
ingredients as they restore balance and wellness to your hands.
Discover your natural radiance today.
```

---

## 7. Full End-to-End Example

This section walks through a complete workflow from customer creation to content generation with a brand voice.

### Scenario

**Business**: "GreenLeaf Organics" - An organic food delivery service
**User**: Marketing manager Sarah
**Goal**: Create consistent, eco-conscious copy across all marketing materials

---

### Step 1: Create a Customer

1. Sarah logs into the app
2. Navigates to **"Manage Customers"**
3. Clicks **"Add Customer"**
4. Enters customer name: **"GreenLeaf Organics"**
5. Clicks **"Save"**
6. Customer is created with ID: `abc123-customer-id`

**Database State**:
```sql
INSERT INTO pmc_customers (id, user_id, name)
VALUES ('abc123-customer-id', 'sarah-user-id', 'GreenLeaf Organics');
```

---

### Step 2: Add a Brand Voice Manually

1. Sarah clicks on **"GreenLeaf Organics"** customer card
2. Routes to `/customer/abc123-customer-id`
3. Sees empty state: **"No brand voices yet"**
4. Clicks **"Add Your First Brand Voice"**
5. Modal opens with **"AI Generate"** tab selected (default)
6. Sarah switches to **"Manual"** tab to have full control
7. Fills in fields:

**Form Data**:
```typescript
{
  name: "GreenLeaf Main Voice",
  description: "Warm, eco-conscious voice that emphasizes freshness and sustainability",
  personality_traits: ["caring", "fresh", "sustainable", "knowledgeable"],
  tone_style: "conversational-friendly",
  sentence_style: "clear-inviting",
  preferred_vocabulary: ["fresh", "organic", "local", "seasonal", "harvest", "nourish"],
  forbidden_terms: ["cheap", "processed", "artificial", "mass-produced"],
  cta_style: "friendly-invitation",
  punctuation_rules: {
    use_oxford_comma: true,
    prefer_short_sentences: false,
    max_sentence_length: 25,
    use_contractions: true,
    exclamation_frequency: "moderate"
  }
}
```

8. Clicks **"Save Brand Voice"**
9. Success toast: "Brand voice created successfully!"
10. Modal closes, brand voice card appears in list

**Database State**:
```sql
INSERT INTO pmc_public_brand_voices (
  id, customer_id, owner_user_id, name, description,
  personality_traits, tone_style, sentence_style,
  preferred_vocabulary, forbidden_terms, cta_style, punctuation_rules
) VALUES (
  'bv123-brand-voice-id',
  'abc123-customer-id',
  'sarah-user-id',
  'GreenLeaf Main Voice',
  'Warm, eco-conscious voice that emphasizes freshness and sustainability',
  ARRAY['caring', 'fresh', 'sustainable', 'knowledgeable'],
  'conversational-friendly',
  'clear-inviting',
  ARRAY['fresh', 'organic', 'local', 'seasonal', 'harvest', 'nourish'],
  ARRAY['cheap', 'processed', 'artificial', 'mass-produced'],
  'friendly-invitation',
  '{"use_oxford_comma":true,"prefer_short_sentences":false,"max_sentence_length":25,"use_contractions":true,"exclamation_frequency":"moderate"}'::jsonb
);
```

---

### Step 3: Add a Brand Voice via URL Scan

Sarah wants to create a second brand voice based on a competitor's website to understand differences.

1. Still on customer detail page, clicks **"Add Brand Voice"** again
2. Modal opens, **"AI Generate"** tab is active
3. Scrolls to **"Option 2: Scan Website for Brand Voice"** section
4. Enters:
   - **Website URL**: `https://farmfreshtogo.com`
   - **Scan About Page checkbox**: ✅ Checked
5. Clicks **"Scan & Generate Brand Voice"**

**Behind the Scenes**:

**Frontend**:
```typescript
extractBrandVoiceFromUrl('https://farmfreshtogo.com', true)
```

**Edge Function Call**:
```http
POST /functions/v1/extract-brand-voice-from-url
{
  "url": "https://farmfreshtogo.com",
  "scanAbout": true
}
```

**Edge Function Process**:
1. Fetches `https://farmfreshtogo.com`
2. Extracts text: *"Farm Fresh delivers locally sourced produce... sustainability... community..."*
3. Attempts to fetch `/about-us` → Success
4. Extracts text: *"Founded in 2015... commitment to organic farming... family-owned..."*
5. Combines texts (6000 char limit)
6. Returns to frontend:
```json
{
  "success": true,
  "text": "Farm Fresh delivers locally sourced produce...\n\n--- About Page ---\n\nFounded in 2015...",
  "length": 4823
}
```

**AI Analysis**:
```typescript
// Frontend sends combined text to OpenAI GPT-4o
makeApiRequestWithFallback(
  'gpt-4o',
  [
    { role: 'system', content: 'You are an AI specializing in brand voice detection...' },
    { role: 'user', content: 'Website Content:\n\n[4823 chars of text]' }
  ],
  0.7,
  2500,
  { type: 'json_object' }
)
```

**AI Response**:
```json
{
  "description": "Community-focused, family-oriented brand emphasizing local sourcing and freshness",
  "personality_traits": ["friendly", "local", "family-oriented", "reliable"],
  "tone_style": "warm-community-driven",
  "sentence_style": "conversational-accessible",
  "preferred_vocabulary": ["local", "fresh", "family", "community", "sourced", "seasonal"],
  "forbidden_terms": ["industrial", "chain", "corporate", "mass-market"],
  "cta_style": "friendly-invitation",
  "punctuation_rules": {
    "use_oxford_comma": true,
    "prefer_short_sentences": true,
    "max_sentence_length": 20,
    "use_contractions": true,
    "exclamation_frequency": "frequent"
  }
}
```

6. Modal fields auto-populate with AI-generated values
7. Success toast: "Brand voice extracted from website! Review and save."
8. Sarah reviews, edits the name field to: **"Competitor Analysis - FarmFresh"**
9. Clicks **"Save Brand Voice"**
10. Second brand voice is saved

**Database State**:
```sql
-- Now has 2 brand voices for GreenLeaf Organics customer
```

---

### Step 4: Edit a Brand Voice

Sarah realizes she wants to add "earth-friendly" to the personality traits.

1. Clicks **Edit (pencil icon)** on "GreenLeaf Main Voice" card
2. Modal opens with all fields pre-filled
3. In **"Personality Traits"** section, types "earth-friendly" and presses Enter
4. New tag appears: `earth-friendly`
5. Clicks **"Save Changes"**
6. Success toast: "Brand voice updated successfully!"

**Database Update**:
```sql
UPDATE pmc_public_brand_voices
SET personality_traits = ARRAY['caring', 'fresh', 'sustainable', 'knowledgeable', 'earth-friendly']
WHERE id = 'bv123-brand-voice-id';
```

---

### Step 5: Use Brand Voice in Copy Maker

Sarah now wants to generate a homepage hero section using the brand voice.

1. Navigates to **"Copy Maker"** from main menu
2. In the form:
   - **Customer dropdown**: Selects **"GreenLeaf Organics"**
   - **Brand Voice dropdown**: Now appears (because customer is selected)
   - **Brand Voice**: Selects **"GreenLeaf Main Voice"**
3. Fills in other fields:
   - **Tab**: Create New Copy
   - **What do you want to create?**: "Homepage hero section for organic food delivery service"
   - **Target Audience**: "Health-conscious families seeking convenient organic options"
   - **Key Message**: "Fresh, local produce delivered to your door"
   - **Tone**: Friendly (will be merged with brand voice)
   - **Word Count**: Medium (100-200)
4. Clicks **"Generate Copy"**

**Behind the Scenes**:

**Form State**:
```typescript
{
  customerId: "abc123-customer-id",
  brandVoiceId: "bv123-brand-voice-id",
  businessDescription: "Homepage hero section for organic food delivery service",
  targetAudience: "Health-conscious families seeking convenient organic options",
  keyMessage: "Fresh, local produce delivered to your door",
  tone: "Friendly",
  wordCount: "Medium: 100-200",
  // ... other fields
}
```

**Copy Generation Process**:

1. **Fetch Brand Voice**:
```typescript
const brandVoice = await fetchBrandVoice("bv123-brand-voice-id");
// Returns: { name: "GreenLeaf Main Voice", personality_traits: [...], ... }
```

2. **Build System Prompt**:
```text
You are a professional copywriter specializing in organic food marketing.

Write Friendly copy in English.
Target audience: Health-conscious families seeking convenient organic options
Key message: Fresh, local produce delivered to your door

=== BRAND VOICE: GreenLeaf Main Voice ===
Warm, eco-conscious voice that emphasizes freshness and sustainability

Personality Traits:
- caring
- fresh
- sustainable
- knowledgeable
- earth-friendly

Tone Style: conversational-friendly
Sentence Style: clear-inviting

Preferred Vocabulary: fresh, organic, local, seasonal, harvest, nourish

Forbidden Terms (DO NOT USE): cheap, processed, artificial, mass-produced

Call-to-Action Style: friendly-invitation

Punctuation Rules:
- Oxford comma: Required
- Contractions: Use liberally
- Exclamation marks: moderate

IMPORTANT: Strictly adhere to this brand voice throughout the entire copy.

Word count target: 100-200 words (medium length)
```

3. **User Prompt**:
```text
Create a homepage hero section for an organic food delivery service.

Business context:
Homepage hero section for organic food delivery service

Target audience:
Health-conscious families seeking convenient organic options

Key message:
Fresh, local produce delivered to your door
```

4. **AI Generation** (GPT-4o):
```text
Nourish your family with the season's freshest organic harvest, delivered right
to your doorstep. We partner with local farms to bring you sustainably grown
fruits, vegetables, and wholesome ingredients that you'll feel great about serving.

Every box is packed with care, ensuring you receive the highest quality produce
at peak freshness. From crisp greens to sun-ripened tomatoes, our seasonal
selections make healthy eating effortless and delicious.

Join our community of earth-friendly families who trust us to provide nutritious,
organic ingredients week after week. Discover how easy it is to eat well and
support local farmers.

Start your fresh food journey today – choose your box and experience the
difference real, organic food makes.
```

**Analysis of Output**:
- ✅ Uses preferred vocabulary: "Nourish", "harvest", "fresh", "seasonal", "organic", "local"
- ✅ Avoids forbidden terms: No "cheap", "processed", "artificial"
- ✅ CTA style: "Start your fresh food journey today" (friendly-invitation)
- ✅ Contractions used: "you'll", "it's"
- ✅ Oxford comma present: "fruits, vegetables, and wholesome"
- ✅ Moderate exclamations: None used (appropriate for warm tone)
- ✅ Personality traits evident: caring, fresh, sustainable, earth-friendly

5. Sarah sees the generated copy in the results panel
6. Clicks **"Copy to Clipboard"** and pastes into her website CMS

---

### Step 6: Expected AI Output Differences

**Same Prompt, Without Brand Voice**:

Sarah tries generating the same hero section without selecting a brand voice:

```text
Get Fresh Organic Food Delivered Fast

Tired of grocery shopping? We bring farm-fresh organic produce straight to
your door! Our convenient delivery service makes healthy eating easy.

Order today and get 20% off your first box!

Free shipping on orders over $50. No commitment required – cancel anytime.

Shop now and start eating healthier!
```

**Differences**:
- ❌ Generic, promotional tone
- ❌ Uses "cheap" tactics (discount focus)
- ❌ Lacks warmth and sustainability emphasis
- ❌ CTA is urgent/pushy: "Shop now!"
- ❌ No mention of local farms or community
- ❌ Vocabulary is bland: "fast", "convenient", "easy" (not earth-conscious)

**With Brand Voice**:
- ✅ Warm, caring tone
- ✅ Emphasizes sustainability and community
- ✅ Vocabulary aligns with organic/earth-friendly values
- ✅ CTA is inviting, not pushy
- ✅ Mentions local farms and seasonal produce
- ✅ Personality shines through every sentence

---

### Step 7: Save as Template (Optional)

Sarah wants to reuse this setup for future hero sections:

1. Clicks **"Save as Template"** button
2. Modal asks for template name: **"Homepage Hero - GreenLeaf"**
3. System saves:
   - All form inputs
   - **Customer ID**: `abc123-customer-id`
   - **Brand Voice ID**: `bv123-brand-voice-id`
4. Next time Sarah loads this template:
   - Customer dropdown auto-selects "GreenLeaf Organics"
   - Brand Voice dropdown auto-selects "GreenLeaf Main Voice"
   - All other fields populate
   - Sarah just needs to tweak content and generate

**Database State**:
```sql
INSERT INTO pmc_templates (
  id, user_id, template_name, template_type,
  customer_id, brand_voice_id, -- KEY: These are saved
  business_description, target_audience, key_message, tone, word_count,
  -- ... all other form fields
) VALUES (
  'tmpl789-template-id',
  'sarah-user-id',
  'Homepage Hero - GreenLeaf',
  'create',
  'abc123-customer-id',
  'bv123-brand-voice-id',
  -- ... rest of form data
);
```

---

## Conclusion

The Brand Voice system provides:

1. **Consistency**: All content follows the same brand guidelines
2. **Efficiency**: No need to manually specify tone/style for every generation
3. **Scalability**: Agencies can manage dozens of client brand voices
4. **Quality**: AI outputs are significantly more on-brand and professional
5. **Flexibility**: Multiple creation methods (manual, AI, URL scan, presets)

By centralizing brand voice rules in the database and automatically injecting them into AI prompts, the system ensures that every piece of generated content sounds authentically like the brand – without any extra effort from the user.
