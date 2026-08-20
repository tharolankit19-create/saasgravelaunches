import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Clock, ExternalLink, FileText, PauseCircle } from "lucide-react";
import { Card, Rubric, Badge } from "@/components/ui";
import { OrderLiveRefresh } from "@/components/order-live-refresh";
import { createAdminClient } from "@/lib/supabase/server";
import {
  ORDER_TIERS,
  PIPELINE,
  ORDER_STATUS_STEPS,
  statusMeta,
  pipelineProgress,
  paymentLinkFor,
  isOrderTier,
  type OrderStatus,
} from "@/lib/directory-orders";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Your directory blast — live status",
  robots: { index: false },
};

async function getOrder(token: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("launch_directory_orders")
      .select(
        "public_token, tier, amount_cents, product_name, website_url, x_handle, linkedin_handle, status, live_note, submitted_count, report_url, created_at, updated_at"
      )
      .eq("public_token", token)
      .single();
    return data;
  } catch {
    return null;
  }
}

export default async function OrderStatusPage({ params }: { params: { token: string } }) {
  const order = await getOrder(params.token);
  if (!order) notFound();

  const tier = isOrderTier(order.tier) ? ORDER_TIERS[order.tier] : null;
  const status = order.status as OrderStatus;
  const meta = statusMeta(status);
  const progress = pipelineProgress(status);
  const done = status === "completed";
  const onHold = status === "on_hold";
  const unpaid = status === "received";
  const currentIndex = PIPELINE.indexOf(status);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <Rubric>Order · {order.product_name}</Rubric>
        <OrderLiveRefresh done={done} />
      </div>

      <h1 className="mt-3 font-serif text-masthead font-semibold text-ink-900">
        {done ? "Your directory blast is done 🎉" : "Your directory blast"}
      </h1>
      <p className="mt-2 text-[14px] text-ink-500">
        {tier?.name} plan · {tier?.directories} · do-follow only. Bookmark this page — it&apos;s your
        private, live view. No login needed.
      </p>

      {/* ── pay first, if not yet paid ── */}
      {unpaid && tier && (
        <Card className="mt-7 border-ember-500/45 bg-ember-500/[0.04] p-6">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-ember-600" />
            <p className="font-serif text-lg font-semibold text-ink-900">One step left — payment</p>
          </div>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-600">
            Your details are saved. Complete your ${tier.dollars} payment and we&apos;ll start
            submitting your product. Come back to this page any time to watch it live.
          </p>
          <a
            href={paymentLinkFor(order.tier)}
            target="_blank"
            rel="noopener"
            className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-ink-900 text-[15px] font-medium text-paper-100 transition hover:bg-ember-500"
          >
            Pay ${tier.dollars} securely <ExternalLink className="h-4 w-4" />
          </a>
          <p className="mt-2.5 text-center text-[11px] text-ink-400">
            After paying, this page updates to &ldquo;Payment confirmed&rdquo; once we verify it.
          </p>
        </Card>
      )}

      {/* ── live status ── */}
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">
            Happening now
          </p>
          {onHold ? (
            <Badge tone="neutral">On hold</Badge>
          ) : done ? (
            <Badge tone="moss">Completed</Badge>
          ) : (
            <Badge tone="orange">{meta.label}</Badge>
          )}
        </div>

        <p className="mt-3 flex items-start gap-2.5 text-[15px] leading-relaxed text-ink-900">
          {onHold ? (
            <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
          ) : (
            <span
              className={cn(
                "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                done ? "bg-moss-500" : "animate-blink bg-ember-500"
              )}
            />
          )}
          <span>{order.live_note || meta.desc}</span>
        </p>

        {/* progress bar */}
        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-paper-300">
          <div
            className="h-full rounded-full bg-ember-500 transition-all duration-700"
            style={{ width: `${Math.max(4, progress * 100)}%` }}
          />
        </div>

        {order.submitted_count > 0 && (
          <p className="mt-3 text-[13px] text-ink-500">
            <span className="figure font-semibold text-ink-900">{order.submitted_count}</span>{" "}
            director{order.submitted_count === 1 ? "y" : "ies"} submitted so far.
          </p>
        )}
      </Card>

      {/* ── pipeline ── */}
      <Card className="mt-6 divide-y divide-ink-900/8">
        {ORDER_STATUS_STEPS.map((step) => {
          const stepIndex = PIPELINE.indexOf(step.key);
          const complete = currentIndex > stepIndex || done;
          const current = currentIndex === stepIndex && !done;
          return (
            <div key={step.key} className="flex items-start gap-3.5 p-4">
              <span
                className={cn(
                  "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[11px]",
                  complete
                    ? "border-moss-500 bg-moss-500 text-paper-100"
                    : current
                    ? "border-ember-500 bg-ember-500/10 text-ember-600"
                    : "border-ink-900/20 text-ink-400"
                )}
              >
                {complete ? <Check className="h-3 w-3" /> : stepIndex + 1}
              </span>
              <div>
                <p
                  className={cn(
                    "text-[14px] font-medium",
                    complete || current ? "text-ink-900" : "text-ink-400"
                  )}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink-500">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </Card>

      {/* ── report ── */}
      {order.report_url && (
        <a
          href={order.report_url}
          target="_blank"
          rel="noopener"
          className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-moss-500/40 bg-moss-500/5 p-5 transition hover:border-moss-500/70"
        >
          <span className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-moss-600" />
            <span>
              <span className="block text-[14px] font-semibold text-ink-900">Your submission report</span>
              <span className="block text-[12px] text-ink-500">Every directory, link and status</span>
            </span>
          </span>
          <ExternalLink className="h-4 w-4 text-ink-400" />
        </a>
      )}

      {/* ── what you gave us ── */}
      <div className="mt-8 rounded-xl border border-ink-900/12 bg-paper-100 p-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-400">Your details</p>
        <dl className="mt-3 grid gap-2 text-[13px] sm:grid-cols-2">
          <Detail label="Product" value={order.product_name} />
          {order.website_url && <Detail label="Website" value={order.website_url} />}
          {order.x_handle && <Detail label="X" value={order.x_handle} />}
          {order.linkedin_handle && <Detail label="LinkedIn" value={order.linkedin_handle} />}
        </dl>
        <p className="mt-3 text-[12px] text-ink-400">
          Something wrong?{" "}
          <Link href="/directories" className="underline hover:text-ember-600">
            Get in touch
          </Link>{" "}
          and we&apos;ll fix it before we submit.
        </p>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-ink-400">{label}</dt>
      <dd className="truncate text-ink-700">{value}</dd>
    </div>
  );
}
