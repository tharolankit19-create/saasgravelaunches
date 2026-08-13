import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgeCheck,
  Calendar,
  Eye,
  MessageSquare,
  MousePointerClick,
  Tag,
  Trophy,
  Users,
  Lightbulb,
  Wrench,
  Star,
  Sparkles,
} from "lucide-react";
import { Badge, Card, Rubric, LinkButton } from "@/components/ui";
import { Avatar, ProductLogo } from "@/components/avatar";
import { UpvoteButton } from "@/components/upvote-button";
import { VisitButton } from "@/components/visit-button";
import { ShareRow } from "@/components/share-row";
import { ShareKit } from "@/components/share-kit";
import { BadgeEmbed } from "@/components/badge-embed";
import { CommentThread } from "@/components/comment-thread";
import { Celebrate } from "@/components/celebrate";
import { BarChart, LineChart } from "@/components/charts";
import { AdRail } from "@/components/ad-rail";
import { getProductAnalytics } from "@/lib/maker-analytics";
import { currentUser, createAdminClient } from "@/lib/supabase/server";
import {
  getComments,
  getMyUpvotes,
  getProductBySlug,
  getWeekRank,
  getDirectory,
} from "@/lib/launches";
import { categorySlug } from "@/lib/categories";
import { formatDate, hostOf } from "@/lib/utils";
import { weekLabel } from "@/lib/week";

export const dynamic = "force-dynamic";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://launches.saasgrave.org";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProductBySlug(params.slug);
  if (!product || product.status !== "live") return { title: "Launch not found" };

  const title = product.seo_title || `${product.name} — ${product.tagline}`;
  const description =
    product.seo_description ||
    product.description?.slice(0, 155) ||
    `${product.name}: ${product.tagline}. Launched on Saasgrave Launches.`;

  return {
    title,
    description,
    keywords: product.keywords || undefined,
    alternates: { canonical: `${SITE}/products/${product.slug}` },
    openGraph: {
      title,
      description,
      type: "article",
      url: `${SITE}/products/${product.slug}`,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { launched?: string; ref?: string };
}) {
  const product = await getProductBySlug(params.slug);
  if (!product) notFound();

  const user = await currentUser();
  const isOwner = user?.id === product.maker_id;
  if (product.status !== "live" && !isOwner) notFound();

  const [comments, myUpvotes, rank, analytics] = await Promise.all([
    getComments(product.id),
    getMyUpvotes([product.id]),
    getWeekRank(product),
    getProductAnalytics(product.slug, 14),
  ]);

  // Only draw the momentum charts once there's something to draw — a flat line
  // of zeros on a brand-new launch reads as broken, not as "no data yet".
  const hasMomentum = analytics.totals.views > 0 || analytics.totals.upvotes > 0;
  const viewsSeries = analytics.daily.map((d) => ({ day: d.day, value: d.views }));
  const upvoteSeries = analytics.velocity.map((d) => ({ day: d.day, value: d.cumulative }));

  // A view is a side effect of rendering the page, not of the visitor's click,
  // so it's fire-and-forget and never allowed to fail the render.
  try {
    const admin = createAdminClient();
    await admin.rpc("increment_launch_view", { p_slug: product.slug });
    // Arrivals from the maker's own embedded badge, counted separately so they
    // can see whether putting it up was worth it.
    if (searchParams.ref === "badge") {
      await admin.rpc("increment_launch_badge", { p_slug: product.slug });
    }
  } catch {
    /* counters are nice to have */
  }

  const related = (await getDirectory({ category: product.categories?.[0], limit: 5 })).filter(
    (p) => p.id !== product.id
  );

  const maker = product.profiles;
  const url = `${SITE}/products/${product.slug}`;
  const gallery = product.gallery_urls || [];
  const overview = [
    product.who_for && { icon: <Users className="h-4 w-4" />, label: "Who is it for?", body: product.who_for },
    product.problem && { icon: <Lightbulb className="h-4 w-4" />, label: "Problem", body: product.problem },
    product.solution && { icon: <Wrench className="h-4 w-4" />, label: "Solution", body: product.solution },
    product.unique_edge && { icon: <Star className="h-4 w-4" />, label: "What makes it different", body: product.unique_edge },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; body: string }[];

  const faq = Array.isArray(product.faq) ? product.faq : [];

  return (
    <>
      {/* Product + FAQ structured data — this is what earns the rich result. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "SoftwareApplication",
                name: product.name,
                url: product.website_url,
                description: product.description || product.tagline,
                applicationCategory: product.categories?.[0] || "BusinessApplication",
                ...(product.logo_url ? { image: product.logo_url } : {}),
                ...(product.upvote_count > 0
                  ? {
                      aggregateRating: {
                        "@type": "AggregateRating",
                        ratingValue: 5,
                        ratingCount: product.upvote_count,
                      },
                    }
                  : {}),
              },
              ...(faq.length
                ? [
                    {
                      "@type": "FAQPage",
                      mainEntity: faq.map((f) => ({
                        "@type": "Question",
                        name: f.q,
                        acceptedAnswer: { "@type": "Answer", text: f.a },
                      })),
                    },
                  ]
                : []),
            ],
          }),
        }}
      />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <nav className="mb-5 flex items-center gap-1.5 text-[12px] text-ink-400">
          <Link href="/products" className="hover:text-ember-600">
            Products
          </Link>
          <span>/</span>
          <span className="text-ink-700">{product.name}</span>
        </nav>

        {/* The moment it goes live: confetti + a short cheer at the top. The
            share/manage tools are NOT here — they sit at the foot of the page,
            below the product, so this doesn't bury the launch itself. */}
        {isOwner && searchParams.launched && (
          <>
            <Celebrate />
            <Card className="mb-6 border-moss-500/25 bg-moss-500/[0.07] p-6 text-center">
              <p className="font-serif text-2xl font-semibold text-ink-900">You&apos;re live 🎉</p>
              <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-500">
                {product.name} is on the board. Give it its first push — your share tools are at the
                bottom of the page.
              </p>
              <a
                href="#maker-tools"
                className="mt-4 inline-flex items-center gap-1.5 rounded-[4px] bg-ink-900 px-4 py-2 text-[13px] font-medium text-paper-100 transition hover:bg-ember-500"
              >
                Share your launch ↓
              </a>
            </Card>
          </>
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="min-w-0">
            {/* ── header ── */}
            <Card className="p-6">
              <div className="flex flex-wrap items-start gap-5">
                <ProductLogo src={product.logo_url} name={product.name} size={72} />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-ink-900 sm:text-3xl">
                      {product.name}
                    </h1>
                    {product.verified && (
                      <BadgeCheck className="h-5 w-5 text-brass-500" aria-label="Verified" />
                    )}
                    {rank && rank <= 3 && (
                      <Badge tone="brass">
                        <Trophy className="h-3 w-3" /> #{rank} · {weekLabel(product.launch_week || "")}
                      </Badge>
                    )}
                    {product.featured && (
                      <Badge tone="orange">
                        <Sparkles className="h-3 w-3" /> Editor&apos;s pick
                      </Badge>
                    )}
                    {product.status !== "live" && <Badge>Draft — only you can see this</Badge>}
                  </div>

                  <p className="mt-1.5 text-base text-ink-500">{product.tagline}</p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-ink-400">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(product.launched_at || product.created_at)}
                    </span>
                    {(product.categories || []).map((c) => (
                      <Link
                        key={c}
                        href={`/categories/${categorySlug(c)}`}
                        className="inline-flex items-center gap-1 hover:text-ember-600"
                      >
                        <Tag className="h-3 w-3" />
                        {c}
                      </Link>
                    ))}
                    {product.pricing_model && (
                      <span className="capitalize">{product.pricing_model}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <UpvoteButton
                    productId={product.id}
                    slug={product.slug}
                    count={product.upvote_count}
                    upvoted={myUpvotes.has(product.id)}
                    signedIn={Boolean(user)}
                    size="lg"
                  />
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-ink-900/8 pt-5">
                <VisitButton
                  href={product.website_url}
                  slug={product.slug}
                  label={`Visit ${hostOf(product.website_url)}`}
                />
                <ShareRow
                  url={url}
                  name={product.name}
                  tagline={product.tagline}
                  rank={rank}
                  slug={product.slug}
                />
              </div>

              <div className="mt-5 grid grid-cols-3 gap-4 border-t border-ink-900/8 pt-5 text-center sm:max-w-md sm:text-left">
                <MiniStat icon={<Eye className="h-3.5 w-3.5" />} value={product.view_count} label="views" />
                <MiniStat
                  icon={<MessageSquare className="h-3.5 w-3.5" />}
                  value={product.comment_count}
                  label="comments"
                />
                <MiniStat
                  icon={<MousePointerClick className="h-3.5 w-3.5" />}
                  value={product.click_count}
                  label="clicks out"
                />
              </div>
            </Card>

            {/* ── momentum — real charts, not a row of numbers ── */}
            {hasMomentum && (
              <section className="mt-8">
                <Rubric className="mb-3">Momentum · last 14 days</Rubric>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Card className="p-5">
                    <div className="mb-3 flex items-baseline justify-between">
                      <span className="font-serif text-[15px] font-semibold text-ink-900">
                        Upvotes over time
                      </span>
                      <span className="figure text-lg font-semibold text-ember-600">
                        {product.upvote_count}
                      </span>
                    </div>
                    <LineChart data={upvoteSeries} height={132} />
                  </Card>
                  <Card className="p-5">
                    <div className="mb-3 flex items-baseline justify-between">
                      <span className="font-serif text-[15px] font-semibold text-ink-900">
                        Page views
                      </span>
                      <span className="figure text-lg font-semibold text-ink-900">
                        {product.view_count}
                      </span>
                    </div>
                    <BarChart data={viewsSeries} height={132} />
                  </Card>
                </div>
              </section>
            )}

            {/* ── gallery ── */}
            {gallery.length > 0 && (
              <section className="mt-8">
                <Rubric className="mb-3">Gallery</Rubric>
                <div className="flex snap-x gap-4 overflow-x-auto pb-2">
                  {gallery.map((src) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={src}
                      src={src}
                      alt={`${product.name} screenshot`}
                      className="h-56 w-auto shrink-0 snap-start rounded-xl border border-ink-900/8 object-cover shadow-card sm:h-72"
                      loading="lazy"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ── about ── */}
            {product.description && (
              <section className="mt-8">
                <Rubric className="mb-3">About {product.name}</Rubric>
                <Card className="p-6">
                  <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink-700">
                    {product.description}
                  </p>
                </Card>
              </section>
            )}

            {/* ── overview ── */}
            {overview.length > 0 && (
              <section className="mt-8">
                <Rubric className="mb-3">Overview</Rubric>
                <Card className="divide-y divide-ink-900/8">
                  {overview.map((o) => (
                    <div key={o.label} className="flex gap-4 p-5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ember-500/8 text-ember-600">
                        {o.icon}
                      </span>
                      <div>
                        <p className="text-[14px] font-semibold text-ink-900">{o.label}</p>
                        <p className="mt-1 text-sm leading-relaxed text-ink-500">{o.body}</p>
                      </div>
                    </div>
                  ))}
                </Card>
              </section>
            )}

            {/* ── faq ── */}
            {faq.length > 0 && (
              <section className="mt-8">
                <Rubric className="mb-3">FAQ</Rubric>
                <Card className="divide-y divide-ink-900/8">
                  {faq.map((f, i) => (
                    <details key={i} className="group p-5">
                      <summary className="cursor-pointer list-none text-[14px] font-semibold text-ink-900 marker:hidden">
                        {f.q}
                      </summary>
                      <p className="mt-2 text-sm leading-relaxed text-ink-500">{f.a}</p>
                    </details>
                  ))}
                </Card>
              </section>
            )}

            {/* ── discussion ── */}
            <section className="mt-8" id="discussion">
              <Rubric className="mb-3">Discussion · {product.comment_count}</Rubric>
              <Card className="p-6">
                {product.maker_note && (
                  <div className="mb-6 rounded-xl border border-ember-500/20 bg-ember-500/6 p-4">
                    <div className="flex items-center gap-2">
                      <Avatar src={maker?.avatar_url} name={maker?.full_name} size={26} />
                      <span className="text-[13px] font-semibold text-ink-900">
                        {maker?.full_name || "The maker"}
                      </span>
                      <span className="rounded-full border border-ember-500/20 bg-paper-100 px-2 py-0.5 text-[10px] font-medium text-ember-600">
                        Maker
                      </span>
                    </div>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
                      {product.maker_note}
                    </p>
                  </div>
                )}

                <CommentThread
                  productId={product.id}
                  slug={product.slug}
                  comments={comments}
                  signedIn={Boolean(user)}
                  makerId={product.maker_id}
                />
              </Card>
            </section>

            {/* ── maker tools — at the foot, for the owner only ── */}
            {isOwner && (
              <section id="maker-tools" className="mt-8 scroll-mt-24">
                <Rubric className="mb-3">Your launch tools</Rubric>
                <Card className="p-6">
                  <ShareKit
                    url={url}
                    name={product.name}
                    tagline={product.tagline}
                    rank={rank}
                    upvotes={product.upvote_count}
                    slug={product.slug}
                  />
                  <div className="mt-6 border-t border-ink-900/8 pt-5">
                    <BadgeEmbed slug={product.slug} siteUrl={SITE} />
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                      <Link
                        href={`/embed/${product.slug}`}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-ember-600 hover:underline"
                      >
                        All three live widgets →
                      </Link>
                      <Link
                        href={`/dashboard/analytics/${product.slug}`}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-ember-600 hover:underline"
                      >
                        Launch analytics →
                      </Link>
                    </div>
                  </div>
                </Card>
              </section>
            )}
          </div>

          {/* ── rail ── */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            {maker && (
              <Card className="p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
                  The maker
                </p>
                <Link href={`/makers/${maker.id}`} className="group mt-3 flex items-center gap-3">
                  <Avatar src={maker.avatar_url} name={maker.full_name} size={44} />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink-900 group-hover:text-ember-600">
                      {maker.full_name || "A maker"}
                    </span>
                    {maker.maker_headline && (
                      <span className="block truncate text-[12px] text-ink-400">
                        {maker.maker_headline}
                      </span>
                    )}
                  </span>
                </Link>
                {maker.bio && (
                  <p className="mt-3 text-[13px] leading-relaxed text-ink-500">{maker.bio}</p>
                )}
                {maker.x_handle && (
                  <a
                    href={`https://x.com/${maker.x_handle.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener"
                    className="mt-3 inline-block text-[12px] font-medium text-ember-600 hover:underline"
                  >
                    @{maker.x_handle.replace(/^@/, "")} on X
                  </a>
                )}
              </Card>
            )}

            <AdRail />

            {related.length > 0 && (
              <Card className="p-5">
                <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
                  Similar launches
                </p>
                <ul className="mt-3 space-y-3">
                  {related.slice(0, 4).map((p) => (
                    <li key={p.id}>
                      <Link href={`/products/${p.slug}`} className="group flex items-center gap-3">
                        <ProductLogo src={p.logo_url} name={p.name} size={32} />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-semibold text-ink-900 group-hover:text-ember-600">
                            {p.name}
                          </span>
                          <span className="block truncate text-[12px] text-ink-400">{p.tagline}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            )}

            <Card className="border-dashed p-5 text-center">
              <p className="text-sm font-semibold text-ink-900">Built something too?</p>
              <p className="mt-1 text-[13px] text-ink-500">
                Launch it free and keep the backlink.
              </p>
              <LinkButton href="/launch" size="sm" className="mt-3 w-full">
                Launch your product
              </LinkButton>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

function MiniStat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-center gap-1.5 text-ink-400 sm:justify-start">
        {icon}
        <span className="font-mono text-sm font-semibold text-ink-900">{value}</span>
      </div>
      <p className="mt-0.5 text-[11px] uppercase tracking-wider text-ink-400">{label}</p>
    </div>
  );
}
