# CopyZap - Data Flow & Dependencies Guide

## System Architecture Overview

Understanding how data flows through CopyZap helps optimize workflows and troubleshoot issues.

---

## High-Level Data Flow

```
User Input → Form State → Prompt Construction → AI API →
Response Processing → Content Cards → Actions → Enhanced Content
```

---

## Detailed Data Flow Stages

### Stage 1: Input Collection

**Sources:**
1. **Manual Form Entry:** User fills fields directly
2. **Wizard Generation:** AI generates configuration
3. **Template Loading:** Saved config applied
4. **Prefill Selection:** Saved values inserted
5. **URL Parameters:** Pre-population from links

**State Storage:**
- `FormState` object (React state)
- LocalStorage (persistence)
- Database (saved outputs only)

---

### Stage 2: Validation & Preparation

**Required Field Checks:**
```
IF mode === 'create':
  REQUIRED: businessDescription, productServiceName
  
IF mode === 'improve':
  REQUIRED: originalCopy

ALWAYS REQUIRED: tone, wordCount, model
```

**Authentication Check:**
- User must be logged in
- Token verification
- Rate limit check

---

### Stage 3: Prompt Construction

**System Prompt Building:**
```
Role Definition → Task Description → Quality Guidelines →
Output Format Instructions
```

**User Prompt Building:**
```
Core Context (business, audience, pain points) →
Content Parameters (tone, word count, style) →
Special Instructions →
Output Structure (if defined) →
SEO/GEO Requirements →
Keywords Integration
```

**Dependency Chain:**
- `businessDescription` influences all downstream content
- `targetAudience` shapes tone application
- `specialInstructions` overrides defaults
- `outputStructure` determines response format

---

### Stage 4: API Call Execution

**Endpoint Selection:**
Based on action:
- Generate Copy → `/copyGeneration`
- Generate Alternative → `/alternativeCopy`
- Apply Voice Style → `/voiceStyles`
- Modify Content → `/contentModification`
- Generate Scores → `/contentScoring` & `/geoScoring`
- Generate SEO → `/seoGeneration`

**Request Payload:**
```json
{
  "formData": { ...all form fields },
  "model": "selected-model",
  "userId": "user-id",
  "action": "specific-action"
}
```

**Token Tracking:**
- Input tokens counted
- Output tokens counted
- Stored to database
- User balance updated

---

### Stage 5: Response Processing

**AI Response Parsing:**
```
Raw Response → JSON Extraction → Content Parsing →
Structure Recognition → Formatting Application
```

**Output Types:**

**Unstructured:**
```
Plain text with implicit structure
```

**Structured:**
```json
{
  "sections": [
    {
      "type": "heading",
      "level": 1,
      "content": "..."
    },
    {
      "type": "paragraph",
      "content": "..."
    }
  ]
}
```

---

### Stage 6: Content Card Creation

**Card Data Structure:**
```typescript
{
  id: unique-id,
  type: 'generated' | 'alternative' | 'restyled' | 'modified',
  content: string | structured-object,
  metadata: {
    wordCount: number,
    timestamp: date,
    model: string,
    sourceId?: string, // for derivatives
    persona?: string,  // for restyled
    scores?: object
  }
}
```

**Relationship Tracking:**
- Original content: sourceId = null
- Alternative: sourceId = original-id
- Restyled: sourceId = parent-id, persona = name
- Modified: sourceId = parent-id

---

### Stage 7: Enhancement Actions

**Available Actions per Card:**

1. **Generate Alternative:**
   - Uses original formData
   - Creates new card with sourceId link
   
2. **Apply Voice Style:**
   - Takes card content
   - Sends to voice style endpoint with persona
   - Creates new card with sourceId + persona

3. **Modify Content:**
   - Takes card content + modification instruction
   - Sends to modification endpoint
   - Creates new card with sourceId link

4. **Generate Scores:**
   - Sends content for evaluation
   - Adds scores to card metadata
   - No new card created

5. **Generate FAQ Schema:**
   - Converts Q&A content to JSON-LD
   - Displays in modal
   - No new card created

---

## Dependencies & Relationships

### Field Dependencies

**Primary Dependencies:**

```
businessDescription influences:
  ├─→ All content generation
  ├─→ Tone interpretation
  ├─→ Keyword selection
  └─→ Example relevance

targetAudience influences:
  ├─→ Language complexity
  ├─→ Tone sophistication
  ├─→ Pain point relevance
  └─→ Benefit framing

outputStructure determines:
  ├─→ Response format
  ├─→ Section organization
  ├─→ Content distribution
  └─→ Word count allocation
```

**Optional Enhancement Dependencies:**

```
generateSeoMetadata requires:
  ├─→ keywords (recommended)
  ├─→ productServiceName
  └─→ content generated

generateGeo requires:
  └─→ content generated

voiceStyles requires:
  ├─→ existing content
  └─→ persona selection

modify requires:
  ├─→ existing content
  └─→ modification instruction
```

---

## State Management

### React State (useFormState hook)

**Managed Fields:**
```typescript
{
  // Core
  mode: 'create' | 'improve',
  model: string,
  
  // Content
  businessDescription: string,
  originalCopy: string,
  productServiceName: string,
  
  // Audience
  targetAudience: string,
  targetAudiencePainPoints: string,
  
  // Parameters
  tone: string,
  wordCount: string,
  language: string,
  
  // Advanced
  specialInstructions: string,
  keywords: string,
  outputStructure: array,
  
  // Features
  generateSeoMetadata: boolean,
  generateGeo: boolean,
  enhanceForGeo: boolean,
  
  // ... 30+ more fields
}
```

**State Updates:**
- User input → immediate state update
- Wizard completion → bulk state update
- Template load → bulk state update
- Prefill selection → single field update

---

### LocalStorage Persistence

**Stored Data:**

**1. Wizard State:**
```javascript
localStorage.setItem('wizardState', JSON.stringify({
  currentStep: number,
  answers: object,
  generatedData: object
}));
```

**2. Form State (auto-save):**
```javascript
localStorage.setItem('formState', JSON.stringify(formState));
```

**3. User Preferences:**
```javascript
localStorage.setItem('preferences', JSON.stringify({
  theme: 'dark' | 'light',
  defaultModel: string,
  // etc.
}));
```

**Cleared On:**
- Wizard completion
- Logout
- Manual clear

---

### Database Persistence (Supabase)

**Tables & Relationships:**

**saved_outputs:**
```
id
user_id (FK → auth.users)
customer_id (FK → customers)
form_snapshot (JSONB - all inputs)
generated_content (array of cards)
metadata (JSONB)
created_at
```

**customers:**
```
id
user_id (FK)
name
created_at
```

**templates:**
```
id
user_id (FK)
name
configuration (JSONB)
created_at
```

**prefills:**
```
id
user_id (FK)
field_name
value (text)
name
created_at
```

**token_usage:**
```
id
user_id (FK)
model
input_tokens
output_tokens
cost
created_at
```

---

## Critical Paths

### Path 1: Initial Generation

```
1. User fills form
   ├─→ Validates required fields
   └─→ Updates formState

2. User clicks "Generate Copy"
   ├─→ Checks authentication
   ├─→ Validates inputs
   └─→ Shows loading state

3. Constructs prompt
   ├─→ Builds system prompt
   ├─→ Builds user prompt
   └─→ Adds instructions

4. Calls AI API
   ├─→ Sends payload
   ├─→ Tracks tokens
   └─→ Awaits response

5. Processes response
   ├─→ Parses content
   ├─→ Creates card
   └─→ Updates UI

6. Displays result
   ├─→ Renders content
   ├─→ Shows actions
   └─→ Enables enhancements
```

### Path 2: Enhancement Flow

```
1. User clicks enhancement action
   ├─→ "Generate Alternative"
   ├─→ "Apply Voice Style"
   ├─→ "Modify Content"
   └─→ "Generate Score"

2. System prepares request
   ├─→ Gets parent content
   ├─→ Gets original formData (if needed)
   └─→ Adds specific instruction

3. Calls appropriate endpoint
   ├─→ Alternative: full generation
   ├─→ Voice Style: restyle with persona
   ├─→ Modify: apply instruction
   └─→ Score: evaluate content

4. Creates derivative or updates
   ├─→ New card (alternative, restyle, modify)
   └─→ Metadata update (scores)

5. Updates UI
   ├─→ Shows new card
   ├─→ Links to parent
   └─→ Enables further actions
```

### Path 3: Save & Retrieve

```
1. User saves output
   ├─→ Captures formState snapshot
   ├─→ Captures all generated cards
   └─→ Stores to database

2. User views dashboard
   ├─→ Queries saved outputs
   ├─→ Filters by customer/date
   └─→ Displays list

3. User opens saved output
   ├─→ Loads complete state
   ├─→ Restores form configuration
   ├─→ Displays all cards
   └─→ Enables new actions
```

---

## Error Handling & Edge Cases

### Validation Errors

**Missing Required Fields:**
```
IF mode === 'create' AND !businessDescription:
  SHOW: "Business Description required"
  PREVENT: Generation

IF !tone OR !wordCount:
  SHOW: "Select tone and word count"
  PREVENT: Generation
```

### API Errors

**Network Failure:**
```
TRY: API call
CATCH: Network error
  ├─→ Show error toast
  ├─→ Don't clear form
  └─→ Allow retry
```

**AI Error Response:**
```
IF response.error:
  ├─→ Parse error message
  ├─→ Show user-friendly message
  └─→ Log for debugging
```

**Rate Limiting:**
```
IF 429 status:
  ├─→ Show "Rate limit reached"
  ├─→ Suggest waiting
  └─→ Display retry time
```

### Data Edge Cases

**Empty Results:**
```
IF response.content === '':
  ├─→ Show "No content generated"
  ├─→ Suggest adjusting inputs
  └─→ Don't create empty card
```

**Malformed Structure:**
```
IF outputStructure defined BUT response unstructured:
  ├─→ Parse as unstructured
  ├─→ Display warning
  └─→ Show content anyway
```

---

## Performance Considerations

### Bottlenecks

**1. AI API Calls:**
- Slowest part (2-15 seconds)
- Cannot be parallelized per request
- Solution: Progressive enhancement (generate base fast, enhance selectively)

**2. Large Form State:**
- 40+ fields in state
- Solution: Memoization, careful re-renders

**3. Multiple Cards Rendering:**
- Many cards = performance impact
- Solution: Virtualization for 20+ cards

### Optimization Strategies

**1. Debouncing:**
```javascript
// Auto-save to localStorage
const debouncedSave = debounce(saveToLocalStorage, 1000);
```

**2. Memoization:**
```javascript
// Expensive computations
const processedContent = useMemo(() => 
  formatContent(content), 
  [content]
);
```

**3. Lazy Loading:**
```javascript
// Heavy components
const ScoreComparison = lazy(() => import('./ScoreComparison'));
```

---

## Data Security & Privacy

### Sensitive Data Handling

**Stored Locally (Not Synced):**
- Form state (until saved)
- Wizard state
- Draft content

**Stored in Database (Supabase):**
- Saved outputs
- Templates
- Prefills
- Token usage

**Never Stored:**
- AI API keys (server-side only)
- Payment information (Stripe handles)

### RLS (Row Level Security)

**Policy: Users can only access own data**
```sql
CREATE POLICY "Users access own saves"
  ON saved_outputs FOR ALL
  USING (auth.uid() = user_id);
```

**Applies to:**
- saved_outputs
- templates
- prefills
- customers
- token_usage

---

## Debugging Tips

### Common Issues

**Issue 1: Generation Fails Silently**

Check:
1. Browser console for errors
2. Network tab for API failures
3. Authentication status
4. Required fields populated

**Issue 2: Content Not Saving**

Check:
1. Database connection
2. RLS policies
3. User authentication
4. Payload structure

**Issue 3: Templates Not Loading**

Check:
1. Template exists in database
2. Template belongs to user
3. Configuration format valid
4. Required fields present

---

## Conclusion

Understanding CopyZap's data flow enables:
- ✅ Efficient workflow design
- ✅ Issue troubleshooting
- ✅ Feature optimization
- ✅ System customization
- ✅ Integration planning

**Master the data flow to master the system.**
