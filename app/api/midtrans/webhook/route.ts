// /app/api/midtrans/webhook.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { db } from "@/libs/firebase/config";
import { doc, updateDoc } from "firebase/firestore";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const notification = req.body;

  try {
    const transactionStatus = notification.transaction_status; // 'settlement', 'pending', 'expire', etc.
    const orderId = notification.order_id; // Pastikan orderId = order-123 di order kamu

    // Update Firestore order status
    await updateDoc(doc(db, "orders", orderId), {
      status: transactionStatus,
      updatedAt: new Date(),
    });

    return res.status(200).json({ message: "Notification received and processed" });
  } catch (error) {
    console.error("Failed to process webhook", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
