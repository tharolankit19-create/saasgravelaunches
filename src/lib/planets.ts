// ─── Conquer the solar system ───────────────────────────────
// Every celestial body is a slot one SaaS can own. Bigger the body, higher the
// floor price — the Sun is the crown, rocks are pocket change. To take a body
// someone already holds, you pay more than they did. Pure territory game.
//
// Client-safe: no server imports. Visual params (radius, colour, orbit) drive
// the 3D scene; `minDollars` drives the price.

export type BodyKind = "star" | "planet" | "moon" | "dwarf" | "rock";

export type Body = {
  id: string;
  name: string;
  kind: BodyKind;
  /** Visual radius in scene units. */
  radius: number;
  /** Base surface colour. */
  color: string;
  /** Orbit radius from the Sun (0 for the Sun itself). */
  orbit: number;
  /** Orbit speed multiplier. */
  speed: number;
  /** Starting angle so bodies don't line up. */
  phase: number;
  /** Floor price in whole dollars. */
  minDollars: number;
  /** Saturn-style ring. */
  ring?: boolean;
  /** One-line flavour for the panel. */
  blurb: string;
};

// The system, sorted the way it's sold: the Sun first (the prize), then the
// giants, the terrestrials, the moon, the dwarfs and the rubble.
export const BODIES: Body[] = [
  { id: "sun", name: "The Sun", kind: "star", radius: 2.4, color: "#ff9d2f", orbit: 0, speed: 0, phase: 0, minDollars: 100, blurb: "The center of everything. One owner. The whole system revolves around you." },
  { id: "jupiter", name: "Jupiter", kind: "planet", radius: 1.35, color: "#d9a066", orbit: 12.5, speed: 0.30, phase: 0.4, minDollars: 50, ring: false, blurb: "The largest planet. Impossible to miss." },
  { id: "saturn", name: "Saturn", kind: "planet", radius: 1.15, color: "#e2c98b", orbit: 15.5, speed: 0.24, phase: 2.1, minDollars: 40, ring: true, blurb: "The one with the rings. A statement." },
  { id: "neptune", name: "Neptune", kind: "planet", radius: 0.82, color: "#3b5bd9", orbit: 18.5, speed: 0.16, phase: 3.5, minDollars: 30, blurb: "Deep blue, far out, hard to reach." },
  { id: "uranus", name: "Uranus", kind: "planet", radius: 0.8, color: "#8fd7d7", orbit: 17.0, speed: 0.18, phase: 5.0, minDollars: 28, ring: true, blurb: "Ice giant, tilted on its side." },
  { id: "earth", name: "Earth", kind: "planet", radius: 0.6, color: "#3b82c4", orbit: 8.6, speed: 0.5, phase: 1.2, minDollars: 25, blurb: "Home. The blue marble everyone recognises." },
  { id: "venus", name: "Venus", kind: "planet", radius: 0.55, color: "#d8a86a", orbit: 6.8, speed: 0.62, phase: 4.2, minDollars: 18, blurb: "The bright evening star." },
  { id: "mars", name: "Mars", kind: "planet", radius: 0.45, color: "#c1440e", orbit: 10.4, speed: 0.42, phase: 2.7, minDollars: 18, blurb: "The red planet. Frontier energy." },
  { id: "mercury", name: "Mercury", kind: "planet", radius: 0.32, color: "#9b8b7a", orbit: 4.6, speed: 0.9, phase: 0.9, minDollars: 12, blurb: "Closest to the Sun. Fast and small." },
  { id: "moon", name: "The Moon", kind: "moon", radius: 0.22, color: "#c4c4c4", orbit: 9.6, speed: 0.55, phase: 1.9, minDollars: 10, blurb: "Everyone's first step off Earth." },
  { id: "pluto", name: "Pluto", kind: "dwarf", radius: 0.24, color: "#c8b6a0", orbit: 21.0, speed: 0.12, phase: 0.2, minDollars: 8, blurb: "Dwarf planet. Underdog favourite." },
  { id: "rock-1", name: "Asteroid 2601", kind: "rock", radius: 0.16, color: "#8a8177", orbit: 11.2, speed: 0.46, phase: 3.9, minDollars: 5, blurb: "A belt rock. Cheap real estate in space." },
  { id: "rock-2", name: "Asteroid 1174", kind: "rock", radius: 0.14, color: "#7a736a", orbit: 11.6, speed: 0.44, phase: 5.6, minDollars: 4, blurb: "A belt rock. Start small, aim big." },
  { id: "rock-3", name: "Asteroid 0480", kind: "rock", radius: 0.13, color: "#948a7e", orbit: 11.0, speed: 0.48, phase: 0.6, minDollars: 3, blurb: "The cheapest patch of sky there is." },
];

export function bodyById(id: string): Body | undefined {
  return BODIES.find((b) => b.id === id);
}

export function isBodyId(v: unknown): v is string {
  return typeof v === "string" && BODIES.some((b) => b.id === v);
}

/** To steal an owned body you must bid this multiple of the current price. */
export const STEAL_MULTIPLE = 1.5;

/**
 * Dollars needed to take a body: unclaimed → its floor; already owned → 1.5× the
 * current owner's price (rounded up), and never below the floor. That's the
 * whole rule — cheap to grab an empty planet, real money to steal a held one.
 */
export function requiredDollars(body: Body, ownerCents: number | null): number {
  if (ownerCents && ownerCents > 0) {
    const steal = Math.ceil((ownerCents / 100) * STEAL_MULTIPLE);
    return Math.max(body.minDollars, steal);
  }
  return body.minDollars;
}

/** Whole USD ceiling so a fat-fingered quantity can't ask for a fortune. */
export const CLAIM_MAX_DOLLARS = 1_000_000;

// The custom-amount Dodo product ($1/unit — quantity carries the dollar amount).
const CLAIM_LINK = "https://checkout.dodopayments.com/buy/pdt_0NloRH53R9K6gpPSvvea4";

export function claimPaymentBase(): string {
  return process.env.PLANET_DODO_LINK?.trim() || CLAIM_LINK;
}

export function claimUnitDollars(): number {
  const v = Number(process.env.PLANET_UNIT_DOLLARS);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

/**
 * Checkout link for one claim. The token rides along as metadata so the webhook
 * can activate that exact row, and redirect_url returns the buyer to the map.
 */
export function claimCheckoutLink(
  token: string,
  amountDollars: number,
  redirectUrl?: string,
  visitorId?: string
): string {
  const url = new URL(claimPaymentBase());
  const quantity = Math.max(1, Math.round(amountDollars / claimUnitDollars()));
  url.searchParams.set("quantity", String(quantity));
  url.searchParams.set("metadata_kind", "planet");
  url.searchParams.set("metadata_claim_token", token);
  if (visitorId) url.searchParams.set("metadata_datafast_visitor_id", visitorId);
  if (redirectUrl) url.searchParams.set("redirect_url", redirectUrl);
  return url.toString();
}

export function newClaimToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export type Owner = {
  planet_id: string;
  product_name: string | null;
  url: string;
  logo_url: string | null;
  tagline: string | null;
  amount_cents: number;
  public_token: string;
};

/** The current owner of each body: the highest active claim per planet. */
export function ownersByPlanet(rows: Owner[]): Record<string, Owner> {
  const best: Record<string, Owner> = {};
  for (const r of rows) {
    const cur = best[r.planet_id];
    if (!cur || r.amount_cents > cur.amount_cents) best[r.planet_id] = r;
  }
  return best;
}

export function dollars(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function normalizeUrl(input: string): string | null {
  const raw = (input || "").trim();
  if (!raw) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (!u.hostname.includes(".")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function nameFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const label = host.split(".").slice(-2, -1)[0] || host;
    return label.charAt(0).toUpperCase() + label.slice(1);
  } catch {
    return "Your SaaS";
  }
}
