import type { Config } from "@netlify/functions";

// Today's sun from NASA's Solar Dynamics Observatory, AIA 171 Å channel.
// SDO refreshes these every 15 minutes; Netlify's CDN caches our copy for the same interval,
// so NASA's servers see at most a handful of requests an hour no matter how many visitors we get.
// "Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams."
const SIZES = new Set(["1024", "2048"]);

export default async (req: Request) => {
  const size = new URL(req.url).searchParams.get("size") ?? "2048";
  const res = SIZES.has(size) ? size : "2048";
  try {
    const upstream = await fetch(`https://sdo.gsfc.nasa.gov/assets/img/latest/latest_${res}_0171.jpg`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!upstream.ok) throw new Error(`SDO ${upstream.status}`);
    const body = await upstream.arrayBuffer();
    if (body.byteLength < 20_000) throw new Error("SDO image too small");
    return new Response(body, {
      headers: {
        "content-type": "image/jpeg",
        "cache-control": "public, max-age=900",
        "netlify-cdn-cache-control": "public, durable, s-maxage=900, stale-while-revalidate=86400",
        "x-credit": "Courtesy of NASA/SDO and the AIA, EVE, and HMI science teams.",
      },
    });
  } catch (e) {
    // the page falls back to its procedural sun when this fails
    return new Response(`Sun image unavailable: ${(e as Error).message}`, {
      status: 502,
      headers: { "cache-control": "no-store" },
    });
  }
};

export const config: Config = { path: "/sun.jpg" };
