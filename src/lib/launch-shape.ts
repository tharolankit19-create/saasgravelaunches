// ─── Shaping a launch listing ───────────────────────────────
// One place that turns a submitted body into the columns we store, so creating
// a launch and editing a draft can never disagree about what's allowed. Every
// field is clamped, every URL is normalised, and anything unrecognised is
// dropped rather than written through.

import { CATEGORY_NAMES } from "@/lib/categories";
import { normalizeUrl, truncate } from "@/lib/utils";

export type LaunchFields = {
  name: string;
  tagline: string;
  description: string | null;
  website_url: string;
  logo_url: string | null;
  gallery_urls: string[];
  categories: string[];
  pricing_model: string | null;
  who_for: string | null;
  problem: string | null;
  solution: string | null;
  unique_edge: string | null;
  keywords: string[];
  alternatives: string[];
  faq: { q: string; a: string }[];
  maker_note: string | null;
  x_url: string | null;
  linkedin_url: string | null;
  seo_title: string;
  seo_description: string;
};

const text = (v: unknown, max: number) =>
  typeof v === "string" && v.trim() ? truncate(v.trim(), max) : null;

/**
 * Accept a company social however the founder types it — a full URL, a bare
 * domain path, or just the handle — and store one canonical URL. Anything that
 * isn't on the expected host is dropped rather than linked blindly.
 */
function socialUrl(v: unknown, host: string): string | null {
  if (typeof v !== "string" || !v.trim()) return null;
  let raw = v.trim();
  if (raw.startsWith("@")) raw = raw.slice(1);
  if (!/^https?:\/\//i.test(raw)) {
    raw = raw.includes(".") ? `https://${raw}` : `https://${host}/${raw}`;
  }
  try {
    const u = new URL(raw);
    const h = u.hostname.replace(/^www\./, "").toLowerCase();
    const ok = host === "x.com" ? h === "x.com" || h === "twitter.com" : h.endsWith(host);
    if (!ok) return null;
    return u.toString().slice(0, 250);
  } catch {
    return null;
  }
}

/**
 * Validate and shape a submitted listing.
 *
 * @param requireEssentials when false (a saved draft), a half-finished listing
 *   is allowed through — a founder saving to come back later has not failed
 *   validation, they simply aren't done. Publishing always requires all three.
 */
export function shapeLaunch(
  body: any,
  { requireEssentials = true }: { requireEssentials?: boolean } = {}
): { error: string } | { fields: LaunchFields } {
  const name = String(body?.name || "").trim().slice(0, 60);
  const tagline = String(body?.tagline || "").trim().slice(0, 80);
  const website = normalizeUrl(body?.website_url);

  if (requireEssentials) {
    if (!name) return { error: "Your product needs a name." };
    if (!tagline) return { error: "Add a one-line tagline." };
    if (!website) return { error: "That website URL doesn't look right." };
  } else if (!name) {
    // A draft still needs something to be called, or it can't be listed back.
    return { error: "Give your draft a name before saving it." };
  }

  const categories = Array.isArray(body?.categories)
    ? body.categories
        .filter((c: unknown) => typeof c === "string" && CATEGORY_NAMES.includes(c))
        .slice(0, 2)
    : [];

  const keywords = Array.isArray(body?.keywords)
    ? body.keywords
        .filter((k: unknown) => typeof k === "string")
        .map((k: string) => k.trim().slice(0, 60))
        .slice(0, 8)
    : [];

  // Screenshots the maker uploaded (public Supabase storage URLs) plus any OG
  // image autofill seeded. Keep only real http(s) URLs, cap at five.
  const gallery = Array.isArray(body?.gallery_urls)
    ? body.gallery_urls
        .filter((u: unknown): u is string => typeof u === "string")
        .map((u: string) => normalizeUrl(u))
        .filter((u: string | null): u is string => Boolean(u))
        .slice(0, 5)
    : [];

  const alternatives = Array.isArray(body?.alternatives)
    ? body.alternatives
        .filter((a: unknown) => typeof a === "string")
        .map((a: string) => a.trim().slice(0, 40))
        .slice(0, 3)
    : [];

  // FAQ: keep only well-formed {q,a} pairs the autofill produced.
  const faq = Array.isArray(body?.faq)
    ? (body.faq
        .map((it: unknown) => {
          const o = it as Record<string, unknown>;
          const q = typeof o?.q === "string" ? o.q.trim().slice(0, 160) : "";
          const a = typeof o?.a === "string" ? o.a.trim().slice(0, 500) : "";
          return q && a ? { q, a } : null;
        })
        .filter(Boolean)
        .slice(0, 6) as { q: string; a: string }[])
    : [];

  const description = text(body?.description, 700);

  return {
    fields: {
      name,
      tagline,
      description,
      website_url: website || "",
      logo_url: normalizeUrl(body?.logo_url),
      gallery_urls: gallery,
      categories: categories.length ? categories : ["Other"],
      pricing_model: text(body?.pricing_model, 20),
      who_for: text(body?.who_for, 120),
      problem: text(body?.problem, 400),
      solution: text(body?.solution, 400),
      unique_edge: text(body?.unique_edge, 400),
      keywords,
      alternatives,
      faq,
      maker_note: text(body?.maker_note, 800),
      // Company socials — both optional, stored as full URLs so the product
      // page can link straight out.
      x_url: socialUrl(body?.x_url, "x.com"),
      linkedin_url: socialUrl(body?.linkedin_url, "linkedin.com"),
      seo_title: `${name} — ${tagline}`.slice(0, 70),
      seo_description: text(body?.description, 155) || `${name}: ${tagline}`.slice(0, 155),
    },
  };
}
