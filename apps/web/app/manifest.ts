import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Tiệm Rêu Décor",
    short_name: "Tiệm Rêu",
    description: "Terrarium và moss art thủ công.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    lang: "vi",
    icons: [
      { src: "/favicon-192.png", sizes: "192x192", type: "image/png" },
    ],
  };
}
