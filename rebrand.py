#!/usr/bin/env python3
"""
Brand Rename Script: PimpMyCopy → CopyZap
Performs case-sensitive, context-aware string replacements across the entire codebase.
"""

import os
import sys
from pathlib import Path

# Define replacement mappings
REPLACEMENTS = [
    ('PimpMyCopy', 'CopyZap'),
    ('pimpmycopy', 'copyzap'),
    ('PIMPMYCOPY', 'COPYZAP'),
    ('pimpmycopy.com', 'copyzap.app'),
    ('pimpmycopy.app', 'copyzap.app'),
    ('privacy@pimpmycopy.com', 'hi@copyzap.app'),
    ('@PimpMyCopy', '@CopyZap'),
    ('pimpMyCopy', 'copyZap'),  # camelCase variant
]

# Directories to process
INCLUDE_DIRS = ['src', 'docs', 'public', 'supabase']

# File extensions to process
INCLUDE_EXTENSIONS = [
    '.ts', '.tsx', '.js', '.jsx', '.json', '.html', '.md',
    '.txt', '.xml', '.css', '.scss', '.yaml', '.yml'
]

# Files/dirs to skip
SKIP_PATTERNS = [
    'node_modules',
    '.git',
    'dist',
    '.next',
    'build',
    '.cache',
    '__pycache__',
    '.DS_Store',
    'package-lock.json',  # Skip to avoid breaking package hashes
]

def should_skip(path):
    """Check if path should be skipped"""
    path_str = str(path)
    return any(skip in path_str for skip in SKIP_PATTERNS)

def process_file(file_path):
    """Process a single file"""
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()

        original_content = content

        # Apply all replacements
        for old, new in REPLACEMENTS:
            content = content.replace(old, new)

        # Only write if changes were made
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            return True, file_path

        return False, None

    except Exception as e:
        print(f"Error processing {file_path}: {e}", file=sys.stderr)
        return False, None

def main():
    """Main execution"""
    project_root = Path('/tmp/cc-agent/57925151/project')
    os.chdir(project_root)

    files_processed = []
    files_modified = []

    # Process files in specified directories
    for dir_name in INCLUDE_DIRS:
        dir_path = project_root / dir_name
        if not dir_path.exists():
            continue

        for file_path in dir_path.rglob('*'):
            if not file_path.is_file():
                continue

            if should_skip(file_path):
                continue

            if file_path.suffix not in INCLUDE_EXTENSIONS:
                continue

            files_processed.append(str(file_path.relative_to(project_root)))
            modified, path = process_file(file_path)

            if modified:
                files_modified.append(str(file_path.relative_to(project_root)))

    # Also process root level files
    for file_path in project_root.glob('*'):
        if file_path.is_file() and file_path.suffix in INCLUDE_EXTENSIONS:
            if not should_skip(file_path):
                files_processed.append(str(file_path.relative_to(project_root)))
                modified, path = process_file(file_path)

                if modified:
                    files_modified.append(str(file_path.relative_to(project_root)))

    print(f"✓ Processed {len(files_processed)} files")
    print(f"✓ Modified {len(files_modified)} files")
    print("\nModified files:")
    for f in sorted(files_modified):
        print(f"  - {f}")

    return 0

if __name__ == '__main__':
    sys.exit(main())
