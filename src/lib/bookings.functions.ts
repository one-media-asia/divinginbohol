import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const statusSchema = z.enum(["new", "confirmed", "declined", "archived"]);

export const isAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "admin",
    });
    if (error) throw error;
    return data === true;
  });

export const listBookings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("booking_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getReconciliation = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: paid, error: errPaid } = await context.supabase
      .from("booking_requests")
      .select("*")
      .eq("paid", true)
      .order("paid_at", { ascending: false });
    if (errPaid) throw errPaid;

    const { data: unmatched, error: errUnmatched } = await context.supabase
      .from("booking_requests")
      .select("*")
      .eq("deposit_requested", true)
      .eq("paid", false)
      .order("created_at", { ascending: false });
    if (errUnmatched) throw errUnmatched;

    return { paid: paid ?? [], unmatched: unmatched ?? [] };
  });

export const updateBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: statusSchema.optional(),
        admin_notes: z.string().trim().max(2000).nullable().optional(),
        paid: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const patch: {
      status?: "new" | "confirmed" | "declined" | "archived";
      admin_notes?: string | null;
      paid?: boolean;
      paid_at?: string | null;
    } = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.admin_notes !== undefined) patch.admin_notes = data.admin_notes;
    if (data.paid !== undefined) {
      patch.paid = data.paid;
      patch.paid_at = data.paid ? new Date().toISOString() : null;
    }

    const { data: row, error } = await context.supabase
      .from("booking_requests")
      .update(patch)
      .eq("id", data.id)
      .select()
      .maybeSingle();
    if (error) throw error;
    if (!row) throw new Error("Not allowed to update this request");
    return row;
  });


export const deleteBooking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("booking_requests")
      .delete()
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });
