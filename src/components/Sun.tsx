import { useEffect, useRef } from "react";

/**
 * Live SDO/AIA-171-style sun + GPU "solar wind" particles.
 * variant "hero":    ignites on load, follows the cursor, sets as you scroll away.
 * variant "horizon": rises from the bottom edge when it scrolls into view.
 */

const COMMON = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uIntro;
uniform float uSet;
uniform vec2 uMouse;
`;
const PHOTO_UNIFORMS = `
uniform sampler2D uTex;
uniform float uPhoto;
`;

const sunFrag = COMMON + PHOTO_UNIFORMS + /* glsl */ `
// 2D simplex noise (Ashima Arts / Ian McEwan, MIT). Smooth gradients, no square grid artifacts.
vec3 permute(vec3 x){ return mod(((x*34.0)+1.0)*x, 289.0); }
float snoise(vec2 v){
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i  = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m; m = m*m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
// fractal sum, each octave rotated so no direction lines up
float fbm(vec2 p, int oct){
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 7; i++){
    if (i >= oct) break;
    v += a * (0.5 + 0.5*snoise(p));
    p = r * p * 2.02 + 17.3;
    a *= 0.5;
  }
  return v;
}
vec3 aia171(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.0);
  vec3 c1 = vec3(0.30, 0.25, 0.05);
  vec3 c2 = vec3(0.80, 0.64, 0.18);
  vec3 c3 = vec3(1.00, 0.93, 0.66);
  if (t < 0.33) return mix(c0, c1, t/0.33);
  if (t < 0.70) return mix(c1, c2, (t-0.33)/0.37);
  return mix(c2, c3, (t-0.70)/0.30);
}
float easeOut(float x){ return 1.0 - pow(1.0 - clamp(x,0.0,1.0), 4.0); }

vec3 surface(vec2 d, float r, float t, float lean, float near, float flash){
  float rr = min(r, 0.9995);
  float z = sqrt(1.0 - rr*rr);
  // stereographic coordinates: features compress toward the limb like a sphere, with no pole pinch
  vec2 sp = d / (1.0 + z) * 2.0 + vec2(t*0.03, 0.0);
  vec2 q = vec2(fbm(sp*1.6 + vec2(0.0, t*0.02), 4), fbm(sp*1.6 + vec2(5.2, 1.3 - t*0.015), 4));
  float loops  = fbm(sp*2.6 + q*1.1, 6);
  float fine   = fbm(sp*12.0 + q*1.5 - vec2(t*0.02, 0.0), 5);
  float active = smoothstep(0.55, 0.80, fbm(sp*1.1 + 7.3 + q*0.5, 4));
  float v = 0.16 + 0.50*loops + 0.10*fine + 0.65*active*loops*loops;
  v *= 0.5 + 0.5*pow(z, 0.45);
  v += 0.22*smoothstep(0.88, 1.0, rr);
  v += 0.10*lean*near*smoothstep(0.6, 1.0, rr);
  return aia171(v * (1.0 + flash));
}

vec3 corona(vec2 d, float r, float t, float lean, float near, float flash){
  float rr = max(r, 1.0);
  vec2 dn = d / max(r, 1e-4);
  float streak = fbm(dn*2.2 + vec2(rr*1.2 - t*0.05, -rr*0.7 + t*0.03), 5);
  float rays = 0.55 + 0.9*streak*streak;
  float reach = 5.5 - 1.4*lean*near;
  float v = rays * exp(-(rr-1.0)*reach) * 0.75 * (1.0 + 0.3*lean*near);
  v *= 1.0 + flash;
  return vec3(0.98, 0.72, 0.24) * v + vec3(0.25, 0.22, 0.12) * v * v;
}

// Real SDO/AIA 171 image. In SDO's full-disk JPEGs the solar radius is ~0.39 of the frame width.
// We fade out before ~1.3 radii so the corner timestamps never show.
vec3 photo(vec2 d, float r){
  vec2 uv = 0.5 + d * 0.39;
  vec3 c = texture2D(uTex, uv).rgb;
  float mask = smoothstep(1.30, 1.08, r);
  return c * mask;
}

void main(){
  vec2 frag = gl_FragCoord.xy;
  float grow = easeOut(uIntro);
  float R = uRadius * (0.12 + 0.88*grow);
  vec2 d = (frag - uCenter) / R;
  float r = length(d);
  float t = uTime;

  vec2 m = uMouse - uCenter;
  float mLen = length(m);
  vec2 mDir = mLen > 1.0 ? m / mLen : vec2(0.0);
  float lean = max(dot(normalize(d + 1e-4), mDir), 0.0);
  float near = exp(-max(mLen / R - 1.0, 0.0) * 0.8);
  float flash = (1.0 - grow) * 1.1;

  // anti-aliased limb: blend surface and corona across ~1.5 device pixels
  float px = 1.5 / R;
  float edge = smoothstep(1.0 - px, 1.0 + px, r);
  vec3 col;
  if (uPhoto >= 1.0) {
    // photo mode: the real sun, with a soft live corona layered outside the limb
    col = photo(d, r);
    if (r > 0.98) col += corona(d, r, t, lean, near, 0.0) * 0.35 * smoothstep(0.98, 1.06, r);
    col *= 1.0 + flash;
  } else {
    if (edge <= 0.0)      col = surface(d, r, t, lean, near, flash);
    else if (edge >= 1.0) col = corona(d, r, t, lean, near, flash);
    else col = mix(surface(d, r, t, lean, near, flash), corona(d, r, t, lean, near, flash), edge);
    if (uPhoto > 0.0) {
      vec3 ph = photo(d, r);
      if (r > 0.98) ph += corona(d, r, t, lean, near, 0.0) * 0.35 * smoothstep(0.98, 1.06, r);
      col = mix(col, ph * (1.0 + flash), uPhoto);
    }
  }

  col *= 1.0 - 0.75*uSet*uSet;
  // a whisper of dither removes banding in the dark corona falloff
  float n = fract(sin(dot(frag, vec2(12.9898, 78.233))) * 43758.5453);
  col += (n - 0.5) / 255.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

const sunVert = /* glsl */ `
attribute vec2 aPos;
void main(){ gl_Position = vec4(aPos, 0.0, 1.0); }
`;

// Solar wind: every particle's path is a pure function of its seed and time,
// so the GPU animates thousands of them with no per-frame CPU work.
const windVert = COMMON + /* glsl */ `
attribute vec3 aSeed;
uniform float uDpr;
varying float vAlpha;
void main(){
  float speed = 0.035 + 0.05*aSeed.z;
  float life = fract(aSeed.y + uTime*speed);
  float R = uRadius * (0.12 + 0.88*(1.0 - pow(1.0 - clamp(uIntro,0.0,1.0), 4.0)));
  float a = aSeed.x * 6.2831853 + sin(uTime*0.15 + aSeed.y*12.0)*0.05;
  float dist = 1.02 + life*life*5.5;
  vec2 dir = vec2(cos(a), sin(a));
  vec2 perp = vec2(-dir.y, dir.x);
  vec2 p = uCenter + dir*dist*R + perp*sin(life*5.0 + aSeed.z*9.0)*R*0.12*life;

  // the cursor parts the wind
  vec2 tm = p - uMouse;
  float dm = length(tm);
  float rad = R*0.45;
  p += (dm > 0.001 ? tm/dm : vec2(0.0)) * rad * 0.8 * exp(-dm/rad);

  vAlpha = 0.55 * smoothstep(0.0, 0.08, life) * (1.0 - life) * clamp(uIntro*1.4 - 0.4, 0.0, 1.0) * (1.0 - 0.6*uSet);
  gl_Position = vec4(p / uRes * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = (1.2 + 2.2*aSeed.z) * uDpr;
}
`;
const windFrag = /* glsl */ `
precision mediump float;
varying float vAlpha;
void main(){
  vec2 c = gl_PointCoord - 0.5;
  float f = smoothstep(0.5, 0.0, length(c));
  gl_FragColor = vec4(vec3(1.0, 0.84, 0.5) * f * vAlpha, 1.0);
}
`;

type Props = { variant?: "hero" | "horizon" };

export default function Sun({ variant = "hero" }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl", { antialias: false, powerPreference: "low-power", premultipliedAlpha: false });
    if (!gl) { el.dataset.fallback = "true"; return; }

    const build = (vs: string, fs: string) => {
      const p = gl.createProgram()!;
      for (const [type, src] of [[gl.VERTEX_SHADER, vs], [gl.FRAGMENT_SHADER, fs]] as const) {
        const sh = gl.createShader(type)!;
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
        gl.attachShader(p, sh);
      }
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "link");
      return p;
    };
    let sunProg: WebGLProgram, windProg: WebGLProgram;
    try {
      sunProg = build(sunVert, sunFrag);
      windProg = build(windVert, windFrag);
    } catch (e) {
      console.warn(e);
      el.dataset.fallback = "true";
      return;
    }
    el.appendChild(canvas);

    const tri = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tri);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const N = window.innerWidth < 700 ? 500 : 1000;
    const seeds = new Float32Array(N * 3);
    for (let i = 0; i < seeds.length; i++) seeds[i] = Math.random();
    const seedBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
    gl.bufferData(gl.ARRAY_BUFFER, seeds, gl.STATIC_DRAW);

    const names = ["uRes", "uTime", "uCenter", "uRadius", "uIntro", "uSet", "uMouse"] as const;
    const loc = (p: WebGLProgram) =>
      Object.fromEntries(names.map((n) => [n, gl.getUniformLocation(p, n)])) as Record<(typeof names)[number], WebGLUniformLocation | null>;
    const uSun = loc(sunProg);
    const uTex = gl.getUniformLocation(sunProg, "uTex");
    const uPhoto = gl.getUniformLocation(sunProg, "uPhoto");
    let photoMix = 0, photoReady = false;
    const tex = gl.createTexture();
    {
      const img = new Image();
      img.decoding = "async";
      img.src = `/sun.jpg?size=${window.innerWidth < 700 ? 1024 : 2048}`;
      img.onload = () => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
        const pot = (img.width & (img.width - 1)) === 0 && (img.height & (img.height - 1)) === 0;
        if (pot) gl.generateMipmap(gl.TEXTURE_2D);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, pot ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        photoReady = true;
        if (still) { photoMix = 1; draw(); }
      };
      // on error we simply keep the procedural sun
    }
    const uWind = { ...loc(windProg), uDpr: gl.getUniformLocation(windProg, "uDpr") };
    const aPos = gl.getAttribLocation(sunProg, "aPos");
    const aSeed = gl.getAttribLocation(windProg, "aSeed");

    // render at the screen's real density (capped at 2x), and step down if frames run slow
    const maxDpr = Math.min(window.devicePixelRatio || 1, 2);
    let dpr = maxDpr;
    const budget = 2_600_000 * 2; // pixels; keeps very large 2x screens in check
    const fitDpr = () => Math.min(dpr, Math.sqrt(budget / Math.max(el.clientWidth * el.clientHeight, 1)));
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = {
      w: 1, h: 1, cx: 0, cy: 0, r: 100,
      time: still ? 12 : 0,
      intro: still ? 1 : 0,
      set: 0,
      mouse: [-9999, -9999], target: [-9999, -9999],
      visible: true, introStarted: variant === "hero",
    };

    let scale = maxDpr;
    const layout = () => {
      const w = el.clientWidth, h = el.clientHeight;
      scale = fitDpr();
      state.w = w; state.h = h;
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (variant === "hero") {
        const wide = w > 820;
        state.r = (wide ? Math.min(h * 0.31, w * 0.24) : Math.min(w * 0.46, h * 0.26)) * scale;
        state.cx = w * 0.5 * scale;
        state.cy = (wide ? h * 0.17 : h * 0.2) * scale;
      } else {
        state.r = Math.max(w * 0.42, 320) * scale;
        state.cx = w * 0.5 * scale;
        state.cy = -state.r * 0.62;
      }
    };

    const draw = () => {
      // sunset lowers the sun a little as it dims
      const cy = state.cy - state.set * state.r * 0.7;
      gl.disable(gl.BLEND);
      gl.useProgram(sunProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, tri);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
      const set = (u: typeof uSun) => {
        gl.uniform2f(u.uRes, canvas.width, canvas.height);
        gl.uniform1f(u.uTime, state.time);
        gl.uniform2f(u.uCenter, state.cx, cy);
        gl.uniform1f(u.uRadius, state.r);
        gl.uniform1f(u.uIntro, state.intro);
        gl.uniform1f(u.uSet, state.set);
        gl.uniform2f(u.uMouse, state.mouse[0], state.mouse[1]);
      };
      set(uSun);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.uniform1i(uTex, 0);
      gl.uniform1f(uPhoto, photoMix);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(aPos);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(windProg);
      set(uWind);
      gl.uniform1f(uWind.uDpr, scale);
      gl.bindBuffer(gl.ARRAY_BUFFER, seedBuf);
      gl.enableVertexAttribArray(aSeed);
      gl.vertexAttribPointer(aSeed, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.POINTS, 0, N);
      gl.disableVertexAttribArray(aSeed);
    };

    const ro = new ResizeObserver(() => { layout(); draw(); });
    ro.observe(el);
    layout();

    const io = new IntersectionObserver(([e]) => {
      state.visible = e.isIntersecting;
      if (e.isIntersecting && e.intersectionRatio > 0.35) state.introStarted = true;
    }, { threshold: [0, 0.35] });
    io.observe(el);

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      state.target = [(e.clientX - rect.left) * scale, (rect.bottom - e.clientY) * scale];
      if (state.mouse[0] < -9000) state.mouse = [...state.target];
    };
    const onLeave = () => { state.target = [-9999, -9999]; state.mouse = [-9999, -9999]; };
    const onScroll = () => {
      if (variant !== "hero") return;
      state.set = Math.min(Math.max(window.scrollY / (el.clientHeight * 0.9), 0), 1);
    };
    if (!still) {
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerleave", onLeave);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    let raf = 0;
    let last = performance.now();
    let introAt: number | undefined;
    let frames = 0, slow = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (state.visible && !document.hidden && frames < 90) {
        frames++;
        if (frames > 30) slow += dt > 0.024 ? 1 : 0;
        if (frames === 90 && slow > 30 && dpr > 1) { dpr = Math.max(1, dpr * 0.7); layout(); }
      }
      if (!state.visible || document.hidden) return;
      state.time += dt;
      if (photoReady && photoMix < 1) photoMix = Math.min(photoMix + dt / 0.8, 1);
      if (state.introStarted && state.intro < 1) {
        introAt ??= now;
        state.intro = Math.min((now - introAt) / 2200, 1);
      }
      const k = 1 - Math.pow(0.001, dt);
      state.mouse[0] += (state.target[0] - state.mouse[0]) * k;
      state.mouse[1] += (state.target[1] - state.mouse[1]) * k;
      draw();
    };
    if (still) draw();
    else raf = requestAnimationFrame(tick);
    const onStillScroll = () => still && requestAnimationFrame(draw);
    window.addEventListener("scroll", onStillScroll, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onStillScroll);
      gl.deleteTexture(tex);
      gl.deleteBuffer(tri);
      gl.deleteBuffer(seedBuf);
      gl.deleteProgram(sunProg);
      gl.deleteProgram(windProg);
      canvas.remove();
    };
  }, [variant]);

  return <div ref={host} className={`sun sun-${variant}`} />;
}
