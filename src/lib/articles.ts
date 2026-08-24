// ─── Premium+ article generation ────────────────────────────
// Server-only. Writes a genuinely useful SEO article about a buyer's product,
// hosted on our domain with dofollow links back to them. Uses the free model
// ladder; if AI is unavailable it falls back to a solid templated article, so
// the deliverable always exists.

import { aiComplete, aiConfigured } from "@/lib/ai";

export type ArticleInput = {
  productName: string;
  productUrl: string;
  tagline?: string;
  category?: string;
};

export type Article = { title: string; subtitle: string; body_md: string };

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const SYSTEM =
  "You are an experienced SaaS writer. You write genuinely useful, honest, specific articles for founders and builders. You never use hype, filler, or fake statistics. No phrases like 'in today's fast-paced world' or 'game-changer'. Short paragraphs, concrete advice, a knowledgeable human voice.";

/**
 * Generate an article. Returns AI output when configured and successful,
 * otherwise a clean templated fallback.
 */
export async function generateArticle(input: ArticleInput): Promise<Article> {
  const { productName, productUrl, tagline, category } = input;

  if (aiConfigured()) {
    const prompt = `Write a ~1100-word SEO article that would help someone searching for a solution like ${productName}${category ? ` (category: ${category})` : ""}.

Product: ${productName}
URL: ${productUrl}
${tagline ? `What it does: ${tagline}` : ""}

Requirements:
- Frame the article around the PROBLEM the product solves and how to think about it — not a sales pitch. Most of it should be useful even to someone who never buys.
- Use "## " section headings (4-6 sections) and short paragraphs.
- Mention ${productName} naturally where relevant, and include exactly 2-3 markdown links to ${productUrl} using descriptive anchor text (not "click here").
- Be specific and honest. No invented numbers, no hype.

Output EXACTLY this format:
TITLE: <a specific, search-friendly title, max 65 chars>
SUBTITLE: <one sentence, max 140 chars>
---
<the markdown article body>`;

    try {
      const raw = await aiComplete(prompt, { system: SYSTEM, maxTokens: 2200, temperature: 0.6 });
      const parsed = parse(raw);
      if (parsed && parsed.body_md.length > 400) return parsed;
    } catch {
      /* fall through to template */
    }
  }

  return template(input);
}

function parse(raw: string): Article | null {
  const titleM = raw.match(/TITLE:\s*(.+)/i);
  const subM = raw.match(/SUBTITLE:\s*(.+)/i);
  const sepIdx = raw.indexOf("---");
  if (!titleM || sepIdx === -1) return null;
  const body = raw.slice(sepIdx + 3).trim();
  if (!body) return null;
  return {
    title: titleM[1].trim().slice(0, 90),
    subtitle: (subM?.[1] || "").trim().slice(0, 160),
    body_md: body,
  };
}

/** Honest templated article when AI isn't available. */
function template({ productName, productUrl, tagline, category }: ArticleInput): Article {
  const what = tagline || `a tool built to solve a real, specific problem`;
  const cat = category || "software";
  return {
    title: `${productName}: a closer look`,
    subtitle: `What ${productName} does, who it's for, and how to decide if it fits.`,
    body_md: `## What ${productName} is

[${productName}](${productUrl}) is ${what}. This is a short, honest walkthrough for anyone evaluating it — what it's good at, who it suits, and the questions worth asking before you adopt anything in the ${cat} space.

## The problem it addresses

Most teams don't go looking for another tool for fun. They look because something is costing them time or attention every week. The useful question isn't "is this product good" — it's "does it remove a cost I'm actually paying." Write down the specific task you're trying to kill before you evaluate anything.

## Where it fits

${productName} is aimed at people who feel that cost often enough to want it gone. If the pain is occasional, a lighter workaround may be enough. If it's weekly, a dedicated tool usually pays for itself quickly. You can see how it presents itself and what it covers on the [${productName} site](${productUrl}).

## How to evaluate it

- Try it against your single most annoying case first, not the demo case.
- Check how quickly you got a result — time-to-value matters more than feature count.
- Ask what happens to your data and how easily you could leave.

## The bottom line

If the problem ${productName} targets is one you're paying for every week, it's worth a real trial. Start with your hardest case and judge it on time saved. You can start at [${productUrl}](${productUrl}).`,
  };
}
