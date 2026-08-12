import type { Metadata } from "next";
import { Check } from "lucide-react";
import { Badge, Card, Eyebrow, LinkButton, Stat } from "@/components/ui";
import { BuyButton } from "@/components/buy-button";
import { TrackOnMount } from "@/components/tracker";
import { getAvailability } from "@/lib/ads";
import { getSiteStats } from "@/lib/launches";
import { FREE_PERKS, PRODUCTS } from "@/lib/pricing";
import { monthLabel } from "@/lib/week";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing — free to launch, $9 to sponsor",
  description:
    "Launching is free forever. The only paid things are three sidebar sponsor slots at $9/month, one feed banner at $29/month, and an optional $19 Premium listing.",
};

export default async function PricingPage() {
  const [sidebar, feed, stats] = await Promise.all([
    getAvailability("sidebar"),
    getAvailability("feed"),
    getSiteStats(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <TrackOnMount event="pricing_view" />

      <Eyebrow className="mb-3">Pricing</Eyebrow>
      <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
        Launching is free. Being <span className="text-violet-500">seen every day</span> is $9.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-500">
        There is no paid tier that gets you onto the board, no queue to skip, and no “featured”
        wall between your product and the people browsing. We make money from three sponsor slots
        in the rail — which is why your launch doesn&apos;t have to cost anything.
      </p>

      <div className="mt-9 grid max-w-2xl grid-cols-3 gap-6 border-y border-ink-900/8 py-6">
        <Stat value={stats.liveTotal} label="Products live" />
        <Stat value={stats.makers} label="Makers" />
        <Stat value={stats.upvotes} label="Upvotes cast" />
      </div>

      {/* ── free ── */}
      <section className="mt-12">
        <Eyebrow className="mb-3">Step 1 — Launch</Eyebrow>
        <Card className="overflow-hidden">
          <div className="grid gap-8 p-7 md:grid-cols-[1fr_1.2fr]">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-semibold tracking-tight text-ink-900">Free Launch</h2>
                <Badge tone="signal">no card</Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">
                Everything you need to go live and stay live.
              </p>
              <p className="mt-6 font-mono text-4xl font-semibold tracking-tight text-ink-900">
                $0
                <span className="ml-2 align-middle text-sm font-normal text-ink-400">forever</span>
              </p>
              <LinkButton href="/launch" size="lg" className="mt-6 w-full sm:w-auto">
                Launch for free
              </LinkButton>
            </div>

            <ul className="grid gap-3 self-center">
              {FREE_PERKS.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-ink-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal-500" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      {/* ── ads ── */}
      <section id="ads" className="mt-14 scroll-mt-24">
        <Eyebrow className="mb-3">Step 2 — Sponsor a month</Eyebrow>
        <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
          Two placements. Real scarcity. Dofollow links.
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-500">
          Sold by the calendar month. When the slots are gone they&apos;re gone — we don&apos;t
          rotate four advertisers through one spot and call it exclusive.
        </p>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <AdCard product="sidebar" availability={sidebar} highlight />
          <AdCard product="feed" availability={feed} />
        </div>
      </section>

      {/* ── premium ── */}
      <section className="mt-14">
        <Eyebrow className="mb-3">Optional — Premium listing</Eyebrow>
        <Card className="grid gap-8 p-7 md:grid-cols-[1fr_1.2fr]">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink-900">
              {PRODUCTS.premium.name}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-500">
              {PRODUCTS.premium.tagline}
            </p>
            <p className="mt-6 font-mono text-4xl font-semibold tracking-tight text-ink-900">
              ${PRODUCTS.premium.dollars}
              <span className="ml-2 align-middle text-sm font-normal text-ink-400">
                {PRODUCTS.premium.unit}
              </span>
            </p>
            <BuyButton
              product="premium"
              label={`Get Premium — $${PRODUCTS.premium.dollars}`}
              className="mt-6 w-full sm:w-auto"
            />
            <p className="mt-3 text-[12px] leading-relaxed text-ink-400">
              Premium never changes your position on upvotes. It only breaks ties.
            </p>
          </div>
          <ul className="grid gap-3 self-center">
            {PRODUCTS.premium.perks.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-ink-700">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-medal-500" />
                {p}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      {/* ── faq ── */}
      <section className="mt-14">
        <Eyebrow className="mb-3">Questions</Eyebrow>
        <Card className="divide-y divide-ink-900/8">
          {[
            [
              "Is launching really free?",
              "Yes. A public product page, a spot on the weekly board, comments, a dofollow backlink and your analytics — all free, no card, forever.",
            ],
            [
              "Why do I have to upvote three products first?",
              "Because a board where everyone submits and nobody votes is a spam list. Three upvotes takes a minute, and it's the reason the ranking on this site means something.",
            ],
            [
              "Is the backlink really dofollow?",
              "Yes, on your canonical product page and on every sponsor slot. That's the thing being offered — nofollowing it would make the whole exercise pointless.",
            ],
            [
              "What happens when my week ends?",
              "Nothing disappears. Your product page, its link, its comments and its rank stay live and indexed. The board just moves on to the next week.",
            ],
            [
              "How do the sponsor slots work?",
              "Pick a placement, pay for the month, send us your creative. The slot is yours until the month ends — no rotation, no auction.",
            ],
            [
              "Refunds?",
              "Sponsor slots are refundable pro-rata before the month starts. Premium is instant and permanent, so it isn't refundable — but it transfers to another product you own.",
            ],
          ].map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer list-none text-[14px] font-semibold text-ink-900 marker:hidden">
                {q}
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-ink-500">{a}</p>
            </details>
          ))}
        </Card>
      </section>
    </div>
  );
}

function AdCard({
  product,
  availability,
  highlight,
}: {
  product: "sidebar" | "feed";
  availability: { monthKey: string; open: number; total: number }[];
  highlight?: boolean;
}) {
  const spec = PRODUCTS[product];
  const thisMonth = availability[0];
  const soldOut = thisMonth ? thisMonth.open === 0 : false;

  return (
    <Card className={highlight ? "border-violet-500/25 p-6" : "p-6"}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-tight text-ink-900">{spec.name}</h3>
        {highlight && <Badge tone="violet">most booked</Badge>}
      </div>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-500">{spec.tagline}</p>

      <p className="mt-5 font-mono text-3xl font-semibold tracking-tight text-ink-900">
        ${spec.dollars}
        <span className="ml-2 align-middle text-sm font-normal text-ink-400">{spec.unit}</span>
      </p>

      <ul className="mt-5 space-y-2.5">
        {spec.perks.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-[13px] text-ink-700">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-signal-500" />
            {p}
          </li>
        ))}
      </ul>

      <div className="mt-5 border-t border-ink-900/8 pt-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
          Availability
        </p>
        <ul className="mt-2 space-y-1.5">
          {availability.map((a) => (
            <li key={a.monthKey} className="flex items-center justify-between text-[13px]">
              <span className="text-ink-500">{monthLabel(a.monthKey)}</span>
              <span
                className={
                  a.open === 0
                    ? "font-mono text-[12px] text-ink-400"
                    : "font-mono text-[12px] text-signal-600"
                }
              >
                {a.open}/{a.total} open
              </span>
            </li>
          ))}
        </ul>
      </div>

      <BuyButton
        product={product}
        label={`Book — $${spec.dollars}/month`}
        soldOut={soldOut}
        className="mt-5 w-full"
      />
    </Card>
  );
}
