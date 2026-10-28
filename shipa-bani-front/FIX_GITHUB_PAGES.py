#!/usr/bin/env python3
"""Remove oversized, non-site HTML files from the Git index (no worktree deletion).

Run from your actual Git repository folder: python FIX_GITHUB_PAGES.py
Then git add -A, commit, and push. Updating the PR/main branch is necessary
because GitHub Pages checks out the files that are already committed there.
"""
import os
import pathlib
import subprocess
import sys


def main():
    repo = subprocess.run(
        ['git', 'rev-parse', '--show-toplevel'], text=True, capture_output=True
    )
    if repo.returncode:
        print('ERROR: Run this script INSIDE your local Git repository, not an untracked ZIP folder.')
        return 2

    cwd = pathlib.Path(repo.stdout.strip())
    tracked = subprocess.check_output(['git', 'ls-files', '-z'], cwd=cwd).split(b'\0')
    bad = []
    for entry in tracked:
        if not entry:
            continue
        leaf = entry.split(b'/')[-1]
        is_upload = entry.startswith(b'uploads/') or b'/uploads/' in entry
        if is_upload and leaf.lower().endswith(b'.html') and len(leaf) > 255:
            bad.append(entry)

    for rawpath in bad:
        path = os.fsdecode(rawpath)
        subprocess.run(['git', 'update-index', '--force-remove', '--', path], cwd=cwd, check=True)
        print('Removed from Git index (not from your disk):', repr(path))

    gitignore = cwd / '.gitignore'
    rule = '**/uploads/*.html'
    old = gitignore.read_text(encoding='utf-8') if gitignore.exists() else ''
    if rule not in old.splitlines():
        gitignore.write_text(old.rstrip() + '\n' + rule + '\n', encoding='utf-8')
        print('Added .gitignore protection against uploads/*.html')

    if bad:
        print(f'OK: removed {len(bad)} invalid tracked HTML filename(s).')
    else:
        print('No oversized uploads/*.html files found in the Git index.')
        print('If GitHub still fails, verify that this is the same repository and branch.')
    print('Next: git add -A && git commit -m "fix(deploy): remove invalid filename blocking Pages checkout" && git push')
    return 0


if __name__ == '__main__':
    sys.exit(main())
