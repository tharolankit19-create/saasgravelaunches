// ─── Firecrawl ──────────────────────────────────────────────
// Server-only. Firecrawl renders a page (JS included) and returns clean
// main-content markdown plus normalised metadata — far better raw material for
// the AI than the regex scraper, especially for the SPA landing pages most SaaS
// products actually ship.
//
// This is strictly an upgrade path: it's only used when FIRECRAWL_API_KEY is
// set, and `scrapeSite` falls back to the built-in fetch+regex scraper when the
// key is absent or Firecrawl errors. Autofill therefore never depends on it.
// Docs: https://docs.firecrawl.dev

export type FirecrawlResult = {
  markdown: string;
  title: string;
  description: string;
  siteName: string;
  image: string | null;
  favicon: string | null;
  ok: boolean;
  error?: string;
};

const ENDPOINT = "https://api.firecrawl.dev/v1/scrape";
// Kept tight on purpose: a founder is watching the launch form while this runs.
// If Firecrawl can't render the page in this window we fall through to the
// built-in fetch scraper rather than making them wait.
const TIMEOUT_MS = 12_000;

export function firecrawlConfigured(): boolean {
  return Boolean(process.env.FIRECRAWL_API_KEY?.trim());
}

export async function firecrawlScrape(url: string): Promise<FirecrawlResult | null> {
  const key = process.env.FIRECRAWL_API_KEY?.trim();
  if (!key) return null;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        // Main content only, as markdown — drops nav/footer/cookie-banner noise
        // that otherwise dominates a scrape and confuses the model.
        formats: ["markdown"],
        onlyMainContent: true,
        removeBase64Images: true,
        timeout: 10000,
        blockAds: true,
      }),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error(`firecrawl ${res.status}: ${text.slice(0, 200)}`);
      return { ...empty(), error: `Firecrawl answered ${res.status}` };
    }

    const json: any = await res.json();
    const data = json?.data || json;
    const meta = data?.metadata || {};

    const markdown = typeof data?.markdown === "string" ? data.markdown : "";
    if (!markdown && !meta.title) {
      return { ...empty(), error: "Firecrawl returned nothing usable" };
    }

    return {
      ok: true,
      markdown: markdown.slice(0, 12000),
      title: str(meta.ogTitle || meta.title).slice(0, 160),
      description: str(meta.ogDescription || meta.description).slice(0, 400),
      siteName: str(meta.ogSiteName).slice(0, 80),
      image: absolute(meta.ogImage || meta.image, url),
      favicon: absolute(meta.favicon, url),
    };
  } catch (e: any) {
    if (e?.name === "AbortError") return { ...empty(), error: "Firecrawl timed out" };
    console.error("firecrawl:", e?.message || e);
    return { ...empty(), error: "Firecrawl request failed" };
  } finally {
    clearTimeout(timer);
  }
}

function empty(): FirecrawlResult {
  return { ok: false, markdown: "", title: "", description: "", siteName: "", image: null, favicon: null };
}

function str(v: unknown): string {
  if (typeof v === "string") return v.trim();
  if (Array.isArray(v) && typeof v[0] === "string") return v[0].trim();
  return "";
}

function absolute(href: unknown, base: string): string | null {
  if (typeof href !== "string" || !href.trim()) return null;
  try {
    const u = new URL(href, base);
    return /^https?:$/.test(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}
