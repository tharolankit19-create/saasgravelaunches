import { NextResponse } from "next/server";
import { createAdminClient, currentUser } from "@/lib/supabase/server";
import { faviconFor } from "@/lib/directories";
import {
  bodyById,
  isBodyId,
  requiredDollars,
  claimCheckoutLink,
  newClaimToken,
  normalizeUrl,
  nameFromUrl,
  CLAIM_MAX_DOLLARS,
  type Owner,
} from "@/lib/planets";
import { readCookie } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Claim a celestial body.
 *
 * The buyer picks a body, a URL and an amount. We check the amount clears the
 * body's floor and beats the current owner, mint a pending row, and hand back
 * the Dodo checkout link (amount as quantity, token as metadata). The claim
 * only lands on the map once the webhook confirms the payment.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));

  const planetId = body?.planetId;
  if (!isBodyId(planetId)) {
    return NextResponse.json({ error: "Pick a body first." }, { status: 400 });
  }
  const planet = bodyById(planetId)!;

  const url = normalizeUrl(String(body?.url || ""));
  if (!url) {
    return NextResponse.json({ error: "Enter a valid product URL." }, { status: 400 });
  }

  const amount = Math.round(Number(body?.amount));
  if (!Number.isFinite(amount) || amount < 1) {
    return NextResponse.json({ error: "Enter your bid." }, { status: 400 });
  }
  if (amount > CLAIM_MAX_DOLLARS) {
    return NextResponse.json({ error: "That bid is too large." }, { status: 400 });
  }

  const productName = String(body?.productName || "").trim().slice(0, 80) || nameFromUrl(url);
  const tagline = String(body?.tagline || "").trim().slice(0, 160) || null;
  const email = String(body?.email || "").trim().slice(0, 200) || null;

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json(
      { error: "Claiming is briefly unavailable. Try again in a minute." },
      { status: 503 }
    );
  }

  // Re-check the floor against the live owner so the price can't be stale.
  const { data: rows } = await admin
    .from("launch_planet_claims")
    .select("planet_id, amount_cents")
    .eq("planet_id", planetId)
    .eq("status", "active")
    .order("amount_cents", { ascending: false })
    .limit(1);
  const ownerCents = (rows?.[0] as Owner | undefined)?.amount_cents ?? null;
  const need = requiredDollars(planet, ownerCents);
  if (amount < need) {
    return NextResponse.json(
      { error: `${planet.name} needs at least $${need} to take.`, need },
      { status: 409 }
    );
  }

  const user = await currentUser().catch(() => null);
  const token = newClaimToken();

  const { error } = await admin.from("launch_planet_claims").insert({
    planet_id: planetId,
    public_token: token,
    product_name: productName,
    url,
    logo_url: faviconFor(url, 128),
    tagline,
    amount_cents: amount * 100,
    status: "pending",
    contact_email: email,
    user_id: user?.id ?? null,
  });

  if (error) {
    console.error("planet claim insert failed:", error);
    const missingTable = error.code === "42P01";
    return NextResponse.json(
      {
        error: missingTable
          ? "Claiming isn't set up yet — the table is missing. (Run the migration.)"
          : "Couldn't start your claim. Try again.",
        code: error.code,
      },
      { status: 500 }
    );
  }

  const origin = new URL(request.url).origin;
  const visitorId = readCookie(request, "datafast_visitor_id");
  return NextResponse.json({
    token,
    checkoutUrl: claimCheckoutLink(token, amount, `${origin}/planets?claimed=${planetId}`, visitorId),
  });
}
