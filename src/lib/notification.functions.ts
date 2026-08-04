import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import nodemailer from "nodemailer";

const bookingNotificationSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  preferred_date: z.string().min(1),
  divers: z.coerce.number().int().min(1).max(12),
  trip: z.string().trim().min(1).max(120),
  certification_level: z.string().trim().min(1).max(60),
  notes: z.string().trim().max(1000).optional(),
});

export const notifyAdminOfBookingRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => bookingNotificationSchema.parse(input))
  .handler(async ({ data }) => {
    const SMTP_HOST = process.env.SMTP_HOST;
    const SMTP_PORT = process.env.SMTP_PORT;
    const SMTP_USER = process.env.SMTP_USER;
    const SMTP_PASS = process.env.SMTP_PASS;
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "dive@boholdiveco.ph";
    const EMAIL_FROM = process.env.EMAIL_FROM || `no-reply@${new URL(process.env.SUPABASE_URL ?? "example.com").hostname}`;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
      throw new Error(
        "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your environment."
      );
    }

    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    const body = [`New booking request from ${data.full_name}:`, ``,
      `Email: ${data.email}`,
      `Preferred date: ${data.preferred_date}`,
      `Divers: ${data.divers}`,
      `Trip: ${data.trip}`,
      `Certification level: ${data.certification_level}`,
      `Notes: ${data.notes ?? "(none)"}`,
    ].join("\n");

    await transport.sendMail({
      from: EMAIL_FROM,
      to: ADMIN_EMAIL,
      subject: `New booking request from ${data.full_name}`,
      text: body,
      html: `<p>New booking request from <strong>${data.full_name}</strong></p>
<ul>
  <li><strong>Email:</strong> ${data.email}</li>
  <li><strong>Preferred date:</strong> ${data.preferred_date}</li>
  <li><strong>Divers:</strong> ${data.divers}</li>
  <li><strong>Trip:</strong> ${data.trip}</li>
  <li><strong>Certification level:</strong> ${data.certification_level}</li>
  <li><strong>Notes:</strong> ${data.notes ? data.notes : "(none)"}</li>
</ul>`,
    });

    return { ok: true };
  });
