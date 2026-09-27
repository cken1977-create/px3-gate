import type { Metadata } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-sans", subsets: ["latin"] });
const serif = Playfair_Display({ variable: "--font-serif", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PX3 Gate",
  description: "Can this hand be on this pad right now?",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable} h-full`}>
      <body className="min-h-full antialiased">
        <header className="px-top">
          <div className="px-top-inner">
            <div>
              <p className="px-kicker">Yakini · Digital infrastructure</p>
              <p className="px-brand">PX3 Energy <span>Gate</span></p>
            </div>
            <p className="px-top-meta">Odessa · owner device</p>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
