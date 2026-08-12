import Link from "next/link";
import { Megaphone, ArrowUpRight } from "lucide-react";
import { getLiveAds } from "@/lib/ads";
import { PRODUCTS } from "@/lib/pricing";
import { AdLink } from "@/components/ad-link";
import { Card } from "@/components/ui";

/**
 * The paid rail. Sold slots render first; whatever's left renders as an
 * honest "this is for sale" card rather than filler — an empty rail that
 * pretends to be full is how directories lose advertisers.
 */
export async function AdRail() {
  const ads = await getLiveAds("sidebar");
  const openSlots = Math.max(0, (PRODUCTS.sidebar.slots ?? 3) - ads.length);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Megaphone className="h-3.5 w-3.5 text-ink-400" />
        <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
          Sponsored
        </span>
      </div>

      {ads.map((ad) => (
        <Card key={ad.id} className="overflow-hidden p-4 transition hover:shadow-lift">
          <AdLink adId={ad.id} href={ad.cta_url!} className="group block">
            <div className="flex items-start gap-3">
              {ad.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={ad.image_url}
                  alt=""
                  className="h-10 w-10 shrink-0 rounded-lg border border-ink-900/8 object-cover"
                  loading="lazy"
                />
              ) : null}
              <div className="min-w-0">
                <p className="text-sm font-semibold tracking-tight text-ink-900 group-hover:text-violet-600">
                  {ad.headline}
                </p>
                {ad.body && <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{ad.body}</p>}
              </div>
            </div>
            <span className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-violet-600">
              {ad.cta_label || "Visit"}
              <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </AdLink>
        </Card>
      ))}

      {openSlots > 0 && (
        <Card className="border-dashed p-5 text-center">
          <p className="text-sm font-semibold text-ink-900">Your product could be here</p>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
            {openSlots} of {PRODUCTS.sidebar.slots} slots open this month. Dofollow link included.
          </p>
          <Link
            href="/pricing#ads"
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-medium text-violet-600 hover:underline"
          >
            ${PRODUCTS.sidebar.dollars}/month <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </Card>
      )}
    </div>
  );
}

/** The wide sponsored card that sits inside the feed. */
export async function FeedBanner() {
  const [ad] = await getLiveAds("feed");

  if (!ad) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-ink-900/6 bg-paper-200/40 px-5 py-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">Sponsored</p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight text-ink-900">
            Your product, mid-feed, all month
          </p>
          <p className="mt-1 text-sm text-ink-500">
            One banner. No rotation. ${PRODUCTS.feed.dollars}/month with a dofollow link.
          </p>
        </div>
        <Link
          href="/pricing#ads"
          className="inline-flex items-center gap-1.5 rounded-xl border border-ink-900/12 bg-paper-100 px-4 py-2 text-sm font-medium text-ink-900 transition hover:border-violet-500/40 hover:text-violet-600"
        >
          Book this slot <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="border-b border-ink-900/6 bg-gradient-to-r from-violet-500/6 to-signal-500/5 px-5 py-6">
      <AdLink adId={ad.id} href={ad.cta_url!} className="group flex flex-wrap items-center gap-4">
        {ad.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={ad.image_url}
            alt=""
            className="h-14 w-14 shrink-0 rounded-xl border border-ink-900/8 object-cover"
            loading="lazy"
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-400">Sponsored</p>
          <p className="mt-1 text-lg font-semibold tracking-tight text-ink-900 group-hover:text-violet-600">
            {ad.headline}
          </p>
          {ad.body && <p className="mt-0.5 text-sm text-ink-500">{ad.body}</p>}
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-violet-500">
          {ad.cta_label || "Visit"} <ArrowUpRight className="h-4 w-4" />
        </span>
      </AdLink>
    </div>
  );
}
