import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { courses } from "@/data/diving";
import { supabase } from "@/integrations/supabase/client";


export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>) => ({
    course: typeof search["course"] === "string" ? (search["course"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book a Dive in Bohol — Bohol Dive Co." },
      {
        name: "description",
        content:
          "Request your dive dates in Panglao, Bohol. Tell us your experience level and preferred trip and we confirm availability within a few hours.",
      },
      { property: "og:title", content: "Book Your Diving in Bohol" },
      {
        property: "og:description",
        content: "Fun dives, day trips and PADI courses — no deposit needed to hold a spot.",
      },
      { property: "og:url", content: "/book" },
    ],
    links: [{ rel: "canonical", href: "/book" }],
  }),
  component: BookPage,
});

const trips = [
  "2-Dive Balicasag Trip",
  "Napaling Sardine Dive",
  "Pamilacan Day Trip",
  "Single fun dive",
  ...courses.map((c) => c.name),
];

const fieldClass =
  "mt-1.5 w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-ring/25";

function BookPage() {
  const { course } = Route.useSearch();
  const preselected = courses.find((c) => c.slug === course)?.name ?? trips[0];
  const [sent, setSent] = useState(false);

  return (
    <>
      <header className="surface-deep pt-32 pb-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className="eyebrow text-lagoon opacity-100">Booking request</p>
          <h1 className="mt-3 max-w-2xl text-4xl text-deep-foreground sm:text-5xl">
            Reserve your spot on the boat
          </h1>
          <p className="mt-5 max-w-2xl text-deep-foreground/80">
            Send us your dates and we confirm by email within a few hours, including pickup time from
            your hotel on Panglao.
          </p>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-16 lg:grid-cols-[1.4fr_1fr]">
        <div className="card-reef p-7">
          {sent ? (
            <div className="flex flex-col items-center gap-4 py-16 text-center">
              <CheckCircle2 className="size-12 text-accent" />
              <h2 className="text-2xl">Request received</h2>
              <p className="max-w-sm text-sm text-muted-foreground">
                Salamat! We'll email you shortly with availability and your pickup time.
              </p>
              <button type="button" className="btn-ghost" onClick={() => setSent(false)}>
                Send another request
              </button>
            </div>
          ) : (
            <form
              className="grid gap-5 sm:grid-cols-2"
              onSubmit={(e) => {
                e.preventDefault();
                setSent(true);
              }}
            >
              <label className="text-sm font-medium sm:col-span-1">
                Full name
                <input required name="name" className={fieldClass} placeholder="Maria Santos" />
              </label>
              <label className="text-sm font-medium">
                Email
                <input
                  required
                  type="email"
                  name="email"
                  className={fieldClass}
                  placeholder="you@email.com"
                />
              </label>
              <label className="text-sm font-medium">
                Preferred date
                <input required type="date" name="date" className={fieldClass} />
              </label>
              <label className="text-sm font-medium">
                Number of divers
                <input
                  required
                  type="number"
                  min={1}
                  max={12}
                  defaultValue={2}
                  name="divers"
                  className={fieldClass}
                />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                What would you like to do?
                <select name="trip" defaultValue={preselected} className={fieldClass}>
                  {trips.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Certification level
                <select name="level" className={fieldClass}>
                  <option>Never dived before</option>
                  <option>Open Water Diver</option>
                  <option>Advanced Open Water</option>
                  <option>Rescue Diver or above</option>
                </select>
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                Anything else? (hotel, gear sizes, questions)
                <textarea
                  name="notes"
                  rows={4}
                  className={fieldClass}
                  placeholder="Staying at Alona Beach, need a shortie wetsuit in size M."
                />
              </label>
              <button type="submit" className="btn-primary sm:col-span-2">
                Send booking request
              </button>
            </form>
          )}
        </div>

        <aside className="space-y-6">
          <div className="card-reef p-6">
            <h2 className="text-lg">Dive centre</h2>
            <div className="mt-4 space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <MapPin className="size-4 text-primary" /> Alona Beach Road, Panglao, Bohol
              </p>
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-primary" /> +63 917 555 0142
              </p>
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-primary" /> dive@boholdiveco.ph
              </p>
            </div>
          </div>
          <div className="surface-deep rounded-3xl p-6 text-sm text-deep-foreground/85">
            <h2 className="text-lg text-deep-foreground">Good to know</h2>
            <ul className="mt-4 space-y-2">
              <li>Boats leave at 8:00 and 11:00 daily.</li>
              <li>Free hotel pickup anywhere on Panglao.</li>
              <li>Marine park fees are paid on the island (PHP 100).</li>
              <li>No deposit — pay in cash or card at the shop.</li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
