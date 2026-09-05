import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Rubric } from "@/components/ui";
import { SubmitForm } from "@/components/submit-form";
import { TrackOnMount } from "@/components/tracker";
import { currentUser } from "@/lib/supabase/server";
import {
  getFeaturedOpenForWeeks,
  getOwnDraft,
  getSupportCount,
  getWeekSlots,
  isSupportGateActive,
} from "@/lib/launches";
import { isPremium } from "@/lib/premium";
import { SUPPORT_THRESHOLD } from "@/lib/pricing";
import { currentWeekKey, upcomingWeeks, weekLabel, weekRangeLabel } from "@/lib/week";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Launch your product — free, in about a minute",
  description:
    "Paste your URL and AI writes the listing. Land on this week's board, keep a permanent product page and a dofollow backlink. Free, no card.",
};

export default async function LaunchPage({
  searchParams,
}: {
  searchParams: { url?: string; draft?: string };
}) {
  const user = await currentUser();
  // Preserve the URL through sign-in, so a visitor from the hero lands back here
  // with autofill ready to fire rather than starting over.
  if (!user) {
    const next = searchParams.draft
      ? `/launch?draft=${encodeURIComponent(searchParams.draft)}`
      : searchParams.url
        ? `/launch?url=${encodeURIComponent(searchParams.url)}`
        : "/launch";
    redirect(`/login?next=${encodeURIComponent(next)}`);
  }

  // Reopening a saved draft. Read straight from the table (the maker owns it),
  // and fall through to a blank form if the slug isn't theirs.
  const editing = searchParams.draft ? await getOwnDraft(user.id, searchParams.draft) : null;

  const weekKeys = upcomingWeeks(6);
  const [supported, gateActive, premium, slots, featuredOpen] = await Promise.all([
    getSupportCount(user.id),
    isSupportGateActive(),
    isPremium(user.id),
    getWeekSlots(weekKeys),
    getFeaturedOpenForWeeks(weekKeys),
  ]);
  // The support gate only applies once the board has real depth. Until then,
  // anyone can publish freely — you can't upvote three makers who don't exist.
  const canPublish = !gateActive || supported >= SUPPORT_THRESHOLD;

  // The week picker: this week and the next few, each with its free-slot count.
  const weekOptions = slots.map((s) => ({
    week: s.week,
    label: weekLabel(s.week),
    range: weekRangeLabel(s.week),
    open: s.open,
    cap: s.cap,
    featuredOpen: featuredOpen[s.week] ?? 3,
  }));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <TrackOnMount event="submit_start" />

      <Rubric className="mb-3">
        {editing ? "Editing draft" : `New launch · ${weekLabel(currentWeekKey())}`}
      </Rubric>
      <h1 className="font-serif text-masthead font-semibold text-ink-900">
        {editing ? editing.name || "Your draft" : "Launch your product"}
      </h1>
      <p className="mt-2 text-[15px] text-ink-500">
        {editing
          ? "Pick up where you left off. Nothing here is public until you launch it."
          : "Paste your URL, we write the listing. Five fields, about a minute."}
      </p>

      <div className="mt-8">
        <SubmitForm
          canPublish={canPublish}
          gateActive={gateActive}
          supported={Math.min(supported, SUPPORT_THRESHOLD)}
          threshold={SUPPORT_THRESHOLD}
          initialUrl={editing ? undefined : searchParams.url}
          weekOptions={weekOptions}
          premium={premium}
          initialDraft={editing}
        />
      </div>
    </div>
  );
}
