import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-bg/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-brand to-brand-2">
            <span className="h-2.5 w-2.5 rounded-[3px] bg-bg" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Vigil</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-text-secondary sm:flex">
          <Link href="/#how-it-works" className="transition hover:text-text-primary">
            How it works
          </Link>
          <Link href="/#architecture" className="transition hover:text-text-primary">
            Architecture
          </Link>
          <Link href="/#tracks" className="transition hover:text-text-primary">
            Tracks
          </Link>
        </nav>
        <Link
          href="/dashboard"
          className="rounded-full bg-text-primary px-4 py-2 text-[13px] font-semibold text-bg transition hover:opacity-85"
        >
          Live dashboard →
        </Link>
      </div>
    </header>
  );
}
