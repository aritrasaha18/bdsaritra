import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type Field = { label: string; doc: string; booked: string };
type Sample = { id: string; name: string; kind: string; fields: Field[] };

const samples: Sample[] = [
  {
    id: "clean",
    name: "FX forward, clean",
    kind: "FX forward",
    fields: [
      { label: "Counterparty", doc: "Northwind Capital LP", booked: "Northwind Capital LP" },
      { label: "Trade date", doc: "14 Sep 2026", booked: "14 Sep 2026" },
      { label: "Currency pair", doc: "EUR/USD", booked: "EUR/USD" },
      { label: "Notional", doc: "EUR 25,000,000", booked: "EUR 25,000,000" },
      { label: "Forward rate", doc: "1.0842", booked: "1.0842" },
      { label: "Value date", doc: "16 Dec 2026", booked: "16 Dec 2026" },
    ],
  },
  {
    id: "break",
    name: "Interest rate swap, one break",
    kind: "Interest rate swap",
    fields: [
      { label: "Counterparty", doc: "Halcyon Pension Fund", booked: "Halcyon Pension Fund" },
      { label: "Trade date", doc: "22 Sep 2026", booked: "22 Sep 2026" },
      { label: "Notional", doc: "USD 50,000,000", booked: "USD 50,000,000" },
      { label: "Fixed rate", doc: "3.415%", booked: "3.451%" },
      { label: "Floating leg", doc: "SOFR + 0 bp", booked: "SOFR + 0 bp" },
      { label: "Maturity", doc: "24 Sep 2031", booked: "24 Sep 2031" },
    ],
  },
];

const toolCalls = [
  "read_confirmation(document)",
  "classify_trade_type()",
  "find_booked_trade(counterparty, trade_date)",
  "get_counterparty_profile()",
  "compare_economics(document, booking)",
];

type Phase = "idle" | "tools" | "fields" | "done";

export default function ReconDemo() {
  const reduce = useReducedMotion();
  const [sampleId, setSampleId] = useState(samples[0].id);
  const [phase, setPhase] = useState<Phase>("idle");
  const [toolsShown, setToolsShown] = useState(0);
  const [fieldsShown, setFieldsShown] = useState(0);
  const timers = useRef<number[]>([]);
  const sample = samples.find((s) => s.id === sampleId)!;
  const breaks = sample.fields.filter((f) => f.doc !== f.booked);

  const clear = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  useEffect(() => clear, []);

  const run = () => {
    clear();
    if (reduce) {
      setToolsShown(toolCalls.length);
      setFieldsShown(sample.fields.length);
      setPhase("done");
      return;
    }
    setPhase("tools");
    setToolsShown(0);
    setFieldsShown(0);
    let t = 0;
    toolCalls.forEach((_, i) => {
      t += 420;
      timers.current.push(window.setTimeout(() => setToolsShown(i + 1), t));
    });
    t += 300;
    timers.current.push(window.setTimeout(() => setPhase("fields"), t));
    sample.fields.forEach((_, i) => {
      t += 260;
      timers.current.push(window.setTimeout(() => setFieldsShown(i + 1), t));
    });
    t += 450;
    timers.current.push(window.setTimeout(() => setPhase("done"), t));
  };

  const pick = (id: string) => {
    clear();
    setSampleId(id);
    setPhase("idle");
    setToolsShown(0);
    setFieldsShown(0);
  };

  const running = phase === "tools" || phase === "fields";

  return (
    <div className="recon">
      <div className="recon-controls">
        <div className="recon-samples" role="radiogroup" aria-label="Sample confirmation">
          {samples.map((s) => (
            <button
              key={s.id}
              role="radio"
              aria-checked={s.id === sampleId}
              className="chip"
              onClick={() => pick(s.id)}
              disabled={running}
            >
              {s.name}
            </button>
          ))}
        </div>
        <button className="btn btn-solid" onClick={run} disabled={running}>
          {running ? "Checking…" : phase === "done" ? "Run again" : "Check this confirmation"}
        </button>
      </div>

      <div className="recon-grid">
        <div className="recon-doc" aria-label="Sample confirmation document">
          <p className="doc-head">Trade confirmation</p>
          <p className="doc-kind">{sample.kind}</p>
          <dl>
            {sample.fields.map((f) => (
              <div key={f.label}>
                <dt>{f.label}</dt>
                <dd>{f.doc}</dd>
              </div>
            ))}
          </dl>
          <p className="doc-foot">Sample data. Not a real trade.</p>
        </div>

        <div className="recon-work" aria-live="polite">
          {phase === "idle" && (
            <p className="recon-empty">
              Pick a sample and run the check. The agent reads the confirmation, finds the
              booked trade, and compares every economic field.
            </p>
          )}

          {phase !== "idle" && (
            <ol className="tools">
              <AnimatePresence initial={false}>
                {toolCalls.slice(0, toolsShown).map((c, i) => (
                  <motion.li
                    key={c}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="tool-step">{i + 1}</span>
                    <code>{c}</code>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}

          {(phase === "fields" || phase === "done") && (
            <table className="fields">
              <thead>
                <tr>
                  <th scope="col">Field</th>
                  <th scope="col">Confirmation</th>
                  <th scope="col">Booked</th>
                  <th scope="col"><span className="sr-only">Result</span></th>
                </tr>
              </thead>
              <tbody>
                {sample.fields.slice(0, fieldsShown).map((f) => {
                  const ok = f.doc === f.booked;
                  return (
                    <motion.tr
                      key={f.label}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={ok ? "" : "is-break"}
                    >
                      <th scope="row">{f.label}</th>
                      <td>{f.doc}</td>
                      <td>{f.booked}</td>
                      <td>{ok ? "Match" : "Break"}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {phase === "done" && (
            <motion.p
              className={breaks.length ? "verdict verdict-break" : "verdict"}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {breaks.length
                ? `1 break: the ${breaks[0].label.toLowerCase()} differs (${breaks[0].doc} vs ${breaks[0].booked}). Routed to an analyst with both values side by side.`
                : "All fields match. Confirmed with no one touching it."}
            </motion.p>
          )}
        </div>
      </div>
    </div>
  );
}
