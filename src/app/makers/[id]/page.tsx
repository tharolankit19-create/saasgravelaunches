import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, Github } from "lucide-react";
import { Card, Rubric, Empty, LinkButton, Stat } from "@/components/ui";
import { Avatar } from "@/components/avatar";
import { ProductRow } from "@/components/product-row";
import { currentUser } from "@/lib/supabase/server";
import { getMaker, getMakerProducts, getMyUpvotes } from "@/lib/launches";
import { normalizeUrl, hostOf } from "@/lib/utils";
import { getMakerStats } from "@/lib/premium";
import { MakerLevel } from "@/components/maker-level";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const maker = await getMaker(params.id);
  if (!maker) return { title: "Maker not found" };
  const name = maker.full_name || "A maker";
  return {
    title: `${name} — maker profile`,
    description:
      maker.bio?.slice(0, 155) ||
      `Products launched by ${name} on Saasgrave Launches.`,
  };
}

export default async function MakerPage({ params }: { params: { id: string } }) {
  const maker = await getMaker(params.id);
  if (!maker) notFound();

  const [products, user, stats] = await Promise.all([
    getMakerProducts(params.id),
    currentUser(),
    getMakerStats(params.id),
  ]);
  const isSelf = user?.id === params.id;
  const live = products.filter((p) => p.status === "live");
  const visible = isSelf ? products : live;

  const upvotes = live.reduce((sum, p) => sum + p.upvote_count, 0);
  const views = live.reduce((sum, p) => sum + p.view_count, 0);
  const website = normalizeUrl(maker.website_url);
  const myUpvotes = await getMyUpvotes(visible.map((p) => p.id));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar src={maker.avatar_url} name={maker.full_name} size={72} />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-ink-900">
              {maker.full_name || "A maker"}
            </h1>
            {maker.maker_headline && (
              <p className="mt-1 text-sm text-ink-500">{maker.maker_headline}</p>
            )}
            {maker.bio && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">{maker.bio}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-[13px]">
              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 text-ink-500 hover:text-ember-600"
                >
                  <Globe className="h-3.5 w-3.5" /> {hostOf(website)}
                </a>
              )}
              {maker.x_handle && (
                <a
                  href={`https://x.com/${maker.x_handle.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener"
                  className="text-ink-500 hover:text-ember-600"
                >
                  @{maker.x_handle.replace(/^@/, "")}
                </a>
              )}
              {(maker as any).github_handle && (
                <a
                  href={`https://github.com/${String((maker as any).github_handle).replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-1.5 text-ink-500 hover:text-ember-600"
                >
                  <Github className="h-3.5 w-3.5" /> GitHub
                </a>
              )}
            </div>
          </div>

          {isSelf && (
            <LinkButton href="/dashboard" variant="outline" size="sm">
              Edit profile
            </LinkButton>
          )}
        </div>

        <div className="mt-6 border-t border-ink-900/8 pt-5">
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            <Stat value={live.length} label="Launches" />
            <Stat value={upvotes} label="Upvotes earned" />
            <Stat value={stats.upvotes_given} label="Support given" />
            <Stat value={views} label="Page views" />
          </div>

          <MakerLevel
            reputation={stats.reputation}
            streakWeeks={stats.streak_weeks}
            className="mt-6"
          />
        </div>
      </Card>

      <section className="mt-8">
        <Rubric className="mb-3">Launches</Rubric>
        {visible.length === 0 ? (
          <Empty
            title={isSelf ? "You haven't launched yet" : "No launches yet"}
            sub={isSelf ? "It takes about a minute — paste a URL and we do the rest." : undefined}
            action={isSelf ? <LinkButton href="/launch">Launch a product</LinkButton> : undefined}
          />
        ) : (
          <Card className="overflow-hidden">
            {visible.map((p, i) => (
              <div key={p.id} className="relative">
                <ProductRow
                  product={p}
                  index={i}
                  upvoted={myUpvotes.has(p.id)}
                  signedIn={Boolean(user)}
                />
                {p.status !== "live" && (
                  <span className="pointer-events-none absolute right-24 top-4 rounded-full border border-ink-900/10 bg-paper-200 px-2 py-0.5 text-[10px] font-medium text-ink-500">
                    draft
                  </span>
                )}
              </div>
            ))}
          </Card>
        )}
      </section>

      <p className="mt-8 text-center text-[13px] text-ink-400">
        Building something?{" "}
        <Link href="/launch" className="font-medium text-ember-600 hover:underline">
          Launch it here — free.
        </Link>
      </p>
    </div>
  );
}
