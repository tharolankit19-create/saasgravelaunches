// ─── Autofill ───────────────────────────────────────────────
// Paste a URL, get a genuinely finished listing. Two stages:
//
//   1. Scrape the page — Firecrawl (clean rendered markdown) when configured,
//      otherwise the built-in fetch scraper. Either way we get title, meta,
//      OG image, favicon, headings and readable body copy.
//   2. Ask a small model to turn that into HIGH-QUALITY listing fields: a real
//      tagline, a specific description, the audience, the problem/solution/edge
//      in the maker's own terms, an FAQ, and "alternative to X" competitors —
//      the fields that make the SEO page rank and that a founder would
//      otherwise spend an hour writing.
//
// If the AI is unset, rate-limited or returns nonsense, stage 1's values are
// used on their own. The maker always lands on a filled-in form, never an
// error — that's the whole point.

import { aiConfigured, aiJson } from "@/lib/ai";
import { scrapeDigest, scrapeSite, type ScrapedSite } from "@/lib/scrape";
import { CATEGORIES } from "@/lib/categories";
import { truncate } from "@/lib/utils";

export type FaqItem = { q: string; a: string };

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
  /** High-value SEO fields the model drafts so the founder doesn't have to. */
  faq: FaqItem[];
  alternatives: string[];
  /** Which stages actually contributed, so the UI can be honest about it. */
  source: { scraped: boolean; ai: boolean; via?: string; note?: string };
};

const PRICING_MODELS = ["free", "freemium", "trial", "paid"];

/**
 * Phase 1 — what the page itself already tells us. No model, so it comes back
 * in a second or two and the founder watches the form fill immediately instead
 * of staring at a spinner while a free model queues.
 */
export async function autofillQuick(rawUrl: string): Promise<AutofillResult> {
  const site = await scrapeSite(rawUrl);
  return {
    ...fromScrape(site),
    source: { scraped: site.ok, ai: false, via: site.source, note: site.ok ? undefined : site.error },
  };
}

/** Phase 2 — the full pass, with the model. Reuses the cached scrape. */
export async function autofillFromUrl(rawUrl: string): Promise<AutofillResult> {
  const site = await scrapeSite(rawUrl);
  const base = fromScrape(site);

  if (!site.ok) {
    return { ...base, source: { scraped: false, ai: false, via: site.source, note: site.error } };
  }
  if (!aiConfigured()) {
    return {
      ...base,
      source: { scraped: true, ai: false, via: site.source, note: "AI is not configured." },
    };
  }

  try {
    const drafted = await aiJson<Partial<Record<string, unknown>>>(prompt(site), {
      system:
        "You are a senior product marketer writing a directory listing. You are specific and concrete, you use only the facts given, and you never pad with filler. You reply with a single JSON object and nothing else.",
      maxTokens: 1100,
      temperature: 0.35,
    });
    if (!drafted) {
      return {
        ...base,
        source: { scraped: true, ai: false, via: site.source, note: "The model returned no usable JSON." },
      };
    }
    return { ...merge(base, drafted), source: { scraped: true, ai: true, via: site.source } };
  } catch (e: any) {
    return { ...base, source: { scraped: true, ai: false, via: site.source, note: e?.message } };
  }
}

// ─── stage 1: what the page already tells us ────────────────

function fromScrape(site: ScrapedSite): Omit<AutofillResult, "source"> {
  const name = (site.siteName || site.title.split(/[|—–·-]/)[0] || site.host.split(".")[0] || "")
    .trim()
    .slice(0, 60);

  const tagline =
    truncate(
      site.description || site.headings[0] || site.title.replace(name, "").replace(/^[\s|—–·-]+/, ""),
      80
    ) || "";

  return {
    name: name ? name[0].toUpperCase() + name.slice(1) : "",
    tagline,
    description: truncate(site.description || site.text, 700),
    website_url: site.url,
    logo_url: site.favicon,
    gallery_urls: site.image ? [site.image] : [],
    categories: guessCategories(`${site.title} ${site.description} ${site.headings.join(" ")} ${site.text}`),
    pricing_model: guessPricing(site.text),
    who_for: "",
    problem: "",
    solution: "",
    unique_edge: "",
    // Real keyword phrases pulled from the page, so the form is never empty even
    // when the AI is unavailable — the model improves on these when it runs.
    keywords: deriveKeywords(site),
    faq: [],
    alternatives: [],
  };
}

const STOPWORDS = new Set(
  ("the a an and or for to of in on with your you our we is are be it that this what how why " +
    "get make build your best free new all can will do your app tool platform software online site " +
    "home page welcome more learn start try use using into from by at as no not so if then than").split(
    /\s+/
  )
);

/**
 * Keyword phrases without a model: the most repeated 2–3 word phrases across the
 * title, headings and body, minus stopwords. Not as sharp as the AI's, but real
 * search phrases the page actually uses — never generic single words.
 */
function deriveKeywords(site: ScrapedSite): string[] {
  const source = `${site.title}. ${site.headings.join(". ")}. ${site.description}. ${site.text}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ");
  const words = source.split(/\s+/).filter(Boolean);

  const counts = new Map<string, number>();
  for (let i = 0; i < words.length - 1; i++) {
    const a = words[i];
    const b = words[i + 1];
    const c = words[i + 2];
    if (STOPWORDS.has(a) || a.length < 3) continue;
    if (!STOPWORDS.has(b) && b.length > 2) {
      const bi = `${a} ${b}`;
      counts.set(bi, (counts.get(bi) || 0) + 1);
      if (c && !STOPWORDS.has(c) && c.length > 2) {
        const tri = `${a} ${b} ${c}`;
        counts.set(tri, (counts.get(tri) || 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .filter(([, n]) => n >= 2)
    .sort((x, y) => y[1] - x[1] || y[0].length - x[0].length)
    .slice(0, 6)
    .map(([phrase]) => phrase);
}

function guessCategories(text: string): string[] {
  const haystack = text.toLowerCase();
  const hits = CATEGORIES.filter((c) => c.match.some((m) => haystack.includes(m))).map((c) => c.name);
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

// ─── stage 2: the model's draft ─────────────────────────────

function prompt(site: ScrapedSite): string {
  return `You are a senior product marketer AND an SEO specialist. Write a complete, launch-ready directory listing for the product below, using what was scraped from its own site. This listing is the founder's public page and must rank — so every field is written to be specific, keyword-rich and genuinely useful, never filler.

Hard rules:
- Fill EVERY field. The material almost always supports who_for, problem, solution and unique_edge — infer them from what the product plainly does. Only return "" when the page truly gives you nothing on that point.
- Use ONLY facts present in the material. Never invent metrics, prices, customers, funding, integrations or awards.
- Be concrete. Name the exact job it does and exactly who does it. Ban these words and anything like them: revolutionary, seamless, powerful, cutting-edge, game-changing, one-stop, supercharge, effortless, unleash, elevate, next-generation, robust, innovative, streamline.
- The tagline is the single most important line for SEO and click-through: lead with the outcome or the exact job, include the category noun a buyer would search, 30–65 characters, Title case optional, NO trailing period, no emoji, no exclamation mark. Bad: "The best all-in-one platform". Good: "Cold-email warmup that lands you in the inbox".
- Keywords/tags carry the SEO. Return AT LEAST 5 and up to 7. Each is a phrase a real buyer would actually type (2–4 words), specific to this product and its category. Mix three kinds: what it is ("cold email warmup tool"), the job it does ("land in primary inbox"), and who it's for ("outbound for solo founders"). NEVER single generic words like "tool", "app", "software", "platform", "AI".
- Write for the founder, in their product's own vocabulary — reuse the exact nouns their site uses for the thing they built. If their site says "workspace", don't say "dashboard".

Reply with ONLY this JSON object, nothing before or after:
{
  "name": "the product's real name, 1-4 words",
  "tagline": "outcome + category, 30-65 characters, no trailing period",
  "description": "3-4 specific sentences: what it is, who it's for, what it replaces, and the one concrete thing it does best. 320-600 characters",
  "who_for": "the exact audience, under 12 words (e.g. 'solo founders running their own cold outbound')",
  "problem": "the real, specific problem it removes, 1-2 sentences grounded in the copy",
  "solution": "concretely how it solves that — the actual mechanism, 1-2 sentences",
  "unique_edge": "the one thing that sets it apart from the obvious alternative, 1-2 sentences",
  "categories": ["1-2 from EXACTLY this list: ${CATEGORIES.map((c) => c.name).join(", ")}"],
  "pricing_model": "one of free, freemium, trial, paid, or \\"\\" if unclear",
  "keywords": ["AT LEAST 5, up to 7 specific 2-4 word search phrases a buyer would type"],
  "alternatives": ["0-3 well-known products this is an alternative to, ONLY if clearly implied"],
  "faq": [
    {"q": "a real question a buyer would ask before signing up", "a": "a direct 1-2 sentence answer from the facts"},
    {"q": "another genuine buyer question", "a": "..."},
    {"q": "a third", "a": "..."}
  ]
}

MATERIAL:
${scrapeDigest(site)}`;
}

/** The model's tags first, topped up from the page-derived ones, de-duped. */
function atLeastThree(fromAi: string[], derived: string[]): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const k of [...fromAi, ...derived]) {
    const key = k.toLowerCase().trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(k);
    if (out.length >= 7) break;
  }
  return out;
}

function merge(
  base: Omit<AutofillResult, "source">,
  ai: Partial<Record<string, unknown>>
): Omit<AutofillResult, "source"> {
  const str = (k: string, max: number) => {
    const v = ai[k];
    return typeof v === "string" ? truncate(v.trim(), max) : "";
  };
  const list = (k: string, max: number, itemMax = 60) => {
    const v = ai[k];
    if (!Array.isArray(v)) return [];
    return v
      .filter((x): x is string => typeof x === "string")
      .map((x) => truncate(x.trim(), itemMax))
      .filter(Boolean)
      .slice(0, max);
  };

  const pricing = str("pricing_model", 20).toLowerCase();
  const validCats = new Set(CATEGORIES.map((c) => c.name.toLowerCase()));
  const cats = list("categories", 2).filter((c) => validCats.has(c.toLowerCase()));

  // FAQ: keep only well-formed pairs, cap at four.
  const faq: FaqItem[] = Array.isArray(ai.faq)
    ? (ai.faq as unknown[])
        .map((it) => {
          const o = it as Record<string, unknown>;
          const q = typeof o?.q === "string" ? truncate(o.q.trim(), 120) : "";
          const a = typeof o?.a === "string" ? truncate(o.a.trim(), 400) : "";
          return q && a ? { q, a } : null;
        })
        .filter((x): x is FaqItem => Boolean(x))
        .slice(0, 4)
    : [];

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
    // Tags are the SEO surface, so never ship fewer than three: take the
    // model's phrases and top up from the ones derived off the page.
    keywords: atLeastThree(list("keywords", 7, 60), base.keywords),
    alternatives: list("alternatives", 3, 40),
    faq,
  };
}
