import type { Config } from "@netlify/functions";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { education, experience, profile, projects, publications, skills } from "../../src/data/profile.ts";

function json(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function buildServer() {
  const server = new McpServer({ name: "bdsaritra", version: "1.0.0" });

  server.registerTool(
    "get_profile",
    {
      title: "Profile",
      description: "Who Aritra is: role, location, summary, contact links, education and skills.",
      annotations: { readOnlyHint: true },
    },
    async () => json({ ...profile, education, skills }),
  );

  server.registerTool(
    "get_experience",
    {
      title: "Experience",
      description: "Aritra's work history with highlights, newest first.",
      annotations: { readOnlyHint: true },
    },
    async () => json(experience),
  );

  server.registerTool(
    "get_projects",
    {
      title: "Projects and papers",
      description: "Side projects with links, plus published research papers.",
      annotations: { readOnlyHint: true },
    },
    async () => json({ projects, publications }),
  );

  server.registerTool(
    "search",
    {
      title: "Search",
      description: "Find anything in Aritra's experience, projects, papers or skills that mentions a keyword, e.g. 'MCP' or 'TypeScript'.",
      inputSchema: { query: z.string().min(1).max(100) },
      annotations: { readOnlyHint: true },
    },
    async ({ query }) => {
      const q = query.toLowerCase();
      const hits: { source: string; text: string }[] = [];
      for (const r of experience)
        for (const h of r.highlights)
          if (h.toLowerCase().includes(q) || r.title.toLowerCase().includes(q))
            hits.push({ source: `${r.title}, ${r.org} (${r.start} – ${r.end})`, text: h });
      for (const p of projects)
        if ((p.name + p.blurb + p.stack).toLowerCase().includes(q))
          hits.push({ source: `Project: ${p.name}`, text: `${p.blurb} (${p.stack}) ${p.url}` });
      for (const p of publications)
        if ((p.title + p.venue).toLowerCase().includes(q)) hits.push({ source: "Paper", text: `${p.title}, ${p.venue}` });
      for (const [k, v] of Object.entries(skills)) {
        const m = v.filter((s) => s.toLowerCase().includes(q));
        if (m.length) hits.push({ source: `Skills: ${k}`, text: m.join(", ") });
      }
      return json(hits.length ? hits : { message: `Nothing mentions "${query}". Try a broader keyword.` });
    },
  );

  return server;
}

export default async (req: Request) => {
  if (req.method === "GET" && !req.headers.get("accept")?.includes("text/event-stream")) {
    return Response.json({
      name: "bdsaritra",
      description: "Read-only MCP server for B D S Aritra's portfolio. POST MCP requests to this URL.",
      tools: ["get_profile", "get_experience", "get_projects", "search"],
    });
  }
  const server = buildServer();
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined, // stateless
    enableJsonResponse: true,
  });
  await server.connect(transport);
  return transport.handleRequest(req);
};

export const config: Config = { path: "/mcp" };
