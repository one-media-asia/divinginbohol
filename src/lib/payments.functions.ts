import { createServerFn } from "@tanstack/react-start";

// PayPal webhook verification and booking mark-as-paid
export const handlePaypalWebhook = createServerFn({ method: "POST" })
  .handler(async ({ req, context }) => {
    const headers = req.headers;
    const body = await req.json().catch(() => null);

    const transmissionId = headers.get("paypal-transmission-id") || headers.get("Paypal-Transmission-Id");
    const transmissionTime = headers.get("paypal-transmission-time") || headers.get("Paypal-Transmission-Time");
    const certUrl = headers.get("paypal-cert-url") || headers.get("Paypal-Cert-Url");
    const authAlgo = headers.get("paypal-auth-algo") || headers.get("Paypal-Auth-Algo");
    const transmissionSig = headers.get("paypal-transmission-sig") || headers.get("Paypal-Transmission-Sig");

    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;
    const mode = process.env.PAYPAL_MODE === "sandbox" ? "sandbox" : "live";

    if (!webhookId || !clientId || !clientSecret) {
      return new Response("Missing PayPal config", { status: 500 });
    }

    const apiBase = process.env.PAYPAL_MODE === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    // fetch access token
    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      console.error("PayPal token fetch failed", txt);
      return new Response("PayPal token fetch failed", { status: 500 });
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    // verify webhook signature
    const verifyPayload = {
      auth_algo: authAlgo,
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: transmissionSig,
      transmission_time: transmissionTime,
      webhook_id: webhookId,
      webhook_event: body,
    };

    const verifyRes = await fetch(`${apiBase}/v1/notifications/verify-webhook-signature`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(verifyPayload),
    });

    if (!verifyRes.ok) {
      const txt = await verifyRes.text();
      console.error("PayPal verify failed", txt);
      return new Response("PayPal verify failed", { status: 400 });
    }

    const verifyJson = await verifyRes.json();
    if (verifyJson.verification_status !== "SUCCESS") {
      console.warn("Invalid PayPal webhook signature", verifyJson);
      return new Response("Invalid signature", { status: 400 });
    }

    // Process event: try to extract booking id from resource.custom_id or resource.invoice_id
    const resource = body?.resource || {};
    const bookingId = resource.custom_id || resource.invoice_id || resource.supplementary_data?.related_ids?.invoice_id;

    if (!bookingId) {
      console.warn("PayPal webhook: no booking id found on resource", resource);
      return new Response("No booking id", { status: 200 });
    }

    try {
      const { data, error } = await context.supabase
        .from("booking_requests")
        .update({ paid: true, paid_at: new Date().toISOString(), payment_reference: resource.id ?? resource.sale_id ?? resource.transaction_id ?? null })
        .eq("id", bookingId)
        .select()
        .maybeSingle();

      if (error) {
        console.error("Failed to update booking as paid", error);
        return new Response("DB update failed", { status: 500 });
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Exception updating booking", err);
      return new Response("Server error", { status: 500 });
    }
  });

export default handlePaypalWebhook;

import { z } from "zod";

export const createPaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ bookingId: z.string().uuid(), amount: z.number().positive(), currency: z.string().length(3) })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;
    const apiBase = process.env.PAYPAL_MODE === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    if (!clientId || !clientSecret) {
      throw new Error("Missing PayPal credentials");
    }

    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      throw new Error(`PayPal token fetch failed: ${txt}`);
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    const body = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: data.currency,
            value: (data.amount).toFixed(2),
          },
          custom_id: data.bookingId,
        },
      ],
      application_context: {
        brand_name: "Pro Diving Asia",
        user_action: "PAY_NOW",
        return_url: `${process.env.BASE_URL || ""}/payment/complete`,
        cancel_url: `${process.env.BASE_URL || ""}/book`,
      },
    };

    const orderRes = await fetch(`${apiBase}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!orderRes.ok) {
      const txt = await orderRes.text();
      throw new Error(`Create PayPal order failed: ${txt}`);
    }

    const orderJson = await orderRes.json();
    const approveLink = (orderJson.links || []).find((l: any) => l.rel === "approve")?.href;
    return { approvalUrl: approveLink, orderId: orderJson.id };
  });

export const capturePaypalOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ orderId: z.string().min(1) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_SECRET;
    const apiBase = process.env.PAYPAL_MODE === "sandbox" ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";

    if (!clientId || !clientSecret) throw new Error("Missing PayPal credentials");

    const tokenRes = await fetch(`${apiBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    if (!tokenRes.ok) {
      const txt = await tokenRes.text();
      throw new Error(`PayPal token fetch failed: ${txt}`);
    }

    const tokenJson = await tokenRes.json();
    const accessToken = tokenJson.access_token;

    // Fetch order to read custom_id (booking id)
    const orderRes = await fetch(`${apiBase}/v2/checkout/orders/${data.orderId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!orderRes.ok) {
      const txt = await orderRes.text();
      throw new Error(`Fetch PayPal order failed: ${txt}`);
    }

    const orderJson = await orderRes.json();
    const bookingId = orderJson.purchase_units?.[0]?.custom_id;
    if (!bookingId) throw new Error("Order missing booking id (custom_id)");

    // Capture the order
    const captureRes = await fetch(`${apiBase}/v2/checkout/orders/${data.orderId}/capture`, {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    });

    if (!captureRes.ok) {
      const txt = await captureRes.text();
      throw new Error(`Capture failed: ${txt}`);
    }

    const captureJson = await captureRes.json();
    const captureId = captureJson.id ?? captureJson.purchase_units?.[0]?.payments?.captures?.[0]?.id ?? null;

    // Update booking in DB
    try {
      const { error } = await context.supabase
        .from("booking_requests")
        .update({ paid: true, paid_at: new Date().toISOString(), payment_reference: captureId })
        .eq("id", bookingId);
      if (error) throw error;
    } catch (err) {
      console.error("Failed to update booking after capture", err);
      throw new Error("Failed to update booking");
    }

    return { ok: true, bookingId, captureId };
  });

