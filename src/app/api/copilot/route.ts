import { NextResponse } from "next/server";
import { aiConfigured, aiJson } from "@/lib/ai";
import { currentUser } from "@/lib/supabase/server";
import { isPremium } from "@/lib/premium";
import { track } from "@/lib/analytics";
import { CATEGORY_NAMES } from "@/lib/categories";
import { truncate } from "@/lib/utils";
import { bestLaunchDay, scoreListing, type ListingDraft } from "@/lib/copilot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * AI Launch Copilot.
 *
 * Reviews a draft before it goes live: scores it, says exactly what's weak,
 * offers stronger tagline options, and names the best day to publish.
 *
 * The score and the day come from rules, not the model — they're deterministic
 * and explainable, so a maker gets the same answer twice and can argue with it.
 * The model only writes the alternative copy. That split means an unset AI key
 * costs you the rewrites, not the review.
 */
export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Nothing to review." }, { status: 400 });

  const draft: ListingDraft = {
    name: String(body.name || "").slice(0, 60),
    tagline: String(body.tagline || "").slice(0, 120),
    description: String(body.description || "").slice(0, 1200),
    categories: Array.isArray(body.categories) ? body.categories.slice(0, 2) : [],
    who_for: String(body.who_for || "").slice(0, 200),
    problem: String(body.problem || "").slice(0, 600),
    solution: String(body.solution || "").slice(0, 600),
    unique_edge: String(body.unique_edge || "").slice(0, 600),
    website_url: String(body.website_url || "").slice(0, 300),
  };

  if (!draft.name || !draft.tagline) {
    return NextResponse.json(
      { error: "Add a name and a tagline first — there's nothing to review yet." },
      { status: 400 }
    );
  }

  // The rule half always runs.
  const review = scoreListing(draft);
  const timing = bestLaunchDay();
  const premium = await isPremium(user.id);

  await track({
    event: "copilot_run",
    userId: user.id,
    meta: { score: review.score, premium },
  });

  // The rewrite half is the paid part, and it's the part that needs a model.
  let taglines: string[] = [];
  let rewrite: string | null = null;
  let note: string | null = null;

  if (!premium) {
    note = "Tagline rewrites are a Premium feature. The review and timing above are free.";
  } else if (!aiConfigured()) {
    note = "AI isn't configured on this deployment, so rewrites are unavailable.";
  } else {
    try {
      const drafted = await aiJson<{ taglines?: unknown; description?: unknown }>(
        prompt(draft),
        {
          system:
            "You are an editor for a product launch directory. You write plainly and never inflate. You reply with a single JSON object and nothing else.",
          maxTokens: 600,
          temperature: 0.6,
        }
      );

      if (drafted) {
        taglines = Array.isArray(drafted.taglines)
          ? drafted.taglines
              .filter((t): t is string => typeof t === "string")
              .map((t) => truncate(t.trim().replace(/\.$/, ""), 80))
              .filter(Boolean)
              .slice(0, 3)
          : [];
        rewrite =
          typeof drafted.description === "string" && drafted.description.trim()
            ? truncate(drafted.description.trim(), 700)
            : null;
      }
      if (!taglines.length && !rewrite) note = "The model didn't return anything usable this time.";
    } catch (e: any) {
      note = "Every AI model on the ladder failed — the review below is unaffected.";
      console.error("copilot:", e?.message || e);
    }
  }

  return NextResponse.json({ ...review, timing, taglines, rewrite, premium, note });
}

function prompt(draft: ListingDraft): string {
  return `Rewrite this product listing's copy for a launch directory.

Rules:
- Use ONLY the facts given. Never invent metrics, customers, prices or claims.
- Plain and specific. No marketing fluff, no emojis, no exclamation marks.
- Taglines: max 80 characters each, no trailing period, each a genuinely
  different angle (what it does / who it's for / what it replaces).

Reply with ONLY this JSON object:
{
  "taglines": ["three alternative taglines"],
  "description": "a tightened 2-4 sentence description, max 600 characters"
}

LISTING:
Name: ${draft.name}
Tagline: ${draft.tagline}
Categories: ${draft.categories.join(", ") || "none"}
Audience: ${draft.who_for || "not stated"}
Problem: ${draft.problem || "not stated"}
Solution: ${draft.solution || "not stated"}
What makes it different: ${draft.unique_edge || "not stated"}
Description: ${draft.description || "not written yet"}
Valid categories: ${CATEGORY_NAMES.join(", ")}`;
}
