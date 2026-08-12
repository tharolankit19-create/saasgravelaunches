import { Check } from "lucide-react";
import { Card, Eyebrow } from "@/components/ui";
import { getSiteStats } from "@/lib/launches";
import { FREE_PERKS, SUPPORT_THRESHOLD } from "@/lib/pricing";

/** The reassurance column beside the auth form: what the account is actually for. */
export async function AuthAside() {
  const stats = await getSiteStats();

  return (
    <div className="hidden self-center lg:block">
      <Eyebrow className="mb-3">One account, both products</Eyebrow>
      <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
        Launch, upvote, and keep the backlink.
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500">
        Your Saasgrave account works here too — same profile, same sign-in. Nothing to migrate.
      </p>

      <ul className="mt-6 space-y-2.5">
        {FREE_PERKS.map((p) => (
          <li key={p} className="flex items-start gap-2.5 text-sm text-ink-700">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal-500" />
            {p}
          </li>
        ))}
      </ul>

      <Card className="mt-8 p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            [stats.liveTotal, "products"],
            [stats.makers, "makers"],
            [stats.upvotes, "upvotes"],
          ].map(([value, label]) => (
            <div key={label as string}>
              <p className="font-mono text-lg font-semibold text-ink-900">{value as number}</p>
              <p className="text-[11px] uppercase tracking-wider text-ink-400">{label as string}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 border-t border-ink-900/8 pt-4 text-[12px] leading-relaxed text-ink-400">
          Fair warning: publishing needs {SUPPORT_THRESHOLD} upvotes on other people&apos;s launches
          first. It&apos;s the only rule here.
        </p>
      </Card>
    </div>
  );
}
