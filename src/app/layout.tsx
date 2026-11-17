import type { Metadata } from "next";
import { DM_Mono, Newsreader, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const dmMono = DM_Mono({ subsets: ["latin"], variable: "--font-dm-mono", weight: ["400", "500"], display: "swap" });
const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-newsreader", style: ["italic"], display: "swap" });

export const metadata: Metadata = {
  title: "Wacana.rip — TPU Wacana",
  description: "Tempat peristirahatan terakhir bagi wacana yang tak pernah terjadi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className={`${spaceGrotesk.variable} ${dmMono.variable} ${newsreader.variable}`}><a className="skip-link" href="#main">Lewati ke konten utama</a><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
