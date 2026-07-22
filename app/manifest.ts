import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TaskSprint",
    short_name: "TaskSprint",
    description: "Plan tasks, goals, habits, and weekly progress.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f3f1eb",
    theme_color: "#243229",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
