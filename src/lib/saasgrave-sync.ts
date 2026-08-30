// ─── Saasgrave → Launches mirror ────────────────────────────
// Server-only. Saasgrave (the graveyard) and Launches share one Supabase
// project, so this reads `startups` and writes matching rows into
// `launch_products`. It NEVER writes to `startups` — that table belongs to
// Saasgrave, and this is a one-way mirror.
//
// Idempotency comes from `launch_products.source_startup_id`, which carries a
// unique index. Re-running is safe: an already-mirrored startup is skipped.
//
// Honesty note: everything on Saasgrave is a shutdown or a pivot. These
// listings say so, in the description and in the `outcome` line, because a
// board full of dead products presented as fresh launches would mislead every
// visitor and be worth nothing to the makers who launch here for real.

import { createAdminClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";
import { slugify, normalizeUrl, truncate } from "@/lib/utils";

export type SyncResult = {
  scanned: number;
  created: number;
  skipped: { slug: string; reason: string }[];
  createdSlugs: string[];
  /** Populated on a dry run: what would have been mirrored. */
  wouldCreate: { name: string; website: string }[];
};

/** Map a Saasgrave category string onto one of ours. */
function mapCategory(raw: string | null): string[] {
  const v = (raw || "").toLowerCase();
  if (!v) return ["Other"];
  const direct = CATEGORIES.find((c) => c.name.toLowerCase() === v || c.slug === v);
  if (direct) return [direct.name];
  const hit = CATEGORIES.find((c) => c.match.some((m) => v.includes(m)));
  return [hit?.name || "Other"];
}

/** A unique launch slug, avoiding anything already taken. */
async function uniqueSlug(admin: any, name: string): Promise<string> {
  const stem = slugify(name) || "startup";
  const { data } = await admin.from("launch_products").select("slug").like("slug", `${stem}%`).limit(50);
  const taken = new Set((data || []).map((r: any) => r.slug as string));
  if (!taken.has(stem)) return stem;
  for (let i = 2; i < 60; i++) {
    if (!taken.has(`${stem}-${i}`)) return `${stem}-${i}`;
  }
  return `${stem}-${Date.now().toString(36).slice(-4)}`;
}

/**
 * Mirror every Saasgrave startup that isn't on the board yet.
 *
 * @param week      the ISO week key to launch them into
 * @param status    "live" publishes immediately; "draft" stages them
 * @param limit     safety cap per run
 * @param dryRun    report the plan, write nothing
 */
export async function syncSaasgraveStartups({
  week,
  status = "live",
  limit = 50,
  dryRun = false,
}: {
  week: string;
  status?: "live" | "draft";
  limit?: number;
  dryRun?: boolean;
}): Promise<SyncResult> {
  const admin = createAdminClient();
  const out: SyncResult = { scanned: 0, created: 0, skipped: [], createdSlugs: [], wouldCreate: [] };

  // Read-only against Saasgrave's table.
  const { data: startups, error } = await admin
    .from("startups")
    .select(
      "id, founder_id, slug, name, tagline, about, logo_url, screenshot_urls, category, website_url, outcome, for_sale, asking_price, lessons_learned, status, created_at"
    )
    .eq("status", "listed")
    .order("created_at", { ascending: true })
    .limit(500);

  if (error || !startups) return out;

  // Which ones are already mirrored?
  const { data: existing } = await admin
    .from("launch_products")
    .select("source_startup_id")
    .not("source_startup_id", "is", null);
  const mirrored = new Set((existing || []).map((r: any) => r.source_startup_id as string));

  for (const s of startups as any[]) {
    if (!dryRun && out.created >= limit) break;
    out.scanned++;

    if (mirrored.has(s.id)) {
      out.skipped.push({ slug: s.slug, reason: "already mirrored" });
      continue;
    }

    // The whole value of a listing here is the dofollow link out. Without a
    // URL there's nothing to link to, so it isn't worth a page.
    const website = normalizeUrl(s.website_url);
    if (!website) {
      out.skipped.push({ slug: s.slug, reason: "no website url" });
      continue;
    }

    const name = String(s.name || "").replace(/^[:\s]+/, "").trim().slice(0, 80);
    if (!name) {
      out.skipped.push({ slug: s.slug, reason: "no name" });
      continue;
    }

    const tagline =
      truncate(String(s.tagline || "").trim(), 90) ||
      (s.outcome === "pivot" ? "A pivot, documented on Saasgrave" : "A shutdown, documented on Saasgrave");

    // Say plainly what this is. A visitor arriving from the board should not
    // have to click through to discover the product is dead.
    const context =
      s.outcome === "pivot"
        ? "This project pivoted. Its full story — what worked, what didn't and why it changed direction — is documented on Saasgrave."
        : "This project has shut down. Its full story — what worked, what didn't and why it ended — is documented on Saasgrave.";
    const forSale = s.for_sale ? " The founder has it listed for sale." : "";

    const description = truncate(
      [String(s.about || "").trim(), context + forSale].filter(Boolean).join("\n\n"),
      700
    );

    const gallery = Array.isArray(s.screenshot_urls)
      ? s.screenshot_urls.filter((u: unknown) => typeof u === "string").slice(0, 5)
      : [];

    if (dryRun) {
      out.wouldCreate.push({ name, website });
      continue;
    }

    const slug = await uniqueSlug(admin, name);

    const { error: insErr } = await admin.from("launch_products").insert({
      maker_id: s.founder_id,
      source_startup_id: s.id,
      slug,
      name,
      tagline,
      description,
      website_url: website,
      logo_url: normalizeUrl(s.logo_url),
      gallery_urls: gallery,
      categories: mapCategory(s.category),
      problem: truncate(String(s.lessons_learned || "").trim(), 400) || null,
      seo_title: `${name} — ${tagline}`.slice(0, 70),
      seo_description: truncate(description, 155),
      status,
      launch_week: week,
      launched_at: status === "live" ? new Date().toISOString() : null,
      autofill_source: "saasgrave",
    });

    if (insErr) {
      out.skipped.push({ slug: s.slug, reason: insErr.message.slice(0, 120) });
      continue;
    }

    out.created++;
    out.createdSlugs.push(slug);
  }

  return out;
}
