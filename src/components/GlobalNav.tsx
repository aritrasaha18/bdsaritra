import { useEffect, useState } from "react";
import { profile } from "../data/profile";

/** Apple-style local nav: transparent over the hero, frosted once you scroll. */
export default function GlobalNav({ onPalette, kbd }: { onPalette: () => void; kbd: string }) {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const on = () => setStuck(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <nav className={stuck ? "gnav is-stuck" : "gnav"} aria-label="Primary">
      <div className="gnav-inner">
        <a href="#top" className="gnav-name">Aritra</a>
        <div className="gnav-links">
          <a href="#demo">Work</a>
          <a href="#experience">Experience</a>
          <a href="#projects">Projects</a>
          <a href="#mcp">MCP</a>
          <button className="gnav-k" onClick={onPalette} aria-label="Open command menu">{kbd}K</button>
          <a className="pill pill-sm" href={`mailto:${profile.email}`}>Email</a>
        </div>
      </div>
    </nav>
  );
}
