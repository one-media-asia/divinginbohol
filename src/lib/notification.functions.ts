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
  notes: z.string().trim().max(1000).nullable().optional(),
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

const getEnv = (key: string) => process.env[key];

const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  html: string,
  apiKey: string,
  from: string,
) => {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
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

type BookingNotificationRequest = z.infer<typeof bookingNotificationSchema>;

export const notifyAdminOfBookingRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingNotificationSchema.parse(input))
  .handler(async ({ data }) => {
    const RESEND_API_KEY = getEnv("RESEND_API_KEY");
    const ADMIN_EMAIL = getEnv("ADMIN_EMAIL") || "bookings@divinginasia.com";
    const EMAIL_FROM =
      getEnv("RESEND_FROM") || getEnv("RESEND_FROM_EMAIL") || getEnv("EMAIL_FROM") ||
      `no-reply@${new URL(getEnv("SUPABASE_URL") ?? "example.com").hostname}`;

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
      RESEND_API_KEY,
      EMAIL_FROM,
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
        RESEND_API_KEY,
        EMAIL_FROM,
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
    const RESEND_API_KEY = getEnv("RESEND_API_KEY");
    const EMAIL_FROM =
      getEnv("RESEND_FROM") || getEnv("RESEND_FROM_EMAIL") || getEnv("EMAIL_FROM") ||
      `no-reply@${new URL(getEnv("SUPABASE_URL") ?? "example.com").hostname}`;

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

    const invoiceHtml = `<div style="font-family:Arial,sans-serif;color:#111;line-height:1.5;">
  <div style="max-width:680px;margin:0 auto;padding:20px;">
    <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
      <div>
        <h1 style="margin:0;font-size:28px;color:#003f7d;">Pro Diving Asia</h1>
        <p style="margin:6px 0 0;font-size:14px;color:#4b5563;">Invoice for your diving booking</p>
      </div>
      <div style="text-align:right;font-size:14px;color:#4b5563;">
        <p style="margin:0;"><strong>Invoice issued:</strong> ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</p>
      </div>
    </div>

    <div style="margin:24px 0;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;">
      <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">Booking summary</h2>
      <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <tbody>
          <tr><td style="padding:8px 0;font-weight:700;color:#0f172a;">Trip:</td><td style="padding:8px 0;color:#334155;">${data.trip}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0f172a;">Preferred date:</td><td style="padding:8px 0;color:#334155;">${data.preferred_date}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0f172a;">Divers:</td><td style="padding:8px 0;color:#334155;">${data.divers}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0f172a;">Certification level:</td><td style="padding:8px 0;color:#334155;">${data.certification_level}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0f172a;">Deposit requested:</td><td style="padding:8px 0;color:#334155;">${data.deposit_requested ? "Yes (10% deposit)" : "No"}</td></tr>
          <tr><td style="padding:8px 0;font-weight:700;color:#0f172a;">Payment status:</td><td style="padding:8px 0;color:#334155;">${data.paid ? "Paid" : "Pending"}</td></tr>
        </tbody>
      </table>
    </div>

    <div style="margin-bottom:24px;padding:20px;background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;">
      <h3 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Payment instructions</h3>
      <p style="margin:0 0 12px;color:#334155;">${paymentInstructions}</p>
      ${data.deposit_requested ? `<a href="https://paypal.me/prodivingasia/${depositAmount?.usd}" style="display:inline-block;padding:12px 20px;background:#0f172a;color:#ffffff;border-radius:999px;text-decoration:none;font-weight:700;">Pay via PayPal</a>` : ""}
    </div>

    <div style="margin-bottom:24px;padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:18px;">
      <h3 style="margin:0 0 12px;font-size:16px;color:#0f172a;">Notes</h3>
      <p style="margin:0;color:#334155;">${data.notes ? data.notes : "No additional notes."}</p>
    </div>

    <footer style="font-size:13px;color:#64748b;">
      <p style="margin:0 0 6px;">If you have any questions, reply to this email or contact us at <a href="mailto:bookings@divinginasia.com" style="color:#0f172a;text-decoration:none;">bookings@divinginasia.com</a>.</p>
      <p style="margin:0;">Pro Diving Asia — Panglao, Bohol</p>
    </footer>
  </div>
</div>`;

    await sendEmail(
      data.email,
      `Pro Diving Asia invoice for ${data.trip}`,
      text,
      invoiceHtml,
      RESEND_API_KEY,
      EMAIL_FROM,
    );

    return { ok: true };
  });
