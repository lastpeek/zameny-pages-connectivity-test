import { pilot } from "../src/config";
import type { Metadata, Viewport } from "next";
import "./globals.css";
import StageOneNotice from "./stage-one-notice";
import {staticPath} from "../src/ui/static-path";
import { appearanceBootstrap } from "../src/ui/appearance";
export const metadata: Metadata = {
  title: "zameny — тест Pages",
  description: `zameny: опубликованные данные колледжа для группы ${pilot.group}, ссылка на первоисточник и время проверки.`,
  manifest: staticPath("/manifest.webmanifest"),
  appleWebApp: { capable: true, title: "zameny Pages", statusBarStyle: "black" },
  icons: {
    icon: staticPath("/icons/favicon-32.png?v=black-1"),
    apple: staticPath("/icons/apple-touch-icon.png?v=black-1"),
  },
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "light",
  themeColor: "#ffffff",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: appearanceBootstrap }} /></head>
      <body>
        <StageOneNotice />
        {children}
      </body>
    </html>
  );
}
