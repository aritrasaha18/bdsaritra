import { AnimatePresence, motion, useScroll, useSpring, useMotionValueEvent } from "motion/react";
import { useState } from "react";

/** A small floating dock that appears once the hero is gone. The ring around the sun is your reading progress. */
export default function Dock({ onPalette, kbd }: { onPalette: () => void; kbd: string }) {
  const { scrollY, scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  const [show, setShow] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setShow(y > window.innerHeight * 0.85));

  return (
    <AnimatePresence>
      {show && (
        <motion.nav
          className="dock"
          aria-label="Quick navigation"
          initial={{ y: -24, opacity: 0, scale: 0.96 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -24, opacity: 0, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        >
          <a href="#top" className="dock-sun" aria-label="Back to top">
            <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden>
              <circle cx="16" cy="16" r="13" fill="none" stroke="currentColor" strokeOpacity=".2" strokeWidth="2" />
              <motion.circle
                cx="16" cy="16" r="13" fill="none" stroke="var(--gold)" strokeWidth="2" strokeLinecap="round"
                style={{ pathLength: progress, rotate: -90, transformOrigin: "50% 50%" }}
              />
              <circle cx="16" cy="16" r="7" fill="var(--gold)" />
            </svg>
          </a>
          <a href="#demo">Work</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#mcp">MCP</a>
          <button className="dock-k" onClick={onPalette} aria-label="Open command menu">
            <kbd>{kbd}</kbd><kbd>K</kbd>
          </button>
        </motion.nav>
      )}
    </AnimatePresence>
  );
}
