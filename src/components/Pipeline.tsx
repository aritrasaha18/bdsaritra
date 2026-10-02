import { motion } from "motion/react";

type Node = { id: string; x: number; y: number; label: string };
const nodes: Node[] = [
  { id: "doc", x: 70, y: 80, label: "Confirmation" },
  { id: "cls", x: 250, y: 80, label: "Classifier" },
  { id: "book", x: 470, y: 38, label: "Booking system" },
  { id: "cpty", x: 470, y: 122, label: "Counterparty data" },
  { id: "cmp", x: 670, y: 80, label: "Comparator" },
  { id: "out", x: 820, y: 80, label: "Verdict" },
];
const at = (id: string) => nodes.find((n) => n.id === id)!;
const W = 132, H = 34;

const curve = (a: string, b: string) => {
  const p = at(a), q = at(b);
  const x1 = p.x + W / 2, x2 = q.x - (b === "out" ? 44 : W / 2);
  const mx = (x1 + x2) / 2;
  return `M${x1},${p.y} C${mx},${p.y} ${mx},${q.y} ${x2},${q.y}`;
};
const edges = [
  ["doc", "cls"], ["cls", "book"], ["cls", "cpty"], ["book", "cmp"], ["cpty", "cmp"], ["cmp", "out"],
] as const;

/**
 * step: how many tool calls have run (0–5). done: verdict reached.
 * Edges that are "in flight" carry packets; finished edges stay lit.
 */
export default function Pipeline({ step, done, broke, running }: { step: number; done: boolean; broke: boolean; running: boolean }) {
  const lit = new Set<string>();
  const flowing = new Set<string>();
  const active = new Set<string>();
  if (step >= 1) { active.add("doc"); flowing.add("doc-cls"); }
  if (step >= 2) { active.add("cls"); lit.add("doc-cls"); flowing.delete("doc-cls"); }
  if (step >= 3) { active.add("book"); flowing.add("cls-book"); }
  if (step >= 4) { active.add("cpty"); lit.add("cls-book"); flowing.delete("cls-book"); flowing.add("cls-cpty"); }
  if (step >= 5) {
    active.add("cmp"); lit.add("cls-cpty"); flowing.delete("cls-cpty");
    flowing.add("book-cmp"); flowing.add("cpty-cmp");
  }
  if (done) {
    ["book-cmp", "cpty-cmp", "cmp-out"].forEach((e) => { lit.add(e); flowing.delete(e); });
    active.add("out");
  }
  if (!running && !done) { flowing.clear(); }

  const verdictColor = broke ? "var(--red)" : "var(--green)";

  return (
    <div className="pipeline-wrap">
      <svg className="pipeline" viewBox="0 0 880 160" role="img" aria-label="Agent pipeline: confirmation, classifier, booking system and counterparty data, comparator, verdict">

        {edges.map(([a, b]) => {
          const id = `${a}-${b}`;
          const d = curve(a, b);
          const on = lit.has(id) || flowing.has(id);
          return (
            <g key={id}>
              <path d={d} className="edge" />
              <motion.path
                d={d}
                className="edge-on"
                initial={false}
                animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                style={id === "cmp-out" && done ? { stroke: verdictColor } : undefined}
              />
              {flowing.has(id) &&
                [0, 0.33, 0.66].map((delay) => (
                  <circle key={delay} r="3.5" className="packet">
                    <animateMotion dur="1s" repeatCount="indefinite" begin={`${delay}s`} path={d} />
                  </circle>
                ))}
            </g>
          );
        })}

        {nodes.map((n) => {
          const on = active.has(n.id);
          if (n.id === "out") {
            return (
              <g key={n.id} transform={`translate(${n.x},${n.y})`}>
                <motion.circle
                  r="40"
                  className="node-out"
                  initial={false}
                  animate={{ scale: done ? 1 : 0.85, stroke: done ? verdictColor : "#d2d2d7" }}
                  transition={{ type: "spring", stiffness: 300, damping: 18 }}
                  
                />
                <text textAnchor="middle" dy="5" className="node-label" style={done ? { fill: verdictColor, fontWeight: 600 } : undefined}>
                  {done ? (broke ? "Break" : "Match") : n.label}
                </text>
              </g>
            );
          }
          return (
            <g key={n.id} transform={`translate(${n.x - W / 2},${n.y - H / 2})`}>
              <motion.rect
                width={W}
                height={H}
                rx={H / 2}
                className="node"
                initial={false}
                animate={{ stroke: on ? "#0071e3" : "#d2d2d7", fill: on ? "#f0f6ff" : "#ffffff" }}
                transition={{ duration: 0.3 }}
              />
              <text x={W / 2} y={H / 2 + 5} textAnchor="middle" className="node-label">{n.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
