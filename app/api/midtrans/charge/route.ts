// app/api/midtrans/charge/route.ts
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { totalPrice, orderId } = await req.json();
    const serverKey = process.env.MIDTRANS_SERVER_KEY!;
    const basic = Buffer.from(serverKey + ":").toString("base64");

    const res = await fetch("https://app.sandbox.midtrans.com/snap/v1/transactions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${basic}`,
      },
      body: JSON.stringify({
        transaction_details: {
          order_id: orderId,
          gross_amount: Number(totalPrice),
        },
        credit_card: { secure: true },
      }),
    });

    const data = await res.json();
    if (!res.ok || !data?.token) {
      return NextResponse.json({ error: data?.status_message || "Failed to create transaction" }, { status: res.status || 500 });
    }

    // Kirim hanya token; abaikan redirect_url dari Midtrans
    return NextResponse.json({ token: data.token });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unexpected error" }, { status: 500 });
  }
}
