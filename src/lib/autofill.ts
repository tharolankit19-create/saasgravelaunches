// ─── Autofill ───────────────────────────────────────────────
// Paste a URL, get a filled-in listing. Two stages, and the second is optional:
//
//   1. Scrape the page for the facts that are already there — title, meta
//      description, OG image, favicon, headings, body copy.
//   2. Ask a small model to turn those facts into the fields a listing needs.
//
// If the AI is unset, rate-limited or returns nonsense, stage 1's values are
// used on their own. The maker always lands on a form they can edit, never on
// an error — that's the whole point of the feature.

import { aiConfigured, aiJson } from "@/lib/ai";
import { scrapeDigest, scrapeSite, type ScrapedSite } from "@/lib/scrape";
import { CATEGORIES } from "@/lib/categories";
import { truncate } from "@/lib/utils";

export type AutofillResult = {
  name: string;
  tagline: string;
  description: string;
  website_url: string;
  logo_url: string | null;
  gallery_urls: string[];
  categories: string[];
  pricing_model: string | null;
  who_for: string;
  problem: string;
  solution: string;
  unique_edge: string;
  keywords: string[];
  /** Which stages actually contributed, so the UI can be honest about it. */
  source: { scraped: boolean; ai: boolean; note?: string };
};

const PRICING_MODELS = ["free", "freemium", "trial", "paid"];

export async function autofillFromUrl(rawUrl: string): Promise<AutofillResult> {
  const site = await scrapeSite(rawUrl);
  const base = fromScrape(site);

  if (!site.ok) {
    return { ...base, source: { scraped: false, ai: false, note: site.error } };
  }
  if (!aiConfigured()) {
    return { ...base, source: { scraped: true, ai: false, note: "AI is not configured." } };
  }

  try {
    const drafted = await aiJson<Partial<Record<string, unknown>>>(prompt(site), {
      system:
        "You write concise, factual product listings for a launch directory. You only use facts you are given. You reply with a single JSON object and nothing else.",
      maxTokens: 800,
      temperature: 0.3,
    });
    if (!drafted) {
      return { ...base, source: { scraped: true, ai: false, note: "The model returned no usable JSON." } };
    }
    return { ...merge(base, drafted), source: { scraped: true, ai: true } };
  } catch (e: any) {
    return { ...base, source: { scraped: true, ai: false, note: e?.message } };
  }
}

// ─── stage 1: what the page already tells us ────────────────

function fromScrape(site: ScrapedSite): Omit<AutofillResult, "source"> {
  const name = (site.siteName || site.title.split(/[|—–·-]/)[0] || site.host.split(".")[0] || "")
    .trim()
    .slice(0, 60);

  const tagline =
    truncate(site.description || site.headings[0] || site.title.replace(name, "").replace(/^[\s|—–·-]+/, ""), 80) || "";

  return {
    name: name ? name[0].toUpperCase() + name.slice(1) : "",
    tagline,
    description: truncate(site.description || site.text, 700),
    website_url: site.url,
    logo_url: site.favicon,
    gallery_urls: site.image ? [site.image] : [],
    categories: guessCategories(`${site.title} ${site.description} ${site.headings.join(" ")}`),
    pricing_model: guessPricing(site.text),
    who_for: "",
    problem: "",
    solution: "",
    unique_edge: "",
    keywords: [],
  };
}

function guessCategories(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits = CATEGORIES.filter((c) =>
    c.match.some((m) => haystack.includes(m))
  ).map((c) => c.name);
  return hits.slice(0, 2);
}

function guessPricing(text: string): string | null {
  const t = text.toLowerCase();
  if (/\bfree trial\b|\btrial\b/.test(t)) return "trial";
  if (/\bfree plan\b|\bfree tier\b|\bfreemium\b|free forever/.test(t)) return "freemium";
  if (/\$\d|\bper month\b|\/mo\b|\bpricing\b|\bsubscribe\b/.test(t)) return "paid";
  if (/\bfree\b|\bopen source\b/.test(t)) return "free";
  return null;
}

// ─── stage 2: the model's draft, merged conservatively ──────

function prompt(site: ScrapedSite): string {
  return `Below is everything scraped from a product's website. Write its listing for a launch directory.

Rules:
- Use ONLY facts present below. Never invent metrics, prices, customers or claims.
- Plain, specific language. No marketing fluff, no emojis, no exclamation marks.
- If a field cannot be answered from the facts, return "" for it. An empty field is better than a guessed one.

Reply with ONLY this JSON object:
{
  "name": "the product's name, 1-4 words",
  "tagline": "what it does, max 80 characters, no trailing period",
  "description": "2-4 sentences on what it is and who uses it, max 600 characters",
  "who_for": "the audience in under 12 words",
  "problem": "the problem it solves, 1-2 sentences",
  "solution": "how it solves that, 1-2 sentences",
  "unique_edge": "what makes it different, 1-2 sentences",
  "categories": ["pick 1-2 from: ${CATEGORIES.map((c) => c.name).join(", ")}"],
  "pricing_model": "one of: free, freemium, trial, paid, or \\"\\" if unclear",
  "keywords": ["3-6 short search phrases someone would type to find this"]
}

FACTS:
${scrapeDigest(site)}`;
}

function merge(
  base: Omit<AutofillResult, "source">,
  ai: Partial<Record<string, unknown>>
): Omit<AutofillResult, "source"> {
  const str = (k: string, max: number) => {
    const v = ai[k];
    return typeof v === "string" ? truncate(v.trim(), max) : "";
  };
  const list = (k: string, max: number) => {
    const v = ai[k];
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is string => typeof x === "string")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, max);
  };

  const pricing = str("pricing_model", 20).toLowerCase();
  const validCats = new Set(CATEGORIES.map((c) => c.name.toLowerCase()));
  const cats = list("categories", 2).filter((c) => validCats.has(c.toLowerCase()));

  return {
    ...base,
    // A model-written value wins only when it actually said something.
    name: str("name", 60) || base.name,
    tagline: str("tagline", 80).replace(/\.$/, "") || base.tagline,
    description: str("description", 700) || base.description,
    who_for: str("who_for", 120),
    problem: str("problem", 400),
    solution: str("solution", 400),
    unique_edge: str("unique_edge", 400),
    categories: cats.length ? cats : base.categories,
    pricing_model: PRICING_MODELS.includes(pricing) ? pricing : base.pricing_model,
    keywords: list("keywords", 6),
  };
}
