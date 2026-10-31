import type { MetadataRoute } from "next";
import {staticPath} from "../src/ui/static-path";
export const dynamic="force-static";
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: staticPath("/"),
    name: "zameny — тест Pages",
    short_name: "zameny Pages",
    description: "Тест Pages: расписание 311а и 1621а; уведомления пока не подключены",
    lang: "ru",
    start_url: staticPath("/"),
    scope: staticPath("/"),
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      {
        src: staticPath("/icons/icon-192.png?v=black-1"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: staticPath("/icons/icon-512.png?v=black-1"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: staticPath("/icons/maskable-512.png?v=black-1"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
