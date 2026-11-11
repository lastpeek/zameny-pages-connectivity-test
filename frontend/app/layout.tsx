import type { Metadata, Viewport } from "next";
import "./globals.css";
import StageOneNotice from "./stage-one-notice";
import {staticPath} from "../src/ui/static-path";
import { appearanceBootstrap } from "../src/ui/appearance";
import { earlyScheduleBootstrap } from "../src/ui/early-schedule";
const shortDescription =
  "Сайт с расписанием замен колледжа: пары, кабинеты, преподаватели и время проверки.";
export const metadata: Metadata = {
  title: "zameny",
  description: shortDescription,
  openGraph: {
    title: "zameny — расписание замен",
    description: shortDescription,
    type: "website",
  },
  manifest: staticPath("/manifest.webmanifest"),
  appleWebApp: { capable: true, title: "zameny", statusBarStyle: "black" },
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
      <head><script id="zameny-early-bootstrap" dangerouslySetInnerHTML={{ __html: appearanceBootstrap + ";" + earlyScheduleBootstrap }} /></head>
      <body>
        <StageOneNotice />
        {children}
      </body>
    </html>
  );
}
