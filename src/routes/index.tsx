import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Clock, Fish, ShieldCheck, Users, Waves } from "lucide-react";

import heroImg from "@/assets/hero-bohol.jpg";
import balicasagImg from "@/assets/site-balicasag.jpg";
import turtleImg from "@/assets/site-turtle.jpg";
import boatImg from "@/assets/dive-boat.jpg";
import { courses, diveSites } from "@/data/diving";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Bohol Dive Co. — Book Scuba Diving in Panglao, Bohol" },
      {
        name: "description",
        content:
          "Book daily fun dives and PADI courses in Bohol, Philippines. Balicasag walls, the Napaling sardine run and Pamilacan pinnacles from Alona Beach.",
      },
      { property: "og:title", content: "Book Scuba Diving in Bohol, Philippines" },
      {
        property: "og:description",
        content:
          "Daily boats to Balicasag, Napaling and Pamilacan plus PADI courses from Open Water to Divemaster.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

const trips = [
  {
    name: "2-Dive Balicasag Trip",
    price: "PHP 3,900",
    note: "per diver",
    detail: "Two boat dives on the sanctuary walls, tanks, weights, guide and lunch on the island.",
    img: balicasagImg,
  },
  {
    name: "Napaling Sardine Dive",
    price: "PHP 1,900",
    note: "single dive",
    detail: "Shore dive into the sardine ball, 45 minutes of silver. Best in the early morning.",
    img: turtleImg,
  },
  {
    name: "Pamilacan Day Trip",
    price: "PHP 6,500",
    note: "3 dives",
    detail: "Full-day offshore boat with three dives, dolphins on the crossing and packed lunch.",
    img: boatImg,
  },
];

function Index() {
  return (
    <>
      <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden">
        <img
          src={heroImg}
          alt="Scuba diver beside a huge school of sardines in the blue water off Bohol"
          width={1920}
          height={1280}
          className="absolute inset-0 size-full object-cover"
        />
        <div className="absolute inset-0 bg-deep/55" />
        <div className="relative z-10 mx-auto max-w-3xl px-5 text-center text-deep-foreground">
          <h1 className="text-5xl leading-[1.05] font-extrabold sm:text-6xl md:text-7xl">
            Discover the Reefs
            <span className="mt-1 block text-lagoon">of Bohol</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-deep-foreground/85">
            Daily dive boats from Alona Beach, Panglao — sardine walls, turtles and untouched coral
            in the heart of the Philippines.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/book" className="btn-primary">
              Book Your Dive
            </Link>
            <Link to="/courses" className="btn-outline-light">
              PADI Courses
            </Link>
          </div>
        </div>
        <ChevronDown className="absolute bottom-8 left-1/2 z-10 size-7 -translate-x-1/2 animate-bounce text-deep-foreground/80" />
      </section>

      <section className="surface-soft border-b border-border">
        <div className="mx-auto max-w-7xl px-5 py-16 text-center">
          <h2 className="mx-auto max-w-3xl text-2xl sm:text-3xl">
            One small island, 20+ dive sites — all within an hour of the shop.
          </h2>
          <p className="eyebrow mt-6">
            BALICASAG · NAPALING · PAMILACAN · DOLJO · ARCO POINT · CERVERA SHOAL
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Waves, title: "Daily boats", text: "Two departures every morning, 8am & 11am." },
              { icon: Users, title: "Max 4 divers", text: "Small groups with one guide, always." },
              { icon: ShieldCheck, title: "PADI 5★ centre", text: "Serviced gear, nitrox and O2 on board." },
              { icon: Fish, title: "Sardine run", text: "Napaling shoals year-round, minutes away." },
            ].map((f) => (
              <div key={f.title} className="card-reef p-6 text-left">
                <f.icon className="size-6 text-primary" />
                <h3 className="mt-4 text-lg">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <p className="eyebrow">Fun dive trips</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="max-w-xl text-3xl sm:text-4xl">Pick a boat and get wet tomorrow</h2>
          <Link to="/dive-sites" className="btn-ghost">
            Browse all dive sites
          </Link>
        </div>

        <div className="mt-10 grid gap-7 md:grid-cols-3">
          {trips.map((t) => (
            <article key={t.name} className="card-reef flex flex-col">
              <img
                src={t.img}
                alt={t.name}
                loading="lazy"
                width={1024}
                height={768}
                className="h-52 w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-xl">{t.name}</h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{t.detail}</p>
                <p className="mt-5 font-display text-2xl font-bold text-primary">
                  {t.price}{" "}
                  <span className="font-sans text-xs font-normal text-muted-foreground">
                    {t.note}
                  </span>
                </p>
                <Link to="/book" className="btn-primary mt-5 w-full">
                  Reserve a spot
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="surface-deep">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <p className="eyebrow text-lagoon opacity-100">Courses</p>
          <h2 className="mt-3 max-w-2xl text-3xl text-deep-foreground sm:text-4xl">
            From your first breath underwater to going pro
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {courses.slice(0, 3).map((c) => (
              <div
                key={c.slug}
                className="rounded-3xl border border-white/15 bg-white/5 p-6 text-deep-foreground backdrop-blur"
              >
                <span className="rounded-full bg-lagoon/20 px-3 py-1 text-xs font-semibold text-lagoon">
                  {c.level}
                </span>
                <h3 className="mt-4 text-xl">{c.name}</h3>
                <p className="mt-2 text-sm text-deep-foreground/75">{c.summary}</p>
                <p className="mt-5 font-display text-2xl font-bold">
                  PHP {c.php.toLocaleString()}{" "}
                  <span className="font-sans text-xs font-normal text-deep-foreground/60">
                    ≈ ${c.usd}
                  </span>
                </p>
                <p className="mt-3 flex items-center gap-2 text-xs text-deep-foreground/70">
                  <Clock className="size-4" /> {c.duration} · max depth {c.depth}
                </p>
              </div>
            ))}
          </div>
          <Link to="/courses" className="btn-outline-light mt-10">
            See all courses
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <p className="eyebrow">Where you'll dive</p>
        <h2 className="mt-3 text-3xl sm:text-4xl">Three sites that make Bohol special</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {diveSites.slice(0, 3).map((s) => (
            <div key={s.name} className="card-reef p-6">
              <span className="eyebrow">{s.tag}</span>
              <h3 className="mt-3 text-xl">{s.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              <p className="mt-4 text-xs font-semibold text-primary">
                {s.depth} · {s.level}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-24">
        <div className="surface-deep flex flex-col items-center gap-6 rounded-4xl px-8 py-14 text-center shadow-reef">
          <h2 className="max-w-2xl text-3xl text-deep-foreground sm:text-4xl">
            Ready to jump in? Tell us your dates.
          </h2>
          <p className="max-w-lg text-deep-foreground/80">
            We reply within a few hours with availability, pickup time and total price. No deposit
            needed to hold a spot.
          </p>
          <Link to="/book" className="btn-primary">
            Book your dive
          </Link>
        </div>
      </section>
    </>
  );
}
