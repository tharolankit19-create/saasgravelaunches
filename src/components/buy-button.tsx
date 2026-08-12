"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { trackEvent } from "@/lib/track-client";

/**
 * Starts a Dodo checkout. Nothing about the price travels from here — the
 * client sends a product key, and the server resolves the amount and the Dodo
 * product from the catalogue. That's the only way a price can't be tampered
 * with in the browser.
 */
export function BuyButton({
  product,
  label,
  className,
  soldOut,
}: {
  product: "sidebar" | "feed" | "premium";
  label: string;
  className?: string;
  soldOut?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function buy() {
    setBusy(true);
    trackEvent("checkout_start", { meta: { product } });
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product }),
      });
      const data = await res.json();

      if (res.status === 401) {
        router.push(`/login?next=${encodeURIComponent("/pricing")}`);
        return;
      }
      if (!res.ok) throw new Error(data?.error || "Checkout couldn't start.");
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e?.message || "Checkout couldn't start.");
      setBusy(false);
    }
  }

  if (soldOut) {
    return (
      <Button variant="outline" className={className} disabled>
        Sold out this month
      </Button>
    );
  }

  return (
    <Button onClick={buy} disabled={busy} className={className} variant="dark">
      {busy ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Opening checkout…
        </>
      ) : (
        <>
          {label} <ArrowUpRight className="h-4 w-4" />
        </>
      )}
    </Button>
  );
}
