import type { Metadata } from "next";
import { JetBrains_Mono, Playfair_Display, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { VipUpgradeProvider } from "@/components/VipUpgradeProvider";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const jetBrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", weight: ["400", "500", "600"], display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", style: ["normal", "italic"], weight: ["400", "500", "600", "700"], display: "swap" });

export const metadata: Metadata = {
  title: "Wacana.rip — TPU Wacana",
  description: "Tempat peristirahatan terakhir bagi wacana yang tak pernah terjadi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} ${playfair.variable}`}><a className="skip-link" href="#main">Lewati ke konten utama</a><ToastProvider><VipUpgradeProvider>{children}</VipUpgradeProvider></ToastProvider></body>
    </html>
  );
}
