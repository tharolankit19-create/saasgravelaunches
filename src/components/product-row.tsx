import Link from "next/link";
import { MessageSquare, BadgeCheck, Sparkles } from "lucide-react";
import { ProductLogo } from "@/components/avatar";
import { UpvoteButton } from "@/components/upvote-button";
import { cn } from "@/lib/utils";
import { categorySlug } from "@/lib/categories";
import type { LaunchProduct } from "@/lib/launches";

/**
 * One entry in the register.
 *
 * The rank is a typeset numeral in its own column, not a coloured pill — the
 * top three get a rule at the leading edge instead. The whole row links to the
 * product, with the upvote and category links lifted out on their own stacking
 * layer so they stay independently clickable.
 */
export function ProductRow({
  product,
  rank,
  upvoted,
  signedIn,
  index = 0,
  showFeaturedMark,
}: {
  product: LaunchProduct;
  rank?: number;
  upvoted?: boolean;
  signedIn: boolean;
  index?: number;
  /** Set inside the paid Featured strip, where the rank isn't the point. */
  showFeaturedMark?: boolean;
}) {
  const rankTint = rank === 1 ? "rank-1" : rank === 2 ? "rank-2" : rank === 3 ? "rank-3" : "";

  return (
    <div
      className={cn(
        "row-in relative flex items-center gap-3 border-b border-ink-900/10 px-3 py-4 transition-colors last:border-b-0 hover:bg-paper-200/70 sm:gap-4 sm:px-5",
        rankTint
      )}
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
    >
      {/* rank — a figure, not a badge */}
      <div className="hidden w-9 shrink-0 text-center sm:block">
        {showFeaturedMark ? (
          <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-ember-500">
            Ad
          </span>
        ) : rank ? (
          <span
            className={cn(
              "figure block text-lg font-semibold leading-none",
              rank === 1 ? "text-brass-600" : rank <= 3 ? "text-ink-900" : "text-ink-400"
            )}
          >
            {rank}
          </span>
        ) : null}
      </div>

      <ProductLogo src={product.logo_url} name={product.name} size={50} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Link
            href={`/products/${product.slug}`}
            className="font-serif text-[17px] font-semibold leading-tight tracking-tight text-ink-900 hover:text-ember-600"
          >
            {product.name}
            {/* Stretches the hit area over the row without trapping nested links. */}
            <span className="absolute inset-0 z-0" aria-hidden />
          </Link>
          {product.verified && (
            <span title="Premium maker" className="inline-flex">
              <BadgeCheck className="h-3.5 w-3.5 text-brass-500" aria-label="Premium" />
            </span>
          )}
          {product.featured && (
            <span title="Editor's pick" className="inline-flex">
              <Sparkles className="h-3.5 w-3.5 text-ember-500" aria-label="Editor's pick" />
            </span>
          )}
        </div>

        <p className="mt-0.5 truncate text-[14px] leading-snug text-ink-500">{product.tagline}</p>

        <div className="relative z-10 mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400">
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {product.comment_count}
          </span>
          {(product.categories || []).slice(0, 2).map((c) => (
            <Link
              key={c}
              href={`/categories/${categorySlug(c)}`}
              className="hover:text-ember-600"
            >
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
