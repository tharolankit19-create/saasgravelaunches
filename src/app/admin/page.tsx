import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertTriangle, Info, TriangleAlert } from "lucide-react";
import { Card, Eyebrow, Stat, Badge } from "@/components/ui";
import { isAdmin } from "@/lib/admin";
import { buildInsights } from "@/lib/insights";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Admin — traffic diagnosis", robots: { index: false } };

/**
 * The operator's page: where traffic came from, where it stopped, and what to
 * do about it. Same data the Hermes watcher polls, rendered for a human.
 */
export default async function AdminPage({ searchParams }: { searchParams: { days?: string } }) {
  if (!(await isAdmin())) notFound();

  const days = Math.min(90, Math.max(1, Number(searchParams.days) || 7));
  const i = await buildInsights(days);
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const maxSessions = Math.max(1, ...i.daily.map((d) => d.sessions));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow className="mb-2">Admin</Eyebrow>
          <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Traffic diagnosis</h1>
          <p className="mt-2 text-sm text-ink-500">
            Last {days} days · generated {new Date(i.generatedAt).toLocaleString()}
          </p>
        </div>
        <div className="flex gap-1.5">
          {[1, 7, 30].map((d) => (
            <a
              key={d}
              href={`/admin?days=${d}`}
              className={cn(
                "rounded-lg px-3 py-1.5 text-[13px] font-medium transition",
                d === days ? "bg-ink-900 text-white" : "text-ink-500 hover:bg-paper-200"
              )}
            >
              {d}d
            </a>
          ))}
        </div>
      </div>

      {/* ── findings ── */}
      <section className="mt-8">
        <Eyebrow className="mb-3">What to do about it</Eyebrow>
        {i.findings.length === 0 ? (
          <Card className="p-6 text-sm text-ink-500">
            Nothing is tripping a threshold in this window. Either it&apos;s genuinely healthy or
            there isn&apos;t enough traffic yet to tell.
          </Card>
        ) : (
          <div className="space-y-3">
            {i.findings.map((f, idx) => (
              <Card
                key={idx}
                className={cn(
                  "p-5",
                  f.severity === "critical" && "border-l-4 border-l-red-500/70",
                  f.severity === "warn" && "border-l-4 border-l-medal-500/70",
                  f.severity === "info" && "border-l-4 border-l-violet-500/50"
                )}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-0.5",
                      f.severity === "critical" && "text-red-600",
                      f.severity === "warn" && "text-medal-600",
                      f.severity === "info" && "text-violet-600"
                    )}
                  >
                    {f.severity === "critical" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : f.severity === "warn" ? (
                      <TriangleAlert className="h-4 w-4" />
                    ) : (
                      <Info className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="text-[14px] font-semibold text-ink-900">{f.title}</p>
                    <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{f.detail}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-ink-700">
                      <span className="font-medium">Do this: </span>
                      {f.action}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* ── totals ── */}
      <Card className="mt-8 grid grid-cols-2 gap-6 p-6 sm:grid-cols-4">
        <Stat value={i.totals.sessions} label="Sessions" />
        <Stat value={i.totals.pageViews} label="Page views" />
        <Stat value={i.totals.publishes} label="Launches published" />
        <Stat value={pct(i.friction.bounceRate)} label="One-event sessions" />
      </Card>

      {/* ── funnel ── */}
      <section className="mt-8">
        <Eyebrow className="mb-3">Where people stop</Eyebrow>
        <Card className="divide-y divide-ink-900/8">
          {i.funnel.map((step, idx) => (
            <div key={step.event} className="p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[14px] font-medium text-ink-900">{step.label}</p>
                <p className="font-mono text-[13px] text-ink-500">
                  {step.sessions}
                  {idx > 0 && (
                    <span
                      className={cn(
                        "ml-2",
                        step.stepRate < 0.35 ? "text-red-600" : "text-ink-400"
                      )}
                    >
                      {pct(step.stepRate)} of previous
                    </span>
                  )}
                </p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-paper-300">
                <div
                  className="h-full rounded-full bg-violet-500"
                  style={{ width: `${Math.max(1, step.totalRate * 100)}%` }}
                />
              </div>
              {idx > 0 && step.dropped > 0 && (
                <p className="mt-1.5 text-[12px] text-ink-400">
                  {step.dropped} session{step.dropped === 1 ? "" : "s"} dropped here
                </p>
              )}
            </div>
          ))}
        </Card>
      </section>

      {/* ── sources + daily ── */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <Eyebrow className="mb-3">Where they came from</Eyebrow>
          <Card className="p-5">
            {i.sources.length === 0 ? (
              <p className="text-sm text-ink-400">No traffic in this window.</p>
            ) : (
              <ul className="space-y-2.5">
                {i.sources.map((s) => (
                  <li key={s.host} className="flex items-center gap-3">
                    <span className="w-32 shrink-0 truncate text-[13px] text-ink-700">{s.label}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-300">
                      <span
                        className="block h-full rounded-full bg-signal-500"
                        style={{ width: `${Math.max(2, s.share * 100)}%` }}
                      />
                    </span>
                    <span className="w-14 shrink-0 text-right font-mono text-[12px] text-ink-500">
                      {s.sessions}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section>
          <Eyebrow className="mb-3">By day</Eyebrow>
          <Card className="p-5">
            <div className="flex h-32 items-end gap-1.5">
              {i.daily.map((d) => (
                <div key={d.day} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    title={`${d.day}: ${d.sessions} sessions`}
                    className="w-full rounded-t bg-violet-500/70"
                    style={{ height: `${Math.max(2, (d.sessions / maxSessions) * 100)}%` }}
                  />
                  <span className="text-[9px] text-ink-400">{d.day.slice(8)}</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      </div>

      {/* ── friction detail ── */}
      <section className="mt-8">
        <Eyebrow className="mb-3">Friction</Eyebrow>
        <Card className="grid grid-cols-2 gap-5 p-6 sm:grid-cols-3">
          <Stat value={i.friction.abandonedDrafts} label="Opened form, didn't publish" />
          <Stat value={pct(i.friction.autofillErrorRate)} label="Autofill error rate" />
          <Stat value={i.friction.publishBlocked} label="Blocked by support rule" />
          <Stat value={i.friction.publishErrors} label="Publish errors" />
          <Stat value={i.content.zeroUpvoteLive} label="Live with zero upvotes" />
          <Stat value={i.content.draftsTotal} label="Drafts sitting unfinished" />
        </Card>
      </section>

      {/* ── top content ── */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section>
          <Eyebrow className="mb-3">Top pages</Eyebrow>
          <Card className="divide-y divide-ink-900/8">
            {i.topPaths.length === 0 ? (
              <p className="p-5 text-sm text-ink-400">Nothing yet.</p>
            ) : (
              i.topPaths.map((p) => (
                <div key={p.path} className="flex items-center justify-between gap-3 p-3.5">
                  <span className="truncate text-[13px] text-ink-700">{p.path}</span>
                  <span className="font-mono text-[12px] text-ink-500">{p.views}</span>
                </div>
              ))
            )}
          </Card>
        </section>

        <section>
          <Eyebrow className="mb-3">Most-viewed products</Eyebrow>
          <Card className="divide-y divide-ink-900/8">
            {i.topProducts.length === 0 ? (
              <p className="p-5 text-sm text-ink-400">Nothing yet.</p>
            ) : (
              i.topProducts.map((p) => (
                <div key={p.slug} className="flex items-center justify-between gap-3 p-3.5">
                  <a
                    href={`/products/${p.slug}`}
                    className="truncate text-[13px] text-ink-700 hover:text-violet-600"
                  >
                    {p.slug}
                  </a>
                  <span className="font-mono text-[12px] text-ink-500">{p.views}</span>
                </div>
              ))
            )}
          </Card>
        </section>
      </div>

      <Card className="mt-8 p-5">
        <p className="text-[13px] font-semibold text-ink-900">Machine access</p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">
          The Hermes watcher reads this same report from{" "}
          <code className="rounded bg-paper-200 px-1.5 py-0.5 font-mono text-[12px]">
            GET /api/admin/insights?days={days}&amp;narrate=1
          </code>{" "}
          with a bearer token from <code className="font-mono text-[12px]">ADMIN_INSIGHTS_TOKEN</code>.
        </p>
        <div className="mt-3">
          <Badge tone={process.env.ADMIN_INSIGHTS_TOKEN ? "signal" : "neutral"}>
            {process.env.ADMIN_INSIGHTS_TOKEN ? "token configured" : "token not set — machine access off"}
          </Badge>
        </div>
      </Card>
    </div>
  );
}
