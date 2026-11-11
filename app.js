'use strict';

const apps = {
  chat: {
    anchor: 'chatbridge',
    html: `<span class="eyebrow"><span class="status-dot"></span> 01 / KEEP THE CONVERSATION</span>
      <h2 id="dialog-title">Good chats.<br><em>Kept close.</em></h2>
      <p class="dialog-lead">AI ChatBridge brings your Claude, ChatGPT, Gemini, Google AI Studio, and Proton Lumo conversations into Obsidian. Readable notes, right alongside the rest of your thinking.</p>
      <div class="dialog-pills"><span>Obsidian 1.11.4+</span><span>Windows · macOS · Linux</span><span>Free · open source</span></div>
      <h3>Get started on your computer</h3>
      <ol><li><strong>Have Obsidian ready.</strong> Open the vault (your notes folder) where you want your conversations to live.</li>
      <li><strong>Download the three plugin files</strong> from the release page: <code>main.js</code>, <code>manifest.json</code>, and <code>styles.css</code>.</li>
      <li><strong>Put them in your vault</strong> in <code>.obsidian/plugins/ai-chatbridge/</code>. Create that folder if it doesn’t exist. The <code>.obsidian</code> folder may be hidden in your file manager.</li>
      <li><strong>Reload Obsidian.</strong> Go to Settings → Community plugins, enable community plugins if prompted, and enable AI ChatBridge.</li>
      <li><strong>Connect and sync.</strong> Open Settings → AI ChatBridge, choose a provider, log in, and select Sync now. The first run imports up to three chats so you can check everything looks right.</li></ol>
      <div class="dialog-actions"><a class="button button-lime" href="https://github.com/Sundowna/obsidian-ai-chatbridge/releases/latest" target="_blank" rel="noopener noreferrer">Get the latest release <span aria-hidden="true">↗</span></a><a href="https://github.com/Sundowna/obsidian-ai-chatbridge#installation" target="_blank" rel="noopener noreferrer">Full setup guide ↗</a></div>
      <p class="dialog-note">Desktop only. You’ll need your own AI provider accounts. The plugin reads your conversations without changing them on the provider’s side. Provider support can change; see the project’s guide for current details.</p>`
  },
  notes: {
    anchor: 'onenote',
    html: `<span class="eyebrow"><span class="status-dot"></span> 02 / MAKE YOURSELF AT HOME</span>
      <h2 id="dialog-title">New possibilities.<br><em>Familiar feeling.</em></h2>
      <p class="dialog-lead">OneNote Style gives Obsidian a familiar notebook layout: colorful section tabs, a page list, and a ribbon with the tools you know. Your notes stay plain Markdown.</p>
      <div class="dialog-pills"><span>Obsidian plugin</span><span>Desktop only</span><span>Free · open source</span></div>
      <h3>Make your notes feel like home</h3>
      <ol><li><strong>Open your Obsidian vault.</strong> Your top-level folders become notebooks; folders inside them become sections.</li>
      <li><strong>Get the plugin files.</strong> On the project page, open <code>main.js</code>, <code>manifest.json</code>, and <code>styles.css</code>. For each one, use GitHub’s “Download raw file” button.</li>
      <li><strong>Add them to your vault</strong> in <code>.obsidian/plugins/onenote-style/</code>. Create the folder if needed. You may need to show hidden folders to see <code>.obsidian</code>.</li>
      <li><strong>Reload Obsidian.</strong> In Settings → Community plugins, enable community plugins if prompted, then enable OneNote Style. Your Notebooks and Pages panes will open.</li>
      <li><strong>Keep your page titles visible.</strong> In Settings → Appearance, leave “Show inline title” on to see the page date beneath each title.</li></ol>
      <div class="dialog-actions"><a class="button button-lime" href="https://github.com/Sundowna/obsidian-onenote-style" target="_blank" rel="noopener noreferrer">Get OneNote Style <span aria-hidden="true">↗</span></a><a href="https://github.com/Sundowna/obsidian-onenote-style#install" target="_blank" rel="noopener noreferrer">Full setup guide ↗</a></div>
      <p class="dialog-note">Want just the look? There’s also a <a href="https://github.com/Sundowna/obsidian-onenote-theme" target="_blank" rel="noopener noreferrer">OneNote Style theme</a>. The plugin doesn’t import OneNote files or add ink drawing. Free-form pages use Obsidian Canvas.</p>`
  },
  voice: {
    anchor: 'capture',
    html: `<span class="eyebrow">03 / CATCH THE PASSING THOUGHT</span>
      <h2 id="dialog-title">Before the idea<br><em>gets away.</em></h2>
      <p class="dialog-lead">Brain Capture is an early Android app for bringing voice notes, links, text, and files into your Obsidian inbox. It’s built around capturing first, then turning speech into text on your phone.</p>
      <div class="dialog-pills"><span>Android</span><span>Private prototype</span><span>No public download yet</span></div>
      <h3>Still in the workshop</h3>
      <p class="dialog-lead">The project is currently a proof of concept. Its approach is offline first: save audio, transcribe on the device, and write Markdown notes and attachments directly into your vault.</p>
      <p class="dialog-note">The preview on this page is a concept illustration, not a live recording interface or a screenshot of the app. Brain Capture isn’t available for friends to install yet. You can share this overview while it takes shape.</p>
      <div class="dialog-actions"><button class="button button-lime" data-share-app="voice">Share Brain Capture <span aria-hidden="true">↗</span></button><a href="https://github.com/Sundowna/android-capture" target="_blank" rel="noopener noreferrer">Repository (access required) ↗</a></div>`
  }
};
const dialog = document.querySelector('#app-dialog');
const content = document.querySelector('#dialog-content');
const shareDialog = document.querySelector('#share-dialog');
const shareInput = document.querySelector('#share-url');
const toast = document.querySelector('#toast');
let toastTimer;
let lastTrigger;

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3200);
}
function openApp(key, trigger) {
  const app = apps[key];
  if (!app) return;
  lastTrigger = trigger;
  content.innerHTML = app.html + (key !== 'voice' ? `<button class="dialog-share" data-share-app="${key}">Copy a link to this app ↗</button>` : '');
  dialog.showModal();
  dialog.scrollTop = 0;
}
async function share(anchor = '') {
  const url = new URL(window.location.href);
  url.hash = anchor;
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(url.href);
    showToast(anchor ? 'App link copied. Pass it on.' : 'Collection link copied. Pass it on.');
  } catch {
    if (dialog.open) dialog.close();
    shareInput.value = url.href;
    shareDialog.showModal();
    shareInput.focus();
    shareInput.select();
  }
}
document.addEventListener('click', (event) => {
  const opener = event.target.closest('[data-open]');
  if (opener) openApp(opener.dataset.open, opener);
  const sharer = event.target.closest('[data-share]');
  if (sharer) share();
  const appSharer = event.target.closest('[data-share-app]');
  if (appSharer) share(apps[appSharer.dataset.shareApp].anchor);
  const closer = event.target.closest('.dialog-close');
  if (closer) closer.closest('dialog').close();
});
for (const modal of [dialog, shareDialog]) {
  modal.addEventListener('click', (event) => {
    const bounds = modal.getBoundingClientRect();
    if (event.target === modal && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) modal.close();
  });
}
dialog.addEventListener('close', () => {
  if (lastTrigger?.isConnected) lastTrigger.focus({preventScroll: true});
});
document.querySelector('#copy-share-url').addEventListener('click', async () => {
  try {
    if (!navigator.clipboard || !window.isSecureContext) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(shareInput.value);
    shareDialog.close();
    showToast('Link copied. Pass it on.');
  } catch {
    shareInput.focus();
    shareInput.select();
    showToast('Link selected. Use your device’s Copy command.');
  }
});

// Native SVG motion carries input tokens through app synapses to Second Brain.
(() => {
  const stage = document.querySelector('.neural-stage');
  if (!stage) return;
  const toggle = stage.querySelector('.neural-toggle');
  const maps = [...stage.querySelectorAll('.neural-map')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileLayout = window.matchMedia('(max-width: 640px)');
  let paused = false;
  let visible = true;
  function update() {
    const reduced = reducedMotion.matches;
    const stopped = paused || reduced || !visible || document.hidden;
    stage.classList.toggle('signals-paused', stopped);
    stage.classList.toggle('signals-reduced', reduced);
    toggle.hidden = false;
    toggle.disabled = reduced;
    toggle.setAttribute('aria-pressed', String(paused));
    toggle.innerHTML = reduced ? 'Motion reduced' : paused ? 'Resume signals <span aria-hidden="true">▷</span>' : 'Pause signals <span aria-hidden="true">Ⅱ</span>';
    for (const map of maps) {
      const activeLayout = map.classList.contains(mobileLayout.matches ? 'neural-tall' : 'neural-wide');
      if (stopped || !activeLayout) {
        if (typeof map.pauseAnimations === 'function') map.pauseAnimations();
      } else if (typeof map.unpauseAnimations === 'function') map.unpauseAnimations();
    }
  }
  toggle.addEventListener('click', () => { paused = !paused; update(); });
  reducedMotion.addEventListener('change', update);
  mobileLayout.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  if ('IntersectionObserver' in window) new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(stage);
  update();
})();
