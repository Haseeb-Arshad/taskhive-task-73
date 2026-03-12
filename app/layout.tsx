import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://checkers-arena.app"),
  title: {
    default: "Checkers Arena",
    template: "%s • Checkers Arena",
  },
  description:
    "A polished, responsive foundation for a fun, fast, and replayable checkers experience.",
  applicationName: "Checkers Arena",
  keywords: [
    "checkers",
    "draughts",
    "board game",
    "next.js",
    "game ui",
    "multiplayer",
  ],
  authors: [{ name: "Checkers Arena Team" }],
  creator: "Checkers Arena Team",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Checkers Arena",
    description:
      "Play a modern checkers experience with smooth interactions and competitive progression.",
    type: "website",
    siteName: "Checkers Arena",
  },
  twitter: {
    card: "summary_large_image",
    title: "Checkers Arena",
    description:
      "A modern checkers game shell built for speed, polish, and long-term feature growth.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7fb" },
    { media: "(prefers-color-scheme: dark)", color: "#090d18" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className="app-body antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>

        <div className="app-shell">
          <div className="ambient ambient-top" aria-hidden="true" />
          <div className="ambient ambient-bottom" aria-hidden="true" />

          <header className="shell-header" role="banner">
            <div className="shell-inner">
              <div className="shell-brand" aria-label="Checkers Arena home">
                <span className="brand-mark" aria-hidden="true" />
                <span className="brand-text">Checkers Arena</span>
              </div>
              <p className="status-chip" aria-label="Build status">
                Foundation Ready
              </p>
            </div>
          </header>

          <main id="main-content" className="shell-main" role="main">
            <div className="shell-inner shell-content">{children}</div>
          </main>

          <footer className="shell-footer" role="contentinfo">
            <div className="shell-inner footer-grid">
              <p>Built for quick matches, satisfying motion, and long-term progression.</p>
              <p>Responsive app shell • Production-ready scaffolding</p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
