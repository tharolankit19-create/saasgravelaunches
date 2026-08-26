import { ImageResponse } from "next/og";
import { logoMarkDataUri } from "@/components/logo";

export const alt = "Saasgrave Launches — launch your SaaS free, keep the backlink forever";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** An upvote caret drawn as SVG — a "▲" glyph needs a font Satori can't fetch. */
function Caret({ color, size = 14 }: { color: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 12 12">
      <polygon points="6,1 11,10 1,10" fill={color} />
    </svg>
  );
}

/**
 * The card that decides whether anyone clicks the link.
 *
 * Dark, high-contrast and product-shaped: a feed is a wall of white cards, so
 * this one goes black with an ember bloom, then shows the actual thing being
 * sold — a ranked board with real rows — instead of just asserting a headline.
 */
export default function OpengraphImage() {
  const rows = [
    { rank: 1, name: "Your product here", votes: "128", tint: "#f2671e" },
    { rank: 2, name: "Ships every Monday", votes: "94", tint: "#8b8f98" },
    { rank: 3, name: "Real makers voting", votes: "71", tint: "#b0713a" },
  ];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#0a0b10",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* ember bloom, top-left */}
        <div
          style={{
            position: "absolute",
            top: -260,
            left: -180,
            width: 900,
            height: 700,
            display: "flex",
            background:
              "radial-gradient(circle at 40% 40%, rgba(242,103,30,0.55), rgba(242,103,30,0) 62%)",
          }}
        />
        {/* cool bloom, bottom-right — stops it reading as one flat orange */}
        <div
          style={{
            position: "absolute",
            bottom: -320,
            right: -220,
            width: 900,
            height: 760,
            display: "flex",
            background:
              "radial-gradient(circle at 50% 50%, rgba(64,110,255,0.32), rgba(64,110,255,0) 64%)",
          }}
        />
        {/* the ember rule along the very top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            display: "flex",
            background: "#f2671e",
          }}
        />

        {/* ── left column: the pitch ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "62px 0 62px 66px",
            width: 700,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoMarkDataUri(52)} width={52} height={52} alt="" />
            <span style={{ fontSize: 28, fontWeight: 700, color: "#ffffff", letterSpacing: -0.4 }}>
              Saasgrave Launches
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <span
              style={{
                display: "flex",
                fontSize: 17,
                fontWeight: 700,
                letterSpacing: 3,
                color: "#f2671e",
                marginBottom: 18,
              }}
            >
              FREE · EVERY MONDAY
            </span>
            <span style={{ fontSize: 68, fontWeight: 800, color: "#ffffff", lineHeight: 1.03 }}>
              Launch your SaaS.
            </span>
            <span style={{ fontSize: 68, fontWeight: 800, color: "#f2671e", lineHeight: 1.03 }}>
              Keep the backlink.
            </span>
            <span style={{ marginTop: 22, fontSize: 27, color: "#a8adb8", lineHeight: 1.35, maxWidth: 590 }}>
              Paste your URL — AI writes the listing. You get a permanent page and a real dofollow
              link, long after launch day.
            </span>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            {["Free forever", "Dofollow link", "AI autofill"].map((t) => (
              <span
                key={t}
                style={{
                  display: "flex",
                  padding: "11px 22px",
                  borderRadius: 999,
                  border: "1px solid rgba(255,255,255,0.18)",
                  background: "rgba(255,255,255,0.05)",
                  color: "#e6e8ec",
                  fontSize: 22,
                  fontWeight: 600,
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── right column: the product itself ── */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingRight: 58,
            flex: 1,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              borderRadius: 22,
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(255,255,255,0.055)",
              padding: 26,
            }}
          >
            <span
              style={{
                display: "flex",
                fontSize: 15,
                fontWeight: 700,
                letterSpacing: 2.4,
                color: "#8f95a1",
                marginBottom: 18,
              }}
            >
              THIS WEEK&apos;S BOARD
            </span>

            {rows.map((r) => (
              <div
                key={r.rank}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 15,
                  padding: "15px 16px",
                  marginBottom: 10,
                  borderRadius: 14,
                  border:
                    r.rank === 1
                      ? "1px solid rgba(242,103,30,0.55)"
                      : "1px solid rgba(255,255,255,0.09)",
                  background:
                    r.rank === 1 ? "rgba(242,103,30,0.14)" : "rgba(255,255,255,0.035)",
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: r.tint,
                    color: "#0a0b10",
                    fontSize: 18,
                    fontWeight: 800,
                  }}
                >
                  {r.rank}
                </span>
                <span
                  style={{
                    display: "flex",
                    flex: 1,
                    color: r.rank === 1 ? "#ffffff" : "#c9cdd5",
                    fontSize: 21,
                    fontWeight: 600,
                  }}
                >
                  {r.name}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    color: r.rank === 1 ? "#ffb37a" : "#8f95a1",
                    fontSize: 19,
                    fontWeight: 700,
                  }}
                >
                  <Caret color={r.rank === 1 ? "#ffb37a" : "#8f95a1"} size={13} />
                  {r.votes}
                </span>
              </div>
            ))}

            <span style={{ display: "flex", marginTop: 8, fontSize: 18, color: "#7c828e" }}>
              ls.saasgrave.org
            </span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
