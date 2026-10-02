import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

type Call = { id: string; label: string; body: { method: string; params?: unknown } };
const calls: Call[] = [
  { id: "list", label: "List tools", body: { method: "tools/list" } },
  { id: "search", label: "Search “TypeScript”", body: { method: "tools/call", params: { name: "search", arguments: { query: "TypeScript" } } } },
  { id: "exp", label: "Get experience", body: { method: "tools/call", params: { name: "get_experience", arguments: {} } } },
];

/** Sends a real JSON-RPC request to this site's /mcp endpoint and types the response out. */
export default function McpConsole() {
  const reduce = useReducedMotion();
  const [req, setReq] = useState("");
  const [full, setFull] = useState("");
  const [shown, setShown] = useState(0);
  const [busy, setBusy] = useState(false);
  const raf = useRef(0);
  const out = useRef<HTMLPreElement>(null);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { out.current?.scrollTo({ top: out.current.scrollHeight }); }, [shown]);

  const run = async (c: Call) => {
    cancelAnimationFrame(raf.current);
    const payload = { jsonrpc: "2.0", id: Date.now() % 1000, ...c.body };
    setReq(JSON.stringify(payload));
    setFull(""); setShown(0); setBusy(true);
    let text: string;
    try {
      const r = await fetch("/mcp", {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      // unwrap tool text so the output reads like data, not escaped JSON
      const content = data?.result?.content?.[0]?.text;
      text = content ? content : JSON.stringify(data.result ?? data, null, 2);
      if (c.id === "list") {
        text = JSON.stringify(
          (data.result.tools as { name: string; description: string }[]).map((t) => ({ name: t.name, description: t.description })),
          null, 2,
        );
      }
    } catch (e) {
      text = `Couldn't reach /mcp (${(e as Error).message}). The endpoint runs on the deployed site, not in local preview.`;
    }
    if (text.length > 2400) text = text.slice(0, 2400) + "\n…";
    setFull(text);
    setBusy(false);
    if (reduce) { setShown(text.length); return; }
    const start = performance.now();
    const step = (now: number) => {
      const n = Math.min(text.length, Math.floor((now - start) * 2.2));
      setShown(n);
      if (n < text.length) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
  };

  return (
    <div className="console">
      <div className="console-bar">
        <span className="console-title">POST /mcp</span>
        <div className="console-actions">
          {calls.map((c) => (
            <button key={c.id} className="chip chip-dark" onClick={() => run(c)} disabled={busy}>{c.label}</button>
          ))}
        </div>
      </div>
      <pre ref={out} className="console-out" aria-live="polite">
        {!req && <span className="console-hint">Pick a request. It goes to the live endpoint, the same one your agent would use.</span>}
        {req && <span className="console-req">{"→ " + req + "\n\n"}</span>}
        {busy && <span className="console-hint">waiting for response…</span>}
        {full && <span>{"← " + full.slice(0, shown)}</span>}
        {full && shown < full.length && <span className="caret" />}
      </pre>
    </div>
  );
}
