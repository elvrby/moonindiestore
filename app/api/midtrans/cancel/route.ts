// app/api/midtrans/cancel/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
const MIDTRANS_BASE = process.env.MIDTRANS_BASE_URL ?? "https://api.sandbox.midtrans.com";

function midtransHeaders() {
  const auth = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");
  return {
    "Content-Type": "application/json",
    Authorization: `Basic ${auth}`,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { midtransOrderId } = await req.json();
    if (!midtransOrderId) {
      return NextResponse.json({ error: "midtransOrderId required" }, { status: 400 });
    }

    // 1) Ambil status sekarang
    const statusRes = await fetch(`${MIDTRANS_BASE}/v2/${encodeURIComponent(midtransOrderId)}/status`, { headers: midtransHeaders() });
    const before = await statusRes.json();

    const tx = String(before?.transaction_status || "").toLowerCase();
    const payType = String(before?.payment_type || "").toLowerCase();

    let after = before;

    // 2) Tentukan aksi yang sesuai
    if (tx === "pending") {
      // Non-card (VA/QRIS/e-wallet, dll) sebaiknya di-expire agar dashboard jadi "expire"
      const isCreditCard = payType === "credit_card";
      if (!isCreditCard) {
        const expRes = await fetch(`${MIDTRANS_BASE}/v2/${encodeURIComponent(midtransOrderId)}/expire`, { method: "POST", headers: midtransHeaders() });
        try {
          after = await expRes.json();
        } catch {}
      } else {
        // Credit card: coba cancel dulu
        const cancelRes = await fetch(`${MIDTRANS_BASE}/v2/${encodeURIComponent(midtransOrderId)}/cancel`, { method: "POST", headers: midtransHeaders() });
        if (cancelRes.ok) {
          after = await cancelRes.json();
        } else {
          // Fallback ke expire bila cancel tidak diperbolehkan
          const expRes = await fetch(`${MIDTRANS_BASE}/v2/${encodeURIComponent(midtransOrderId)}/expire`, { method: "POST", headers: midtransHeaders() });
          if (expRes.ok) after = await expRes.json();
        }
      }
    } else if (payType === "credit_card" && ["authorize", "capture"].includes(tx)) {
      // Credit card authorize/capture: coba cancel bila memungkinkan
      const cancelRes = await fetch(`${MIDTRANS_BASE}/v2/${encodeURIComponent(midtransOrderId)}/cancel`, { method: "POST", headers: midtransHeaders() });
      if (cancelRes.ok) {
        after = await cancelRes.json();
      } else {
        // Fallback: expire (tidak selalu berlaku untuk CC, tapi aman dicoba)
        const expRes = await fetch(`${MIDTRANS_BASE}/v2/${encodeURIComponent(midtransOrderId)}/expire`, { method: "POST", headers: midtransHeaders() });
        if (expRes.ok) after = await expRes.json();
      }
    }
    // settlement/expire/cancel/refund: biarkan apa adanya

    return NextResponse.json({ before, after });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Midtrans error" }, { status: 500 });
  }
}
