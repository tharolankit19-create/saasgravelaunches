import Link from "next/link";
import { MessageSquare, BadgeCheck, Tag, Sparkles } from "lucide-react";
import { ProductLogo } from "@/components/avatar";
import { UpvoteButton } from "@/components/upvote-button";
import { cn } from "@/lib/utils";
import { categorySlug } from "@/lib/categories";
import type { LaunchProduct } from "@/lib/launches";

const MEDALS = ["🥇", "🥈", "🥉"];

/**
 * One row of the board. The whole row is a link to the product page, with the
 * upvote and the category chips lifted out of it so they stay independently
 * clickable — a row that swallows every click is the most annoying thing a
 * directory can do.
 */
export function ProductRow({
  product,
  rank,
  upvoted,
  signedIn,
  index = 0,
}: {
  product: LaunchProduct;
  rank?: number;
  upvoted?: boolean;
  signedIn: boolean;
  index?: number;
}) {
  const medal = rank && rank <= 3 ? MEDALS[rank - 1] : null;
  const rankTint = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "";

  return (
    <div
      className={cn(
        "row-in group relative flex items-center gap-3 border-b border-ink-900/6 px-3 py-4 transition-colors hover:bg-paper-200/60 sm:gap-4 sm:px-5",
        rankTint
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 35}ms` }}
    >
      {/* rank */}
      <div className="hidden w-7 shrink-0 text-center sm:block">
        {medal ? (
          <span className="text-lg" title={`#${rank} this week`}>
            {medal}
          </span>
        ) : (
          <span className="font-mono text-xs text-ink-400">{rank ? `#${rank}` : ""}</span>
        )}
      </div>

      <ProductLogo src={product.logo_url} name={product.name} size={52} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/products/${product.slug}`}
            className="text-[15px] font-semibold tracking-tight text-ink-900 hover:text-violet-600"
          >
            {product.name}
            {/* Stretch the hit area over the row without trapping nested links. */}
            <span className="absolute inset-0 z-0" aria-hidden />
          </Link>
          {product.verified && (
            <BadgeCheck className="h-4 w-4 text-medal-500" aria-label="Verified" />
          )}
          {product.featured && (
            <span title="Editor's pick" className="inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-violet-500" aria-label="Editor's pick" />
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-sm text-ink-500">{product.tagline}</p>

        <div className="relative z-10 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-400">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" />
            {product.comment_count}
          </span>
          {(product.categories || []).slice(0, 2).map((c) => (
            <Link
              key={c}
              href={`/categories/${categorySlug(c)}`}
              className="inline-flex items-center gap-1 hover:text-violet-600"
            >
              <Tag className="h-3 w-3" />
              {c}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative z-10">
        <UpvoteButton
          productId={product.id}
          slug={product.slug}
          count={product.upvote_count}
          upvoted={Boolean(upvoted)}
          signedIn={signedIn}
        />
      </div>
    </div>
  );
}
