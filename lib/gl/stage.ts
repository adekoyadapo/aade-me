import {
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  WebGLRenderer,
  Vector2,
  LinearFilter,
  LinearMipmapLinearFilter,
  DataTexture,
  RGBAFormat,
} from "three";
import { gsap } from "gsap";
import { expoInOut, slotLayout, type Slot } from "@/lib/stage";

/**
 * Home stage, WebGL layer (lazy chunk, home only). One renderer, one transparent canvas inside the hero behind the DOM caption.
 * Ten meshes, one per project, share one shader: a featured artwork (barrel-bowed in the vertex shader, rounded, grain) that morphs
 * into a bevelled glass tile (frame, inset artwork, rim light that follows the pointer, sheen, soft shadow). Slots, stepping and
 * input are owned by the DOM (lib/stage.ts, HeroStageControls); this only listens for "stage-change" on the hero.
 * The ground is not drawn here: flat --bg plus the site-wide CSS grain, same as every other page (no vignette, no second grain pass).
 * The DOM cards stay as the SEO/a11y layer and the fallback: they are hidden visually while data-gl is set.
 */

const VERT = /* glsl */ `
uniform vec2 uSize;
uniform float uMargin;
uniform float uBow;
varying vec2 vUv;
void main() {
  vUv = uv;
  vec2 full = uSize + 2.0 * uMargin;
  vec2 p = position.xy * full;
  float xn = p.x / (0.5 * full.x);
  p.y *= 1.0 + uBow * (1.0 - xn * xn);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 0.0, 1.0);
}`;

const FRAG = /* glsl */ `
precision highp float;
uniform sampler2D uTex;
uniform float uTexAspect, uTime, uGlass, uPad, uInnerR, uRad, uMargin, uShadow, uAlpha, uRipple, uGrain, uSeed, uSpec, uSheen, uLight, uReady;
uniform vec2 uSize, uLightDir, uShadowOff;
varying vec2 vUv;

float hash(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float sdBox(vec2 p, vec2 b, float r) { vec2 d = abs(p) - b + r; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r; }
vec3 toDisplay(vec3 c) { return pow(max(c, 0.0), vec3(1.0 / 2.2)); }

void main() {
  vec2 full = uSize + 2.0 * uMargin;
  vec2 p = (vUv - 0.5) * full;
  vec2 hs = uSize * 0.5;
  float d = sdBox(p, hs, uRad);
  float body = 1.0 - smoothstep(-0.75, 0.75, d);

  // Artwork: inset by uPad, cover-fit, ripple and a touch of chromatic split while it changes.
  vec2 innerSize = uSize - 2.0 * uPad;
  float di = sdBox(p, innerSize * 0.5, uInnerR);
  float artMask = 1.0 - smoothstep(-0.75, 0.75, di);
  vec2 q = p / innerSize;
  float ia = innerSize.x / innerSize.y;
  vec2 uv = q + 0.5;
  if (ia > uTexAspect) uv.y = (uv.y - 0.5) * (uTexAspect / ia) + 0.5;
  else uv.x = (uv.x - 0.5) * (ia / uTexAspect) + 0.5;
  vec2 rc = uv - 0.5;
  float rd = length(vec2(rc.x * ia, rc.y));
  float env = uRipple * (1.0 - uRipple) * 4.0;
  vec2 dir = rc / max(rd, 1e-4);
  vec2 off = dir * sin(rd * 34.0 - uRipple * 16.0) * 0.0065 * env;
  vec2 cuv = clamp(uv + off, 0.001, 0.999);
  vec3 art;
  art.r = texture2D(uTex, clamp(cuv + dir * 0.0028 * env, 0.001, 0.999)).r;
  art.g = texture2D(uTex, cuv).g;
  art.b = texture2D(uTex, clamp(cuv - dir * 0.0028 * env, 0.001, 0.999)).b;
  art = toDisplay(art);
  art = mix(vec3(0.07), art, uReady);
  art *= 1.0 - 0.28 * uGlass * smoothstep(0.25, 0.85, length(q) * 1.35);

  // Glass frame: the same dark diagonal gradient as the CSS tile.
  vec2 bn = p / uSize + 0.5;
  float t = (bn.x + 1.0 - bn.y) * 0.5;
  vec3 frame = t < 0.46 ? mix(vec3(0.204, 0.204, 0.227), vec3(0.055, 0.055, 0.063), t / 0.46) : mix(vec3(0.055, 0.055, 0.063), vec3(0.082, 0.082, 0.09), (t - 0.46) / 0.54);
  vec3 col = mix(frame, art, artMask);

  // Fine monochrome grain, stepped so it flickers slowly.
  float n = hash(floor(gl_FragCoord.xy) + floor(uTime * 9.0) * vec2(17.0, 31.0) + uSeed);
  col += (n - 0.5) * uGrain * 1.5 * mix(1.0, 0.8, uLight);

  // Rim and bevel: a bright 1px edge with the CSS gradient, boosted where the pointer-driven light faces the edge.
  vec2 e = vec2(0.75, 0.0);
  vec2 grad = vec2(sdBox(p + e.xy, hs, uRad) - sdBox(p - e.xy, hs, uRad), sdBox(p + e.yx, hs, uRad) - sdBox(p - e.yx, hs, uRad));
  vec2 nOut = normalize(grad + 1e-5);
  float lit = dot(nOut, uLightDir);
  float g = t < 0.32 ? mix(0.85, 0.16, t / 0.32) : t < 0.58 ? mix(0.16, 0.06, (t - 0.32) / 0.26) : mix(0.06, 0.5, (t - 0.58) / 0.42);
  float spec = pow(max(lit, 0.0), 3.0);
  float line = 1.0 - smoothstep(0.5, 1.5, abs(d + 0.9));
  float band = smoothstep(-3.6, -0.4, d) * (1.0 - smoothstep(-0.4, 0.6, d));
  float rim = line * (g * 0.95 + spec * uSpec * 0.9);
  col += vec3(rim + band * lit * 0.12) * uGlass;

  // Sheen: a soft diagonal streak that travels with the pointer, plus a faint top-down gloss.
  float st = dot(bn - 0.5, vec2(0.82, 0.57));
  float sh = exp(-pow((st - uSheen) / 0.15, 2.0)) * 0.12;
  col += vec3(sh + 0.03 * (1.0 - bn.y)) * uGlass * body;

  // Outside the body: depth shadow, then a faint light bloom hugging the rim.
  float ds = sdBox(p - uShadowOff, hs, uRad);
  float shadow = uShadow * (1.0 - smoothstep(-4.0, 17.0, ds));
  float glow = exp(-max(d, 0.0) / 5.0) * (g * 0.22 + spec * uSpec * 0.5) * 0.22 * uGlass;
  float outA = clamp(shadow + glow, 0.0, 1.0);
  vec3 outRGB = vec3(glow / max(shadow + glow, 1e-4));

  float aBody = body * uAlpha;
  float aOut = outA * (1.0 - body) * uAlpha;
  float a = aBody + aOut;
  if (a < 0.002) discard;
  gl_FragColor = vec4((col * aBody + outRGB * aOut) / a, a);
}`;

type St = {
  x: number; y: number; w: number; h: number; r: number; ry: number; bow: number; glass: number; pad: number; rad: number; margin: number;
  shadow: number; alpha: number; ripple: number;
};

const FEAT_BOW = 0.099; // matches the 9% taller middle of the CSS clip polygon
const TILE_MARGIN = 44;
const DUR = 1.05;

const targetFor = (s: Slot, light: boolean): St => ({
  x: s.x, y: s.y, w: s.w, h: s.h, r: s.r, ry: s.ry,
  bow: s.feat ? FEAT_BOW : 0,
  glass: s.feat ? 0 : 1,
  pad: s.feat ? 0 : 7,
  rad: s.feat ? 3 : 5,
  margin: s.feat ? 0 : TILE_MARGIN,
  shadow: s.feat ? 0 : light ? 0.38 : 0.55,
  alpha: s.a,
  ripple: 0,
});

function placeholder() {
  const t = new DataTexture(new Uint8Array([20, 20, 22, 255]), 1, 1, RGBAFormat);
  t.needsUpdate = true;
  return t;
}

export function mountStage(hero: HTMLElement): (() => void) | null {
  const field = hero.querySelector<HTMLElement>("[data-art]");
  const cards = [...hero.querySelectorAll<HTMLElement>("[data-card]")];
  if (!field || !cards.length) return null;
  const total = cards.length;

  const canvas = document.createElement("canvas");
  canvas.className = "gl-stage";
  canvas.setAttribute("aria-hidden", "true");
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: (window.devicePixelRatio || 1) < 1.5, powerPreference: "default" });
  } catch {
    return null;
  }
  if (!renderer.getContext()) return null;
  renderer.setClearColor(0x000000, 0);
  const dpr = () => Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr());

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 10, 6000);
  const geo = new PlaneGeometry(1, 1, 64, 24);
  const holder = placeholder();
  const isLight = () => document.documentElement.dataset.theme === "light";
  const lightV = { v: isLight() ? 1 : 0 };

  const mats: ShaderMaterial[] = [];
  const meshes: Mesh[] = [];
  const st: St[] = [];
  const tex: (Texture | null)[] = new Array(total).fill(null);
  const ready = new Array(total).fill(0);

  const srcOf = (c: HTMLElement) => {
    const img = c.querySelector("img");
    const raw = img?.currentSrc || img?.src || "";
    try {
      const u = new URL(raw, location.href);
      const orig = u.searchParams.get("url") ?? u.pathname;
      return orig;
    } catch {
      return raw;
    }
  };

  let W = 1;
  let H = 1;
  let index = Number(hero.dataset.index || 0) || 0;
  const slotOf = (i: number, idx = index) => (i - idx + total) % total;
  let slots = slotLayout(W, H);

  cards.forEach((c, i) => {
    const m = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uTex: { value: holder },
        uTexAspect: { value: 1400 / 900 },
        uSize: { value: new Vector2(100, 100) },
        uLightDir: { value: new Vector2(-0.7, 0.7) },
        uShadowOff: { value: new Vector2(0, -16) },
        uMargin: { value: 0 }, uBow: { value: 0 }, uGlass: { value: 1 }, uPad: { value: 7 }, uInnerR: { value: 2 }, uRad: { value: 5 },
        uShadow: { value: 0.5 }, uAlpha: { value: 1 }, uRipple: { value: 0 }, uGrain: { value: 0.1 }, uSeed: { value: i * 13.7 },
        uSpec: { value: 0 }, uSheen: { value: -0.6 }, uTime: { value: 0 }, uLight: { value: lightV.v }, uReady: { value: 0 },
      },
    });
    const mesh = new Mesh(geo, m);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);
    mats.push(m);
    meshes.push(mesh);
    st.push(targetFor(slots[slotOf(i)], isLight()));
  });

  // Textures: the featured and next artwork first, the rest one by one.
  const loader = new TextureLoader();
  const texW = innerWidth < 1024 ? 750 : 1080; // both are next/image deviceSizes
  let alive = true;
  const load = (i: number) =>
    new Promise<void>((res) => {
      if (tex[i] || !alive) return res();
      // Reuse the file the DOM image already fetched (HTTP cache, no second download); otherwise ask for the stage width.
      const di = cards[i].querySelector("img");
      const cached = di && di.complete && di.naturalWidth >= texW * 0.5 && /\/_next\/image/.test(di.currentSrc) ? di.currentSrc : "";
      const url = cached || `/_next/image?url=${encodeURIComponent(srcOf(cards[i]))}&w=${texW}&q=75`;
      loader.load(
        url,
        (t) => {
          if (!alive) {
            t.dispose();
            return res();
          }
          t.colorSpace = SRGBColorSpace;
          t.generateMipmaps = true;
          t.minFilter = LinearMipmapLinearFilter;
          t.magFilter = LinearFilter;
          t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
          tex[i] = t;
          const u = mats[i].uniforms;
          u.uTex.value = t;
          const im = t.image as { width: number; height: number };
          u.uTexAspect.value = im.width / im.height;
          gsap.to(ready, { [i]: 1, duration: 0.6, ease: "none" });
          res();
        },
        undefined,
        () => res(),
      );
    });
  const order = () => Array.from({ length: total }, (_, k) => (index + k) % total);
  const firstTwo = Promise.all([load(order()[0]), load(order()[1])]);
  const rest = firstTwo.then(async () => {
    for (const i of order()) {
      if (!alive) return;
      await load(i);
      await new Promise((r) => setTimeout(r, 120));
    }
  });
  void rest;

  // Size and layout.
  const measure = () => {
    const r = hero.getBoundingClientRect();
    W = Math.max(1, Math.round(r.width));
    H = Math.max(1, Math.round(r.height));
    renderer.setPixelRatio(dpr());
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.fov = (2 * Math.atan(H / 2 / 1400) * 180) / Math.PI;
    camera.position.set(0, 0, 1400);
    camera.updateProjectionMatrix();
    slots = slotLayout(W, H);
  };
  measure();
  let resizeFrame = 0;
  const ro = new ResizeObserver(() => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(() => {
      measure();
      if (!gsap.isTweening(st)) cards.forEach((_, i) => Object.assign(st[i], targetFor(slots[slotOf(i)], isLight())));
    });
  });
  ro.observe(hero);

  // Stepping: every mesh tweens to its next slot with the template's in-out expo feel.
  const ease = (t: number) => expoInOut(t);
  let lastInput = performance.now();
  const step = (next: number) => {
    lastInput = performance.now();
    const prev = index;
    index = next;
    const light = isLight();
    cards.forEach((_, i) => {
      const from = slotOf(i, prev);
      const to = slotOf(i);
      if (from === to) return;
      const tg = targetFor(slots[to], light);
      const delay = to === 0 ? 0 : 0.03 * Math.min(3, Math.abs(to - from));
      gsap.killTweensOf(st[i]);
      const { alpha, ripple, ...move } = tg;
      void ripple;
      gsap.to(st[i], { ...move, duration: DUR, delay, ease });
      gsap.to(st[i], { alpha, duration: alpha ? 0.5 : 0.45, delay: alpha ? 0.12 : 0, ease: "power1.out" });
      if (to === 0) gsap.fromTo(st[i], { ripple: 0 }, { ripple: 1, duration: 0.95, delay: 0.3, ease: "sine.inOut", onComplete: () => void (st[i].ripple = 0) });
    });
    void load(order()[1]);
    void load(order()[2]);
  };
  const onChange = (e: Event) => {
    const n = (e as CustomEvent<{ index: number }>).detail?.index;
    if (typeof n === "number" && n !== index) step(n);
  };
  hero.addEventListener("stage-change", onChange);

  // Pointer parallax, tilt and light. Eased every frame; absent on touch.
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const ptr = { x: 0, y: 0, px: 0, py: 0, ex: 0, ey: 0, presence: 0, ep: 0 };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const r = hero.getBoundingClientRect();
    ptr.px = e.clientX - r.left;
    ptr.py = e.clientY - r.top;
    ptr.x = (e.clientX / innerWidth - 0.5) * 2;
    ptr.y = (e.clientY / innerHeight - 0.5) * 2;
    ptr.presence = 1;
    lastInput = performance.now();
  };
  const onLeave = () => {
    ptr.x = 0;
    ptr.y = 0;
    ptr.presence = 0;
  };
  if (fine) {
    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
  }

  // Theme: tint and shadow strength follow data-theme.
  const mo = new MutationObserver(() => {
    const light = isLight();
    gsap.to(lightV, { v: light ? 1 : 0, duration: 0.4 });
    cards.forEach((_, i) => gsap.to(st[i], { shadow: targetFor(slots[slotOf(i)], light).shadow, duration: 0.4 }));
  });
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  // Render loop: only while the hero is on screen and the tab is visible.
  let onScreen = true;
  const io = new IntersectionObserver(([en]) => void (onScreen = en.isIntersecting));
  io.observe(hero);
  let raf = 0;
  let last = performance.now();
  let t = 0;
  let shown = false;
  const tmp = new Vector2();
  const frame = (now: number) => {
    raf = requestAnimationFrame(frame);
    if (!onScreen || document.hidden) {
      last = now;
      return;
    }
    // Idle (no pointer, no tween for 2 s): 30 fps is plenty for the slow float.
    if (now - lastInput > 2000 && now - last < 32 && !gsap.isTweening(st)) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    t += dt;
    const k = 1 - Math.exp(-dt * 6);
    ptr.ex += (ptr.x - ptr.ex) * k;
    ptr.ey += (ptr.y - ptr.ey) * k;
    ptr.ep += (ptr.presence - ptr.ep) * (1 - Math.exp(-dt * 4));

    for (let i = 0; i < total; i++) {
      const s = st[i];
      const m = meshes[i];
      const u = mats[i].uniforms;
      const slot = slots[slotOf(i)];
      const featish = s.glass < 0.5;
      m.visible = s.alpha > 0.003;
      if (!m.visible) continue;
      const fl = Math.sin(t * 0.45 + i * 1.1);
      const fy = featish ? fl * 2.5 : fl * 6 + 1;
      const fr = (featish ? 0.2 : 0.7) * Math.sin(t * 0.37 + i * 1.9);
      const sx = s.x + ptr.ex * slot.k;
      const sy = s.y + ptr.ey * slot.k * 0.7 + fy;
      m.position.set(sx - W / 2, H / 2 - sy, 0);
      const depth = slot.k / 12;
      m.rotation.set(ptr.ey * 0.05 * depth, ((s.ry + ptr.ex * 4.5 * depth) * Math.PI) / 180, (-(s.r + fr) * Math.PI) / 180);
      m.renderOrder = slot.z;
      u.uSize.value.set(s.w, s.h);
      u.uMargin.value = s.margin;
      u.uBow.value = s.bow;
      u.uGlass.value = s.glass;
      u.uPad.value = s.pad;
      u.uInnerR.value = Math.max(0, s.rad - s.pad * 0.5);
      u.uRad.value = s.rad;
      u.uShadow.value = s.shadow;
      u.uAlpha.value = s.alpha;
      u.uRipple.value = s.ripple;
      u.uGrain.value = 0.02 + 0.025 * (1 - s.glass);
      u.uTime.value = t;
      u.uLight.value = lightV.v;
      u.uReady.value = ready[i];
      // Light direction: top-left by default, drifting a little; toward the cursor when there is one.
      const rot = (-(s.r) * Math.PI) / 180;
      const vx = ptr.px - sx;
      const vy = -(ptr.py - (s.y + fy));
      const ca = Math.cos(-rot), sa = Math.sin(-rot);
      tmp.set(vx * ca - vy * sa, vx * sa + vy * ca);
      const dist = tmp.length();
      tmp.normalize();
      const drift = -0.78 + Math.sin(t * 0.3 + i) * 0.22;
      const dx = Math.cos(drift + 1.57), dy2 = Math.sin(drift + 1.57);
      const wgt = ptr.ep;
      u.uLightDir.value.set(dx * (1 - wgt) + tmp.x * wgt, dy2 * (1 - wgt) + tmp.y * wgt).normalize();
      u.uSpec.value = wgt * (1 - Math.min(1, dist / 1100)) * 1.2 + 0.15;
      const c2 = Math.cos(rot), s2 = Math.sin(rot);
      u.uShadowOff.value.set(-16 * s2, -16 * c2);
      u.uSheen.value = Math.max(-0.9, Math.min(0.9, (tmp.x * Math.min(1, dist / 500)) * 0.7 * wgt + Math.sin(t * 0.25 + i * 0.8) * 0.5 * (1 - wgt)));
    }
    renderer.render(scene, camera);

    // Go live once the first artwork is on the canvas: DOM cards hand over to the canvas.
    if (!shown && tex[order()[0]] && ready[order()[0]] > 0.05) {
      shown = true;
      hero.setAttribute("data-gl", "1");
    }
  };
  field.insertBefore(canvas, field.firstChild);
  raf = requestAnimationFrame(frame);

  const lost = (e: Event) => {
    e.preventDefault();
    dispose();
  };
  canvas.addEventListener("webglcontextlost", lost);

  function dispose() {
    if (!alive) return;
    alive = false;
    cancelAnimationFrame(raf);
    cancelAnimationFrame(resizeFrame);
    hero.removeAttribute("data-gl");
    hero.removeEventListener("stage-change", onChange);
    window.removeEventListener("pointermove", onMove);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    canvas.removeEventListener("webglcontextlost", lost);
    ro.disconnect();
    io.disconnect();
    mo.disconnect();
    gsap.killTweensOf(st);
    gsap.killTweensOf(ready);
    gsap.killTweensOf(lightV);
    mats.forEach((m) => m.dispose());
    geo.dispose();
    holder.dispose();
    tex.forEach((t) => t?.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }
  return dispose;
}
