# bdsaritra.netlify.app

Personal site for B D S Aritra. Vite + React + TypeScript + Motion, with a raw WebGL hero shader.

- `src/data/profile.ts` is the single source of truth. Edit it to change the site, `/llms.txt` and the `/mcp` endpoint at once.
- `netlify/functions/mcp.mts` is a stateless, read-only MCP server at `/mcp`.
- `netlify/functions/llms.mts` serves `/llms.txt`.

```bash
npm install
npm run dev          # site only
npx netlify dev      # site + functions
npm run build
```
