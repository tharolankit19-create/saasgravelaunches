"use client";

import { useState } from "react";
import { Loader2, Check, ExternalLink, Copy } from "lucide-react";
import { Card, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

type Order = {
  id: string;
  public_token: string;
  tier: string;
  amount_cents: number | null;
  product_name: string;
  website_url: string | null;
  x_handle: string | null;
  linkedin_handle: string | null;
  contact_email: string | null;
  category: string | null;
  short_pitch: string | null;
  notes: string | null;
  status: string;
  live_note: string | null;
  submitted_count: number | null;
  report_url: string | null;
  dodo_payment_id: string | null;
  admin_notes: string | null;
  created_at: string;
};

const STATUSES = [
  { key: "received", label: "Received" },
  { key: "paid", label: "Paid" },
  { key: "in_progress", label: "Submitting" },
  { key: "completed", label: "Completed" },
  { key: "on_hold", label: "On hold" },
];

/**
 * The operator's editor for one order. Everything the buyer sees on their
 * status page is driven from here — the step, the live "happening now" line,
 * the count, the report link — plus private payment bookkeeping.
 */
export function OrderEditor({ order, siteUrl }: { order: Order; siteUrl: string }) {
  const [f, setF] = useState({
    status: order.status,
    live_note: order.live_note || "",
    submitted_count: order.submitted_count ?? 0,
    report_url: order.report_url || "",
    dodo_payment_id: order.dodo_payment_id || "",
    admin_notes: order.admin_notes || "",
  });
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const statusUrl = `${siteUrl}/order/${order.public_token}`;

  async function save() {
    setBusy(true);
    setErr(null);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/directory-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: order.id,
          status: f.status,
          live_note: f.live_note,
          submitted_count: Number(f.submitted_count) || 0,
          report_url: f.report_url,
          dodo_payment_id: f.dodo_payment_id,
          admin_notes: f.admin_notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Update failed.");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      setErr(e?.message || "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  const dollars = order.amount_cents ? order.amount_cents / 100 : "—";

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg font-semibold text-ink-900">{order.product_name}</p>
          <p className="mt-0.5 text-[12px] text-ink-500">
            {order.tier} · ${dollars} · {new Date(order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={statusUrl}
            target="_blank"
            rel="noopener"
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500 hover:text-ember-600"
          >
            Buyer view <ExternalLink className="h-3 w-3" />
          </a>
          <button
            type="button"
            onClick={() => navigator.clipboard?.writeText(statusUrl)}
            className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-500 hover:text-ember-600"
          >
            <Copy className="h-3 w-3" /> Copy link
          </button>
        </div>
      </div>

      {/* buyer-supplied facts */}
      <div className="mt-4 grid gap-1.5 rounded-xl bg-paper-200/60 p-3.5 text-[12px] text-ink-600 sm:grid-cols-2">
        {order.website_url && <Fact label="Website" value={order.website_url} link />}
        {order.contact_email && <Fact label="Email" value={order.contact_email} />}
        {order.x_handle && <Fact label="X" value={order.x_handle} />}
        {order.linkedin_handle && <Fact label="LinkedIn" value={order.linkedin_handle} />}
        {order.category && <Fact label="Category" value={order.category} />}
        {order.short_pitch && <Fact label="Pitch" value={order.short_pitch} />}
        {order.notes && <Fact label="Notes" value={order.notes} />}
      </div>

      {/* editable status */}
      <div className="mt-4 grid gap-4">
        <div>
          <p className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">Status</p>
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map((s) => (
              <button
                key={s.key}
                type="button"
                onClick={() => setF((v) => ({ ...v, status: s.key }))}
                className={cn(
                  "rounded-md border px-2.5 py-1 text-[12px] font-medium transition",
                  f.status === s.key
                    ? "border-ember-500 bg-ember-500 text-paper-100"
                    : "border-ink-900/15 text-ink-500 hover:border-ink-900/35"
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
            Happening now (shown to buyer)
          </span>
          <textarea
            className={cn(inputClass, "min-h-[60px] resize-y")}
            placeholder="e.g. Submitting to BetaList, StartupBase and 6 more today…"
            value={f.live_note}
            onChange={(e) => setF((v) => ({ ...v, live_note: e.target.value }))}
            maxLength={500}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Submitted count
            </span>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={f.submitted_count}
              onChange={(e) => setF((v) => ({ ...v, submitted_count: Number(e.target.value) }))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Report URL
            </span>
            <input
              className={inputClass}
              placeholder="https://…"
              value={f.report_url}
              onChange={(e) => setF((v) => ({ ...v, report_url: e.target.value }))}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Dodo payment id (private)
            </span>
            <input
              className={inputClass}
              placeholder="pay_…"
              value={f.dodo_payment_id}
              onChange={(e) => setF((v) => ({ ...v, dodo_payment_id: e.target.value }))}
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.12em] text-ink-500">
              Internal notes (private)
            </span>
            <input
              className={inputClass}
              placeholder="Anything for your own record"
              value={f.admin_notes}
              onChange={(e) => setF((v) => ({ ...v, admin_notes: e.target.value }))}
            />
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-ink-900 px-5 text-[13px] font-medium text-paper-100 transition hover:bg-ember-500 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Saved" : "Save"}
          </button>
          {err && <span className="text-[12px] text-red-600">{err}</span>}
        </div>
      </div>
    </Card>
  );
}

function Fact({ label, value, link }: { label: string; value: string; link?: boolean }) {
  return (
    <div className="flex gap-2">
      <span className="w-16 shrink-0 text-ink-400">{label}</span>
      {link ? (
        <a href={value} target="_blank" rel="noopener" className="truncate text-ember-600 hover:underline">
          {value}
        </a>
      ) : (
        <span className="truncate text-ink-700">{value}</span>
      )}
    </div>
  );
}
