import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Rubric } from "@/components/ui";
import { ArticleGenerator } from "@/components/admin/article-generator";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin — articles", robots: { index: false } };

export default async function AdminArticlesPage() {
  if (!(await isAdmin())) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("launch_articles")
    .select("slug, title, product_name, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const articles = data || [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Rubric className="mb-2">Admin</Rubric>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Premium+ articles</h1>
          <p className="mt-2 text-sm text-ink-500">
            Generate an SEO article for a Premium+ buyer. Publishes to /blog with dofollow links.
          </p>
        </div>
        <Link href="/admin" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
          ← Admin
        </Link>
      </div>

      <div className="mt-6">
        <ArticleGenerator />
      </div>

      <h2 className="mt-10 mb-3 font-mono text-[11px] uppercase tracking-[0.16em] text-ink-400">
        Published ({articles.length})
      </h2>
      <div className="divide-y divide-ink-900/8 rounded-2xl border border-ink-900/10">
        {articles.length === 0 ? (
          <p className="p-5 text-sm text-ink-400">Nothing yet.</p>
        ) : (
          articles.map((a: any) => (
            <div key={a.slug} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <a href={`/blog/${a.slug}`} target="_blank" rel="noopener" className="truncate text-[14px] font-medium text-ink-900 hover:text-ember-600">
                  {a.title}
                </a>
                <p className="text-[12px] text-ink-400">{a.product_name}</p>
              </div>
              <span className="shrink-0 font-mono text-[11px] text-ink-400">
                {new Date(a.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
