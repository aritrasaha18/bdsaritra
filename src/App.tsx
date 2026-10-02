import { lazy, Suspense, useEffect, useState } from "react";
import ReconDemo from "./components/ReconDemo";
import CommandPalette from "./components/CommandPalette";
import CopyLine from "./components/CopyLine";
import { education, experience, profile, projects, publications, skills } from "./data/profile";

const Sun = lazy(() => import("./components/Sun"));
const SITE = "https://bdsaritra.netlify.app";
const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

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

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>

      <header className="hero">
        <Suspense fallback={<div className="sun" data-fallback="true" />}>
          <Sun />
        </Suspense>

        <nav className="nav" aria-label="Primary">
          <a href="#top" className="nav-name">Aritra</a>
          <div className="nav-links">
            <a href="#demo">Work</a>
            <a href="#projects">Projects</a>
            <a href="#mcp">MCP</a>
            <button className="kbd-btn" onClick={() => setPalette(true)} aria-label="Open command menu">
              <kbd>{isMac ? "⌘" : "Ctrl"}</kbd><kbd>K</kbd>
            </button>
          </div>
        </nav>

        <div className="hero-copy" id="top">
          <h1>
            <span className="initials">B D S</span>
            <span>Aritra</span>
          </h1>
          <p className="lede">{profile.summary}</p>
          <div className="hero-actions">
            <a className="btn btn-sun" href={`mailto:${profile.email}`}>Email me</a>
            <a className="btn btn-line" href={profile.links.resume} target="_blank" rel="noopener">Resume</a>
            <a className="text-link" href={profile.links.linkedin} target="_blank" rel="noopener">LinkedIn</a>
            <a className="text-link" href={profile.links.github} target="_blank" rel="noopener">GitHub</a>
          </div>
        </div>

        <p className="hero-caption">
          The sun in extreme ultraviolet, rendered live in the colors of NASA's SDO 171 Å channel,
          the imagery behind my first research.
        </p>
      </header>

      <main id="main">
        <section id="demo" className="section">
          <div className="section-head">
            <h2>What my work looks like</h2>
            <p>
              Every trade a bank does gets a confirmation from the other side, and someone has to
              check it against what was booked. That used to take 15–45 minutes per trade. The
              platform I built does it in under a minute, for 1,000+ people across every trading
              middle-office team, with 98% match/break accuracy confirmed by middle office.
              Here's a small, simplified version of that check.
            </p>
          </div>
          <ReconDemo />
          <p className="fineprint">
            The real system classifies each confirmation across 7 asset classes and 43 trade types,
            then runs up to 25 tool calls per trade across isolated MCP servers, with an eval harness
            and a full audit log behind every answer.
          </p>
        </section>

        <section id="experience" className="section">
          <h2>Experience</h2>
          <ol className="timeline">
            {experience.map((r) => (
              <li key={r.title + r.start}>
                <p className="when">{r.start} – {r.end}</p>
                <div>
                  <h3>{r.title}<span className="org">, {r.org}</span></h3>
                  <p className="where">{[r.team, r.place].filter(Boolean).join(", ")}</p>
                  <ul>
                    {r.highlights.map((h) => <li key={h}>{h}</li>)}
                  </ul>
                </div>
              </li>
            ))}
            <li>
              <p className="when">{education.years}</p>
              <div>
                <h3>{education.degree}<span className="org">, {education.school}</span></h3>
                <p className="where">GPA {education.gpa}</p>
                <ul><li>{education.note}</li></ul>
              </div>
            </li>
          </ol>
        </section>

        <section id="projects" className="section">
          <h2>Projects</h2>
          <ul className="projects">
            {projects.map((p) => (
              <li key={p.name}>
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
          <div className="section-head">
            <h2>Ask your AI agent about me</h2>
            <p>
              I build MCP servers for a living, so this site is one too. Connect it to Claude or any
              MCP client and your agent can read my experience, projects and contact details
              directly, instead of scraping a page.
            </p>
          </div>
          <p className="step">In Claude Code:</p>
          <CopyLine
            label="Copy the Claude Code command"
            text={`claude mcp add --transport http aritra ${SITE}/mcp`}
          />
          <p className="step">
            In claude.ai or any other MCP client, add a custom connector with this URL:
          </p>
          <CopyLine label="Copy the MCP URL" text={`${SITE}/mcp`} />
          <p className="fineprint">
            Tools: get_profile, get_experience, get_projects, search. No sign-in, read-only.
            There's also a plain-text summary at <a href="/llms.txt">/llms.txt</a>.
          </p>
        </section>
      </main>

      <footer className="footer">
        <h2>Let's talk</h2>
        <p>Email is the fastest way to reach me. For a longer conversation, grab a time on my calendar.</p>
        <div className="hero-actions">
          <a className="btn btn-solid" href={`mailto:${profile.email}`}>{profile.email}</a>
          <a className="btn btn-line-dark" href={profile.links.calendly} target="_blank" rel="noopener">Schedule a call</a>
        </div>
        <p className="colophon">
          {profile.location}. Built with React, three.js and Motion, hosted on Netlify. © {new Date().getFullYear()}
        </p>
      </footer>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </>
  );
}
