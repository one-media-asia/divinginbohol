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
  deposit_requested: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
});

type BookingDraft = z.infer<typeof bookingSchema>;

const getCourseForTrip = (trip: string) => courses.find((course) => course.name === trip);

const formatCurrency = (value: number, currency: "PHP" | "USD") =>
  currency === "PHP" ? `PHP ${value.toLocaleString()}` : `USD $${value.toFixed(0)}`;

const getDepositAmount = (trip: string) => {
  const course = getCourseForTrip(trip);
  if (!course) return null;
  return {
    php: Math.round(course.php * 0.1),
    usd: Math.round(course.usd * 0.1),
    course,
  };
};

function BookPage() {
  const { course } = Route.useSearch();
  const notifyBooking = useServerFn(notifyAdminOfBookingRequest);
  const preselected = courses.find((c) => c.slug === course)?.name ?? trips[0];
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingBooking, setPendingBooking] = useState<BookingDraft | null>(null);
  const [step, setStep] = useState<"form" | "deposit">("form");
  const [selectedTrip, setSelectedTrip] = useState(preselected);
  const [depositProcessing, setDepositProcessing] = useState(false);
  const depositAmount = getDepositAmount(pendingBooking?.trip ?? selectedTrip);

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
      deposit_requested: form.get("deposit_requested") === "on",
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

    setPendingBooking(parsed.data);

    if (parsed.data.deposit_requested) {
      setStep("deposit");
      setSubmitting(false);
      try {
        await notifyBooking({ data: parsed.data });
      } catch (notifyError) {
        console.error("Admin notification failed", notifyError);
        toast.error("Booking request saved, but we could not send the admin notification.");
      }
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

  async function handleDepositPayment() {
    if (!pendingBooking) return;
    setDepositProcessing(true);

    try {
      // Open PayPal.me link in a new tab (use USD amount if available)
      const url = depositAmount
        ? `https://paypal.me/prodivingasia/${depositAmount.usd}`
        : "https://paypal.me/prodivingasia";
      if (typeof window !== "undefined") {
        window.open(url, "_blank", "noopener,noreferrer");
      }
      toast.success("Opening PayPal — complete the payment to confirm your booking.");
      // Mark booking as sent locally; admin already notified earlier.
      setSent(true);
      setPendingBooking(null);
      setStep("form");
    } finally {
      setDepositProcessing(false);
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
          ) : step === "deposit" && pendingBooking ? (
            <div className="grid gap-6">
              <div className="rounded-3xl border border-border bg-card p-6">
                <h2 className="text-2xl">Deposit payment</h2>
                <p className="mt-3 text-sm text-muted-foreground">
                  You have chosen to secure your booking with a 10% deposit. Complete the payment to keep your spot.
                </p>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-3xl bg-surface p-5">
                    <p className="text-sm text-muted-foreground">Selected trip</p>
                    <p className="mt-2 text-lg font-semibold">{pendingBooking.trip}</p>
                  </div>
                  <div className="rounded-3xl bg-surface p-5">
                    <p className="text-sm text-muted-foreground">Deposit amount</p>
                    <p className="mt-2 text-lg font-semibold">
                      {depositAmount ? (
                        <>
                          {formatCurrency(depositAmount.php, "PHP")} / {formatCurrency(depositAmount.usd, "USD")}
                        </>
                      ) : (
                        "Contact us for the deposit amount"
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-6">
                <h3 className="text-lg">Complete payment</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  We currently offer deposit payment by bank transfer or direct checkout link. After payment, we will confirm your booking.
                </p>
                <button
                  type="button"
                  disabled={depositProcessing}
                  onClick={handleDepositPayment}
                  className="btn-primary mt-6"
                >
                  {depositProcessing ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="size-4 animate-spin" /> Processing…
                    </span>
                  ) : (
                    "Proceed to payment"
                  )}
                </button>
                <div className="mt-4">
                  {depositAmount ? (
                    <a
                      href={`https://paypal.me/prodivingasia/${depositAmount.usd}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline mt-2 inline-flex items-center justify-center"
                    >
                      Pay via PayPal (USD {depositAmount.usd})
                    </a>
                  ) : (
                    <a
                      href="https://paypal.me/prodivingasia"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-outline mt-2 inline-flex items-center justify-center"
                    >
                      Pay via PayPal
                    </a>
                  )}

                  <div className="mt-3 text-xs text-muted-foreground">
                    <p>Or bank transfer: Account name Pro Diving Asia — please include your booking name.</p>
                    <p className="mt-1">After payment, reply to the confirmation email with the payment reference.</p>
                  </div>
                </div>
              </div>
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
                <select
                  name="trip"
                  value={selectedTrip}
                  onChange={(e) => setSelectedTrip(e.target.value)}
                  className={fieldClass}
                >
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
              <label className="flex items-center gap-3 text-sm font-medium sm:col-span-2">
                <input
                  type="checkbox"
                  name="deposit_requested"
                  className="h-5 w-5 rounded border-input bg-card text-primary focus:ring-primary"
                />
                <span>
                  Yes, I'd like to pay a <strong>10% deposit</strong> now to secure my spot.
                </span>
              </label>
              {depositAmount ? (
                <div className="sm:col-span-2 rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                  Estimated deposit for <strong>{selectedTrip}</strong>: {formatCurrency(depositAmount.php, "PHP")} / {formatCurrency(depositAmount.usd, "USD")}
                </div>
              ) : (
                <div className="sm:col-span-2 rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
                  For trips that are not PADI courses, we will follow up with a deposit amount after reviewing your booking.
                </div>
              )}
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
                <Mail className="size-4 text-primary" /> bookings@divinginaasia.com
              </p>
            </div>
          </div>
          <div className="surface-deep rounded-3xl p-6 text-sm text-deep-foreground/85">
            <h2 className="text-lg text-deep-foreground">Good to know</h2>
            <ul className="mt-4 space-y-2">
              <li>Boats leave at 8:00 and 11:00 daily.</li>
              <li>Free hotel pickup anywhere on Panglao.</li>
              <li>Marine park fees are paid on the island (PHP 100).</li>
              <li>No deposit required — pay in cash or card at the shop.</li>
              <li>Optional 10% deposit available on the form to hold your booking.</li>
            </ul>
          </div>
        </aside>
      </section>
    </>
  );
}
