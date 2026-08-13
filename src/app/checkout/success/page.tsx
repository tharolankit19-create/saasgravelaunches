import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock } from "lucide-react";
import { Card, LinkButton } from "@/components/ui";
import { currentUser } from "@/lib/supabase/server";
import { verifyDodoPayment } from "@/lib/dodo";
import { fulfilPurchase } from "@/lib/fulfil";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Payment received", robots: { index: false } };

/**
 * Post-checkout landing.
 *
 * The webhook is still the source of truth, but it can be late, so this page
 * asks Dodo directly and fulfils on the spot if the payment is confirmed.
 * Fulfilment is idempotent, so whichever path gets there first wins.
 */
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { kind?: string; ref?: string; payment_id?: string; p?: string };
}) {
  const user = await currentUser();
  const { kind, ref } = searchParams;
  const paymentId = searchParams.payment_id;

  let confirmed = false;

  if (kind && ref) {
    const verified = paymentId ? await verifyDodoPayment(paymentId) : null;
    if (verified) {
      const result = await fulfilPurchase({
        kind,
        referenceId: ref,
        buyerId: user?.id,
        dodoPaymentId: paymentId,
      });
      confirmed = result.ok;
    }
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20 sm:px-6">
      <Card className="p-8 text-center">
        <span
          className={
            confirmed
              ? "mx-auto grid h-14 w-14 place-items-center rounded-full bg-moss-500/10 text-moss-600"
              : "mx-auto grid h-14 w-14 place-items-center rounded-full bg-brass-500/10 text-brass-600"
          }
        >
          {confirmed ? <CheckCircle2 className="h-7 w-7" /> : <Clock className="h-7 w-7" />}
        </span>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-ink-900">
          {confirmed ? "You're all set." : "Payment received — finishing up"}
        </h1>

        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
          {confirmed
            ? kind === "premium"
              ? "Your listing is Premium now — the verified badge is live on your product page."
              : "Your slot is booked. Reply to your receipt with your logo, headline and link, and we'll have it running within a day."
            : "Dodo hasn't confirmed the payment to us yet. This usually takes a few seconds — refresh, or check your dashboard in a minute. Nothing is lost either way."}
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <LinkButton href="/dashboard">Go to dashboard</LinkButton>
          <LinkButton href="/" variant="outline">
            Back to this week
          </LinkButton>
        </div>

        <p className="mt-6 text-[12px] text-ink-400">
          Something wrong?{" "}
          <Link href="/pricing" className="text-ember-600 hover:underline">
            See what you bought
          </Link>{" "}
          or reply to your receipt email.
        </p>
      </Card>
    </div>
  );
}
