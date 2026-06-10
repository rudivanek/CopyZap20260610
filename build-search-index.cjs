const fs = require('fs');
const path = require('path');

// Map component names to their primary routes
const ROUTE_MAP = {
  'GettingStarted': '/help/getting-started',
  'StartHub': '/help/start-hub',
  'CopyMakerIndex': '/help/copy-maker',
  'QuickPromptWizard': '/help/quick-prompt-wizard',
  'ProjectSetup': '/help/project-setup',
  'SmartVsExpertMode': '/help/smart-vs-expert-mode',
  'OptionalFeatures': '/help/optional-features',
  'FeatureInteractions': '/help/feature-interactions',
  'VoiceStylesAndBlending': '/help/voice-styles-and-blending',
  'BrandVoiceSystem': '/help/brand-voice',
  'TemplatesAndReuse': '/help/templates-and-reuse',
  'OutputFeatures': '/help/output-features',
  'CompareBlend': '/help/compare-blend',
  'ExportAndFileManagement': '/help/export-and-file-management',
  'RecommendedSettings': '/help/recommended-settings',
  'Workflows': '/help/workflows',
  'CoreWorkflows': '/help/core-workflows',
  'TroubleshootingFAQs': '/help/troubleshooting-faqs',
  'BestPractices': '/help/best-practices',
  'Glossary': '/help/glossary',
  'Contact': '/help/contact',
  'Tutorials': '/help/tutorials',
  'RealCaseWorkflowsIndex': '/help/real-case-workflows',
  'QuickWizardNewCopy': '/help/real-case-workflows/quick-wizard-new-copy',
  'CreditsAndBilling': '/help/credits-and-billing',
  'DashboardAndHistory': '/help/dashboard-and-history',
  'WorkflowBuilder': '/help/workflow-builder'
};

function extractTitle(tsxContent) {
  // Extract title from HelpLayout title prop
  const titleMatch = tsxContent.match(/title=["']([^"']+)["']/);
  if (titleMatch) {
    return titleMatch[1];
  }

  // Fallback: try to find title in JSX content
  const h1Match = tsxContent.match(/<h1[^>]*>([^<]+)<\/h1>/);
  if (h1Match) {
    return h1Match[1];
  }

  return '';
}

function extractTextContent(tsxContent) {
  // Remove imports and component declarations
  let content = tsxContent
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^const\s+\w+:\s*React\.FC.*?=\s*\(\)\s*=>\s*\{/m, '')
    .replace(/^export\s+default\s+\w+;?\s*$/gm, '');

  // Extract text from JSX tags (keep the content between tags)
  // This regex finds all content between > and < that's not empty
  const textMatches = content.match(/>([^<>]+)</g) || [];
  const extractedTexts = textMatches
    .map(match => match.slice(1, -1).trim())
    .filter(text => {
      // Filter out code-like content, variable names, props, etc.
      return text.length > 2 &&
             !text.match(/^[{}\[\]()=><\/\\]+$/) &&
             !text.startsWith('{') &&
             !text.startsWith('className') &&
             !text.startsWith('onClick') &&
             !text.match(/^(const|let|var|return|import|export|function|=>)\b/);
    });

  // Also extract text from string literals (for content in props)
  const stringMatches = content.match(/["']([^"']{10,})["']/g) || [];
  const stringTexts = stringMatches
    .map(match => match.slice(1, -1).trim())
    .filter(text => {
      return text.length > 10 &&
             !text.startsWith('/') && // Not paths
             !text.includes('className') &&
             !text.includes('import') &&
             !text.match(/^[\w-]+$/); // Not single class names
    });

  const allText = [...extractedTexts, ...stringTexts].join(' ');

  // Clean up the text
  return allText
    .replace(/\s+/g, ' ')
    .replace(/\\n/g, ' ')
    .replace(/\{.*?\}/g, ' ')
    .trim();
}

function extractHeadings(tsxContent) {
  const headings = [];

  // Extract h2, h3, h4 headings
  const h2Matches = tsxContent.matchAll(/<h2[^>]*>([^<]+)<\/h2>/g);
  for (const match of h2Matches) {
    headings.push(match[1].trim());
  }

  const h3Matches = tsxContent.matchAll(/<h3[^>]*>([^<]+)<\/h3>/g);
  for (const match of h3Matches) {
    headings.push(match[1].trim());
  }

  return headings.join(' ');
}

function buildSearchIndex() {
  const helpPagesDir = path.join(__dirname, 'src', 'components', 'help', 'pages');
  const docsDir = path.join(__dirname, 'docs');
  const publicDocsDir = path.join(__dirname, 'public', 'docs');

  // Ensure output directories exist
  if (!fs.existsSync(docsDir)) {
    fs.mkdirSync(docsDir, { recursive: true });
  }
  if (!fs.existsSync(publicDocsDir)) {
    fs.mkdirSync(publicDocsDir, { recursive: true });
  }

  // Read all TSX files from help pages directory
  const files = fs.readdirSync(helpPagesDir).filter(f => f.endsWith('.tsx'));

  const index = files.map(file => {
    const componentName = path.basename(file, '.tsx');
    const route = ROUTE_MAP[componentName];

    // Skip if no route mapping
    if (!route) {
      console.log(`⚠ Skipping ${componentName} (no route mapping)`);
      return null;
    }

    const filePath = path.join(helpPagesDir, file);
    const tsxContent = fs.readFileSync(filePath, 'utf-8');

    const title = extractTitle(tsxContent);
    const headings = extractHeadings(tsxContent);
    const content = extractTextContent(tsxContent);

    // Convert route to URL format expected by HelpCenter (/help/slug -> /docs/slug.html)
    const url = route.replace('/help/', '/docs/') + '.html';

    return {
      title: title || componentName,
      description: headings.substring(0, 200) || content.substring(0, 200),
      content: content.substring(0, 5000), // Limit content length
      url: url
    };
  }).filter(item => item !== null);

  // Write to all output locations
  const outputPath = path.join(docsDir, 'search-index.json');
  fs.writeFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`✓ Created ${outputPath}`);

  const publicOutputPath = path.join(publicDocsDir, 'search-index.json');
  fs.writeFileSync(publicOutputPath, JSON.stringify(index, null, 2));
  console.log(`✓ Created ${publicOutputPath}`);

  console.log(`\nIndexed ${index.length} pages with full-text content`);

  // Show sample of indexed pages
  console.log('\nIndexed pages:');
  index.forEach(page => {
    const contentPreview = page.content.substring(0, 60).replace(/\s+/g, ' ');
    const route = page.url.replace('/docs/', '/help/').replace('.html', '');
    console.log(`  - ${page.title} (${route})`);
    console.log(`    Content: ${contentPreview}...`);
  });
}

buildSearchIndex();
