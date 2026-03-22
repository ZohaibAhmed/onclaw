import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SlackKit — ClawKit Demo",
  description: "Slack clone with AI-powered ClawKit integration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#1a1d21] text-[#d1d2d3] antialiased`}>
        {children}
      </body>
    </html>
  );
}
