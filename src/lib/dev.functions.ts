import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

// Dev-only: simulate a PayPal webhook delivery to mark a booking as paid.
export const simulatePaypalWebhook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ bookingId: z.string().uuid(), captureId: z.string().optional() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    // Only allow in non-production or when explicitly enabled
    if (process.env.NODE_ENV === "production" && !process.env.ALLOW_DEV_WEBHOOK) {
      throw new Error("simulatePaypalWebhook is disabled in production");
    }

    const captureRef = data.captureId ?? `dev-sim-${Date.now()}`;
    const { error } = await context.supabase
      .from("booking_requests")
      .update({ paid: true, paid_at: new Date().toISOString(), payment_reference: captureRef })
      .eq("id", data.bookingId);
    if (error) throw error;
    return { ok: true, bookingId: data.bookingId, captureRef };
  });

export default simulatePaypalWebhook;
