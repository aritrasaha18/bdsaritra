import { useEffect, useMemo, useRef, useState } from "react";
import { profile } from "../data/profile";

type Action = { id: string; label: string; hint?: string; run: () => void };

const go = (hash: string) => () => {
  document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" });
  history.replaceState(null, "", hash);
};
const open = (url: string) => () => window.open(url, "_blank", "noopener");

export default function CommandPalette({ open: isOpen, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const actions: Action[] = useMemo(
    () => [
      { id: "work", label: "See how I work", hint: "Demo", run: go("#demo") },
      { id: "exp", label: "Experience", run: go("#experience") },
      { id: "proj", label: "Projects and papers", run: go("#projects") },
      { id: "mcp", label: "Connect your AI agent to this site", hint: "MCP", run: go("#mcp") },
      { id: "resume", label: "Open resume (PDF)", run: open(profile.links.resume) },
      { id: "email", label: "Email me", hint: profile.email, run: () => (location.href = `mailto:${profile.email}`) },
      {
        id: "copy",
        label: "Copy email address",
        run: () => {
          navigator.clipboard?.writeText(profile.email);
          setCopied(true);
        },
      },
      { id: "cal", label: "Schedule a call", hint: "Calendly", run: open(profile.links.calendly) },
      { id: "li", label: "LinkedIn", run: open(profile.links.linkedin) },
      { id: "gh", label: "GitHub", run: open(profile.links.github) },
    ],
    [],
  );

  const list = actions.filter((a) => (a.label + " " + (a.hint ?? "")).toLowerCase().includes(q.toLowerCase()));

  useEffect(() => {
    if (isOpen) {
      setQ("");
      setIdx(0);
      setCopied(false);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const exec = (a?: Action) => {
    if (!a) return;
    a.run();
    if (a.id !== "copy") onClose();
  };

  return (
    <div className="palette-scrim" onMouseDown={onClose}>
      <div
        className="palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, list.length - 1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
          if (e.key === "Enter") { e.preventDefault(); exec(list[idx]); }
        }}
      >
        <input
          ref={input}
          value={q}
          onChange={(e) => { setQ(e.target.value); setIdx(0); }}
          placeholder="Type a command or search"
          aria-label="Search commands"
          aria-controls="palette-list"
          aria-activedescendant={list[idx] ? `cmd-${list[idx].id}` : undefined}
        />
        <ul id="palette-list" role="listbox">
          {list.map((a, i) => (
            <li
              key={a.id}
              id={`cmd-${a.id}`}
              role="option"
              aria-selected={i === idx}
              onMouseEnter={() => setIdx(i)}
              onClick={() => exec(a)}
            >
              <span>{a.id === "copy" && copied ? "Copied" : a.label}</span>
              {a.hint && <span className="hint">{a.hint}</span>}
            </li>
          ))}
          {list.length === 0 && <li className="palette-empty">No matches. Try “email” or “resume”.</li>}
        </ul>
      </div>
    </div>
  );
}
