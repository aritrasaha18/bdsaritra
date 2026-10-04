import type { Config } from "@netlify/functions";
import { education, experience, profile, projects, publications, skills } from "../../src/data/profile.ts";

export default async () => {
  const lines = [
    `# ${profile.name}`,
    "",
    `> ${profile.role}, ${profile.location}. ${profile.summary}`,
    "",
    `Email: ${profile.email}`,
    `LinkedIn: ${profile.links.linkedin}`,
    `GitHub: ${profile.links.github}`,
    `Google Scholar: ${profile.links.scholar}`,
    `Resume: https://bdsaritra.netlify.app${profile.links.resume}`,
    `MCP server: https://bdsaritra.netlify.app/mcp`,
    "",
    "## Experience",
    ...experience.flatMap((r) => [
      "",
      `### ${r.title}, ${r.org} (${r.start} – ${r.end})`,
      ...r.highlights.map((h) => `- ${h}`),
    ]),
    "",
    "## Education",
    `${education.degree}, ${education.school} (${education.years}), GPA ${education.gpa}. ${education.note}`,
    "",
    "## Projects",
    ...projects.map((p) => `- [${p.name}](${p.url}): ${p.blurb} (${p.stack})`),
    "",
    "## Papers",
    ...publications.map((p) => `- [${p.title}](${p.url}), ${p.venue}. ${p.authors}`),
    "",
    "## Skills",
    ...Object.entries(skills).map(([k, v]) => `- ${k}: ${v.join(", ")}`),
    "",
  ];
  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
};

export const config: Config = { path: "/llms.txt" };
