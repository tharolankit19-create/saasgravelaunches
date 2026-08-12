import { ImageResponse } from "next/og";
import { logoMarkDataUri } from "@/components/logo";

// The app icon — the same launch mark used in the navbar and social cards.
// Drawn as an <img> data URI because Satori doesn't expand nested components
// inside an <svg>.
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoMarkDataUri(512)} width={512} height={512} alt="" />
      </div>
    ),
    { ...size }
  );
}
