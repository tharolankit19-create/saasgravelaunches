import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { Card, Rubric, Stat, LinkButton, Rule } from "@/components/ui";
import { BarChart, LineChart, ShareBars } from "@/components/charts";
import { currentUser } from "@/lib/supabase/server";
import { getProductBySlug } from "@/lib/launches";
import { getProductAnalytics } from "@/lib/maker-analytics";
import { isPremium } from "@/lib/premium";
import { PRODUCTS } from "@/lib/pricing";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Launch analytics", robots: { index: false } };

/**
 * Per-launch analytics — the thing none of the four competitors give a maker.
 *
 * Gated on Premium, which is the honest place to draw the line: the counters a
 * maker needs to know it worked are free on the dashboard; the daily curves,
 * velocity and referrer breakdown are what a subscription buys.
 */
export default async function AnalyticsPage({ params }: { params: { slug: string } }) {
  const user = await currentUser();
  if (!user) redirect(`/login?next=/dashboard/analytics/${params.slug}`);

  const product = await getProductBySlug(params.slug);
  if (!product) notFound();
  // Analytics are the maker's own business and nobody else's.
  if (product.maker_id !== user.id) notFound();

  const premium = await isPremium(user.id);

  if (!premium) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Card className="p-8 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-[3px] bg-paper-200 text-ink-400">
            <Lock className="h-5 w-5" />
          </span>
          <h1 className="mt-5 font-serif text-2xl font-semibold text-ink-900">
            Full analytics is a Premium feature
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-ink-500">
            Your totals — views, upvotes, comments and clicks to your site — are free and always on
            your dashboard. This page adds the daily curves, the upvote velocity and where the
            traffic actually came from.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3">
            <LinkButton href="/pricing">
              Premium — ${PRODUCTS.premium.dollars}/month
            </LinkButton>
            <Link
              href="/dashboard"
              className="self-center font-mono text-[11px] uppercase tracking-[0.12em] text-ink-500 underline decoration-ink-900/25 underline-offset-4 hover:text-ember-600"
            >
              back to dashboard
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  const a = await getProductAnalytics(product.slug, 14);
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <nav className="mb-5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
        <Link href="/dashboard" className="hover:text-ember-600">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-ink-700">{product.name}</span>
      </nav>

      <Rubric className="mb-4">Last {a.windowDays} days</Rubric>
      <h1 className="font-serif text-masthead font-semibold text-ink-900">{product.name}</h1>
      <p className="mt-2 text-[15px] text-ink-500">{product.tagline}</p>

      <Rule className="my-8" />

      <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
        <Stat value={a.totals.views} label="Page views" />
        <Stat value={a.totals.clicks} label="Clicks out" />
        <Stat value={pct(a.clickThrough)} label="Click-through" hint="clicks ÷ views" />
        <Stat value={a.totals.upvotes} label="Upvotes" />
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <BarChart
            label="Page views per day"
            data={a.daily.map((d) => ({ day: d.day, value: d.views }))}
          />
        </Card>
        <Card className="p-5">
          <BarChart
            label="Clicks to your site per day"
            data={a.daily.map((d) => ({ day: d.day, value: d.clicks }))}
            color="#2f6b4f"
          />
        </Card>
      </div>

      <Card className="mt-4 p-5">
        <LineChart
          label="Upvote velocity — cumulative"
          data={a.velocity.map((v) => ({ day: v.day, value: v.cumulative }))}
        />
        <p className="mt-3 border-t border-ink-900/10 pt-3 text-[13px] leading-relaxed text-ink-500">
          A flat tail means the launch has stopped moving. That&apos;s a signal to share it again —
          not to wait it out.
        </p>
      </Card>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <Rubric className="mb-4">Where the views came from</Rubric>
          <ShareBars
            rows={a.sources.map((s) => ({ label: s.label, value: s.views, share: s.share }))}
          />
        </Card>
        <Card className="p-5">
          <Rubric className="mb-4">Your own promotion</Rubric>
          <div className="grid grid-cols-2 gap-6">
            <Stat value={a.totals.shares} label="Shares" hint="from the share kit" />
            <Stat value={a.totals.badge} label="Badge copies" />
            <Stat value={product.badge_clicks} label="Badge visits" hint="all time" />
            <Stat value={product.comment_count} label="Comments" />
          </div>
        </Card>
      </div>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400">
        Counted from on-site events only. No third-party trackers, no cookies.
      </p>
    </div>
  );
}
