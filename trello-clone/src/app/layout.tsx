import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskBoard — Trello Clone",
  description: "Project management with OnClaw AI customization",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gradient-to-br from-[#1e1f25] to-[#16171c] text-[#b6c2cf] antialiased`}>
        {children}
      </body>
    </html>
  );
}
