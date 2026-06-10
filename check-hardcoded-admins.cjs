#!/usr/bin/env node

/**
 * Regression Guard: Check for Hardcoded Admin Emails
 *
 * This script ensures that hardcoded admin email addresses are not
 * accidentally re-introduced into the codebase after migrating to
 * the app_admins allowlist system.
 *
 * Usage:
 *   node check-hardcoded-admins.cjs
 *   npm run check:hardcoded-admins
 *
 * Exit codes:
 *   0 - No hardcoded emails found (or only in allowed locations)
 *   1 - Hardcoded emails found in disallowed locations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Email patterns to search for (known admin emails that should not be hardcoded)
const FORBIDDEN_PATTERNS = [
  'info@sharpen.studio',
  'thijs@readspeaker.com',
  'thijs.vanopstal@gmail.com'
];

// Files/directories to exclude from search
const EXCLUDED_PATHS = [
  'node_modules/',
  'dist/',
  '.git/',
  'build/',
  'coverage/',
  '.bolt/',
  // This script itself
  'check-hardcoded-admins.cjs'
];

// Files where hardcoded emails ARE allowed (with explanation)
const ALLOWED_FILES = [
  // Migration files that seed the app_admins table
  {
    pattern: /supabase\/migrations\/.*\.sql$/,
    reason: 'Migration files seeding app_admins table'
  },
  // Documentation files
  {
    pattern: /\.md$/,
    reason: 'Documentation files'
  },
  // This regression guard script
  {
    pattern: /check-hardcoded-admins\.cjs$/,
    reason: 'This regression guard script'
  }
];

/**
 * Check if a file path is allowed to contain hardcoded emails
 */
function isAllowedFile(filePath) {
  return ALLOWED_FILES.some(allowed => allowed.pattern.test(filePath));
}

/**
 * Get the reason why a file is allowed
 */
function getAllowedReason(filePath) {
  const match = ALLOWED_FILES.find(allowed => allowed.pattern.test(filePath));
  return match ? match.reason : 'Unknown';
}

/**
 * Search for pattern in all files
 */
function searchPattern(pattern) {
  const results = [];

  try {
    // Build grep command with exclusions
    const excludeArgs = EXCLUDED_PATHS.map(p => `--exclude-dir=${p}`).join(' ');

    // Use ripgrep if available, otherwise fall back to grep
    let grepCmd;
    try {
      execSync('which rg', { stdio: 'ignore' });
      // ripgrep found
      const excludeRg = EXCLUDED_PATHS.map(p => `-g '!${p}'`).join(' ');
      grepCmd = `rg -i -n "${pattern}" ${excludeRg} . 2>/dev/null || true`;
    } catch {
      // Fall back to grep
      grepCmd = `grep -r -i -n "${pattern}" ${excludeArgs} . 2>/dev/null || true`;
    }

    const output = execSync(grepCmd, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      cwd: __dirname
    });

    if (output.trim()) {
      const lines = output.trim().split('\n');
      for (const line of lines) {
        const match = line.match(/^([^:]+):(\d+):(.*)/);
        if (match) {
          const [, file, lineNum, content] = match;
          results.push({
            file: file.replace(/^\.\//, ''),
            line: parseInt(lineNum, 10),
            content: content.trim(),
            pattern
          });
        }
      }
    }
  } catch (error) {
    // Grep returns exit code 1 when no matches found, which is fine
    if (error.status !== 1) {
      console.error(`Error searching for pattern "${pattern}":`, error.message);
    }
  }

  return results;
}

/**
 * Main execution
 */
function main() {
  console.log('🔍 Checking for hardcoded admin emails...\n');

  let foundViolations = false;
  const allowedMatches = [];
  const disallowedMatches = [];

  // Search for each forbidden pattern
  for (const pattern of FORBIDDEN_PATTERNS) {
    console.log(`Searching for: ${pattern}`);
    const matches = searchPattern(pattern);

    for (const match of matches) {
      if (isAllowedFile(match.file)) {
        allowedMatches.push({ ...match, reason: getAllowedReason(match.file) });
      } else {
        disallowedMatches.push(match);
        foundViolations = true;
      }
    }
  }

  // Report results
  console.log('\n' + '='.repeat(80));

  if (allowedMatches.length > 0) {
    console.log('\n✅ Found in allowed locations:');
    const grouped = {};
    for (const match of allowedMatches) {
      if (!grouped[match.reason]) {
        grouped[match.reason] = [];
      }
      grouped[match.reason].push(match);
    }

    for (const [reason, matches] of Object.entries(grouped)) {
      console.log(`\n  ${reason}:`);
      for (const match of matches) {
        console.log(`    - ${match.file}:${match.line}`);
      }
    }
  }

  if (disallowedMatches.length > 0) {
    console.log('\n❌ VIOLATIONS FOUND - Hardcoded emails in disallowed locations:\n');
    for (const match of disallowedMatches) {
      console.log(`  File: ${match.file}:${match.line}`);
      console.log(`  Pattern: ${match.pattern}`);
      console.log(`  Content: ${match.content}`);
      console.log('');
    }

    console.log('⚠️  These hardcoded admin emails must be removed!');
    console.log('📝 Admin emails should only exist in:');
    console.log('   - supabase/migrations/*.sql (seeding app_admins table)');
    console.log('   - Documentation files (*.md)');
    console.log('   - This regression guard script\n');
    console.log('💡 Use the app_admins table and is_app_admin() RPC instead.\n');
  } else {
    console.log('\n✅ No violations found!');
    console.log('   All hardcoded admin emails are in allowed locations only.\n');
  }

  console.log('='.repeat(80) + '\n');

  // Exit with appropriate code
  if (foundViolations) {
    console.error('❌ Check failed: Hardcoded admin emails found in disallowed locations.\n');
    process.exit(1);
  } else {
    console.log('✅ Check passed: No hardcoded admin emails in disallowed locations.\n');
    process.exit(0);
  }
}

// Run the check
main();
