import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { courses } from "@/data/diving";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const bookingNotificationSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  preferred_date: z.string().min(1),
  divers: z.coerce.number().int().min(1).max(12),
  trip: z.string().trim().min(1).max(120),
  certification_level: z.string().trim().min(1).max(60),
  deposit_requested: z.boolean(),
  notes: z.string().trim().max(1000).optional(),
});

const invoiceSchema = bookingNotificationSchema.extend({
  id: z.string().uuid(),
  paid: z.boolean().optional(),
  paid_at: z.string().nullable().optional(),
});

const formatCurrency = (value: number, currency: "PHP" | "USD") =>
  currency === "PHP" ? `PHP ${value.toLocaleString()}` : `USD $${value.toFixed(0)}`;

const getDepositAmount = (trip: string) => {
  const course = courses.find((course) => course.name === trip);
  if (!course) return null;
  return {
    php: Math.round(course.php * 0.1),
    usd: Math.round(course.usd * 0.1),
    course,
  };
};

type BookingNotificationRequest = z.infer<typeof bookingNotificationSchema>;

const isBookingNotificationRequest = (value: unknown): value is BookingNotificationRequest =>
  typeof value === "object" &&
  value !== null &&
  "full_name" in value &&
  "email" in value &&
  "preferred_date" in value &&
  "divers" in value &&
  "trip" in value &&
  "certification_level" in value;

const normalizeBookingNotificationPayload = (input: unknown): BookingNotificationRequest => {
  if (typeof input === "object" && input !== null && "data" in input) {
    const maybeData = (input as Record<string, unknown>).data;
    if (isBookingNotificationRequest(maybeData)) {
      return bookingNotificationSchema.parse(maybeData);
    }
  }

  return bookingNotificationSchema.parse(input);
};

export const notifyAdminOfBookingRequest = createServerFn({ method: "POST" })
  .inputValidator(normalizeBookingNotificationPayload)
  .handler(async (ctx) => {
    const data =
      typeof ctx === "object" && ctx !== null && "data" in ctx
        ? (ctx as Record<string, unknown>).data as BookingNotificationRequest
        : (ctx as BookingNotificationRequest);
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "bookings@divinginasia.com";
    const EMAIL_FROM = process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || `no-reply@${new URL(process.env.SUPABASE_URL ?? "example.com").hostname}`;

    if (!RESEND_API_KEY) {
      throw new Error(
        "Resend is not configured. Set RESEND_API_KEY in your environment."
      );
    }

    const body = [`New booking request from ${data.full_name}:`, ``,
      `Email: ${data.email}`,
      `Preferred date: ${data.preferred_date}`,
      `Divers: ${data.divers}`,
      `Trip: ${data.trip}`,
      `Certification level: ${data.certification_level}`,
      `Deposit requested: ${data.deposit_requested ? "Yes (10% deposit)" : "No"}`,
      `Notes: ${data.notes ?? "(none)"}`,
    ].join("\n");

    const sendEmail = async (to: string, subject: string, text: string, html: string) => {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: EMAIL_FROM,
          to,
          subject,
          text,
          html,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Resend API failed: ${res.status} ${res.statusText} - ${body}`);
      }

      return res.json();
    };

    await sendEmail(
      ADMIN_EMAIL,
      `New booking request from ${data.full_name}`,
      body,
      `<p>New booking request from <strong>${data.full_name}</strong></p>
<ul>
  <li><strong>Email:</strong> ${data.email}</li>
  <li><strong>Preferred date:</strong> ${data.preferred_date}</li>
  <li><strong>Divers:</strong> ${data.divers}</li>
  <li><strong>Trip:</strong> ${data.trip}</li>
  <li><strong>Certification level:</strong> ${data.certification_level}</li>
  <li><strong>Deposit requested:</strong> ${data.deposit_requested ? "Yes (10% deposit)" : "No"}</li>
  <li><strong>Notes:</strong> ${data.notes ? data.notes : "(none)"}</li>
</ul>`,
    );

    try {
      await sendEmail(
        data.email,
        "Your dive booking request has been received",
        `Hi ${data.full_name},\n\nThanks for your booking request. We have received it and will confirm availability by email shortly.\n\nYour request details:\n- Preferred date: ${data.preferred_date}\n- Divers: ${data.divers}\n- Trip: ${data.trip}\n- Certification level: ${data.certification_level}\n- Deposit requested: ${data.deposit_requested ? "Yes (10% deposit)" : "No"}\n- Notes: ${data.notes ?? "(none)"}\n\nSee you soon!\nPro Diving Asia`,
        `<p>Hi ${data.full_name},</p>
<p>Thanks for your booking request. We have received it and will confirm availability by email shortly.</p>
<h3>Your request details</h3>
<ul>
  <li><strong>Preferred date:</strong> ${data.preferred_date}</li>
  <li><strong>Divers:</strong> ${data.divers}</li>
  <li><strong>Trip:</strong> ${data.trip}</li>
  <li><strong>Certification level:</strong> ${data.certification_level}</li>
  <li><strong>Deposit requested:</strong> ${data.deposit_requested ? "Yes (10% deposit)" : "No"}</li>
  <li><strong>Notes:</strong> ${data.notes ? data.notes : "(none)"}</li>
</ul>
<p>See you soon!<br/>Pro Diving Asia</p>`,
      );
    } catch (confirmError) {
      console.error("Customer confirmation email failed", confirmError);
    }

    return { ok: true };
  });

export const sendInvoiceToCustomer = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => invoiceSchema.parse(input))
  .handler(async ({ data }) => {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    const EMAIL_FROM =
      process.env.RESEND_FROM || process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM ||
      `no-reply@${new URL(process.env.SUPABASE_URL ?? "example.com").hostname}`;

    if (!RESEND_API_KEY) {
      throw new Error(
        "Resend is not configured. Set RESEND_API_KEY in your environment."
      );
    }

    const depositAmount = getDepositAmount(data.trip);
    const paymentInstructions = data.deposit_requested
      ? depositAmount
        ? `Your 10% deposit is ${formatCurrency(depositAmount.php, "PHP")} / ${formatCurrency(
            depositAmount.usd,
            "USD",
          )}. You can pay via PayPal at https://paypal.me/prodivingasia/${depositAmount.usd}`
        : "We will send payment instructions once availability is confirmed."
      : "No deposit is required to hold your request; we will invoice you once availability is confirmed.";

    const text = `Hi ${data.full_name},\n\nHere is your invoice for the booking request you submitted with Pro Diving Asia.\n\nTrip: ${data.trip}\nPreferred date: ${data.preferred_date}\nDivers: ${data.divers}\nCertification level: ${data.certification_level}\nDeposit requested: ${data.deposit_requested ? "Yes (10% deposit)" : "No"}\n${paymentInstructions}\n\nNotes: ${data.notes ?? "(none)"}\n\nThank you,\nPro Diving Asia`;

    const html = `<p>Hi ${data.full_name},</p>
<p>Here is your invoice for the booking request you submitted with <strong>Pro Diving Asia</strong>.</p>
<ul>
  <li><strong>Trip:</strong> ${data.trip}</li>
  <li><strong>Preferred date:</strong> ${data.preferred_date}</li>
  <li><strong>Divers:</strong> ${data.divers}</li>
  <li><strong>Certification level:</strong> ${data.certification_level}</li>
  <li><strong>Deposit requested:</strong> ${data.deposit_requested ? "Yes (10% deposit)" : "No"}</li>
  <li><strong>Payment instructions:</strong> ${paymentInstructions}</li>
  <li><strong>Notes:</strong> ${data.notes ? data.notes : "(none)"}</li>
</ul>
<p>Thank you,<br/>Pro Diving Asia</p>`;

    await sendEmail(
      data.email,
      `Invoice for your Pro Diving Asia booking: ${data.trip}`,
      text,
      html,
    );

    return { ok: true };
  });
