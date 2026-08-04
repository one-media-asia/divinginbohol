import { Link } from "@tanstack/react-router";
import { Anchor, Mail, MapPin, Phone } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="surface-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-primary">
              <Anchor className="size-4 text-primary-foreground" />
            </span>
            <span className="font-display text-lg font-bold">Bohol Dive Co.</span>
          </div>
          <p className="mt-4 max-w-xs text-sm text-deep-foreground/70">
            PADI dive centre on Panglao Island, running daily boats to Balicasag, Pamilacan and
            Napaling since 2009.
          </p>
        </div>

        <nav className="flex flex-col gap-2 text-sm text-deep-foreground/80">
          <Link to="/courses" className="hover:text-deep-foreground">
            Courses
          </Link>
          <Link to="/dive-sites" className="hover:text-deep-foreground">
            Dive Sites
          </Link>
          <Link to="/book" className="hover:text-deep-foreground">
            Book a dive
          </Link>
        </nav>

        <div className="space-y-3 text-sm text-deep-foreground/80">
          <p className="flex items-center gap-2">
            <MapPin className="size-4 text-lagoon" /> Alona Beach, Panglao, Bohol 6340
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-4 text-lagoon" /> +63 917 555 0142
          </p>
          <p className="flex items-center gap-2">
            <Mail className="size-4 text-lagoon" /> dive@boholdiveco.ph
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-deep-foreground/55">
        © {new Date().getFullYear()} Bohol Dive Co. — Panglao Island, Philippines
      </div>
    </footer>
  );
}
