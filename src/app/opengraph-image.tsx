import { ImageResponse } from "next/og";
import { logoMarkDataUri } from "@/components/logo";

export const alt = "Saasgrave Launches — launch your SaaS, free, every week";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f8f7f4",
          padding: 72,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoMarkDataUri(64)} width={64} height={64} alt="" />
          <span style={{ fontSize: 34, fontWeight: 600, color: "#12110f" }}>
            Saasgrave Launches
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 74, fontWeight: 700, color: "#12110f", lineHeight: 1.05 }}>
            Launch your SaaS in a minute.
          </span>
          <span style={{ fontSize: 74, fontWeight: 700, color: "#5B3DF5", lineHeight: 1.05 }}>
            Keep the backlink forever.
          </span>
        </div>

        <div style={{ display: "flex", gap: 28, fontSize: 26, color: "#6a655a" }}>
          <span>Free to launch</span>
          <span>·</span>
          <span>AI fills the form</span>
          <span>·</span>
          <span>Dofollow product page</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
