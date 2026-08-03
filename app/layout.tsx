import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://local-lore.vercel.app"),
  title: "Local Lore — Find your San Francisco today",
  description: "A living, curated map of memorable things to do around San Francisco.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Local Lore — Find your San Francisco today",
    description: "Memorable ways into San Francisco, mapped by time, mood, budget, and neighborhood.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Local Lore map of San Francisco activity zones" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Local Lore — Find your San Francisco today",
    description: "Memorable ways into San Francisco, mapped by time, mood, budget, and neighborhood.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
