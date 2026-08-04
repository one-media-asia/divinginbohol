import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Clock, Gauge } from "lucide-react";

import { courses } from "@/data/diving";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "PADI Dive Courses in Bohol — Bohol Dive Co." },
      {
        name: "description",
        content:
          "PADI courses on Panglao Island, Bohol: Discover Scuba, Open Water, Advanced, Rescue, Nitrox and Divemaster internships with prices in PHP and USD.",
      },
      { property: "og:title", content: "PADI Dive Courses in Bohol, Philippines" },
      {
        property: "og:description",
        content: "Certifications from beginner to professional, taught in groups of four or fewer.",
      },
      { property: "og:url", content: "/courses" },
    ],
    links: [{ rel: "canonical", href: "/courses" }],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  return (
    <>
      <header className="surface-deep pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="eyebrow text-lagoon opacity-100">Certifications</p>
          <h1 className="mt-3 max-w-2xl text-4xl text-deep-foreground sm:text-5xl">
            PADI courses on Panglao Island
          </h1>
          <p className="mt-5 max-w-2xl text-deep-foreground/80">
            Warm water, gentle conditions and an easy house reef make Bohol one of the best places in
            the Philippines to learn. Every course runs with a maximum of four students per
            instructor, equipment and certification fees included.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => (
            <article key={c.slug} className="card-reef flex flex-col p-6">
              <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                {c.level}
              </span>
              <h2 className="mt-4 text-xl">{c.name}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{c.summary}</p>

              <p className="mt-5 font-display text-3xl font-bold text-primary">
                PHP {c.php.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">≈ USD ${c.usd} per person</p>

              <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Clock className="size-4 text-accent" /> {c.duration}
                </span>
                <span className="flex items-center gap-1.5">
                  <Gauge className="size-4 text-accent" /> Max {c.depth}
                </span>
              </div>

              <ul className="mt-5 flex-1 space-y-2 border-t border-border pt-5 text-sm">
                {c.includes.map((i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                    <span className="text-muted-foreground">{i}</span>
                  </li>
                ))}
              </ul>

              <Link to="/book" search={{ course: c.slug }} className="btn-primary mt-6 w-full">
                Book this course
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
