import { useEffect, useRef } from "react";

const frag = /* glsl */ `
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uCenter;   // in px from bottom-left
uniform float uRadius;  // in px
varying vec2 vUv;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), u.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++){ v += a*noise(p); p *= 2.03; a *= 0.5; }
  return v;
}

// SDO / AIA 171 angstrom false-color ramp: black -> olive -> gold -> pale
vec3 aia171(float t){
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.035, 0.086, 0.20);
  vec3 c1 = vec3(0.30, 0.25, 0.05);
  vec3 c2 = vec3(0.80, 0.64, 0.18);
  vec3 c3 = vec3(1.00, 0.93, 0.66);
  if (t < 0.33) return mix(c0, c1, t/0.33);
  if (t < 0.70) return mix(c1, c2, (t-0.33)/0.37);
  return mix(c2, c3, (t-0.70)/0.30);
}

void main(){
  vec2 frag = vUv * uRes;
  vec2 d = (frag - uCenter) / uRadius;      // unit = solar radius
  float r = length(d);
  float ang = atan(d.y, d.x);
  float t = uTime;

  float v = 0.0;
  vec3 col;
  if (r < 1.0) {
    // pseudo-3D: map disc to sphere so features slide as it rotates
    float z = sqrt(1.0 - r*r);
    vec2 sp = vec2(asin(d.x/ max(sqrt(1.0 - d.y*d.y), 1e-3)) + t*0.04, asin(d.y));
    float loops = fbm(sp*3.2 + vec2(0.0, t*0.01));
    float fine  = fbm(sp*14.0 - vec2(t*0.02, 0.0));
    float active = smoothstep(0.55, 0.85, fbm(sp*1.6 + 7.3));
    v = 0.30 + 0.35*loops + 0.12*fine + 0.45*active*loops;
    v *= 0.55 + 0.45*pow(z, 0.5);           // limb darkening
    v += 0.25*smoothstep(0.85, 1.0, r);     // bright limb in EUV
    col = aia171(v);
  } else {
    // corona: radial falloff, streamers modulated by angle
    float streak = fbm(vec2(ang*3.0, r*1.2 - t*0.05));
    float rays = 0.55 + 0.9*streak*streak;
    v = rays * exp(-(r-1.0)*4.5) * 0.9;
    v += 0.025*exp(-(r-1.0)*1.6);
    // additive gold glow over the blue sky, so the halo never turns muddy
    col = vec3(0.035, 0.086, 0.20) + vec3(0.95, 0.74, 0.22) * v * 1.05 + vec3(0.3, 0.25, 0.1) * v * v;
  }
  // faint starfield far from the sun
  float s = step(0.9975, hash(floor(frag/2.0))) * smoothstep(1.8, 3.0, r) * 0.6;
  col += vec3(s);
  gl_FragColor = vec4(col, 1.0);
}
`;

const vert = /* glsl */ `
attribute vec2 aPos;
varying vec2 vUv;
void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }
`;

export default function Sun() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    const gl = canvas.getContext("webgl", { antialias: false, powerPreference: "low-power" });
    if (!gl) { el.dataset.fallback = "true"; return; }
    el.appendChild(canvas);

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? "shader");
      return sh;
    };
    let prog: WebGLProgram;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, compile(gl.VERTEX_SHADER, vert));
      gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, frag));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error("link");
    } catch {
      canvas.remove();
      el.dataset.fallback = "true";
      return;
    }
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "aPos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uCenter = gl.getUniformLocation(prog, "uCenter");
    const uRadius = gl.getUniformLocation(prog, "uRadius");

    const dpr = Math.min(window.devicePixelRatio, 1.5);
    let time = 0;
    const draw = () => {
      gl.uniform1f(uTime, time);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    const resize = () => {
      const w = el.clientWidth, h = el.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      const wide = w > 820;
      const radius = (wide ? Math.min(h * 0.38, w * 0.28) : Math.min(w * 0.55, h * 0.3)) * dpr;
      gl.uniform1f(uRadius, radius);
      gl.uniform2f(uCenter, (wide ? w * 0.74 : w * 0.78) * dpr, (wide ? h * 0.5 : h * 0.22) * dpr);
      draw();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(el);

    let raf = 0;
    const start = performance.now();
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible || document.hidden) return;
      time = (performance.now() - start) / 1000;
      draw();
    };
    if (still) time = 12;
    resize();
    if (!still) tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      canvas.remove();
    };
  }, []);

  return <div ref={host} className="sun" />;
}
