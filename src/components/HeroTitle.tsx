import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

// Apple's house easing: quick start, long gentle settle
const ease = [0.25, 0.1, 0.25, 1] as const;

export function HeroTitle() {
  const reduce = useReducedMotion();
  return (
    <h1 aria-label="B D S Aritra">
      <motion.span
        className="eyebrow-name"
        aria-hidden
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease, delay: 0.5 }}
      >
        B D S
      </motion.span>
      <motion.span
        className="title-name"
        aria-hidden
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1.4, ease, delay: 0.7 }}
      >
        Aritra
      </motion.span>
    </h1>
  );
}

export function Reveal({ delay, children, className }: { delay: number; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.1, ease, delay }}
    >
      {children}
    </motion.div>
  );
}

/** Section-level reveal on scroll, used once per section head. */
export function FadeUp({ children, className }: { children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 1, ease }}
    >
      {children}
    </motion.div>
  );
}
