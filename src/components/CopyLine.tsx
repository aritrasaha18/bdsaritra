import { useState } from "react";

export default function CopyLine({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <div className="copyline">
      <code>{text}</code>
      <button
        className="btn btn-ghost"
        onClick={() => {
          navigator.clipboard?.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1800);
        }}
        aria-label={label}
      >
        {done ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
