import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";
export const alt = "Dr DHL Elite Fitness Club — Premium Fitness in Bhuj. Coming Soon.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const bytes = await readFile(
    join(process.cwd(), "src/lib/brand/og-monogram.png")
  );
  const src = `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0A0A0A",
          color: "#F5F5F5",
        }}
      >
        <img src={src} width={180} height={160} alt="" />
        <div
          style={{
            marginTop: 28,
            fontSize: 18,
            letterSpacing: 8,
            textTransform: "uppercase",
            color: "#C9A84C",
          }}
        >
          Coming Soon
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 64,
            fontWeight: 600,
            letterSpacing: -1,
          }}
        >
          Dr DHL
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 28,
            letterSpacing: 10,
            textTransform: "uppercase",
            color: "#C9A84C",
          }}
        >
          Elite Fitness Club
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 22,
            color: "#A8A9AD",
          }}
        >
          Premium Fitness in Bhuj
        </div>
      </div>
    ),
    { ...size }
  );
}
