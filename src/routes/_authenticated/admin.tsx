import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { isAdmin, listBookings, updateBooking } from "@/lib/bookings.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Booking Requests — Pro Diving Asia Admin" },
      { name: "description", content: "Internal dashboard for Pro Diving Asia booking requests." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type Status = "new" | "confirmed" | "declined" | "archived";
const statuses: Status[] = ["new", "confirmed", "declined", "archived"];

const statusStyles: Record<Status, string> = {
  new: "bg-primary/15 text-primary",
  confirmed: "bg-accent/20 text-accent",
  declined: "bg-destructive/15 text-destructive",
  archived: "bg-muted text-muted-foreground",
};

function AdminPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fetchIsAdmin = useServerFn(isAdmin);
  const fetchBookings = useServerFn(listBookings);
  const saveBooking = useServerFn(updateBooking);

  const [status, setStatus] = useState<"all" | Status>("all");
  const [paidFilter, setPaidFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [term, setTerm] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");

  const adminQuery = useQuery({ queryKey: ["is-admin"], queryFn: () => fetchIsAdmin({}) });
  const bookingsQuery = useQuery({
    queryKey: ["bookings"],
    queryFn: () => fetchBookings({}),
    enabled: adminQuery.data === true,
  });

  const mutation = useMutation({
    mutationFn: saveBooking,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      toast.success("Booking updated");
    },
    onError: () => toast.error("Could not update booking"),
  });

  const rows = useMemo(() => {
    const list = bookingsQuery.data ?? [];
    const q = term.trim().toLowerCase();
    return list.filter((b) => {
      if (status !== "all" && b.status !== status) return false;
      if (paidFilter !== "all") {
        if (paidFilter === "paid" && !b.paid) return false;
        if (paidFilter === "unpaid" && b.paid) return false;
      }
      if (!q) return true;
      return (
        b.full_name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.trip.toLowerCase().includes(q)
      );
    });
  }, [bookingsQuery.data, status, term]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (adminQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center pt-32">
        <Loader2 className="size-6 animate-spin text-primary" />
      </div>
    );
  }

  if (adminQuery.data !== true) {
    return (
      <div className="mx-auto max-w-xl px-5 pt-40 pb-24 text-center">
        <h1 className="text-2xl">Admin access required</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Your account is signed in but has not been given the admin role yet. Ask an existing admin
          to grant it, then reload this page.
        </p>
        <button type="button" className="btn-ghost mt-6" onClick={signOut}>
          Sign out
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pt-32 pb-20">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Dashboard</p>
          <h1 className="mt-2 text-3xl sm:text-4xl">Booking requests</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {rows.length} of {bookingsQuery.data?.length ?? 0} requests shown
          </p>
        </div>
        <button type="button" className="btn-ghost" onClick={signOut}>
          Sign out
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search name, email or trip"
            className="w-72 rounded-2xl border border-input bg-card py-2.5 pr-4 pl-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/25"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["all", ...statuses] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`rounded-full px-4 py-2 text-xs font-semibold capitalize transition ${
                status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground mr-2">Payment</span>
          {(["all", "paid", "unpaid"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPaidFilter(p)}
              className={`rounded-full px-3 py-2 text-xs font-semibold capitalize transition ${
                paidFilter === p ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/70"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {bookingsQuery.isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      ) : rows.length === 0 ? (
        <p className="card-reef mt-8 p-10 text-center text-sm text-muted-foreground">
          No booking requests match this filter yet.
        </p>
      ) : (
        <div className="mt-8 grid gap-4">
          {rows.map((b) => {
            const open = openId === b.id;
            return (
              <article key={b.id} className="card-reef p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-lg">{b.full_name}</h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[b.status as Status]}`}
                      >
                        {b.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      <a href={`mailto:${b.email}`} className="text-primary hover:underline">
                        {b.email}
                      </a>{" "}
                      · {b.divers} diver{b.divers === 1 ? "" : "s"} ·{" "}
                      {new Date(b.preferred_date).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-2 text-sm">
                      <strong className="font-semibold">{b.trip}</strong> — {b.certification_level}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Deposit requested: {b.deposit_requested ? "Yes (10% deposit)" : "No"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">Paid: {b.paid ? "Yes" : "No"}</p>
                    {b.notes ? (
                      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{b.notes}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({ data: { id: b.id, paid: !b.paid } })
                      }
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition bg-muted hover:bg-muted/70"
                    >
                      {b.paid ? "Mark unpaid" : "Mark paid"}
                    </button>
                    {statuses.map((s) => (
                      <button
                        key={s}
                        type="button"
                        disabled={mutation.isPending || b.status === s}
                        onClick={() => mutation.mutate({ data: { id: b.id, status: s } })}
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition disabled:opacity-40 ${
                          b.status === s
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/70"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4 border-t border-border pt-4">
                  {open ? (
                    <div className="grid gap-3">
                      <textarea
                        rows={3}
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        placeholder="Internal note — pickup time, boat assignment, follow-up…"
                        className="w-full rounded-2xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/25"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="btn-primary"
                          disabled={mutation.isPending}
                          onClick={() => {
                            mutation.mutate({
                              data: { id: b.id, admin_notes: draftNotes.trim() || null },
                            });
                            setOpenId(null);
                          }}
                        >
                          Save note
                        </button>
                        <button type="button" className="btn-ghost" onClick={() => setOpenId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        {b.admin_notes ? (
                          <>
                            <span className="font-semibold text-foreground">Internal note: </span>
                            {b.admin_notes}
                          </>
                        ) : (
                          "No internal note yet."
                        )}
                      </p>
                      <button
                        type="button"
                        className="text-sm font-semibold text-primary hover:underline"
                        onClick={() => {
                          setOpenId(b.id);
                          setDraftNotes(b.admin_notes ?? "");
                        }}
                      >
                        {b.admin_notes ? "Edit note" : "Add note"}
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
