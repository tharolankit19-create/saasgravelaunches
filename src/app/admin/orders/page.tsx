import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Rubric, Stat, Card, Empty } from "@/components/ui";
import { OrderEditor } from "@/components/admin/order-editor";
import { isAdmin } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin — directory orders", robots: { index: false } };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://ls.saasgrave.org";

export default async function AdminOrdersPage({ searchParams }: { searchParams: { filter?: string } }) {
  if (!(await isAdmin())) notFound();

  const admin = createAdminClient();
  const { data } = await admin
    .from("launch_directory_orders")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  const orders = data || [];
  const filter = searchParams.filter || "open";
  const shown = orders.filter((o: any) =>
    filter === "all"
      ? true
      : filter === "open"
      ? o.status !== "completed"
      : o.status === filter
  );

  const counts = {
    all: orders.length,
    open: orders.filter((o: any) => o.status !== "completed").length,
    received: orders.filter((o: any) => o.status === "received").length,
    in_progress: orders.filter((o: any) => o.status === "in_progress").length,
    completed: orders.filter((o: any) => o.status === "completed").length,
  };
  const revenue = orders
    .filter((o: any) => o.status !== "received")
    .reduce((s: number, o: any) => s + (o.amount_cents || 0), 0);

  const FILTERS: { key: string; label: string; n: number }[] = [
    { key: "open", label: "Open", n: counts.open },
    { key: "received", label: "Awaiting payment", n: counts.received },
    { key: "in_progress", label: "Submitting", n: counts.in_progress },
    { key: "completed", label: "Completed", n: counts.completed },
    { key: "all", label: "All", n: counts.all },
  ];

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Rubric className="mb-2">Admin</Rubric>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Directory orders</h1>
          <p className="mt-2 text-sm text-ink-500">
            No-login blast orders. Edit each one — the buyer watches it live on their token page.
          </p>
        </div>
        <Link href="/admin" className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 hover:text-ember-600">
          ← Admin
        </Link>
      </div>

      <Card className="mt-6 grid grid-cols-2 gap-5 p-5 sm:grid-cols-4">
        <Stat value={counts.all} label="Total orders" />
        <Stat value={counts.received} label="Awaiting payment" />
        <Stat value={counts.in_progress} label="In progress" />
        <Stat value={`$${(revenue / 100).toLocaleString()}`} label="Paid revenue" />
      </Card>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {FILTERS.map((fl) => (
          <a
            key={fl.key}
            href={`/admin/orders?filter=${fl.key}`}
            className={
              "rounded-xl px-3 py-1.5 text-[13px] font-medium transition " +
              (fl.key === filter ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-paper-200")
            }
          >
            {fl.label} <span className="opacity-60">{fl.n}</span>
          </a>
        ))}
      </div>

      <div className="mt-6 space-y-5">
        {shown.length === 0 ? (
          <Empty title="No orders here" sub="Nothing matches this filter yet." />
        ) : (
          shown.map((o: any) => <OrderEditor key={o.id} order={o} siteUrl={SITE} />)
        )}
      </div>
    </div>
  );
}
