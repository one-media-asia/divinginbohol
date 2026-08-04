import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const bookingNotificationSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  preferred_date: z.string().min(1),
  divers: z.coerce.number().int().min(1).max(12),
  trip: z.string().trim().min(1).max(120),
  certification_level: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(1000).optional(),
});

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
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dive@boholdiveco.ph";
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
  <li><strong>Notes:</strong> ${data.notes ? data.notes : "(none)"}</li>
</ul>`,
    );

    try {
      await sendEmail(
        data.email,
        "Your dive booking request has been received",
        `Hi ${data.full_name},\n\nThanks for your booking request. We have received it and will confirm availability by email shortly.\n\nYour request details:\n- Preferred date: ${data.preferred_date}\n- Divers: ${data.divers}\n- Trip: ${data.trip}\n- Certification level: ${data.certification_level}\n- Notes: ${data.notes ?? "(none)"}\n\nSee you soon!\nBohol Dive Co.`,
        `<p>Hi ${data.full_name},</p>
<p>Thanks for your booking request. We have received it and will confirm availability by email shortly.</p>
<h3>Your request details</h3>
<ul>
  <li><strong>Preferred date:</strong> ${data.preferred_date}</li>
  <li><strong>Divers:</strong> ${data.divers}</li>
  <li><strong>Trip:</strong> ${data.trip}</li>
  <li><strong>Certification level:</strong> ${data.certification_level}</li>
  <li><strong>Notes:</strong> ${data.notes ? data.notes : "(none)"}</li>
</ul>
<p>See you soon!<br/>Bohol Dive Co.</p>`,
      );
    } catch (confirmError) {
      console.error("Customer confirmation email failed", confirmError);
    }

    return { ok: true };
  });
