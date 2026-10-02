import { useEffect, useRef } from "react";

/** Drifting nodes that link up when close; the cursor is one more node. A quiet picture of agents connecting. */
export default function Constellation() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0;
    type P = { x: number; y: number; vx: number; vy: number };
    let pts: P[] = [];
    const mouse = { x: -1e4, y: -1e4 };

    const resize = () => {
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(90, (w * h) / 14000));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.18, vy: (Math.random() - 0.5) * 0.18,
      }));
    };
    const LINK = 130;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const all = [...pts, { x: mouse.x, y: mouse.y, vx: 0, vy: 0 }];
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          const a = all[i], b = all[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < LINK) {
            const isMouse = j === all.length - 1;
            ctx.strokeStyle = isMouse ? `rgba(227,192,75,${0.55 * (1 - d / LINK)})` : `rgba(160,180,220,${0.22 * (1 - d / LINK)})`;
            ctx.lineWidth = isMouse ? 1.2 : 1;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
      }
      for (const p of pts) {
        const near = Math.hypot(p.x - mouse.x, p.y - mouse.y) < LINK;
        ctx.fillStyle = near ? "#e3c04b" : "rgba(200,212,236,.55)";
        ctx.beginPath(); ctx.arc(p.x, p.y, near ? 2.2 : 1.5, 0, Math.PI * 2); ctx.fill();
      }
    };
    let raf = 0, visible = false;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!visible) return;
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
      }
      draw();
    };
    const ro = new ResizeObserver(() => { resize(); draw(); });
    ro.observe(c);
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting));
    io.observe(c);
    const onMove = (e: PointerEvent) => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      if (still) draw();
    };
    const onLeave = () => { mouse.x = mouse.y = -1e4; if (still) draw(); };
    const host = c.parentElement!;
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    resize();
    if (still) draw(); else tick();
    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);
  return <canvas ref={ref} className="constellation" aria-hidden />;
}
