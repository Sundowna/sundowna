// Second Brain Vortex: a living 3D attractor for a hero background.
// Usage: import { mountVortex } from "./assets/vortex.js";
//        mountVortex(element, { palette: ["#ff5d5d", "#ffb347", "#ffe66d", "#5ee0a0", "#5aa8ff", "#b67cff"], bg: "#11130f" });
// The element must be positioned (relative/absolute). Everything is drawn inside it,
// nothing captures scrolling, and rendering stops while the element is off screen.
// Attractor and look match Attractor Studio's "Rayleigh-Benard" with the Spectrum palette:
// particles are released anywhere in a big box, spiral in for 3-8 seconds, then get released again.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/+esm";
import { EffectComposer } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/EffectComposer.js/+esm";
import { RenderPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/RenderPass.js/+esm";
import { UnrealBloomPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/UnrealBloomPass.js/+esm";
import { OutputPass } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/postprocessing/OutputPass.js/+esm";

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const SHOTS = [
  { name: "Wide",              sec: 15, from: [V(1.75, .75, 1.6), V(0, 0, 0)],       to: [V(1.35, .55, 2.0), V(0, .05, 0)] },
  { name: "Into the vortex",   sec: 14, from: [V(.05, 3.1, .35), V(0, 0, 0)],        to: [V(.02, 2.3, .25), V(0, 0, 0)] },
  { name: "Along the spine",   sec: 16, from: [V(.55, -.35, .85), V(0, .5, 0)],      to: [V(.32, .35, .62), V(0, .9, 0)] },
  { name: "From below",        sec: 14, from: [V(1.7, -1.7, 1.1), V(0, .25, 0)],     to: [V(1.15, -1.45, 1.65), V(0, .3, 0)] },
  { name: "Close pass",        sec: 13, from: [V(-1.95, .25, -.45), V(0, 0, 0)],     to: [V(-1.55, .38, -1.15), V(0, 0, 0)] },
  { name: "Looking out",       sec: 12, from: [V(.08, .05, .12), V(1.6, .35, 1.4)],  to: [V(.12, .4, .18), V(1.3, .7, 1.7)] },
  { name: "Far orbit",         sec: 16, from: [V(.2, .6, 3.7), V(0, 0, 0)],          to: [V(-1.2, .75, 3.4), V(0, 0, 0)] },
  { name: "Through the rings", sec: 13, from: [V(1.5, .95, -.2), V(-.4, .55, .1)],   to: [V(1.05, .85, .25), V(-.6, .5, -.1)] },
];

/* Rayleigh-Benard attractor (Attractor Studio settings) */
const RB = { a: 9, r: 12, b: 5, dt: .005, box: [[-20, 20], [-20, 20], [-5, 35]] };
const f = (x, y, z) => [-RB.a * x + RB.a * y, RB.r * x - y - x * z, x * y - RB.b * z];
const rk4 = (s, h) => {
  const [x, y, z] = s;
  const k1 = f(x, y, z);
  const k2 = f(x + h / 2 * k1[0], y + h / 2 * k1[1], z + h / 2 * k1[2]);
  const k3 = f(x + h / 2 * k2[0], y + h / 2 * k2[1], z + h / 2 * k2[2]);
  const k4 = f(x + h * k3[0], y + h * k3[1], z + h * k3[2]);
  return [x + h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0]), y + h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1]), z + h / 6 * (k1[2] + 2 * k2[2] + 2 * k3[2] + k4[2])];
};
const randBox = () => RB.box.map(([lo, hi]) => lo + Math.random() * (hi - lo));
const SPS = 240, SUB = 4; // simulation steps per second at 1x; one trail point every 4 steps (60 per second)

// Centre, scale and step size, measured the same way Attractor Studio does it.
function prepare() {
  let s = randBox(), travel = 0, prev = s.slice();
  const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
  for (let i = 0; i < 24000; i++) {
    if (i % 400 === 0) { s = randBox(); prev = s.slice(); }
    s = rk4(s, RB.dt);
    travel += Math.hypot(s[0] - prev[0], s[1] - prev[1], s[2] - prev[2]); prev = s.slice();
    if (i % 6 === 0) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], s[k]); mx[k] = Math.max(mx[k], s[k]); }
  }
  const c = [0, 1, 2].map((k) => (mn[k] + mx[k]) / 2);
  const sc = 1.55 / Math.max(...[0, 1, 2].map((k) => (mx[k] - mn[k]) / 2));
  const perStep = travel / 24000 * sc;
  return { c, sc, h: RB.dt * Math.min(4, (0.55 / SPS) / perStep) };
}

export function mountVortex(host, opts = {}) {
  const o = {
    palette: ["#ff5d5d", "#ffb347", "#ffe66d", "#5ee0a0", "#5aa8ff", "#b67cff"],
    bg: "#11130f",
    offset: (w) => (w > 1100 ? -9 : w > 900 ? -5 : 0), // horizontal framing (film offset)
    label: true,
    particles: null,     // default: 500, or 300 on narrow screens
    trail: 160,          // trail length in points (60 per second)
    speed: .8,
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
  const cv = renderer.domElement;
  Object.assign(cv.style, { position: "absolute", inset: "0", width: "100%", height: "100%", display: "block", pointerEvents: "none" });
  cv.setAttribute("aria-hidden", "true");
  host.prepend(cv);
  cv.after(dip);
  if (labelEl) host.appendChild(labelEl);

  const scene = new THREE.Scene();
  // the bloom chain's clear colour comes out sRGB-encoded twice, so pre-compensate it
  renderer.setClearColor(new THREE.Color(o.bg).convertSRGBToLinear());
  scene.fog = new THREE.Fog(0x000000, 2.6, 9); // black fog: far lines fade out under additive blending
  const camera = new THREE.PerspectiveCamera(82, w / h, 1e-3, 100);
  const frame = () => { camera.aspect = w / h; camera.filmOffset = o.offset(w); camera.updateProjectionMatrix(); };
  frame();

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(w, h), .75, .35, .18);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* particles: each one is a fading trail with a small glowing head */
  const prep = prepare();
  const PAL = o.palette.map((c) => new THREE.Color(c));
  const N = o.particles || (w < 700 ? 300 : 500), L = o.trail;
  const total = N * L;
  const pos = new Float32Array(total * 3), col = new Float32Array(total * 3), idx = new Uint32Array(N * (L - 1) * 2);
  const headPos = new Float32Array(N * 3);
  const state = new Float64Array(N * 3), age = new Int32Array(N), life = new Int32Array(N), born = new Float32Array(N);
  const glow = Math.min(.55, 110 / N);  // keep the total light about the same whatever the particle count
  let k = 0;
  for (let i = 0; i < N; i++) {
    const c = PAL[i % PAL.length];
    born[i] = reduce || ff ? 0 : .3 + (i / N) * 4.5 + Math.random() * .6;
    for (let s = 0; s < L; s++) {
      const v = i * L + s, fade = Math.pow(1 - s / L, 1.8) * glow;
      col[v * 3] = c.r * fade; col[v * 3 + 1] = c.g * fade; col[v * 3 + 2] = c.b * fade;
      if (s < L - 1) { idx[k++] = v; idx[k++] = v + 1; }
    }
  }
  const baseCol = col.slice();
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage);
  const colAttr = new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute("position", posAttr);
  geo.setAttribute("color", colAttr);
  geo.setIndex(new THREE.BufferAttribute(idx, 1));
  const lines = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ vertexColors: true, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, fog: true }));
  lines.frustumCulled = false;
  const hgeo = new THREE.BufferGeometry();
  const headAttr = new THREE.BufferAttribute(headPos, 3).setUsage(THREE.DynamicDrawUsage);
  hgeo.setAttribute("position", headAttr);
  const headMat = new THREE.PointsMaterial({ color: PAL[1 % PAL.length], size: 2.2, sizeAttenuation: false, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, fog: true });
  const heads = new THREE.Points(hgeo, headMat);
  heads.frustumCulled = false;
  const holder = new THREE.Group();
  holder.add(lines, heads);
  scene.add(holder);

  // attractor coordinates -> scene coordinates (the attractor's z axis stands upright)
  const norm = (x, y, z, out, at) => {
    out[at] = (x - prep.c[0]) * prep.sc;
    out[at + 1] = (z - prep.c[2]) * prep.sc;
    out[at + 2] = (y - prep.c[1]) * prep.sc;
  };
  const nv = [0, 0, 0];
  const release = (i) => {
    const p = randBox();
    state[i * 3] = p[0]; state[i * 3 + 1] = p[1]; state[i * 3 + 2] = p[2];
    age[i] = 0; life[i] = (SPS * (3 + Math.random() * 5)) | 0;
    norm(p[0], p[1], p[2], nv, 0);
    for (let s = 0; s < L; s++) { const v = (i * L + s) * 3; pos[v] = nv[0]; pos[v + 1] = nv[1]; pos[v + 2] = nv[2]; }
  };
  const h0 = prep.h * o.speed;
  const tick = () => { // one trail point: SUB simulation steps
    for (let i = 0; i < N; i++) {
      let s = [state[i * 3], state[i * 3 + 1], state[i * 3 + 2]], again = false;
      for (let n = 0; n < SUB; n++) {
        s = rk4(s, h0);
        if (++age[i] > life[i]) { again = true; break; }
      }
      if (again || !s.every(Number.isFinite)) { release(i); continue; }
      norm(s[0], s[1], s[2], nv, 0);
      if (Math.abs(nv[0]) > 8 || Math.abs(nv[1]) > 8 || Math.abs(nv[2]) > 8) { release(i); continue; }
      state[i * 3] = s[0]; state[i * 3 + 1] = s[1]; state[i * 3 + 2] = s[2];
      const b = i * L * 3;
      pos.copyWithin(b + 3, b, b + (L - 1) * 3);
      pos[b] = nv[0]; pos[b + 1] = nv[1]; pos[b + 2] = nv[2];
    }
    for (let i = 0; i < N; i++) { const b = i * L * 3; headPos[i * 3] = pos[b]; headPos[i * 3 + 1] = pos[b + 1]; headPos[i * 3 + 2] = pos[b + 2]; }
    posAttr.needsUpdate = true; headAttr.needsUpdate = true;
  };
  for (let i = 0; i < N; i++) { release(i); age[i] = (Math.random() * life[i]) | 0; } // stagger the release times
  for (let n = 0; n < (reduce || ff ? L + 40 : 30); n++) tick();

  let introDone = reduce || ff;
  if (introDone) headMat.opacity = .35;
  const intro = (t) => {
    if (introDone) return;
    let all = true;
    for (let i = 0; i < N; i++) {
      const p = Math.min(1, Math.max(0, (t - born[i]) / 1.4)), e = p * p * (3 - 2 * p);
      if (p < 1) all = false;
      for (let s = 0; s < L; s++) { const v = (i * L + s) * 3; col[v] = baseCol[v] * e; col[v + 1] = baseCol[v + 1] * e; col[v + 2] = baseCol[v + 2] * e; }
    }
    headMat.opacity = .35 * Math.min(1, t / 5.5);
    colAttr.needsUpdate = true;
    if (all) { introDone = true; headMat.opacity = .35; }
  };
  if (!introDone) intro(0);

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
      t += dt;
      acc += dt; let n = 0;
      while (acc >= 1 / 60 && n < 4) { tick(); acc -= 1 / 60; n++; }
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
