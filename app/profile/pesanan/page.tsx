// app/profile/pesanan/page.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useUserSession } from "@/hooks/use-user-session";
import { Timestamp, doc, getDoc, onSnapshot, updateDoc, arrayUnion, deleteField } from "firebase/firestore";
import { db } from "@/libs/firebase/config";
import HeaderComponent from "@/app/components/layout/header";

/* ============================
 * Types
 * ============================ */
type OrderItem = {
  productId: string;
  productTitle: string;
  pricePerItem: number;
  quantity: number;
  image?: string;
};

type ShippingAddress = {
  name: string;
  phone: string;
  addressLine: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  postalCode: string;
};

type OrderDoc = {
  orderId: string;
  userUid: string;
  username: string;
  email: string;
  items: OrderItem[];
  totalPrice: number;
  shipping: string; // JNE / SiCepat / Grab Instant
  city: string;
  shippingAddress: ShippingAddress;
  createdAt: Date | Timestamp;
  paidAt?: Date | Timestamp;
  errorAt?: Date | Timestamp;
  cancelledAt?: Date | Timestamp;
  shippedAt?: Date | Timestamp; // OPTIONAL
  deliveredAt?: Date | Timestamp; // OPTIONAL
  expiredAt?: Date | Timestamp; // OPTIONAL
  fulfillmentStatus?: "processing" | "shipped" | "delivered"; // OPTIONAL
  status: "created" | "pending" | "success" | "settlement" | "error" | "cancelled" | "expire" | "expired";
  midtrans?: any; // raw payload midtrans
  snapToken?: string;
  midtransOrderId?: string;
  midtransOrderIds?: string[];
};

// Snap types
type SnapCallbacks = {
  onSuccess?: (result: any) => void;
  onPending?: (result: any) => void;
  onError?: (result: any) => void;
  onClose?: () => void;
};
type SnapAPI = { pay: (token: string, callbacks?: SnapCallbacks) => void };
type SnapWindow = Window & { snap?: SnapAPI };

/* ============================
 * Utils
 * ============================ */
const formatRp = (n: number) => `Rp${(n || 0).toLocaleString("id-ID")}`;
const toDate = (ts?: Date | Timestamp | null) => (ts instanceof Timestamp ? ts.toDate() : ts || null);
const formatDateTime = (ts?: Date | Timestamp) => {
  const d = toDate(ts);
  if (!d) return "-";
  return d.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
};

const statusBadge = (status: OrderDoc["status"]) => {
  const map: Record<OrderDoc["status"], string> = {
    created: "bg-gray-200 text-gray-800",
    pending: "bg-yellow-200 text-yellow-900",
    success: "bg-green-200 text-green-900",
    settlement: "bg-green-200 text-green-900",
    error: "bg-red-200 text-red-900",
    cancelled: "bg-red-300 text-red-900",
    expire: "bg-red-300 text-red-900",
    expired: "bg-red-300 text-red-900",
  };
  return map[status] || "bg-gray-200 text-gray-800";
};

/* ============================
 * Filter helpers
 * ============================ */
type FilterKey = "all" | "belum_bayar" | "diproses" | "dalam_pengiriman" | "dibatalkan";

const isBelumBayar = (o: OrderDoc) => o.status === "created" || o.status === "pending";
const isDalamPengiriman = (o: OrderDoc) => !!toDate(o.shippedAt) || o.fulfillmentStatus === "shipped";
const isDiproses = (o: OrderDoc) => (o.status === "success" || o.status === "settlement") && !isDalamPengiriman(o) && !isDibatalkan(o);

const isExpired = (o: OrderDoc) => {
  const s = (o.status || "").toLowerCase();
  return s === "expire" || s === "expired";
};

const isDibatalkan = (o: OrderDoc) => o.status === "cancelled" || isExpired(o);

/* ============================
 * Page
 * ============================ */
const ListPesananPage: React.FC = () => {
  const router = useRouter();
  const userUid = useUserSession(null);

  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter state
  const [filter, setFilter] = useState<FilterKey>("all");

  // Modal state
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDoc | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Continue payment state
  const [continueBusy, setContinueBusy] = useState(false);
  const [continueError, setContinueError] = useState<string | null>(null);

  // Confirm cancel modal
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Simpan unsub handlers untuk setiap orderId
  const orderUnsubsRef = useRef<Record<string, () => void>>({});

  /* Load Snap JS (untuk lanjut bayar / QRIS) */
  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY;
    if (typeof window === "undefined" || !key) return;
    const w = window as SnapWindow;
    if (w.snap) return;
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", key);
    script.async = true;
    document.body.appendChild(script);
  }, []);

  /* Cleanup semua listener saat unmount */
  useEffect(() => {
    return () => {
      Object.values(orderUnsubsRef.current).forEach((u) => u && u());
      orderUnsubsRef.current = {};
    };
  }, []);

  /* Dengar users/{uid} → ambil orderIds → pasang listener orders/{orderId} */
  useEffect(() => {
    if (!userUid) {
      Object.values(orderUnsubsRef.current).forEach((u) => u && u());
      orderUnsubsRef.current = {};
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubUser = onSnapshot(
      doc(db, "users", userUid),
      (userSnap) => {
        const data = userSnap.data() as any;
        const orderIds: string[] = Array.isArray(data?.orderIds) ? data.orderIds : [];

        // Matikan listener untuk order yang tidak lagi ada
        const currentIds = new Set(orderIds);
        Object.entries(orderUnsubsRef.current).forEach(([id, unsub]) => {
          if (!currentIds.has(id)) {
            unsub();
            delete orderUnsubsRef.current[id];
            setOrders((prev) => prev.filter((o) => o.orderId !== id));
          }
        });

        if (orderIds.length === 0) {
          setOrders([]);
          setLoading(false);
          return;
        }

        // Pasang listener baru untuk orderId yang belum dipasang
        orderIds.forEach((id) => {
          if (orderUnsubsRef.current[id]) return;

          const unsubOrder = onSnapshot(doc(db, "orders", id), (orderSnap) => {
            if (!orderSnap.exists()) {
              setOrders((prev) => prev.filter((o) => o.orderId !== id));
              return;
            }

            const o = orderSnap.data() as any;
            const normalized: OrderDoc = {
              ...o,
              orderId: id,
              createdAt: o.createdAt,
              paidAt: o.paidAt,
              errorAt: o.errorAt,
              cancelledAt: o.cancelledAt,
              shippedAt: o.shippedAt,
              deliveredAt: o.deliveredAt,
              expiredAt: o.expiredAt,
              fulfillmentStatus: o.fulfillmentStatus,
              snapToken: o.snapToken,
              midtransOrderId: o.midtransOrderId,
              midtransOrderIds: Array.isArray(o.midtransOrderIds) ? o.midtransOrderIds : o.midtransOrderId ? [o.midtransOrderId] : [],
              status: o.status,
              midtrans: o.midtrans,
            };

            setOrders((prev) => {
              const others = prev.filter((x) => x.orderId !== id);
              const next = [...others, normalized].sort((a, b) => {
                const da = toDate(a.createdAt) || new Date(0);
                const dbb = toDate(b.createdAt) || new Date(0);
                return dbb.getTime() - da.getTime();
              });
              return next;
            });
          });

          orderUnsubsRef.current[id] = unsubOrder;
        });

        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => {
      unsubUser();
    };
  }, [userUid]);

  /* Helpers */
  const totalQty = (o: OrderDoc) => o.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);

  const onClickOrder = (o: OrderDoc) => {
    setSelectedOrder(o);
    setOpenDetail(true);
    setCancelError(null);
    setContinueError(null);
  };

  const canCancel = useMemo(() => {
    if (!selectedOrder) return false;
    return selectedOrder.status === "created" || selectedOrder.status === "pending";
  }, [selectedOrder]);

  /**
   * Batalkan pesanan:
   * - Panggil API server untuk update status di Midtrans (expire/cancel),
   * - LALU paksa status lokal menjadi "cancelled" + freeze.
   * - UI tidak menampilkan status Midtrans/expired.
   */
  const doCancel = async () => {
    if (!selectedOrder || !(selectedOrder.status === "created" || selectedOrder.status === "pending")) return;
    try {
      setCancelBusy(true);
      setCancelError(null);

      // Panggil Midtrans cancel/expire untuk semua order_id terkait (re-tries)
      const ids: string[] = (selectedOrder as any).midtransOrderIds ?? (selectedOrder.midtransOrderId ? [selectedOrder.midtransOrderId] : []);

      let lastTxStatus: string | undefined;

      for (const midId of ids) {
        try {
          const resp = await fetch("/api/midtrans/cancel", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ midtransOrderId: midId }),
          });
          const json = await resp.json();
          if (resp.ok) {
            lastTxStatus = String(json?.after?.transaction_status || json?.before?.transaction_status || "").toLowerCase();
          } else {
            console.warn("Midtrans cancel API failed:", json?.error);
          }
        } catch (err) {
          console.warn("Midtrans cancel API error:", err);
        }
      }

      // Paksa status lokal => cancelled (freeze agar webhook tidak menimpa)
      const updates: any = {
        status: "cancelled",
        cancelledAt: new Date(),
        expiredAt: deleteField(),
        statusFrozen: {
          reason: "user_cancel",
          at: new Date(),
        },
        cancellation: {
          by: "user",
          at: new Date(),
          gateway_status: lastTxStatus || "expire",
        },
        midtrans: {
          ...(selectedOrder.midtrans || {}),
          transaction_status: lastTxStatus || "expire",
        },
      };

      await updateDoc(doc(db, "orders", selectedOrder.orderId), updates);

      setShowCancelConfirm(false);
      setOpenDetail(false);
    } catch (e: any) {
      setCancelError(e?.message || "Gagal membatalkan pesanan.");
    } finally {
      setCancelBusy(false);
    }
  };

  const handleBuyAgain = async () => {
    if (!userUid || !selectedOrder) return;
    try {
      const userRef = doc(db, "users", userUid);
      const snap = await getDoc(userRef);
      const data = snap.data() as any;
      const currentCart: { productId: string; quantity: number }[] = Array.isArray(data?.cart) ? data.cart : [];

      // Merge quantities
      const map = new Map<string, number>();
      for (const it of currentCart) {
        const pid = String(it.productId);
        map.set(pid, (map.get(pid) || 0) + Math.max(0, Number(it.quantity) || 0));
      }
      for (const it of selectedOrder.items) {
        const pid = String(it.productId);
        map.set(pid, (map.get(pid) || 0) + Math.max(1, Number(it.quantity) || 1));
      }

      const nextCart = Array.from(map.entries()).map(([productId, quantity]) => ({
        productId,
        quantity,
      }));

      await updateDoc(userRef, { cart: nextCart });
      setOpenDetail(false);
      router.push("/profile/cart");
    } catch (e) {
      console.error("Gagal beli lagi:", e);
      router.push("/profile/cart");
    }
  };

  /* Snap callbacks builder untuk lanjut bayar */
  const buildSnapCallbacks = (orderId: string, uid: string): SnapCallbacks => ({
    onSuccess: async (result) => {
      try {
        await updateDoc(doc(db, "orders", orderId), {
          status: "success",
          paidAt: new Date(),
          midtrans: result,
        });
        await updateDoc(doc(db, "users", uid), {
          [`ordersStatus.${orderId}`]: "success",
        });
      } catch {}
      setOpenDetail(false);
    },
    onPending: async (result) => {
      try {
        await updateDoc(doc(db, "orders", orderId), {
          status: "pending",
          midtrans: result,
          midtransOrderIds: arrayUnion(result?.order_id || orderId),
        });
        await updateDoc(doc(db, "users", uid), {
          [`ordersStatus.${orderId}`]: "pending",
        });
      } catch {}
    },
    onError: async (result) => {
      const txStatus = (result?.transaction_status || "").toLowerCase();
      const isExpired = txStatus === "expire" || txStatus === "expired";

      try {
        const updates: any = {
          status: isExpired ? "expire" : "error",
          midtrans: result,
        };

        if (isExpired) {
          updates.expiredAt = new Date();
          updates.errorAt = deleteField();
        } else {
          updates.errorAt = new Date();
          updates.expiredAt = deleteField();
        }

        await updateDoc(doc(db, "orders", orderId), updates);
        await updateDoc(doc(db, "users", uid), {
          [`ordersStatus.${orderId}`]: isExpired ? "expire" : "error",
        });
      } catch {}

      setContinueError(isExpired ? "Transaksi kedaluwarsa." : "Terjadi kesalahan pembayaran.");
    },

    onClose: () => {},
  });

  // Helper: deteksi pembayaran QRIS (untuk tombol "Tampilkan QR")
  const isQrisPayment = (o: OrderDoc | null) => {
    if (!o) return false;
    return (o.midtrans?.payment_type || "").toLowerCase() === "qris";
  };

  /* Lanjutkan / Tampilkan QR */
  const handleContinuePayment = async () => {
    if (!selectedOrder || !userUid) return;
    try {
      setContinueBusy(true);
      setContinueError(null);

      const w = window as SnapWindow;

      // Jika sudah punya snapToken, langsung pakai
      if (selectedOrder.snapToken && w.snap) {
        w.snap.pay(selectedOrder.snapToken, buildSnapCallbacks(selectedOrder.orderId, userUid));
        setContinueBusy(false);
        return;
      }

      // Buat midtransOrderId unik (hindari "order_id has already been taken")
      const freshMidtransOrderId = (selectedOrder.midtransOrderId || selectedOrder.orderId) + "-r" + Date.now();

      const resp = await fetch("/api/midtrans/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder.orderId, // id dokumen lokal
          totalPrice: selectedOrder.totalPrice,
          midtransOrderId: freshMidtransOrderId, // id unik Midtrans
        }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.token) {
        setContinueError(data?.error || "Gagal membuat transaksi.");
        setContinueBusy(false);
        return;
      }

      // simpan token & midtransOrderId baru ke dokumen order (+riwayat)
      await updateDoc(doc(db, "orders", selectedOrder.orderId), {
        snapToken: data.token,
        midtransOrderId: freshMidtransOrderId,
        midtransOrderIds: arrayUnion(freshMidtransOrderId),
      });

      if (!w.snap) {
        setContinueError("Snap JS belum dimuat.");
        setContinueBusy(false);
        return;
      }

      w.snap.pay(data.token, buildSnapCallbacks(selectedOrder.orderId, userUid));
      setContinueBusy(false);
    } catch (e) {
      console.error("Continue payment error:", e);
      setContinueError("Terjadi kesalahan. Silakan coba lagi.");
      setContinueBusy(false);
    }
  };

  /* ============ Filtering ============ */
  const counts = useMemo(() => {
    let belum = 0,
      diproses = 0,
      kirim = 0,
      batal = 0;
    for (const o of orders) {
      if (isBelumBayar(o)) belum++;
      else if (isDibatalkan(o)) batal++;
      else if (isDalamPengiriman(o)) kirim++;
      else if (isDiproses(o)) diproses++;
    }
    return { belum, diproses, kirim, batal, semua: orders.length };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    switch (filter) {
      case "belum_bayar":
        return orders.filter(isBelumBayar);
      case "diproses":
        return orders.filter(isDiproses);
      case "dalam_pengiriman":
        return orders.filter(isDalamPengiriman);
      case "dibatalkan":
        return orders.filter(isDibatalkan);
      default:
        return orders;
    }
  }, [orders, filter]);

  /* ============ Render ============ */
  // LOGIN GUARD
  if (!userUid) {
    return (
      <main className="min-h-screen px-3 sm:px-4 py-10 text-white">
        <HeaderComponent />
        <div className="max-w-3xl mx-auto text-center mt-6">
          <h1 className="text-3xl font-bold mb-4">Orders</h1>
          <p className="text-gray-400">Silakan login untuk melihat pesanan kamu.</p>
          <Link href="/" className="inline-block mt-6 bg-red-600 hover:bg-red-700 transition-colors px-5 py-2 rounded-xl font-semibold">
            Kembali ke Beranda
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-3 sm:px-4 py-8 sm:py-10 text-white">
      <HeaderComponent />
      <div className="max-w-7xl mx-auto">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold">Orders</h1>
          <p className="text-gray-400 mt-2">Lihat status pesanan kamu</p>
        </header>

        {/* FILTER BAR */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${filter === "all" ? "bg-white text-black border-white" : "bg-white/5 text-white border-white/10 hover:bg-white/10"}`}
          >
            Semua ({counts.semua})
          </button>
          <button
            onClick={() => setFilter("belum_bayar")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              filter === "belum_bayar" ? "bg-yellow-300 text-yellow-900 border-yellow-300" : "bg-white/5 text-white border-white/10 hover:bg-white/10"
            }`}
          >
            Belum Bayar ({counts.belum})
          </button>
          <button
            onClick={() => setFilter("diproses")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              filter === "diproses" ? "bg-blue-300 text-blue-900 border-blue-300" : "bg-white/5 text-white border-white/10 hover:bg-white/10"
            }`}
          >
            Diproses ({counts.diproses})
          </button>
          <button
            onClick={() => setFilter("dalam_pengiriman")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              filter === "dalam_pengiriman" ? "bg-green-300 text-green-900 border-green-300" : "bg-white/5 text-white border-white/10 hover:bg-white/10"
            }`}
          >
            Dalam Pengiriman ({counts.kirim})
          </button>
          <button
            onClick={() => setFilter("dibatalkan")}
            className={`px-3 py-1.5 rounded-full text-sm border transition ${
              filter === "dibatalkan" ? "bg-red-300 text-red-900 border-red-300" : "bg-white/5 text-white border-white/10 hover:bg-white/10"
            }`}
          >
            Dibatalkan ({counts.batal})
          </button>
        </div>

        {/* LIST */}
        {loading ? (
          <ul className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="rounded-2xl border border-gray-800/50 bg-gray-900/40 p-4 animate-pulse h-28" />
            ))}
          </ul>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Tidak ada pesanan pada filter ini</h3>
            <p className="text-gray-500">Coba pilih filter lain atau mulai belanja.</p>
            <Link href="/products" className="inline-block mt-6 bg-red-600 hover:bg-red-700 transition-colors px-5 py-2 rounded-xl font-semibold">
              Lihat Produk
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {filteredOrders.map((o) => {
              const first = o.items?.[0];
              return (
                <li key={o.orderId}>
                  <button
                    onClick={() => onClickOrder(o)}
                    className="w-full text-left group flex items-center gap-4 rounded-2xl border border-gray-800/50 bg-gray-900/40 hover:border-gray-700/60 transition p-4"
                  >
                    {/* Thumbnail */}
                    <div className="flex-shrink-0">
                      {first?.productId ? (
                        <Image src={first.image || "/placeholder.png"} alt={first.productTitle || first.productId} width={80} height={80} className="rounded-xl object-cover aspect-square w-20 h-20" />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10" />
                      )}
                    </div>

                    {/* Detail ringkas */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-white font-semibold text-lg truncate">
                          {first?.productTitle || "Pesanan"}
                          {o.items?.length > 1 ? ` +${o.items.length - 1} lainnya` : ""}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(o.status)}`}>{o.status.toUpperCase()}</span>
                      </div>

                      <div className="text-sm text-gray-400 mt-1 line-clamp-1">
                        <span className="text-gray-300">{totalQty(o)} item</span> • {formatRp(o.totalPrice)}
                      </div>

                      <div className="text-xs text-gray-500 mt-1">
                        ID: <span className="text-gray-300">{o.orderId}</span> • {formatDateTime(o.createdAt)}
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg width="20" height="20" viewBox="0 0 24 24" className="text-gray-400 group-hover:text-gray-200 transition">
                      <path d="M9 18l6-6-6-6" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modal Detail Pesanan */}
      {openDetail && selectedOrder && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden text-black animate-[fadeIn_.15s_ease-out]">
            {/* Header */}
            <div className="bg-gradient-to-r from-black to-gray-800 p-4 sm:p-5 text-white flex items-start justify-between">
              <div>
                <h3 className="text-lg sm:text-xl font-bold">Detail Pesanan</h3>
                <p className="text-xs text-gray-300 mt-1">
                  ID: <span className="text-gray-100">{selectedOrder.orderId}</span>
                </p>
              </div>
              <button onClick={() => setOpenDetail(false)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition" aria-label="Tutup">
                <span className="text-xl">×</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Status + waktu ringkas */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(selectedOrder.status)}`}>{selectedOrder.status.toUpperCase()}</span>
                <span className="text-xs text-gray-500">Dibuat: {formatDateTime(selectedOrder.createdAt)}</span>
                {selectedOrder.paidAt && <span className="text-xs text-gray-500">Dibayar: {formatDateTime(selectedOrder.paidAt)}</span>}
                {selectedOrder.cancelledAt && <span className="text-xs text-gray-500">Dibatalkan: {formatDateTime(selectedOrder.cancelledAt)}</span>}
                {selectedOrder.shippedAt && <span className="text-xs text-gray-500">Dikirim: {formatDateTime(selectedOrder.shippedAt)}</span>}
              </div>

              {/* Items */}
              <div className="space-y-3">
                {selectedOrder.items.map((it, idx) => (
                  <div key={idx} className="flex items-center gap-3 border border-gray-200 rounded-xl p-3">
                    <Image src={it.image || "/placeholder.png"} alt={it.productTitle} width={64} height={64} className="rounded-lg object-cover aspect-square w-16 h-16" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{it.productTitle}</h4>
                      <div className="text-xs text-gray-500 mt-0.5">x{it.quantity}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-700">{formatRp(it.pricePerItem)}</div>
                      <div className="text-sm font-semibold text-gray-900">{formatRp(it.pricePerItem * it.quantity)}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Alamat */}
              <div className="border border-gray-200 rounded-2xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Alamat Penerima</h4>
                <div className="text-sm text-gray-700 space-y-1">
                  <div className="font-medium">
                    {selectedOrder.shippingAddress?.name} — {selectedOrder.shippingAddress?.phone}
                  </div>
                  <div>{selectedOrder.shippingAddress?.addressLine}</div>
                  <div>
                    {selectedOrder.shippingAddress?.kelurahan}, {selectedOrder.shippingAddress?.kecamatan}, {selectedOrder.shippingAddress?.city} {selectedOrder.shippingAddress?.postalCode}
                  </div>
                </div>
              </div>

              {/* Ringkasan */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                <h4 className="font-semibold text-gray-800 mb-2">Ringkasan</h4>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Jasa Pengiriman</span>
                  <span className="font-medium">{selectedOrder.shipping}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total</span>
                  <span className="font-bold text-gray-900">{formatRp(selectedOrder.totalPrice)}</span>
                </div>
              </div>

              {/* Status Pesanan (detail) */}
              <div className="border border-gray-200 rounded-2xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Status Pesanan</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusBadge(selectedOrder.status)}`}>{selectedOrder.status.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Dibuat</span>
                    <span className="font-medium">{formatDateTime(selectedOrder.createdAt)}</span>
                  </div>

                  {/* Disembunyikan: Status Midtrans + Kedaluwarsa */}

                  {selectedOrder.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dibayar</span>
                      <span className="font-medium">{formatDateTime(selectedOrder.paidAt)}</span>
                    </div>
                  )}
                  {selectedOrder.shippedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dikirim</span>
                      <span className="font-medium">{formatDateTime(selectedOrder.shippedAt)}</span>
                    </div>
                  )}
                  {selectedOrder.deliveredAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Diterima</span>
                      <span className="font-medium">{formatDateTime(selectedOrder.deliveredAt)}</span>
                    </div>
                  )}
                  {selectedOrder.cancelledAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Dibatalkan</span>
                      <span className="font-medium">{formatDateTime(selectedOrder.cancelledAt)}</span>
                    </div>
                  )}
                  {selectedOrder.errorAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Error</span>
                      <span className="font-medium">{formatDateTime(selectedOrder.errorAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* CREATED: ajak pilih metode */}
              {selectedOrder.status === "created" && (
                <div className="rounded-2xl p-4 border-2 border-yellow-300 bg-yellow-50">
                  <div className="font-semibold text-yellow-900 mb-1">Belum Memilih Metode Pembayaran</div>
                  <p className="text-sm text-yellow-900">
                    Tekan <b>Lanjutkan Pembayaran</b> untuk memilih metode (VA/QRIS/e-wallet) di popup Midtrans.
                  </p>
                  <button
                    onClick={handleContinuePayment}
                    disabled={continueBusy}
                    className={`mt-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${continueBusy ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}
                  >
                    {continueBusy ? "Memproses..." : "Lanjutkan Pembayaran"}
                  </button>
                </div>
              )}

              {/* PENDING: tampilkan VA jika ada, dan tombol QR HANYA bila payment_type=QRIS */}
              {selectedOrder.status === "pending" && (
                <div className="rounded-2xl p-4 border-2 border-yellow-300 bg-yellow-50">
                  <div className="font-semibold text-yellow-900 mb-1">Menunggu Pembayaran</div>

                  {/* Info VA bila metode VA */}
                  {(selectedOrder.midtrans?.va_numbers?.[0]?.va_number || selectedOrder.midtrans?.permata_va_number) && (
                    <>
                      <p className="text-sm text-yellow-900">Silakan lakukan pembayaran ke VA berikut:</p>
                      <div className="mt-2 p-3 rounded-xl bg-white border border-yellow-200 font-mono text-lg text-yellow-900 select-all">
                        {selectedOrder.midtrans?.va_numbers?.[0]?.va_number || selectedOrder.midtrans?.permata_va_number}
                      </div>
                      {(selectedOrder.midtrans?.va_numbers?.[0]?.bank || selectedOrder.midtrans?.bank) && (
                        <div className="text-xs text-yellow-800 mt-1">
                          Bank: <b>{selectedOrder.midtrans?.va_numbers?.[0]?.bank?.toUpperCase() || selectedOrder.midtrans?.bank?.toUpperCase()}</b>
                        </div>
                      )}
                    </>
                  )}

                  {/* Hanya tampilkan tombol QR kalau payment_type = qris */}
                  {isQrisPayment(selectedOrder) && (
                    <>
                      <div className="text-xs text-yellow-800 mt-3">
                        Tekan tombol di bawah untuk menampilkan ulang <b>QRIS</b> pada popup Midtrans.
                      </div>
                      <button
                        onClick={handleContinuePayment}
                        disabled={continueBusy}
                        className={`mt-3 px-3 py-2 rounded-lg text-sm font-semibold text-white ${continueBusy ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}
                      >
                        {continueBusy ? "Memproses..." : "Tampilkan QR"}
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Error */}
              {cancelError && <div className="rounded-xl p-3 bg-red-50 text-red-700 text-sm border border-red-200">{cancelError}</div>}
              {continueError && <div className="rounded-xl p-3 bg-yellow-50 text-yellow-800 text-sm border border-yellow-200">{continueError}</div>}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t bg-white">
              <div className="flex gap-3 justify-end">
                <button onClick={() => setOpenDetail(false)} className="px-4 py-2 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                  Tutup
                </button>

                {/* Footer: lanjut/QR hanya untuk created atau pending-QRIS */}
                {(selectedOrder.status === "created" || (selectedOrder.status === "pending" && isQrisPayment(selectedOrder))) && (
                  <button
                    onClick={handleContinuePayment}
                    disabled={continueBusy}
                    className={`px-4 py-2 rounded-xl font-semibold text-white ${continueBusy ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}
                  >
                    {continueBusy ? "Memproses..." : selectedOrder.status === "created" ? "Lanjutkan Pembayaran" : "Tampilkan QR"}
                  </button>
                )}

                {/* Dibatalkan/Expired => Beli Lagi, selain itu => Batalkan */}
                {isDibatalkan(selectedOrder) ? (
                  <button onClick={handleBuyAgain} className="px-4 py-2 rounded-xl font-semibold text-white bg-black hover:bg-gray-800">
                    Beli Lagi
                  </button>
                ) : (
                  <button
                    disabled={!canCancel || cancelBusy}
                    onClick={() => setShowCancelConfirm(true)}
                    className={`px-4 py-2 rounded-xl font-semibold text-white ${!canCancel || cancelBusy ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                  >
                    Batalkan Pesanan
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Popup konfirmasi batal */}
          {showCancelConfirm && (
            <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/70 p-4">
              <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-black">
                <h4 className="text-lg font-bold mb-2">Batalkan Pesanan?</h4>
                <p className="text-sm text-gray-700">Apakah anda yakin ingin membatalkan pesanan ini?</p>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button onClick={() => setShowCancelConfirm(false)} className="w-full py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                    Batal
                  </button>
                  <button
                    onClick={doCancel}
                    disabled={cancelBusy}
                    className={`w-full py-2.5 rounded-xl font-semibold text-white ${cancelBusy ? "bg-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700"}`}
                  >
                    {cancelBusy ? "Memproses..." : "Ya, Batalkan"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <style jsx>{`
            @keyframes fadeIn {
              from {
                opacity: 0;
                transform: translateY(6px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-fadeIn {
              animation: fadeIn 0.15s ease-out;
            }
          `}</style>
        </div>
      )}
    </main>
  );
};

export default ListPesananPage;
