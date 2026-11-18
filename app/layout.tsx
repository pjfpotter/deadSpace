import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Nav from "./components/Nav";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "800"],
});

export const metadata: Metadata = {
  title: "Fernbrook stores",
  description:
    "How full Fernbrook's stores really are, which bins to merge, and where next week's deliveries go.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Nav />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-line">
          <p className="mx-auto w-full max-w-5xl px-4 py-5 text-xs text-muted sm:px-6">
            Fernbrook is an invented company. Plans use only bin codes, product codes and
            quantities; no personal data.
          </p>
        </footer>
      </body>
    </html>
  );
}
