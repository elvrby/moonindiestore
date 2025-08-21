// app/cart/page.tsx
"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

import { useUserSession } from "@/hooks/use-user-session";
import { getAuth } from "firebase/auth";
import { db } from "@/libs/firebase/config";
import { doc, getDoc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

import { removeManyFromCart } from "@/libs/firebase/auth";
import { products, type Product } from "@/app/data/products";
import HeaderComponent from "@/app/components/layout/header";

// Komponen & tipe alamat
import AddressMenu from "../../components/addons/addressmenu";
import type { ShippingAddress } from "../../data/locations";

/* ============================
 * Types & Utils
 * ============================ */
type CartItem = { productId: string; quantity: number };

// Snap type
type SnapCallbacks = {
  onSuccess?: (result: unknown) => void;
  onPending?: (result: unknown) => void;
  onError?: (result: unknown) => void;
  onClose?: () => void;
};
type SnapAPI = { pay: (token: string, callbacks?: SnapCallbacks) => void };
type SnapWindow = Window & { snap?: SnapAPI };

const parsePrice = (price: string): number => {
  const parts = price.split("-");
  const value = parts[parts.length - 1].trim().replace(/[^\d]/g, "");
  return parseInt(value, 10);
};

/** Tarif jasa pengiriman dalam Rp per KG */
const shippingServices = [
  { name: "JNE", cost: 20000, icon: "🚚" },
  { name: "SiCepat", cost: 2500, icon: "⚡" },
  { name: "Grab Instant", cost: 26000, icon: "🏍️" }, // hanya Jabodetabek
];

/* ============================
 * UI: Confirm Delete Modal (responsive)
 * ============================ */
function ConfirmModal({ open, title, onConfirm, onCancel }: { open: boolean; title?: string; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full h-64 m-5 sm:h-auto sm:max-w-sm rounded-2xl bg-zinc-900 border border-white/10 p-6 sm:p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white text-center sm:text-left">Hapus dari cart?</h3>
          <p className="text-sm text-gray-300 mt-2 text-center sm:text-left">
            Apakah anda yakin ingin menghapus <span className="font-medium text-white">{title ?? "produk ini"}</span> dari cart anda?
          </p>
        </div>
        <div className="mt-6 grid grid-cols-1 sm:flex sm:justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2 rounded-xl border border-white/20 text-gray-200 hover:bg-white/10 transition">
            Batal
          </button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition">
            Iya, Hapus
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============================
 * UI: Checkout Modal (mobile-first)
 * ============================ */
function CheckoutModal({
  open,
  items,
  productById,
  onClose,
  onConfirmPay,
  shippingAddress,
  onEditAddress,
}: {
  open: boolean;
  items: CartItem[];
  productById: Map<string, Product>;
  onClose: () => void;
  onConfirmPay: (payload: { city: string; shipping: string; quantities: Record<string, number>; totalPrice: number; selectedIds: string[] }) => void;
  shippingAddress: ShippingAddress | null;
  onEditAddress: () => void;
}) {
  const [selectedShipping, setSelectedShipping] = useState<string>("JNE");
  const [qtyMap, setQtyMap] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  const cityFromAddress = shippingAddress?.city ?? "";

  useEffect(() => {
    if (!open) return;
    const init: Record<string, number> = {};
    for (const it of items) init[it.productId] = it.quantity;
    setQtyMap(init);
    setSelectedShipping("JNE");
    setIsLoading(false);
  }, [open, items]);

  // Bila bukan Jabodetabek, matikan Grab Instant
  useEffect(() => {
    const isJabodetabek = /Jakarta/i.test(cityFromAddress) || ["Bogor", "Depok", "Tangerang", "Bekasi"].some((k) => cityFromAddress.toLowerCase().includes(k.toLowerCase()));
    if (!isJabodetabek && selectedShipping === "Grab Instant") {
      setSelectedShipping("JNE");
    }
  }, [cityFromAddress, selectedShipping]);

  const increase = (pid: string) => setQtyMap((prev) => ({ ...prev, [pid]: Math.max(1, (prev[pid] || 1) + 1) }));
  const decrease = (pid: string) => setQtyMap((prev) => ({ ...prev, [pid]: Math.max(1, (prev[pid] || 1) - 1) }));
  const changeQty = (pid: string, val: number) => setQtyMap((prev) => ({ ...prev, [pid]: Number.isFinite(val) && val > 0 ? Math.floor(val) : prev[pid] || 1 }));

  /** Subtotal harga produk */
  const productsCost = useMemo(() => {
    return items.reduce((sum, it) => {
      const p = productById.get(it.productId);
      const qty = qtyMap[it.productId] ?? it.quantity;
      const unit = p ? parsePrice(p.price) : 0;
      return sum + unit * qty;
    }, 0);
  }, [items, qtyMap, productById]);

  /** Tarif per kg dari jasa yang dipilih */
  const shippingUnitCost = useMemo(() => {
    const svc = shippingServices.find((s) => s.name === selectedShipping);
    return svc ? svc.cost : 0;
  }, [selectedShipping]);

  /** Berat total (gram) */
  const totalWeightGram = useMemo(() => {
    return items.reduce((acc, it) => {
      const p = productById.get(it.productId);
      const qty = qtyMap[it.productId] ?? it.quantity;
      const berat = (p as any)?.beratGram ?? 0;
      return acc + berat * qty;
    }, 0);
  }, [items, qtyMap, productById]);

  const totalWeightKg = useMemo(() => totalWeightGram / 1000, [totalWeightGram]);

  /** Penagihan berat */
  const billedWeightKg = useMemo(() => {
    const kg = totalWeightKg;
    if (kg <= 0) return 0;
    return kg < 2 ? 1 : Math.ceil(kg);
  }, [totalWeightKg]);

  const shippingCost = useMemo(() => shippingUnitCost * billedWeightKg, [shippingUnitCost, billedWeightKg]);

  /** Admin 2% */
  const adminFee = useMemo(() => Math.round((productsCost + shippingCost) * 0.02), [productsCost, shippingCost]);

  /** Grand total */
  const grandTotal = useMemo(() => productsCost + shippingCost + adminFee, [productsCost, shippingCost, adminFee]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      {/* Fullscreen di mobile, card di desktop */}
      <div className="bg-white w-full h-[100dvh] sm:h-auto sm:max-h-[95vh] sm:max-w-lg sm:rounded-2xl shadow-2xl overflow-hidden animate-slideUp flex flex-col">
        {/* Header sticky */}
        <div className="bg-gradient-to-r from-black to-gray-800 p-4 sm:p-5 text-white relative sticky top-0 z-10">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">Checkout</h2>
              <p className="text-gray-300 text-xs sm:text-sm mt-1">Alamat & ringkasan pesanan</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition" aria-label="Tutup">
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Body scrollable */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 text-black">
          {/* Alamat Penerima */}
          <div className="border border-gray-200 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Alamat Penerima</h3>
              <button onClick={onEditAddress} className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                {shippingAddress ? "Edit" : "Tambah"}
              </button>
            </div>
            {shippingAddress ? (
              <div className="text-sm text-gray-700 space-y-1">
                <div className="font-medium">
                  {shippingAddress.name} — {shippingAddress.phone}
                </div>
                <div>{shippingAddress.addressLine}</div>
                <div>
                  {shippingAddress.kelurahan}, {shippingAddress.kecamatan}, {shippingAddress.city} {shippingAddress.postalCode}
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Belum ada alamat. Klik <b>Tambah</b> untuk mengisi data penerima.
              </div>
            )}
          </div>

          {/* Items */}
          <div className="space-y-3">
            {items.map((it) => {
              const p = productById.get(it.productId);
              if (!p) return null;
              const unit = parsePrice(p.price);
              const qty = qtyMap[it.productId] ?? it.quantity;
              const line = unit * qty;
              return (
                <div key={it.productId} className="flex flex-col sm:flex-row sm:items-center gap-3 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-3">
                    <Image src={p.image} alt={p.title} width={72} height={72} className="rounded-lg object-cover aspect-square w-[72px] h-[72px] sm:w-[64px] sm:h-[64px]" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{p.title}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{p.category}</p>
                      <div className="mt-1 text-sm text-gray-700">Rp{unit.toLocaleString("id-ID")} / item</div>
                      {typeof (p as any).beratGram === "number" && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Berat: {(((p as any).beratGram ?? 0) / 1000).toFixed(2)} kg × {qty}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => decrease(it.productId)} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700">
                        −
                      </button>
                      <input type="number" min={1} value={qty} onChange={(e) => changeQty(it.productId, parseInt(e.target.value, 10))} className="w-16 text-center border rounded-lg py-2 text-black" />
                      <button onClick={() => increase(it.productId)} className="w-9 h-9 rounded-lg bg-black hover:bg-gray-800 text-white">
                        +
                      </button>
                    </div>
                    <div className="text-right font-semibold text-gray-900">Rp{line.toLocaleString("id-ID")}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pengiriman */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Jasa Pengiriman</label>
            <select
              value={selectedShipping}
              onChange={(e) => setSelectedShipping(e.target.value)}
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-3 py-3 text-gray-800 font-medium hover:border-gray-400 focus:border-black outline-none transition text-sm"
            >
              {shippingServices.map((svc) => {
                const isJabodetabek = /Jakarta/i.test(cityFromAddress) || ["Bogor", "Depok", "Tangerang", "Bekasi"].some((k) => cityFromAddress.toLowerCase().includes(k.toLowerCase()));
                const disabled = svc.name === "Grab Instant" && !isJabodetabek;
                return (
                  <option key={svc.name} value={svc.name} disabled={disabled}>
                    {svc.icon} {svc.name} - Rp{svc.cost.toLocaleString("id-ID")}/kg
                  </option>
                );
              })}
            </select>
          </div>

          {/* Ringkasan */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 mb-2">Ringkasan Pesanan</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal Produk</span>
              <span className="font-medium">Rp{productsCost.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Tujuan</span>
              <span>{shippingAddress ? `${shippingAddress.kelurahan}, ${shippingAddress.kecamatan}, ${shippingAddress.city} ${shippingAddress.postalCode}` : "-"}</span>
            </div>

            <div className="flex justify-between text-xs text-gray-500">
              <span>Berat total</span>
              <span>
                {totalWeightKg.toFixed(2)} kg {billedWeightKg > 0 && <>(ditagih {billedWeightKg} kg)</>}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">
                Pengiriman ({selectedShipping}) × {billedWeightKg} kg
              </span>
              <span className="font-medium">Rp{shippingCost.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Biaya Admin (2%)</span>
              <span className="font-medium">Rp{adminFee.toLocaleString("id-ID")}</span>
            </div>

            <div className="border-t border-gray-200 pt-2 flex justify-between items-center">
              <span className="font-bold text-gray-800">Total</span>
              <span className="font-bold text-lg text-black">Rp{grandTotal.toLocaleString("id-ID")}</span>
            </div>
          </div>
        </div>

        {/* Footer sticky */}
        <div className="p-4 sm:p-5 border-t bg-white sticky bottom-0 z-10">
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onClose} className="w-full sm:w-auto py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium text-black">
              Batal
            </button>
            <button
              onClick={() => {
                if (isLoading) return;
                if (!shippingAddress) {
                  alert("Lengkapi alamat penerima terlebih dahulu.");
                  return;
                }
                setIsLoading(true);
                onConfirmPay({
                  city: cityFromAddress || "-",
                  shipping: selectedShipping,
                  quantities: qtyMap,
                  totalPrice: grandTotal,
                  selectedIds: items.map((i) => i.productId),
                });
                setTimeout(() => setIsLoading(false), 400);
              }}
              className={`w-full sm:flex-1 py-3 rounded-xl font-semibold text-white ${isLoading ? "bg-gray-400 cursor-not-allowed" : "bg-black hover:bg-gray-800"}`}
            >
              {isLoading ? "Memproses..." : "Bayar Sekarang"}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}

/* ============================
 * Page: Cart (mobile-first)
 * ============================ */
const CartPage: React.FC = () => {
  const router = useRouter();
  const rawUid = useUserSession(null);
  const userUid: string | null = rawUid ?? null;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmPid, setConfirmPid] = useState<string | null>(null);

  const [showCheckout, setShowCheckout] = useState<boolean>(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const [showPending, setShowPending] = useState(false);
  const [showError, setShowError] = useState<{ open: boolean; message?: string }>({ open: false });
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [openAddressModal, setOpenAddressModal] = useState(false);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const p of products) map.set(String(p.id), p);
    return map;
  }, []);

  const hasAddress = !!(address && address.city && address.kecamatan && address.kelurahan && address.postalCode);

  // load Snap
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

  // realtime cart + alamat
  useEffect(() => {
    if (!userUid) {
      setCart([]);
      setSelected(new Set());
      setAddress(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = doc(db, "users", userUid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        const data = snap.data() as { cart?: CartItem[]; shippingAddress?: ShippingAddress | null } | undefined;
        const items = Array.isArray(data?.cart) ? data!.cart! : [];
        const normalized = items.map((it) => ({
          productId: String(it.productId),
          quantity: Math.max(1, Number(it.quantity) || 1),
        }));
        setCart(normalized);
        setSelected((prev) => new Set([...prev].filter((id) => normalized.some((i) => i.productId === id))));
        setAddress(data?.shippingAddress ?? null);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub();
  }, [userUid]);

  // fetch alamat awal fallback
  useEffect(() => {
    const run = async () => {
      if (!userUid) return;
      try {
        const ref = doc(db, "users", userUid);
        const snap = await getDoc(ref);
        const data = snap.data() as any;
        if (data?.shippingAddress) setAddress(data.shippingAddress as ShippingAddress);
        else setAddress(null);
      } catch {
        // ignore
      }
    };
    run();
  }, [userUid]);

  const toggleSelect = (pid: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pid)) next.delete(pid);
      else next.add(pid);
      return next;
    });

  const allIds = useMemo(() => cart.map((c) => c.productId), [cart]);
  const toggleSelectAll = () => setSelected((prev) => (prev.size === allIds.length ? new Set() : new Set(allIds)));

  const selectedItems = useMemo(() => cart.filter((c) => selected.has(c.productId)), [cart, selected]);

  const openConfirm = (pid: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmPid(pid);
  };
  const handleConfirmRemove = async () => {
    if (!confirmPid || !userUid) return;
    try {
      await removeManyFromCart(userUid, [confirmPid]);
    } catch (err) {
      console.error("Failed to remove from cart", err);
    } finally {
      setConfirmPid(null);
    }
  };

  const handleCheckoutClick = () => {
    if (selectedItems.length === 0) return;
    setShowCheckout(true);
  };

  const handleConfirmPay = async ({
    city,
    shipping,
    quantities,
    totalPrice,
    selectedIds,
  }: {
    city: string;
    shipping: string;
    quantities: Record<string, number>;
    totalPrice: number;
    selectedIds: string[];
  }) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        setShowError({ open: true, message: "Silakan login terlebih dahulu untuk melakukan pembelian." });
        return;
      }

      if (!hasAddress) {
        setShowError({ open: true, message: "Alamat penerima belum diisi. Silakan isi alamat penerima." });
        return;
      }

      const uid = currentUser.uid;
      const username = currentUser.displayName || "Tanpa Nama";
      const email = currentUser.email || "Tanpa Email";

      const newOrderId = `order-${Date.now()}`;
      setOrderId(newOrderId);

      // minta token
      const resp = await fetch("/api/midtrans/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ totalPrice, orderId: newOrderId }),
      });
      const data = await resp.json();
      if (!resp.ok || !data.token) {
        setShowError({ open: true, message: data?.error || "Gagal membuat transaksi." });
        return;
      }

      const itemsPayload = selectedIds.map((pid) => {
        const p = productById.get(pid);
        return {
          productId: pid,
          productTitle: p?.title || "",
          quantity: quantities[pid] ?? 1,
          pricePerItem: p ? parsePrice(p.price) : 0,
        };
      });

      // simpan order awal
      await setDoc(doc(db, "orders", newOrderId), {
        orderId: newOrderId,
        userUid: uid,
        username,
        email,
        items: itemsPayload,
        totalPrice,
        shipping,
        city,
        shippingAddress: { ...address! },
        createdAt: new Date(),
        status: "created",
      });

      const w = window as SnapWindow;
      if (!w.snap) {
        setShowError({ open: true, message: "Snap JS belum dimuat." });
        return;
      }

      setShowCheckout(false);

      w.snap.pay(data.token, {
        onSuccess: async (result) => {
          setPaymentResult(result);
          try {
            await updateDoc(doc(db, "orders", newOrderId), {
              status: "success",
              paidAt: new Date(),
              midtrans: result,
            });
            await removeManyFromCart(uid, selectedIds);
            setSelected(new Set());
          } catch {}
          setShowSuccess(true);
        },
        onPending: async (result) => {
          setPaymentResult(result);
          try {
            await updateDoc(doc(db, "orders", newOrderId), { status: "pending", midtrans: result });
          } catch {}
          setShowPending(true);
        },
        onError: async (result) => {
          try {
            await updateDoc(doc(db, "orders", newOrderId), {
              status: "error",
              errorAt: new Date(),
              midtrans: result,
            });
          } catch {}
          setShowError({ open: true, message: "Terjadi kesalahan pembayaran." });
        },
        onClose: () => {},
      });
    } catch (err) {
      console.error("Error saat memulai pembayaran:", err);
      setShowError({ open: true, message: "Terjadi kesalahan. Silakan coba lagi." });
    }
  };

  // LOGIN GUARD — gaya Favorites
  if (!userUid) {
    return (
      <main className="min-h-screen px-3 sm:px-4 py-10 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Cart</h1>
          <p className="text-gray-400 mb-6">Silakan login terlebih dahulu untuk melihat cart kamu.</p>
          <Link href="/" className="inline-block bg-red-600 hover:bg-red-700 transition-colors px-5 py-2 rounded-xl font-semibold">
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
        <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">Cart</h1>
            <p className="text-gray-400 mt-2">Pilih item yang ingin kamu checkout</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-gray-300 cursor-pointer select-none">
              <input type="checkbox" checked={selected.size > 0 && selected.size === cart.length} onChange={toggleSelectAll} className="h-4 w-4 rounded border-white/30 bg-transparent" />
              Select All
            </label>
            <button
              onClick={handleCheckoutClick}
              disabled={selectedItems.length === 0}
              className={`px-4 py-2 rounded-xl font-semibold transition w-full sm:w-auto ${
                selectedItems.length === 0 ? "bg-gray-700 text-gray-400 cursor-not-allowed" : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              Checkout ({selectedItems.length})
            </button>
          </div>
        </header>

        {/* Alamat Penerima */}
        <section className="mb-6">
          <div className="rounded-2xl border border-gray-800/50 bg-gray-900/40 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Alamat Penerima</h3>
              <button onClick={() => setOpenAddressModal(true)} className="text-sm px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10">
                {hasAddress ? "Edit Alamat" : "Tambah Alamat"}
              </button>
            </div>
            {hasAddress ? (
              <div className="mt-3 text-sm text-gray-300 space-y-1">
                <div className="font-medium">
                  {address!.name} — {address!.phone}
                </div>
                <div>{address!.addressLine}</div>
                <div>
                  {address!.kelurahan}, {address!.kecamatan}, {address!.city} {address!.postalCode}
                </div>
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-400">Belum ada alamat tersimpan. Klik “Tambah Alamat”.</p>
            )}
          </div>
        </section>

        {loading ? (
          <ul className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 rounded-2xl border border-gray-800/50 bg-gray-900/40 p-4">
                <div className="w-5 h-5 bg-gray-800/60 rounded animate-pulse" />
                <div className="w-20 h-20 bg-gray-800/60 rounded-xl animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 w-1/2 bg-gray-800/60 rounded animate-pulse" />
                  <div className="h-4 w-3/4 bg-gray-800/60 rounded animate-pulse" />
                </div>
                <div className="w-10 h-10 bg-gray-800/60 rounded-full animate-pulse" />
              </li>
            ))}
          </ul>
        ) : cart.length === 0 ? (
          <div className="text-center py-16 sm:py-24">
            <h3 className="text-xl font-semibold text-gray-300 mb-2">Belum ada produk di cart</h3>
            <p className="text-gray-500">Yuk telusuri produk dan tambahkan ke cart kamu!</p>
            <Link href="/products" className="inline-block mt-6 bg-red-600 hover:bg-red-700 transition-colors px-5 py-2 rounded-xl font-semibold">
              Lihat Produk
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {cart.map((item) => {
              const p = productById.get(item.productId);
              const title = p?.title ?? `Produk ${item.productId}`;
              const img = p?.image ?? "/placeholder.png";
              const slug = p?.slug ?? "";
              const subtitle = p?.subtitle ?? "";
              const category = p?.category ?? "-";
              const priceHasRange = p?.price ? p.price.includes(" - ") : false;
              const [oldPrice, newPrice] = priceHasRange && p ? p.price.split(" - ") : [null, p?.price ?? "RP. 0"];
              return (
                <li key={item.productId}>
                  <Link
                    href={slug ? `/product/${slug}` : "#"}
                    className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-gray-800/50 bg-gray-900/40 hover:border-gray-700/60 transition p-4"
                  >
                    <div className="flex items-start gap-4 w-full">
                      <input
                        type="checkbox"
                        checked={selected.has(item.productId)}
                        onChange={() => toggleSelect(item.productId)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-5 w-5 mt-1 rounded border-white/30 bg-transparent flex-shrink-0"
                        aria-label="Pilih item"
                      />
                      <Image src={img} alt={`Gambar ${title}`} width={96} height={96} className="rounded-xl object-cover aspect-square flex-shrink-0 w-24 h-24" />
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-semibold text-lg leading-tight truncate group-hover:text-red-400 transition-colors">{title}</h3>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{subtitle}</p>
                        <div className="mt-2 flex items-center gap-3 flex-wrap">
                          <span className="text-xs px-2 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300">{category}</span>
                          <div className="text-sm">
                            {priceHasRange ? (
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500 line-through">RP. {oldPrice?.replace("RP.", "").trim()}</span>
                                <span className="text-red-400 font-semibold">{newPrice}</span>
                              </div>
                            ) : (
                              <span className="text-red-400 font-semibold">{newPrice}</span>
                            )}
                          </div>
                          <span className="text-xs text-gray-400">
                            Qty: <b className="text-gray-200">{item.quantity}</b>
                          </span>
                        </div>
                      </div>
                      <button aria-label="Hapus dari cart" onClick={(e) => openConfirm(item.productId, e)} className="ml-2 p-2 rounded-full hover:bg-white/10 transition self-start" title="Hapus item">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-gray-300">
                          <path strokeWidth="2" d="M3 6h18" />
                          <path strokeWidth="2" d="M8 6v14a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" />
                          <path strokeWidth="2" d="M10 11v6M14 11v6M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Modals */}
      <ConfirmModal open={!!confirmPid} title={confirmPid ? productById.get(confirmPid)?.title : undefined} onConfirm={handleConfirmRemove} onCancel={() => setConfirmPid(null)} />

      <CheckoutModal
        open={showCheckout}
        items={selectedItems}
        productById={productById}
        onClose={() => setShowCheckout(false)}
        onConfirmPay={handleConfirmPay}
        shippingAddress={hasAddress ? address : null}
        onEditAddress={() => setOpenAddressModal(true)}
      />

      {/* Address Menu */}
      <AddressMenu open={openAddressModal} initial={hasAddress ? address : null} userUid={userUid} onClose={() => setOpenAddressModal(false)} onSaved={(addr) => setAddress(addr)} />

      {/* Success / Pending / Error Modals */}
      {showSuccess && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl text-black">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mx-auto mb-4">
              <span className="text-3xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Pembayaran Berhasil</h3>
            {(paymentResult?.order_id || orderId) && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span>ID Pesanan</span>
                  <span className="font-medium">{paymentResult?.order_id || orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-medium capitalize">{paymentResult?.transaction_status || "success"}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowSuccess(false)} className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                Tutup
              </button>
              <button onClick={() => router.push("/orders")} className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold">
                Lihat Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {showPending && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-yellow-100 mx-auto mb-4">
              <span className="text-3xl">⏳</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Menunggu Pembayaran</h3>
            {(paymentResult?.order_id || orderId) && (
              <div className="bg-gray-50 rounded-xl p-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span>ID Pesanan</span>
                  <span className="font-medium">{paymentResult?.order_id || orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status</span>
                  <span className="font-medium capitalize">{paymentResult?.transaction_status || "pending"}</span>
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowPending(false)} className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                Nanti Saja
              </button>
              <button onClick={() => router.push("/orders")} className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold">
                Lihat Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {showError.open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-xl font-bold text-center mb-2">Pembayaran Gagal</h3>
            <p className="text-gray-600 text-center mb-4">{showError.message || "Terjadi kesalahan saat memproses pembayaran."}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowError({ open: false })} className="w-full py-3 rounded-xl border border-gray-300 hover:bg-gray-50 font-medium">
                Tutup
              </button>
              <button onClick={() => setShowCheckout(true)} className="w-full py-3 rounded-xl bg-black text-white hover:bg-gray-800 font-semibold">
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CartPage;
