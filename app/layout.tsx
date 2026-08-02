import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "Local Lore — Find your San Francisco today",
  description: "A living, curated map of memorable things to do around San Francisco.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title:"Local Lore — Find your San Francisco today",
    description:"Memorable ways into San Francisco, mapped by time, mood, budget, and neighborhood.",
    type:"website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
