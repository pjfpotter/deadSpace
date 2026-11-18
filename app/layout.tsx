import type { Metadata } from "next";
import { DM_Mono, Fraunces, Instrument_Sans } from "next/font/google";
import Nav from "./components/Nav";
import { TAGLINE } from "./components/Logo";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz"],
  fallback: ["Georgia", "serif"],
});

const instrumentSans = Instrument_Sans({
  variable: "--font-instrument-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  fallback: ["system-ui", "sans-serif"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000",
  ),
  title: `Fernbrook stores. ${TAGLINE}`,
  description: `${TAGLINE} How full Fernbrook's stores really are, which bins to merge, and where each delivery goes.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${instrumentSans.variable} ${dmMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-line">
          <p className="mx-auto w-full max-w-5xl px-4 py-5 text-sm text-muted sm:px-6">
            Fernbrook is an invented company. Plans use only bin codes, product codes and
            quantities; no personal data.
          </p>
        </footer>
      </body>
    </html>
  );
}
