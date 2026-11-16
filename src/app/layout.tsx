import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wacana.rip — TPU Wacana",
  description: "Tempat peristirahatan terakhir bagi wacana yang tak pernah terjadi.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
