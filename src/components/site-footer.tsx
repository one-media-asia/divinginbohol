import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";
import logoImg from "@/assets/logo-divinginasia.avif";

export function SiteFooter() {
  return (
    <footer className="surface-deep">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-3">
            <img
              src={logoImg}
              alt="Pro Diving Asia logo"
              className="h-16 w-16 rounded-full object-cover"
            />
            <span className="font-display text-lg font-bold">Pro Diving Asia</span>
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
            <MapPin className="size-4 text-lagoon" /> Alona Beach Road, Panglao, Bohol
          </p>
          <p className="flex items-center gap-2">
            <Phone className="size-4 text-lagoon" /> +63 917 555 0142
          </p>
          <p className="flex items-center gap-2">
            <Mail className="size-4 text-lagoon" /> bookings@divinginaasia.com
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-deep-foreground/55">
        © {new Date().getFullYear()} Pro Diving Asia — Panglao Island, Philippines
      </div>
    </footer>
  );
}
