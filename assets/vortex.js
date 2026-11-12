// Second Brain Vortex: a living 3D attractor for a hero background.
// Usage: import { mountVortex } from "./assets/vortex.js";
//        mountVortex(element, { palette: ["#d0ec88", "#c5b3f0", "#f2b587"], bg: "#11130f" });
// The element must be positioned (relative/absolute). Everything is drawn inside it,
// nothing captures scrolling, and rendering stops while the element is off screen.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/+esm";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js/+esm";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js/+esm";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js/+esm";
import { OutputPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/OutputPass.js/+esm";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SHOTS = [
  { name: "Wide",              sec: 15, from: [V(2.7, 1.1, 2.5), V(0, 0, 0)],        to: [V(2.2, .8, 3.0), V(0, .05, 0)] },
  { name: "Into the vortex",   sec: 14, from: [V(.05, 3.1, .35), V(0, 0, 0)],        to: [V(.02, 2.3, .25), V(0, 0, 0)] },
  { name: "Along the spine",   sec: 16, from: [V(.55, -.35, .85), V(0, .5, 0)],      to: [V(.32, .35, .62), V(0, .9, 0)] },
  { name: "From below",        sec: 14, from: [V(1.7, -1.7, 1.1), V(0, .25, 0)],     to: [V(1.15, -1.45, 1.65), V(0, .3, 0)] },
  { name: "Close pass",        sec: 13, from: [V(-1.95, .25, -.45), V(0, 0, 0)],     to: [V(-1.55, .38, -1.15), V(0, 0, 0)] },
  { name: "Looking out",       sec: 12, from: [V(.08, .05, .12), V(1.6, .35, 1.4)],  to: [V(.12, .4, .18), V(1.3, .7, 1.7)] },
  { name: "Far orbit",         sec: 16, from: [V(.2, .6, 3.7), V(0, 0, 0)],          to: [V(-1.2, .75, 3.4), V(0, 0, 0)] },
  { name: "Through the rings", sec: 13, from: [V(1.5, .95, -.2), V(-.4, .55, .1)],   to: [V(1.05, .85, .25), V(-.6, .5, -.1)] },
];

export function mountVortex(host, opts = {}) {
  const o = {
    palette: ["#d0ec88", "#c5b3f0", "#f2b587"],
    bg: "#11130f",
    offset: (w) => (w > 1100 ? -9 : w > 900 ? -5 : 0), // horizontal framing (film offset)
    label: true,
    ...opts,
  };
  const Q = new URLSearchParams(location.search);
  const ff = Q.has("ff");                               // test mode: fixed step, no entrance
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const probe = document.createElement("canvas");
  if (!(probe.getContext("webgl2") || probe.getContext("webgl"))) { host.classList.add("vortex-fallback"); return null; }

  /* layers */
  const dip = document.createElement("div");
  dip.className = "vortex-dip";
  Object.assign(dip.style, { position: "absolute", inset: "0", background: o.bg, opacity: "1", pointerEvents: "none", transition: ff ? "none" : "opacity .7s ease" });
  let labelEl = null, nameEl = null, numEl = null, barEl = null;
  if (o.label) {
    labelEl = document.createElement("div");
    labelEl.className = "vortex-shot";
    labelEl.setAttribute("aria-hidden", "true");
    labelEl.innerHTML = '<span class="vortex-shot-num"></span> / <b class="vortex-shot-name"></b><span class="vortex-shot-bar"><i></i></span>';
    numEl = labelEl.querySelector(".vortex-shot-num"); nameEl = labelEl.querySelector(".vortex-shot-name"); barEl = labelEl.querySelector("i");
  }

  /* renderer */
  const size = () => ({ w: Math.max(1, host.clientWidth), h: Math.max(1, host.clientHeight) });
  let { w, h } = size();
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(w, h);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  const cv = renderer.domElement;
  Object.assign(cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block", pointerEvents: "none" });
  cv.setAttribute("aria-hidden", "true");
  host.prepend(cv);
  cv.after(dip);
  if (labelEl) host.appendChild(labelEl);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(o.bg);
  scene.fog = new THREE.Fog(0x000000, 1.4, 6.5); // black fog: far lines fade out under additive blending
  const camera = new THREE.PerspectiveCamera(82, w / h, 1e-3, 100);
  const frame = () => { camera.aspect = w / h; camera.filmOffset = o.offset(w); camera.updateProjectionMatrix(); };
  frame();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.7, 0.35, 0.02);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* Aizawa attractor; parameters drift slowly so the shape keeps breathing */
  const P = { a: .95, b: .7, c: .6, d: 3.5, e: .25, f: .1 };
  const drift = (t) => {
    P.a = .95 + .012 * Math.sin(t * .041);
    P.b = .70 + .035 * Math.sin(t * .023 + 1.3);
    P.d = 3.5 + .18 * Math.sin(t * .031 + .4);
    P.e = .25 + .05 * Math.sin(t * .019 + 2.1);
    P.f = .10 + .03 * Math.sin(t * .027 + .7);
  };
  const next = (x, y, z, dt) => {
    const { a, b, c, d, e, f } = P;
    return [
      x + dt * ((z - b) * x - d * y),
      y + dt * (d * x + (z - b) * y),
      z + dt * (c + a * z - z * z * z / 3 - (x * x + y * y) * (1 + e * z) + f * z * x * x * x),
    ];
  };

  const PAL = o.palette.map((c) => new THREE.Color(c));
  const N = w < 700 ? 110 : 170;
  const trails = [];
  let total = 0;
  for (let i = 0; i < N; i++) { const len = 150 + Math.floor(Math.random() * 190); trails.push({ len, start: total }); total += len; }
  const pos = new Float32Array(total * 3), col = new Float32Array(total * 3), idx = new Uint32Array((total - N) * 2);
  const white = new THREE.Color(1, 1, 1), tmp = new THREE.Color();
  let k = 0;
  trails.forEach((tr, i) => {
    const g = i % PAL.length;
    tr.speed = .8 + Math.random() * .4;
    tr.born = reduce || ff ? 0 : .3 + (i / N) * 4.5 + Math.random() * .6;
    const base = PAL[g].clone().lerp(PAL[(g + 1) % PAL.length], Math.random() * .18);
    const gain = .22 + Math.random() * .3;
    for (let s = 0; s < tr.len; s++) {
      const v = tr.start + s, fade = Math.pow(1 - s / (tr.len - 1), 2.2);
      tmp.copy(base).lerp(white, s < 5 ? .25 * (1 - s / 5) : 0).multiplyScalar(fade * gain);
      col[v * 3] = tmp.r; col[v * 3 + 1] = tmp.g; col[v * 3 + 2] = tmp.b;
      if (s < tr.len - 1) { idx[k++] = v; idx[k++] = v + 1; }
    }
  });
  const baseCol = col.slice();
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const colAttr = new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", posAttr);
  geo.setAttribute("color", colAttr);
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: true }));
  lines.frustumCulled = false;
  lines.rotation.x = -Math.PI / 2;   // Aizawa's axis is z: stand the spine upright
  lines.position.y = -.75;
  const holder = new THREE.Group();
  holder.add(lines);
  scene.add(holder);

  const seed = (tr) => {
    let x = Math.random() - .5, y = Math.random() - .5, z = Math.random() - .5;
    const warm = 300 + Math.floor(Math.random() * 1500);
    for (let n = 0; n < warm; n++) [x, y, z] = next(x, y, z, .01);
    for (let s = 0; s < tr.len; s++) { const v = (tr.start + s) * 3; pos[v] = x; pos[v + 1] = y; pos[v + 2] = z; }
  };
  const step = (dt) => {
    for (const tr of trails) {
      const b = tr.start * 3;
      const [x, y, z] = next(pos[b], pos[b + 1], pos[b + 2], dt * tr.speed);
      if (!Number.isFinite(x) || x * x + y * y + z * z > 20) { seed(tr); continue; }
      pos.copyWithin(b + 3, b, b + (tr.len - 1) * 3);
      pos[b] = x; pos[b + 1] = y; pos[b + 2] = z;
    }
    posAttr.needsUpdate = true;
  };
  trails.forEach(seed);
  if (reduce || ff) for (let n = 0; n < 400; n++) step(.01);

  let introDone = reduce || ff;
  const intro = (t) => {
    if (introDone) return;
    let all = true;
    for (const tr of trails) {
      const p = Math.min(1, Math.max(0, (t - tr.born) / 1.4)), e = p * p * (3 - 2 * p);
      if (p < 1) all = false;
      for (let s = 0; s < tr.len; s++) { const v = (tr.start + s) * 3; col[v] = baseCol[v] * e; col[v + 1] = baseCol[v + 1] * e; col[v + 2] = baseCol[v + 2] * e; }
    }
    colAttr.needsUpdate = true;
    if (all) introDone = true;
  };

  /* camera shots, shuffled, always opening on the wide shot */
  const first = Q.has("shot") ? Math.max(0, Math.min(SHOTS.length - 1, +Q.get("shot") - 1)) : 0;
  let order = [first, ...[...SHOTS.keys()].filter((i) => i !== first).sort(() => Math.random() - .5)];
  const shuffle = (avoid) => {
    for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    if (order[0] === avoid) [order[0], order[1]] = [order[1], order[0]];
  };
  let shotIdx = 0, shotT = Q.has("at") ? +Q.get("at") : 0;
  const label = () => {
    if (!labelEl) return;
    numEl.textContent = "Shot " + String(order[shotIdx] + 1).padStart(2, "0");
    nameEl.textContent = SHOTS[order[shotIdx]].name;
  };
  label();
  const ease = (t) => .5 - .5 * Math.cos(Math.PI * t);
  const camPos = V(0, 0, 0), camLook = V(0, 0, 0);
  const shoot = (dt) => {
    shotT += dt / SHOTS[order[shotIdx]].sec;
    if (shotT >= 1) {
      shotT = 0; const prev = order[shotIdx];
      shotIdx = (shotIdx + 1) % order.length;
      if (shotIdx === 0) shuffle(prev);
      label();
    }
    const s = SHOTS[order[shotIdx]], e = ease(shotT);
    camPos.lerpVectors(s.from[0], s.to[0], e);
    camLook.lerpVectors(s.from[1], s.to[1], e);
    const edge = Math.min(shotT, 1 - shotT) * s.sec;              // dip to background around each cut
    dip.style.opacity = ff ? "0" : edge < .5 ? String(1 - edge / .5) : "0";
    if (barEl) barEl.style.width = (shotT * 100).toFixed(1) + "%";
  };

  /* gentle mouse parallax (never blocks scrolling or clicks) */
  const par = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener("pointermove", (e) => { par.tx = e.clientX / innerWidth - .5; par.ty = e.clientY / innerHeight - .5; }, { passive: true });

  /* run only while visible */
  let visible = true, paused = false, t = 0, last = performance.now(), acc = 0, raf = 0;
  const render = () => {
    camera.position.copy(camPos).add(V(par.x * .18, -par.y * .12, 0));
    camera.lookAt(camLook);
    composer.render();
  };
  const loop = (now) => {
    raf = 0;
    const dt = ff ? 1 / 60 : Math.min(.1, (now - last) / 1000); last = now;
    if (!paused) {
      t += dt; drift(t);
      acc += dt; let n = 0;
      while (acc >= 1 / 60 && n < 4) { step(.0105); acc -= 1 / 60; n++; }
      intro(t); shoot(dt);
      holder.rotation.y += dt * .025;
    }
    par.x += (par.tx - par.x) * .04; par.y += (par.ty - par.y) * .04;
    render();
    if (visible && !document.hidden) raf = requestAnimationFrame(loop);
  };
  const wake = () => { if (!raf && visible && !document.hidden && !reduce) { last = performance.now(); raf = requestAnimationFrame(loop); } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; wake(); }).observe(host);
  document.addEventListener("visibilitychange", wake);
  new ResizeObserver(() => {
    ({ w, h } = size());
    renderer.setSize(w, h); composer.setSize(w, h); frame();
    if (reduce) render();
  }).observe(host);

  if (reduce) {
    const s = SHOTS[0]; camPos.copy(s.from[0]); camLook.copy(s.from[1]); dip.style.opacity = "0";
    if (labelEl) labelEl.hidden = true;
    render();
  } else wake();

  return {
    get paused() { return paused; },
    setPaused(p) { paused = p; },
  };
}
