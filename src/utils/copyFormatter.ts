import { CopyResult, PromptEvaluation, StructuredCopyOutput, FormState, ContentQualityScore, ScoreData } from '../types';
import { GeoScoreData } from '../types';
import { GeneratedContentItem, GeneratedContentItemType } from '../types';
import { generateFullHtmlExportForCard, generateComparisonHtml, generateOverallRecommendationHtml, generateBestVersionAnalysisHtml, generateAllVersionsBreakdownHtml, normalizeCopyForMarkdownExport } from './enhancedExports';
import { ComparisonResult } from '../services/api/comprehensiveScoring';

/**
 * Get score color based on value (matches app's score color utility)
 */
const getScoreColorForHtml = (score: number): string => {
  if (score >= 80) return '#059669'; // emerald-600 (EXCELLENT)
  if (score >= 50) return '#d97706'; // amber-600 (GOOD)
  return '#e11d48'; // rose-600 (POOR)
};

/**
 * Helper function to convert an array of markdown table lines to HTML table
 */
const convertMarkdownTableToHtml = (lines: string[]): string => {
  if (lines.length < 3) return lines.join('\n'); // Need header, separator, and at least one row

  // Find separator line (contains only |, -, :, and whitespace)
  let separatorIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^\|[\s:|-]+\|$/)) {
      separatorIndex = i;
      break;
    }
  }

  if (separatorIndex === -1 || separatorIndex === 0) {
    return lines.join('\n'); // No valid separator found
  }

  const headerLine = lines[separatorIndex - 1];
  const bodyLines = lines.slice(separatorIndex + 1);

  // Parse header
  const headers = headerLine
    .split('|')
    .map(h => h.trim())
    .filter(h => h !== '');

  // Parse body rows
  const rows = bodyLines
    .filter(line => line.trim() && !line.match(/^[\s|:-]+$/))
    .map(line => {
      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter(c => c !== '');
      return cells;
    })
    .filter(cells => cells.length > 0);

  // Build HTML table
  let tableHtml = '<div style="margin: 20px 0; overflow-x: auto;">\n';
  tableHtml += '<table style="width: 100%; border-collapse: collapse; border: 2px solid #111827;">\n';

  // Add header
  if (headers.length > 0) {
    tableHtml += '  <thead>\n    <tr style="background: #f3f4f6;">\n';
    headers.forEach(header => {
      // Color-code scores in headers
      let styledHeader = header;
      const scorePattern = /(\d{1,3})/g;
      styledHeader = styledHeader.replace(scorePattern, (match) => {
        const score = parseInt(match);
        if (score >= 0 && score <= 100) {
          const color = getScoreColorForHtml(score);
          return `<span style="color: ${color}; font-weight: 700;">${match}</span>`;
        }
        return match;
      });
      tableHtml += `      <th style="border: 2px solid #111827; padding: 12px; text-align: left; font-size: 14px; font-weight: 700; color: #111827;">${styledHeader}</th>\n`;
    });
    tableHtml += '    </tr>\n  </thead>\n';
  }

  // Add body
  if (rows.length > 0) {
    tableHtml += '  <tbody>\n';
    rows.forEach((cells, rowIdx) => {
      const bgColor = rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb';
      tableHtml += `    <tr style="background: ${bgColor};">\n`;
      cells.forEach((cell, cellIdx) => {
        const fontWeight = cellIdx === 0 ? 'font-weight: 600;' : '';

        // Color-code scores
        let styledCell = cell;
        const scorePattern = /(\d{1,3})\s*(?:\(([A-Z]+)\))?/g;
        styledCell = styledCell.replace(scorePattern, (match, score, label) => {
          const scoreNum = parseInt(score);
          if (scoreNum >= 0 && scoreNum <= 100) {
            const color = getScoreColorForHtml(scoreNum);
            return label
              ? `<span style="color: ${color}; font-weight: 600;">${score}</span> <span style="color: #6b7280;">(${label})</span>`
              : `<span style="color: ${color}; font-weight: 600;">${match}</span>`;
          }
          return match;
        });

        tableHtml += `      <td style="border: 1px solid #111827; padding: 12px; font-size: 14px; ${fontWeight}">${styledCell}</td>\n`;
      });
      tableHtml += '    </tr>\n';
    });
    tableHtml += '  </tbody>\n';
  }

  tableHtml += '</table>\n</div>';
  return tableHtml;
};

/**
 * Converts basic Markdown formatting to HTML
 * Exported for use in components that need to format comparison tables
 */
export const markdownToHtml = (markdownText: string): string => {
  if (!markdownText) return '';

  let html = markdownText;

  // Convert horizontal rules first (---)
  html = html.replace(/^---+$/gm, '<hr style="border: 0; border-top: 2px solid #e5e7eb; margin: 24px 0;">');

  // Convert markdown tables - simpler line-by-line approach
  // Find table blocks by looking for consecutive lines that contain pipes
  const allLines = html.split('\n');
  let processedHtml = '';
  let inTable = false;
  let tableLines: string[] = [];

  for (let i = 0; i < allLines.length; i++) {
    const line = allLines[i].trim();

    // Check if this line looks like a table row (contains | and isn't just dashes/pipes/colons)
    const isTableRow = line.includes('|') && !line.match(/^[\s|:-]+$/);
    const isSeparatorRow = line.match(/^\|[\s:|-]+\|$/);

    if (isTableRow || isSeparatorRow) {
      if (!inTable) {
        inTable = true;
        tableLines = [line];
      } else {
        tableLines.push(line);
      }
    } else {
      // Not a table row - if we were collecting table lines, process them now
      if (inTable && tableLines.length >= 3) {
        // Convert the collected table
        processedHtml += convertMarkdownTableToHtml(tableLines) + '\n';
        tableLines = [];
        inTable = false;
      } else if (inTable) {
        // Table was too short, just add the lines as-is
        processedHtml += tableLines.join('\n') + '\n';
        tableLines = [];
        inTable = false;
      }
      processedHtml += allLines[i] + '\n';
    }
  }

  // Handle any remaining table at the end of content
  if (inTable && tableLines.length >= 3) {
    processedHtml += convertMarkdownTableToHtml(tableLines);
  } else if (inTable) {
    processedHtml += tableLines.join('\n');
  }

  html = processedHtml;

  // Legacy table regex as fallback (kept for compatibility)
  const tableRegex = /(\|[^\n]+\|\s*\n\s*\|[\s:|-]+\|\s*\n(?:\s*\|[^\n]+\|\s*\n?)+)/gm;
  html = html.replace(tableRegex, (match, tableContent) => {
    const lines = tableContent.trim().split('\n').map(l => l.trim()).filter(l => l);

    if (lines.length < 3) return match;

    const headerLine = lines[0];
    const separatorLine = lines[1];
    const bodyLines = lines.slice(2);

    // Process header row - split by | and clean up
    const headers = headerLine
      .split('|')
      .map(h => h.trim())
      .filter((h, idx, arr) => {
        // Remove empty cells at start/end (from leading/trailing pipes)
        if (h === '' && (idx === 0 || idx === arr.length - 1)) return false;
        return h !== '';
      });

    // Process body rows
    const rows = bodyLines
      .filter(line => line.includes('|') && !line.match(/^[\s|:-]+$/))
      .map(line => {
        const cells = line
          .split('|')
          .map(c => c.trim())
          .filter((c, idx, arr) => {
            if (c === '' && (idx === 0 || idx === arr.length - 1)) return false;
            return true;
          });
        return cells;
      })
      .filter(cells => cells.length > 0);

    // Build styled table HTML that matches the UI appearance
    let tableHtml = '<div style="margin: 20px 0; overflow-x: auto;">\n';
    tableHtml += '<table style="width: 100%; border-collapse: collapse; border: 2px solid #111827;">\n';

    // Add header with proper styling
    if (headers.length > 0) {
      tableHtml += '  <thead>\n    <tr style="background: #f3f4f6;">\n';
      headers.forEach(header => {
        // Color-code scores in headers too
        let styledHeader = header;
        const scorePattern = /(\d{1,3})/g;
        styledHeader = styledHeader.replace(scorePattern, (match) => {
          const score = parseInt(match);
          if (score >= 0 && score <= 100) {
            const color = getScoreColorForHtml(score);
            return `<span style="color: ${color}; font-weight: 700;">${match}</span>`;
          }
          return match;
        });
        tableHtml += `      <th style="border: 2px solid #111827; padding: 12px; text-align: left; font-size: 14px; font-weight: 700; color: #111827;">${styledHeader}</th>\n`;
      });
      tableHtml += '    </tr>\n  </thead>\n';
    }

    // Add body with alternating row colors and score coloring
    if (rows.length > 0) {
      tableHtml += '  <tbody>\n';
      rows.forEach((cells, rowIdx) => {
        const bgColor = rowIdx % 2 === 0 ? '#ffffff' : '#f9fafb';
        tableHtml += `    <tr style="background: ${bgColor};">\n`;
        cells.forEach((cell, cellIdx) => {
          // First column gets bold styling
          const fontWeight = cellIdx === 0 ? 'font-weight: 600;' : '';

          // Color-code any scores in the cell
          let styledCell = cell;
          const scorePattern = /(\d{1,3})\s*(?:\(([A-Z]+)\))?/g;
          styledCell = styledCell.replace(scorePattern, (match, score, label) => {
            const scoreNum = parseInt(score);
            if (scoreNum >= 0 && scoreNum <= 100) {
              const color = getScoreColorForHtml(scoreNum);
              return label
                ? `<span style="color: ${color}; font-weight: 600;">${score}</span> <span style="color: #6b7280;">(${label})</span>`
                : `<span style="color: ${color}; font-weight: 600;">${match}</span>`;
            }
            return match;
          });

          tableHtml += `      <td style="border: 1px solid #111827; padding: 12px; font-size: 14px; ${fontWeight}">${styledCell}</td>\n`;
        });
        tableHtml += '    </tr>\n';
      });
      tableHtml += '  </tbody>\n';
    }

    tableHtml += '</table>\n</div>';
    return tableHtml;
  });
  
  // Convert headers with proper styling (### H3, ## H2, # H1)
  html = html.replace(/^### (.+)$/gm, '<div style="border-top: 2px solid #d1d5db; margin: 24px 0 16px 0; padding-top: 16px;"></div>\n<h3 style="font-size: 16px; font-weight: 600; color: #374151; margin: 0 0 12px 0;">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 style="font-size: 18px; font-weight: 700; color: #111827; margin: 24px 0 12px 0;">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 style="font-size: 20px; font-weight: 700; color: #111827; margin: 32px 0 16px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px;">$1</h1>');
  
  // Convert bold (**text**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert italics (*text*)
  html = html.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  
  // Convert links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  
  // Convert code blocks (`code`)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Process content line by line for better list and structure handling
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inUnorderedList = false;
  let inOrderedList = false;
  let listIndentLevel = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    
    // Check for unordered list items (- or *)
    const unorderedListMatch = line.match(/^(\s*)([-*])\s+(.+)$/);
    // Check for ordered list items (1., 2., etc.)
    const orderedListMatch = line.match(/^(\s*)\d+\.\s+(.+)$/);
    
    if (unorderedListMatch) {
      const [, indent, marker, content] = unorderedListMatch;
      const currentIndent = indent.length;
      
      // Close ordered list if we were in one
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      
      if (!inUnorderedList) {
        processedLines.push('<ul style="margin: 12px 0; padding-left: 24px; color: #4b5563; line-height: 1.6;">');
        inUnorderedList = true;
        listIndentLevel = currentIndent;
      }
      processedLines.push(`  <li style="margin: 6px 0;">${content}</li>`);
    } else if (orderedListMatch) {
      const [, indent, content] = orderedListMatch;
      const currentIndent = indent.length;
      
      // Close unordered list if we were in one
      if (inUnorderedList) {
        processedLines.push('</ul>');
        inUnorderedList = false;
      }
      
      if (!inOrderedList) {
        processedLines.push('<ol style="margin: 12px 0; padding-left: 24px; color: #4b5563; line-height: 1.6;">');
        inOrderedList = true;
        listIndentLevel = currentIndent;
      }
      processedLines.push(`  <li style="margin: 6px 0;">${content}</li>`);
    } else {
      // Not a list item - close any open lists
      if (inUnorderedList) {
        processedLines.push('</ul>');
        inUnorderedList = false;
      }
      if (inOrderedList) {
        processedLines.push('</ol>');
        inOrderedList = false;
      }
      processedLines.push(line);
    }
  }
  
  // Close any remaining lists
  if (inUnorderedList) {
    processedLines.push('</ul>');
  }
  if (inOrderedList) {
    processedLines.push('</ol>');
  }
  
  html = processedLines.join('\n');
  
  // Convert paragraphs (double line breaks to paragraph separation)
  const paragraphs = html.split('\n\n').filter(p => p.trim());
  const htmlParagraphs = paragraphs.map(paragraph => {
    const trimmed = paragraph.trim();

    // Don't wrap if it's already an HTML block element
    if (trimmed.startsWith('<h') ||
        trimmed.startsWith('<ul') ||
        trimmed.startsWith('<ol') ||
        trimmed.startsWith('<table') ||
        trimmed.startsWith('<div') ||
        trimmed.startsWith('<hr') ||
        trimmed.includes('</ul>') ||
        trimmed.includes('</ol>') ||
        trimmed.includes('</table>') ||
        trimmed.includes('</h1>') ||
        trimmed.includes('</h2>') ||
        trimmed.includes('</h3>')) {
      return trimmed;
    }

    // Handle multi-line content within a paragraph
    const paragraphContent = trimmed.replace(/\n/g, '<br>');

    // Color-code any scores in the paragraph text
    let styledContent = paragraphContent;
    const scorePattern = /(\d{1,3})(?:\s*\/\s*100|\s*\(([A-Z]+)\))?/g;
    styledContent = styledContent.replace(scorePattern, (match, score, label) => {
      const scoreNum = parseInt(score);
      if (scoreNum >= 0 && scoreNum <= 100 && !match.includes(':')) {
        const color = getScoreColorForHtml(scoreNum);
        return label
          ? `<span style="color: ${color}; font-weight: 600;">${score}</span> <span style="color: #6b7280;">(${label})</span>`
          : `<span style="color: ${color}; font-weight: 600;">${match}</span>`;
      }
      return match;
    });

    return `<p style="color: #374151; line-height: 1.6; margin: 8px 0;">${styledContent}</p>`;
  });

  return htmlParagraphs.join('\n\n');
};

/**
 * Converts structured content to plain text
 */
export const structuredToPlainText = (content: string | StructuredCopyOutput): string => {
  if (typeof content === 'string') return content;

  // Handle arrays (like headlines)
  if (Array.isArray(content)) {
    return content.map((item, index) => `${index + 1}. ${item}`).join('\n');
  }

  if (!content) {
    return "No content available";
  }

  // Handle objects with nested content (e.g., {content: "...", seoMetadata: {...}})
  if (typeof content === 'object' && content.content) {
    // Recursively extract the nested content
    return structuredToPlainText(content.content);
  }

  // Handle proper structured content
  if (content.headline && Array.isArray(content.sections)) {
    let result = content.headline + '\n\n';

    content.sections.forEach(section => {
      if (section && section.title) {
        result += section.title + '\n';

        if (section.content) {
          result += section.content + '\n\n';
        } else if (section.listItems && section.listItems.length > 0) {
          section.listItems.forEach(item => {
            result += '• ' + item + '\n';
          });
          result += '\n';
        }
      }
    });

    return result.trim();
  }

  // Handle other object formats by checking common text-containing properties
  if (typeof content === 'object') {
    if (content.text && typeof content.text === 'string') {
      return content.text;
    } else if (content.output && typeof content.output === 'string') {
      return content.output;
    } else if (content.message && typeof content.message === 'string') {
      return content.message;
    } else {
      // Fall back to JSON stringification for unknown object formats
      try {
        return JSON.stringify(content, null, 2);
      } catch (e) {
        return "Unable to display content";
      }
    }
  }

  // If all else fails, convert to string
  return String(content);
};

/**
 * Formats a quality score as markdown
 */
export const formatQualityScoreAsMarkdown = (score: ContentQualityScore, title: string): string => {
  let markdown = `### ${title}\n\n`;
  markdown += `**Score:** ${score.score}/100\n\n`;
  
  if (score.tips && score.tips.length > 0) {
    markdown += `**Improvement Tips:**\n\n`;
    score.tips.forEach(tip => {
      markdown += `- ${tip}\n`;
    });
    markdown += `\n`;
  }
  
  return markdown;
};

/**
 * Format score data as markdown
 */
export const formatScoreDataAsMarkdown = (score: ScoreData, title: string): string => {
  let markdown = `### ${title}\n\n`;
  markdown += `**Overall:** ${score.overall}/100\n`;
  markdown += `**Clarity:** ${score.clarity}\n`;
  markdown += `**Persuasiveness:** ${score.persuasiveness}\n`;
  markdown += `**Tone Match:** ${score.toneMatch}\n`;
  markdown += `**Engagement:** ${score.engagement}\n`;

  if (score.wordCountAccuracy !== undefined) {
    markdown += `**Word Count Accuracy:** ${score.wordCountAccuracy}/100\n`;
  }

  if (score.improvementExplanation) {
    markdown += `\n**Why it's improved:** ${score.improvementExplanation}\n\n`;
  }

  if (score.suggestions && score.suggestions.length > 0 && score.overall < 95) {
    markdown += `**Optimization Suggestions:**\n\n`;
    score.suggestions.forEach(suggestion => {
      markdown += `- ${suggestion}\n`;
    });
    markdown += `\n`;
  }

  return markdown;
};

/**
 * Format GEO score data as markdown
 */
export const formatGeoScoreAsMarkdown = (geoScore: GeoScoreData, title: string): string => {
  let markdown = `### ${title}\n\n`;
  markdown += `**Overall GEO Score:** ${geoScore.overall}/100\n\n`;
  
  if (geoScore.breakdown && geoScore.breakdown.length > 0) {
    markdown += `**GEO Score Breakdown:**\n\n`;
    geoScore.breakdown.forEach(item => {
      const status = item.detected ? '✓' : '✗';
      markdown += `- **${item.criterion}** ${status} ${item.score} points: ${item.explanation}\n`;
    });
    markdown += `\n`;
  }
  
  if (geoScore.suggestions && geoScore.suggestions.length > 0 && geoScore.overall < 80) {
    markdown += `**GEO Optimization Suggestions:**\n\n`;
    geoScore.suggestions.forEach(suggestion => {
      markdown += `- ${suggestion}\n`;
    });
    markdown += `\n`;
  }
  
  return markdown;
};

/**
 * Formats generated content items as Markdown (new version)
 */
export const formatCopyResultAsMarkdown = (
  formState: FormState,
  generatedOutputCards: GeneratedContentItem[],
  originalInputScore?: any,
  promptEvaluation?: PromptEvaluation,
  includeInputs: boolean = true,
  comparisonResult?: any
): string => {
  let markdown = `# Generated Copy\n\n`;
  
  // Add input content section if includeInputs is true
  if (includeInputs) {
    markdown += `## Input Content\n\n`;
    
    if (formState.tab === 'create') {
      markdown += `### Business Description\n\n`;
      markdown += `${formState.businessDescription || 'No business description provided'}\n\n`;
      
      // Add business description score if available
      if (formState.businessDescriptionScore) {
        markdown += formatQualityScoreAsMarkdown(formState.businessDescriptionScore, 'Business Description Score');
      }
    } else {
      markdown += `### Original Copy\n\n`;
      markdown += `${formState.originalCopy || 'No original copy provided'}\n\n`;
      
      // Add original copy score if available
      if (formState.originalCopyScore) {
        markdown += formatQualityScoreAsMarkdown(formState.originalCopyScore, 'Original Copy Score');
      }
    }
    
    // Add original input score if available
    if (originalInputScore) {
      markdown += `### Original Input Quality Score\n\n`;
      markdown += `**Overall:** ${originalInputScore.overall}/100\n`;
      markdown += `**Clarity:** ${originalInputScore.clarity}\n`;
      markdown += `**Persuasiveness:** ${originalInputScore.persuasiveness}\n`;
      markdown += `**Tone Match:** ${originalInputScore.toneMatch}\n`;
      markdown += `**Engagement:** ${originalInputScore.engagement}\n`;
      
      if (originalInputScore.improvementExplanation) {
        markdown += `\n**Assessment:** ${originalInputScore.improvementExplanation}\n`;
      }
      
      markdown += `\n`;
    }
    
    // Add key information from form state
    markdown += `### Key Information\n\n`;
    markdown += `- **Language:** ${formState.language}\n`;
    markdown += `- **Tone:** ${formState.tone}\n`;
    markdown += `- **Word Count:** ${formState.wordCount}${formState.wordCount === 'Custom' ? ` (${formState.customWordCount})` : ''}\n`;
    
    if (formState.targetAudience) {
      markdown += `- **Target Audience:** ${formState.targetAudience}\n`;
    }
    
    if (formState.keyMessage) {
      markdown += `- **Key Message:** ${formState.keyMessage}\n`;
    }
    
    if (formState.callToAction) {
      markdown += `- **Call to Action:** ${formState.callToAction}\n`;
    }
    
    if (formState.desiredEmotion) {
      markdown += `- **Desired Emotion:** ${formState.desiredEmotion}\n`;
    }
    
    if (formState.brandValues) {
      markdown += `- **Brand Values:** ${formState.brandValues}\n`;
    }
    
    if (formState.keywords) {
      markdown += `- **Keywords:** ${formState.keywords}\n`;
    }
    
    markdown += `\n`;
  }
  
  // Add prompt evaluation if available
  if (promptEvaluation) {
    markdown += `## Prompt Evaluation\n\n`;
    markdown += `**Score:** ${promptEvaluation.score}/100\n\n`;
    
    if (promptEvaluation.tips && promptEvaluation.tips.length > 0) {
      markdown += `**Improvement Tips:**\n\n`;
      promptEvaluation.tips.forEach(tip => {
        markdown += `- ${tip}\n`;
      });
      markdown += `\n`;
    }
  }
  
  // Add SEO metadata if available
  // Separate dedicated SEO metadata cards from content cards
  const dedicatedSeoCards: GeneratedContentItem[] = [];
  const contentCards: GeneratedContentItem[] = [];

  generatedOutputCards.forEach(item => {
    if (item.type === GeneratedContentItemType.SeoMetadata) {
      dedicatedSeoCards.push(item);
    } else {
      contentCards.push(item);
    }
  });

  // Helper function to format SEO metadata
  const formatSeoMetadataBlock = (seoMetadata: SeoMetadata, headingLevel: string = '###'): string => {
    let seoMarkdown = '';
    if (seoMetadata.urlSlugs && seoMetadata.urlSlugs.length > 0) {
      seoMarkdown += `${headingLevel} URL Slugs\n\n`;
      seoMetadata.urlSlugs.forEach((slug, index) => {
        seoMarkdown += `${index + 1}. \`${slug}\` (${slug.length}/60 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.metaDescriptions && seoMetadata.metaDescriptions.length > 0) {
      seoMarkdown += `${headingLevel} Meta Descriptions\n\n`;
      seoMetadata.metaDescriptions.forEach((desc, index) => {
        seoMarkdown += `${index + 1}. ${desc} (${desc.length}/160 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.h1Variants && seoMetadata.h1Variants.length > 0) {
      seoMarkdown += `${headingLevel} H1 (Page Titles)\n\n`;
      seoMetadata.h1Variants.forEach((h1, index) => {
        seoMarkdown += `${index + 1}. ${h1} (${h1.length}/60 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.h2Headings && seoMetadata.h2Headings.length > 0) {
      seoMarkdown += `${headingLevel} H2 Headings\n\n`;
      seoMetadata.h2Headings.forEach((h2, index) => {
        seoMarkdown += `${index + 1}. ${h2} (${h2.length}/70 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.h3Headings && seoMetadata.h3Headings.length > 0) {
      seoMarkdown += `${headingLevel} H3 Headings\n\n`;
      seoMetadata.h3Headings.forEach((h3, index) => {
        seoMarkdown += `${index + 1}. ${h3} (${h3.length}/70 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.ogTitles && seoMetadata.ogTitles.length > 0) {
      seoMarkdown += `${headingLevel} Open Graph Titles\n\n`;
      seoMetadata.ogTitles.forEach((ogTitle, index) => {
        seoMarkdown += `${index + 1}. ${ogTitle} (${ogTitle.length}/60 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    
    if (seoMetadata.ogDescriptions && seoMetadata.ogDescriptions.length > 0) {
      seoMarkdown += `${headingLevel} Open Graph Descriptions\n\n`;
      seoMetadata.ogDescriptions.forEach((ogDesc, index) => {
        seoMarkdown += `${index + 1}. ${ogDesc} (${ogDesc.length}/110 chars)\n`;
      });
      seoMarkdown += `\n`;
    }
    return seoMarkdown;
  };

  // Process dedicated SEO metadata cards first
  dedicatedSeoCards.forEach(item => {
    if (item.seoMetadata) { // This will always be true for dedicated SeoMetadata cards
      markdown += `## SEO Metadata for ${item.sourceDisplayName || item.type}\n\n`;
      markdown += formatSeoMetadataBlock(item.seoMetadata, '###');
    }
  });
  
  // Process all generated content items
  contentCards.forEach((item, index) => {
    // Add visual separator between cards (except before the first one)
    if (index > 0) {
      markdown += `\n${'='.repeat(80)}\n\n`;
    }

    // Create section title based on item type and metadata
    let sectionTitle = item.sourceDisplayName || item.type;

    if (item.persona) {
      sectionTitle += ` (${item.persona}'s Voice)`;
    }

    markdown += `## ${sectionTitle}\n\n`;
    
    // Handle different content types
    let actualContentToProcess: any = item.content;
    let nestedSeoMetadata: SeoMetadata | undefined;

    // Check if content is a nested object containing both content and seoMetadata
    if (typeof item.content === 'object' && item.content !== null && 'content' in item.content && 'seoMetadata' in item.content) {
      actualContentToProcess = (item.content as any).content;
      nestedSeoMetadata = (item.content as any).seoMetadata;
    }

    if (Array.isArray(actualContentToProcess)) {
      // Handle headlines array
      actualContentToProcess.forEach((headline, index) => {
        markdown += `${index + 1}. ${headline}\n`;
      });
      markdown += `\n`;
    } else {
      // Handle string or structured content
      markdown += `${structuredToPlainText(actualContentToProcess)}\n\n`;
    }
    
   // Add modification instruction if available
   if (item.modificationInstruction) {
     markdown += `**Modification Applied:** ${item.modificationInstruction}\n\n`;
   }
   
    // Add score if available
    if (item.score) {
      markdown += formatScoreDataAsMarkdown(item.score, `${sectionTitle} Score`);
    }

    // Add GEO score if available
    if (item.geoScore) {
      markdown += formatGeoScoreAsMarkdown(item.geoScore, `${sectionTitle} GEO Score`);
    }

    // Add FAQ Schema if available
    if (item.faqSchema && Object.keys(item.faqSchema).length > 0) {
      markdown += `### ${sectionTitle} FAQ Schema (JSON-LD)\n\n`;
      markdown += '```json\n';
      markdown += JSON.stringify(item.faqSchema, null, 2);
      markdown += '\n```\n\n';
    }

    // Add nested SEO metadata if available
    if (nestedSeoMetadata) {
      markdown += `### SEO Metadata for ${sectionTitle}\n\n`; // Use a sub-heading for nested SEO
      markdown += formatSeoMetadataBlock(nestedSeoMetadata, '####'); // Use H4 for nested SEO elements
    }
  });

  // Add Best Version Analysis if available
  if (comparisonResult && typeof comparisonResult === 'object' && comparisonResult.bestVersionTitle) {
    markdown += `\n${'='.repeat(80)}\n\n`;
    markdown += `## Best Version Analysis\n\n`;

    // Add Overall Verdict section if available
    if (comparisonResult.bestForMarketing || comparisonResult.bestForClarity || comparisonResult.bestForSimplicity) {
      markdown += `### Overall Verdict\n\n`;

      if (comparisonResult.bestForMarketing) {
        markdown += `**Best for marketing:**\n✅ ${comparisonResult.bestForMarketing}\n\n`;
      }

      if (comparisonResult.bestForClarity) {
        markdown += `**Best for clarity and structure:**\n✅ ${comparisonResult.bestForClarity}\n\n`;
      }

      if (comparisonResult.bestForSimplicity) {
        markdown += `**Best for simplicity and readability:**\n✅ ${comparisonResult.bestForSimplicity}\n\n`;
      }
    }

    markdown += `### 🏆 ${comparisonResult.bestVersionTitle}\n\n`;
    markdown += `**Overall Score:** ${comparisonResult.overallScore}/10\n\n`;
    markdown += `${comparisonResult.reasoning}\n\n`;

    if (comparisonResult.strengths && comparisonResult.strengths.length > 0) {
      markdown += `#### Key Strengths\n\n`;
      comparisonResult.strengths.forEach((strength: string) => {
        markdown += `- ${strength}\n`;
      });
      markdown += `\n`;
    }

    if (comparisonResult.improvements && comparisonResult.improvements.length > 0) {
      markdown += `#### Suggested Improvements\n\n`;
      comparisonResult.improvements.forEach((improvement: string) => {
        markdown += `- ${improvement}\n`;
      });
      markdown += `\n`;
    }

    // Add Strategic Recommendation if available
    if (comparisonResult.strategicRecommendation) {
      markdown += `#### Strategic Recommendation\n\n`;
      markdown += `${comparisonResult.strategicRecommendation}\n\n`;
    }

    if (comparisonResult.comparisonDetails && comparisonResult.comparisonDetails.length > 0) {
      markdown += `### All Versions Breakdown\n\n`;
      comparisonResult.comparisonDetails.forEach((detail: any, idx: number) => {
        const isBest = idx === comparisonResult.bestVersionIndex;
        markdown += `#### ${detail.versionTitle}${isBest ? ' 👑' : ''}\n\n`;
        markdown += `**Score:** ${detail.score}/10\n\n`;

        // Add performance metrics if available
        if (detail.metrics) {
          markdown += `**PERFORMANCE METRICS**\n\n`;
          if (detail.metrics.tone) {
            markdown += `- **Tone:** ${detail.metrics.tone}\n`;
          }
          if (detail.metrics.readability) {
            markdown += `- **Readability:** ${detail.metrics.readability}\n`;
          }
          if (detail.metrics.persuasion) {
            markdown += `- **Persuasion:** ${detail.metrics.persuasion}\n`;
          }
          if (detail.metrics.emotionalAppeal) {
            markdown += `- **Emotional Appeal:** ${detail.metrics.emotionalAppeal}\n`;
          }
          if (detail.metrics.differentiation) {
            markdown += `- **Differentiation:** ${detail.metrics.differentiation}\n`;
          }
          if (detail.metrics.conversionPotential) {
            markdown += `- **Conversion Potential:** ${detail.metrics.conversionPotential}\n`;
          }
          markdown += `\n`;
        }

        // Add best used for if available
        if (detail.bestUsedFor) {
          markdown += `🧭 **Best used for:** ${detail.bestUsedFor}\n\n`;
        }

        if (detail.pros && detail.pros.length > 0) {
          markdown += `**PROS**\n\n`;
          detail.pros.forEach((pro: string) => {
            markdown += `✅ ${pro}\n`;
          });
          markdown += `\n`;
        }

        if (detail.cons && detail.cons.length > 0) {
          markdown += `**CONS**\n\n`;
          detail.cons.forEach((con: string) => {
            markdown += `❌ ${con}\n`;
          });
          markdown += `\n`;
        }
      });
    }
  }

  return markdown;
};

/**
 * Formats copy result as HTML for rich text copying
 */
export const formatCopyResultAsHTML = (
  formState: FormState,
  copyResult: CopyResult,
  promptEvaluation?: PromptEvaluation,
  selectedPersona?: string
): string => {
  let html = `<h1>Generated Copy</h1>`;
  
  // Add input content section
  html += `<h2>Input Content</h2>`;
  
  if (formState.tab === 'create') {
    html += `<h3>Business Description</h3>`;
    html += `<div style="white-space: pre-wrap;">${formState.businessDescription || 'No business description provided'}</div>`;
    
    // Add business description score if available
    if (formState.businessDescriptionScore) {
      html += `<h4>Business Description Score</h4>`;
      html += `<p><strong>Score:</strong> ${formState.businessDescriptionScore.score}/100</p>`;
      
      if (formState.businessDescriptionScore.tips && formState.businessDescriptionScore.tips.length > 0) {
        html += `<p><strong>Improvement Tips:</strong></p>`;
        html += `<ul>`;
        formState.businessDescriptionScore.tips.forEach(tip => {
          html += `<li>${tip}</li>`;
        });
        html += `</ul>`;
      }
    }
  } else {
    html += `<h3>Original Copy</h3>`;
    html += `<div style="white-space: pre-wrap;">${formState.originalCopy || 'No original copy provided'}</div>`;
    
    // Add original copy score if available
    if (formState.originalCopyScore) {
      html += `<h4>Original Copy Score</h4>`;
      html += `<p><strong>Score:</strong> ${formState.originalCopyScore.score}/100</p>`;
      
      if (formState.originalCopyScore.tips && formState.originalCopyScore.tips.length > 0) {
        html += `<p><strong>Improvement Tips:</strong></p>`;
        html += `<ul>`;
        formState.originalCopyScore.tips.forEach(tip => {
          html += `<li>${tip}</li>`;
        });
        html += `</ul>`;
      }
    }
  }
  
  // Add key information from form state
  html += `<h3>Key Information</h3>`;
  html += `<ul>`;
  html += `<li><strong>Language:</strong> ${formState.language}</li>`;
  html += `<li><strong>Tone:</strong> ${formState.tone}</li>`;
  html += `<li><strong>Word Count:</strong> ${formState.wordCount}${formState.wordCount === 'Custom' ? ` (${formState.customWordCount})` : ''}</li>`;
  
  if (formState.targetAudience) {
    html += `<li><strong>Target Audience:</strong> ${formState.targetAudience}</li>`;
  }
  
  if (formState.keyMessage) {
    html += `<li><strong>Key Message:</strong> ${formState.keyMessage}</li>`;
  }
  
  if (formState.callToAction) {
    html += `<li><strong>Call to Action:</strong> ${formState.callToAction}</li>`;
  }
  
  if (formState.desiredEmotion) {
    html += `<li><strong>Desired Emotion:</strong> ${formState.desiredEmotion}</li>`;
  }
  
  if (formState.brandValues) {
    html += `<li><strong>Brand Values:</strong> ${formState.brandValues}</li>`;
  }
  
  if (formState.keywords) {
    html += `<li><strong>Keywords:</strong> ${formState.keywords}</li>`;
  }
  html += `</ul>`;
  
  // Add prompt evaluation if available
  if (promptEvaluation) {
    html += `<h2>Prompt Evaluation</h2>`;
    html += `<p><strong>Score:</strong> ${promptEvaluation.score}/100</p>`;
    
    if (promptEvaluation.tips && promptEvaluation.tips.length > 0) {
      html += `<p><strong>Improvement Tips:</strong></p>`;
      html += `<ul>`;
      promptEvaluation.tips.forEach(tip => {
        html += `<li>${tip}</li>`;
      });
      html += `</ul>`;
    }
  }
  
  // Helper function to format a score data object as HTML
  const formatScoreDataAsHTML = (score: ScoreData, title: string): string => {
    let scoreHtml = `<h3>${title}</h3>`;
    scoreHtml += `<p><strong>Overall:</strong> ${score.overall}/100</p>`;
    scoreHtml += `<p><strong>Clarity:</strong> ${score.clarity}</p>`;
    scoreHtml += `<p><strong>Persuasiveness:</strong> ${score.persuasiveness}</p>`;
    scoreHtml += `<p><strong>Tone Match:</strong> ${score.toneMatch}</p>`;
    scoreHtml += `<p><strong>Engagement:</strong> ${score.engagement}</p>`;

    if (score.wordCountAccuracy !== undefined) {
      scoreHtml += `<p><strong>Word Count Accuracy:</strong> ${score.wordCountAccuracy}/100</p>`;
    }

    if (score.improvementExplanation) {
      scoreHtml += `<p><strong>Why it's improved:</strong> ${score.improvementExplanation}</p>`;
    }

    if (score.suggestions && score.suggestions.length > 0 && score.overall < 95) {
      scoreHtml += `<p><strong>Optimization Suggestions:</strong></p>`;
      scoreHtml += `<ul>`;
      score.suggestions.forEach(suggestion => {
        scoreHtml += `<li>${suggestion}</li>`;
      });
      scoreHtml += `</ul>`;
    }

    return scoreHtml;
  };
  
  // Add improved copy
  if (copyResult.improvedCopy) {
    html += `<h2>Improved Copy</h2>`;
    const improvedCopyText = structuredToPlainText(copyResult.improvedCopy);
    html += `<div style="white-space: pre-wrap;">${improvedCopyText}</div>`;
    
    // Add score if available
    if (copyResult.improvedCopyScore) {
      html += formatScoreDataAsHTML(copyResult.improvedCopyScore, 'Improved Copy Score');
    }
  }
  
  // Add restyled improved copy if available
  if (copyResult.restyledImprovedVersions && copyResult.restyledImprovedVersions.length > 0) {
    // Display all restyled improved versions
    copyResult.restyledImprovedVersions.forEach((version, index) => {
      html += `<h2>Improved Copy (${version.persona}'s Voice)</h2>`;
      const restyledImprovedCopyText = structuredToPlainText(version.content);
      html += `<div style="white-space: pre-wrap;">${restyledImprovedCopyText}</div>`;
      
      // Add score if available and this is the first/primary version
      if (index === 0 && copyResult.restyledImprovedCopyScore) {
        html += formatScoreDataAsHTML(
          copyResult.restyledImprovedCopyScore, 
          `${version.persona}'s Voice Score`
        );
      }
    });
  } else if (copyResult.restyledImprovedCopy && (copyResult.restyledImprovedCopyPersona || selectedPersona)) {
    // Legacy single restyled improved copy
    html += `<h2>Improved Copy (${selectedPersona}'s Voice)</h2>`;
    const restyledImprovedCopyText = structuredToPlainText(copyResult.restyledImprovedCopy);
    html += `<div style="white-space: pre-wrap;">${restyledImprovedCopyText}</div>`;
    
    // Add score if available
    if (copyResult.restyledImprovedCopyScore) {
      html += formatScoreDataAsHTML(
        copyResult.restyledImprovedCopyScore, 
        `${selectedPersona}'s Voice Score`
      );
    }
  }
  
  // Handle multiple alternative versions if available
  if (copyResult.alternativeVersions && copyResult.alternativeVersions.length > 0) {
    copyResult.alternativeVersions.forEach((version, index) => {
      html += `<h2>${index + 1}.) Alternative Version</h2>`;
      const versionText = structuredToPlainText(version);
      html += `<div style="white-space: pre-wrap;">${versionText}</div>`;
      
      // Add score if available
      if (copyResult.alternativeVersionScores && copyResult.alternativeVersionScores[index]) {
        html += formatScoreDataAsHTML(
          copyResult.alternativeVersionScores[index], 
          `Alternative Version ${index + 1} Score`
        );
      }
      
      // Add restyled version if available
      if (copyResult.restyledAlternativeVersions && 
          copyResult.restyledAlternativeVersions[index] && 
          selectedPersona) {
        html += `<h3>${index + 1}.) Alternative Version (${selectedPersona}'s Voice)</h3>`;
        const restyledVersionText = structuredToPlainText(copyResult.restyledAlternativeVersions[index]);
        html += `<div style="white-space: pre-wrap;">${restyledVersionText}</div>`;
        
        // Add score for restyled version if available
        if (copyResult.restyledAlternativeVersionScores && 
            copyResult.restyledAlternativeVersionScores[index]) {
          html += formatScoreDataAsHTML(
            copyResult.restyledAlternativeVersionScores[index], 
            `${selectedPersona}'s Alternative Version ${index + 1} Score`
          );
        }
      }
    });
  } else if (copyResult.alternativeCopy) {
    // Legacy single alternative copy
    html += `<h2>Alternative Copy</h2>`;
    const alternativeCopyText = structuredToPlainText(copyResult.alternativeCopy);
    html += `<div style="white-space: pre-wrap;">${alternativeCopyText}</div>`;
    
    // Add score if available
    if (copyResult.alternativeCopyScore) {
      html += formatScoreDataAsHTML(copyResult.alternativeCopyScore, 'Alternative Copy Score');
    }
    
    // Legacy restyled alternative copy
    if (copyResult.restyledAlternativeCopy && selectedPersona) {
      html += `<h2>Alternative Copy (${selectedPersona}'s Voice)</h2>`;
      const restyledAlternativeCopyText = structuredToPlainText(copyResult.restyledAlternativeCopy);
      html += `<div style="white-space: pre-wrap;">${restyledAlternativeCopyText}</div>`;
      
      // Add score if available
      if (copyResult.restyledAlternativeCopyScore) {
        html += formatScoreDataAsHTML(
          copyResult.restyledAlternativeCopyScore,
          `${selectedPersona}'s Alternative Copy Score`
        );
      }
    }
  }
  
  // Add headlines if available
  if (copyResult.headlines && copyResult.headlines.length > 0) {
    html += `<h2>Headline Ideas</h2>`;
    html += `<ol>`;
    copyResult.headlines.forEach((headline) => {
      html += `<li>${headline}</li>`;
    });
    html += `</ol>`;
  }
  
  // Add restyled headlines if available
  if (copyResult.restyledHeadlinesVersions && copyResult.restyledHeadlinesVersions.length > 0) {
    // Display all restyled headline versions
    copyResult.restyledHeadlinesVersions.forEach(version => {
      html += `<h2>Headline Ideas (${version.persona}'s Voice)</h2>`;
      html += `<ol>`;
      version.headlines.forEach((headline) => {
        html += `<li>${headline}</li>`;
      });
      html += `</ol>`;
    });
  } else if (copyResult.restyledHeadlines && copyResult.restyledHeadlines.length > 0 && 
           (copyResult.restyledHeadlinesPersona || selectedPersona)) {
    // Legacy single restyled headlines
    html += `<h2>Headline Ideas (${selectedPersona}'s Voice)</h2>`;
    html += `<ol>`;
    copyResult.restyledHeadlines.forEach((headline) => {
      html += `<li>${headline}</li>`;
    });
    html += `</ol>`;
  }
  
  return html;
};

/**
 * Formats ONLY the copy content (no metadata, no scores) as HTML
 */
export const formatSingleGeneratedItemContentAsHTML = (
  item: GeneratedContentItem
): string => {
  let html = '';

  // Check if this is FAQ JSON content
  if (typeof item.content === 'object' && item.content !== null &&
      item.content['@context'] === 'https://schema.org' &&
      item.content['@type'] === 'FAQPage') {
    // This is FAQ JSON - format it as a code block
    html += `<pre><code>${JSON.stringify(item.content, null, 2)}</code></pre>\n`;
    return html;
  }

  // Handle different content types
  if (item.type === GeneratedContentItemType.SeoMetadata && item.seoMetadata) {
    // For SEO metadata cards, return empty (no visible content)
    return html;
  } else if (Array.isArray(item.content)) {
    // Handle headlines array - no title wrapper
    html += `<ol>\n`;
    item.content.forEach((headline: string) => {
      html += `  <li>${markdownToHtml(headline)}</li>\n`;
    });
    html += `</ol>`;
  } else if (typeof item.content === 'object' && item.content.headline && Array.isArray(item.content.sections)) {
    // Handle structured content
    const structuredContent = item.content as StructuredCopyOutput;

    html += `<h1>${markdownToHtml(structuredContent.headline)}</h1>\n\n`;

    structuredContent.sections.forEach(section => {
      if (section && section.title) {
        html += `<h2>${markdownToHtml(section.title)}</h2>\n`;

        if (section.content) {
          const contentHtml = markdownToHtml(section.content);
          if (contentHtml.includes('<p>')) {
            html += `${contentHtml}\n`;
          } else {
            const paragraphs = contentHtml.split('\n\n').filter(p => p.trim());
            paragraphs.forEach(paragraph => {
              html += `<p>${paragraph.trim()}</p>\n`;
            });
          }
        }

        if (section.listItems && section.listItems.length > 0) {
          html += `<ul>\n`;
          section.listItems.forEach(item => {
            html += `  <li>${markdownToHtml(item)}</li>\n`;
          });
          html += `</ul>\n`;
        }
      }
    });
  } else {
    // Handle plain text content
    const textContent = structuredToPlainText(item.content);
    const contentHtml = markdownToHtml(textContent);

    if (contentHtml.includes('<p>')) {
      html += `${contentHtml}`;
    } else {
      const paragraphs = contentHtml.split('\n\n').filter(p => p.trim());
      paragraphs.forEach(paragraph => {
        html += `<p>${paragraph.trim()}</p>\n`;
      });
    }
  }

  return html;
};

/**
 * Formats a single generated content item as FULL markdown with all metadata
 */
/**
 * Helper function to extract analysis sections from markdown content
 * Returns sections in a structured object
 */
const extractAnalysisSections = (content: string): {
  summary?: string;
  decisionLayer?: string;
  coreStrength?: string;
  whyThisWins?: string;
  subScores?: string;
  keyStrengths?: string;
  suggestedImprovements?: string;
  strategicRecommendation?: string;
  keyInsight?: string;
  whatToDo?: string;
  detailedScoring?: string;
  evidenceBasedAnalysis?: string;
  recommendations?: string;
  remaining?: string;
} => {
  const sections: any = {};

  // Find section boundaries (case-insensitive, flexible matching)
  const summaryMatch = content.match(/(?:^|\n)([^\n#]+?)(?=\n##|\nSUB-SCORES|####)/i);
  const decisionMatch = content.match(/####?\s*Decision(?:\s+Layer)?[\s\S]*?(?=####?|$)/i);
  const coreStrengthMatch = content.match(/####?\s*Core Strength[\s\S]*?(?=####?|$)/i);
  const whyWinsMatch = content.match(/####?\s*Why This Wins[\s\S]*?(?=####?|$)/i);
  const subScoresMatch = content.match(/(?:####?\s*)?SUB-SCORES:?[\s\S]*?(?=####?|$)/im);
  const keyStrengthsMatch = content.match(/####?\s*Key Strengths[\s\S]*?(?=####?|$)/i);
  const suggestedImprovementsMatch = content.match(/####?\s*Suggested Improvements[\s\S]*?(?=####?|$)/i);
  const strategicRecMatch = content.match(/####?\s*Strategic Recommendation[\s\S]*?(?=####?|$)/i);
  const keyInsightMatch = content.match(/\*\*Key Insight:\*\*[\s\S]*?(?=\*\*|####?|$)/i);
  const whatToDoMatch = content.match(/\*\*What to do:\*\*[\s\S]*?(?=\*\*|####?|$)/i);
  const scoringMatch = content.match(/####?\s*Detailed Scoring[\s\S]*?(?=####?|$)/i);
  const evidenceMatch = content.match(/####?\s*Evidence-based Analysis[\s\S]*?(?=####?|$)/i);
  const recsMatch = content.match(/####?\s*Recommendations[\s\S]*?(?=####?|$)/i);

  if (summaryMatch) sections.summary = summaryMatch[1].trim();
  if (decisionMatch) sections.decisionLayer = decisionMatch[0].trim();
  if (coreStrengthMatch) sections.coreStrength = coreStrengthMatch[0].trim();
  if (whyWinsMatch) sections.whyThisWins = whyWinsMatch[0].trim();
  if (subScoresMatch) sections.subScores = subScoresMatch[0].trim();
  if (keyStrengthsMatch) sections.keyStrengths = keyStrengthsMatch[0].trim();
  if (suggestedImprovementsMatch) sections.suggestedImprovements = suggestedImprovementsMatch[0].trim();
  if (strategicRecMatch) sections.strategicRecommendation = strategicRecMatch[0].trim();
  if (keyInsightMatch) sections.keyInsight = keyInsightMatch[0].trim();
  if (whatToDoMatch) sections.whatToDo = whatToDoMatch[0].trim();
  if (scoringMatch) sections.detailedScoring = scoringMatch[0].trim();
  if (evidenceMatch) sections.evidenceBasedAnalysis = evidenceMatch[0].trim();
  if (recsMatch) sections.recommendations = recsMatch[0].trim();

  // Get remaining content (anything not in the above sections)
  let remaining = content;
  if (summaryMatch) remaining = remaining.replace(summaryMatch[0], '');
  if (decisionMatch) remaining = remaining.replace(decisionMatch[0], '');
  if (coreStrengthMatch) remaining = remaining.replace(coreStrengthMatch[0], '');
  if (whyWinsMatch) remaining = remaining.replace(whyWinsMatch[0], '');
  if (subScoresMatch) remaining = remaining.replace(subScoresMatch[0], '');
  if (keyStrengthsMatch) remaining = remaining.replace(keyStrengthsMatch[0], '');
  if (suggestedImprovementsMatch) remaining = remaining.replace(suggestedImprovementsMatch[0], '');
  if (strategicRecMatch) remaining = remaining.replace(strategicRecMatch[0], '');
  if (keyInsightMatch) remaining = remaining.replace(keyInsightMatch[0], '');
  if (whatToDoMatch) remaining = remaining.replace(whatToDoMatch[0], '');
  if (scoringMatch) remaining = remaining.replace(scoringMatch[0], '');
  if (evidenceMatch) remaining = remaining.replace(evidenceMatch[0], '');
  if (recsMatch) remaining = remaining.replace(recsMatch[0], '');

  sections.remaining = remaining.trim();

  return sections;
};

export const formatSingleGeneratedItemAsMarkdown = (
  item: GeneratedContentItem,
  targetWordCount?: number
): string => {
  let markdown = '';

  // Title
  let title = item.sourceDisplayName || item.type;
  if (item.persona) {
    title += ` (${item.persona}'s Voice)`;
  }
  if (item.brandVoiceName) {
    title += ` [Brand Voice: ${item.brandVoiceName}]`;
  }
  markdown += `# ${title}\n\n`;

  // Metadata
  if (item.modificationInstruction) {
    markdown += `**Modification Applied:** ${item.modificationInstruction}\n\n`;
  }
  if (item.blendInstructions) {
    markdown += `**Special Instructions:** ${item.blendInstructions}\n\n`;
  }

  // If this is analysis content with comparison data, extract and reorder sections
  if (item.comparedContent) {
    let actualContent = item.content;
    if (typeof item.content === 'object' && item.content !== null && 'content' in item.content) {
      actualContent = (item.content as any).content;
    }

    // Use normalization for consistent formatting
    const contentText = typeof actualContent === 'string' ? actualContent : normalizeCopyForMarkdownExport(actualContent);
    const sections = extractAnalysisSections(contentText);

    // Add sections in the correct order (matching app UI and HTML export)
    // Order: Summary → Decision → Core Strength → Why Wins → Sub-scores → Key Strengths → Improvements → Strategic Rec → Insight/Action

    if (sections.summary) {
      markdown += `${sections.summary}\n\n`;
    }

    if (sections.decisionLayer) {
      markdown += `${sections.decisionLayer}\n\n`;
    }

    if (sections.coreStrength) {
      markdown += `${sections.coreStrength}\n\n`;
    }

    if (sections.whyThisWins) {
      markdown += `${sections.whyThisWins}\n\n`;
    }

    if (sections.subScores) {
      markdown += `${sections.subScores}\n\n`;
    }

    if (sections.keyStrengths) {
      markdown += `${sections.keyStrengths}\n\n`;
    }

    if (sections.suggestedImprovements) {
      markdown += `${sections.suggestedImprovements}\n\n`;
    }

    if (sections.strategicRecommendation) {
      markdown += `${sections.strategicRecommendation}\n\n`;
    }

    if (sections.keyInsight) {
      markdown += `${sections.keyInsight}\n\n`;
    }

    if (sections.whatToDo) {
      markdown += `${sections.whatToDo}\n\n`;
    }

    if (sections.detailedScoring) {
      markdown += `${sections.detailedScoring}\n\n`;
    }

    if (sections.evidenceBasedAnalysis) {
      markdown += `${sections.evidenceBasedAnalysis}\n\n`;
    }

    if (sections.recommendations) {
      markdown += `${sections.recommendations}\n\n`;
    }

    // Add any remaining content that wasn't categorized
    if (sections.remaining && sections.remaining.length > 0) {
      markdown += `${sections.remaining}\n\n`;
    }

    return markdown;
  }

  // Content (for non-analysis items)
  markdown += `## Content\n\n`;

  let actualContent = item.content;
  if (typeof item.content === 'object' && item.content !== null && 'content' in item.content) {
    actualContent = (item.content as any).content;
  }

  if (Array.isArray(actualContent)) {
    actualContent.forEach((headline, index) => {
      markdown += `${index + 1}. ${headline}\n`;
    });
    markdown += `\n`;
  } else {
    // Use normalization to ensure consistent formatting across all exports
    markdown += `${normalizeCopyForMarkdownExport(actualContent)}\n\n`;
  }

  // Quality Score
  if (item.score) {
    markdown += `## Quality Score\n\n`;
    markdown += `**Overall:** ${item.score.overall}/100\n\n`;

    if (item.score.improvementExplanation) {
      markdown += `**Why it's improved:** ${item.score.improvementExplanation}\n\n`;
    }

    markdown += `**Score Breakdown:**\n\n`;
    markdown += `- Clarity: ${item.score.clarity}\n`;
    markdown += `- Persuasiveness: ${item.score.persuasiveness}\n`;
    markdown += `- Tone Match: ${item.score.toneMatch}\n`;
    markdown += `- Engagement: ${item.score.engagement}\n`;

    if (item.score.wordCountAccuracy !== undefined) {
      markdown += `- Word Count Accuracy: ${item.score.wordCountAccuracy}/100\n`;
    }
    markdown += `\n`;

    if (item.score.suggestions && item.score.suggestions.length > 0 && item.score.overall < 95) {
      markdown += `**Optimization Suggestions:**\n\n`;
      item.score.suggestions.forEach(suggestion => {
        markdown += `- ${suggestion}\n`;
      });
      markdown += `\n`;
    }
  }

  // GEO Score
  if (item.geoScore) {
    markdown += `## GEO Score\n\n`;
    markdown += `**Overall:** ${item.geoScore.overall}/100\n\n`;

    if (item.geoScore.breakdown && item.geoScore.breakdown.length > 0) {
      markdown += `**Breakdown:**\n\n`;
      item.geoScore.breakdown.forEach(breakdownItem => {
        const status = breakdownItem.detected ? '[YES]' : '[NO]';
        markdown += `- ${status} **${breakdownItem.criterion}** (${breakdownItem.score} points): ${breakdownItem.explanation}\n`;
      });
      markdown += `\n`;
    }

    if (item.geoScore.suggestions && item.geoScore.suggestions.length > 0 && item.geoScore.overall < 80) {
      markdown += `**GEO Optimization Suggestions:**\n\n`;
      item.geoScore.suggestions.forEach(suggestion => {
        markdown += `- ${suggestion}\n`;
      });
      markdown += `\n`;
    }
  }

  // SEO Metadata
  if (item.seoMetadata) {
    markdown += `## SEO Metadata\n\n`;

    if (item.seoMetadata.urlSlugs && item.seoMetadata.urlSlugs.length > 0) {
      markdown += `**URL Slugs:**\n`;
      item.seoMetadata.urlSlugs.forEach((slug, idx) => {
        markdown += `${idx + 1}. \`${slug}\` (${slug.length}/60 chars)\n`;
      });
      markdown += `\n`;
    }

    if (item.seoMetadata.metaDescriptions && item.seoMetadata.metaDescriptions.length > 0) {
      markdown += `**Meta Descriptions:**\n`;
      item.seoMetadata.metaDescriptions.forEach((desc, idx) => {
        markdown += `${idx + 1}. ${desc} (${desc.length}/160 chars)\n`;
      });
      markdown += `\n`;
    }

    if (item.seoMetadata.h1Variants && item.seoMetadata.h1Variants.length > 0) {
      markdown += `**H1 Variants:**\n`;
      item.seoMetadata.h1Variants.forEach((h1, idx) => {
        markdown += `${idx + 1}. ${h1} (${h1.length}/60 chars)\n`;
      });
      markdown += `\n`;
    }

    if (item.seoMetadata.h2Headings && item.seoMetadata.h2Headings.length > 0) {
      markdown += `**H2 Headings:**\n`;
      item.seoMetadata.h2Headings.forEach((h2, idx) => {
        markdown += `${idx + 1}. ${h2} (${h2.length}/70 chars)\n`;
      });
      markdown += `\n`;
    }

    if (item.seoMetadata.h3Headings && item.seoMetadata.h3Headings.length > 0) {
      markdown += `**H3 Headings:**\n`;
      item.seoMetadata.h3Headings.forEach((h3, idx) => {
        markdown += `${idx + 1}. ${h3} (${h3.length}/70 chars)\n`;
      });
      markdown += `\n`;
    }
  }

  // FAQ Schema
  if (item.faqSchema && Object.keys(item.faqSchema).length > 0) {
    markdown += `## FAQ Schema (JSON-LD)\n\n`;
    markdown += '```json\n';
    markdown += JSON.stringify(item.faqSchema, null, 2);
    markdown += '\n```\n\n';
  }

  return markdown;
};

/**
 * Formats a single generated content item as HTML (LEGACY - includes all metadata)
 */
export const formatSingleGeneratedItemAsHTML = (
  item: GeneratedContentItem,
  targetWordCount?: number
): string => {
  let html = '';

  // Add SEO metadata as commented HTML at the top if available
  if (item.seoMetadata) {
    html += `<!-- SEO METADATA FOR ${item.sourceDisplayName || item.type}\n\n`;
    
    if (item.seoMetadata.urlSlugs && item.seoMetadata.urlSlugs.length > 0) {
      html += `URL SLUGS:\n`;
      item.seoMetadata.urlSlugs.forEach((slug, index) => {
        html += `${index + 1}. ${slug} (${slug.length}/60 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.metaDescriptions && item.seoMetadata.metaDescriptions.length > 0) {
      html += `META DESCRIPTIONS:\n`;
      item.seoMetadata.metaDescriptions.forEach((desc, index) => {
        html += `${index + 1}. ${desc} (${desc.length}/160 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.h1Variants && item.seoMetadata.h1Variants.length > 0) {
      html += `H1 PAGE TITLES:\n`;
      item.seoMetadata.h1Variants.forEach((h1, index) => {
        html += `${index + 1}. ${h1} (${h1.length}/60 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.h2Headings && item.seoMetadata.h2Headings.length > 0) {
      html += `H2 HEADINGS:\n`;
      item.seoMetadata.h2Headings.forEach((h2, index) => {
        html += `${index + 1}. ${h2} (${h2.length}/70 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.h3Headings && item.seoMetadata.h3Headings.length > 0) {
      html += `H3 HEADINGS:\n`;
      item.seoMetadata.h3Headings.forEach((h3, index) => {
        html += `${index + 1}. ${h3} (${h3.length}/70 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.ogTitles && item.seoMetadata.ogTitles.length > 0) {
      html += `OPEN GRAPH TITLES:\n`;
      item.seoMetadata.ogTitles.forEach((ogTitle, index) => {
        html += `${index + 1}. ${ogTitle} (${ogTitle.length}/60 chars)\n`;
      });
      html += `\n`;
    }
    
    if (item.seoMetadata.ogDescriptions && item.seoMetadata.ogDescriptions.length > 0) {
      html += `OPEN GRAPH DESCRIPTIONS:\n`;
      item.seoMetadata.ogDescriptions.forEach((ogDesc, index) => {
        html += `${index + 1}. ${ogDesc} (${ogDesc.length}/110 chars)\n`;
      });
      html += `\n`;
    }
    
    html += `-->\n\n`;
  }
  
  // Check if this is FAQ JSON content
  if (typeof item.content === 'object' && item.content !== null && 
      item.content['@context'] === 'https://schema.org' && 
      item.content['@type'] === 'FAQPage') {
    // This is FAQ JSON - format it as a code block
    html += `<h2>FAQ Schema (JSON-LD)</h2>\n`;
    html += `<pre><code>${JSON.stringify(item.content, null, 2)}</code></pre>\n`;
    return html;
  }
  
  // Handle different content types
  if (item.type === GeneratedContentItemType.SeoMetadata && item.seoMetadata) {
    // For SEO metadata cards, only include the commented metadata (already added above)
    // Return immediately - no visible content should be generated
    return html;
  } else if (Array.isArray(item.content)) {
    // Handle headlines array - no title wrapper
    html += `<ol>\n`;
    item.content.forEach((headline: string) => {
      html += `  <li>${markdownToHtml(headline)}</li>\n`;
    });
    html += `</ol>`;
  } else if (typeof item.content === 'object' && item.content.headline && Array.isArray(item.content.sections)) {
    // Handle structured content
    const structuredContent = item.content as StructuredCopyOutput;
    
    html += `<h1>${markdownToHtml(structuredContent.headline)}</h1>\n\n`;
    
    structuredContent.sections.forEach(section => {
      if (section && section.title) {
        html += `<h2>${markdownToHtml(section.title)}</h2>\n`;
        
        if (section.content) {
          // Convert content to HTML and split into paragraphs
          const contentHtml = markdownToHtml(section.content);
          // If content already has paragraph tags, use as-is, otherwise wrap
          if (contentHtml.includes('<p>')) {
            html += `${contentHtml}\n`;
          } else {
            const paragraphs = contentHtml.split('\n\n').filter(p => p.trim());
            paragraphs.forEach(paragraph => {
              html += `<p>${paragraph.trim()}</p>\n`;
            });
          }
        }
        
        if (section.listItems && section.listItems.length > 0) {
          html += `<ul>\n`;
          section.listItems.forEach(item => {
            html += `  <li>${markdownToHtml(item)}</li>\n`;
          });
          html += `</ul>\n`;
        }
      }
    });
  } else {
    // Handle plain text content
    const textContent = structuredToPlainText(item.content);
    
    // Convert to HTML and handle paragraphs
    const contentHtml = markdownToHtml(textContent);
    
    // If content already has paragraph tags, use as-is, otherwise wrap
    if (contentHtml.includes('<p>')) {
      html += `${contentHtml}`;
    } else {
      const paragraphs = contentHtml.split('\n\n').filter(p => p.trim());
      paragraphs.forEach(paragraph => {
        html += `<p>${paragraph.trim()}</p>\n`;
      });
    }
  }
  
  // Add modification instruction if available
  if (item.modificationInstruction) {
    html += `\n\n<!-- MODIFICATION APPLIED: ${item.modificationInstruction} -->\n`;
  }
  
  // Add score information if available
  if (item.score) {
    html += `\n\n<!-- QUALITY SCORE: ${item.score.overall}/100\n\n`;

    if (item.score.improvementExplanation) {
      html += `WHY IT'S IMPROVED:\n`;
      html += `${item.score.improvementExplanation}\n\n`;
    }

    html += `SCORE DETAILS:\n`;
    html += `- Clarity: ${item.score.clarity}\n`;
    html += `- Persuasiveness: ${item.score.persuasiveness}\n`;
    html += `- Tone Match: ${item.score.toneMatch}\n`;
    html += `- Engagement: ${item.score.engagement}\n`;

    if (item.score.wordCountAccuracy !== undefined) {
      html += `- Word Count Accuracy: ${item.score.wordCountAccuracy}/100\n`;
    }

    if (item.score.suggestions && item.score.suggestions.length > 0 && item.score.overall < 95) {
      html += `\nOPTIMIZATION SUGGESTIONS:\n`;
      item.score.suggestions.forEach(suggestion => {
        html += `- ${suggestion}\n`;
      });
    }

    html += `\n-->\n`;
  }
  
  // Add FAQ Schema if available
  if (item.faqSchema && Object.keys(item.faqSchema).length > 0) {
    html += `\n\n<!-- FAQ SCHEMA (JSON-LD) -->\n`;
    html += `<script type="application/ld+json">\n`;
    html += JSON.stringify(item.faqSchema, null, 2);
    html += `\n</script>\n`;
  }

  return html;
};

/**
 * Generate comprehensive styled HTML export that matches the app's visual design
 * Includes all generated cards with scores, SEO metadata, comparisons, and best version analysis
 * This produces HTML that looks exactly like what you see in the app interface
 */
export const formatAsComprehensiveHTML = (
  generatedOutputCards: GeneratedContentItem[],
  comparisonContent?: string,
  comparisonResult?: ComparisonResult,
  targetWordCount?: number
): string => {
  let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n';
  html += '<meta charset="UTF-8">\n';
  html += '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n';
  html += '<title>CopyZap Export - ' + new Date().toLocaleString() + '</title>\n';
  html += '<style>\n';
  html += 'body { font-family: system-ui, -apple-system, sans-serif; background: #ffffff; margin: 0; padding: 40px 20px 120px 20px; }\n';
  html += '.container { max-width: 900px; margin: 0 auto; }\n';
  html += 'a { cursor: pointer; }\n';
  html += 'a:hover { opacity: 0.8; }\n';
  html += '.floating-breadcrumb { position: fixed; bottom: 0; left: 0; right: 0; background: linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(249,250,251,0.98) 100%); border-top: 2px solid #e5e7eb; box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.1); padding: 16px 20px; z-index: 1000; backdrop-filter: blur(8px); }\n';
  html += '.breadcrumb-container { max-width: 900px; margin: 0 auto; }\n';
  html += '.breadcrumb-title { font-size: 12px; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }\n';
  html += '.breadcrumb-links { display: flex; flex-wrap: wrap; gap: 8px; }\n';
  html += '.breadcrumb-link { display: inline-block; padding: 6px 12px; background: #ffffff; border: 1px solid #d1d5db; border-radius: 6px; font-size: 13px; color: #374151; text-decoration: none; transition: all 0.2s; }\n';
  html += '.breadcrumb-link:hover { background: #f3f4f6; border-color: #6366f1; color: #6366f1; transform: translateY(-1px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }\n';
  html += '.breadcrumb-section { font-weight: 600; color: #111827; background: #f9fafb; }\n';
  html += '</style>\n';
  html += '</head>\n<body>\n';
  html += '<div class="container">\n';

  // Title
  html += '<h1 style="font-size: 32px; font-weight: 700; color: #111827; margin: 0 0 32px 0; border-bottom: 3px solid #e5e7eb; padding-bottom: 16px;">Generated Copy Report</h1>\n';
  html += `<p style="color: #6b7280; margin-bottom: 40px;">Generated: ${new Date().toLocaleString()}</p>\n`;

  // Generate all cards FIRST
  generatedOutputCards.forEach((card, index) => {
    if (index > 0) {
      html += '<div style="border-top: 2px solid #e5e7eb; margin: 48px 0;"></div>\n';
    }
    html += generateFullHtmlExportForCard(card, targetWordCount);
  });

  // Add comparison table AFTER all cards
  if (comparisonContent) {
    html += '<div style="border-top: 3px solid #111827; margin: 48px 0;"></div>\n';
    html += '<div id="comparison-table">\n';
    html += generateComparisonHtml(comparisonContent, generatedOutputCards);
    html += '</div>\n';
  }

  // Add comparison result sections if available (in order: Overall Recommendation, Best Version Analysis, All Versions Breakdown)
  if (comparisonResult) {
    // Overall Recommendation
    html += '<div style="border-top: 3px solid #111827; margin: 48px 0;"></div>\n';
    html += generateOverallRecommendationHtml(comparisonResult, generatedOutputCards);

    // Best Version Analysis
    html += '<div style="border-top: 3px solid #111827; margin: 48px 0;"></div>\n';
    html += generateBestVersionAnalysisHtml(comparisonResult, generatedOutputCards);

    // All Versions Breakdown (only when deep analysis was generated)
    const allVersionsHtml = generateAllVersionsBreakdownHtml(comparisonResult, generatedOutputCards);
    if (allVersionsHtml) {
      html += '<div style="border-top: 3px solid #111827; margin: 48px 0;"></div>\n';
      html += allVersionsHtml;
    }
  }

  // Footer
  html += '<div style="border-top: 2px solid #e5e7eb; margin: 48px 0 0 0; padding-top: 24px; text-align: center;">\n';
  html += '<p style="color: #9ca3af; font-size: 14px; font-style: italic;">Generated by CopyZap - ' + new Date().toLocaleString() + '</p>\n';
  html += '</div>\n';

  html += '</div>\n';

  // Add floating breadcrumb navigation
  html += '<div class="floating-breadcrumb">\n';
  html += '<div class="breadcrumb-container">\n';
  html += '<div class="breadcrumb-title">Quick Navigation</div>\n';
  html += '<div class="breadcrumb-links">\n';

  // Links to all output cards FIRST
  generatedOutputCards.forEach((card, index) => {
    const title = card.sourceDisplayName || card.type;
    const shortTitle = title.length > 25 ? title.substring(0, 25) + '...' : title;
    html += `<a href="#output-${card.id}" class="breadcrumb-link">${index + 1}. ${shortTitle}</a>\n`;
  });

  // Link to comparison table if available
  if (comparisonContent) {
    html += '<a href="#comparison-table" class="breadcrumb-link breadcrumb-section">📊 Comparison Table</a>\n';
  }

  // Link to comparison result sections if available
  if (comparisonResult) {
    if (comparisonResult.bestForMarketing || comparisonResult.bestForClarity || comparisonResult.bestForSimplicity) {
      html += '<a href="#overall-recommendation" class="breadcrumb-link breadcrumb-section">🎯 Overall Recommendation</a>\n';
    }
    html += '<a href="#best-version-analysis" class="breadcrumb-link breadcrumb-section">🏆 Best Version</a>\n';
    if (comparisonResult.comparisonDetails && comparisonResult.comparisonDetails.length > 0) {
      html += '<a href="#all-versions-breakdown" class="breadcrumb-link breadcrumb-section">⚠️ All Versions</a>\n';
    }
  }

  html += '</div>\n';
  html += '</div>\n';
  html += '</div>\n';

  html += '</body>\n</html>';

  return html;
};