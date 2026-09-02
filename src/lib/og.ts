// ─── OG image helpers ───────────────────────────────────────
// Shared by the social cards (opengraph-image / twitter-image routes).
// Satori (next/og) needs raw font buffers, so we pull the brand faces —
// Fraunces for the masthead, Instrument Sans for the body — from Google's
// static hosting at render time. Everything is best-effort: if a fetch ever
// fails, the card still renders in next/og's bundled default font instead of
// throwing a 500. Buffers are cached per warm lambda so we fetch once.

type FontSpec = { name: string; data: ArrayBuffer; weight: 400 | 500 | 600 | 900; style: "normal" };

const cache = new Map<string, ArrayBuffer | null>();

/**
 * Fetch a single TTF weight of a Google font. We ask the CSS API with an
 * ancient User-Agent so it hands back a plain TrueType URL (modern UAs get
 * woff2, which Satori can't parse), then fetch that file.
 */
async function loadGoogleFont(family: string, weight: number): Promise<ArrayBuffer | null> {
  const key = `${family}:${weight}`;
  if (cache.has(key)) return cache.get(key) ?? null;
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}`,
      // Windows-XP UA: no woff2 support, so Google hands back a plain .ttf.
      { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 5.1)" } }
    ).then((r) => r.text());
    const url =
      css.match(/src:\s*url\((https:[^)]+\.ttf)\)/)?.[1] ||
      css.match(/url\((https:[^)]+)\)\s*format\(['"]?truetype/)?.[1];
    if (!url) throw new Error("no ttf url");
    const data = await fetch(url).then((r) => r.arrayBuffer());
    cache.set(key, data);
    return data;
  } catch {
    cache.set(key, null);
    return null;
  }
}

/** The brand faces used across the cards. Returns only the ones that loaded. */
export async function brandFonts(): Promise<FontSpec[]> {
  const [frauncesBlack, frauncesMed, sans, sansBold] = await Promise.all([
    loadGoogleFont("Fraunces", 900),
    loadGoogleFont("Fraunces", 500),
    loadGoogleFont("Instrument Sans", 400),
    loadGoogleFont("Instrument Sans", 600),
  ]);
  const fonts: FontSpec[] = [];
  if (frauncesBlack) fonts.push({ name: "Fraunces", data: frauncesBlack, weight: 900, style: "normal" });
  if (frauncesMed) fonts.push({ name: "Fraunces", data: frauncesMed, weight: 500, style: "normal" });
  if (sans) fonts.push({ name: "Instrument Sans", data: sans, weight: 400, style: "normal" });
  if (sansBold) fonts.push({ name: "Instrument Sans", data: sansBold, weight: 600, style: "normal" });
  return fonts;
}
