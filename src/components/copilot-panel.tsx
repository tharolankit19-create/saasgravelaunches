"use client";

import { useState } from "react";
import { Loader2, Sparkles, AlertTriangle, Check, Clock, Lock } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button, Card, Rubric } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Check as CheckResult, Review, Timing } from "@/lib/copilot";

type Result = Review & {
  timing: Timing;
  taglines: string[];
  rewrite: string | null;
  premium: boolean;
  note: string | null;
};

/**
 * The Copilot panel on the submit form.
 *
 * It reviews the draft before it goes live and says exactly what's weak. The
 * score is computed from rules, so it's the same answer twice and a maker can
 * argue with it; the tagline rewrites are the AI part, and the paid part.
 */
export function CopilotPanel({
  draft,
  onApplyTagline,
  onApplyDescription,
}: {
  draft: Record<string, unknown>;
  onApplyTagline: (t: string) => void;
  onApplyDescription: (d: string) => void;
}) {
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Copilot couldn't run.");
      setResult(data);
    } catch (e: any) {
      toast.error(e?.message || "Copilot couldn't run.");
    } finally {
      setBusy(false);
    }
  }

  const grade = result?.grade;
  const gradeTone =
    grade === "Excellent" || grade === "Strong"
      ? "text-moss-600"
      : grade === "Fair"
        ? "text-brass-600"
        : "text-oxblood-600";

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Rubric className="mb-2">Launch Copilot</Rubric>
          <p className="text-[14px] leading-relaxed text-ink-500">
            Have your listing reviewed before it goes live. Scores what you&apos;ve written, says
            what&apos;s weak, and tells you whether today is the right day to publish.
          </p>
        </div>
        <Button type="button" onClick={run} disabled={busy} variant="outline" size="sm">
          {busy ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Reviewing…
            </>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" /> {result ? "Re-run" : "Review my draft"}
            </>
          )}
        </Button>
      </div>

      {result && (
        <div className="mt-6 space-y-6">
          {/* score */}
          <div className="flex items-center gap-5 border-t border-ink-900/10 pt-5">
            <div className="text-center">
              <p className={cn("figure text-4xl font-semibold", gradeTone)}>{result.score}</p>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                out of 100
              </p>
            </div>
            <div className="min-w-0 flex-1">
              <p className={cn("font-serif text-lg font-semibold", gradeTone)}>{result.grade}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">{result.headline}</p>
            </div>
          </div>

          {/* timing */}
          <div
            className={cn(
              "flex items-start gap-3 border p-4",
              result.timing.urgent
                ? "border-brass-500/35 bg-brass-500/8"
                : "border-moss-500/30 bg-moss-500/8"
            )}
          >
            <Clock className="mt-0.5 h-4 w-4 shrink-0 text-ink-500" />
            <div>
              <p className="text-[14px] font-semibold text-ink-900">{result.timing.advice}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-ink-500">
                {result.timing.detail}
              </p>
            </div>
          </div>

          {/* checks */}
          <ul className="divide-y divide-ink-900/8 border-y border-ink-900/8">
            {result.checks.map((c) => (
              <CheckRow key={c.id} check={c} />
            ))}
          </ul>

          {/* rewrites — the paid half */}
          {result.premium ? (
            <div>
              {result.taglines.length > 0 && (
                <>
                  <Rubric className="mb-3">Stronger taglines</Rubric>
                  <ul className="space-y-2">
                    {result.taglines.map((t) => (
                      <li
                        key={t}
                        className="flex flex-wrap items-center justify-between gap-2 border border-ink-900/12 bg-paper-200/50 p-3"
                      >
                        <span className="text-[14px] text-ink-700">{t}</span>
                        <button
                          type="button"
                          onClick={() => {
                            onApplyTagline(t);
                            toast.success("Tagline applied.");
                          }}
                          className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-oxblood-600 hover:underline"
                        >
                          Use this
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {result.rewrite && (
                <>
                  <Rubric className="mb-3 mt-5">Tightened description</Rubric>
                  <div className="border border-ink-900/12 bg-paper-200/50 p-3">
                    <p className="text-[13px] leading-relaxed text-ink-700">{result.rewrite}</p>
                    <button
                      type="button"
                      onClick={() => {
                        onApplyDescription(result.rewrite!);
                        toast.success("Description applied.");
                      }}
                      className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-oxblood-600 hover:underline"
                    >
                      Use this
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex items-start gap-3 border border-ink-900/12 bg-paper-200/50 p-4">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
              <p className="text-[13px] leading-relaxed text-ink-500">
                The review above is free and always will be. AI rewrites — three stronger taglines
                and a tightened description — come with{" "}
                <Link href="/pricing" className="font-medium text-oxblood-600 hover:underline">
                  Premium
                </Link>
                .
              </p>
            </div>
          )}

          {result.note && <p className="text-[12px] text-ink-400">{result.note}</p>}
        </div>
      )}
    </Card>
  );
}

function CheckRow({ check }: { check: CheckResult }) {
  const icon =
    check.state === "pass" ? (
      <Check className="h-3.5 w-3.5 text-moss-500" />
    ) : check.state === "warn" ? (
      <AlertTriangle className="h-3.5 w-3.5 text-brass-500" />
    ) : (
      <AlertTriangle className="h-3.5 w-3.5 text-oxblood-500" />
    );

  return (
    <li className="flex items-start gap-3 py-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={cn(
              "text-[13px]",
              check.state === "pass" ? "text-ink-500" : "font-medium text-ink-900"
            )}
          >
            {check.label}
          </p>
          <span className="figure shrink-0 text-[11px] text-ink-400">
            {check.points}/{check.max}
          </span>
        </div>
        {check.fix && <p className="mt-1 text-[12px] leading-relaxed text-ink-500">{check.fix}</p>}
      </div>
    </li>
  );
}
