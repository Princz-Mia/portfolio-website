import type { Metadata } from "next";
import type { ReactNode } from "react";
import { site } from "@/content";
import { fraunces, plexMono, plexSans } from "@/lib/fonts";
import { IntroCurtain } from "@/components/IntroCurtain";
import "./globals.css";

const title = `${site.name} — ${site.role}`;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: title,
    template: `%s — ${site.name}`,
  },
  description: site.description,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title,
    description: site.description,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Shows the intro curtain only on the first page view of a visit. Runs before
// paint so the curtain never flashes on later views.
const introScript = `try{if(sessionStorage.getItem("intro-seen")){document.documentElement.classList.add("intro-seen")}else{sessionStorage.setItem("intro-seen","1")}}catch(e){}`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: introScript }} />
      </head>
      <body>
        <IntroCurtain name={site.name} />
        {children}
      </body>
    </html>
  );
}
