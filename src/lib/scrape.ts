// ─── Site scraper ───────────────────────────────────────────
// Server-only. Fetches a maker's URL and pulls out everything a listing needs
// before any AI is involved: title, meta/OG description, logo, screenshot,
// headings and a chunk of readable body copy.
//
// Deliberately dependency-free regex parsing. The page is untrusted third-party
// HTML, so nothing here executes it — we only read strings out of it, and every
// extracted URL is resolved against the page and forced to http(s).

import { normalizeUrl } from "@/lib/utils";
import { firecrawlScrape, firecrawlConfigured } from "@/lib/firecrawl";

export type ScrapedSite = {
  url: string;
  host: string;
  title: string;
  description: string;
  siteName: string;
  image: string | null;
  favicon: string | null;
  headings: string[];
  text: string;
  /** Whether the fetch itself worked — a failed fetch still returns a shell. */
  ok: boolean;
  /** Which path produced this — for debugging bad scrapes. */
  source: "firecrawl" | "fetch";
  error?: string;
};

// A real browser UA. The founder is importing their OWN site, and an obvious
// "…Bot/1.0" user-agent is exactly what Cloudflare and other WAFs block — which
// makes the scrape fail on sites that open fine in a browser. This is a link
// preview, so a normal desktop-Chrome UA is the right call.
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const MAX_BYTES = 900_000; // plenty for a landing page; stops us pulling an app bundle
const TIMEOUT_MS = 8_000;

export async function scrapeSite(rawUrl: string): Promise<ScrapedSite> {
  const url = normalizeUrl(rawUrl);
  if (!url) throw new Error("That doesn't look like a URL. Try https://yoursite.com");

  const parsed = new URL(url);
  if (!/^https?:$/.test(parsed.protocol)) throw new Error("Only http(s) URLs can be imported.");
  if (isPrivateHost(parsed.hostname)) {
    throw new Error("That address isn't reachable from the public internet.");
  }

  const host = parsed.hostname.replace(/^www\./, "");
  const fallbackFavicon = `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=128`;

  // Preferred path: Firecrawl renders the page and returns clean markdown. Only
  // tried when configured, and any failure quietly falls through to the
  // built-in fetch scraper below — autofill never hard-depends on it.
  if (firecrawlConfigured()) {
    const fc = await firecrawlScrape(url);
    if (fc?.ok) {
      const name = fc.siteName || fc.title.split(/[|—–·-]/)[0] || host.split(".")[0];
      return {
        url,
        host,
        source: "firecrawl",
        ok: true,
        title: fc.title,
        description: fc.description,
        siteName: fc.siteName,
        image: fc.image,
        favicon: fc.favicon || fallbackFavicon,
        // Pull section headings out of the markdown for the category guesser.
        headings: [...fc.markdown.matchAll(/^#{1,3}\s+(.+)$/gm)]
          .map((m) => m[1].replace(/[#*_`]/g, "").trim())
          .filter((t) => t.length > 2 && t.length < 140)
          .slice(0, 14),
        text: markdownToText(fc.markdown).slice(0, 7000),
      };
    }
    // fc null/errored → continue to the fetch path.
  }

  const shell: ScrapedSite = {
    url,
    host,
    source: "fetch",
    title: "",
    description: "",
    siteName: "",
    image: null,
    favicon: fallbackFavicon,
    headings: [],
    text: "",
    ok: false,
  };

  let html = "";
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);

    if (!res.ok) return { ...shell, error: `The site answered ${res.status}.` };
    const type = res.headers.get("content-type") || "";
    if (!type.includes("html")) return { ...shell, error: "That URL isn't an HTML page." };

    html = (await res.text()).slice(0, MAX_BYTES);
  } catch (e: any) {
    return { ...shell, error: e?.name === "AbortError" ? "The site took too long to answer." : "Couldn't reach that site." };
  }

  const meta = (names: string[]) => {
    for (const name of names) {
      const re = new RegExp(
        `<meta[^>]+(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`,
        "i"
      );
      const alt = new RegExp(
        `<meta[^>]+content=["']([^"']*)["'][^>]*(?:property|name)=["']${name}["']`,
        "i"
      );
      const hit = re.exec(html) || alt.exec(html);
      if (hit?.[1]?.trim()) return decode(hit[1].trim());
    }
    return "";
  };

  const titleTag = /<title[^>]*>([\s\S]{0,300}?)<\/title>/i.exec(html)?.[1] || "";
  const headings = [...html.matchAll(/<h[12][^>]*>([\s\S]{0,200}?)<\/h[12]>/gi)]
    .map((m) => stripTags(m[1]))
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && t.length < 140)
    .slice(0, 12);

  const iconHref =
    /<link[^>]+rel=["'][^"']*icon[^"']*["'][^>]*href=["']([^"']+)["']/i.exec(html)?.[1] ||
    /<link[^>]+href=["']([^"']+)["'][^>]*rel=["'][^"']*icon[^"']*["']/i.exec(html)?.[1] ||
    null;

  return {
    ...shell,
    ok: true,
    title: (meta(["og:title", "twitter:title"]) || decode(stripTags(titleTag))).trim().slice(0, 160),
    description: (meta(["og:description", "twitter:description", "description"]) || "")
      .trim()
      .slice(0, 400),
    siteName: meta(["og:site_name"]).slice(0, 80),
    image: absolute(meta(["og:image", "twitter:image", "og:image:url"]), url),
    favicon: absolute(iconHref, url) || shell.favicon,
    headings,
    text: readableText(html).slice(0, 6000),
  };
}

/** Everything the AI is allowed to see, as one compact block. */
export function scrapeDigest(site: ScrapedSite): string {
  return [
    `URL: ${site.url}`,
    site.siteName && `Site name: ${site.siteName}`,
    site.title && `Page title: ${site.title}`,
    site.description && `Meta description: ${site.description}`,
    site.headings.length && `Headings:\n- ${site.headings.join("\n- ")}`,
    site.text && `Page copy:\n${site.text.slice(0, 3500)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

// ─── helpers ────────────────────────────────────────────────

function stripTags(s: string) {
  return decode(s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " "));
}

function decode(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;|&rsquo;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)));
}

/** Strip markdown syntax down to readable prose for the AI and category guess. */
function markdownToText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ") // code fences
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1") // links → their text
    .replace(/^[#>\-*+]\s+/gm, "") // list/heading/quote markers
    .replace(/[*_`~]/g, "") // emphasis
    .replace(/\|/g, " ") // table pipes
    .replace(/\s+\n/g, "\n")
    .replace(/\n{2,}/g, ". ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Body copy with script/style/nav noise removed. */
function readableText(html: string) {
  const body = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] || html;
  return body
    .replace(/<(script|style|noscript|svg|template|iframe)[\s\S]*?<\/\1>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .split(". ")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(". ")
    .trim();
}

function absolute(href: string | null | undefined, base: string): string | null {
  if (!href) return null;
  try {
    const u = new URL(href, base);
    return /^https?:$/.test(u.protocol) ? u.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Refuse to fetch anything that resolves to the private network by name. This
 * is a server making a request the visitor chose, so localhost, link-local and
 * RFC-1918 literals are all out.
 */
function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".internal") || h.endsWith(".local")) {
    return true;
  }
  if (/^\[?::1\]?$/.test(h)) return true;
  const v4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
  }
  return false;
}
