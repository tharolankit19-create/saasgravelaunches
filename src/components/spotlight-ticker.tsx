import { dollars, type BidRow } from "@/lib/outbid";

function ago(iso: string | null): string {
  if (!iso) return "";
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

/**
 * A ticker of the latest bids, scrolling across. Real rows, real amounts —
 * the point is to show the board is a live fight, not a static list. Reuses
 * the marquee CSS the footer already ships.
 */
export function SpotlightTicker({ bids }: { bids: BidRow[] }) {
  const items = bids.filter((b) => b.activated_at).slice(0, 10);
  if (items.length < 2) return null;

  return (
    <div className="marquee-mask border-y border-ink-900/8 py-2">
      <div className="marquee-track">
        {[0, 1].map((dup) => (
          <div key={dup} className="flex shrink-0 items-center gap-6" aria-hidden={dup === 1}>
            {items.map((b) => (
              <span
                key={`${dup}-${b.id}`}
                className="inline-flex shrink-0 items-center gap-1.5 font-mono text-[11px] text-ink-500"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-ember-500" />
                <span className="font-semibold text-ink-900">
                  {b.product_name || b.display_url}
                </span>
                bid <span className="text-ember-600">{dollars(b.amount_cents)}</span>
                <span className="text-ink-400">· {ago(b.activated_at)}</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
