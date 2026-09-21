import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { BottomTabBar } from "@/components/BottomTabBar";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Protocolo Jake Tyler",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Jake Tyler" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#f4f4f2",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={jakarta.variable}>
      <body className="bg-canvas pb-24 font-sans text-ink antialiased">
        {children}
        <BottomTabBar />
      </body>
    </html>
  );
}
