"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Add a link here only when its page exists.
const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "How full" },
  { href: "/merges", label: "Merges" },
  { href: "/putaway", label: "Deliveries" },
  { href: "/floor", label: "Floor checklist" },
];

function Mark() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-9 w-9 shrink-0">
      <rect width="48" height="48" rx="8" fill="#f4f6f4" fillOpacity="0.1" />
      <rect x="9" y="17" width="30" height="5" rx="1" fill="#f4f6f4" />
      <rect x="9" y="25" width="30" height="4" rx="1" fill="var(--accent)" />
      <rect x="12" y="29" width="4" height="10" fill="#f4f6f4" />
      <rect x="32" y="29" width="4" height="10" fill="#f4f6f4" />
    </svg>
  );
}

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="bg-header text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-8 gap-y-1 px-4 pt-3 sm:px-6">
        <Link href="/" className="flex items-center gap-3 pb-2">
          <Mark />
          <span className="leading-tight">
            <span className="block text-lg font-extrabold tracking-tight">Fernbrook</span>
            <span className="block text-xs font-semibold text-white/65">Furniture Co. · Stores</span>
          </span>
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
                    ? "border-accent text-white"
                    : "border-transparent text-white/70 hover:text-white"
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
