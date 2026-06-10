/**
 * Copy Snap Batch Tester
 *
 * Generates 20 test cases with realistic tweets in English, Spanish, and German.
 * Runs each through a matrix of question styles and saves to Markdown.
 *
 * Matrix per tweet:
 * - 5 intents: Clarify, Challenge, Explore, Convert, Count
 * - 3 question counts: 1, 3, 5
 * - 3 tones: Soft, Direct, Humane
 * - 2 humane toggle: YES, NO
 *
 * Total: 5 × 3 × 3 × 2 = 90 combinations per tweet = 1,800 total generations
 */

import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

interface TestCase {
  id: number;
  lang: 'EN' | 'ES' | 'DE';
  category: string;
  text: string;
}

interface QuestionResult {
  questions: string[];
}

// Initialize OpenAI client for DeepSeek
const deepseek = new OpenAI({
  apiKey: process.env.VITE_DEEPSEEK_API_KEY || '',
  baseURL: 'https://api.deepseek.com',
});

// 20 realistic tweet-style test cases
const testCases: TestCase[] = [
  // English - Tech/Tools
  { id: 1, lang: 'EN', category: 'Tech/Tools', text: 'Just shipped a new feature that cuts API response time by 60%.\n\nUsers are going to love this.' },
  { id: 2, lang: 'EN', category: 'Tech/Tools', text: 'PSA: Never store passwords in plain text.\n\nI just found a 2019 codebase doing exactly this.' },

  // English - Product Updates
  { id: 3, lang: 'EN', category: 'Product Updates', text: 'Version 2.0 is live!\n\nNew features:\n• Dark mode\n• Real-time sync\n• 50% faster load times' },
  { id: 4, lang: 'EN', category: 'Product Updates', text: 'We\'re deprecating our legacy API on March 1st. Migration guide: link in bio.' },

  // English - Business/Marketing
  { id: 5, lang: 'EN', category: 'Business/Marketing', text: 'Crossed 10K MRR today. Started with $0 budget, just content marketing and word of mouth.' },
  { id: 6, lang: 'EN', category: 'Business/Marketing', text: 'Your landing page should answer 3 questions:\n1. What is it?\n2. Why should I care?\n3. What do I do next?' },

  // English - News/Accident
  { id: 7, lang: 'EN', category: 'News/Accident', text: 'Major outage affecting AWS us-east-1. Multiple services down since 14:30 UTC.' },

  // Spanish - Tech/Tools
  { id: 8, lang: 'ES', category: 'Tech/Tools', text: 'Acabo de lanzar una herramienta que automatiza el 80% de mi flujo de trabajo.\n\nCódigo abierto, gratis para siempre.' },
  { id: 9, lang: 'ES', category: 'Tech/Tools', text: 'Consejo: Usa TypeScript desde el día 1. Te ahorrará horas de debugging después.' },

  // Spanish - Product Updates
  { id: 10, lang: 'ES', category: 'Product Updates', text: 'Nueva actualización:\n• Soporte multiidioma\n• Exportación a PDF\n• Integración con Slack' },

  // Spanish - Business/Marketing
  { id: 11, lang: 'ES', category: 'Business/Marketing', text: 'Lección aprendida: Un buen producto no se vende solo. Necesitas marketing desde el día 1.' },
  { id: 12, lang: 'ES', category: 'Business/Marketing', text: '6 meses construyendo en público.\n\nResultado: 5K seguidores, 200 clientes de pago, $15K MRR.' },

  // Spanish - Culture/Humor
  { id: 13, lang: 'ES', category: 'Culture/Humor', text: 'Yo: "Voy a dormir temprano hoy"\n\nTambién yo a las 3 AM: *optimizando una función que funciona perfectamente*' },

  // Spanish - Politics/Opinion
  { id: 14, lang: 'ES', category: 'Politics/Opinion', text: 'La IA no va a reemplazar tu trabajo.\n\nPero alguien que sepa usar IA mejor que tú, sí.' },

  // German - Tech/Tools
  { id: 15, lang: 'DE', category: 'Tech/Tools', text: 'Neues Open-Source-Tool veröffentlicht!\n\nAutomatisiert Deployments und spart 10+ Stunden pro Woche.' },
  { id: 16, lang: 'DE', category: 'Tech/Tools', text: 'Tipp: Dokumentiere deinen Code, als würdest du ihn in 6 Monaten zum ersten Mal sehen.' },

  // German - Product Updates
  { id: 17, lang: 'DE', category: 'Product Updates', text: 'Version 3.0 ist da!\n\n• KI-gestützte Vorschläge\n• Offline-Modus\n• 10x schnellere Suche' },

  // German - Business/Marketing
  { id: 18, lang: 'DE', category: 'Business/Marketing', text: 'Von 0 auf 1000 zahlende Kunden in 12 Monaten.\n\nKeine bezahlten Anzeigen, nur Content.' },
  { id: 19, lang: 'DE', category: 'Business/Marketing', text: 'Die beste Marketing-Strategie?\n\nBaue ein Produkt, über das die Leute gerne sprechen.' },

  // German - Travel/Events
  { id: 20, lang: 'DE', category: 'Travel/Events', text: 'Nächste Woche auf der TechConf Berlin.\n\nWer ist auch da? Lass uns einen Kaffee trinken!' },
];

const intents = ['Clarify', 'Challenge', 'Explore', 'Convert', 'Count'];
const counts = [1, 3, 5];
const tones = ['Soft', 'Direct', 'Humane'];
const humaneToggles = ['YES', 'NO'];

// Detect language name for prompt
function getLanguageName(lang: 'EN' | 'ES' | 'DE'): string {
  const map = { EN: 'English', ES: 'Spanish', DE: 'German' };
  return map[lang];
}

// Generate questions using DeepSeek
async function generateQuestions(
  text: string,
  intent: string,
  count: number,
  tone: string,
  humaneToggle: string,
  lang: 'EN' | 'ES' | 'DE'
): Promise<QuestionResult> {
  const languageName = getLanguageName(lang);

  // Build prompt based on parameters
  let intentDescription = '';
  switch (intent) {
    case 'Clarify':
      intentDescription = 'questions that ask for clarification, more details, or explanation of unclear points';
      break;
    case 'Challenge':
      intentDescription = 'questions that respectfully challenge assumptions, logic, or claims made';
      break;
    case 'Explore':
      intentDescription = 'questions that explore implications, related ideas, or deeper context';
      break;
    case 'Convert':
      intentDescription = 'questions that turn the content into action steps, CTAs, or next steps';
      break;
    case 'Count':
      intentDescription = 'questions that ask for numbers, metrics, quantification, or proof';
      break;
  }

  let toneDescription = '';
  if (tone === 'Soft') {
    toneDescription = 'Use gentle, considerate language. Be polite and non-confrontational.';
  } else if (tone === 'Direct') {
    toneDescription = 'Use direct, straightforward language. Get to the point quickly.';
  } else if (tone === 'Humane') {
    toneDescription = 'Use warm, empathetic, human language. Show understanding and care.';
  }

  const humaneInstruction = humaneToggle === 'YES'
    ? 'Make the questions sound natural and conversational, like a real person would ask. Use concrete language, natural rhythm, and avoid corporate buzzwords.'
    : 'Keep questions neutral, concise, and analytical. Professional but not overly warm.';

  const prompt = `You are generating ${count} ${intent.toLowerCase()} ${count === 1 ? 'question' : 'questions'} based on the following post.

POST:
"${text}"

REQUIREMENTS:
1. Generate exactly ${count} ${intentDescription}
2. Tone: ${toneDescription}
3. Style: ${humaneInstruction}
4. Language: Respond in ${languageName} (same language as the post)
5. Keep each question short (max ~18 words)
6. Questions must directly reference the content of the post
7. No invented facts
8. If the post is about tragic/sensitive topics, remain respectful
9. Make questions unique and non-repetitive

Return ONLY a valid JSON object in this exact format:
{
  "questions": ["question 1", "question 2", ...]
}

No markdown formatting, no code blocks, just the raw JSON.`;

  try {
    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const content = response.choices[0]?.message?.content || '';

    // Extract JSON (handle markdown wrapping)
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/g, '');
    }

    const result = JSON.parse(jsonStr) as QuestionResult;

    // Ensure we have the right number of questions
    if (result.questions.length !== count) {
      result.questions = result.questions.slice(0, count);
      while (result.questions.length < count) {
        result.questions.push('[Question generation incomplete]');
      }
    }

    return result;
  } catch (error) {
    console.error(`Error generating questions: ${error}`);
    // Return placeholder questions on error
    return {
      questions: Array(count).fill('[Error generating question]')
    };
  }
}

// Format questions for markdown
function formatQuestions(questions: string[]): string {
  return questions.map((q, i) => `- ${q}`).join('\n');
}

// Main batch test function
async function runBatchTest() {
  console.log('🚀 Starting Copy Snap Batch Test...\n');
  console.log(`Total test cases: ${testCases.length}`);
  console.log(`Combinations per case: ${intents.length} × ${counts.length} × ${tones.length} × ${humaneToggles.length} = ${intents.length * counts.length * tones.length * humaneToggles.length}`);
  console.log(`Total generations: ${testCases.length * intents.length * counts.length * tones.length * humaneToggles.length}\n`);
  console.log('⚠️  This will take a while (estimated 15-30 minutes)...\n');

  let markdown = '# Copy Snap Batch Test Results\n\n';
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `**Test Cases:** ${testCases.length}\n`;
  markdown += `**Total Generations:** ${testCases.length * intents.length * counts.length * tones.length * humaneToggles.length}\n\n`;
  markdown += '---\n\n';

  let caseCount = 0;
  const langCounts = { EN: 0, ES: 0, DE: 0 };
  const categoryCounts: Record<string, number> = {};

  for (const testCase of testCases) {
    caseCount++;
    langCounts[testCase.lang]++;
    categoryCounts[testCase.category] = (categoryCounts[testCase.category] || 0) + 1;

    console.log(`Processing Case ${caseCount}/${testCases.length} - ${testCase.lang} - ${testCase.category}`);

    markdown += `## Case ${testCase.id} — Language: ${testCase.lang} — Category: ${testCase.category}\n\n`;
    markdown += `### 1.) Original Post\n\n`;
    markdown += `${testCase.text}\n\n`;
    markdown += `### 2.) Generated Questions\n\n`;

    // Generate all combinations
    let combinationCount = 0;
    const totalCombinations = intents.length * counts.length * tones.length * humaneToggles.length;

    for (const intent of intents) {
      for (const count of counts) {
        for (const tone of tones) {
          for (const humaneToggle of humaneToggles) {
            combinationCount++;

            console.log(`  → ${intent} | ${count}Q | ${tone} | Humane:${humaneToggle} (${combinationCount}/${totalCombinations})`);

            const result = await generateQuestions(
              testCase.text,
              intent,
              count,
              tone,
              humaneToggle,
              testCase.lang
            );

            markdown += `**[${intent} — ${count}Q — ${tone} — Humane:${humaneToggle}]**\n\n`;
            markdown += formatQuestions(result.questions) + '\n\n';

            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
    }

    markdown += '---\n\n';
  }

  // Add summary
  markdown += '## Summary\n\n';
  markdown += '### Language Distribution\n\n';
  markdown += `- English: ${langCounts.EN} cases\n`;
  markdown += `- Spanish: ${langCounts.ES} cases\n`;
  markdown += `- German: ${langCounts.DE} cases\n\n`;

  markdown += '### Category Distribution\n\n';
  for (const [category, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    markdown += `- ${category}: ${count} cases\n`;
  }
  markdown += '\n';

  markdown += '### Notable Edge Cases\n\n';
  markdown += '- Case 7: News/Accident (AWS outage) - tested for respectful questioning\n';
  markdown += '- Case 14: Politics/Opinion (AI replacement) - tested for probing without inflammatory language\n';
  markdown += '- Multiple business/product cases tested for concrete metrics and proof questions\n\n';

  // Save to file
  const outputPath = path.join(process.cwd(), 'copy_snap_batch_test.md');
  fs.writeFileSync(outputPath, markdown, 'utf-8');

  console.log('\n✅ Batch test complete!');
  console.log(`📄 Output saved to: ${outputPath}`);
  console.log(`📊 Generated ${caseCount * intents.length * counts.length * tones.length * humaneToggles.length} question sets across ${caseCount} test cases\n`);

  // Show excerpt
  console.log('📋 First case excerpt:\n');
  const lines = markdown.split('\n');
  const excerptEnd = lines.findIndex((line, i) => i > 10 && line.startsWith('---'));
  console.log(lines.slice(0, excerptEnd).join('\n'));
  console.log('\n[... see full output in copy_snap_batch_test.md ...]');
}

// Run the batch test
runBatchTest().catch(console.error);
