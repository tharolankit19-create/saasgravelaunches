// ─── Badge verification ─────────────────────────────────────
// A free launch goes live only when the maker's own site really links back to
// this board. That check is the only thing standing between the board and a
// wall of one-way listings, so it has to be precise.
//
// The check this replaces looked for bare substrings — "/products/<slug>",
// "slug=<slug>" — anywhere in the HTML. It never required the link to point at
// US, so a maker whose own site happened to have a /products/<slug> path (the
// slug is derived from their product's name, so this is common, not exotic)
// verified without ever adding the badge.
//
// So: parse the real href/src values, resolve them against the page they were
// found on, and demand a URL on our host that names this specific launch.

/** Hosts a badge link may legitimately point at. */
function allowedHosts(siteUrl: string): Set<string> {
  const hosts = new Set<string>(["ls.saasgrave.org"]);
  try {
    hosts.add(new URL(siteUrl).hostname.toLowerCase().replace(/^www\./, ""));
  } catch {
    /* fall back to the production host alone */
  }
  return hosts;
}

/** Every href/src value in the document, quoted or not. */
function extractUrls(html: string): string[] {
  const out: string[] = [];
  const re = /\b(?:href|src|content)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s">]+))/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    const v = (m[1] ?? m[2] ?? m[3] ?? "").trim();
    if (v) out.push(v);
    if (out.length > 4000) break; // a page with more links than this is noise
  }
  return out;
}

/**
 * Does this page carry a real badge link back to `slug` on our site?
 *
 * @param html    the raw HTML of the maker's page
 * @param pageUrl the URL that HTML was fetched from (resolves relative links)
 * @param siteUrl our own base URL
 * @param slug    the launch the badge must name
 */
export function hasBadgeLink(
  html: string,
  pageUrl: string,
  siteUrl: string,
  slug: string
): boolean {
  const hosts = allowedHosts(siteUrl);
  const want = slug.toLowerCase();

  for (const raw of extractUrls(html)) {
    let u: URL;
    try {
      u = new URL(raw, pageUrl);
    } catch {
      continue;
    }
    if (u.protocol !== "http:" && u.protocol !== "https:") continue;

    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    if (!hosts.has(host)) continue; // must point at us, not at their own site

    const path = decodeURIComponent(u.pathname).toLowerCase().replace(/\/+$/, "");

    // The anchor the badge snippet gives them: /products/<slug>
    if (path === `/products/${want}`) return true;
    // The badge image: /api/badge?slug=<slug>, or the path form.
    if (path === "/api/badge" && (u.searchParams.get("slug") || "").toLowerCase() === want) {
      return true;
    }
    if (path === `/api/badge/${want}` || path === `/badge/${want}`) return true;
  }

  return false;
}
