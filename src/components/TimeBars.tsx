import { motion, useReducedMotion } from "motion/react";

/** The animation is the argument: a 45-minute bar collapses to a sliver. Scale is linear in minutes. */
export default function TimeBars() {
  const reduce = useReducedMotion();
  const ease = [0.65, 0, 0.35, 1] as const;
  return (
    <figure className="timebars">
      <figcaption>Time to review one trade confirmation</figcaption>
      <div className="tb-row">
        <span className="tb-label">By hand</span>
        <div className="tb-track">
          <motion.div
            className="tb-bar tb-hand"
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1.1, ease }}
          >
            <span className="tb-range" />
          </motion.div>
        </div>
        <span className="tb-value">15–45 min</span>
      </div>
      <div className="tb-row">
        <span className="tb-label">With the agent</span>
        <div className="tb-track">
          <motion.div
            className="tb-bar tb-agent"
            initial={reduce ? false : { width: "100%" }}
            whileInView={{ width: "2.2%" }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1.4, ease, delay: 1.0 }}
          />
        </div>
        <span className="tb-value">under 1 min</span>
      </div>
    </figure>
  );
}
