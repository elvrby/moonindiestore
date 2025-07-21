// app/api/transaction/route.ts
import { NextResponse } from "next/server";
import MidtransClient from "midtrans-client";

export async function POST(req: Request) {
  try {
    const { totalPrice, orderId } = await req.json();

    if (!totalPrice || !orderId) {
      return NextResponse.json({ error: "totalPrice dan orderId harus disertakan" }, { status: 400 });
    }

    const snap = new MidtransClient.Snap({
      isProduction: false,
      serverKey: process.env.MIDTRANS_SERVER_KEY || "",
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: totalPrice,
      },
      customer_details: {
        first_name: "User",
        email: "user@example.com", // optional
      },
    };

    const transaction = await snap.createTransaction(parameter);

    return NextResponse.json({ token: transaction.token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Midtrans error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Gagal membuat transaksi" }, { status: 500 });
  }
}
