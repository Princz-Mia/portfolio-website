import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { profile, site } from "@/content";

export const dynamic = "force-static";
export const alt = `${site.name} — ${profile.headline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const paper = "#f6f1ea";
const ink = "#221e1b";
const ink2 = "#4a433e";
const accent = "#6e1f2e";

async function loadFont(file: string) {
  return readFile(join(process.cwd(), "node_modules", "@fontsource", file));
}

// The social preview is rendered once at build time. IBM Plex (WOFF) is used because
// the image renderer does not read WOFF2.
export default async function OpenGraphImage() {
  const [sansMedium, sansRegular, mono] = await Promise.all([
    loadFont("ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff"),
    loadFont("ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff"),
    loadFont("ibm-plex-mono/files/ibm-plex-mono-latin-400-normal.woff"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: paper,
          color: ink,
          fontFamily: "Plex Sans",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: "Plex Mono",
            fontSize: 24,
            letterSpacing: 2,
            color: accent,
          }}
        >
          <span>{site.name.toUpperCase()}</span>
          <span style={{ color: ink2 }}>{site.url.replace("https://", "")}</span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: -1,
              maxWidth: 900,
            }}
          >
            {profile.headline}
          </div>
          <div style={{ fontSize: 28, lineHeight: 1.4, color: ink2, maxWidth: 940 }}>
            Software engineer at Ericsson and Computer Engineering M.Sc. student at BME.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="220" height="56" viewBox="0 0 220 56" fill="none">
            <circle cx="8" cy="28" r="4" fill={ink} />
            <path d="M12 28 H24" stroke={ink2} strokeWidth="2" />
            <rect x="24" y="16" width="52" height="24" rx="6" stroke={ink2} strokeWidth="2" />
            <path d="M76 28 H96" stroke={ink2} strokeWidth="2" />
            <rect x="96" y="16" width="52" height="24" rx="6" stroke={ink2} strokeWidth="2" />
            <path d="M148 28 H168" stroke={ink2} strokeWidth="2" />
            <rect
              x="168"
              y="16"
              width="44"
              height="24"
              rx="6"
              fill="#f0e2df"
              stroke={accent}
              strokeWidth="2"
            />
          </svg>
          <span style={{ fontFamily: "Plex Mono", fontSize: 22, color: ink2 }}>
            SysML v2 · formal methods · verification
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Plex Sans", data: sansMedium, weight: 500, style: "normal" },
        { name: "Plex Sans", data: sansRegular, weight: 400, style: "normal" },
        { name: "Plex Mono", data: mono, weight: 400, style: "normal" },
      ],
    },
  );
}
