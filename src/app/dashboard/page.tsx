import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, MousePointerClick, ArrowUp, MessageSquare, Plus, Sparkles } from "lucide-react";
import { Card, Rubric, Empty, LinkButton, Stat, Badge } from "@/components/ui";
import { ProductLogo } from "@/components/avatar";
import { ProfileForm } from "@/components/profile-form";
import { ShareRow } from "@/components/share-row";
import { createClient, currentUser } from "@/lib/supabase/server";
import { getMakerProducts, getSupportCount } from "@/lib/launches";
import { getMakerStats, levelFor, streakLabel, isPremium } from "@/lib/premium";
import { LevelMeter } from "@/components/charts";
import { getMyAds } from "@/lib/ads";
import { SUPPORT_THRESHOLD, PRODUCTS } from "@/lib/pricing";
import { monthLabel, weekLabel } from "@/lib/week";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Dashboard", robots: { index: false } };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://launches.saasgrave.org";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/dashboard");

  const supabase = createClient();
  const [{ data: profile }, products, ads, supported] = await Promise.all([
    supabase
      .from("profiles")
      .select("full_name, avatar_url, bio, x_handle, github_handle, website_url, maker_headline")
      .eq("id", user.id)
      .maybeSingle(),
    getMakerProducts(user.id),
    getMyAds(user.id),
    getSupportCount(user.id),
  ]);

  const [stats, premium] = await Promise.all([getMakerStats(user.id), isPremium(user.id)]);
  const { level, next, progress } = levelFor(stats.reputation);

  const live = products.filter((p) => p.status === "live");
  const totals = live.reduce(
    (acc, p) => ({
      views: acc.views + p.view_count,
      upvotes: acc.upvotes + p.upvote_count,
      comments: acc.comments + p.comment_count,
      clicks: acc.clicks + p.click_count,
      badge: acc.badge + (p.badge_clicks || 0),
    }),
    { views: 0, upvotes: 0, comments: 0, clicks: 0, badge: 0 }
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Rubric className="mb-2">Your workspace</Rubric>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">
            {profile?.full_name ? `Hi, ${profile.full_name.split(" ")[0]}` : "Your dashboard"}
          </h1>
          <p className="mt-2 text-sm text-ink-500">
            Everything your launches did, and everything you can do next.
          </p>
        </div>
        <LinkButton href="/launch" className="gap-1.5">
          <Plus className="h-4 w-4" /> New launch
        </LinkButton>
      </div>

      <Card className="mt-7 grid grid-cols-2 gap-6 p-6 sm:grid-cols-5">
        <Stat value={totals.views} label="Page views" />
        <Stat value={totals.upvotes} label="Upvotes" />
        <Stat value={totals.comments} label="Comments" />
        <Stat value={totals.clicks} label="Clicks to your site" />
        <Stat value={totals.badge} label="From your badge" />
      </Card>

      {/* ── standing ── */}
      <Card className="mt-4 flex flex-wrap items-center gap-x-8 gap-y-5 p-6">
        <div className="min-w-[190px] flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
            Your standing
          </p>
          <p className="mt-1.5 font-serif text-xl font-semibold text-ink-900">{level.name}</p>
          <p className="mt-0.5 text-[13px] text-ink-500">{level.blurb}</p>
          <LevelMeter progress={progress} className="mt-3" />
          <p className="mt-1.5 font-mono text-[10px] text-ink-400">
            {next
              ? `${stats.reputation} / ${next.min} to ${next.name}`
              : `${stats.reputation} — top level`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Stat value={stats.streak_weeks} label="Week streak" hint={streakLabel(stats.streak_weeks)} />
          <Stat value={stats.upvotes_given} label="Support given" />
          <Stat value={premium ? "Premium" : "Free"} label="Plan" />
        </div>
      </Card>

      {supported < SUPPORT_THRESHOLD && (
        <Card className="mt-5 border-brass-500/25 bg-brass-500/6 p-5">
          <p className="text-sm font-semibold text-ink-900">
            {SUPPORT_THRESHOLD - supported} more upvote
            {SUPPORT_THRESHOLD - supported === 1 ? "" : "s"} before you can publish
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
            Everyone who launches here supports {SUPPORT_THRESHOLD} other makers first. It takes a
            minute and it&apos;s the reason the votes on this board mean anything.{" "}
            <Link href="/" className="font-medium text-oxblood-600 hover:underline">
              Browse this week →
            </Link>
          </p>
        </Card>
      )}

      {/* ── launches ── */}
      <section className="mt-10">
        <Rubric className="mb-3">Your launches</Rubric>
        {products.length === 0 ? (
          <Empty
            title="Nothing launched yet"
            sub="Paste your URL and we write the listing. About a minute, start to finish."
            action={<LinkButton href="/launch">Launch your first product</LinkButton>}
          />
        ) : (
          <div className="space-y-4">
            {products.map((p) => (
              <Card key={p.id} className="p-5">
                <div className="flex flex-wrap items-start gap-4">
                  <ProductLogo src={p.logo_url} name={p.name} size={48} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/products/${p.slug}`}
                        className="text-[15px] font-semibold text-ink-900 hover:text-oxblood-600"
                      >
                        {p.name}
                      </Link>
                      {p.status === "live" ? (
                        <Badge tone="moss">Live · {weekLabel(p.launch_week || "")}</Badge>
                      ) : (
                        <Badge>Draft</Badge>
                      )}
                      {p.verified && <Badge tone="brass">Premium</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-ink-500">{p.tagline}</p>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 font-mono text-[12px] text-ink-500">
                      <span className="inline-flex items-center gap-1.5">
                        <Eye className="h-3.5 w-3.5" /> {p.view_count}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <ArrowUp className="h-3.5 w-3.5" /> {p.upvote_count}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> {p.comment_count}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <MousePointerClick className="h-3.5 w-3.5" /> {p.click_count}
                      </span>
                      {(p.badge_clicks || 0) > 0 && (
                        <span
                          className="inline-flex items-center gap-1.5"
                          title="Visits from your embedded badge"
                        >
                          <Sparkles className="h-3.5 w-3.5" /> {p.badge_clicks}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {p.status === "live" && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ink-900/8 pt-4">
                    <ShareRow
                      url={`${SITE}/products/${p.slug}`}
                      name={p.name}
                      tagline={p.tagline}
                      slug={p.slug}
                    />
                    <Link
                      href={`/products/${p.slug}`}
                      className="text-[12px] font-medium text-oxblood-600 hover:underline"
                    >
                      Badge &amp; ready-made posts →
                    </Link>
                    <Link
                      href={`/dashboard/analytics/${p.slug}`}
                      className="text-[12px] font-medium text-oxblood-600 hover:underline"
                    >
                      Analytics →
                    </Link>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── ads ── */}
      <section className="mt-10">
        <Rubric className="mb-3">Your sponsor slots</Rubric>
        {ads.length === 0 ? (
          <Empty
            title="No sponsor slots booked"
            sub={`The rail beside every page is $${PRODUCTS.sidebar.dollars}/month, with a dofollow link. Three slots exist.`}
            action={<LinkButton href="/pricing#ads" variant="outline">See the slots</LinkButton>}
          />
        ) : (
          <div className="space-y-3">
            {ads.map((ad) => (
              <Card key={ad.id} className="flex flex-wrap items-center gap-4 p-5">
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink-900">
                    {ad.headline || "Slot reserved — add your creative"}
                  </p>
                  <p className="mt-0.5 text-[12px] text-ink-400">
                    {ad.placement === "sidebar" ? "Sidebar" : "Feed banner"} · slot {ad.slot_index} ·{" "}
                    {monthLabel(ad.month_key)}
                  </p>
                </div>
                <Badge tone={ad.active ? "moss" : "neutral"}>
                  {ad.active ? "Running" : "Awaiting payment"}
                </Badge>
                <span className="font-mono text-[12px] text-ink-500">{ad.click_count} clicks</span>
              </Card>
            ))}
            <p className="px-1 text-[12px] text-ink-400">
              Need to change a creative? Reply to your receipt email and we&apos;ll swap it the same
              day.
            </p>
          </div>
        )}
      </section>

      {/* ── profile ── */}
      <section className="mt-10">
        <Rubric className="mb-3">Maker profile</Rubric>
        <Card className="p-6">
          <p className="mb-5 text-[13px] text-ink-500">
            This is the profile people see on your launches — and it&apos;s the same one Saasgrave
            uses.{" "}
            <Link href={`/makers/${user.id}`} className="font-medium text-oxblood-600 hover:underline">
              View your public page →
            </Link>
          </p>
          <ProfileForm
            initial={{
              full_name: profile?.full_name ?? null,
              maker_headline: (profile as any)?.maker_headline ?? null,
              bio: profile?.bio ?? null,
              x_handle: profile?.x_handle ?? null,
              github_handle: (profile as any)?.github_handle ?? null,
              website_url: profile?.website_url ?? null,
            }}
          />
        </Card>
      </section>
    </div>
  );
}
