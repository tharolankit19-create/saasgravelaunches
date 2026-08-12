"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button, inputClass } from "@/components/ui";
import { cn } from "@/lib/utils";

/** The weekly digest: the top launches of the week, once a week. */
export function NewsletterForm({ source = "footer" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Couldn't sign you up.");
      setDone(true);
      toast.success("You're in. One email a week, the top launches only.");
    } catch (e: any) {
      toast.error(e?.message || "Couldn't sign you up.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <p className="text-sm text-signal-600">
        You&apos;re on the list — the next digest lands Monday.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@company.com"
        className={cn(inputClass, "sm:flex-1")}
      />
      <Button type="submit" disabled={busy} variant="dark">
        {busy ? "…" : "Get the weekly top 10"}
      </Button>
    </form>
  );
}
