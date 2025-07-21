// app/api/midtrans/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/firebase/config";
import { doc, updateDoc } from "firebase/firestore";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { order_id, transaction_status } = body;

  try {
    if (!order_id || !transaction_status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const orderRef = doc(db, "orders", order_id);

    // Update status di Firestore
    await updateDoc(orderRef, {
      status: transaction_status, // bisa: 'settlement', 'cancel', 'expire', etc
      updatedAt: new Date(),
    });

    return NextResponse.json({ message: "Order status updated" });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
