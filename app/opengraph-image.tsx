import { ImageResponse } from "next/og";
import { FROND_PATH, TAGLINE } from "./components/Logo";

export const alt = `Fernbrook. ${TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand values for the share image (satori cannot read CSS variables). Keep in step with app/globals.css.
const FERN = "#2C4535";
const LINEN = "#F3EEE4";

// Fraunces is fetched at build time; if that fails the image uses the default serif.
async function loadFraunces(): Promise<ArrayBuffer | null> {
  try {
    const css = await (
      await fetch("https://fonts.googleapis.com/css2?family=Fraunces:wght@400&text=Fernbrook.Madeslwyt", {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 Version/5.0.5 Safari/533.21.1" },
      })
    ).text();
    const url = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    return url ? await (await fetch(url)).arrayBuffer() : null;
  } catch {
    return null;
  }
}

export default async function Image() {
  const font = await loadFraunces();
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: FERN,
          color: LINEN,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: font ? "Fraunces" : "serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 36 }}>
          <svg width={150} height={276} viewBox="18 2 64 118" fill="none" stroke={LINEN} strokeWidth={6.5} strokeLinecap="round" strokeLinejoin="round">
            <path d={FROND_PATH} />
          </svg>
          <div style={{ fontSize: 150, letterSpacing: "-0.03em", lineHeight: 1 }}>Fernbrook</div>
        </div>
        <div style={{ marginTop: 56, fontSize: 44, letterSpacing: "-0.01em" }}>{TAGLINE}</div>
      </div>
    ),
    { ...size, fonts: font ? [{ name: "Fraunces", data: font, weight: 400, style: "normal" }] : [] },
  );
}
