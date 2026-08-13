// ─── Launch Copilot: the rule half ──────────────────────────
// Scoring a listing is a job for rules, not a model. Rules give the same answer
// twice, explain themselves, cost nothing, and can be argued with. The model is
// only used to write alternative copy — see /api/copilot.

import { hostOf } from "@/lib/utils";
import { currentWeekKey, msUntilWeekEnd, weekLabel } from "@/lib/week";

export type ListingDraft = {
  name: string;
  tagline: string;
  description: string;
  categories: string[];
  who_for: string;
  problem: string;
  solution: string;
  unique_edge: string;
  website_url: string;
};

export type Check = {
  id: string;
  label: string;
  /** pass = done well, warn = worth fixing, fail = actively costing you. */
  state: "pass" | "warn" | "fail";
  points: number;
  max: number;
  /** Only set when it isn't a pass — what to actually do. */
  fix?: string;
};

export type Review = {
  score: number;
  grade: "Weak" | "Fair" | "Strong" | "Excellent";
  checks: Check[];
  /** The single most valuable thing to fix next. */
  headline: string;
};

const FLUFF = [
  "revolutionary",
  "game-changing",
  "game changer",
  "cutting-edge",
  "next-generation",
  "world-class",
  "seamlessly",
  "effortlessly",
  "supercharge",
  "unleash",
  "10x",
  "best-in-class",
  "one-stop",
  "state-of-the-art",
];

export function scoreListing(draft: ListingDraft): Review {
  const checks: Check[] = [];
  const tagline = draft.tagline.trim();
  const description = draft.description.trim();

  // ── tagline length ──
  // Short enough to read in a scroll, long enough to say something.
  const tl = tagline.length;
  checks.push(
    tl >= 25 && tl <= 70
      ? { id: "tagline-length", label: "Tagline length", state: "pass", points: 15, max: 15 }
      : tl < 25
        ? {
            id: "tagline-length",
            label: "Tagline length",
            state: "warn",
            points: 6,
            max: 15,
            fix: `Your tagline is ${tl} characters. Aim for 25–70 — long enough to say what it does, short enough to survive the board.`,
          }
        : {
            id: "tagline-length",
            label: "Tagline length",
            state: "warn",
            points: 8,
            max: 15,
            fix: `${tl} characters will truncate on the board. Trim to 70 or under.`,
          }
  );

  // ── does the tagline say what it DOES? ──
  const saysWhat = /\b(for|that|to|helps?|turns?|lets?|builds?|finds?|tracks?|writes?|sends?|makes?|generates?|converts?|monitors?|automates?)\b/i.test(
    tagline
  );
  checks.push(
    saysWhat
      ? { id: "tagline-verb", label: "Tagline says what it does", state: "pass", points: 15, max: 15 }
      : {
          id: "tagline-verb",
          label: "Tagline says what it does",
          state: "fail",
          points: 0,
          max: 15,
          fix: "Your tagline names the product but not the job. Start with a verb or “for …” — “Finds high-intent leads on X in 15 minutes” beats “AI-powered lead platform”.",
        }
  );

  // ── fluff ──
  const haystack = `${tagline} ${description}`.toLowerCase();
  const found = FLUFF.filter((f) => haystack.includes(f));
  checks.push(
    found.length === 0
      ? { id: "fluff", label: "No marketing filler", state: "pass", points: 10, max: 10 }
      : {
          id: "fluff",
          label: "No marketing filler",
          state: "warn",
          points: 3,
          max: 10,
          fix: `Drop ${found.slice(0, 3).map((f) => `“${f}”`).join(", ")}. Makers read past those words; a concrete claim lands harder.`,
        }
  );

  // ── description depth ──
  const dl = description.length;
  checks.push(
    dl >= 220
      ? { id: "description", label: "Description has substance", state: "pass", points: 15, max: 15 }
      : dl >= 80
        ? {
            id: "description",
            label: "Description has substance",
            state: "warn",
            points: 7,
            max: 15,
            fix: `${dl} characters is thin for an SEO page. Two or three more sentences on who it's for and what it replaces.`,
          }
        : {
            id: "description",
            label: "Description has substance",
            state: "fail",
            points: 0,
            max: 15,
            fix: "There's almost no description. This is the text search engines index — it's the difference between a page that ranks and a dead listing.",
          }
  );

  // ── the SEO block ──
  const filled = [draft.who_for, draft.problem, draft.solution, draft.unique_edge].filter(
    (v) => v.trim().length > 20
  ).length;
  checks.push(
    filled >= 3
      ? { id: "seo-block", label: "Problem / solution / audience", state: "pass", points: 20, max: 20 }
      : {
          id: "seo-block",
          label: "Problem / solution / audience",
          state: filled === 0 ? "fail" : "warn",
          points: filled * 5,
          max: 20,
          fix: `${filled} of 4 filled in. These build the long-tail section of your page — autofill already drafted them, so this is a read-and-fix, not writing from scratch.`,
        }
  );

  // ── categories ──
  checks.push(
    draft.categories.length >= 1
      ? { id: "categories", label: "Category chosen", state: "pass", points: 10, max: 10 }
      : {
          id: "categories",
          label: "Category chosen",
          state: "fail",
          points: 0,
          max: 10,
          fix: "Pick at least one category — it's how your product shows up in the directory and on category pages.",
        }
  );

  // ── name vs domain ──
  const host = hostOf(draft.website_url);
  const nameMatches =
    !host || !draft.name || host.replace(/[^a-z0-9]/gi, "").includes(draft.name.replace(/[^a-z0-9]/gi, "").toLowerCase());
  checks.push(
    nameMatches
      ? { id: "name-domain", label: "Name matches the domain", state: "pass", points: 5, max: 5 }
      : {
          id: "name-domain",
          label: "Name matches the domain",
          state: "warn",
          points: 2,
          max: 5,
          fix: `Your product is “${draft.name}” but the site is ${host}. If that's deliberate, ignore this — otherwise it reads as a mismatch.`,
        }
  );

  // ── tagline duplicates name ──
  checks.push(
    tagline.toLowerCase().trim() !== draft.name.toLowerCase().trim()
      ? { id: "tagline-unique", label: "Tagline isn't just the name", state: "pass", points: 10, max: 10 }
      : {
          id: "tagline-unique",
          label: "Tagline isn't just the name",
          state: "fail",
          points: 0,
          max: 10,
          fix: "The tagline repeats the product name. It's the one line everyone reads — spend it on what the thing does.",
        }
  );

  const score = Math.round(
    (checks.reduce((s, c) => s + c.points, 0) / checks.reduce((s, c) => s + c.max, 0)) * 100
  );

  const grade: Review["grade"] =
    score >= 90 ? "Excellent" : score >= 72 ? "Strong" : score >= 50 ? "Fair" : "Weak";

  // Lead with the costliest failure, then the biggest warning.
  const worst =
    checks.filter((c) => c.state === "fail").sort((a, b) => b.max - a.max)[0] ||
    checks.filter((c) => c.state === "warn").sort((a, b) => b.max - a.max)[0];

  return {
    score,
    grade,
    checks,
    headline: worst?.fix || "Nothing left to fix — this is ready to go live.",
  };
}

// ─── Timing ─────────────────────────────────────────────────

export type Timing = { advice: string; detail: string; urgent: boolean };

/**
 * When to publish.
 *
 * Weeks run Monday→Sunday UTC, and rank is cumulative upvotes over the week, so
 * launching early is straightforwardly better — there is no clever hour. What
 * matters is how much of the week is left, and that is arithmetic, not a guess.
 */
export function bestLaunchDay(now: Date = new Date()): Timing {
  const msLeft = msUntilWeekEnd(now);
  const daysLeft = msLeft / 86_400_000;
  const week = weekLabel(currentWeekKey());

  if (daysLeft > 5.5) {
    return {
      advice: "Publish now",
      detail: `${week} has just opened. A launch today collects votes for the full week — the single biggest thing you control.`,
      urgent: false,
    };
  }
  if (daysLeft > 3) {
    return {
      advice: "Publish today",
      detail: `About ${Math.floor(daysLeft)} days left in ${week}. Still enough runway to place, but every day costs you votes.`,
      urgent: false,
    };
  }
  if (daysLeft > 1.2) {
    return {
      advice: "Publish today, or wait for Monday",
      detail: `Only ${Math.floor(daysLeft)} days left in ${week}. If you can't share it today, next week's board gives you a full seven days instead.`,
      urgent: true,
    };
  }
  return {
    advice: "Wait for Monday",
    detail: `${week} closes in under a day. Launching now buries a good product at the bottom of a finished board — Monday resets it to zero for everyone.`,
    urgent: true,
  };
}
