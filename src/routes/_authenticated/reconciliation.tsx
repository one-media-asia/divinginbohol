import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn, useClient } from "@tanstack/react-start";
import { getReconciliation, updateBooking } from "@/lib/bookings.functions";
import { simulatePaypalWebhook } from "@/lib/dev.functions";

export const Route = createFileRoute("/_authenticated/reconciliation")({
  head: () => ({ meta: [{ title: "Reconciliation — Pro Diving Asia" }] }),
  component: ReconciliationPage,
});

function ReconciliationPage() {
  const fetcher = useServerFn(getReconciliation);
  const togglePaid = useServerFn(updateBooking);
  const simulateWebhook = useServerFn(simulatePaypalWebhook);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ paid: any[]; unmatched: any[] } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetcher();
      setData(res);
    } finally {
      setLoading(false);
    }
  }

  async function markPaid(id: string) {
    try {
      await togglePaid({ id, paid: true });
      await load();
    } catch (err) {
      console.error(err);
      alert("Failed to mark paid");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl">Payments & Reconciliation</h1>
        <div>
          <button onClick={load} className="btn-outline">
            Refresh
          </button>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg">Recorded payments</h2>
        <p className="text-sm text-muted-foreground">Bookings marked as paid in the system.</p>
        <div className="mt-4">
          <button onClick={load} className="btn-ghost">
            Load
          </button>
          {loading && <span className="ml-3">Loading…</span>}
        </div>

        <div className="mt-4">
          {data?.paid?.length ? (
            <ul className="space-y-2">
              {data.paid.map((p) => (
                <li key={p.id} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{p.full_name} — {p.trip}</div>
                      <div className="text-sm text-muted-foreground">Paid at: {p.paid_at}</div>
                      <div className="text-sm text-muted-foreground">Ref: {p.payment_reference}</div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No recorded payments yet.</p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-lg">Unmatched deposit requests</h2>
          <p className="text-sm text-muted-foreground">Customers requested a deposit but are not yet marked as paid.</p>
          <div className="mt-4">
            {data?.unmatched?.length ? (
              <ul className="space-y-2">
                {data.unmatched.map((u) => (
                  <li key={u.id} className="rounded-md border p-3 flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{u.full_name} — {u.trip}</div>
                      <div className="text-sm text-muted-foreground">Requested: {u.created_at}</div>
                    </div>
                    <div className="flex gap-2">
                      <a href={`mailto:${u.email}?subject=Payment%20received%20for%20your%20booking`} className="btn-outline">Contact</a>
                      <button onClick={() => markPaid(u.id)} className="btn-primary">Mark paid</button>
                      <button
                        onClick={async () => {
                          try {
                            await simulateWebhook({ bookingId: u.id });
                            await load();
                          } catch (err) {
                            console.error(err);
                            alert("Simulation failed");
                          }
                        }}
                        className="btn-ghost"
                      >
                        Simulate webhook
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">No unmatched deposit requests.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
