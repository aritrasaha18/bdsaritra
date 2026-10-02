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

const sunFrag = COMMON + /* glsl */ `
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; }
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

void main(){
  vec2 frag = gl_FragCoord.xy;
  float grow = easeOut(uIntro);
  float R = uRadius * (0.12 + 0.88*grow);
  vec2 d = (frag - uCenter) / R;
  float r = length(d);
    float t = uTime;

  // where the cursor is, relative to the sun
  vec2 m = uMouse - uCenter;
  float mLen = length(m);
  vec2 mDir = mLen > 1.0 ? m / mLen : vec2(0.0);
  float lean = max(dot(normalize(d + 1e-4), mDir), 0.0);
  float near = exp(-max(mLen / R - 1.0, 0.0) * 0.8);

  vec3 col;
  float flash = (1.0 - grow) * 1.1;
  if (r < 1.0) {
    vec2 sp = vec2(asin(clamp(d.x / max(sqrt(1.0 - d.y*d.y), 1e-3), -1.0, 1.0)) + t*0.04, asin(d.y));
    float loops = fbm(sp*3.2 + vec2(0.0, t*0.01));
    float fine  = fbm(sp*14.0 - vec2(t*0.02, 0.0));
    float active = smoothstep(0.55, 0.85, fbm(sp*1.6 + 7.3));
    float z = sqrt(1.0 - r*r);
    float v = 0.30 + 0.35*loops + 0.12*fine + 0.45*active*loops;
    v *= 0.55 + 0.45*pow(z, 0.5);
    v += 0.25*smoothstep(0.85, 1.0, r);
    v += 0.10*lean*near*smoothstep(0.6, 1.0, r);
    col = aia171(v * (1.0 + flash));
  } else {
    vec2 dn = d / r;  // seam-free angular coordinate
    float streak = fbm(dn*2.2 + vec2(r*1.2 - t*0.05, -r*0.7 + t*0.03));
    float rays = 0.55 + 0.9*streak*streak;
    float reach = 5.5 - 1.4*lean*near;                // corona leans toward the cursor
    float v = rays * exp(-(r-1.0)*reach) * 0.75 * (1.0 + 0.3*lean*near);
    v *= 1.0 + flash;
    col = vec3(0.98, 0.72, 0.24) * v + vec3(0.25, 0.22, 0.12) * v * v;
  }

  // sunset: dim and warm toward the 304 A red channel as the hero scrolls away
  col *= 1.0 - 0.75*uSet*uSet;

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
    const uWind = { ...loc(windProg), uDpr: gl.getUniformLocation(windProg, "uDpr") };
    const aPos = gl.getAttribLocation(sunProg, "aPos");
    const aSeed = gl.getAttribLocation(windProg, "aSeed");

    const dpr = Math.min(window.devicePixelRatio, 1.5);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const state = {
      w: 1, h: 1, cx: 0, cy: 0, r: 100,
      time: still ? 12 : 0,
      intro: still ? 1 : 0,
      set: 0,
      mouse: [-9999, -9999], target: [-9999, -9999],
      visible: true, introStarted: variant === "hero",
    };

    const layout = () => {
      const w = el.clientWidth, h = el.clientHeight;
      state.w = w; state.h = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      if (variant === "hero") {
        const wide = w > 820;
        state.r = (wide ? Math.min(h * 0.31, w * 0.24) : Math.min(w * 0.46, h * 0.26)) * dpr;
        state.cx = w * 0.5 * dpr;
        state.cy = (wide ? h * 0.17 : h * 0.2) * dpr;
      } else {
        state.r = Math.max(w * 0.42, 320) * dpr;
        state.cx = w * 0.5 * dpr;
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
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.disableVertexAttribArray(aPos);

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(windProg);
      set(uWind);
      gl.uniform1f(uWind.uDpr, dpr);
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
      state.target = [(e.clientX - rect.left) * dpr, (rect.bottom - e.clientY) * dpr];
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
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (!state.visible || document.hidden) return;
      state.time += dt;
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
      gl.deleteBuffer(tri);
      gl.deleteBuffer(seedBuf);
      gl.deleteProgram(sunProg);
      gl.deleteProgram(windProg);
      canvas.remove();
    };
  }, [variant]);

  return <div ref={host} className={`sun sun-${variant}`} />;
}
