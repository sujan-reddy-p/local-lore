import type { Metadata } from "next";
import { PostHogProvider } from "@/components/posthog-provider";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://local-lore.vercel.app"),
  title: "Local Lore — Things to do nearby",
  description: "Explore Bay Area places and events by date, budget, and activity.",
  icons: { icon: "/favicon.svg" },
  openGraph: {
    title: "Local Lore — Things to do nearby",
    description: "Explore Bay Area places and events by date, budget, and activity.",
    type: "website",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "Local Lore map of Bay Area activities" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Local Lore — Things to do nearby",
    description: "Explore Bay Area places and events by date, budget, and activity.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><PostHogProvider>{children}</PostHogProvider></body>
    </html>
  );
}
