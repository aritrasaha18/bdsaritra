import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring, useReducedMotion } from "motion/react";
import ReconDemo from "./components/ReconDemo";
import CommandPalette from "./components/CommandPalette";
import CopyLine from "./components/CopyLine";
import Dock from "./components/Dock";
import TimeBars from "./components/TimeBars";
import McpConsole from "./components/McpConsole";
import Constellation from "./components/Constellation";
import { HeroTitle, Reveal } from "./components/HeroTitle";
import { education, experience, profile, projects, publications, skills } from "./data/profile";

const Sun = lazy(() => import("./components/Sun"));
const SITE = "https://bdsaritra.netlify.app";
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);
const KBD = isMac ? "⌘" : "Ctrl";

function Timeline() {
  const ref = useRef<HTMLOListElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 75%", "end 55%"] });
  const fill = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  const items = [
    ...experience.map((r) => ({
      key: r.title + r.start, when: `${r.start} – ${r.end}`, title: r.title, org: r.org,
      where: [r.team, r.place].filter(Boolean).join(", "), points: r.highlights,
    })),
    {
      key: "edu", when: education.years, title: education.degree, org: education.school,
      where: `GPA ${education.gpa}`, points: [education.note],
    },
  ];
  return (
    <ol className="timeline" ref={ref}>
      <span className="rail" aria-hidden>
        <motion.span className="rail-fill" style={{ scaleY: reduce ? 1 : fill }} />
      </span>
      {items.map((it) => (
        <li key={it.key}>
          <p className="when">{it.when}</p>
          <div className="tl-body">
            <motion.span
              className="tl-dot"
              aria-hidden
              initial={reduce ? false : { scale: 0.6, backgroundColor: "#c9d3de" }}
              whileInView={{ scale: 1, backgroundColor: "#e3c04b" }}
              viewport={{ once: true, margin: "0px 0px -45% 0px" }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            />
            <h3>{it.title}<span className="org">, {it.org}</span></h3>
            <p className="where">{it.where}</p>
            <ul>{it.points.map((h) => <li key={h}>{h}</li>)}</ul>
          </div>
        </li>
      ))}
    </ol>
  );
}

export default function App() {
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const spotlight = (e: React.PointerEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>

      <header className="hero">
        <Suspense fallback={<div className="sun sun-hero" data-fallback="true" />}>
          <Sun variant="hero" />
        </Suspense>

        <Reveal delay={1.3} className="nav-wrap">
          <nav className="nav" aria-label="Primary">
            <a href="#top" className="nav-name">Aritra</a>
            <div className="nav-links">
              <a href="#demo">Work</a>
              <a href="#projects">Projects</a>
              <a href="#mcp">MCP</a>
              <button className="kbd-btn" onClick={() => setPalette(true)} aria-label="Open command menu">
                <kbd>{KBD}</kbd><kbd>K</kbd>
              </button>
            </div>
          </nav>
        </Reveal>

        <div className="hero-copy" id="top">
          <HeroTitle />
          <Reveal delay={1.25}>
            <p className="lede">{profile.summary}</p>
          </Reveal>
          <Reveal delay={1.45} className="hero-actions">
            <a className="btn btn-sun btn-orbit" href={`mailto:${profile.email}`}><span>Email me</span></a>
            <a className="btn btn-line" href={profile.links.resume} target="_blank" rel="noopener">Resume</a>
            <a className="text-link" href={profile.links.linkedin} target="_blank" rel="noopener">LinkedIn</a>
            <a className="text-link" href={profile.links.github} target="_blank" rel="noopener">GitHub</a>
          </Reveal>
        </div>

        <Reveal delay={2.2} className="hero-caption">
          <p>
            The sun in extreme ultraviolet, rendered live in the colors of NASA's SDO 171 Å channel,
            the imagery behind my first research. Move your cursor to stir the solar wind.
          </p>
        </Reveal>
      </header>

      <Dock onPalette={() => setPalette(true)} kbd={KBD} />

      <main id="main">
        <section id="demo" className="section">
          <div className="section-head">
            <h2>What my work looks like</h2>
            <p>
              Every trade a bank does gets a confirmation from the other side, and someone has to
              check it against what was booked. The platform I built does that check for 1,000+ people
              across every trading middle-office team, with 98% match/break accuracy confirmed by
              middle office.
            </p>
          </div>
          <TimeBars />
          <p className="demo-intro">Here's a small, simplified version of that check. Run it.</p>
          <ReconDemo />
          <p className="fineprint">
            The real system classifies each confirmation across 7 asset classes and 43 trade types,
            then runs up to 25 tool calls per trade across isolated MCP servers, with an eval harness
            and a full audit log behind every answer.
          </p>
        </section>

        <section id="experience" className="section">
          <h2>Experience</h2>
          <Timeline />
        </section>

        <section id="projects" className="section">
          <h2>Projects</h2>
          <ul className="projects">
            {projects.map((p) => (
              <li key={p.name} onPointerMove={spotlight}>
                <a href={p.url} target="_blank" rel="noopener">
                  <h3>{p.name}</h3>
                  <p>{p.blurb}</p>
                  <p className="stack">{p.stack}</p>
                </a>
              </li>
            ))}
          </ul>

          <h2 className="h2-sub">Papers</h2>
          <ul className="papers">
            {publications.map((p) => (
              <li key={p.title}>
                <cite>{p.title}</cite>
                <span>{p.venue}</span>
              </li>
            ))}
          </ul>

          <h2 className="h2-sub">Tools I reach for</h2>
          <dl className="skills">
            {Object.entries(skills).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v.join(", ")}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section id="mcp" className="section section-dark">
          <Constellation />
          <div className="mcp-inner">
            <div className="section-head">
              <h2>Ask your AI agent about me</h2>
              <p>
                I build MCP servers for a living, so this site is one too. Connect it to Claude or any
                MCP client and your agent can read my experience, projects and contact details
                directly, instead of scraping a page. Try it right here first.
              </p>
            </div>
            <McpConsole />
            <p className="step">To connect it in Claude Code:</p>
            <CopyLine
              label="Copy the Claude Code command"
              text={`claude mcp add --transport http aritra ${SITE}/mcp`}
            />
            <p className="step">In claude.ai or any other MCP client, add a custom connector with this URL:</p>
            <CopyLine label="Copy the MCP URL" text={`${SITE}/mcp`} />
            <p className="fineprint">
              Read-only, no sign-in. There's also a plain-text summary at <a href="/llms.txt">/llms.txt</a>.
            </p>
          </div>
        </section>
      </main>

      <footer className="footer">
        <Suspense fallback={null}>
          <Sun variant="horizon" />
        </Suspense>
        <div className="footer-inner">
          <h2>Let's talk</h2>
          <p>Email is the fastest way to reach me. For a longer conversation, grab a time on my calendar.</p>
          <div className="hero-actions">
            <a className="btn btn-sun btn-orbit" href={`mailto:${profile.email}`}><span>{profile.email}</span></a>
            <a className="btn btn-line" href={profile.links.calendly} target="_blank" rel="noopener">Schedule a call</a>
          </div>
          <p className="colophon">
            {profile.location}. Built with React, WebGL and Motion, hosted on Netlify. © {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </>
  );
}
