const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');
const path = require('path');

const pages = [
  { file: 'about-copy-maker', title: 'About Copy Maker' },
  { file: 'compare-blend', title: 'Compare & Blend Outputs' },
  { file: 'contact', title: 'Contact Support' },
  { file: 'export-management', title: 'Export & File Management' },
  { file: 'feature-interactions', title: 'How Features Interact' },
  { file: 'getting-started', title: 'Getting Started with Copy Maker' },
  { file: 'glossary', title: 'Glossary of Terms' },
  { file: 'index', title: 'Help Center' },
  { file: 'output-features', title: 'Generated Output Features' },
  { file: 'project-setup', title: 'Project Setup Guide' },
  { file: 'quick-wizard', title: 'Quick Prompt Wizard' },
  { file: 'recommended-settings', title: 'Recommended Settings' },
  { file: 'templates-saved', title: 'Templates & Saved Setups' },
  { file: 'troubleshooting', title: 'Troubleshooting & Pro Tips' },
  { file: 'workflows-examples', title: 'Workflows & Real-Life Examples' }
];

async function generateOGImage(filename, title) {
  const width = 1200;
  const height = 630;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#1e3a8a');
  gradient.addColorStop(0.5, '#3b82f6');
  gradient.addColorStop(1, '#93c5fd');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Add subtle overlay
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.fillRect(0, 0, width, height);

  // Try to load and draw logo
  try {
    const logoPath = path.join(__dirname, 'public', 'logo_pimpmycopy_1.png');
    if (fs.existsSync(logoPath)) {
      const logo = await loadImage(logoPath);
      const logoHeight = 50;
      const logoWidth = (logo.width / logo.height) * logoHeight;
      ctx.drawImage(logo, 40, 40, logoWidth, logoHeight);
    }
  } catch (err) {
    console.log('Logo not found, skipping...');
  }

  // Draw title
  ctx.fillStyle = 'white';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Dynamic font size based on title length
  let fontSize = 72;
  if (title.length > 30) fontSize = 60;
  if (title.length > 40) fontSize = 50;

  ctx.font = `bold ${fontSize}px Inter, system-ui, sans-serif`;

  // Word wrap for long titles
  const maxWidth = width - 160;
  const words = title.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const testLine = currentLine + ' ' + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  // Draw each line
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  const startY = (height - totalHeight) / 2 + lineHeight / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });

  // Draw footer text
  ctx.font = '20px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('CopyZap Help Center', width - 40, height - 40);

  // Save image
  const outputPath = path.join(__dirname, 'public', 'help', 'og', `${filename}.png`);
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${filename}.png`);
}

async function generateAll() {
  console.log('Generating OG images...');

  // Ensure og directory exists
  const ogDir = path.join(__dirname, 'public', 'help', 'og');
  if (!fs.existsSync(ogDir)) {
    fs.mkdirSync(ogDir, { recursive: true });
  }

  for (const page of pages) {
    await generateOGImage(page.file, page.title);
  }

  console.log(`\n✓ Generated ${pages.length} OG images successfully!`);
}

generateAll().catch(console.error);
