SHIPÁ | FAQ ANIMATION AND TYPOGRAPHY | 26.10.2026

Baseline: SHIPA_front_NO_GRAY_BARS_2026-10-26.zip

Changes:
- Removed typographic em dash from user-facing text of the active site and RU/KZ dictionaries.
  Textual punctuation uses a normal hyphen with spaces. Numeric ranges retain an en dash.
- Added smooth FAQ open/close animations (320 ms) to all FAQ accordions.
- Kept answers mounted for close animation; rotated + icon is preserved.
- Respects prefers-reduced-motion and exposes aria-expanded/aria-hidden.
- Updated the legacy export page as well.

Files to replace: all six paths listed in this archive (relative to shipa-bani-front/).
Existing Google Analytics / Meta Pixel and carousel navigation are unchanged.

QA:
- JavaScript syntax checked with Node 22 for the modified app scripts.
- Both inline app scripts checked with Node 22.
- Standalone accordion CSS animation tested with Chromium.
- The full site could not be opened in Chromium due to local browser navigation policy.

After deployment: hard refresh (Ctrl+Shift+R), test opening and closing FAQ in RU and KZ.
