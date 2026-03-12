import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Checkers Arena",
    template: "%s • Checkers Arena",
  },
  description:
    "A fast, fun, and polished checkers experience with responsive gameplay, social competition, and daily-play motivation.",
  applicationName: "Checkers Arena",
  keywords: [
    "checkers",
    "draughts",
    "board game",
    "strategy",
    "next.js",
    "game",
  ],
  authors: [{ name: "Checkers Arena Team" }],
  creator: "Checkers Arena Team",
  publisher: "Checkers Arena",
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6efe3" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f12" },
  ],
  colorScheme: "dark light",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body className="app-root antialiased">
        <div className="app-shell">
          <a className="skip-link" href="#main-content">
            Skip to main content
          </a>

          <header className="app-header" role="banner">
            <div className="app-header__brand" aria-label="Checkers Arena">
              <span className="brand-mark" aria-hidden="true">
                ◈
              </span>
              <div className="brand-copy">
                <strong>Checkers Arena</strong>
                <span>Fast matches • satisfying strategy • daily progression</span>
              </div>
            </div>
          </header>

          <main id="main-content" className="app-main" role="main">
            {children}
          </main>

          <footer className="app-footer" role="contentinfo">
            <p>Built for quick rounds, focused strategy, and everyday replay value.</p>
          </footer>
        </div>
      </body>
    </html>
  );
}
