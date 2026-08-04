import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { courses } from "@/data/diving";
import { supabase } from "@/integrations/supabase/client";
import { notifyAdminOfBookingRequest } from "@/lib/notification.functions";


export const Route = createFileRoute("/book")({
  validateSearch: (search: Record<string, unknown>) => ({
    course: typeof search["course"] === "string" ? (search["course"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Book a Dive in Bohol — Pro Diving Asia" },
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

const bookingSchema = z.object({
  full_name: z.string().trim().min(2, { message: "Please enter your full name" }).max(100),
  email: z.string().trim().email({ message: "Please enter a valid email" }).max(255),
  preferred_date: z.string().min(1, { message: "Please choose a preferred date" }),
  divers: z.coerce.number().int().min(1).max(12),
  trip: z.string().trim().min(1).max(120),
  certification_level: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(1000).optional(),
});

function BookPage() {
  const { course } = Route.useSearch();
  const notifyBooking = useServerFn(notifyAdminOfBookingRequest);
  const preselected = courses.find((c) => c.slug === course)?.name ?? trips[0];
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const parsed = bookingSchema.safeParse({
      full_name: form.get("name"),
      email: form.get("email"),
      preferred_date: form.get("date"),
      divers: form.get("divers"),
      trip: form.get("trip"),
      certification_level: form.get("level"),
      notes: form.get("notes") || undefined,
    });

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Please check the form");
      return;
    }

    setSubmitting(true);
    const { notes, ...rest } = parsed.data;
    const { error } = await supabase
      .from("booking_requests")
      .insert({ ...rest, notes: notes ?? null });

    if (error) {
      setSubmitting(false);
      toast.error("We couldn't send your request. Please try again or email us directly.");
      return;
    }

    setSent(true);
    setSubmitting(false);

    try {
      await notifyBooking({ data: parsed.data });
    } catch (notifyError) {
      console.error("Admin notification failed", notifyError);
      toast.error("Booking request saved, but we could not send the admin notification.");
    }
  }


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
            <form className="grid gap-5 sm:grid-cols-2" onSubmit={handleSubmit}>

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
              <button type="submit" disabled={submitting} className="btn-primary sm:col-span-2">
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-4 animate-spin" /> Sending…
                  </span>
                ) : (
                  "Send booking request"
                )}
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
