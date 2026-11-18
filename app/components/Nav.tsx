"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";

// Add a link here only when its page exists.
const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "How full" },
  { href: "/merges", label: "Merges" },
  { href: "/putaway", label: "Deliveries" },
  { href: "/fit", label: "Can we fit it?" },
  { href: "/december", label: "December orders" },
  { href: "/run-out", label: "Running low" },
  { href: "/slotting", label: "Fast movers" },
  { href: "/real-space", label: "Real space" },
  { href: "/floor", label: "Floor checklist" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="bg-header text-on-header">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-1 px-4 pt-3 sm:px-6">
        <Link href="/" aria-label="Fernbrook stores, home" className="flex items-center gap-3 pb-2">
          <Logo markHeight={36} />
          <span className="label border-l border-on-header/30 pl-3 text-on-header/80">Stores</span>
        </Link>
        <nav aria-label="Main" className="-mb-px flex flex-wrap gap-x-1">
          {LINKS.map((l) => {
            const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`border-b-[3px] px-3 py-3 text-sm font-semibold transition-colors ${
                  active
                    ? "border-accent text-on-header"
                    : "border-transparent text-on-header/80 hover:text-on-header"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
