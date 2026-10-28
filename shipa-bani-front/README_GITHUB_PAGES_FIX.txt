GITHUB PAGES CHECKOUT FIX / SHIPÁ
=================================
CAUSE
GitHub Actions failed at `Checkout`: one HTML file under `uploads/` has a 319-BYTE basename, exceeding the filesystem limit of 255 bytes. The file is unrelated to the published website and is excluded from this archive.

WHAT WAS CHANGED
- Removed only the offending HTML file from uploads/.
- Added .gitignore to prevent similar HTML files being re-added.
- Added .nojekyll for publishing this static site from a branch.
- Added FIX_GITHUB_PAGES.py to remove the already tracked bad file from your existing local Git repository.
- All web pages, other uploads, scripts, animations, RU/KZ translations, booking and Kaspi behavior are left unchanged.

IMPORTANT: If you just upload this ZIP somewhere, the OLD bad file may remain tracked in your Git repository. You must remove it in a Git commit.

HOW TO FIX THE EXISTING REPO
1) Open a terminal in your Git repo (the folder that contains .git).
2) Put FIX_GITHUB_PAGES.py into the repo root (or execute it from this archive using a relative path while your working directory is the repo root).
3) Run:
   python FIX_GITHUB_PAGES.py
   git add -A
   git commit -m "fix(deploy): remove invalid filename blocking Pages checkout"
   git push
4) If pushing to a feature branch, merge it to main to repair GitHub Pages' default main checkout.

Local site run: START_WINDOWS.bat or START_MAC.command.
