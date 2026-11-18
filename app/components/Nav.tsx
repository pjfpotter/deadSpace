import Link from "next/link";

// Add a link here only when its page exists.
const LINKS: { href: string; label: string }[] = [
  { href: "/", label: "How full" },
  { href: "/merges", label: "Merges" },
  { href: "/putaway", label: "Deliveries" },
  { href: "/floor", label: "Floor checklist" },
];

export default function Nav() {
  return (
    <header className="border-b border-line bg-surface">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3 sm:px-6"
      >
        <Link href="/" className="mr-2 text-base font-semibold text-brand">
          Fernbrook stores
        </Link>
        {LINKS.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-foreground hover:text-brand">
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
