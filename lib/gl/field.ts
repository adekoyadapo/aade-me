/**
 * Page ground: one fixed full-viewport raw-WebGL quad that draws a monochrome 45 degree halftone dot lattice (the template's
 * "paper print screen", made visible) and lets the pointer light it. See plans/revamp/BACKGROUND-RESEARCH.md ("Second pass").
 *
 * - The canvas is transparent: it only paints ink-coloured dots with alpha over the flat CSS --bg, so theme switches need a uniform
 *   change, never a different base colour.
 * - Glisten: the pointer leaves a decaying wake (about 0.6 to 0.9 s, longer when faster). Lattice cells near it switch on against
 *   per-cell thresholds and swell, a few twinkle as sparkles, and a wide soft sheen follows the cursor with inertia. A faint light
 *   band drifts diagonally across the page about every 12 s. A click sends a ring through the lattice.
 * - One rAF loop. It runs only while something moves and sleeps after the last frame (draw once, stop). Hidden tabs pause.
 *   Reduced motion, Save-Data and coarse pointers get the static pattern drawn once.
 * Loaded after first paint from components/bg-field.tsx; it is a separate chunk.
 */

const MAX_PTS = 32;
const MAX_RINGS = 3;
const CELL = 16; // css px between neighbouring dots
const PARALLAX = 0.05;

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uScale;
uniform float uTime;
uniform vec3 uInk;
uniform vec3 uA;        // x base dot alpha, y wake dot alpha, z sparkle alpha
uniform float uScroll;
uniform vec2 uView;
uniform float uCount;
uniform vec4 uPts[${MAX_PTS}];   // x, y (css px, y down), amp, 1 / radius^2
uniform vec3 uSheen;             // x, y, strength
uniform vec4 uRing[${MAX_RINGS}]; // x, y, radius, amp
uniform float uBand;             // ambient band centre, 0..1 across the diagonal (< 0 = off)

float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vnoise(vec2 p){
  vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}

void main(){
  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uScale;
  vec2 sp=p+vec2(0.,uScroll);
  mat2 R=mat2(0.7071,0.7071,-0.7071,0.7071);
  vec2 hp=R*sp/${CELL.toFixed(1)};
  vec2 cid=floor(hp);
  vec2 cf=fract(hp)-0.5;
  float d=length(cf);
  float aa=1.0/${CELL.toFixed(1)};

  // Centre of this lattice cell in viewport css px: wake energy is sampled here so a whole dot lights, not a gradient across it.
  vec2 cpx=((cid+0.5)*${CELL.toFixed(1)})*R-vec2(0.,uScroll);

  // Breathing: low-frequency noise sets each dot's size and strength, drifting slowly.
  float n1=vnoise(cid*0.085+vec2(uTime*0.045,-uTime*0.03));
  float n2=vnoise(cid*0.21+vec2(-uTime*0.02,uTime*0.035)+9.7);
  float rb=0.13+0.17*smoothstep(0.2,0.8,n1);
  float body=0.62+0.38*n2;

  // Wake energy at the cell centre.
  float e=0.;
  if(uCount>0.5){
    for(int i=0;i<${MAX_PTS};i++){
      if(float(i)>=uCount)break;
      vec4 q=uPts[i];
      vec2 dd=cpx-q.xy;
      e+=q.z*exp(-dot(dd,dd)*q.w);
    }
  }
  for(int i=0;i<${MAX_RINGS};i++){
    vec4 r=uRing[i];
    if(r.w<0.001)continue;
    float rr=(length(cpx-r.xy)-r.z)/34.;
    e+=r.w*exp(-rr*rr)*0.9;
  }
  e=1.-exp(-e*1.25); // soft saturation: overlapping samples do not stack into a solid blob

  float hc=hash(cid);
  // Base lattice, swelling slightly where the wake passes.
  float rad=rb+e*0.12;
  float dotB=smoothstep(rad+aa,rad-aa,d);
  float a=uA.x*body*dotB;

  // Soft specular sheen follows the cursor: lifts the lattice dots it passes over, plus a faint veil.
  vec2 sd=p-uSheen.xy;
  float sh=uSheen.z*exp(-dot(sd,sd)/(300.*300.));
  a+=uA.x*dotB*1.2*sh+0.008*sh;

  // Wake dots: whole cells switch on against per-cell thresholds, larger than the resting dot, each with its own slow flicker.
  float lit=smoothstep(hc*0.5,hc*0.5+0.4,e);
  float flick=0.72+0.28*sin(uTime*16.+hash(cid+3.3)*6.2831);
  float rw=0.2+0.1*min(e,1.);
  float dotW=smoothstep(rw+aa,rw-aa,d);
  a+=uA.y*lit*flick*dotW;

  // Sparkles: a fifth of the cells carry a bright point that twinkles while the wake is over them.
  float ss=step(0.8,hash(cid+11.3));
  float tw=pow(max(0.,sin(uTime*13.+hash(cid+5.1)*40.)),5.);
  float star=smoothstep(0.17,0.,d);
  a+=uA.z*ss*tw*star*smoothstep(0.03,0.4,e);

  // Glitter: single-point flecks on a 3 px grid inside the wake, re-rolled every ~80 ms so they flash and vanish.
  vec2 gc=floor(p/3.);
  float gt=floor(uTime*12.);
  float g=step(0.987,hash(gc+gt*0.371));
  float ge=0.;
  if(uCount>0.5){
    for(int i=0;i<${MAX_PTS};i++){
      if(float(i)>=uCount)break;
      vec4 q=uPts[i];
      vec2 dd=p-q.xy;
      ge+=q.z*exp(-dot(dd,dd)*q.w*0.8);
    }
  }
  a+=uA.z*0.9*g*smoothstep(0.08,0.5,ge);

  // Ambient band: a faint light band crossing the page diagonally. It brightens dots and drops a few sparkles.
  if(uBand>-0.5){
    float s=(p.x*0.8+p.y*0.6)/(uView.x*0.8+uView.y*0.6);
    float bd=(s-uBand)/0.075;
    float b=exp(-bd*bd);
    a+=uA.x*dotB*0.9*b+0.006*b;
    float bs=step(0.86,hash(cid+21.7))*pow(max(0.,sin(uTime*9.+hash(cid+2.2)*30.)),4.);
    a+=uA.z*0.6*bs*star*b;
  }

  // Fibre: faint long streaks, the paper stock the dots sit on.
  float fib=vnoise(vec2(sp.x*0.55,sp.y*0.04)+3.1);
  a+=max(fib-0.52,0.)*0.05+n1*0.008;

  a=clamp(a,0.,0.7);
  gl_FragColor=vec4(uInk*a,a);
}`;

export type FieldEnv = {
  /** Animate with the pointer. False draws the static pattern once. */
  animated: boolean;
  /** Called when the canvas is drawn for the first time (fade it in). */
  onLive: () => void;
  /** Called when WebGL is unavailable or lost (switch to the CSS fallback). */
  onFail: () => void;
};

export type Field = {
  setAnimated(on: boolean): void;
  dispose(): void;
};

type Sample = { x: number; y: number; t0: number; life: number; w: number; inv: number };
type Ring = { x: number; y: number; t0: number };

const INTERACTIVE = "a[href],button:not(:disabled),input,select,textarea,summary,label,[role=button],[role=tab],[role=option],[data-no-fx]";
const QUIET = ".paper,.cab,.cv-root,[data-no-fx]";

export function startField(canvas: HTMLCanvasElement, env: FieldEnv): Field | null {
  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "low-power",
    preserveDrawingBuffer: false,
  });
  if (!gl) return null;

  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  };
  const vs = sh(gl.VERTEX_SHADER, VERT);
  const fs = sh(gl.FRAGMENT_SHADER, FRAG);
  const prog = gl.createProgram()!;
  if (!vs || !fs) return null;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.clearColor(0, 0, 0, 0);

  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uRes = U("uRes"), uScale = U("uScale"), uTime = U("uTime"), uInk = U("uInk"), uA = U("uA"), uScroll = U("uScroll");
  const uView = U("uView"), uCount = U("uCount"), uPts = U("uPts[0]"), uSheen = U("uSheen"), uRing = U("uRing[0]"), uBand = U("uBand");

  const ptsBuf = new Float32Array(MAX_PTS * 4);
  const ringBuf = new Float32Array(MAX_RINGS * 4);
  const samples: Sample[] = [];
  const rings: Ring[] = [];

  let animated = env.animated;
  let scale = 1;
  let scaleCap = 1;
  let vw = innerWidth;
  let vh = innerHeight;
  let time = 0;
  let live = false;
  let disposed = false;
  let raf = 0;
  let last = 0;
  let prevNow = 0;
  let slow = 0;
  let resizeT = 0;
  let bandT0 = 0;
  let band = -1;
  let ambientT = 0;
  let scrollY = 0;
  // Pointer state: raw position, eased sheen position, sheen strength.
  let px = 0, py = 0, lx = 0, ly = 0, lt = 0, seen = false;
  let sx = 0, sy = 0, sStr = 0, lastMove = 0;
  let hot = false; // pointer currently over a paper surface: no wake
  let coarse = false;
  let capMs = 0;
  let capCheck = 0;
  let ambientOnly = false; // only the ambient band is running: 30 fps is plenty and halves its cost

  const ink = () => (document.documentElement.getAttribute("data-theme") === "light" ? LIGHT : DARK);

  function resize() {
    vw = innerWidth;
    vh = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    scale = dpr * scaleCap;
    const w = Math.max(1, Math.round(vw * scale));
    const h = Math.max(1, Math.round(vh * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl!.viewport(0, 0, w, h);
  }

  function draw() {
    if (disposed) return;
    const th = ink();
    gl!.clear(gl!.COLOR_BUFFER_BIT);
    gl!.uniform2f(uRes, canvas.width, canvas.height);
    gl!.uniform1f(uScale, canvas.width / vw);
    gl!.uniform1f(uTime, time);
    gl!.uniform3fv(uInk, th.ink);
    gl!.uniform3fv(uA, th.a);
    gl!.uniform1f(uScroll, animated && !coarse ? scrollY * PARALLAX : 0);
    gl!.uniform2f(uView, vw, vh);
    gl!.uniform1f(uCount, samples.length);
    gl!.uniform4fv(uPts, ptsBuf);
    gl!.uniform3f(uSheen, sx, sy, sStr);
    gl!.uniform4fv(uRing, ringBuf);
    gl!.uniform1f(uBand, band);
    gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    if (!live) {
      live = true;
      env.onLive();
    }
  }

  function loop(now: number) {
    raf = 0;
    if (disposed || document.hidden) return;
    // Frame cap: 30 fps while the home WebGL stage is live, else the display rate.
    if (now - capCheck > 1000) {
      capCheck = now;
      capMs = document.querySelector(".hero[data-gl]") ? 33 : 0;
    }
    const cap = capMs || (ambientOnly ? 33 : 0);
    if (cap && now - last < cap - 2) {
      raf = requestAnimationFrame(loop);
      return;
    }
    const dt = Math.min(0.05, (now - (last || now - 16)) / 1000);
    const interval = now - (prevNow || now);
    prevNow = now;
    last = now;
    time += dt;

    // Cost governor: if frames keep arriving late, render at fewer pixels (once, down to 0.6).
    if (interval > (cap ? 48 : 26)) slow++;
    else slow = Math.max(0, slow - 1);
    if (slow > 40 && scaleCap > 0.6) {
      scaleCap = Math.max(0.6, scaleCap * 0.78);
      slow = 0;
      resize();
    }

    // Wake samples: amp = strength * (1 - age/life)^1.6.
    let n = 0;
    for (let i = samples.length - 1; i >= 0; i--) if (now - samples[i].t0 >= samples[i].life) samples.splice(i, 1);
    for (const s of samples) {
      const k = 1 - (now - s.t0) / s.life;
      ptsBuf[n * 4] = s.x;
      ptsBuf[n * 4 + 1] = s.y;
      ptsBuf[n * 4 + 2] = s.w * Math.pow(k, 1.6);
      ptsBuf[n * 4 + 3] = s.inv;
      n++;
    }
    // Rings: radius grows at 880 px/s, amp fades over 1.15 s.
    for (let i = rings.length - 1; i >= 0; i--) if (now - rings[i].t0 > 1150) rings.splice(i, 1);
    ringBuf.fill(0);
    rings.forEach((r, i) => {
      const age = (now - r.t0) / 1000;
      ringBuf[i * 4] = r.x;
      ringBuf[i * 4 + 1] = r.y;
      ringBuf[i * 4 + 2] = age * 880;
      ringBuf[i * 4 + 3] = Math.pow(Math.max(0, 1 - age / 1.15), 1.5);
    });

    // Sheen: eases toward the pointer (inertia), strength rises fast while moving and falls slowly after.
    const moving = now - lastMove < 140;
    sx += (px - sx) * (1 - Math.exp(-dt * 6));
    sy += (py - sy) * (1 - Math.exp(-dt * 6));
    sStr += ((moving && !hot ? 1 : 0) - sStr) * (1 - Math.exp(-dt * (moving ? 10 : 3.5)));

    // Ambient band: 2.6 s eased crossing.
    let bandOn = false;
    if (bandT0) {
      const u = (now - bandT0) / 2600;
      if (u >= 1) {
        bandT0 = 0;
        band = -1;
      } else {
        const e = u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
        band = -0.15 + 1.3 * e;
        bandOn = true;
      }
    }

    const busy = samples.length > 0 || rings.length > 0 || bandOn || sStr > 0.02 || moving || Math.abs(px - sx) + Math.abs(py - sy) > 0.5;
    if (!busy) sStr = 0;
    ambientOnly = bandOn && samples.length === 0 && rings.length === 0 && sStr < 0.02 && !moving;
    draw();
    if (busy) raf = requestAnimationFrame(loop);
    else {
      // Sleep: the frame just drawn is the clean static pattern. Nothing runs until the next event.
      last = 0;
      prevNow = 0;
      slow = 0;
    }
  }

  function kick() {
    if (!animated || raf || disposed || document.hidden) return;
    raf = requestAnimationFrame(loop);
  }

  function once() {
    if (disposed) return;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      draw();
    });
  }

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === "touch" || !animated) return;
    const now = performance.now();
    px = e.clientX;
    py = e.clientY;
    hot = !!(e.target as Element | null)?.closest?.(QUIET);
    if (!seen) {
      seen = true;
      sx = lx = px;
      sy = ly = py;
      lt = now;
      return;
    }
    if (hot) {
      lx = px;
      ly = py;
      lt = now;
      lastMove = now;
      kick();
      return;
    }
    const dx = px - lx;
    const dy = py - ly;
    const dist = Math.hypot(dx, dy);
    const dtMs = Math.max(1, now - lt);
    const speed = dist / dtMs; // px per ms
    if (dist < 1.5) return;
    // Faster stroke: stronger, wider, longer-lived wake (0.6 s slow, 0.9 s fast).
    const f = Math.min(speed / 1.4, 1);
    const w = 0.4 + 0.6 * f;
    const life = 600 + 300 * f;
    const r = 64 + 56 * f;
    const inv = 1 / (r * r);
    const steps = Math.min(8, Math.max(1, Math.ceil(dist / 30)));
    for (let i = 1; i <= steps; i++) {
      const k = i / steps;
      samples.push({ x: lx + dx * k, y: ly + dy * k, t0: now - (1 - k) * dtMs, life, w, inv });
    }
    if (samples.length > MAX_PTS) samples.splice(0, samples.length - MAX_PTS);
    lx = px;
    ly = py;
    lt = now;
    lastMove = now;
    kick();
  };
  const onDown = (e: PointerEvent) => {
    if (!animated || e.button !== 0 || e.pointerType === "touch") return;
    const t = e.target as Element | null;
    if (t?.closest?.(INTERACTIVE) || t?.closest?.(QUIET)) return;
    if (rings.length >= MAX_RINGS) rings.shift();
    rings.push({ x: e.clientX, y: e.clientY, t0: performance.now() });
    kick();
  };
  const onLeave = () => {
    lastMove = 0;
    kick();
  };
  const onScroll = () => {
    scrollY = window.scrollY;
    if (!animated || coarse) return;
    if (raf) return;
    kick();
    // A scroll alone needs one frame, not a loop: the busy test above ends it right away.
  };
  const onResize = () => {
    clearTimeout(resizeT);
    resizeT = window.setTimeout(() => {
      resize();
      once();
    }, 120);
  };
  const onVis = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      prevNow = 0;
    } else once();
  };
  const mo = new MutationObserver(once);
  mo.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const onLost = (e: Event) => {
    e.preventDefault();
    teardown();
    env.onFail();
  };

  const scheduleAmbient = (ms: number) => {
    clearTimeout(ambientT);
    if (!animated || disposed) return;
    ambientT = window.setTimeout(() => {
      if (animated && !document.hidden && !bandT0) {
        bandT0 = performance.now();
        kick();
      }
      scheduleAmbient(12000);
    }, ms);
  };

  function bind() {
    coarse = !matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (animated && !coarse) {
      addEventListener("pointermove", onMove, { passive: true });
      addEventListener("pointerdown", onDown, { passive: true });
      addEventListener("scroll", onScroll, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      scheduleAmbient(1400);
    }
  }
  function unbind() {
    removeEventListener("pointermove", onMove);
    removeEventListener("pointerdown", onDown);
    removeEventListener("scroll", onScroll);
    document.documentElement.removeEventListener("pointerleave", onLeave);
    clearTimeout(ambientT);
  }

  function teardown() {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(raf);
    clearTimeout(resizeT);
    unbind();
    removeEventListener("resize", onResize);
    document.removeEventListener("visibilitychange", onVis);
    canvas.removeEventListener("webglcontextlost", onLost);
    mo.disconnect();
    gl!.getExtension("WEBGL_lose_context")?.loseContext();
  }

  canvas.addEventListener("webglcontextlost", onLost);
  addEventListener("resize", onResize, { passive: true });
  document.addEventListener("visibilitychange", onVis);
  scrollY = window.scrollY;
  bind();
  resize();
  draw();

  return {
    setAnimated(on) {
      if (on === animated || disposed) return;
      unbind();
      animated = on;
      samples.length = 0;
      rings.length = 0;
      bandT0 = 0;
      band = -1;
      sStr = 0;
      bind();
      once();
    },
    dispose: teardown,
  };
}

// Ink colour and alpha budget per theme. a = [resting dot, wake dot, sparkle].
// Dark: white ink, resting dots peak near +12/255 over #1f1f1f (about 4.7 percent), so mute text keeps AA over a dot.
// Light: warm graphite ink at a similar contrast, inverted (dark dots on cream).
const DARK = { ink: new Float32Array([1, 1, 1]), a: new Float32Array([0.046, 0.07, 0.2]) };
const LIGHT = { ink: new Float32Array([0.16, 0.12, 0.04]), a: new Float32Array([0.062, 0.095, 0.24]) };
