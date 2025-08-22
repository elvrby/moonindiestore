// app/api/midtrans/webhook/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/libs/firebase/config";
import { collection, query, where, limit, getDocs, doc, getDoc, updateDoc, deleteField } from "firebase/firestore";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Optional: verify Midtrans signature when fields are present */
function verifySignature(body: any): boolean {
  try {
    const serverKey = process.env.MIDTRANS_SERVER_KEY || "";
    const { order_id, status_code, gross_amount, signature_key } = body || {};
    if (!serverKey || !order_id || !status_code || !gross_amount || !signature_key) {
      // Not enough info to verify, accept (you can choose to reject instead)
      return true;
    }
    const raw = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const computed = crypto.createHash("sha512").update(raw).digest("hex");
    return computed === String(signature_key).toLowerCase();
  } catch {
    return false;
  }
}

/** Map status Midtrans → status lokal Firestore */
function mapGatewayToLocal(s: string) {
  const k = (s || "").toLowerCase();
  if (k === "pending") return "pending";
  if (k === "settlement" || k === "capture" || k === "success") return "success";
  if (k === "expire" || k === "expired") return "expire";
  if (k === "cancel") return "cancelled";
  if (k === "deny" || k === "failure") return "error";
  if (k === "refund" || k === "partial_refund") return "success"; // sesuaikan jika punya status "refunded"
  return k;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as any;

    const { order_id, transaction_status, payment_type, fraud_status, status_code, gross_amount, signature_key } = body || {};

    if (!order_id || !transaction_status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    // (Optional) Verify signature
    if (!verifySignature({ order_id, status_code, gross_amount, signature_key })) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // --- Cari dokumen order yang benar ---
    let orderDocId = order_id; // fallback jika docId = order_id
    let orderRef = doc(db, "orders", orderDocId);
    let snap = await getDoc(orderRef);

    if (!snap.exists()) {
      // 1) cari via daftar riwayat order_id midtrans
      const q1 = query(collection(db, "orders"), where("midtransOrderIds", "array-contains", order_id), limit(1));
      const s1 = await getDocs(q1);
      if (!s1.empty) {
        orderDocId = s1.docs[0].id;
        orderRef = doc(db, "orders", orderDocId);
        snap = s1.docs[0];
      } else {
        // 2) fallback: cari via midtransOrderId terakhir
        const q2 = query(collection(db, "orders"), where("midtransOrderId", "==", order_id), limit(1));
        const s2 = await getDocs(q2);
        if (!s2.empty) {
          orderDocId = s2.docs[0].id;
          orderRef = doc(db, "orders", orderDocId);
          snap = s2.docs[0];
        } else {
          // 3) terakhir: kalau benar-benar tidak ketemu, log dan akhiri (idempotent)
          console.warn(`[WEBHOOK] Order not found for order_id=${order_id}. Ignored.`);
          return NextResponse.json({ message: "Ignored: order not found" }, { status: 200 });
        }
      }
    }

    const current = snap.data() as any;
    const currentStatus = String(current?.status || "").toLowerCase();

    // Jika user sudah membatalkan manual, JANGAN timpa ke expire/cancel dari gateway
    const frozenByUserCancel = currentStatus === "cancelled" || String(current?.statusFrozen?.reason || "") === "user_cancel";

    // Jika sudah success/settlement, jangan pernah downgrade ke pending/expire/cancel/error
    const isTerminalPaid = currentStatus === "success" || currentStatus === "settlement";

    // Selalu simpan payload terbaru dari Midtrans untuk audit
    const patch: any = {
      midtrans: { ...(current?.midtrans || {}), ...body },
      updatedAt: new Date(),
    };

    if (frozenByUserCancel) {
      patch.statusFrozen = {
        ...(current?.statusFrozen || {}),
        reason: "user_cancel",
        at: current?.statusFrozen?.at || new Date(),
        gateway_status: String(transaction_status).toLowerCase(),
      };
      await updateDoc(orderRef, patch);
      return NextResponse.json({
        message: "Order payload updated, status preserved as cancelled",
        orderDocId,
      });
    }

    const mapped = mapGatewayToLocal(transaction_status);

    // Hindari downgrade setelah paid
    if (isTerminalPaid && mapped !== "success") {
      // Tetap update payload midtrans, tapi jangan ubah status lokal
      await updateDoc(orderRef, patch);
      return NextResponse.json({
        message: "Order payload updated, paid status preserved",
        orderDocId,
        preservedFrom: mapped,
      });
    }

    // Belum dibekukan dan bukan terminal paid → boleh update status lokal
    patch.status = mapped;

    // Kelola timestamp sesuai status
    if (mapped === "success") {
      patch.paidAt = new Date();
      patch.errorAt = deleteField();
      patch.expiredAt = deleteField();
      patch.cancelledAt = deleteField();
    } else if (mapped === "pending") {
      // tidak set waktu khusus
    } else if (mapped === "cancelled") {
      patch.cancelledAt = new Date();
      patch.expiredAt = deleteField();
      patch.errorAt = deleteField();
    } else if (mapped === "expire") {
      patch.expiredAt = new Date();
      patch.cancelledAt = deleteField();
      patch.errorAt = deleteField();
    } else if (mapped === "error") {
      patch.errorAt = new Date();
    }

    await updateDoc(orderRef, patch);

    return NextResponse.json({
      message: "Order status updated",
      orderDocId,
      mappedStatus: mapped,
      gateway: { transaction_status, payment_type, fraud_status },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}
