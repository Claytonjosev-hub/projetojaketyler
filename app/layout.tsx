import type { Metadata, Viewport } from "next";
import { BottomTabBar } from "@/components/BottomTabBar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Protocolo Jake Tyler",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Jake Tyler" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-neutral-50 pb-16 text-neutral-900 antialiased">
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
