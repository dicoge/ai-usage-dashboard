import type { Metadata } from "next";
import Link from "next/link";

import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Usage Dashboard",
  description: "Track usage across your AI coding subscriptions",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <div className="topbar">
            <Link href="/" className="brand">
              <span className="dot" />
              AI Usage
            </Link>
            <Nav />
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
