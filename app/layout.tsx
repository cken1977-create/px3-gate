import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "px3-gate",
  description: "Person–job–gate. Can this hand be on this pad right now?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
