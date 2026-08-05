import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import logoImg from "@/assets/logo-divinginasia.avif";

const links = [
  { to: "/", label: "Home" },
  { to: "/courses", label: "Courses" },
  { to: "/dive-sites", label: "Dive Sites" },
] as const;

const locationLinks = [
  { href: "https://divinginasia.com", label: "Thailand" },
  { href: "https://prodiving.asia", label: "Indonesia" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="absolute inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link to="/" className="flex items-center gap-3 text-deep-foreground">
          <img
            src={logoImg}
            alt="Pro Diving Asia logo"
            className="h-16 w-16 rounded-full object-cover"
          />
          <span className="font-display text-lg font-bold tracking-tight">Pro Diving Asia</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-deep-foreground/85 transition-colors hover:bg-white/10 hover:text-deep-foreground"
              activeProps={{ className: "bg-white/15 text-deep-foreground" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
          {locationLinks.map((location) => (
            <a
              key={location.href}
              href={location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full px-4 py-2 text-sm font-medium text-deep-foreground/85 transition-colors hover:bg-white/10 hover:text-deep-foreground"
            >
              {location.label}
            </a>
          ))}
          <Link to="/book" className="btn-primary ml-3">
            Book now
          </Link>
        </nav>

        <button
          type="button"
          aria-label="Toggle menu"
          onClick={() => setOpen((v) => !v)}
          className="flex size-10 items-center justify-center rounded-full border border-white/40 text-deep-foreground md:hidden"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="mx-5 rounded-3xl border border-white/15 bg-deep/95 p-3 backdrop-blur md:hidden">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-deep-foreground/90 hover:bg-white/10"
            >
              {l.label}
            </Link>
          ))}
          {locationLinks.map((location) => (
            <a
              key={location.href}
              href={location.href}
              target="_blank"
              rel="noopener noreferrer"
              className="block rounded-2xl px-4 py-3 text-sm font-medium text-deep-foreground/90 hover:bg-white/10"
            >
              {location.label}
            </a>
          ))}
        </div>
      )}
    </header>
  );
}
