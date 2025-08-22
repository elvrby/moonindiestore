// app/api/midtrans/charge/route.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const isProd = (process.env.MIDTRANS_ENV || "").toLowerCase() === "production";
const SNAP_BASE = isProd ? "https://app.midtrans.com" : "https://app.sandbox.midtrans.com";

function midtransAuthHeader() {
  const key = process.env.MIDTRANS_SERVER_KEY || "";
  if (!key) throw new Error("MIDTRANS_SERVER_KEY belum diset di environment.");
  return "Basic " + Buffer.from(`${key}:`).toString("base64");
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const orderId: string | undefined = body?.orderId; // id dokumen lokal (untuk referensi kita)
    const midtransOrderId: string | undefined = body?.midtransOrderId || orderId; // id yang dikirim ke Midtrans
    const totalPrice: number = Number(body?.totalPrice || 0);

    if (!midtransOrderId || !Number.isFinite(totalPrice) || totalPrice <= 0) {
      return NextResponse.json({ error: "orderId/midtransOrderId dan totalPrice tidak valid." }, { status: 400 });
    }

    const payload = {
      transaction_details: {
        order_id: midtransOrderId,
        gross_amount: Math.round(totalPrice),
      },
      // aktifkan 3DS utk CC
      credit_card: {
        secure: true,
      },
      // atur masa berlaku (opsional)
      expiry: {
        unit: "minutes",
        duration: 30,
      },
    };

    const res = await fetch(`${SNAP_BASE}/snap/v1/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: midtransAuthHeader(),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json?.token) {
      return NextResponse.json({ error: "Gagal membuat Snap transaction", details: json }, { status: 400 });
    }

    return NextResponse.json(
      {
        token: json.token,
        redirect_url: json.redirect_url,
        midtransOrderId, // supaya client tahu order_id yang dipakai
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server error" }, { status: 500 });
  }
}
