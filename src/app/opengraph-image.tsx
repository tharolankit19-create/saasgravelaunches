import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { logoMarkDataUri } from "@/components/logo";
import { brandFonts } from "@/lib/og";

export const alt = "Saasgrave Launches — make your launch impossible to ignore";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card that decides whether anyone clicks the link.
 *
 * Built as a newspaper front page — the brand's own "Launch Register" identity
 * pushed to poster scale. A masthead, one enormous Fraunces headline, and a
 * real still of the live board bleeding off the bottom. Three levers do the
 * persuading: a hook that names the founder's private fear (you built it and
 * nobody saw), the promise of no effort (paste a URL), and proof that it's a
 * real product, not a drawn mock-up. Everyone else ships a dashboard glamour
 * shot; this reads like the front page of a paper you'd want to be printed in.
 */
function shot(): string | null {
  try {
    const file = path.join(process.cwd(), "public", "og-app.png");
    return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
  } catch {
    return null;
  }
}

const INK = "#16181d";
const MUTE = "#5b616b";
const EMBER = "#f2671e";
const STOCK = "#fbfbfc";

export default async function OpengraphImage() {
  const app = shot();
  const fonts = await brandFonts();
  const serif = "Fraunces";
  const sans = "Instrument Sans";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: STOCK,
          fontFamily: sans,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* faint printed-paper wash so the stock reads as paper, not screen */}
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 820,
            height: 620,
            display: "flex",
            background:
              "radial-gradient(circle at 60% 40%, rgba(242,103,30,0.12), rgba(242,103,30,0) 62%)",
          }}
        />

        {/* ── masthead ── */}
        <div style={{ display: "flex", flexDirection: "column", padding: "34px 60px 0" }}>
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoMarkDataUri(30)} width={30} height={30} alt="" />
            <span
              style={{
                display: "flex",
                marginLeft: 12,
                fontFamily: "monospace",
                fontSize: 15,
                letterSpacing: 3,
                color: INK,
              }}
            >
              SAASGRAVE LAUNCHES
            </span>
            <span
              style={{
                display: "flex",
                marginLeft: "auto",
                fontFamily: "monospace",
                fontSize: 15,
                letterSpacing: 2,
                color: MUTE,
              }}
            >
              EST. 2026 · ls.saasgrave.org
            </span>
          </div>
          {/* the double rule — the newspaper tell */}
          <div style={{ display: "flex", marginTop: 14, height: 3, background: INK }} />
          <div style={{ display: "flex", marginTop: 3, height: 1, background: INK }} />
        </div>

        {/* ── the hook ── */}
        <div style={{ display: "flex", flexDirection: "column", padding: "26px 60px 0" }}>
          <span
            style={{
              display: "flex",
              fontFamily: "monospace",
              fontSize: 16,
              letterSpacing: 4,
              color: EMBER,
            }}
          >
            THE WEEKLY LAUNCH REGISTER
          </span>

          <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
            <span
              style={{
                display: "flex",
                fontFamily: serif,
                fontWeight: 900,
                fontSize: 78,
                lineHeight: 0.98,
                letterSpacing: -2.5,
                color: INK,
              }}
            >
              Make your launch
            </span>
            <span
              style={{
                display: "flex",
                fontFamily: serif,
                fontWeight: 900,
                fontSize: 78,
                lineHeight: 1.0,
                letterSpacing: -2.5,
                color: EMBER,
              }}
            >
              impossible to ignore.
            </span>
          </div>

          <span
            style={{
              display: "flex",
              marginTop: 16,
              fontFamily: sans,
              fontSize: 25,
              lineHeight: 1.28,
              color: MUTE,
              maxWidth: 940,
            }}
          >
            Paste your URL — AI writes the listing. Real makers vote. You keep a permanent page
            and a dofollow backlink, long after launch day ends.
          </span>
        </div>

        {/* ── the proof: a real still of the board, bleeding off the bottom ── */}
        {app ? (
          <div
            style={{
              display: "flex",
              position: "relative",
              marginTop: 24,
              marginLeft: 60,
              marginRight: 60,
              borderRadius: "16px 16px 0 0",
              border: "1px solid rgba(22,24,29,0.16)",
              borderBottom: "none",
              overflow: "hidden",
              boxShadow: "0 -2px 60px -20px rgba(22,24,29,0.4)",
              background: "#ffffff",
              height: 232,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={app}
              width={1080}
              height={620}
              alt=""
              style={{ width: "100%", objectFit: "cover", objectPosition: "top" }}
            />
            {/* caption tab — names the real thing on the card */}
            <div
              style={{
                display: "flex",
                position: "absolute",
                top: 16,
                left: 16,
                alignItems: "center",
                gap: 8,
                padding: "8px 16px",
                borderRadius: 999,
                background: INK,
              }}
            >
              <div style={{ display: "flex", width: 8, height: 8, borderRadius: 999, background: EMBER }} />
              <span
                style={{
                  display: "flex",
                  color: "#ffffff",
                  fontFamily: "monospace",
                  fontSize: 14,
                  letterSpacing: 1,
                }}
              >
                LIVE — this week&rsquo;s board
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 34, paddingLeft: 60, gap: 12 }}>
            {["Free forever", "Dofollow link", "AI autofill"].map((t) => (
              <span
                key={t}
                style={{
                  display: "flex",
                  padding: "12px 24px",
                  borderRadius: 999,
                  border: "1px solid rgba(22,24,29,0.16)",
                  color: "#393c44",
                  fontSize: 23,
                  fontWeight: 600,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        )}

        {/* the "FREE TO LAUNCH" seal — free is the word that gets the click */}
        <div
          style={{
            position: "absolute",
            top: 250,
            right: 54,
            width: 132,
            height: 132,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 999,
            background: EMBER,
            boxShadow: "0 18px 40px -14px rgba(242,103,30,0.6)",
          }}
        >
          <span
            style={{
              display: "flex",
              fontFamily: serif,
              fontWeight: 900,
              fontSize: 40,
              lineHeight: 0.9,
              color: "#ffffff",
            }}
          >
            FREE
          </span>
          <span
            style={{
              display: "flex",
              marginTop: 4,
              fontFamily: "monospace",
              fontSize: 13,
              letterSpacing: 2,
              color: "#ffffff",
            }}
          >
            TO LAUNCH
          </span>
        </div>
      </div>
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  );
}
