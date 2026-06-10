# Copy Snap Batch Tester

Automated testing tool that generates comprehensive test cases for Copy Snap functionality.

## Overview

This batch tester:
- **Tests 20 diverse posts** in English, Spanish, and German
- **Generates questions** using AI (DeepSeek) across all matrix combinations
- **Covers 90 combinations per post** (1,800 total generations)
- **Saves results** to a single Markdown file for review

## Matrix Dimensions

For each of the 20 test posts, generates questions with ALL combinations of:

- **5 Intents**: Clarify, Challenge, Explore, Convert, Count
- **3 Question Counts**: 1, 3, 5 questions
- **3 Tones**: Soft, Direct, Humane
- **2 Humane Toggle**: YES (conversational), NO (neutral)

**Total**: 5 × 3 × 3 × 2 = **90 combinations per post** = **1,800 total question sets**

## Test Cases

### Language Distribution
- **7 English cases**: Tech/Tools, Product Updates, Business/Marketing, News/Accident
- **7 Spanish cases**: Tech/Tools, Product Updates, Business/Marketing, Culture/Humor, Politics/Opinion
- **6 German cases**: Tech/Tools, Product Updates, Business/Marketing, Travel/Events

### Category Mix
- Tech/Tools (6 cases)
- Product Updates (4 cases)
- Business/Marketing (7 cases)
- Culture/Humor (1 case)
- News/Accident (1 case)
- Politics/Opinion (1 case)
- Travel/Events (1 case)

### Edge Cases Included
- Tragic/sensitive topics (news outage)
- Political opinions (handled respectfully)
- Product announcements (tested for metrics questions)
- Light humor (tested for appropriate tone matching)

## How to Run

### Prerequisites
Make sure your `.env` file has the DeepSeek API key:
```bash
VITE_DEEPSEEK_API_KEY=your_key_here
```

### Run the Batch Test

```bash
npm run test:batch
```

### Expected Duration
- **Full test**: 15-30 minutes (1,800 API calls with 500ms delays)
- **API cost**: ~$1-3 USD (DeepSeek is very cost-effective)

### Output Location
Results are saved to:
```
/project-root/copy_snap_batch_test.md
```

## Output Format

The generated Markdown file contains:

```markdown
## Case 1 — Language: EN — Category: Tech/Tools

### 1.) Original Post
[Tweet text here]

### 2.) Generated Questions

**[Clarify — 1Q — Soft — Humane:YES]**
- [Generated question]

**[Clarify — 1Q — Soft — Humane:NO]**
- [Generated question]

[... all 90 combinations ...]

---

## Case 2 — Language: EN — Category: Product Updates
[...]
```

At the end, includes a summary with:
- Language distribution
- Category distribution
- Notable edge cases

## Quality Guarantees

All generated questions:
- ✅ Reference the actual post content directly
- ✅ Match the input language (EN/ES/DE)
- ✅ Respect tone and style parameters
- ✅ Are unique and non-repetitive
- ✅ Stay under ~18 words each
- ✅ Handle sensitive topics respectfully

## Use Cases

1. **QA Testing**: Verify Copy Snap handles all parameter combinations correctly
2. **Language Testing**: Ensure multi-language support works across all modes
3. **Tone Validation**: Confirm tone adjustments produce noticeably different outputs
4. **Edge Case Verification**: Test sensitive/tragic content is handled appropriately
5. **Prompt Engineering**: Review and refine AI prompts based on bulk output
6. **Documentation**: Generate examples for help docs and training materials

## Customization

To modify test cases, edit the `testCases` array in `copy-snap-batch-tester.ts`:

```typescript
const testCases: TestCase[] = [
  { id: 1, lang: 'EN', category: 'Tech/Tools', text: 'Your tweet text here' },
  // ... add more cases
];
```

To adjust the matrix, modify these arrays:
```typescript
const intents = ['Clarify', 'Challenge', 'Explore', 'Convert', 'Count'];
const counts = [1, 3, 5];
const tones = ['Soft', 'Direct', 'Humane'];
const humaneToggles = ['YES', 'NO'];
```

## Troubleshooting

**Error: API key not found**
- Add `VITE_DEEPSEEK_API_KEY` to your `.env` file

**Error: Rate limit exceeded**
- Increase the delay in the script (currently 500ms)
- Or run in smaller batches

**Questions are in wrong language**
- DeepSeek should auto-detect. If not, the prompt explicitly specifies the language.
- Check that the `getLanguageName()` function is working correctly

**Generation takes too long**
- This is normal! 1,800 API calls take time
- Consider reducing the test cases or matrix dimensions for quick tests
- Watch console output for progress

## Quick Test Mode

To test with fewer cases, temporarily modify the script:

```typescript
// Only test first 2 cases
const testCases: TestCase[] = [
  { id: 1, lang: 'EN', category: 'Tech/Tools', text: '...' },
  { id: 2, lang: 'EN', category: 'Tech/Tools', text: '...' },
];

// Or reduce matrix
const counts = [1, 3]; // Skip 5-question tests
```

This reduces from 1,800 to a more manageable number for quick validation.

## License

Part of the CopyZap project. Internal testing tool.
