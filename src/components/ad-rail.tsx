import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getLiveAds, getAvailability, getFeaturedAvailability } from "@/lib/ads";
import { PRODUCTS } from "@/lib/pricing";
import { AdLink } from "@/components/ad-link";
import { Card, Rubric, Badge } from "@/components/ui";
import { currentWeekKey, monthLabel, weekLabel } from "@/lib/week";

/**
 * The rail beside the register. Sold slots render first; whatever's left renders
 * as an honest "for sale" card rather than filler — an empty rail pretending to
 * be full is how a directory loses advertisers.
 */
export async function AdRail() {
  const [ads, availability] = await Promise.all([getLiveAds(), getAvailability(1)]);
  const open = availability[0]?.open ?? PRODUCTS.sidebar.slots ?? 3;

  return (
    <div className="space-y-3">
      <Rubric>Sponsored</Rubric>

      {ads.map((ad) => (
        <Card key={ad.id} className="p-4 transition hover:shadow-lift">
          <AdLink adId={ad.id} href={ad.cta_url!} className="group block">
            <div className="flex items-start gap-3">
              {ad.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.image_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-[3px] border border-ink-900/10 object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0">
                <p className="font-serif text-[15px] font-semibold leading-tight text-ink-900 group-hover:text-oxblood-600">
                  {ad.headline}
                </p>
                {ad.body && (
                  <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{ad.body}</p>
                )}
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-oxblood-600">
              {ad.cta_label || "Visit"}
              <ArrowUpRight className="h-3 w-3" />
            </span>
          </AdLink>
        </Card>
      ))}

      {open > 0 && (
        <Card className="border-dashed p-4">
          <p className="font-serif text-[15px] font-semibold text-ink-900">
            {open} of {PRODUCTS.sidebar.slots} slots open
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
            This spot, on every page, for a month. Dofollow link included.
          </p>
          <Link
            href="/pricing#slots"
            className="mt-3 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-oxblood-600 hover:underline"
          >
            ${PRODUCTS.sidebar.dollars}/month <ArrowUpRight className="h-3 w-3" />
          </Link>
        </Card>
      )}
    </div>
  );
}

/**
 * The advertising section on the landing page — the one that was missing.
 *
 * Both placements, with live inventory, so a would-be advertiser can see
 * exactly what exists and what's left without opening the pricing page.
 */
export async function AdSlotsSection() {
  const week = currentWeekKey();
  const [sidebar, featured] = await Promise.all([
    getAvailability(2),
    getFeaturedAvailability(week),
  ]);

  const rows = [
    {
      spec: PRODUCTS.featured,
      period: weekLabel(week),
      open: featured.open,
      total: featured.total,
      where: "Pinned above the week's board, in a labelled Featured strip.",
    },
    {
      spec: PRODUCTS.sidebar,
      period: monthLabel(sidebar[0]?.monthKey || ""),
      open: sidebar[0]?.open ?? 0,
      total: sidebar[0]?.total ?? 3,
      where: "The rail beside every page — board, product pages, archive.",
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {rows.map(({ spec, period, open, total, where }) => (
        <Card key={spec.key} className="flex flex-col p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-serif text-lg font-semibold text-ink-900">{spec.name}</h3>
              <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                {period}
              </p>
            </div>
            <Badge tone={open > 0 ? "moss" : "neutral"}>
              {open > 0 ? `${open} of ${total} open` : "Sold out"}
            </Badge>
          </div>

          <p className="mt-3 text-[14px] leading-relaxed text-ink-500">{where}</p>

          <div className="mt-5 flex items-baseline gap-2 border-t border-ink-900/10 pt-4">
            <span className="figure text-2xl font-semibold text-ink-900">${spec.dollars}</span>
            <span className="text-[13px] text-ink-400">{spec.unit}</span>
          </div>

          <Link
            href="/pricing#slots"
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-[3px] border border-ink-900/18 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-900 transition hover:border-oxblood-500/50 hover:text-oxblood-600"
          >
            {open > 0 ? "Book this slot" : "Join the waitlist"}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      ))}
    </div>
  );
}
