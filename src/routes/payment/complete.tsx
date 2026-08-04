import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { capturePaypalOrder } from "@/lib/payments.functions";

export const Route = createFileRoute("/payment/complete")({
  head: () => ({
    meta: [{ title: "Payment complete — Pro Diving Asia" }],
  }),
  component: PaymentComplete,
});

function PaymentComplete() {
  const capture = useServerFn(capturePaypalOrder);
  const [status, setStatus] = useState<"idle" | "processing" | "ok" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token") || params.get("orderId");
    if (!token) {
      setStatus("error");
      setMessage("Missing payment token in URL.");
      return;
    }

    (async () => {
      setStatus("processing");
      try {
        const res = await capture({ orderId: token });
        setStatus("ok");
        setMessage(`Payment captured for booking ${res.bookingId}`);
      } catch (err: any) {
        console.error("Capture failed", err);
        setStatus("error");
        setMessage(err?.message || "Capture failed");
      }
    })();
  }, [capture]);

  return (
    <div className="mx-auto max-w-4xl px-5 py-20">
      <h1 className="text-2xl">Payment result</h1>
      <div className="mt-6">
        {status === "processing" && <p>Processing payment…</p>}
        {status === "ok" && <p className="text-green-600">{message}</p>}
        {status === "error" && <p className="text-red-600">{message}</p>}
      </div>
    </div>
  );
}
