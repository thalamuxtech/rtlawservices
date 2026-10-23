import type { MetadataRoute } from "next";
import { SITE } from "@/content/site";

export const dynamic = "force-static";

// Lets phones show the firm's icon and colours when the site is saved to a home screen.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.name,
    short_name: "RT Law",
    description: SITE.description,
    start_url: "/",
    display: "browser",
    background_color: "#fbfbfa",
    theme_color: "#14181f",
    icons: [
      { src: "/brand/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/brand/rt-logo-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
