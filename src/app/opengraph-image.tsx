import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/og";
import { logoMarkDataUri } from "@/components/logo";

export const alt = "Saasgrave Launches — launch your SaaS free, keep the backlink forever";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card that decides whether anyone clicks the link.
 *
 * Drawn mock-ups read as mock-ups. The boards that actually get clicked put a
 * real screenshot of the product on the card, so this does the same: a big
 * wordmark over an actual capture of the live leaderboard (public/og-app.png,
 * refreshed by re-running the screenshot script). Light stock, one ember
 * accent, and the app itself doing the talking.
 */
function shot(): string | null {
  try {
    const file = path.join(process.cwd(), "public", "og-app.png");
    return `data:image/png;base64,${fs.readFileSync(file).toString("base64")}`;
  } catch {
    return null; // card still renders, just without the screenshot
  }
}

export default function OpengraphImage() {
  const app = shot();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "#fbfbfc",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* the ember rule — the brand's one mark */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            display: "flex",
            background: "#f2671e",
          }}
        />
        {/* a soft warm wash so the stock isn't a flat white rectangle */}
        <div
          style={{
            position: "absolute",
            top: -180,
            left: -120,
            width: 780,
            height: 560,
            display: "flex",
            background:
              "radial-gradient(circle at 45% 45%, rgba(242,103,30,0.13), rgba(242,103,30,0) 66%)",
          }}
        />

        {/* ── the wordmark block ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "46px 64px 0",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoMarkDataUri(40)} width={40} height={40} alt="" />
            <span
              style={{
                display: "flex",
                fontSize: 16,
                fontWeight: 700,
                letterSpacing: 3.4,
                color: "#666b74",
              }}
            >
              SAASGRAVE LAUNCHES
            </span>
            <span
              style={{
                display: "flex",
                marginLeft: "auto",
                padding: "9px 18px",
                borderRadius: 999,
                background: "#f2671e",
                color: "#ffffff",
                fontSize: 19,
                fontWeight: 700,
              }}
            >
              Free to launch
            </span>
          </div>

          <div style={{ display: "flex", marginTop: 22 }}>
            <span
              style={{
                fontSize: 82,
                fontWeight: 800,
                color: "#16181d",
                letterSpacing: -2.6,
                marginRight: 22,
              }}
            >
              You built it.
            </span>
            <span style={{ fontSize: 82, fontWeight: 800, color: "#f2671e", letterSpacing: -2.6 }}>
              Now get it seen.
            </span>
          </div>

          <span
            style={{
              display: "flex",
              marginTop: 14,
              fontSize: 27,
              color: "#666b74",
              maxWidth: 980,
            }}
          >
            Paste your URL — AI writes the listing. A permanent page and a real dofollow link,
            long after launch day.
          </span>
        </div>

        {/* ── the real app, bleeding off the bottom ── */}
        {app ? (
          <div
            style={{
              display: "flex",
              marginTop: 26,
              marginLeft: 64,
              marginRight: 64,
              borderRadius: 18,
              border: "1px solid rgba(22,24,29,0.14)",
              overflow: "hidden",
              boxShadow: "0 24px 60px -24px rgba(22,24,29,0.35)",
              background: "#ffffff",
              height: 300,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={app}
              width={1072}
              height={592}
              alt=""
              style={{ width: "100%", objectFit: "cover", objectPosition: "top" }}
            />
          </div>
        ) : (
          <div style={{ display: "flex", marginTop: 40, paddingLeft: 64, gap: 12 }}>
            {["Free forever", "Dofollow link", "AI autofill"].map((t) => (
              <span
                key={t}
                style={{
                  display: "flex",
                  padding: "12px 24px",
                  borderRadius: 999,
                  border: "1px solid rgba(22,24,29,0.14)",
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
      </div>
    ),
    { ...size }
  );
}
