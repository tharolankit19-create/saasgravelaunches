import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Rubric, Card, Empty } from "@/components/ui";
import { createAdminClient } from "@/lib/supabase/server";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles — deep dives on the products makers launched",
  description:
    "In-depth, honest articles about products launched on Saasgrave Launches. Written to help founders evaluate tools and solve real problems.",
  alternates: { canonical: `${SITE}/blog` },
};

async function getArticles() {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("launch_articles")
      .select("slug, title, subtitle, product_name, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(200);
    return data || [];
  } catch {
    return [];
  }
}

export default async function BlogIndex() {
  const articles = await getArticles();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Rubric className="mb-3 max-w-xs">Articles</Rubric>
      <h1 className="font-serif text-display font-semibold text-ink-900">Deep dives & founder guides</h1>
      <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-700">
        Honest, useful write-ups on the products makers ship here — and how to think about the
        problems they solve.
      </p>

      <div className="mt-10 space-y-3">
        {articles.length === 0 ? (
          <Empty
            title="No articles yet"
            sub="Premium+ launches get a full write-up here, with dofollow links to their product."
            action={
              <Link href="/pricing" className="font-semibold text-ember-600 hover:underline">
                See Premium+ →
              </Link>
            }
          />
        ) : (
          articles.map((a: any) => (
            <Link key={a.slug} href={`/blog/${a.slug}`} className="group">
              <Card className="flex items-center justify-between gap-4 p-5 transition hover:shadow-lift">
                <div>
                  <h2 className="font-serif text-lg font-semibold text-ink-900 group-hover:text-ember-600">
                    {a.title}
                  </h2>
                  {a.subtitle && <p className="mt-1 line-clamp-1 text-[13px] text-ink-500">{a.subtitle}</p>}
                </div>
                <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-400 group-hover:text-ember-600" />
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
