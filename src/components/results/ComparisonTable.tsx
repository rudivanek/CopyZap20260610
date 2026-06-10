import React from 'react';
import { getScoreTextClass } from '../../utils/scoreColors';
import { GeneratedContentItem } from '../../types';

interface ComparisonTableProps {
  content: string;
  cards?: GeneratedContentItem[];
  allComparisonContents?: string[]; // NEW: Array of all comparison contents to merge
}

/**
 * Parses and renders Grok comparison with colored scores, HTML tables, and section dividers
 * Now supports merging multiple comparison tables into one with combined rows
 */
const ComparisonTable: React.FC<ComparisonTableProps> = ({ content, cards = [], allComparisonContents = [] }) => {
  // Debug: Log the content being parsed
  React.useEffect(() => {
    console.log('ComparisonTable received content:', content.substring(0, 500));
    if (allComparisonContents.length > 0) {
      console.log('ComparisonTable merging', allComparisonContents.length, 'comparison contents');
    }
  }, [content, allComparisonContents]);

  // Create a mapping from option names to card IDs for anchor links
  const optionNameToCardId = React.useMemo(() => {
    const mapping: Record<string, string> = {};
    cards.forEach((card) => {
      const optionName = card.sourceDisplayName || card.type;
      mapping[optionName] = card.id;
    });
    return mapping;
  }, [cards]);

  // Helper function to extract table data from markdown content
  const extractTableData = (contentText: string): { headers: string[]; rows: string[][] } | null => {
    const lines = contentText.split('\n');
    const tableLines: string[] = [];

    // Find table lines (lines containing |)
    for (const line of lines) {
      if (line.includes('|')) {
        tableLines.push(line);
      }
    }

    if (tableLines.length === 0) return null;

    // Find header (first line with | that has actual content)
    const headerLine = tableLines.find(l => {
      if (!l.includes('|')) return false;
      // Skip separator lines (only contains -, |, and spaces)
      if (l.match(/^[\s|:\-]+$/)) return false;
      // Must have at least one alphanumeric character
      return /[a-zA-Z0-9]/.test(l);
    });

    if (!headerLine) return null;

    // Parse headers
    const headers = headerLine
      .split('|')
      .map(h => h.trim())
      .filter((h, idx, arr) => {
        if (h === '' && (idx === 0 || idx === arr.length - 1)) return false;
        return h !== '' || h.match(/^-+$/);
      });

    // Parse data rows
    const dataRows: string[][] = [];
    let foundHeader = false;

    for (const line of tableLines) {
      if (line === headerLine) {
        foundHeader = true;
        continue;
      }

      if (!foundHeader) continue;

      // Skip separator lines
      if (line.match(/^[\s|:\-]+$/)) continue;

      // Must have at least one alphanumeric character
      if (!/[a-zA-Z0-9]/.test(line)) continue;

      // Parse row
      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter((c, idx, arr) => {
          if (c === '' && (idx === 0 || idx === arr.length - 1)) return false;
          return true;
        });

      // Ensure row has same number of cells as headers
      while (cells.length < headers.length) {
        cells.push('');
      }
      if (cells.length > headers.length) {
        cells.length = headers.length;
      }

      // Skip rows that are duplicate headers (first cell is "Option")
      if (cells.length > 0 && cells[0]?.trim().toLowerCase() === 'option') {
        continue;
      }

      if (cells.length > 0 && cells.some(c => c !== '')) {
        dataRows.push(cells);
      }
    }

    if (dataRows.length === 0) return null;

    return { headers, rows: dataRows };
  };

  // Merge table data from all comparison contents
  const mergedTableData = React.useMemo(() => {
    const allContents = [content, ...allComparisonContents].filter(c => c && c.trim());

    if (allContents.length === 0) return null;

    // Extract table data from each content
    const tables = allContents.map(c => extractTableData(c)).filter(t => t !== null);

    if (tables.length === 0) return null;

    // Use the first table's headers as the base
    const baseTable = tables[0]!;
    const mergedHeaders = baseTable.headers;
    const mergedRows: string[][] = [];
    const seenOptions = new Set<string>(); // Track unique option names

    // Add all rows from all tables, deduplicating by first column (option name)
    for (const table of tables) {
      // Verify headers match (or are compatible)
      if (table.headers.length === mergedHeaders.length) {
        for (const row of table.rows) {
          const optionName = row[0]?.trim() || '';

          // Skip rows that are duplicate headers (first cell is "Option")
          if (optionName.toLowerCase() === 'option') {
            continue;
          }

          // Only add if we haven't seen this option yet
          if (!seenOptions.has(optionName)) {
            seenOptions.add(optionName);
            mergedRows.push(row);
          }
        }
      }
    }

    return { headers: mergedHeaders, rows: mergedRows };
  }, [content, allComparisonContents]);

  // Helper function to render text with colored scores
  const renderTextWithColoredScores = (text: string): React.ReactNode => {
    // Match both fraction format (80/100) and plain numbers (78, 82, 95, etc.)
    // But exclude ranges like (1-100) or patterns like "1-100"
    const scorePattern = /(\d+\.?\d*\/\d+)|(?<!\d)(\d{1,3}(?:\.\d+)?)(?!\d)(?!-\d)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = scorePattern.exec(text)) !== null) {
      const scoreText = match[0];

      // Skip if this is part of a range notation like (1-10) or 1-10
      const beforeChar = match.index > 0 ? text[match.index - 1] : '';
      const afterChar = match.index + scoreText.length < text.length ? text[match.index + scoreText.length] : '';

      // Check if surrounded by parentheses with hyphen (range notation)
      if (beforeChar === '(' && text.substring(match.index, match.index + 10).includes('-')) {
        lastIndex = match.index + scoreText.length;
        continue;
      }

      // Check if followed by hyphen (range notation like 1-10)
      if (afterChar === '-' && /\d/.test(text[match.index + scoreText.length + 1] || '')) {
        lastIndex = match.index + scoreText.length;
        continue;
      }

      // Add text before score
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }

      // Add colored score
      let normalizedScore: number;

      if (scoreText.includes('/')) {
        // Fraction format: 80/100 or 75/100
        const [num, denom] = scoreText.split('/').map(Number);
        normalizedScore = (num / denom) * 100;
      } else {
        // Plain number format (already 0-100)
        normalizedScore = Number(scoreText);

        if (normalizedScore < 0 || normalizedScore > 100) {
          // Not a valid score, don't colorize
          parts.push(scoreText);
          lastIndex = match.index + match[0].length;
          continue;
        }
      }

      parts.push(
        <span key={match.index} className={getScoreTextClass(normalizedScore)}>
          {scoreText}
        </span>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? <>{parts}</> : <>{text}</>;
  };

  // If we have merged table data, render it directly and skip complex parsing
  if (mergedTableData) {
    console.log('Rendering merged table with', mergedTableData.rows.length, 'rows');
    console.log('Headers:', mergedTableData.headers);
    mergedTableData.rows.forEach((row, idx) => {
      console.log(`Row ${idx}:`, row);
      console.log(`Row ${idx} cell[7] (Overall):`, row[7]);
      console.log(`Row ${idx} cell[8] (Improvement):`, row[8]);
    });
    return (
      <div>
        <div className="my-4 overflow-x-auto">
          <div className="border-t-2 border-gray-300 dark:border-gray-600 mb-4"></div>
          <table className="min-w-full border-collapse border-2 border-gray-900 dark:border-gray-100">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                {mergedTableData.headers.map((header, idx) => (
                  <th
                    key={idx}
                    className="border-2 border-gray-900 dark:border-gray-100 px-2 py-2 text-left text-xs font-bold text-gray-900 dark:text-white"
                  >
                    {renderTextWithColoredScores(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mergedTableData.rows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  {row.map((cell, cellIdx) => {
                    const isOptionColumn = cellIdx === 0;
                    const cardId = isOptionColumn ? optionNameToCardId[cell.trim()] : undefined;

                    return (
                      <td
                        key={cellIdx}
                        className={`border border-gray-900 dark:border-gray-100 px-2 py-2 text-xs text-gray-700 dark:text-gray-300 ${
                          cellIdx === 0 ? 'font-semibold' : ''
                        }`}
                      >
                        {isOptionColumn && cardId ? (
                          <div className="flex flex-col gap-1">
                            <a
                              href={`#output-${cardId}`}
                              onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(`output-${cardId}`);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline cursor-pointer"
                            >
                              {renderTextWithColoredScores(cell)}
                            </a>
                            <a
                              href={`#analysis-${cardId}`}
                              onClick={(e) => {
                                e.preventDefault();
                                const element = document.getElementById(`analysis-${cardId}`);
                                if (element) {
                                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                              }}
                              className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline cursor-pointer"
                            >
                              → View Analysis
                            </a>
                          </div>
                        ) : (
                          renderTextWithColoredScores(cell)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Parse content into sections and detect tables
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentTableLines: string[] = [];
  let inTable = false;
  let lineIndex = 0;

  // IMPORTANT: User-requested feature - DO NOT REMOVE OR MODIFY without explicit permission
  // This flag tracks and skips "Analysis of [Name]" sections to avoid redundancy
  // The detailed analysis text is redundant because it's already shown in the output cards
  // Only the comparison table and output cards should be displayed
  let inAnalysisSection = false;

  const flushTable = () => {
    if (currentTableLines.length === 0) return;

    // Parse table
    const tableLines = currentTableLines.filter(l => l.trim());

    // Find header (first line with | that has actual content)
    const headerLine = tableLines.find(l => {
      if (!l.includes('|')) return false;
      // Skip separator lines (only contains -, |, and spaces)
      if (l.match(/^[\s|:\-]+$/)) return false;
      // Must have at least one alphanumeric character
      return /[a-zA-Z0-9]/.test(l);
    });

    if (!headerLine) {
      // Not a valid table, render as text
      currentTableLines.forEach((line, idx) => {
        elements.push(<div key={`table-text-${lineIndex}-${idx}`} className="whitespace-pre-wrap">{renderTextWithColoredScores(line)}</div>);
      });
      currentTableLines = [];
      return;
    }

    // Parse headers - remove leading/trailing empty cells
    const headers = headerLine
      .split('|')
      .map(h => h.trim())
      .filter((h, idx, arr) => {
        // Remove empty cells at start and end
        if (h === '' && (idx === 0 || idx === arr.length - 1)) return false;
        // Keep cells that have content or are separator lines
        return h !== '' || h.match(/^-+$/);
      });

    // Parse data rows (skip header and separator lines)
    const dataRows: string[][] = [];
    let foundHeader = false;

    for (const line of tableLines) {
      if (line === headerLine) {
        foundHeader = true;
        continue;
      }

      if (!foundHeader) continue;

      // Skip separator lines (contains only |, -, :, and spaces)
      if (line.match(/^[\s|:\-]+$/)) continue;

      // Must have at least one alphanumeric character to be a data row
      if (!/[a-zA-Z0-9]/.test(line)) continue;

      // Parse row - handle leading/trailing empty cells like headers
      const cells = line
        .split('|')
        .map(c => c.trim())
        .filter((c, idx, arr) => {
          // Remove empty cells at start and end
          if (c === '' && (idx === 0 || idx === arr.length - 1)) return false;
          return true;
        });

      // Ensure row has same number of cells as headers (pad or trim if needed)
      while (cells.length < headers.length) {
        cells.push('');
      }
      if (cells.length > headers.length) {
        cells.length = headers.length;
      }

      // Skip rows that are duplicate headers (first cell is "Option")
      if (cells.length > 0 && cells[0]?.trim().toLowerCase() === 'option') {
        continue;
      }

      if (cells.length > 0 && cells.some(c => c !== '')) {
        dataRows.push(cells);
      }
    }

    // Debug: Log table detection
    console.log('Table detected! Headers:', headers.length, 'Data rows:', dataRows.length);
    if (headers.length > 0) {
      console.log('Headers:', headers);
    }
    if (dataRows.length > 0) {
      console.log('First row:', dataRows[0]);
    }

    // Render table
    elements.push(
      <div key={`table-${lineIndex}`} className="my-4 overflow-x-auto">
        <div className="border-t-2 border-gray-300 dark:border-gray-600 mb-4"></div>
        <table className="min-w-full border-collapse border-2 border-gray-900 dark:border-gray-100">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="border-2 border-gray-900 dark:border-gray-100 px-2 py-2 text-left text-xs font-bold text-gray-900 dark:text-white"
                >
                  {renderTextWithColoredScores(header)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {row.map((cell, cellIdx) => {
                  // For the first column (Option), make it a clickable anchor link
                  const isOptionColumn = cellIdx === 0;
                  const cardId = isOptionColumn ? optionNameToCardId[cell.trim()] : undefined;

                  return (
                    <td
                      key={cellIdx}
                      className={`border border-gray-900 dark:border-gray-100 px-2 py-2 text-xs text-gray-700 dark:text-gray-300 ${
                        cellIdx === 0 ? 'font-semibold' : ''
                      }`}
                    >
                      {isOptionColumn && cardId ? (
                        <div className="flex flex-col gap-1">
                          <a
                            href={`#output-${cardId}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const element = document.getElementById(`output-${cardId}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline cursor-pointer"
                          >
                            {renderTextWithColoredScores(cell)}
                          </a>
                          <a
                            href={`#analysis-${cardId}`}
                            onClick={(e) => {
                              e.preventDefault();
                              const element = document.getElementById(`analysis-${cardId}`);
                              if (element) {
                                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                              }
                            }}
                            className="text-xs text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline cursor-pointer"
                          >
                            → View Analysis
                          </a>
                        </div>
                      ) : (
                        renderTextWithColoredScores(cell)
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    currentTableLines = [];
  };

  // Process lines
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    lineIndex = i;

    // Check if line is part of a table
    // A table line either contains | or is a separator line when already in a table
    const isTableLine = trimmedLine.includes('|') || (inTable && trimmedLine.match(/^[\s:\-]+$/));

    if (isTableLine) {
      if (!inTable) {
        inTable = true;
      }
      currentTableLines.push(line);
      continue;
    } else if (inTable) {
      // End of table - flush it
      flushTable();
      inTable = false;
      // Don't skip this line, process it as normal content below
    }

    // Skip if this line was just processed as end of table marker
    if (inTable) continue;

    // Render regular content
    const h3Match = trimmedLine.match(/^###\s+(.+)$/);
    const h2Match = trimmedLine.match(/^##\s+(.+)$/);
    const h1Match = trimmedLine.match(/^#\s+(.+)$/);

    // ============================================================================
    // CRITICAL: User-requested feature - DO NOT MODIFY without explicit permission
    // This logic hides the detailed "Analysis of [Name]" sections to prevent
    // redundant information from appearing in the workflow comparison view
    // ============================================================================

    // Check if this h3 is an "Analysis of..." section and enter skip mode
    if (h3Match && h3Match[1].match(/Analysis of (.+?)(?:\s*-\s*Score:|$)/i)) {
      inAnalysisSection = true;
      continue;
    }

    // If we hit an h2, we're exiting the analysis section
    if (h2Match && inAnalysisSection) {
      inAnalysisSection = false;
      // Continue to render this h2
    }

    // Skip all content while in analysis section
    if (inAnalysisSection) {
      continue;
    }
    // ============================================================================

    // Render content normally
    if (h3Match) {
      elements.push(
        <React.Fragment key={i}>
          <div className="border-t-2 border-gray-300 dark:border-gray-600 my-4"></div>
          <h3 className="text-base font-semibold mb-2 mt-3 text-gray-700 dark:text-gray-300">
            {renderTextWithColoredScores(h3Match[1])}
          </h3>
        </React.Fragment>
      );
    } else if (h2Match) {
      elements.push(
        <h2 key={i} className="text-lg font-semibold mb-2 mt-4 text-gray-800 dark:text-gray-200">
          {renderTextWithColoredScores(h2Match[1])}
        </h2>
      );
    } else if (h1Match) {
      elements.push(
        <h1 key={i} className="text-xl font-bold mb-4 mt-6 text-gray-900 dark:text-white">
          {renderTextWithColoredScores(h1Match[1])}
        </h1>
      );
    } else if (trimmedLine === '') {
      elements.push(<br key={i} />);
    } else {
      elements.push(
        <div key={i} className="whitespace-pre-wrap">
          {renderTextWithColoredScores(line)}
        </div>
      );
    }
  }

  // Flush any remaining table
  if (inTable) {
    flushTable();
  }

  return <div>{elements}</div>;
};

export default ComparisonTable;
