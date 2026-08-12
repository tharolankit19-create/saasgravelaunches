import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Eye, MousePointerClick, ArrowUp, MessageSquare, Plus } from "lucide-react";
import { Card, Eyebrow, Empty, LinkButton, Stat, Badge } from "@/components/ui";
import { ProductLogo } from "@/components/avatar";
import { ProfileForm } from "@/components/profile-form";
import { ShareRow } from "@/components/share-row";
import { createClient, currentUser } from "@/lib/supabase/server";
import { getMakerProducts, getSupportCount } from "@/lib/launches";
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

  const live = products.filter((p) => p.status === "live");
  const totals = live.reduce(
    (acc, p) => ({
      views: acc.views + p.view_count,
      upvotes: acc.upvotes + p.upvote_count,
      comments: acc.comments + p.comment_count,
      clicks: acc.clicks + p.click_count,
    }),
    { views: 0, upvotes: 0, comments: 0, clicks: 0 }
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow className="mb-2">Your workspace</Eyebrow>
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

      <Card className="mt-7 grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
        <Stat value={totals.views} label="Page views" />
        <Stat value={totals.upvotes} label="Upvotes" />
        <Stat value={totals.comments} label="Comments" />
        <Stat value={totals.clicks} label="Clicks to your site" />
      </Card>

      {supported < SUPPORT_THRESHOLD && (
        <Card className="mt-5 border-medal-500/25 bg-medal-500/6 p-5">
          <p className="text-sm font-semibold text-ink-900">
            {SUPPORT_THRESHOLD - supported} more upvote
            {SUPPORT_THRESHOLD - supported === 1 ? "" : "s"} before you can publish
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
            Everyone who launches here supports {SUPPORT_THRESHOLD} other makers first. It takes a
            minute and it&apos;s the reason the votes on this board mean anything.{" "}
            <Link href="/" className="font-medium text-violet-600 hover:underline">
              Browse this week →
            </Link>
          </p>
        </Card>
      )}

      {/* ── launches ── */}
      <section className="mt-10">
        <Eyebrow className="mb-3">Your launches</Eyebrow>
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
                        className="text-[15px] font-semibold text-ink-900 hover:text-violet-600"
                      >
                        {p.name}
                      </Link>
                      {p.status === "live" ? (
                        <Badge tone="signal">Live · {weekLabel(p.launch_week || "")}</Badge>
                      ) : (
                        <Badge>Draft</Badge>
                      )}
                      {p.verified && <Badge tone="medal">Premium</Badge>}
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
                    </div>
                  </div>
                </div>

                {p.status === "live" && (
                  <div className="mt-4 border-t border-ink-900/8 pt-4">
                    <ShareRow
                      url={`${SITE}/products/${p.slug}`}
                      name={p.name}
                      tagline={p.tagline}
                      slug={p.slug}
                    />
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── ads ── */}
      <section className="mt-10">
        <Eyebrow className="mb-3">Your sponsor slots</Eyebrow>
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
                <Badge tone={ad.active ? "signal" : "neutral"}>
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
        <Eyebrow className="mb-3">Maker profile</Eyebrow>
        <Card className="p-6">
          <p className="mb-5 text-[13px] text-ink-500">
            This is the profile people see on your launches — and it&apos;s the same one Saasgrave
            uses.{" "}
            <Link href={`/makers/${user.id}`} className="font-medium text-violet-600 hover:underline">
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
