# Features

What this site does, one line per feature. Each line names the tests that prove it.
Run the tests with `npm install` once, then `npm run test:e2e` (uses the installed Edge or Chrome).
Sessions: read this before changing anything; never delete a line without the user's OK.

## Hero background (assets/vortex.js)
- F-001 The hero shows a moving 3D attractor (Rayleigh-Benard) behind the heading, with no page errors — `tests/e2e.mjs: F-001`
- F-002 A small label shows the camera shot number and name; `?shot=N` opens on shot N — `tests/e2e.mjs: F-002`
- F-003 The hero keeps moving: particles stream in from all sides and spiral in — `tests/e2e.mjs: F-003`
- F-004 With reduced motion turned on, the hero is one still frame and the shot label is hidden — `tests/e2e.mjs: F-004`
- F-005 The hero uses Attractor Studio's Spectrum colours (six hues) — `tests/e2e.mjs: F-005`
- F-006 Eight camera shots play in shuffled order, always opening on "Wide", with a short fade at each cut — untested
- F-007 The hero pauses while scrolled out of view or the tab is hidden — untested
- F-008 Moving the mouse tilts the view slightly — untested

## Rest of the page
- F-009 App cards and "Explore" buttons open a setup dialog for each app — untested
- F-010 Share buttons copy the site link, with a manual-copy dialog when copying isn't allowed — untested
- F-011 FAQ entries open and close — untested

## Removed
