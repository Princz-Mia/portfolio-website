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

// Runs before the first paint. Sets the theme (the visitor's stored choice, or
// the system preference) so the page never flashes the other palette, and shows
// the intro curtain only on the first front-page view of a visit. Each part has its
// own try so blocked storage cannot stop the other.
const headScript = [
  `try{var t=null;try{t=localStorage.getItem("theme")}catch(e){}if(t!=="light"&&t!=="dark"){t=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t)}catch(e){}`,
  // The CV page skips the curtain and leaves it unused for the front page.
  `try{if(sessionStorage.getItem("intro-seen")||location.pathname.indexOf("/cv")===0){document.documentElement.classList.add("intro-seen")}else{sessionStorage.setItem("intro-seen","1")}}catch(e){}`,
].join("");

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: headScript }} />
      </head>
      <body>
        <IntroCurtain name={site.name} />
        {children}
      </body>
    </html>
  );
}
