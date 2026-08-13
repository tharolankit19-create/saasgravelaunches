import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import { Card, Rubric } from "@/components/ui";
import { SubmitForm } from "@/components/submit-form";
import { TrackOnMount } from "@/components/tracker";
import { currentUser } from "@/lib/supabase/server";
import { getSupportCount } from "@/lib/launches";
import { FREE_PERKS, SUPPORT_THRESHOLD } from "@/lib/pricing";
import { currentWeekKey, weekLabel } from "@/lib/week";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Launch your product — free, in about a minute",
  description:
    "Paste your URL and AI writes the listing. Land on this week's board, keep a permanent product page and a dofollow backlink. Free, no card.",
};

export default async function LaunchPage() {
  const user = await currentUser();
  if (!user) redirect("/login?next=/launch");

  const supported = await getSupportCount(user.id);
  const canPublish = supported >= SUPPORT_THRESHOLD;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <TrackOnMount event="submit_start" />

      <Rubric className="mb-3">New launch · {weekLabel(currentWeekKey())}</Rubric>
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900 sm:text-4xl">
        Launch your product
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-500">
        Five fields, all of them prefilled from your URL. You&apos;ll be on this week&apos;s board
        before you finish reading this page.
      </p>

      <Card className="mt-6 bg-paper-200/50 p-5">
        <p className="text-[13px] font-semibold text-ink-900">What you get, for nothing</p>
        <ul className="mt-2.5 grid gap-1.5 sm:grid-cols-2">
          {FREE_PERKS.map((p) => (
            <li key={p} className="flex items-start gap-2 text-[13px] text-ink-500">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss-500" />
              {p}
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-8">
        <SubmitForm
          canPublish={canPublish}
          supported={Math.min(supported, SUPPORT_THRESHOLD)}
          threshold={SUPPORT_THRESHOLD}
        />
      </div>
    </div>
  );
}
