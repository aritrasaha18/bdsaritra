import { motion, useScroll, useTransform, useReducedMotion, type MotionValue } from "motion/react";
import { useRef } from "react";

/** Apple's scroll-lit paragraph: each word brightens as the reader reaches it. */
function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.22, 1]);
  return <motion.span style={{ opacity }}>{children} </motion.span>;
}

export default function Statement({ text }: { text: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 85%", "end 45%"] });
  const words = text.split(" ");
  if (reduce) return <p className="statement">{text}</p>;
  return (
    <p className="statement" ref={ref} aria-label={text}>
      <span aria-hidden>
        {words.map((w, i) => (
          <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>{w}</Word>
        ))}
      </span>
    </p>
  );
}
