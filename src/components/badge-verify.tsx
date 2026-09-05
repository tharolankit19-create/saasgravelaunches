"use client";

import { useState } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/track-client";

/**
 * The "verify your backlink" control. The maker pastes our badge on their site
 * (the code + AI prompt are right above this, in BadgeEmbed), then clicks here:
 * we fetch their homepage and confirm the link is really there. On success the
 * launch shows a Verified mark. Not a hard gate — a maker can launch and verify
 * whenever their site is live.
 */
export function BadgeVerify({
  slug,
  initialVerified,
}: {
  slug: string;
  initialVerified: boolean;
}) {
  const [verified, setVerified] = useState(initialVerified);
  const [busy, setBusy] = useState(false);

  async function verify() {
    setBusy(true);
    try {
      const res = await fetch("/api/verify-badge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't verify right now.");

      if (data.verified) {
        setVerified(true);
        trackEvent("badge_verified", { productSlug: slug });
        toast.success("Verified — your backlink is live. Your launch now shows a Verified mark.");
      } else {
        toast.error(data.error || "We didn't find the badge on your site yet.");
      }
    } catch (e: any) {
      toast.error(e?.message || "Couldn't verify right now.");
    } finally {
      setBusy(false);
    }
  }

  if (verified) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-moss-500/30 bg-moss-500/[0.07] px-4 py-3">
        <ShieldCheck className="h-4 w-4 text-moss-600" />
        <span className="text-[13px] font-medium text-ink-900">
          Backlink verified — your launch is a Verified member.
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-ink-900/15 bg-paper-200/40 px-4 py-3">
      <p className="text-[13px] text-ink-500">
        Added the badge to your site?{" "}
        <span className="font-medium text-ink-900">Verify it</span> to earn the Verified mark.
      </p>
      <button
        type="button"
        onClick={verify}
        disabled={busy}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-ink-900 px-4 py-2 text-[13px] font-medium text-paper-100 transition hover:bg-ember-500 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
        {busy ? "Checking…" : "Verify my backlink"}
      </button>
    </div>
  );
}
