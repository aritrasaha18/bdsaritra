import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

const ease = [0.16, 1, 0.3, 1] as const;

/** Name reveal timed to the sun's ignition: initials settle, then each letter rises out of a mask. */
export function HeroTitle() {
  const reduce = useReducedMotion();
  const word = "Aritra".split("");
  return (
    <h1 aria-label="B D S Aritra">
      <motion.span
        className="initials"
        aria-hidden
        initial={reduce ? false : { opacity: 0, letterSpacing: "0.7em", filter: "blur(6px)" }}
        animate={{ opacity: 1, letterSpacing: "0.18em", filter: "blur(0px)" }}
        transition={{ duration: 1.6, ease, delay: 0.35 }}
      >
        B D S
      </motion.span>
      <span className="word" aria-hidden>
        {word.map((ch, i) => (
          <span className="mask" key={i}>
            <motion.span
              initial={reduce ? false : { y: "105%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.1, ease, delay: 0.7 + i * 0.06 }}
            >
              {ch}
            </motion.span>
          </span>
        ))}
      </span>
    </h1>
  );
}

export function Reveal({ delay, children, className }: { delay: number; children: ReactNode; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease, delay }}
    >
      {children}
    </motion.div>
  );
}
