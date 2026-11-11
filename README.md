# Second Brain

A small, responsive showcase for Sundowna’s Second Brain tools, inspired by the editorial typography and app lineup of GetArtCraft. Original layouts, artwork, and copy. Built as a static website with HTML, CSS, and a little JavaScript.

## Publish on GitHub Pages

In this repository’s **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source. The included **Deploy Second Brain to GitHub Pages** workflow publishes on pushes to `main`. If enabling Pages after the initial push, open **Actions → Deploy Second Brain to GitHub Pages → Run workflow**.

Expected URL after successful deployment: https://sundowna.github.io/sundowna/

If workflow creation is restricted by your GitHub connection, this is also a buildless site: in **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**, and save. No build tools are needed.

## What’s included

- Responsive app collection, connected app map, original CSS illustrations, and clear availability labels.
- Accessible native dialogs with setup instructions, keyboard support, and reduced-motion handling.
- Real project and release links, copyable collection and individual app links, with manual copy fallback.
- AI ChatBridge and OneNote Style: available desktop Obsidian plugins.
- Brain Capture: private Android proof of concept, no public download. Its preview is explicitly labeled as a concept.

## Edit

- `index.html`: page copy, app cards, FAQ, metadata.
- `styles.css`: layout, colors, responsive rules, original UI illustrations.
- `app.js`: app setup guides, project links, and sharing.
- `assets/favicon.svg`: site icon.

The Google Fonts stylesheet supplies Archivo and Instrument Serif. System fonts are used if the font service is unavailable. No analytics, build step, or application backend.

Open `index.html` in a browser for a quick local view. Clipboard sharing requires HTTPS or localhost; elsewhere, the manual-copy dialog appears.

The product previews are illustrative. This landing page does not run the plugins or access notes, AI accounts, or the microphone.
