import { createFileRoute, Link } from "@tanstack/react-router";
import { Gauge, Waves } from "lucide-react";

import balicasagImg from "@/assets/site-balicasag.jpg";
import turtleImg from "@/assets/site-turtle.jpg";
import boatImg from "@/assets/dive-boat.jpg";
import { diveSites } from "@/data/diving";

const images = [balicasagImg, turtleImg, boatImg];

export const Route = createFileRoute("/dive-sites")({
  head: () => ({
    meta: [
      { title: "Bohol Dive Sites — Balicasag, Napaling & Pamilacan" },
      {
        name: "description",
        content:
          "Guide to the best dive sites around Panglao and Bohol: Balicasag sanctuary walls, the Napaling sardine run, Pamilacan pinnacles, Doljo Point and Arco Point.",
      },
      { property: "og:title", content: "The Best Dive Sites in Bohol, Philippines" },
      {
        property: "og:description",
        content: "Depths, levels and marine life for every site we dive from Alona Beach.",
      },
      { property: "og:url", content: "/dive-sites" },
    ],
    links: [{ rel: "canonical", href: "/dive-sites" }],
  }),
  component: DiveSitesPage,
});

function DiveSitesPage() {
  return (
    <>
      <header className="surface-deep pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="eyebrow text-lagoon opacity-100">Dive sites</p>
          <h1 className="mt-3 max-w-2xl text-4xl text-deep-foreground sm:text-5xl">
            Walls, sardines and open blue
          </h1>
          <p className="mt-5 max-w-2xl text-deep-foreground/80">
            Everything below is reachable on a morning boat from Alona Beach, with visibility that
            regularly passes 25 metres and water around 28 °C all year.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-7xl space-y-8 px-5 py-16">
        {diveSites.map((s, i) => (
          <article
            key={s.name}
            className={`card-reef grid gap-0 md:grid-cols-2 ${i % 2 === 1 ? "md:[&>img]:order-2" : ""}`}
          >
            <img
              src={images[i % images.length]}
              alt={s.name}
              loading="lazy"
              width={1024}
              height={768}
              className="h-64 w-full object-cover md:h-full"
            />
            <div className="p-7">
              <span className="eyebrow">{s.tag}</span>
              <h2 className="mt-3 text-2xl">{s.name}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{s.description}</p>
              <div className="mt-5 flex flex-wrap gap-4 text-xs font-semibold text-primary">
                <span className="flex items-center gap-1.5">
                  <Gauge className="size-4" /> {s.depth}
                </span>
                <span className="flex items-center gap-1.5">
                  <Waves className="size-4" /> {s.level}
                </span>
              </div>
              <ul className="mt-5 flex flex-wrap gap-2">
                {s.highlights.map((h) => (
                  <li
                    key={h}
                    className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                  >
                    {h}
                  </li>
                ))}
              </ul>
              <Link to="/book" className="btn-primary mt-6">
                Dive this site
              </Link>
            </div>
          </article>
        ))}
      </section>
    </>
  );
}
